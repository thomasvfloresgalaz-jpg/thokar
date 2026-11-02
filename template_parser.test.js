const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const L = require('./lib.js');

function boot(){
  const store={'thokar.vehicles':'{}','thokar.chats':'{}','thokar.log':'{}','thokar.settings':'{}','thokar.draft':'{}'};
  const el=()=>({innerHTML:'',textContent:'',value:'',style:{setProperty(){},height:''},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},querySelector(){return null},setAttribute(){},appendChild(){},remove(){}});
  const app=el();
  const roots={'#app':app,'#theme-color-meta':el(),'#overlay-root':el(),'#toast-root':el(),'#connection-root':el(),'#update-root':el()};
  const document={querySelector:s=>roots[s]||null,querySelectorAll:()=>[],documentElement:{dataset:{},style:{setProperty(){}}},body:{classList:{add(){},remove(){},contains(){return false}},appendChild(){}},addEventListener(){},visibilityState:'visible',createElement:()=>el(),startViewTransition:null};
  const c={window:null,self:null,document,navigator:{storage:{persist:()=>Promise.resolve(true)},deviceMemory:8,hardwareConcurrency:8,userAgent:'Chrome/156'},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}},history:{replaceState(){},pushState(){},back(){}},location:{pathname:'/',search:'',href:'http://thokar.test/'},matchMedia:()=>({matches:false}),fetch:()=>Promise.reject(new Error('offline')),setTimeout:()=>1,clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame:()=>1,performance:{now:()=>0},CSS:{supports:()=>false},URLSearchParams,TextDecoder,Blob,console,Date,Math,JSON,Object,Array,String,Number,RegExp,Promise,Error,encodeURIComponent,decodeURIComponent,innerHeight:800,addEventListener(){},removeEventListener(){},visualViewport:null};
  c.window=c;c.self=c;c.window.ThokarLib=L;
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('./app.js','utf8'),c,{filename:'app.js'});
  return c;
}

test('la plantilla tipo PatenteChile extrae motor, chasis y ficha técnica', () => {
  const c=boot();
  const raw=`| **Patente** | GZGJ74-5 |\n| **Tipo** | STATION WAGON |\n| **Marca** | GREAT WALL |\n| **Modelo** | HAVAL NEW H3 2.0 |\n| **Año** | 2015 |\n| **Color** | GRIS |\n| **N° [svg Motor](https://example.test)** | SNY0662 |\n| **N° Chasis** | 205000 |\n| **Procedencia** | CANADÁ |\n| **Fabricante** | GREAT WALL |\n| **Tipo de sello** | SELLO VERDE |\n| **Combustible** | GASOLINA |`;
  const v=c.THOKAR_PARSE_VEHICLE_TEMPLATE(raw);
  assert.equal(v.plate,'GZGJ74');
  assert.equal(v.motor,'SNY0662');
  assert.equal(v.chasis,'205000');
  assert.equal(v.procedencia,'CANADÁ');
  assert.equal(v.cilindrada,'2.0 L');
});

test('la plantilla móvil pegada en dos columnas extrae todos los datos importantes', () => {
  const c=boot();
  const raw=`Patente \tHTXW90-2
Tipo \tAUTOMOVIL
Marca \tMITSUBISHI
Modelo \tLANCER 2.4
Año \t2009
Color \tROJO
N°  Motor \t4B1200972
N° Chasis \tJA3AU86WX9U603075
Procedencia \tJAPAN
Fabricante \tMITSUBISHI CAR
Tipo de sello \tSELLO VERDE
Combustible \tGASOLINA`;
  const v=c.THOKAR_PARSE_VEHICLE_TEMPLATE(raw);
  assert.equal(v.plate,'HTXW90');
  assert.equal(v.tipo,'AUTOMOVIL');
  assert.equal(v.marca,'MITSUBISHI');
  assert.equal(v.modelo,'LANCER 2.4');
  assert.equal(v.cilindrada,'2.4 L');
  assert.equal(v.anio,'2009');
  assert.equal(v.color,'ROJO');
  assert.equal(v.motor,'4B1200972');
  assert.equal(v.chasis,'JA3AU86WX9U603075');
  assert.equal(v.procedencia,'JAPAN');
  assert.equal(v.fabricante,'MITSUBISHI CAR');
  assert.equal(v.tipoSello,'SELLO VERDE');
  assert.equal(v.combustible,'GASOLINA');
});
