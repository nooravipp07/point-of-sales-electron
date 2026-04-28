const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
	sendMessage: (channel, data) => ipcRenderer.send(channel, data),
	onMessage: (channel, callback) =>
		ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});