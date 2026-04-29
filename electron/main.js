const { app, BrowserWindow } = require('electron');
const path = require('path');
const iconPath = path.join(__dirname, '../assets/icon.png');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
	const win = new BrowserWindow({
			icon: iconPath,
			width: 1200,        // fallback size before maximize
			height: 800,        // fallback size before maximize
			show: false,        // 👈 hide until ready to avoid white flash
			webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	// 👇 Maximize the window when ready
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