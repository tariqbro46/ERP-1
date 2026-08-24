const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 650,
    title: 'TallyFlow ERP - Desktop Application',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load either local dev server or built production static files
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const candidatePaths = [
      path.join(app.getAppPath(), 'dist/index.html'),
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, 'dist/index.html'),
      path.join(process.resourcesPath || '', 'app.asar/dist/index.html'),
    ];

    const targetHtmlPath = candidatePaths.find(p => fs.existsSync(p));
    if (targetHtmlPath) {
      mainWindow.loadFile(targetHtmlPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  // Allow F12 or Ctrl+Shift+I to open Developer Tools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Save Backup to Computer's Local Disk
ipcMain.handle('save-backup-file', async (event, { fileName, data }) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save TallyFlow Local Database Backup',
    defaultPath: fileName || `TallyFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [
      { name: 'JSON Backup (*.json)', extensions: ['json'] },
      { name: 'SQLite DB (*.db)', extensions: ['db', 'sqlite'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handler: Load Backup from Computer's Local Disk
ipcMain.handle('load-backup-file', async () => {
  if (!mainWindow) return { success: false, error: 'No active window' };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select TallyFlow Backup File',
    properties: ['openFile'],
    filters: [
      { name: 'Backup Files (*.json, *.db)', extensions: ['json', 'db', 'sqlite'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const rawData = fs.readFileSync(filePaths[0], 'utf-8');
    return { success: true, filePath: filePaths[0], data: rawData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handler: Local Storage Location Info
ipcMain.handle('get-system-storage-info', async () => {
  const userDataPath = app.getPath('userData');
  return {
    userDataPath,
    appVersion: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged
  };
});

// IPC Handler: Direct Print
ipcMain.handle('print-to-printer', async (event, options) => {
  if (!mainWindow) return { success: false };
  mainWindow.webContents.print(options || {}, (success, failureReason) => {
    return { success, failureReason };
  });
});

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());
