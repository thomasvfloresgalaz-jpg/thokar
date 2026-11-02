const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Hablar reserva el espacio real de la barra inferior sin inflar el contenido',()=>{
  const app=fs.readFileSync('./app.js','utf8');
  const css=fs.readFileSync('./styles.css','utf8');
  assert.match(app,/nr=nav\?nav\.getBoundingClientRect\(\):null/);
  assert.match(app,/setProperty\('height',available\+'px','important'\)/);
  assert.match(app,/setProperty\('max-height',available\+'px','important'\)/);
  assert.match(css,/workspace-main\.view-talk \.composer-wrap\{[\s\S]*?position:relative!important/);
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\)/);
});
