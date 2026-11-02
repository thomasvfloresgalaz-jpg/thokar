const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('frontend, backend y service worker comparten el mismo build/caché de Prototipo 5.6.0', () => {
  const app = fs.readFileSync('./app.js','utf8');
  const server = fs.readFileSync('./server.js','utf8');
  const sw = fs.readFileSync('./sw.js','utf8');
  assert.match(app, /APP_BUILD='prototipo-5.6.0-talk-viewport-final'/);
  assert.match(server, /build:\s*'prototipo-5.6.0-talk-viewport-final'/);
  assert.match(sw, /thokar-prototipo-5.6.0-talk-viewport-final/);
});
