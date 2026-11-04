const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
function extractedClipboardParser(){
  const a=app.indexOf('function parseClipboardVehicle');
  const b=app.indexOf('async function pasteVehicleData',a);
  assert.ok(a>=0&&b>a);
  return new Function(app.slice(a,b)+'\nreturn parseClipboardVehicle;')();
}
function extractedPlateCore(){
  const m=app.match(/const plateCore=p=>\{[\s\S]*?\};\nconst samePlate/);
  assert.ok(m);
  return new Function(m[0].replace(/;\nconst samePlate[\s\S]*/, '')+';return plateCore;')();
}
test('clipboard parser recognizes N°  Motor with extra spaces and tabs',()=>{
  const parse=extractedClipboardParser();
  const v=parse('Patente\tZV8756-4\nN°  Motor\tCDJA58365616\nN° Chasis\t9BFZF26N558365616');
  assert.equal(v.motor,'CDJA58365616');
  assert.equal(v.chasis,'9BFZF26N558365616');
});
test('old concatenated verifier digit and hyphenated verifier resolve to same plate',()=>{
  const core=extractedPlateCore();
  assert.equal(core('ZV9245-2'),'ZV9245');
  assert.equal(core('ZV92452'),'ZV9245');
  assert.equal(core('GZGJ74'),'GZGJ74');
});
test('swipe closes with a reverse transition instead of instantly hiding',()=>{
  assert.match(app,/swipe-closing/);
  assert.match(app,/transform \.34s cubic-bezier/);
  assert.match(css,/\.swipe-wrap\.swipe-closing \.swipe-delete\{opacity:1!important/);
  assert.match(app,/side==='delete'/);
  assert.match(app,/side==='archive'/);
  assert.match(app,/dx<-42\?'delete':\(arc&&dx>42\?'archive':null\)/);
});
test('vehicle deletion clears duplicate plate variants and avoids a full render',()=>{
  const start=app.indexOf('function confirmDeleteVehicle');
  const end=app.indexOf('function confirmDeleteLog',start);
  const fn=app.slice(start,end);
  assert.match(fn,/plateCore\(k\)===core\|\|plateCore\(plate\(vv\)\)===core/);
  assert.match(fn,/pruneVehicleRows\(core\)/);
  assert.doesNotMatch(fn,/render\(\)/);
});
test('record hour rate displays a peso affix',()=>{
  assert.match(app,/Hora hombre<div class="affix-input"><span>\$<\/span><input class="money-entry" id="rRate"/);
});
test('share message omits diagnosis completely when there is none',()=>{
  assert.match(app,/const diagnosisBlock=diagnosis\?`DIAGNÓSTICO/);
  assert.match(app,/:'';const intro=diagnosis\?/);
  assert.doesNotMatch(app,/Diagnóstico pendiente de confirmar/);
});
test('recommended parts use professional labels and contextual mini chats',()=>{
  assert.match(app,/filtroAceite:'Filtro de aceite'/);
  assert.match(app,/part-ask-toggle/);
  assert.match(app,/Preguntar a THOKAR/);
  assert.match(app,/mini-chat-close/);
  assert.match(css,/\.part-mini-chat\.open/);
});
test('vehicle tool stack has calmer precomposed light and dark surfaces',()=>{
  assert.match(css,/ZERO 5\.2 — reversible swipe/);
  assert.match(css,/\.tool-stack\{background:linear-gradient/);
  assert.match(css,/\.dark \.tool-stack\{background:#1b1b1e!important/);
});
test('ZERO 5.2 branding and service worker cache are bumped',()=>{
  assert.match(html,/THOKAR ZERO 5\.2/);
  assert.match(sw,/thokar-zero-5-2(?:-[123])?-2026110[234]/);
  assert.match(app,/ZERO · 5\.2/);
});
