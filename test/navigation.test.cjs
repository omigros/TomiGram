'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isSafeExternalUrl,
  isTrustedHost,
  isTrustedNavigation,
  parseWebUrl,
} = require('../electron/navigation.cjs');

test('allows official Telegram and VK origins and their subdomains', () => {
  for (const url of [
    'https://web.telegram.org/a/',
    'https://telegram.org/',
    'https://t.me/example',
    'https://login.vk.com/',
    'https://vk.com/im',
    'https://id.vk.ru/',
    'https://cs123.userapi.com/',
    'https://audio.vkuseraudio.net/',
  ]) {
    assert.equal(isTrustedNavigation(url), true, url);
  }
});

test('does not trust insecure HTTP origins even on official hostnames', () => {
  assert.equal(isTrustedNavigation('http://vk.com/im'), false);
  assert.equal(isTrustedNavigation('http://web.telegram.org/a/'), false);
});

test('does not trust lookalike or unrelated hosts', () => {
  for (const url of [
    'https://vk.com.attacker.example/',
    'https://telegram.org.attacker.example/',
    'https://example.com/',
    'https://localhost/',
  ]) {
    assert.equal(isTrustedNavigation(url), false, url);
  }
});

test('rejects non-web protocols and malformed URLs', () => {
  for (const url of [
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:text/html,hello',
    'mailto:user@example.com',
    'not a URL',
    '',
  ]) {
    assert.equal(parseWebUrl(url), null, url);
    assert.equal(isSafeExternalUrl(url), false, url);
    assert.equal(isTrustedNavigation(url), false, url);
  }
});

test('accepts only exact host or dot-delimited subdomain matches', () => {
  assert.equal(isTrustedHost('vk.com'), true);
  assert.equal(isTrustedHost('login.vk.com'), true);
  assert.equal(isTrustedHost('notvk.com'), false);
  assert.equal(isTrustedHost('vk.com.evil.test'), false);
});

const { sanitizeDownloadFilename } = require('../electron/downloads.cjs');

test('sanitizes suggested download names for cross-platform save dialogs', () => {
  assert.equal(sanitizeDownloadFilename('../../report.pdf'), 'report.pdf');
  assert.equal(sanitizeDownloadFilename('folder\\\\secret.txt'), 'secret.txt');
  assert.equal(sanitizeDownloadFilename('bad:name?.txt'), 'bad_name_.txt');
  assert.equal(sanitizeDownloadFilename('   '), 'download');
  assert.equal(sanitizeDownloadFilename('CON.txt'), '_CON.txt');
});

test('bounds suggested download filename length', () => {
  assert.equal(sanitizeDownloadFilename('a'.repeat(300)).length, 180);
});
