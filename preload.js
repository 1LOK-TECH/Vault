const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  navigateToVault: () => ipcRenderer.invoke('navigate-to-vault'),
  navigateToLogin: () => ipcRenderer.invoke('navigate-to-login')
});
