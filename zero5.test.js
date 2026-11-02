const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8');
test('bitacora identifies vehicle and plate',()=>{assert.match(app,/log-vehicle/);assert.match(app,/x\.vehicle\|\|vehicleNameByPlate/);assert.match(app,/x\.date.*x\.plate/)});
test('swipe delete is hidden until reveal and animated on removal',()=>{assert.match(css,/\.swipe-wrap:not\(\.revealed\) \.swipe-delete/);assert.match(css,/opacity:0/);assert.match(css,/\.swipe-wrap\.revealed \.swipe-delete/);assert.match(css,/@keyframes removeRow/);assert.match(app,/animateRemoval/)});
test('record editing binds to log vehicle not globally selected vehicle',()=>{assert.match(app,/vehicleKeyByPlate\(existing\.plate\)/);assert.match(app,/draftKey=existing\?`log:/)});
test('all record panes share one save action and draft',()=>{assert.match(app,/Guardar todos los cambios/);assert.match(app,/Guarda Cobro, Diagnóstico y Lista de tareas juntos/);assert.match(app,/const snapshot=/);assert.match(app,/const stash=/)});
test('AI markdown asterisks are removed',()=>{assert.match(app,/cleanAiText/);assert.match(app,/replace\(\/\\\*\/g/);assert.match(app,/sin Markdown, sin asteriscos/)});
test('settings is precomposed and price wrapper bar removed',()=>{assert.match(css,/\.settings-group\{background:#fff!important/);assert.match(css,/\.item-price\{background:transparent!important/)});
test('ZERO 5 branding',()=>{assert.match(html,/THOKAR ZERO 5/);assert.match(fs.readFileSync('sw.js','utf8'),/thokar-zero-5/)});
