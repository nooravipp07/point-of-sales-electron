const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

const iconPath = path.join(__dirname, '../assets/icon.png');
const isDev = process.env.NODE_ENV === 'development';

console.log('Printer system initialized for Windows');

// ─── Create Window ─────────────────────────────────────────
function createWindow() {
	const win = new BrowserWindow({
			icon: iconPath,
			width: 1200,
			height: 800,
			show: false,
			webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	win.once('ready-to-show', () => {
		win.maximize();
		win.show();
	});

	if (isDev) {
		win.loadURL('http://localhost:5173');
		win.webContents.openDevTools();
	} else {
		win.loadFile(path.join(__dirname, '../dist/index.html'));
	}
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── Helper ────────────────────────────────────────────────
function formatNum(num) {
  	return Number(num || 0).toLocaleString('en-US');
}

// ─── IPC: Get Available Printers (PowerShell) ──────────────
ipcMain.handle('get-usb-printers', async () => {
	return new Promise((resolve) => {
		try {
			// Use PowerShell to get Windows printers
			const psCommand = `Get-Printer | Select-Object -Property Name, PrinterStatus, PortName, Comment | ConvertTo-Json`;
			
			exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
				try {
					if (error) {
						console.warn('PowerShell error getting printers:', error.message);
						return resolve({ success: true, devices: [] });
					}

					if (!stdout || stdout.trim().length === 0) {
						console.log('No printers found');
						return resolve({ success: true, devices: [] });
					}

					const printers = JSON.parse(stdout);
					const printerList = Array.isArray(printers) ? printers : [printers];

					const formattedPrinters = printerList.map((p, idx) => ({
						id: idx,
						name: p.Name || `Printer ${idx + 1}`,
						displayName: p.Name || `Printer ${idx + 1}`,
						status: p.PrinterStatus === 0 ? 'Ready' : 'Not Ready',
						manufacturer: 'Windows Printer',
						product: p.PortName || 'Unknown',
						vendorId: idx,
						productId: idx,
					}));

					console.log(`Found ${formattedPrinters.length} printer(s)`);
					formattedPrinters.forEach((p, i) => {
						console.log(`  [${i}] ${p.displayName} - ${p.status}`);
					});

					resolve({ success: true, devices: formattedPrinters });
				} catch (parseErr) {
					console.error('Parse error:', parseErr.message);
					resolve({ success: true, devices: [] });
				}
			});
		} catch (err) {
			console.error('get-printers error:', err);
			resolve({ success: false, error: err.message, devices: [] });
		}
	});
});

// ─── IPC: Print Receipt (Using WebContent) ───────────────
// ─── IPC: Print Receipt (Using WebContent with Dialog) ──
ipcMain.handle('print-receipt', async (event, receiptData) => {
	return new Promise((resolve, reject) => {
		try {
			console.log('Print receipt requested');

			// Create a hidden window for printing
			const printWindow = new BrowserWindow({
				show: false,
				width: 400,
				height: 600,
				webPreferences: {
					nodeIntegration: false,
					contextIsolation: true,
				},
			});

			// Generate receipt HTML
			const htmlContent = generateReceiptHTML({
				storeName: receiptData.storeName || 'PRIYADIS POS',
				title: 'RECEIPT',
				cashier: receiptData.cashier || '-',
				customer: receiptData.customer || 'Walk-in',
				branch: receiptData.branch || '-',
				butcher: receiptData.butcher || '-',
				date: receiptData.date || new Date().toLocaleString('id-ID'),
				items: receiptData.items || [],
				subtotal: receiptData.subtotal || 0,
				totalDiscount: receiptData.totalDiscount || 0,
				total: receiptData.total || 0,
			});

			console.log('Loading HTML for receipt print...');

			// Load HTML content
			printWindow.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

			let printingStarted = false;

			// Wait for content to fully render
			printWindow.webContents.on('did-finish-load', () => {
				console.log('Receipt HTML loaded, waiting for render...');
				
				// Wait for rendering
				setTimeout(() => {
					if (printingStarted) return;
					printingStarted = true;

					console.log('Opening print dialog for receipt...');

					// Open print dialog (user can select printer and adjust settings)
					printWindow.webContents.print({
						silent: false,
						printBackground: true,
						margins: {
							marginType: 'none',
						},
					}, (success, failureReason) => {
						console.log(`Receipt print dialog result: success=${success}, reason=${failureReason}`);
						
						setTimeout(() => {
							printWindow.destroy();
							
							if (success) {
								console.log('Receipt sent to printer successfully');
								resolve({ success: true });
							} else if (failureReason === 'cancelled') {
								console.log('Receipt print dialog cancelled by user');
								resolve({ success: false, cancelled: true });
							} else {
								console.error(`Receipt print failed: ${failureReason}`);
								reject(`Print failed: ${failureReason || 'Unknown error'}`);
							}
						}, 500);
					});
				}, 1000);
			});

			printWindow.webContents.on('crashed', () => {
				if (!printingStarted) {
					printingStarted = true;
					printWindow.destroy();
					reject('Print window crashed');
				}
			});

			// Timeout
			const timeout = setTimeout(() => {
				if (!printingStarted && !printWindow.isDestroyed()) {
					printingStarted = true;
					printWindow.destroy();
					reject('Print dialog timeout');
				}
			}, 30000);

			printWindow.on('closed', () => {
				clearTimeout(timeout);
			});

		} catch (err) {
			console.error('Print receipt error:', err);
			reject(err.message || 'Print failed');
		}
	});
});

// ─── Helper: Generate Receipt HTML ────────────────────────
function generateReceiptHTML(data = {}) {
	const {
		storeName = 'PRIYADIS POS',
		title = 'TEST PRINT',
		cashier = '-',
		customer = 'Walk-in',
		branch = '-',
		butcher = '-',
		date = new Date().toLocaleString('id-ID'),
		items = [],
		subtotal = 0,
		totalDiscount = 0,
		total = 0,
	} = data;

	let itemsHTML = '';
	if (items.length > 0) {
		items.forEach((item) => {
			const gross = (item.price || 0) * (item.quantity || 0);
			const discount = (item.discount || 0) * (item.quantity || 0);
			const nett = gross - discount;

			itemsHTML += `
				<div class="row">
					<div class="item-left">${item.name}</div>
					<div class="item-right">${formatNum(gross)}</div>
				</div>
				<div class="row" style="font-size: 10px;">
					<div class="item-left">${item.quantity} ${item.unit} × ${formatNum(item.price)}</div>
					<div class="item-right"></div>
				</div>
				${item.discount > 0 ? `
					<div class="row" style="font-size: 10px;">
						<div class="item-left">Disc ${formatNum(item.discount)}</div>
						<div class="item-right">-${formatNum(discount)}</div>
					</div>
				` : ''}
			`;
		});
	}

	return `<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Thermal Receipt</title>
	<style type="text/css">
		/* GLOBAL RESET */
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
			color: black;
		}

		html, body {
			width: 100%;
			margin: 0;
			padding: 0;
		}

		body {
			font-family: monospace;
			font-size: 11px;
			background: white;
			line-height: 1.3;
		}

		/* RECEIPT CONTAINER - 48mm SAFE AREA */
		.receipt {
			width: 48mm;
			margin: 0;
			padding: 2mm;
			padding-bottom: 15mm;
			background: white;
		}

		/* HEADER */
		.header {
			text-align: center;
			margin-bottom: 4px;
		}

		.header h1 {
			font-size: 12px;
			font-weight: bold;
			margin-bottom: 1px;
		}

		.header p {
			font-size: 10px;
			margin-bottom: 1px;
		}

		/* LINE DIVIDER */
		.line {
			border-top: 1px dashed black;
			margin: 3px 0;
		}

		/* ROW */
		.row {
			display: flex;
			justify-content: space-between;
			margin: 2px 0;
		}

		/* ITEM LAYOUT */
		.item-left {
			width: 65%;
			text-align: left;
		}

		.item-right {
			width: 35%;
			text-align: right;
		}

		/* FOOTER SAFE AREA */
		.footer-safe {
			margin-top: 4mm;
			margin-bottom: 10mm;
			text-align: center;
			font-size: 10px;
			font-weight: bold;
		}

		/* CUT SAFE BUFFER */
		.cut-space {
			height: 10mm;
		}

		/* PRINT SETTINGS */
		@media print {
			@page {
				size: 58mm auto;
				margin: 0;
				padding: 0;
			}

			body {
				margin: 0;
				padding: 0;
			}

			.receipt {
				width: 48mm;
				padding-bottom: 18mm !important;
			}
		}
	</style>
</head>
<body>
	<div class="receipt">
		<!-- HEADER -->
		<div class="header">
			<h1>${storeName}</h1>
			<p>Jl. Ciledug No.273</p>
			<p>Telp: 08122025119</p>
		</div>

		<div class="line"></div>

		<!-- INFO ROWS -->
		<div class="row">
			<div class="item-left">Tanggal</div>
			<div class="item-right">${date}</div>
		</div>

		<div class="row">
			<div class="item-left">Kasir</div>
			<div class="item-right">${cashier}</div>
		</div>

		<div class="row">
			<div class="item-left">Pembeli</div>
			<div class="item-right">${customer}</div>
		</div>

		<div class="line"></div>

		<!-- ITEMS -->
		${itemsHTML}

		<div class="line"></div>

		<!-- SUMMARY -->
		<div class="row">
			<div class="item-left">Subtotal</div>
			<div class="item-right">${formatNum(subtotal)}</div>
		</div>

		<div class="row">
			<div class="item-left">Diskon</div>
			<div class="item-right">${formatNum(totalDiscount)}</div>
		</div>

		<div class="line"></div>

		<div class="row" style="font-size: 12px;">
			<div class="item-left">TOTAL</div>
			<div class="item-right">${formatNum(total)}</div>
		</div>

		<div class="line"></div>

		<!-- FOOTER -->
		<div class="footer-safe">
			Terima kasih 🙏<br>
			Selamat datang kembali
		</div>

		<!-- CUT SAFE BUFFER -->
		<div class="cut-space"></div>
	</div>
</body>
</html>`;
}

// ─── IPC: Test Print (Using WebContent with Dialog) ──────
ipcMain.handle('test-print', async (event, printerName) => {
	return new Promise((resolve, reject) => {
		try {
			console.log(`Test print requested for printer: ${printerName}`);

			// Create a hidden window for printing
			const printWindow = new BrowserWindow({
				show: false,
				width: 400,
				height: 600,
				webPreferences: {
					nodeIntegration: false,
					contextIsolation: true,
				},
			});

			// Generate test print HTML
			const testData = {
				storeName: 'PRIYADIS POS',
				title: 'TEST PRINT',
				date: new Date().toLocaleString('id-ID'),
				cashier: 'Test User',
				customer: 'Test Customer',
				branch: 'Test Branch',
				butcher: 'Test Seller',
				items: [
					{
						name: 'Test Item 1',
						quantity: 2,
						unit: 'pcs',
						price: 50000,
						discount: 0,
					},
					{
						name: 'Test Item 2',
						quantity: 1,
						unit: 'kg',
						price: 100000,
						discount: 5000,
					},
				],
				subtotal: 200000,
				totalDiscount: 5000,
				total: 195000,
			};

			const htmlContent = generateReceiptHTML(testData);

			console.log('Loading HTML for test print...');

			// Load HTML content
			printWindow.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

			let printingStarted = false;

			// Wait for content to fully render
			printWindow.webContents.on('did-finish-load', () => {
				console.log('Test HTML loaded, waiting for render...');
				
				// Wait for rendering
				setTimeout(() => {
					if (printingStarted) return;
					printingStarted = true;

					console.log('Opening print dialog...');

					// Open print dialog (user can select printer and adjust settings)
					printWindow.webContents.print({
						silent: false,
						printBackground: true,
						margins: {
							marginType: 'none',
						},
					}, (success, failureReason) => {
						console.log(`Print dialog result: success=${success}, reason=${failureReason}`);
						
						setTimeout(() => {
							printWindow.destroy();
							
							if (success) {
								console.log('Test print sent successfully');
								resolve({ success: true });
							} else if (failureReason === 'cancelled') {
								console.log('Print dialog cancelled by user');
								resolve({ success: false, cancelled: true });
							} else {
								console.error(`Test print failed: ${failureReason}`);
								reject(`Print failed: ${failureReason || 'Unknown error'}`);
							}
						}, 500);
					});
				}, 1000);
			});

			printWindow.webContents.on('crashed', () => {
				if (!printingStarted) {
					printingStarted = true;
					printWindow.destroy();
					reject('Print window crashed');
				}
			});

			// Timeout
			const timeout = setTimeout(() => {
				if (!printingStarted && !printWindow.isDestroyed()) {
					printingStarted = true;
					printWindow.destroy();
					reject('Print dialog timeout');
				}
			}, 30000);

			printWindow.on('closed', () => {
				clearTimeout(timeout);
			});

		} catch (err) {
			console.error('Test print error:', err);
			reject(err.message || 'Test print failed');
		}
	});
});