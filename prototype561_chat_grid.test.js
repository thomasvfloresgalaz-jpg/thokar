const test=require('node:test'); const assert=require('node:assert/strict'); const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8'), app=fs.readFileSync('app.js','utf8');
test('5.6.1 chat uses in-flow grid composer instead of viewport overlay',()=>{assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto!important/);assert.match(css,/\.composer-wrap\{grid-row:3;position:relative!important/)});
test('5.6.1 bottom nav is centered and capped at 520px',()=>{assert.match(css,/width:min\(calc\(100% - 28px\),520px\)!important/);assert.match(css,/left:50%!important/)});
test('5.6.1 locks outer workspace while talk is active',()=>{assert.match(app,/workspaceView==='talk'.*workspaceTabsTarget\(\)/s)});
