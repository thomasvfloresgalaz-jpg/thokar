const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
test('live draggable sheet has pointer capture, motion and keyboard alternatives',()=>{
 assert.match(html,/class="sheet-handle" id="sheetHandle"/);
 assert.match(css,/touch-action:none/);
 assert.match(app,/sheetHandle.addEventListener\('pointerdown'/);
 assert.match(app,/sheetHandle.addEventListener\('pointermove',moveSheetHandle/);
 assert.match(app,/sheetHandle.addEventListener\('pointerup',finishSheetHandle/);
 assert.match(app,/sheetHandle.setPointerCapture/);
 assert.match(app,/e.key==='ArrowUp'/);
 assert.match(app,/e.key==='ArrowDown'/);
});
test('multiple independent snap heights and lower edge fixed to visual viewport',()=>{
 assert.match(app,/const compact=Math.min/);
 assert.match(app,/const expanded=available\*\.96/);
 assert.match(app,/const normal=Math.min/);
 assert.match(css,/height:var\(--zero-sheet-height,auto\)/);
 assert.match(css,/inset:var\(--zero-sheet-top\) 0 var\(--zero-sheet-bottom\) 0!important/);
});
test('no standalone system nav reserve, and close/drag state are reset properly',()=>{
 assert.doesNotMatch(css,/--zero-android-standalone-gap/);
 assert.doesNotMatch(css,/--zero-sheet-system-reserve/);
 assert.match(app,/sheetDrag=null;sheetPanel.classList.remove\('sheet-dragging'\)/);
 assert.match(app,/sheetObserver\?\.disconnect\(\)/);
});
test('latest cache and legacy storage keys remain unchanged for data migration',()=>{
 assert.match(html,/THOKAR ZERO 5\.3\.1/);
 assert.match(sw,/thokar-zero-5-3-1-20261104/);
 assert.equal(pkg.version,'5.3.1');
 for(const k of ['vehicles','archivedVehicles','logs','chats','recordDrafts','settings','partsCache'])assert.ok(app.includes(`thokar.zero2.${k}`),`Missing ${k}`);
});
