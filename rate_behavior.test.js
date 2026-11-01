const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Datos no consulta recomendaciones IA automáticamente', () => {
  const src = fs.readFileSync('./app.js','utf8');
  const start = src.indexOf('function afterRender()');
  const end = src.indexOf('function setupWorkspaceDrag()', start);
  const afterRender = src.slice(start, end);
  assert.doesNotMatch(afterRender, /ensureRecommendations\(/);
  assert.match(src, /Gemini no se consulta automáticamente/);
});

test('errores 429 distinguen THOKAR, Gemini y patentes', () => {
  const src = fs.readFileSync('./app.js','utf8');
  assert.match(src, /AI_RATE_LIMIT/);
  assert.match(src, /GEMINI_RATE_LIMIT/);
  assert.match(src, /PLATE_RATE_LIMIT/);
  assert.match(src, /Intenta de nuevo en/);
});

test('backend limita Gemini a máximo dos intentos externos por acción', () => {
  const src = fs.readFileSync('./server.js','utf8');
  assert.match(src, /models\.slice\(0, 2\)/);
  assert.doesNotMatch(src, /const delays = \[0, 1400\]/);
});
