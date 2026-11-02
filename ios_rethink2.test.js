const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
test('navegación y distribución son nuevas',()=>{assert.match(app,/>Taller<\/span>/);assert.match(app,/>Buscar<\/span>/);assert.match(app,/>Historial<\/span>/);assert.match(app,/>Ajustes<\/span>/);assert.match(app,/ios-vehicle-row/);assert.doesNotMatch(app,/¿Qué vehículo vemos hoy\?/)});
test('transición evita blur de página y vidrio masivo en historial',()=>{assert.match(css,/@keyframes iosFastIn/);assert.match(css,/content-visibility:auto/);assert.match(css,/timeline-item[^}]*backdrop-filter:none/s)});
