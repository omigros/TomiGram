'use strict';

function sanitizeDownloadFilename(value) {
  const raw = String(value || '').replace(/\\/g, '/');
  let name = raw.split('/').pop() || 'download';
  name = name
    .replace(/[<>:"|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();
  if (!name || name === '.' || name === '..') name = 'download';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(name)) {
    name = `_${name}`;
  }
  return name.slice(0, 180) || 'download';
}

module.exports = { sanitizeDownloadFilename };
