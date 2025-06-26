const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

const server = express();
const DIST = path.join(__dirname, 'dist');

const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

// Serve static files from the dist directory
server.use(express.static(DIST));

// For any other route, serve index.html (for React Router)
server.get('/client-display','/LeaderBoard', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

let serverInstance;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize();
  mainWindow.loadURL('http://localhost:3000/');
}

ipcMain.handle("check-for-update", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result ? result.updateInfo : null;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("start-update-download", async () => {
  try {
    autoUpdater.downloadUpdate();
    return { started: true };
  } catch (err) {
    return { error: err.message };
  }
});

autoUpdater.on("download-progress", (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send("update-download-progress", progress);
  }
});

autoUpdater.on("update-available", (info) => {
  if (mainWindow) {
    mainWindow.webContents.send("update-available", info);
  }
});

autoUpdater.on("update-downloaded", () => {
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded");
  }
});

ipcMain.handle("restart-to-update", () => {
  autoUpdater.quitAndInstall();
});

// Use Electron's app, not Express's app!
app.whenReady().then(() => {
  serverInstance = server.listen(3000, createWindow);
});

app.on("ready", () => {
  createWindow();

  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (serverInstance) serverInstance.close();
  if (process.platform !== 'darwin') app.quit();
});