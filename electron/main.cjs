'use strict';

// TomiGram-specific Electron host. New implementation dated 2026-11-25.
const { app, BrowserWindow, WebContentsView, ipcMain, shell, session, dialog } = require('electron');
const path = require('node:path');
const { isSafeExternalUrl, isTrustedNavigation } = require('./navigation.cjs');
const { sanitizeDownloadFilename } = require('./downloads.cjs');
const { getRecoveryDelay, isAutomaticallyAllowedPermission } = require('./runtime-policy.cjs');

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
const recoveryTimers = new Map();
const recoveryAttempts = new Map();
let isQuitting = false;
let activeMessenger = 'telegram';
let switchInProgress = false;
let switchTimer = null;

function attachSafeExternalHandling(view) {
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  const guardNavigation = (event, url) => {
    if (isTrustedNavigation(url)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
  };

  view.webContents.on('will-navigate', guardNavigation);
  view.webContents.on('will-redirect', guardNavigation);

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

function configureDownloads(partitionSession, messengerId) {
  partitionSession.on('will-download', (event, item, sourceContents) => {
    const sourceUrl = sourceContents?.getURL() || '';
    if (!isTrustedNavigation(sourceUrl)) {
      item.cancel();
      return;
    }

    item.pause();
    const defaultPath = path.join(
      app.getPath('downloads'),
      sanitizeDownloadFilename(item.getFilename()),
    );
    const options = {
      title: `Save ${messengerId} download`,
      defaultPath,
      buttonLabel: 'Save',
    };
    const parent = windowRef && !windowRef.isDestroyed() ? windowRef : null;
    const prompt = parent
      ? dialog.showSaveDialog(parent, options)
      : dialog.showSaveDialog(options);

    prompt.then(({ canceled, filePath }) => {
      if (canceled || !filePath) {
        item.cancel();
        return;
      }
      item.setSavePath(filePath);
      item.resume();
    }).catch((error) => {
      console.error(`[TomiGram] Download prompt failed for ${messengerId}:`, error);
      item.cancel();
    });
  });
}

function configurePermissions(partitionSession, messengerId) {
  partitionSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const url = requestingOrigin || webContents?.getURL() || '';
    return isAutomaticallyAllowedPermission(permission, url, isTrustedNavigation);
  });

  partitionSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details?.requestingUrl || webContents?.getURL() || '';
    if (!isTrustedNavigation(requestingUrl)) {
      callback(false);
      return;
    }

    if (isAutomaticallyAllowedPermission(permission, requestingUrl, isTrustedNavigation)) {
      callback(true);
      return;
    }

    const mediaPermissions = new Set(['media', 'camera', 'microphone']);
    if (!mediaPermissions.has(permission)) {
      callback(false);
      return;
    }

    const mediaTypes = details?.mediaTypes || [];
    const requested = mediaTypes.length
      ? mediaTypes.join(' and ')
      : permission === 'media' ? 'camera and microphone' : permission;
    const parent = windowRef && !windowRef.isDestroyed() ? windowRef : null;
    const options = {
      type: 'question',
      title: `Allow ${messengerId} access?`,
      message: `${messengerId.toUpperCase()} is requesting access to ${requested}.`,
      detail: 'Allow access only if you started a call or recording and trust this page.',
      buttons: ['Allow', 'Deny'],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
    };
    const prompt = parent
      ? dialog.showMessageBox(parent, options)
      : dialog.showMessageBox(options);
    prompt.then(({ response }) => callback(response === 0)).catch((error) => {
      console.error(`[TomiGram] Permission prompt failed for ${messengerId}:`, error);
      callback(false);
    });
  });
}

function scheduleViewRecovery(id, reason) {
  const view = views.get(id);
  if (!view || isQuitting || recoveryTimers.has(id) || view.webContents.isDestroyed()) return;

  loadedViews.delete(id);
  view.setVisible(false);
  const attempt = recoveryAttempts.get(id) || 0;
  const delay = getRecoveryDelay(attempt);
  recoveryAttempts.set(id, attempt + 1);
  console.warn(`[TomiGram] Recovering ${id} renderer after ${reason}; retry in ${delay}ms`);

  const timer = setTimeout(() => {
    recoveryTimers.delete(id);
    const currentView = views.get(id);
    if (!currentView || isQuitting || currentView.webContents.isDestroyed()) return;
    currentView.webContents.reload();
  }, delay);
  recoveryTimers.set(id, timer);
}

function createMessengerView(id, config) {
  const partitionSession = session.fromPartition(config.partition);
  configureDownloads(partitionSession, id);
  configurePermissions(partitionSession, id);
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
  view.webContents.on('did-finish-load', () => {
    const timer = recoveryTimers.get(id);
    if (timer) clearTimeout(timer);
    recoveryTimers.delete(id);
    recoveryAttempts.delete(id);
    loadedViews.add(id);
    if (id === activeMessenger && windowRef && !windowRef.isDestroyed()) {
      view.setVisible(true);
      layoutViews();
    }
  });
  view.webContents.on('render-process-gone', (_event, details) => {
    scheduleViewRecovery(id, `renderer exit (${details?.reason || 'unknown'})`);
  });
  view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) {
      scheduleViewRecovery(id, `load error ${errorCode}: ${errorDescription}`);
    }
  });
  view.webContents.on('unresponsive', () => {
    console.warn(`[TomiGram] ${id} renderer is unresponsive`);
  });
  view.webContents.on('responsive', () => {
    console.info(`[TomiGram] ${id} renderer recovered responsiveness`);
  });
  view.webContents.loadURL(config.url).catch((error) => {
    console.error(`[TomiGram] Failed to load ${id}:`, error);
    scheduleViewRecovery(id, 'initial navigation failure');
  });
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    title: APP_NAME,
    backgroundColor: '#212121',
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
    for (const timer of recoveryTimers.values()) clearTimeout(timer);
    recoveryTimers.clear();
    recoveryAttempts.clear();
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
  isQuitting = true;
  for (const timer of recoveryTimers.values()) clearTimeout(timer);
  recoveryTimers.clear();
  if (switchTimer) clearTimeout(switchTimer);
  switchTimer = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
