const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
test('sheets are anchored to the visual viewport, with no 48px fake navigation reserve',()=>{
 assert.match(css,/\.modal-backdrop\{position:fixed!important;inset:var\(--zero-sheet-top\) 0 var\(--zero-sheet-bottom\) 0!important;/);
 assert.match(app,/function syncSheetViewport\(\)/);
 assert.match(app,/window\.innerHeight-vv\.height-vv\.offsetTop/);
 assert.doesNotMatch(css,/--zero-sheet-system-reserve/);
});
test('body scroll and footer are separate, with accessible header and draggable handle',()=>{
 assert.match(html,/class="sheet-close" id="sheetClose"/);
 assert.match(html,/id="sheetBody"/);
 assert.match(html,/id="sheetFooter"/);
 assert.match(html,/id="sheetHandle"/);
 assert.match(css,/#sheetBody\{[^}]*overflow-y:auto/);
 assert.match(css,/\.sheet-footer\{[^}]*flex:0 0 auto/);
 assert.match(app,/sheetFooter\.appendChild\(actions\)/);
});
test('visible viewport updates keyboard positioning without full UI rebuild',()=>{
 assert.match(app,/window\.visualViewport\.addEventListener\('resize',syncSheetViewport/);
 assert.match(app,/window\.visualViewport\.addEventListener\('scroll',syncSheetViewport/);
 const f=app.slice(app.indexOf('function syncSheetViewport'),app.indexOf('function queueSheetMeasure'));
 assert.match(f,/sheet\.scrollTop/);
 assert.doesNotMatch(f,/render\(\)/);
});
test('reopening a sheet cancels pending close and resets its height and scroll',()=>{
 const f=app.slice(app.indexOf('function openSheet'),app.indexOf('function openThemePicker'));
 assert.match(f,/clearTimeout\(sheetCloseTimer\)/);
 assert.match(f,/sheet\.scrollTop=0/);
 assert.match(f,/sheetSnap='normal'/);
 assert.match(f,/sheetNatural=0/);
 assert.match(f,/backdrop\.classList\.remove\('closing','ready'\)/);
});
