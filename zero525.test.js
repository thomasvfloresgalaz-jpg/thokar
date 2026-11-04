const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
test('all sheets use visual viewport anchored overlay rather than hard-coded 90dvh',()=>{
 assert.match(css,/\.modal-backdrop\{\s*inset:auto 0 var\(--zero-sheet-bottom\) 0!important;/);
 assert.match(css,/top:var\(--zero-sheet-top\)!important/);
 assert.match(css,/max-height:calc\(100% - max\(12px, env\(safe-area-inset-top, 0px\)\)\)!important/);
 assert.match(app,/function syncSheetViewport\(\)/);
 assert.match(app,/window\.innerHeight-vv\.height-vv\.offsetTop/);
});
test('sheet inner body scrolls, close button remains separate and log actions stay pinned',()=>{
 assert.match(html,/class="sheet-close" id="sheetClose"/);
 assert.match(html,/id="sheetBody"/);
 assert.match(css,/#sheetBody\{\s*flex:0 1 auto;/);
 assert.match(css,/overflow-y:auto;/);
 assert.match(css,/\.bottom-sheet\.sheet-has-actions \.sheet-actions\{\s*position:sticky;/);
 assert.match(app,/sheet-has-actions/);
});
test('visual viewport listeners track keyboard and screen changes without rerendering vehicles',()=>{
 assert.match(app,/window\.visualViewport\.addEventListener\('resize',syncSheetViewport/);
 assert.match(app,/window\.visualViewport\.addEventListener\('scroll',syncSheetViewport/);
 const f=app.slice(app.indexOf('function syncSheetViewport'),app.indexOf('function openSheet'));
 assert.match(f,/sheet\.scrollTop/);
 assert.doesNotMatch(f,/render\(\)/);
});
test('opening new sheet cancels closing timer and reset scroll position',()=>{
 const f=app.slice(app.indexOf('function openSheet'),app.indexOf('function openThemePicker'));
 assert.match(f,/clearTimeout\(sheetCloseTimer\)/);
 assert.match(f,/panel\.scrollTop=0;sheet\.scrollTop=0;/);
 assert.match(f,/backdrop\.classList\.remove\('closing'\)/);
});
