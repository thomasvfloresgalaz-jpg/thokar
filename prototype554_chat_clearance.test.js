const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Hablar reserva dinámicamente el espacio ocupado por la barra inferior',()=>{
  const app=fs.readFileSync('./app.js','utf8');
  const css=fs.readFileSync('./styles.css','utf8');
  assert.match(app,/--chat-nav-clearance/);
  assert.match(app,/mainRect\.bottom-freshNavTop\+14/);
  assert.match(css,/composer-wrap\{[\s\S]*bottom:calc\(8px \+ var\(--chat-nav-clearance\)\)/);
  assert.match(css,/talk-thread\{[\s\S]*padding-bottom:calc\(96px \+ var\(--chat-nav-clearance\)\)/);
  assert.match(css,/keyboard-open \.workspace-main\.view-talk\{--chat-nav-clearance:0px!important\}/);
});
