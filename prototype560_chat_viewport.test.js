const fs=require('fs');const assert=require('assert');const css=fs.readFileSync('styles.css','utf8');const js=fs.readFileSync('app.js','utf8');
assert(js.includes("setProperty('height',available+'px','important')"));
assert(js.includes("setProperty('max-height',available+'px','important')"));
assert(js.includes('setupTalkGeometryObserver'));
assert(css.includes('grid-template-rows:auto minmax(0,1fr)'));
assert(css.includes('left:18px!important;right:18px!important;width:auto!important'));
console.log('prototype 5.6.0 chat viewport regression checks passed');
