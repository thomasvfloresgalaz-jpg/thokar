const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Hablar reserva el espacio real de la barra inferior sin inflar el contenido',()=>{
  const app=fs.readFileSync('./app.js','utf8');
  const css=fs.readFileSync('./styles.css','utf8');
  assert.match(app,/freshNavTop=freshNav/);
  assert.match(app,/--chat-nav-clearance','0px'/);
  assert.match(app,/--talk-overlay-bottom/);
  assert.match(css,/workspace-main\.view-talk \.composer-wrap\{position:fixed/);
  assert.match(css,/workspace-main\.view-talk \.talk-thread\{[\s\S]*padding-bottom:112px/);
  assert.match(css,/keyboard-open \.workspace-main\.view-talk \.composer-wrap\{bottom:8px\}/);
});
