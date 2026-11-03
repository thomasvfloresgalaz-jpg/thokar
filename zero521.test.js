const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),server=fs.readFileSync('server.js','utf8'),pkg=fs.readFileSync('package.json','utf8');

test('chat history and repaired archive are persisted separately',()=>{
  assert.match(app,/archivedVehicles:load\('thokar\.zero2\.archivedVehicles'/);
  assert.match(app,/chats:load\('thokar\.zero2\.chats'/);
  assert.match(app,/localStorage\.setItem\('thokar\.zero2\.chats'/);
  assert.match(app,/function saveChat\(v,history\)/);
  assert.doesNotMatch(app,/state\.chatHistory=\[\]/);
});

test('diagnostic chat restores per-vehicle history and each request owns its controller',()=>{
  assert.match(app,/let history=\[\.\.\.chatFor\(v\)\]/);
  assert.match(app,/async function aiConversationRequest\(v,history\)\{const ctl=new AbortController\(\)/);
  assert.match(app,/state\.aiBusy\[key\]=true/);
  assert.match(app,/finally\{finishBusy\(\)/);
  assert.match(app,/history\.slice\(-14\)/);
});

test('automatic diagnosis updates only newest pending work',()=>{
  const a=app.indexOf('function updatePendingDiagnosis');
  const b=app.indexOf('async function useMessageAsTasks',a);
  const fn=app.slice(a,b);
  assert.match(fn,/state\.logs\.find\(x=>samePlate\(x\.plate,plate\(v\)\)&&x\.status==='open'\)/);
  assert.match(fn,/pending\.diagnosis=clean/);
  assert.doesNotMatch(fn,/status==='done'/);
});

test('task list changes only after explicit user action',()=>{
  assert.match(app,/Usar como lista de tareas/);
  assert.match(app,/async function useMessageAsTasks/);
  assert.match(app,/v\._manualTasks=tasks/);
  assert.doesNotMatch(app,/taskLines=text\.split/);
  assert.doesNotMatch(app,/_aiTasks/);
});

test('vehicle screen exposes its own registered jobs',()=>{
  assert.match(app,/Trabajos registrados/);
  assert.match(app,/function vehicleJobsSheet/);
  assert.match(app,/state\.logs\.filter\(x=>samePlate\(x\.plate,plate\(v\)\)\)/);
  assert.match(css,/\.vehicle-job-row/);
});

test('repaired vehicles can be archived, viewed and automatically reactivated by lookup',()=>{
  assert.match(app,/Vehículos reparados/);
  assert.match(app,/function archiveCurrentVehicle/);
  assert.match(app,/function reactivateVehicle/);
  assert.match(app,/const archived=findArchivedByPlate\(p\);if\(archived\)\{reactivateVehicle\(p,true\);return\}/);
  assert.match(app,/Marca los trabajos pendientes como Listo antes de archivar/);
  assert.match(css,/\.archive-entry/);
});

test('permanent vehicle deletion clears active archive logs chats and drafts',()=>{
  const a=app.indexOf('function confirmDeleteVehicle');
  const b=app.indexOf('function confirmDeleteLog',a);
  const fn=app.slice(a,b);
  assert.match(fn,/\[state\.vehicles,state\.archivedVehicles\]/);
  assert.match(fn,/state\.logs=state\.logs\.filter/);
  assert.match(fn,/delete state\.chats\[core\]/);
  assert.match(fn,/state\.recordDrafts/);
});

test('parts recommendations explicitly prioritize engine number',()=>{
  assert.match(app,/NÚMERO DE MOTOR/);
  assert.match(app,/PRIORIZA el número de motor como dato principal/);
  assert.match(app,/número de motor prioritario/);
});

test('current branding cache and backend build are bumped',()=>{
  assert.match(html,/THOKAR ZERO 5\.2\.2/);
  assert.match(app,/ZERO · 5\.2\.2/);
  assert.match(sw,/thokar-zero-5-2-2-20261103/);
  assert.match(sw,/app\.js\?v=zero522/);
  assert.match(server,/build: 'zero-5\.2\.2'/);
  assert.match(pkg,/"version": "0\.5\.2-2"/);
});
