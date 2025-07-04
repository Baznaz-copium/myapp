const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  on: (...args) => ipcRenderer.on(...args),
  send: (...args) => ipcRenderer.send(...args),
  removeListener: (...args) => ipcRenderer.removeListener(...args),
  invoke: (...args) => ipcRenderer.invoke(...args),
});
console.log('preload.js loaded');