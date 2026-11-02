const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const L = require('./lib.js');

test('la interfaz inicia con vehículos guardados y renderiza Inicio', () => {
  const store = {
    'thokar.vehicles': JSON.stringify({
      GZGJ74: { plate:'GZGJ74', marca:'GREAT WALL', modelo:'3', anio:'2015', combustible:'Gasolina', motor:'GW4D20', lastActivity:Date.now(), caseStatus:'Abierto' }
    }),
    'thokar.chats':'{}','thokar.log':'{}','thokar.settings':'{}','thokar.draft':'{}'
  };
  const el = () => ({ innerHTML:'', textContent:'', value:'', style:{setProperty(){},height:''}, classList:{add(){},remove(){},toggle(){}}, addEventListener(){}, querySelector(){return null}, setAttribute(){}, appendChild(){}, remove(){} });
  const app = el();
  const roots = {'#app':app,'#theme-color-meta':el(),'#overlay-root':el(),'#toast-root':el(),'#connection-root':el(),'#update-root':el()};
  const document = {querySelector:s=>roots[s]||null,querySelectorAll:()=>[],documentElement:{dataset:{},style:{setProperty(){}}},body:{classList:{add(){},remove(){}},appendChild(){}},addEventListener(){},visibilityState:'visible',createElement:()=>el(),startViewTransition:null};
  const c = {window:null,self:null,document,navigator:{storage:{persist:()=>Promise.resolve(true)}},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}},history:{replaceState(){},pushState(){},back(){}},location:{pathname:'/',search:'',href:'http://thokar.test/'},matchMedia:()=>({matches:false}),fetch:()=>Promise.reject(new Error('offline')),setTimeout:()=>1,clearTimeout(){},setInterval(){},clearInterval(){},URLSearchParams,TextDecoder,Blob,console,Date,Math,JSON,Object,Array,String,Number,RegExp,Promise,Error,encodeURIComponent,decodeURIComponent,innerHeight:800,addEventListener(){},removeEventListener(){},visualViewport:null};
  c.window=c; c.self=c; c.window.ThokarLib=L;
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('./app.js','utf8'), c, {filename:'app.js'});
  assert.equal(c.THOKAR_APP_READY, true);
  assert.match(app.innerHTML, /¿Qué vehículo vemos hoy\?/);
  assert.match(app.innerHTML, /GZGJ74/);
});
