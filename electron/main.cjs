'use strict';

// TomiGram-specific Electron host. New implementation dated 2026-11-25.
const { app, BrowserWindow, WebContentsView, ipcMain, shell, session } = require('electron');
const path = require('node:path');

const APP_NAME = 'TomiGram';
const TOPBAR_HEIGHT = 72;
const TRANSITION_MS = 180;
const MESSENGERS = {
  telegram: { url: 'https://web.telegram.org/a/', partition: 'persist:tomigram-telegram' },
  vk: { url: 'https://vk.com/im', partition: 'persist:tomigram-vk' },
};

let windowRef;
const views = new Map();
let activeMessenger = 'telegram';
let switchInProgress = false;

function isWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function attachSafeExternalHandling(view) {
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  view.webContents.on('will-navigate', (event, url) => {
    if (!isWebUrl(url)) event.preventDefault();
  });
}

function layoutViews() {
  if (!windowRef || windowRef.isDestroyed()) return;
  const [width, height] = windowRef.getContentSize();
  for (const view of views.values()) {
    view.setBounds({
      x: 0,
      y: TOPBAR_HEIGHT,
      width,
      height: Math.max(0, height - TOPBAR_HEIGHT),
    });
  }
}

function setActiveView(id) {
  for (const [key, view] of views) view.setVisible(key === id);
  activeMessenger = id;
}

async function switchMessenger(id) {
  if (!MESSENGERS[id] || id === activeMessenger || switchInProgress) return;
  switchInProgress = true;
  windowRef?.webContents.send('messenger:transition-start', id);

  for (const view of views.values()) view.setVisible(false);

  setTimeout(() => {
    setActiveView(id);
    layoutViews();
    windowRef?.webContents.send('messenger:changed', id);
    switchInProgress = false;
  }, TRANSITION_MS);
}

function createMessengerView(id, config) {
  const partitionSession = session.fromPartition(config.partition);
  const view = new WebContentsView({
    webPreferences: {
      session: partitionSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  views.set(id, view);
  windowRef.contentView.addChildView(view);
  view.setVisible(id === activeMessenger);
  attachSafeExternalHandling(view);
  view.webContents.loadURL(config.url);
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    title: APP_NAME,
    backgroundColor: '#11151d',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  windowRef.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));
  windowRef.on('resize', layoutViews);
  windowRef.on('closed', () => { windowRef = null; });

  windowRef.webContents.once('did-finish-load', () => {
    for (const [id, config] of Object.entries(MESSENGERS)) createMessengerView(id, config);
    layoutViews();
  });
}

app.whenReady().then(() => {
  ipcMain.handle('messenger:switch', (_event, id) => switchMessenger(id));
  ipcMain.handle('messenger:active', () => activeMessenger);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
