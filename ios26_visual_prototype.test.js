const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8'),app=fs.readFileSync('app.js','utf8');
test('iOS prototype has complete visual replacement layer',()=>{assert.match(css,/THOKAR iOS 26 EXPERIMENT/);assert.match(css,/--ios-bg:#f2f2f7/);assert.match(css,/backdrop-filter:blur\(28px\) saturate\(180%\)/);assert.match(css,/liquid-tabbar[\s\S]*position:fixed!important/)});
test('iOS prototype preserves core data and pricing logic',()=>{assert.match(app,/thokar\.vehicles/);assert.match(app,/function openQuote\(\)/);assert.match(app,/function renderData\(\)/);assert.match(app,/function renderTalk\(\)/)});
