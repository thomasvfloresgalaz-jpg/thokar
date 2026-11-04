const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const html=fs.readFileSync('index.html','utf8');
test('parts recommendations persist per vehicle',()=>{
 assert.match(app,/function savePartsCache\(v,data\)/);
 assert.match(app,/_partsRecommendations=\{signature:/);
 assert.match(app,/persistVehicle\(v\)/);
});
test('stored recommendations load without calling AI and can refresh manually',()=>{
 assert.match(app,/cache&&cache\.signature===signature&&!forceRefresh/);
 assert.match(app,/renderPartsCards\(v,cache\.data/);
 assert.match(app,/Actualizar recomendaciones/);
 assert.match(app,/partsSheet\(true\)/);
});
test('old cache is fallback when refresh fails',()=>{
 assert.match(app,/if\(cache&&cache\.data\)/);
 assert.match(app,/Se muestran las recomendaciones guardadas/);
});
test('updated cache and favicon version',()=>{
 assert.match(sw,/thokar-zero-5-2-3-20261104/);
 assert.match(sw,/app\.js\?v=zero523/);
 assert.match(html,/rel="icon"/);
 assert.match(html,/THOKAR ZERO 5\.2\.3/);
});
test('light and dark tool card glare is reduced',()=>{
 assert.match(css,/ZERO 5\.2\.3 — cached parts and softer ambient highlight/);
 assert.match(css,/\.dark \.settings-group/);
});
