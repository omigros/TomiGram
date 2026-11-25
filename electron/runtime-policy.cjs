'use strict';

const MAX_RECOVERY_DELAY_MS = 30000;

function getRecoveryDelay(attempt) {
  const exponent = Math.max(0, Math.min(10, Number(attempt) || 0));
  return Math.min(MAX_RECOVERY_DELAY_MS, 1000 * (2 ** exponent));
}

function isAutomaticallyAllowedPermission(permission, url, isTrustedNavigation) {
  return permission === 'notifications' && isTrustedNavigation(url);
}

function normalizeWindowState(state, displays, defaults = { x: 100, y: 100, width: 1360, height: 900 }) {
  const fallback = { ...defaults };
  if (!state || typeof state !== 'object' || !Array.isArray(displays) || displays.length === 0) {
    return { bounds: fallback, maximized: false };
  }

  const raw = state.bounds && typeof state.bounds === 'object' ? state.bounds : {};
  const numeric = (value, fallbackValue) => Number.isFinite(value) ? Math.round(value) : fallbackValue;
  const width = Math.max(760, numeric(raw.width, fallback.width));
  const height = Math.max(560, numeric(raw.height, fallback.height));
  const x = numeric(raw.x, fallback.x);
  const y = numeric(raw.y, fallback.y);
  const intersects = displays.some((display) => {
    const area = display.workArea || display.bounds;
    if (!area) return false;
    return x < area.x + area.width && x + width > area.x &&
      y < area.y + area.height && y + height > area.y;
  });

  if (!intersects) return { bounds: fallback, maximized: state.maximized === true };

  const display = displays.find((candidate) => {
    const area = candidate.workArea || candidate.bounds;
    return area && x < area.x + area.width && x + width > area.x &&
      y < area.y + area.height && y + height > area.y;
  });
  const area = display.workArea || display.bounds;
  const safeWidth = Math.min(width, Math.max(760, area.width));
  const safeHeight = Math.min(height, Math.max(560, area.height));
  return {
    bounds: {
      x: Math.min(Math.max(x, area.x), area.x + area.width - safeWidth),
      y: Math.min(Math.max(y, area.y), area.y + area.height - safeHeight),
      width: safeWidth,
      height: safeHeight,
    },
    maximized: state.maximized === true,
  };
}

module.exports = {
  getRecoveryDelay,
  isAutomaticallyAllowedPermission,
  normalizeWindowState,
  MAX_RECOVERY_DELAY_MS,
};
