'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tomigram', {
  switchMessenger: (id) => ipcRenderer.invoke('messenger:switch', id),
  getActiveMessenger: () => ipcRenderer.invoke('messenger:active'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onTransitionStart: (callback) => {
    const listener = (_event, id) => callback(id);
    ipcRenderer.on('messenger:transition-start', listener);
    return () => ipcRenderer.removeListener('messenger:transition-start', listener);
  },
  onMessengerChanged: (callback) => {
    const listener = (_event, id) => callback(id);
    ipcRenderer.on('messenger:changed', listener);
    return () => ipcRenderer.removeListener('messenger:changed', listener);
  },
});
