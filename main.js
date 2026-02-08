const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    backgroundColor: '#1a1a1a',
    show: false
  });

  mainWindow.loadFile('src/index.html');

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development (remove in production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for secure operations
ipcMain.handle('navigate-to-vault', () => {
  if (mainWindow) {
    mainWindow.loadFile('src/vault.html');
  }
});

ipcMain.handle('navigate-to-login', () => {
  if (mainWindow) {
    mainWindow.loadFile('src/index.html');
  }
});
