/**
 * Electron Preload Script
 * 
 * This script runs in the renderer process before the web content loads.
 * It exposes safe APIs to the web app via the contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose safe Electron APIs to the web app
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Get the Electron app version
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * Show a desktop notification
   */
  showNotification: (title, body) => 
    ipcRenderer.invoke('show-notification', { title, body }),

  /**
   * Check if running in Electron
   */
  isElectron: true,
});
