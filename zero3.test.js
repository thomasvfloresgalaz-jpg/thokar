const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),server=fs.readFileSync('server.js','utf8'),sw=fs.readFileSync('sw.js','utf8');
test('ficha precede herramientas and includes clipboard parser',()=>{assert.ok(app.indexOf('ficha-card')<app.indexOf('tool-stack'));assert.match(app,/Pegar datos/);assert.match(app,/Número de motor/);assert.match(app,/VIN \/ Chasis/);assert.match(app,/Año/);});
test('record is itemized and live',()=>{assert.match(app,/partsItems/);assert.match(app,/materialItems/);assert.match(app,/addEventListener\('input',calc\)/);assert.match(app,/Tipo de descuento/);});
test('log can edit share and status',()=>{assert.match(app,/Editar/);assert.match(app,/Compartir/);assert.match(app,/Descuento THOKAR/);assert.match(app,/toggleLog/);});
test('chat has animated thinking and retry',()=>{assert.match(app,/thinking/);assert.match(app,/retry-ai/);assert.match(css,/@keyframes typing/);assert.match(css,/glass-composer/);});
test('no horizontal record scrolling',()=>{assert.match(css,/overflow-x:hidden/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);});
test('gemini uses supported endpoint with current fallback',()=>{assert.match(server,/generateContent/);assert.match(server,/gemini-flash-latest/);assert.match(server,/x-goog-api-key/);});
test('cache is zero3',()=>assert.match(sw,/thokar-ios-zero-3/));
