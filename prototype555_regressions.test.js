const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('5.5.5 limpia geometría de Hablar al cambiar de vista',()=>{const a=fs.readFileSync('./app.js','utf8');assert.match(a,/function clearTalkGeometry\(main\)/);assert.match(a,/removeProperty\('height'\)/);assert.match(a,/workspaceView==='talk'&&view!=='talk'/)});
test('5.5.5 ancla compositor al viewport',()=>{const c=fs.readFileSync('./styles.css','utf8'),a=fs.readFileSync('./app.js','utf8');assert.match(c,/workspace-main\.view-talk \.composer-wrap\{position:fixed/);assert.match(a,/--talk-overlay-bottom/);assert.match(a,/if\(screen==='workspace'&&workspaceView==='talk'\)requestAnimationFrame\(fitTalkWindow\)/)});
test('5.5.5 evita carreras de gota inferior',()=>{const a=fs.readFileSync('./app.js','utf8');assert.match(a,/navSpringGeneration/);assert.match(a,/generation!==navSpringGeneration\|\|!bar\.isConnected/);assert.match(a,/navSpringStop\(\)/)});
test('5.5.5 difiere fit de Hablar durante alineación',()=>{const a=fs.readFileSync('./app.js','utf8');assert.match(a,/setupTalkView\(\{deferFit:opts\.scroll!==false\}\)/);assert.match(a,/if\(!opts\.deferFit\)fitTalkWindow\(\)/)});
