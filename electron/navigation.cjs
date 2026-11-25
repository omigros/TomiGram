'use strict';

const TRUSTED_HOSTS = Object.freeze([
  'web.telegram.org',
  'telegram.org',
  't.me',
  'telegram.me',
  'vk.com',
  'vk.ru',
  'userapi.com',
  'vkuseraudio.net',
]);

function parseWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

function isTrustedHost(hostname) {
  return TRUSTED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function isTrustedNavigation(value) {
  const url = parseWebUrl(value);
  return Boolean(url && url.protocol === 'https:' && isTrustedHost(url.hostname));
}

function isSafeExternalUrl(value) {
  return Boolean(parseWebUrl(value));
}

module.exports = {
  isSafeExternalUrl,
  isTrustedHost,
  isTrustedNavigation,
  parseWebUrl,
};
