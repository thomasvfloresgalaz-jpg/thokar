const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('./app.js','utf8');
const css = fs.readFileSync('./styles.css','utf8');

test('búsqueda limpia la ficha anterior antes de renderizar el estado de carga', () => {
  assert.match(app, /freshContext\(plate\);mainNavState='consult';screen='lookup'/);
  assert.match(app, /function renderLookup\(\)/);
});

test('la navegación inferior conserva estado real y usa resorte para la gota activa', () => {
  assert.match(app, /function setMainNav\(state\)/);
  assert.match(app, /springNumber\(from,to/);
  assert.match(css, /--nav-pos/);
  assert.match(css, /--nav-stretch/);
});

test('las hojas pueden cerrarse por arrastre y las importantes abren completas', () => {
  assert.match(app, /projected>vh\*\.48\|\|velocity>1050/);
  assert.match(app, /Eliminar vehículo[\s\S]*\{full:true\}/);
});

test('Hablar usa una ventana propia y elimina el selector inicial al comenzar la conversación', () => {
  assert.match(app, /function fitTalkWindow\(\)/);
  assert.match(app, /quick-start-shell/);
  assert.match(app, /th\.querySelector\('\.quick-start-shell'\)/);
});

test('las zonas de diagnóstico admiten pregunta personalizada', () => {
  assert.match(app, /zone-custom-question/);
  assert.match(app, /Enviar pregunta personalizada/);
});

test('los trabajos del encabezado y registro muestran tipo y texto multilínea', () => {
  assert.match(app, /meter-kind/);
  assert.match(css, /meter-head strong\{white-space:normal!important/);
  assert.match(css, /timeline-title\{white-space:normal/);
});

test('Liquid Glass reforzado mantiene reflejo táctil en controles flotantes', () => {
  assert.match(app, /function setupGlassSpecular\(\)/);
  assert.match(css, /glass-touch::after/);
  assert.match(css, /backdrop-filter:blur\(20px\) saturate\(180%\)/);
});
