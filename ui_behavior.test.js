const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('./app.js','utf8');
const css=fs.readFileSync('./styles.css','utf8');

test('cambiar Hablar Registro Datos no re-renderiza todo el workspace',()=>{
  assert.match(app,/function mountWorkspaceView\(/);
  assert.match(app,/if\(t\.dataset\.view\)\{[^}]*mountWorkspaceView\(t\.dataset\.view/);
  assert.doesNotMatch(app,/if\(t\.dataset\.view\)\{[^}]*render\(\)/);
});

test('Hablar usa scroll interno y el compositor vive dentro de la ventana',()=>{
  assert.match(css,/\.talk-thread\{[^}]*overflow-y:auto/);
  assert.match(css,/\.composer-wrap\{position:absolute/);
  assert.match(css,/\.workspace-main\.talk-shell\{[^}]*height:max/);
});

test('buscar patente abre hoja completa adaptada al teclado',()=>{
  assert.match(app,/openSearchSheet\(\)[\s\S]*?\{full:true\}/);
  assert.match(css,/\.overlay\{[^}]*height:var\(--vh\)/);
});
