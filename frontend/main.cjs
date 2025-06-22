const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

const server = express();
const DIST = path.join(__dirname, 'dist');

// Serve static files from the dist directory
server.use(express.static(DIST));

// For any other route, serve index.html (for React Router)
server.get('/client-display', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

let serverInstance;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { contextIsolation: true }
  });
  win.setMenuBarVisibility(false);
  win.maximize();
  win.loadURL('http://localhost:3000/');
}

// Use Electron's app, not Express's app!
app.whenReady().then(() => {
  serverInstance = server.listen(3000, createWindow);
});

app.on('window-all-closed', () => {
  if (serverInstance) serverInstance.close();
  if (process.platform !== 'darwin') app.quit();
});