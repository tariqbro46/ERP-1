const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated desktop APIs to the React renderer window
contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
  
  // Local Database & File Backup
  saveBackupFile: async (fileName, data) => {
    return await ipcRenderer.invoke('save-backup-file', { fileName, data });
  },
  loadBackupFile: async () => {
    return await ipcRenderer.invoke('load-backup-file');
  },
  
  // Local System Info
  getSystemStorageInfo: async () => {
    return await ipcRenderer.invoke('get-system-storage-info');
  },

  // Native Print
  printToPrinter: async (options) => {
    return await ipcRenderer.invoke('print-to-printer', options);
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});
