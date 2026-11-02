const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const app=fs.readFileSync('app.js','utf8');const sw=fs.readFileSync('sw.js','utf8');const html=fs.readFileSync('index.html','utf8');
test('mensaje cliente incluye diagnóstico antes del cobro',()=>{const d=app.indexOf('DIAGNÓSTICO');const c=app.indexOf('SERVICIO Y COBRO');assert.ok(d>=0&&c>d)});
test('solo efectivo y transferencia con datos bancarios',()=>{assert.match(app,/Efectivo/);assert.match(app,/Transferencia bancaria/);assert.match(app,/22\.073\.929-5/);assert.match(app,/Banco de Chile/);assert.match(app,/00-448-11414-03/);assert.match(app,/\(Opcional\) Correo/)});
test('branding ZERO 4.1 y cache propio',()=>{assert.match(html,/THOKAR ZERO 4\.1/);assert.match(sw,/thokar-zero-4\.1/)});
