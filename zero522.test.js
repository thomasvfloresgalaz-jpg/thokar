const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),server=fs.readFileSync('server.js','utf8'),pkg=fs.readFileSync('package.json','utf8');

test('pending diagnosis hot-sync also refreshes stale record draft',()=>{
  const a=app.indexOf('function updatePendingDiagnosis');
  const b=app.indexOf('async function useMessageAsTasks',a);
  const fn=app.slice(a,b);
  assert.match(fn,/x\.status==='open'/);
  assert.match(fn,/pending\.diagnosis=clean/);
  assert.match(fn,/state\.recordDrafts\[`log:\$\{pending\.id\}`\]/);
  assert.match(fn,/logDraft\.diagnosis=clean/);
  assert.doesNotMatch(fn,/status==='done'/);
});

test('chat falls back to visible AI response if diagnostic summary marker is absent',()=>{
  assert.match(app,/updatePendingDiagnosis\(v,dm\?\.\[1\]\|\|visible\)/);
});

test('existing pending record can recover vehicle AI diagnosis when legacy draft is blank',()=>{
  assert.match(app,/x\.diagnosis\|\|\(x\.status!=='done'\?v\._aiDiagnosis:''\)\|\|''/);
});

test('active vehicle rows expose mirrored archive and delete actions',()=>{
  assert.match(app,/swipe-archive archive-vehicle-row/);
  assert.match(app,/data-archive-vehicle/);
  assert.match(app,/dx<-42\?'delete':\(arc&&dx>42\?'archive':null\)/);
  assert.match(css,/\.swipe-archive\{/);
  assert.match(css,/background:#64d2ff/);
  assert.match(css,/\.swipe-wrap\.archiving/);
});

test('archive shelf is hidden by default and revealed by a strong upward gesture',()=>{
  assert.match(app,/id="archivePeek"/);
  assert.match(app,/dy<-90&&speed>\.5/);
  assert.match(app,/revealArchivePeek/);
  assert.match(css,/\.archive-peek\{/);
  assert.match(css,/opacity:0;pointer-events:none/);
  assert.match(css,/\.archive-peek\.shown/);
});

test('archiving is non destructive while deletion remains destructive',()=>{
  assert.match(app,/function archiveVehicleByPlate/);
  assert.match(app,/state\.archivedVehicles\[plate\(stored\)\]=stored/);
  const d0=app.indexOf('function confirmDeleteVehicle');
  const d1=app.indexOf('function confirmDeleteLog',d0);
  const del=app.slice(d0,d1);
  assert.match(del,/state\.logs=state\.logs\.filter/);
  assert.match(del,/delete state\.chats/);
});

test('ZERO 5.2.2 branding and cache are consistent',()=>{
  assert.match(html,/THOKAR ZERO 5\.2\.3/);
  assert.match(app,/ZERO · 5\.2\.3/);
  assert.match(sw,/thokar-zero-5-2-3-20261104/);
  assert.match(sw,/app\.js\?v=zero523/);
  assert.match(server,/build: 'zero-5\.2\.3'/);
  assert.match(pkg,/"version": "0\.5\.2-3"/);
});
