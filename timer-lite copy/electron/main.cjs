const { app, BrowserWindow } = require('electron');
const path = require('path');

// Iniciamos el servidor Express/WS
require('../server.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    show: false, // Ocultar hasta que esté lista
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    title: 'ClimbComp Timer - Lite Edition'
  });

  mainWindow.loadURL('http://localhost:3001');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Interceptar apertura de nuevas ventanas
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('/public')) {
      // Crear ventana sin bordes para la vista pública
      const publicWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      publicWindow.loadURL(url);
      
      return { action: 'deny' }; // Bloquear el window.open original
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Algunos equipos pueden fallar la aceleración por hardware en resoluciones gigantes, 
// pero en general es mejor dejarla encendida para el renderizado fluido.
// app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
