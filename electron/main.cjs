'use strict';

// TomiGram-specific Electron host. New implementation dated 2026-11-25.
const { app, BrowserWindow, WebContentsView, ipcMain, shell, session } = require('electron');
const path = require('node:path');

const APP_NAME = 'TomiGram';
const TOPBAR_HEIGHT = 64;
const TRANSITION_MS = 180;
const MESSENGERS = {
  telegram: { url: 'https://web.telegram.org/a/', partition: 'persist:tomigram-telegram' },
  vk: { url: 'https://vk.com/im', partition: 'persist:tomigram-vk' },
};

let windowRef;
const views = new Map();
const loadedViews = new Set();
let activeMessenger = 'telegram';
let switchInProgress = false;
let switchTimer = null;

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
    if (!isWebUrl(url)) {
      event.preventDefault();
      return;
    }
    try {
      const destination = new URL(url);
      const trusted = ['web.telegram.org', 'telegram.org', 't.me', 'telegram.me', 'vk.com', 'vk.ru', 'userapi.com', 'vkuseraudio.net'];
      const allowed = trusted.some((host) => destination.hostname === host || destination.hostname.endsWith(`.${host}`));
      if (!allowed) {
        event.preventDefault();
        void shell.openExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });

  view.webContents.on('will-redirect', (event, url) => {
    if (!isWebUrl(url)) {
      event.preventDefault();
      return;
    }
    const destination = new URL(url);
    const trusted = ['web.telegram.org', 'telegram.org', 't.me', 'telegram.me', 'vk.com', 'vk.ru', 'userapi.com', 'vkuseraudio.net'];
    if (!trusted.some((host) => destination.hostname === host || destination.hostname.endsWith(`.${host}`))) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  view.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !input.control || input.alt || input.meta) return;
    const key = input.key.toLowerCase();
    if (key === '1' || key === '2') {
      event.preventDefault();
      void switchMessenger(key === '1' ? 'telegram' : 'vk');
    }
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
  for (const [key, view] of views) view.setVisible(key === id && loadedViews.has(key));
  activeMessenger = id;
}

async function switchMessenger(id) {
  if (!MESSENGERS[id] || id === activeMessenger || switchInProgress) return;
  switchInProgress = true;
  windowRef?.webContents.send('messenger:transition-start', id);

  for (const view of views.values()) view.setVisible(false);

  switchTimer = setTimeout(() => {
    switchTimer = null;
    if (!windowRef || windowRef.isDestroyed()) {
      switchInProgress = false;
      return;
    }
    setActiveView(id);
    layoutViews();
    windowRef.webContents.send('messenger:changed', id);
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
  // Keep the native surface hidden until its first document has rendered.
  view.setVisible(false);
  attachSafeExternalHandling(view);
  view.webContents.once('did-finish-load', () => {
    loadedViews.add(id);
    if (id === activeMessenger && windowRef && !windowRef.isDestroyed()) {
      view.setVisible(true);
      layoutViews();
    }
  });
  view.webContents.on('render-process-gone', () => {
    loadedViews.delete(id);
    view.setVisible(false);
  });
  view.webContents.loadURL(config.url).catch((error) => {
    console.error(`[TomiGram] Failed to load ${id}:`, error);
  });
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
  windowRef.on('closed', () => {
    if (switchTimer) clearTimeout(switchTimer);
    switchTimer = null;
    switchInProgress = false;
    for (const view of views.values()) view.webContents.close();
    views.clear();
    loadedViews.clear();
    windowRef = null;
  });

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

app.on('before-quit', () => {
  if (switchTimer) clearTimeout(switchTimer);
  switchTimer = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
