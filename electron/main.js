const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const iconPath = path.join(__dirname, '../assets/icon.png');
const isDev = process.env.NODE_ENV === 'development';

// Lazy load escpos to avoid crash if printer not connected
let escpos = null;
let USB = null;

try {
	escpos      = require('escpos');
	USB         = require('escpos-usb');
	escpos.USB  = USB;
	console.log('escpos loaded successfully');
} catch (e) {
  	console.warn('escpos not loaded:', e.message);
}

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

// ─── IPC: Get USB Printers ─────────────────────────────────
ipcMain.handle('get-usb-printers', async () => {
	try {
		if (!escpos) return { success: false, error: 'escpos not loaded', devices: [] };
		const devices = escpos.USB.findPrinter();
		return {
			success: true,
			devices: devices.map((d) => ({
				vendorId:  d.deviceDescriptor.idVendor,
				productId: d.deviceDescriptor.idProduct,
			})),
		};
	} catch (err) {
		console.error('get-usb-printers error:', err);
		return { success: false, error: err.message, devices: [] };
	}
});

// ─── IPC: Print Receipt ────────────────────────────────────
ipcMain.handle('print-receipt', async (event, receiptData) => {
	return new Promise((resolve, reject) => {

		// Check escpos loaded
		if (!escpos) {
			return reject('escpos module not loaded. Run: npm install escpos escpos-usb then npx electron-rebuild');
		}

		// Check USB class exists
		if (!escpos.USB) {
			return reject('escpos.USB not found. Run: npm install escpos-usb then npx electron-rebuild');
		}

		// Check printer connected
		let devices = [];
		try {
			devices = escpos.USB.findPrinter();
			console.log('Found USB printers:', devices.length);
		} catch (findErr) {
			return reject(`Cannot scan USB devices: ${findErr.message}. Try running as Administrator or install WinUSB via Zadig.`);
		}

		if (devices.length === 0) {
			return reject('No USB printer found. Check: (1) USB cable connected, (2) Printer is ON, (3) Run Zadig to install WinUSB driver.');
		}

		try {
			const device  = new escpos.USB();
			const options = { encoding: 'GB18030' };
			const printer = new escpos.Printer(device, options);

			const {
				storeName,
				cashier,
				customer,
				branch,
				butcher,
				date,
				items        = [],
				subtotal     = 0,
				totalDiscount = 0,
				total        = 0,
			} = receiptData;

			device.open(function (err) {
				if (err) {
					console.error('Device open error:', err);
					return reject('Cannot connect to printer. Check USB cable and driver.');
				}

				try {
				// ── Header ───────────────────────────────────────
				printer
					.font('a')
					.align('ct')
					.style('b')
					.size(1, 1)
					.text(storeName || 'PRIYADIS POS')
					.size(0, 0)
					.style('normal')
					.text('================================')
					.align('lt')
					.text(`Date    : ${date}`)
					.text(`Cashier : ${cashier  || '-'}`)
					.text(`Customer: ${customer || 'Walk-in'}`)
					.text(`Branch  : ${branch   || '-'}`)
					.text(`Butcher : ${butcher  || '-'}`)
					.text('================================');

				// ── Items ─────────────────────────────────────────
				items.forEach((item) => {
					const gross    = (item.price    || 0) * (item.quantity || 0);
					const discount = (item.discount || 0) * (item.quantity || 0);
					const nett     = gross - discount;

					printer
					.align('lt')
					.text(`${item.name}`)
					.tableCustom([
						{ text: `  ${item.quantity} ${item.unit} x ${formatNum(item.price)}`, align: 'LEFT',  width: 0.6 },
						{ text: formatNum(gross),                                              align: 'RIGHT', width: 0.4 },
					]);

					if (item.discount > 0) {
					printer.tableCustom([
						{ text: `  Disc ${formatNum(item.discount)}/${item.unit}`, align: 'LEFT',  width: 0.6 },
						{ text: `- ${formatNum(discount)}`,                        align: 'RIGHT', width: 0.4 },
					]);
					}

					printer
					.tableCustom([
						{ text: '  Nett', align: 'LEFT',  width: 0.6 },
						{ text: formatNum(nett),           align: 'RIGHT', width: 0.4 },
					])
					.text('--------------------------------');
				});

				// ── Summary ───────────────────────────────────────
				printer
					.tableCustom([
					{ text: 'Subtotal',             align: 'LEFT',  width: 0.55 },
					{ text: formatNum(subtotal),    align: 'RIGHT', width: 0.45 },
					])
					.tableCustom([
					{ text: 'Total Discount',             align: 'LEFT',  width: 0.55 },
					{ text: `- ${formatNum(totalDiscount)}`, align: 'RIGHT', width: 0.45 },
					])
					.text('================================')
					.style('b')
					.tableCustom([
					{ text: 'TOTAL',          align: 'LEFT',  width: 0.55 },
					{ text: formatNum(total), align: 'RIGHT', width: 0.45 },
					])
					.style('normal')
					.text('================================');

				// ── Footer ────────────────────────────────────────
				printer
					.align('ct')
					.text('Terima kasih atas pembelian Anda!')
					.text('Selamat datang kembali')
					.feed(4)
					.cut()
					.close(() => {
					console.log('Print successful');
					resolve({ success: true });
					});

				} catch (printErr) {
					console.error('Printer command error:', printErr);
					reject(printErr.message || 'Print command failed');
				}
			});

		} catch (err) {
			console.error('Print setup error:', err);
			reject(err.message || 'Print failed');
		}
	});

	ipcMain.handle('test-print', async (event, printerName) => {
		return new Promise((resolve, reject) => {
			if (!escpos) return reject('escpos not loaded');

			try {
				const device  = new escpos.USB();
				const printer = new escpos.Printer(device, { encoding: 'GB18030' });

				device.open((err) => {
					if (err) return reject(`Cannot open printer: ${err.message || err}`);

					printer
					.font('a')
					.align('ct')
					.style('b')
					.size(1, 1)
					.text('PRIYADIS POS')
					.size(0, 0)
					.style('normal')
					.text('========================')
					.text('TEST PRINT')
					.text(new Date().toLocaleString('id-ID'))
					.text('========================')
					.text('Printer connected!')
					.text('Ready to print receipts')
					.text('========================')
					.feed(4)
					.cut()
					.close(() => resolve({ success: true }));
				});
			} catch (err) {
				reject(err.message);
			}
		});
	});
});