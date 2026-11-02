const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8');
test('RC1 deja una sola familia de accesos rápidos: Partes del vehículo',()=>{const fn=app.slice(app.indexOf('function renderQuickStart'),app.indexOf('function renderCarPanel'));assert.doesNotMatch(fn,/visual-quick-grid/);assert.match(fn,/renderCarPanel\(\)/);assert.match(app,/Partes del vehículo/)});
test('RC1 usa placa rectangular en apertura y una pausa mayor',()=>{assert.match(html,/class="launch-panel"/);assert.match(html,/\},1050\)/);assert.match(html,/\},2650\)/);assert.match(css,/\.launch-panel\{/)});
test('RC1 refuerza vidrio de Día y no degrada modo Completo por rendimiento',()=>{assert.match(css,/data-theme="dia"[\s\S]*blur\(30px\) saturate\(210%\)/);assert.match(app,/glassEffects\|\|'complete'\)==='complete'\)return/)});
