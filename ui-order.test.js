const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('./app.js','utf8');

test('Datos muestra proveedor antes de datos confirmables y no duplica renderData',()=>{
  const count=(src.match(/function renderData\(\)\{/g)||[]).length;
  assert.equal(count,1);
  const start=src.indexOf('function renderData(){');
  const end=src.indexOf('function serviceItems(',start);
  const block=src.slice(start,end);
  assert.ok(block.indexOf('Datos del proveedor')>=0);
  assert.ok(block.indexOf('Datos confirmables')>=0);
  assert.ok(block.indexOf('Datos del proveedor')<block.indexOf('Datos confirmables'));
});
