const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('5.5.6 no anula el transform de las gotas Liquid Glass',()=>{
  const c=fs.readFileSync('./styles.css','utf8');
  assert.doesNotMatch(c,/\.view-tab,\.segment-thumb,\.nav-drop\{transform:translateZ\(0\)/);
  assert.match(c,/\.nav-drop\{[\s\S]*?translateX\(calc\(var\(--nav-pos\) \* 100%\)\)/);
  assert.match(c,/\.segment-thumb\{transform:translateX\(calc\(var\(--segment-pos\) \* 100%\)\)/);
});

test('5.5.6 preserva el scroll antes de montar Hablar',()=>{
  const a=fs.readFileSync('./app.js','utf8');
  assert.match(a,/keepScroll=sc\?Number\(sc\.scrollTop\|\|0\):0/);
  assert.match(a,/main\.style\.setProperty\('min-height'/);
  assert.match(a,/sc\.scrollTop=keepScroll/);
  assert.match(a,/alignWorkspaceTabs\(false\)/);
});

test('5.5.6 ajusta Hablar al viewport sin mínimo forzado de 390px',()=>{
  const a=fs.readFileSync('./app.js','utf8');
  assert.match(a,/available=Math\.max\(260,Math\.floor\(bottom-top\)\)/);
  assert.doesNotMatch(a,/available=Math\.max\(390/);
  assert.match(a,/vv\?vv\.offsetTop:0/);
});

test('5.5.6 muestra kilometraje registrado como respaldo en la ficha',()=>{
  const a=fs.readFileSync('./app.js','utf8');
  assert.match(a,/cur\.km\|\|cur\.kmRegistrado/);
});

test('5.5.6 agrega tira Liquid Glass a la marca',()=>{
  const c=fs.readFileSync('./styles.css','utf8');
  assert.match(c,/\.workspace-brand\{[\s\S]*?backdrop-filter:blur\(18px\)/);
});
