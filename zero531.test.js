const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'), html=fs.readFileSync('index.html','utf8'), css=fs.readFileSync('styles.css','utf8');
const server=fs.readFileSync('server.js','utf8'),sw=fs.readFileSync('sw.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
test('compact header has title beside close and vehicle metadata in dedicated header',()=>{
 assert.match(html,/id="sheetChrome"/);assert.match(html,/id="sheetOverline"/);
 assert.match(html,/id="sheetRecordMeta"/);
 assert.match(html,/class="sheet-close" id="sheetClose"/);
 assert.match(app,/recordHeader:\{title:existing\?'Editar registro':'Registrar trabajo'/);
 assert.match(app,/sheetPanel\.classList\.toggle\('record-header-mode',!!header\)/);
 assert.match(app,/record-vehicle-name/);assert.match(app,/record-status/);
});
test('record state and plate are encoded safely; completed records are green',()=>{
 assert.match(app,/esc\(header\.plate\)/);
 assert.match(app,/header\.done\?'✓ Listo':'Pendiente'/);
 assert.match(css,/\.dark \.record-vehicle-name\{color:#fff\}/);
 assert.match(css,/\.record-status\.is-pending/);
 assert.match(css,/\.record-status\.is-done/);
});
test('other sheets retain close behavior and previous heights',()=>{
 assert.match(app,/const header=options\.recordHeader\|\|null/);
 assert.match(app,/\$\('#sheetOverline'\)\.textContent=header\?\.title\|\|''/);
 assert.match(app,/\$\('#sheetRecordMeta'\)\.innerHTML=header\?/);
 assert.match(app,/sheetHandle\.offsetHeight\+\$\('#sheetChrome'\)\.offsetHeight\+8/);
 assert.match(app,/function moveSheetHandle\(e\)/);
});
test('versioned assets and backend are synchronized without changing storage keys',()=>{
 assert.equal(pkg.version,'5.3.1');assert.equal(pkg.dependencies.express,'5.3.0');assert.match(html,/THOKAR ZERO 5\.3\.1/);
 assert.match(sw,/thokar-zero-5-3-1-20261104/);assert.match(server,/build: 'zero-5\.3\.1'/);
 for(const key of ['vehicles','logs','chats','recordDrafts','partsCache'])assert.ok(app.includes(`thokar.zero2.${key}`));
});
