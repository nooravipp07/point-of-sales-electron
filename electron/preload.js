const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	// existing
	sendMessage: (channel, data) => ipcRenderer.send(channel, data),
	onMessage:   (channel, callback) =>
		ipcRenderer.on(channel, (event, ...args) => callback(...args)),

	// print
	printReceipt:   (data) => ipcRenderer.invoke('print-receipt', data),
	getUsbPrinters: ()     => ipcRenderer.invoke('get-usb-printers'),
});