const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
test('iOS rethink cambia arquitectura visual sin tocar persistencia',()=>{
 assert.match(app,/ios-home/); assert.match(app,/ios-detail-nav/); assert.match(app,/Diagnóstico<\/span>/); assert.match(app,/Historial<\/span>/); assert.match(app,/Ficha<\/span>/);
 assert.match(app,/K=\{settings:'thokar.settings',vehicles:'thokar.vehicles',chats:'thokar.chats',log:'thokar.log',draft:'thokar.draft'\}/);
 assert.match(css,/THOKAR — iOS rethink prototype 2/); assert.match(css,/backdrop-filter:blur\(32px\) saturate\(230%\)/);
});
