const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8');
test('1.0 mantiene Inicio al abrir un vehículo guardado desde Inicio',()=>{assert.match(app,/\(screen==='home'\)\?'home'/)});
test('1.0 reemplaza auto decorativo y sistemas por PNG locales',()=>{assert.match(app,/assets\/car-side\.png/);for(const n of ['engine','brakes','suspension','steering','battery','transmission','cooling','fuel'])assert.ok(fs.existsSync('assets/'+n+'.png'),n)});
test('1.0 añade apertura THOKAR y Liquid Glass reforzado',()=>{assert.match(html,/id="launch-splash"/);assert.match(css,/\.launch-splash/);assert.match(css,/backdrop-filter:blur\(26px\) saturate\(190%\)/)});
