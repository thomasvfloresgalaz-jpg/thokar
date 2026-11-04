const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js','utf8');
const snippet = source.slice(source.indexOf('const partLabels='),source.indexOf('function renderChatMessage('));
function fakeApp(){
 let calls=0, fail=false, saved=0;
 const result={isConnected:true,innerHTML:'',insertAdjacentHTML(where,html){this.innerHTML=html+this.innerHTML}};
 const refresh={disabled:false,textContent:'',onclick:null};
 const state={vehicle:{plate:'BTST97',marca:'Toyota',modelo:'Yaris XLi 1.5',anio:'2009',motor:'1NZD229553',chasis:'JTDBT933294042685'},partsCache:{}};
 const context={state,plate:v=>v.plate,plateCore:p=>String(p),vehicleId:v=>v.plate,carName:v=>[v.marca,v.modelo].filter(Boolean).join(' '),
  save:()=>{saved++},
  esc:x=>String(x),
  cleanAiText:x=>String(x),
  icon:()=>'<svg></svg>',
  $$:()=>[],
  $:s=>s==='#aiResult'?result:refresh,
  openSheet:()=>{},toast:()=>{},
  aiRequest:async()=>{calls++;if(fail)throw new Error('Gemini no disponible');return JSON.stringify({aceite:'5W-30',filtroAceite:'Filtro a verificar',bujias:'Bujías a confirmar',refrigerante:'OAT'})}
 };
 vm.runInNewContext(snippet+'\nthis.api={partsSheet,savedPartsFor,storePartQuestion};',context);
 return {context,result,refresh,stats:()=>({calls,saved}),setFail:x=>fail=x};
}
test('cached parts result is reused when sheet reopened and saved across sessions',async()=>{
 const a=fakeApp();
 await a.context.api.partsSheet();
 assert.equal(a.stats().calls,1);
 assert.equal(a.context.state.partsCache.BTST97.recommendations.aceite,'5W-30');
 await a.context.api.partsSheet();
 assert.equal(a.stats().calls,1);
 assert.match(a.result.innerHTML,/Consulta guardada/);
 a.context.api.storePartQuestion(a.context.state.vehicle,'aceite','¿Por qué?','Por especificación y tolerancia');
 assert.equal(a.context.state.partsCache.BTST97.questions.aceite.answer,'Por especificación y tolerancia');
 await a.context.api.partsSheet();
 assert.equal(a.stats().calls,1);
 assert.match(a.result.innerHTML,/Por especificación y tolerancia/);
 assert.ok(a.stats().saved>=2);
});
test('changed motor warns without fetching; explicit refresh fetches and errors preserve prior results',async()=>{
 const a=fakeApp();
 await a.context.api.partsSheet();
 a.context.state.vehicle.motor='1NZD229554';
 await a.context.api.partsSheet();
 assert.equal(a.stats().calls,1);
 assert.match(a.result.innerHTML,/La ficha del vehículo cambió/);
 a.setFail(true);
 await a.context.api.partsSheet(true);
 assert.equal(a.stats().calls,2);
 assert.match(a.result.innerHTML,/Se mantienen los datos guardados/);
 assert.equal(a.context.state.partsCache.BTST97.recommendations.aceite,'5W-30');
});
