const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('geometría de Hablar se limpia al cambiar de vista',()=>{const a=fs.readFileSync('./app.js','utf8');assert.match(a,/function clearTalkGeometry\(main\)/);assert.match(a,/\['height','max-height','min-height','position','top','bottom','left','right','width','z-index','margin'\]/);assert.match(a,/workspaceView==='talk'&&view!=='talk'/)});
test('5.6.2 compositor permanece dentro del grid del chat',()=>{const c=fs.readFileSync('./styles.css','utf8');assert.match(c,/grid-template-rows:auto minmax\(0,1fr\) auto!important/);assert.match(c,/\.composer-wrap\{grid-row:3;position:relative!important/)});
test('evita carreras de gota inferior',()=>{const a=fs.readFileSync('./app.js','utf8');assert.match(a,/navSpringGeneration/);assert.match(a,/generation!==navSpringGeneration\|\|!bar\.isConnected/);assert.match(a,/navSpringStop\(\)/)});
test('difiere fit de Hablar durante alineación',()=>{const a=fs.readFileSync('./app.js','utf8');assert.match(a,/setupTalkView\(\{deferFit:true\}\)/);assert.match(a,/if\(!opts\.deferFit\)fitTalkWindow\(\)/)});
