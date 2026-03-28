/** @file Electron preload script exposing IPC bridge to the renderer process. */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  showNotification: (title, body) =>
    ipcRenderer.invoke("show-notification", { title, body }),

  isElectron: true,
});
