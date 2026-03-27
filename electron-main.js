import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import isDev from "electron-is-dev";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "electron-preload.js"),
    },
    backgroundColor: "#0a0a0a",
    titleBarStyle: "hiddenInset",
    show: false,
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${join(__dirname, "src/apps/web/frontend/dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent flashing
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // macOS: Keep app running until explicit quit
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("show-notification", (event, { title, body }) => {
  // TODO: Implement desktop notifications
  console.log("Notification:", title, body);
});
