const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('./app.js','utf8');
const html=fs.readFileSync('./index.html','utf8');
const sw=fs.readFileSync('./sw.js','utf8');

test('plantilla manual sincroniza motor y chasis con la ficha activa',()=>{
  assert.match(app,/if\(parsed\.chasis\)\{put\(cur\.manualIdentity,'chasis',parsed\.chasis\);put\(cur,'chasis',parsed\.chasis\)\}/);
  assert.match(app,/if\(parsed\.motor\)\{put\(cur\.manualIdentity,'motor',parsed\.motor\);put\(cur,'motor',parsed\.motor\)\}/);
});

test('Datos permite guardar kilometraje actual por patente',()=>{
  assert.match(app,/id=\"vehicle-km\"/);
  assert.match(app,/function saveVehicleKm\(\)/);
  assert.match(app,/db\.vehicles\[cur\.plate\]/);
});

test('Consultar abre búsqueda de patente y no duplica botón de búsqueda en Inicio',()=>{
  assert.match(app,/if\(t\.dataset\.nav==='consult'\)\{return openSearchSheet\(\)\}/);
  assert.doesNotMatch(app,/id=\"home-search-action\"/);
  assert.doesNotMatch(app,/id=\"empty-search\"/);
});

test('assets 5.5 usan el mismo bust de caché',()=>{
  assert.match(html,/styles\.css\?v=p5\d+/);
  assert.match(html,/app\.js\?v=p5\d+/);
  assert.match(sw,/styles\.css\?v=p5\d+/);
  assert.match(sw,/app\.js\?v=p5\d+/);
});
