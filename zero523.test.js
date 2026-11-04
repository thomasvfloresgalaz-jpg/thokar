const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const server=fs.readFileSync('server.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
test('parts recommendations are stored by vehicle identity, not requested every time',()=>{
 assert.match(js,/partsCache:load\('thokar\.zero2\.partsCache'/);
 assert.match(js,/state\.partsCache\[vehicleId\(v\)\]/);
 assert.match(js,/function storePartsFor\(/);
 assert.match(js,/if\(cached\?\.recommendations&&!force\)\{renderPartsFor\(v,cached,result\);return\}/);
 assert.match(js,/function partsSheet\(force=false\)/);
});
test('old recommendations survive when context changes or Gemini refresh fails',()=>{
 assert.match(js,/data\.identity!==partsIdentity\(v\)/);
 assert.match(js,/La ficha del vehículo cambió/);
 assert.match(js,/Se mantienen los datos guardados/);
 assert.match(js,/Actualizar recomendaciones/);
 assert.match(js,/state\.partsCache/);
});
test('mini chat is saved and deletion also removes parts cache',()=>{
 assert.match(js,/function storePartQuestion/);
 assert.match(js,/saved\.questions\[key\]/);
 assert.match(js,/renderSavedPartQuestion\(data\.questions\?\.\[k\]\)/);
 assert.match(js,/delete state\.partsCache\[k\]/);
});
test('ambient background is behind readable cards and fade opacity does not wash them out',()=>{
 assert.match(css,/\.ambient\{z-index:0!important/);
 assert.match(css,/\.content\{position:relative;z-index:1/);
 assert.match(css,/@keyframes zero524Slide\{from\{opacity:1/);
 assert.match(css,/\.dark \.data-card,\.dark \.tool-stack/);
});
test('THOKAR supplied logo, app icons and browser favicon included',()=>{
 assert.match(html,/favicon-48\.png\?v=zero530/);
 assert.match(html,/THOKAR ZERO 5\.3\.0/);
 assert.match(sw,/favicon-48\.png/);
 assert.match(sw,/thokar-zero-5-3-0-20261104/);
 assert.match(server,/build: 'zero-5\.3\.0'/);
 assert.ok(manifest.icons.some(x=>x.sizes==='192x192'));
 assert.ok(manifest.icons.some(x=>x.sizes==='512x512'));
 for(const f of ['thokar-logo.png','favicon-48.png','icon-192.png','icon-512.png'])assert.ok(fs.statSync(f).size>100);
});
