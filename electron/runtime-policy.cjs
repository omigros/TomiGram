'use strict';

const MAX_RECOVERY_DELAY_MS = 30000;

function getRecoveryDelay(attempt) {
  const exponent = Math.max(0, Math.min(10, Number(attempt) || 0));
  return Math.min(MAX_RECOVERY_DELAY_MS, 1000 * (2 ** exponent));
}

function isAutomaticallyAllowedPermission(permission, url, isTrustedNavigation) {
  return permission === 'notifications' && isTrustedNavigation(url);
}

module.exports = {
  getRecoveryDelay,
  isAutomaticallyAllowedPermission,
  MAX_RECOVERY_DELAY_MS,
};
