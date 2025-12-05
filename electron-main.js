/**
 * Electron Main Process
 * 
 * This file manages the Electron application lifecycle and creates the main window.
 * It loads the web app (either dev server or production build) and handles window events.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'electron-preload.js'),
    },
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset', // macOS modern look
    show: false, // Don't show until ready
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${join(__dirname, 'src/apps/web/frontend/dist/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App lifecycle: Ready
 */
app.whenReady().then(() => {
  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * App lifecycle: Quit
 */
app.on('window-all-closed', () => {
  // macOS: Keep app running until explicit quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPC Handlers (for future desktop-specific features)
 */

// Example: Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Example: Show notification (will implement in next todo)
ipcMain.handle('show-notification', (event, { title, body }) => {
  // TODO: Implement desktop notifications
  console.log('Notification:', title, body);
});
