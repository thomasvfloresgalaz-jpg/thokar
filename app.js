(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 home:'<svg viewBox="0 0 24 24"><path d="M3.5 11.2 12 4l8.5 7.2v8.3H15v-5H9v5H3.5z"/></svg>',
 car:'<svg viewBox="0 0 24 24"><path d="M5 15.5v-4l1.8-4.3A2 2 0 0 1 8.6 6h6.8a2 2 0 0 1 1.8 1.2l1.8 4.3v4"/><path d="M3.5 15.5h17v3h-3v-1.5h-11v1.5h-3z"/><path d="M7 11.5h10"/></svg>',
 list:'<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.1"/><path d="M9.7 3.2h4.6l.7 2.1c.5.2 1 .5 1.4.8l2.1-.5 2.3 4-1.5 1.6v1.6l1.5 1.6-2.3 4-2.1-.5c-.4.3-.9.6-1.4.8l-.7 2.1H9.7L9 18.7c-.5-.2-1-.5-1.4-.8l-2.1.5-2.3-4 1.5-1.6v-1.6L3.2 9.6l2.3-4 2.1.5c.4-.3.9-.6 1.4-.8z"/></svg>',
 search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
 spark:'<svg viewBox="0 0 24 24"><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
 chat:'<svg viewBox="0 0 24 24"><path d="M20 11.6c0 4.4-3.6 7.9-8 7.9-1.1 0-2.3-.2-3.3-.7L4 20l1.3-4c-.8-1.2-1.3-2.7-1.3-4.4C4 7.2 7.6 4 12 4s8 3.2 8 7.6z"/><path d="M8 11.6h8"/></svg>',
 note:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>',
 paste:'<svg viewBox="0 0 24 24"><rect x="6" y="5" width="13" height="16" rx="2"/><path d="M9 5V3h7v4H9zM3 8v10a2 2 0 0 0 2 2"/></svg>',
 reload:'<svg viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></svg>',
 share:'<svg viewBox="0 0 24 24"><path d="M12 15V3m0 0L8 7m4-4 4 4"/><path d="M5 11v8h14v-8"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'};
const icon=n=>icons[n]||icons.note;
$$('[data-icon]').forEach(x=>x.innerHTML=icon(x.dataset.icon));
const oldSettings=(()=>{try{return JSON.parse(localStorage.getItem('thokar.settings')||'{}')}catch{return{}}})();
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const state={screen:'home',chatVehicleId:null,chatErrors:{},vehicle:null,viewingArchived:false,vehicles:load('thokar.zero2.vehicles',{}),archivedVehicles:load('thokar.zero2.archivedVehicles',{}),logs:load('thokar.zero2.logs',[]),chats:load('thokar.zero2.chats',{}),settings:Object.assign({theme:'light',hourRate:20000,travel:0,appToken:oldSettings.appToken||''},load('thokar.zero2.settings',{})),logFilter:'open',logDirection:1,recordDrafts:load('thokar.zero2.recordDrafts',{}),partsCache:load('thokar.zero2.partsCache',{}),aiBusy:{}};
const content=$('#content'),title=$('#pageTitle'),backdrop=$('#modalBackdrop'),sheet=$('#sheetBody');
function save(){localStorage.setItem('thokar.zero2.vehicles',JSON.stringify(state.vehicles));localStorage.setItem('thokar.zero2.archivedVehicles',JSON.stringify(state.archivedVehicles));localStorage.setItem('thokar.zero2.logs',JSON.stringify(state.logs));localStorage.setItem('thokar.zero2.chats',JSON.stringify(state.chats));localStorage.setItem('thokar.zero2.recordDrafts',JSON.stringify(state.recordDrafts));localStorage.setItem('thokar.zero2.settings',JSON.stringify(state.settings));localStorage.setItem('thokar.zero2.partsCache',JSON.stringify(state.partsCache))}
function auth(){const h={Accept:'application/json'};if(state.settings.appToken)h['X-THOKAR-TOKEN']=state.settings.appToken;return h}
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CL');
const plateCore=p=>{const raw=String(p??'').toUpperCase().trim().replace(/\s+/g,'');const clean=(raw.includes('-')?raw.split('-')[0]:raw).replace(/[^A-Z0-9]/g,'');return !raw.includes('-')&&clean.length===7&&/^[A-Z]{2,4}[A-Z0-9]{2,4}[0-9K]$/.test(clean)?clean.slice(0,-1):clean};
const samePlate=(a,b)=>!!plateCore(a)&&plateCore(a)===plateCore(b);
const prettyInt=v=>{const raw=String(v??'').replace(/\D/g,'');if(!raw)return'';const n=Number(raw)||0;return n>=1000?n.toLocaleString('es-CL'):String(n)};
const todayISO=()=>{const d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${d.getFullYear()}-${m}-${day}`};
const displayDate=iso=>{if(!iso)return'';const [y,m,d]=String(iso).split('-').map(Number);if(!y||!m||!d)return String(iso);return new Date(y,m-1,d).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}).replace(/\./g,'').toUpperCase()};
const cleanAiText=s=>String(s??'').replace(/\*/g,'').replace(/__+/g,'').replace(/^\s*#{1,6}\s+/gm,'').trim();
// Cilindrada deducida solo cuando el modelo contiene una cifra decimal aislada.
// No confundir 4X4, 16V, años o códigos de variante con cilindradas.
function cylinderFromModel(model){
 const text=String(model||'').toUpperCase();
 const hits=[...text.matchAll(/(?:^|[^A-Z0-9])([0-7][.,][0-9])(?=\s|$|[/-]|L\b|T\b)/g)]
  .map(m=>m[1].replace(',','.')).filter(x=>{const n=Number(x);return n>=.7&&n<=7.9});
 const unique=[...new Set(hits)];return unique.length===1?`${unique[0]} L`:'';
}
const carName=v=>[v?.marca,v?.modelo].filter(Boolean).join(' ')||'Vehículo';
const plate=v=>v?.plate||v?.patente||'—';
const vehicleId=v=>plateCore(plate(v));
const chatFor=v=>state.chats[vehicleId(v)]||[];
function saveChat(v,history){const id=vehicleId(v);if(!id)return;state.chats[id]=history.slice(-80);save()}
function findArchivedByPlate(p){const core=plateCore(p);const key=Object.keys(state.archivedVehicles).find(k=>plateCore(k)===core||plateCore(plate(state.archivedVehicles[k]))===core);return key?{key,vehicle:state.archivedVehicles[key]}:null}
function findActiveByPlate(p){const core=plateCore(p);const key=Object.keys(state.vehicles).find(k=>plateCore(k)===core||plateCore(plate(state.vehicles[k]))===core);return key?{key,vehicle:state.vehicles[key]}:null}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('#toast').classList.remove('show'),2600)}
function applyTheme(){document.body.classList.toggle('dark',state.settings.theme==='dark');document.querySelector('meta[name=theme-color]').content=state.settings.theme==='dark'?'#000000':'#f2f2f7'}applyTheme();
function go(s){if(s==='log')state.logFilter='open';state.screen=s;render();requestAnimationFrame(moveLens);scrollTo({top:0,behavior:'instant'})}
function moveLens(){const active=$('.dock-item.active'),lens=$('#dockLens');if(!active){lens.classList.remove('visible');return}const d=$('#dock').getBoundingClientRect(),a=active.getBoundingClientRect();lens.style.width=a.width+'px';lens.style.transform=`translate3d(${a.left-d.left}px,0,0)`;lens.classList.add('visible')}
function render(){const names={home:'Resumen',cars:'Vehículos',archive:'Reparados',new:'Nueva atención',log:'Bitácora',settings:'Ajustes',vehicle:'Vehículo',chats:'Chats',conversation:'Chat'};title.textContent=names[state.screen];$$('.dock-item').forEach(b=>b.classList.toggle('active',b.dataset.go===state.screen));let html='';if(state.screen==='home')html=home();if(state.screen==='cars')html=cars();if(state.screen==='archive')html=archiveScreen();if(state.screen==='new')html=lookup();if(state.screen==='log')html=log();if(state.screen==='settings')html=settings();if(state.screen==='vehicle')html=vehicle();if(state.screen==='chats')html=chatsScreen();if(state.screen==='conversation')html=conversationScreen();document.body.classList.toggle('conversation-view',state.screen==='conversation');syncChatViewport();content.innerHTML=`<section class="screen active">${html}</section>`;bind();if(state.screen==='conversation')bindConversation();requestAnimationFrame(moveLens)}
function home(){const vs=Object.values(state.vehicles),archived=Object.values(state.archivedVehicles);return `<article class="hero glass"><div class="status"><i></i>Listo para trabajar</div><h2>¿Qué auto vemos hoy?</h2><p>Consulta una patente, diagnostica y registra el trabajo.</p><button class="red-btn" data-go="new">${icon('search')} Nueva atención</button></article><div class="section-head"><h3>Vehículos</h3><div class="head-actions">${archived.length?`<button data-go="archive">Archivados (${archived.length})</button>`:""}<button data-go="cars">Ver todos</button></div></div>${vs.length?vs.slice(0,3).map(v=>vehicleRow(v,false)).join(''):'<div class="empty">Aún no hay vehículos activos.</div>'}`}
function vehicleRow(v,archived=false){return `<div class="swipe-wrap" data-vehicle-core="${esc(plateCore(plate(v)))}" data-archived="${archived?'1':'0'}">${archived?'':`<button class="swipe-archive archive-vehicle-row" aria-hidden="true" data-archive-vehicle="${esc(plate(v))}">Archivar</button>`}<button class="swipe-delete delete-vehicle" aria-hidden="true" data-delete-vehicle="${esc(plate(v))}">Eliminar</button><button class="vehicle-row" ${archived?`data-open-archived="${esc(plate(v))}"`:`data-open="${esc(plate(v))}"`}><span class="car-icon">${icon('car')}</span><span><strong>${esc(carName(v))}</strong><small>${esc(plate(v))}${v.anio?' · '+esc(v.anio):''}${archived?' · Reparado':''}</small></span><b>›</b></button>${archived?`<button class="reactivate-inline" data-reactivate="${esc(plate(v))}">Reactivar</button>`:''}</div>`}
function cars(){const vs=Object.values(state.vehicles);return `<div class="searchbox glass">${icon('search')}<input id="filterCars" placeholder="Buscar patente o vehículo"></div><div id="carsList">${vs.length?vs.map(v=>vehicleRow(v,false)).join(''):'<div class="empty">Consulta una patente para comenzar.</div>'}</div>`}
function archiveScreen(){const vs=Object.values(state.archivedVehicles);return `<button class="back" data-go="home">‹ Resumen</button><div class="archive-head"><h2>Vehículos reparados</h2><p>Historial completo de vehículos archivados. Si vuelves a buscar una patente archivada, THOKAR la reactivará automáticamente.</p></div><div id="archiveList">${vs.length?vs.map(v=>vehicleRow(v,true)).join(''):'<div class="empty">Todavía no has archivado vehículos reparados.</div>'}</div>`}
function lookup(){return `<div class="center-card"><div class="round-icon">${icon('search')}</div><h2>Nueva atención</h2><p>Busca la patente usando el sistema THOKAR.</p><label>Patente</label><input class="plate-input" id="plateInput" maxlength="9" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABCD12"><button class="red-btn full" id="lookupBtn">Consultar vehículo</button><div class="lookup-state" id="lookupState"></div></div>`}
function log(){return `<div class="segmented glass" id="logSeg" role="tablist" aria-label="Filtrar trabajos"><span class="seg-lens" aria-hidden="true"></span><button type="button" role="tab" data-filter="open">Pendiente</button><button type="button" role="tab" data-filter="done">Listo</button><button type="button" role="tab" data-filter="all">Todos</button></div><div class="log-viewport"><div id="logList" class="log-page" role="tabpanel">${renderLogs(state.logFilter)}</div></div>`}
function renderLogs(f){const ls=state.logs.filter(x=>f==='all'||x.status===f);return ls.length?ls.map(x=>`<div class="swipe-wrap log-${x.status==='done'?'done':'open'}"><button class="swipe-delete delete-log" aria-hidden="true" data-delete-log="${x.id}">Eliminar</button><button class="log-row log-open" data-log="${x.id}"><i>${x.status==='done'?'✓':'!'}</i><div><small>${esc(x.date)} · ${esc(x.plate)}</small><span class="log-vehicle">${esc(x.vehicle||vehicleNameByPlate(x.plate))}</span><strong>${esc(x.title)}</strong><p>${esc(x.note||'Registro THOKAR')}</p><b>${money(x.total||0)}</b></div><em>›</em></button></div>`).join(''):'<div class="empty">No hay registros en esta categoría.</div>'}
function settings(){return `<div class="settings-group"><h3>Apariencia</h3><button class="setting-row" id="themePicker"><span>Modo</span><strong>${state.settings.theme==='dark'?'Noche':'Día'} ›</strong></button><div class="setting-row static"><span>Liquid Glass</span><strong>Máximo</strong></div></div><div class="settings-group"><h3>Precios</h3><label class="setting-row editable"><span>Hora hombre</span><span class="money-input">$<input id="hourRate" inputmode="numeric" value="${prettyInt(state.settings.hourRate)}"></span></label><label class="setting-row editable"><span>Desplazamiento base</span><span class="money-input">$<input id="travelRate" inputmode="numeric" value="${prettyInt(state.settings.travel)}"></span></label></div><div class="settings-group"><h3>Conexión</h3><label class="setting-row editable"><span>Token THOKAR</span><input class="token-input" id="appToken" type="password" value="${esc(state.settings.appToken)}" placeholder="Opcional"></label></div><div class="settings-group"><h3>Aplicación</h3><div class="setting-row static"><span>Versión oficial</span><strong>ZERO · 5.5.1</strong></div></div>`}
const fichaFields=[['marca','Marca'],['modelo','Modelo'],['anio','Año'],['tipo','Tipo'],['color','Color'],['motor','Número de motor'],['chasis','VIN / Chasis'],['cilindrada','Cilindrada'],['combustible','Combustible'],['procedencia','Procedencia'],['fabricante','Fabricante']];
function vehicle(){const v=state.vehicle||{},archived=state.viewingArchived||!!v._archived;const back=archived?'archive':'cars';return `<button class="back" data-go="${back}">‹ ${archived?'Reparados':'Vehículos'}</button><div class="vehicle-title"><span class="plate">${esc(plate(v))}</span>${archived?'<span class="archived-badge">Reparado</span>':''}<h2>${esc(carName(v))}</h2><p>${esc([v.anio,v.version,v.combustible].filter(Boolean).join(' · '))}</p></div><div class="data-card ficha-card"><div class="ficha-head"><h3>Ficha</h3>${archived?'':`<button class="paste-btn" id="pasteVehicle">${icon('paste')} Pegar datos</button>`}</div>${fichaFields.map(([k,label])=>`<div><span>${label}</span><strong>${esc((k==='cilindrada'?(v.cilindrada||cylinderFromModel(v.modelo)):v[k])||'—')}</strong></div>`).join('')}</div><div class="tool-stack"><button data-panel="ai"><span>${icon('spark')}</span><div><strong>Chat con THOKAR</strong><small>Conversación técnica · Historial por patente</small></div><b>›</b></button>${archived?'':`<button data-panel="record"><span>${icon('note')}</span><div><strong>Registrar trabajo</strong><small>Detalle, precio, diagnóstico y tareas</small></div><b>›</b></button><button data-panel="parts"><span>${icon('car')}</span><div><strong>Repuestos recomendados</strong><small>Prioriza el número de motor</small></div><b>›</b></button>`}<button data-panel="history"><span>${icon('list')}</span><div><strong>Trabajos registrados</strong><small>Historial de esta patente</small></div><b>›</b></button></div><button class="archive-action ${archived?'reactivate':''}" id="archiveVehicleBtn">${archived?'Reactivar vehículo':'Archivar como reparado'}</button>`}
function bind(){
 $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
 $$('[data-open]').forEach(b=>b.onclick=()=>{state.viewingArchived=false;state.vehicle=state.vehicles[b.dataset.open]||findActiveByPlate(b.dataset.open)?.vehicle;go('vehicle')});
 $$('[data-open-archived]').forEach(b=>b.onclick=()=>{const found=findArchivedByPlate(b.dataset.openArchived);if(!found)return;state.viewingArchived=true;state.vehicle=found.vehicle;go('vehicle')});
 $$('[data-reactivate]').forEach(b=>b.onclick=()=>{const f=findArchivedByPlate(b.dataset.reactivate);if(f){state.vehicle=f.vehicle;state.viewingArchived=true;reactivateCurrentVehicle()}});const lb=$('#lookupBtn');if(lb)lb.onclick=lookupPlate;const pi=$('#plateInput');if(pi)pi.oninput=()=>{const a=pi.selectionStart,b=pi.selectionEnd;pi.value=pi.value.toUpperCase().replace(/[^A-Z0-9-]/g,'');try{pi.setSelectionRange(a,b)}catch{}};
 const fc=$('#filterCars');if(fc)fc.oninput=()=>{const q=fc.value.toLowerCase();$('#carsList').innerHTML=Object.values(state.vehicles).filter(v=>(plate(v)+' '+carName(v)).toLowerCase().includes(q)).map(v=>vehicleRow(v,false)).join('')||'<div class="empty">Sin resultados.</div>';$$('[data-open]').forEach(b=>b.onclick=()=>{state.viewingArchived=false;state.vehicle=state.vehicles[b.dataset.open]||findActiveByPlate(b.dataset.open)?.vehicle;go('vehicle')});bindSwipe()};
 const seg=$('#logSeg');if(seg){const selected=$(`[data-filter="${state.logFilter}"]`,seg)||$('[data-filter]',seg);selected.classList.add('selected');$$('[data-filter]',seg).forEach(b=>b.setAttribute('aria-selected',String(b===selected)));requestAnimationFrame(()=>moveSeg(selected));let switchTimer=0;$$('[data-filter]',seg).forEach(b=>b.onclick=()=>{const next=b.dataset.filter;if(state.logFilter===next)return;state.logFilter=next;$$('[data-filter]',seg).forEach(x=>{const active=x===b;x.classList.toggle('selected',active);x.setAttribute('aria-selected',String(active))});moveSeg(b);const page=$('#logList');page.classList.add('leaving');clearTimeout(switchTimer);switchTimer=setTimeout(()=>{if(!page.isConnected)return;page.innerHTML=renderLogs(state.logFilter);page.classList.remove('leaving');page.classList.add('entering');bindLogRows();bindSwipe();wireChatSearch();setTimeout(()=>{if(page.isConnected)page.classList.remove('entering')},360)},160)})}
 bindLogRows();bindSwipe();wireChatSearch();
 const tp=$('#themePicker');if(tp)tp.onclick=openThemePicker;
 const hr=$('#hourRate');if(hr)hr.oninput=()=>{hr.value=prettyInt(hr.value);state.settings.hourRate=digits(hr.value);save()};
 const tr=$('#travelRate');if(tr)tr.oninput=()=>{tr.value=prettyInt(tr.value);state.settings.travel=digits(tr.value);save()};
 const tok=$('#appToken');if(tok)tok.oninput=()=>{state.settings.appToken=tok.value.trim();save()};
 const paste=$('#pasteVehicle');if(paste)paste.onclick=pasteVehicleData;
 const archiveBtn=$('#archiveVehicleBtn');if(archiveBtn)archiveBtn.onclick=()=>state.viewingArchived?reactivateCurrentVehicle():archiveCurrentVehicle();
 $$('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));
}
const chatNorm=t=>String(t??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CL');
function vehicleChatMatches(v,term){
 const q=chatNorm(term).trim();if(!q)return true;
 return chatNorm(carName(v)+' '+plate(v)).includes(q)||chatFor(v).some(m=>chatNorm(m.text).includes(q));
}
function messageHit(v,term){const q=chatNorm(term).trim();return q?chatFor(v).find(m=>chatNorm(m.text).includes(q)):null}
function wireChatSearch(){
 const input=$('#chatSearch');if(!input)return;
 const refresh=()=>{const q=input.value.trim();const list=$('#chatList');if(!list)return;list.innerHTML=chatRows(chatVehicles().filter(v=>vehicleChatMatches(v,q)),q);wireChatList()};
 input.addEventListener('input',refresh);wireChatList();
}
function wireChatList(){$$('[data-chat-plate]',content).forEach(b=>b.onclick=()=>{
 const v=findActiveByPlate(b.dataset.chatPlate)?.vehicle||findArchivedByPlate(b.dataset.chatPlate)?.vehicle;
 if(!v)return;const term=$('#chatSearch')?.value.trim()||'';
 state.chatJumpTerm=term&&messageHit(v,term)?term:'';openVehicleChat(v);
})}

function bindLogRows(){$$('.log-open').forEach(b=>b.onclick=()=>openLog(Number(b.dataset.log)))}
function closeRevealedSwipes(except=null){$$('.swipe-wrap.revealed').forEach(w=>{if(w===except)return;if(typeof w._closeSwipe==='function'){w._closeSwipe();return}const row=w.querySelector('.vehicle-row,.log-row'),del=w.querySelector('.swipe-delete');if(row){row.style.transition='transform .34s cubic-bezier(.22,.82,.22,1)';row.style.transform='translate3d(0,0,0)'}w.classList.add('swipe-closing');setTimeout(()=>{w.classList.remove('revealed','swipe-closing');if(del)del.setAttribute('aria-hidden','true');if(row)row.style.transition=''},340)})}
if(!document.documentElement.dataset.swipeDismiss){document.documentElement.dataset.swipeDismiss='1';document.addEventListener('pointerdown',e=>{const wrap=e.target.closest?.('.swipe-wrap');if(!wrap?.classList.contains('revealed'))closeRevealedSwipes();else closeRevealedSwipes(wrap)},true)}
let archivePeekTimer=0;
function revealArchivePeek(){const p=$('#archivePeek');if(!p)return;clearTimeout(archivePeekTimer);p.classList.add('shown');archivePeekTimer=setTimeout(()=>p.classList.remove('shown'),4200)}
function syncArchivePeek(){const n=Object.keys(state.archivedVehicles).length;let p=$('#archivePeek');if(!n){p?.remove();return}if(!p&&state.screen==='home'){content.insertAdjacentHTML('beforeend',`<button class="archive-peek" id="archivePeek" aria-label="Abrir vehículos archivados"><span>${icon('list')}</span><strong>Archivados</strong><small>${n}</small></button>`);p=$('#archivePeek');if(p){p.dataset.wired='1';p.onclick=()=>go('archive')}}if(p){const count=$('small',p);if(count)count.textContent=String(n)}}
function bindArchivePeek(){const p=$('#archivePeek');if(p&&!p.dataset.wired){p.dataset.wired='1';p.onclick=()=>go('archive')}if(content.dataset.archivePullBound)return;content.dataset.archivePullBound='1';let sy=0,st=0,tracking=false;const begin=y=>{if(state.screen!=='home')return;sy=y;st=performance.now();tracking=true};const finish=y=>{if(!tracking||state.screen!=='home')return;tracking=false;const dy=y-sy,dt=Math.max(1,performance.now()-st),speed=Math.abs(dy)/dt;if(dy<-90&&speed>.5)revealArchivePeek()};content.addEventListener('touchstart',e=>{const t=e.touches[0];if(t)begin(t.clientY)},{passive:true});content.addEventListener('touchend',e=>{const t=e.changedTouches[0];if(t)finish(t.clientY)},{passive:true});content.addEventListener('touchcancel',()=>{tracking=false},{passive:true});content.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')begin(e.clientY)},{passive:true});content.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')finish(e.clientY)},{passive:true})}
function bindSwipe(){
 $$('.swipe-wrap').forEach(w=>{
  if(w.dataset.swipeBound)return;w.dataset.swipeBound='1';
  let sx=0,sy=0,dx=0,dragging=false,side=null,moved=false,closeTimer=0;
  const row=w.querySelector('.vehicle-row,.log-row'),del=w.querySelector('.swipe-delete'),arc=w.querySelector('.swipe-archive');if(!row)return;
  const settle=(next)=>{clearTimeout(closeTimer);if(next){closeRevealedSwipes(w);side=next;w.classList.remove('swipe-closing','delete-open','archive-open');w.classList.add('revealed',next==='delete'?'delete-open':'archive-open');if(del)del.setAttribute('aria-hidden',next==='delete'?'false':'true');if(arc)arc.setAttribute('aria-hidden',next==='archive'?'false':'true');row.style.transition='transform .3s cubic-bezier(.22,.82,.22,1)';row.style.transform=`translate3d(${next==='delete'?-104:104}px,0,0)`;return}const previous=side;side=null;w.classList.add('swipe-closing');row.style.transition='transform .36s cubic-bezier(.22,.82,.22,1)';row.style.transform='translate3d(0,0,0)';closeTimer=setTimeout(()=>{w.classList.remove('revealed','swipe-closing','delete-open','archive-open');if(del)del.setAttribute('aria-hidden','true');if(arc)arc.setAttribute('aria-hidden','true');row.style.transition=''},360);if(previous==='archive')w.classList.add('archive-open');if(previous==='delete')w.classList.add('delete-open')};w._closeSwipe=()=>settle(null);
  row.addEventListener('pointerdown',e=>{closeRevealedSwipes(w);sx=e.clientX;sy=e.clientY;dx=0;moved=false;dragging=true;row.setPointerCapture?.(e.pointerId)});
  row.addEventListener('pointermove',e=>{if(!dragging)return;const mx=e.clientX-sx,my=e.clientY-sy;if(Math.abs(my)>Math.abs(mx)+8&&!moved)return;dx=mx;const base=side==='delete'?-104:side==='archive'?104:0;let x=base+mx;x=Math.max(-112,Math.min(arc?112:0,x));if(Math.abs(mx)>5&&Math.abs(mx)>Math.abs(my)){moved=true;row.style.transition='none';row.style.transform=`translate3d(${x}px,0,0)`}});
  const finish=()=>{if(!dragging)return;dragging=false;row.style.transition='';if(!moved)return;if(side==='delete'){settle(dx<38?'delete':null);return}if(side==='archive'){settle(dx>-38?'archive':null);return}settle(dx<-42?'delete':(arc&&dx>42?'archive':null))};
  row.addEventListener('pointerup',finish);row.addEventListener('pointercancel',finish);row.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;return}if(side){e.preventDefault();e.stopImmediatePropagation();settle(null)}},true);
 });
 $$('[data-delete-vehicle]').forEach(b=>b.onclick=()=>confirmDeleteVehicle(b.dataset.deleteVehicle,b.closest('.swipe-wrap')));
 $$('[data-delete-log]').forEach(b=>b.onclick=()=>confirmDeleteLog(Number(b.dataset.deleteLog),b.closest('.swipe-wrap')));
 $$('[data-archive-vehicle]').forEach(b=>b.onclick=()=>confirmArchiveVehicle(b.dataset.archiveVehicle,b.closest('.swipe-wrap')))
}
function animateRemoval(el,done){if(!el){done();return}el.classList.add('removing');setTimeout(done,390)}
function animateArchiveRemoval(el,done){if(!el){done();return}el.classList.add('archiving');setTimeout(done,410)}
function pruneVehicleRows(core){$$('.swipe-wrap').forEach(w=>{const row=w.querySelector('.vehicle-row[data-open]');if(row&&plateCore(row.dataset.open)===core)w.remove()});const list=$('#carsList');if(list&&!list.querySelector('.vehicle-row'))list.innerHTML='<div class="empty">Consulta una patente para comenzar.</div>';if(state.screen==='home'&&!content.querySelector('.vehicle-row')&&!content.querySelector('.empty'))content.insertAdjacentHTML('beforeend','<div class="empty">Aún no hay vehículos guardados.</div>')}
function confirmDeleteVehicle(p,el){openChoice('Eliminar vehículo',[['delete','Eliminar vehículo y absolutamente todo su historial']],null,v=>{if(v==='delete')animateRemoval(el,()=>{const core=plateCore(p),removedIds=state.logs.filter(x=>plateCore(x.plate)===core).map(x=>x.id);for(const store of [state.vehicles,state.archivedVehicles])Object.keys(store).forEach(k=>{const vv=store[k];if(plateCore(k)===core||plateCore(plate(vv))===core)delete store[k]});state.logs=state.logs.filter(x=>plateCore(x.plate)!==core);delete state.chats[core];Object.keys(state.partsCache).forEach(k=>{if(plateCore(k)===core)delete state.partsCache[k]});Object.keys(state.chats).forEach(k=>{if(plateCore(k)===core)delete state.chats[k]});Object.keys(state.recordDrafts).forEach(k=>{const vehicleDraft=k.startsWith('vehicle:')&&plateCore(k.slice(8))===core;if(vehicleDraft||removedIds.some(id=>k===`log:${id}`))delete state.recordDrafts[k]});if(plateCore(plate(state.vehicle))===core){state.vehicle=null;state.viewingArchived=false}save();el?.remove();pruneVehicleRows(core);toast('Vehículo e historial eliminados por completo')})})}
function confirmDeleteLog(id,el){openChoice('Eliminar trabajo',[['delete','Eliminar definitivamente']],null,v=>{if(v==='delete')animateRemoval(el,()=>{state.logs=state.logs.filter(x=>x.id!==id);delete state.recordDrafts[`log:${id}`];save();el?.remove();const page=$('#logList');if(page&&!page.querySelector('.log-row'))page.innerHTML='<div class="empty">No hay registros en esta categoría.</div>';toast('Trabajo eliminado')})})}
function vehicleKeyByPlate(p){const core=plateCore(p);return Object.keys(state.vehicles).find(k=>plateCore(k)===core)||''}
function vehicleNameByPlate(p){const key=vehicleKeyByPlate(p);if(key)return carName(state.vehicles[key]);const archived=findArchivedByPlate(p);return archived?carName(archived.vehicle):'Vehículo'}
function archiveVehicleByPlate(p){const active=findActiveByPlate(p);if(!active)return null;const stored={...active.vehicle,_archived:true,archivedAt:new Date().toISOString()};delete state.vehicles[active.key];state.archivedVehicles[plate(stored)]=stored;if(state.vehicle&&samePlate(plate(state.vehicle),p))state.vehicle=stored;save();return stored}
function confirmArchiveVehicle(p,el){if(state.logs.some(x=>samePlate(x.plate,p)&&x.status==='open')){el?._closeSwipe?.();toast('Marca los trabajos pendientes como Listo antes de archivar');return}openChoice('Archivar vehículo',[['archive','Archivar como reparado']],null,choice=>{if(choice!=='archive')return;animateArchiveRemoval(el,()=>{const stored=archiveVehicleByPlate(p);if(!stored)return;el?.remove();const list=$('#carsList');if(list&&!list.querySelector('.vehicle-row'))list.innerHTML='<div class="empty">Consulta una patente para comenzar.</div>';syncArchivePeek();toast('Vehículo archivado con todo su historial')})})}
function archiveCurrentVehicle(){const v=state.vehicle;if(!v)return;if(state.logs.some(x=>samePlate(x.plate,plate(v))&&x.status==='open')){toast('Marca los trabajos pendientes como Listo antes de archivar');return}openChoice('Archivar vehículo',[['archive','Archivar como reparado']],null,choice=>{if(choice!=='archive')return;const stored=archiveVehicleByPlate(plate(v));if(!stored)return;state.viewingArchived=true;toast('Vehículo archivado con todo su historial');go('archive')})}
function reactivateVehicle(p,openAfter=true){const found=findArchivedByPlate(p);if(!found)return null;const v={...found.vehicle,_archived:false};delete v.archivedAt;delete state.archivedVehicles[found.key];state.vehicles[plate(v)]=v;state.vehicle=v;state.viewingArchived=false;save();if(openAfter)go('vehicle');toast('Vehículo reactivado con su historial');return v}
function reactivateCurrentVehicle(){if(state.vehicle)reactivateVehicle(plate(state.vehicle),true)}
function moveSeg(b){const seg=$('#logSeg'),lens=$('.seg-lens',seg);if(!seg||!lens||!b)return;const r=seg.getBoundingClientRect(),br=b.getBoundingClientRect();lens.style.width=br.width+'px';lens.style.transform=`translate3d(${br.left-r.left-4}px,0,0)`}
const digits=v=>Number(String(v??'').replace(/\D/g,''))||0;
async function lookupPlate(){const inp=$('#plateInput'),st=$('#lookupState');const p=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(p.length<5){st.textContent='Escribe una patente válida.';return}const archived=findArchivedByPlate(p);if(archived){reactivateVehicle(p,true);return}st.innerHTML='<span class="mini-spinner"></span> Consultando…';try{const r=await fetch('/api/vehiculo/'+encodeURIComponent(p),{headers:auth()});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||'No fue posible consultar.');const raw=d.vehicle||{},v={...raw,motor:raw.motor||raw.numeroMotor||raw.numero_motor||raw.n_motor||raw.engine_number||'',chasis:raw.chasis||raw.vin||raw.numeroChasis||raw.numero_chasis||raw.n_chasis||'',plate:raw.plate||p};if(!v.cilindrada)v.cilindrada=cylinderFromModel(v.modelo);state.vehicles[plate(v)]=v;state.vehicle=v;state.viewingArchived=false;save();go('vehicle')}catch(e){st.textContent=e.message}}
function parseClipboardVehicle(text){const out={};const lines=String(text||'').replace(/\u00a0/g,' ').split(/\r?\n/);const defs=[['motor',/^(?:n\s*(?:[°º]|ro\.?|o\.?)?\s*(?:de\s+)?motor|n[uú]mero\s+(?:de\s+)?motor|motor)\s*(?:[:=–—-]\s*)?(.+)$/i],['chasis',/^(?:n\s*(?:[°º]|ro\.?|o\.?)?\s*(?:de\s+)?chasis|n[uú]mero\s+(?:de\s+)?chasis|vin(?:\s*\/\s*chasis)?|chasis)\s*(?:[:=–—-]\s*)?(.+)$/i]];const map={patente:'plate',ppu:'plate',tipo:'tipo',marca:'marca',modelo:'modelo','año':'anio',ano:'anio',color:'color',procedencia:'procedencia',fabricante:'fabricante',combustible:'combustible',cilindrada:'cilindrada'};for(const rawLine of lines){const line=rawLine.trim();if(!line)continue;let matched=false;for(const [dest,re] of defs){const m=line.match(re);if(m&&m[1]?.trim()){out[dest]=m[1].trim();matched=true;break}}if(matched)continue;const m=line.match(/^(Patente|PPU|Tipo|Marca|Modelo|Año|Ano|Color|Procedencia|Fabricante|Combustible|Cilindrada)\s*(?:\t+|[:=–—-]\s*|\s{2,}|\s+)\s*(.+)$/i);if(!m)continue;const key=m[1].trim().toLowerCase(),dest=map[key],val=m[2].trim();if(dest&&val)out[dest]=dest==='plate'?val.toUpperCase().replace(/\s/g,''):val}if(!out.cilindrada&&out.modelo)out.cilindrada=cylinderFromModel(out.modelo);return out}
async function pasteVehicleData(){try{if(!navigator.clipboard?.readText)throw new Error('Tu navegador no permite leer el portapapeles automáticamente.');const text=await navigator.clipboard.readText();if(!text.trim())throw new Error('El portapapeles está vacío.');showLoading('Ordenando ficha…');await new Promise(r=>setTimeout(r,650));const parsed=parseClipboardVehicle(text);if(!Object.keys(parsed).length)throw new Error('No reconocí datos de vehículo en el texto copiado.');const current=state.vehicle||{};const currentPlate=plate(current).replace(/[^A-Z0-9-]/g,'');const pastedPlate=String(parsed.plate||'').toUpperCase().replace(/[^A-Z0-9-]/g,'');if(pastedPlate&&currentPlate&&plateCore(pastedPlate)!==plateCore(currentPlate)){hideLoading();return openChoice('Los datos no coinciden',[["cancel",`Mantener ${currentPlate}`],["replace",`Cambiar a ${pastedPlate}`]],'cancel',choice=>{if(choice==='replace'){const merged={...current,...parsed};state.vehicle=merged;state.vehicles[pastedPlate]=merged;save();render();toast('Vehículo cambiado con confirmación')}else toast('Pegado cancelado: patente diferente')})}delete parsed.plate;const merged={...current,...parsed};state.vehicle=merged;state.vehicles[currentPlate||plate(merged)]=merged;save();hideLoading();render();toast('Ficha actualizada desde el portapapeles')}catch(e){hideLoading();toast(e.message)}}
function showLoading(msg){let el=$('#loadingOverlay');if(!el){el=document.createElement('div');el.id='loadingOverlay';el.className='loading-overlay';document.body.appendChild(el)}el.innerHTML=`<div class="loading-orb"><i></i><i></i><i></i></div><strong>${esc(msg)}</strong>`;requestAnimationFrame(()=>el.classList.add('show'))}
function hideLoading(){const el=$('#loadingOverlay');if(el){el.classList.remove('show');setTimeout(()=>el.remove(),220)}}
let sheetCloseTimer=null;
const sheetPanel=sheet.closest('.bottom-sheet');
const sheetFooter=$('#sheetFooter'),sheetHandle=$('#sheetHandle');
let sheetSnap='normal',sheetNatural=0,sheetDrag=null,sheetGestureMoved=false;
let sheetObserver=null,sheetMeasureFrame=0;
function sheetViewportHeight(){return Math.max(200,backdrop.getBoundingClientRect().height||window.innerHeight)}
function sheetHeights(){
 const available=Math.max(220,sheetViewportHeight()-12);
 const natural=Math.max(176,sheetNatural||176);
 const normal=Math.min(natural,available*.78);
 const compact=Math.min(normal,Math.max(175,available*.52));
 const expanded=available*.96;
 return {compact:Math.min(compact,expanded),normal:Math.max(compact,Math.min(normal,expanded)),expanded};
}
function setSheetHeight(px){sheetPanel.style.setProperty('--zero-sheet-height',`${Math.max(120,Math.round(px))}px`)}
function measureSheetNatural(){
 // Measure content at its natural height, NOT the flex-stretched viewport
 // height from the previous sheet. Otherwise even one-row sheets open huge.
 const previousFlex=sheet.style.flex,previousOverflow=sheet.style.overflow;
 sheet.style.flex='0 0 auto';sheet.style.overflow='visible';
 const contentHeight=sheet.scrollHeight;
 sheet.style.flex=previousFlex;sheet.style.overflow=previousOverflow;
 const head=sheetHandle.offsetHeight+$('#sheetChrome').offsetHeight+8;
 sheetNatural=Math.ceil(contentHeight+head+(sheetFooter.children.length?sheetFooter.scrollHeight:0)+10);
}
function applySheetSnap(){
 if(!backdrop.classList.contains('open')||sheetDrag)return;
 const sizes=sheetHeights();
 setSheetHeight(sizes[sheetSnap]??sizes.normal);
}
function syncSheetViewport(){
 const vv=window.visualViewport;
 const top=vv?Math.max(0,vv.offsetTop):0;
 const bottom=vv?Math.max(0,window.innerHeight-vv.height-vv.offsetTop):0;
 backdrop.style.setProperty('--zero-sheet-top',`${Math.round(top)}px`);
 backdrop.style.setProperty('--zero-sheet-bottom',`${Math.round(bottom)}px`);
 if(!backdrop.classList.contains('open'))return;
 applySheetSnap();
 requestAnimationFrame(()=>{
  const active=document.activeElement;
  if(!sheet.contains(active))return;
  const box=sheet.getBoundingClientRect(),field=active.getBoundingClientRect();
  if(field.bottom>box.bottom-18)sheet.scrollTop+=field.bottom-box.bottom+24;
  else if(field.top<box.top+10)sheet.scrollTop-=box.top+10-field.top;
 });
}
function queueSheetMeasure(){
 if(sheetMeasureFrame)cancelAnimationFrame(sheetMeasureFrame);
 sheetMeasureFrame=requestAnimationFrame(()=>{sheetMeasureFrame=0;if(!backdrop.classList.contains('open'))return;measureSheetNatural();applySheetSnap()});
}
function recordDisplayName(value){
 const text=String(value||'Vehículo').toLocaleLowerCase('es-CL').replace(/(^|[\s-])([a-záéíóúüñ])/g,(_,sep,letter)=>sep+letter.toLocaleUpperCase('es-CL'));
 return text.replace(/\b(Lt|Awd|Xli|Xlt|4wd|Suv|Gti|Xle|At|Mt|Vtec|Cvt|Dci|Tdi)\b/g,m=>m.toLocaleUpperCase('es-CL'));
}
function openSheet(html,options={}){
 if(sheetCloseTimer!==null){clearTimeout(sheetCloseTimer);sheetCloseTimer=null}
 sheetObserver?.disconnect();sheetObserver=null;
 sheetFooter.replaceChildren();sheet.innerHTML=html;
 // Only record sheets use the compact, persistent vehicle header.
 // Other dialogs retain their existing top bar and body.
 const header=options.recordHeader||null;
 sheetPanel.classList.toggle('record-header-mode',!!header);
 $('#sheetOverline').textContent=header?.title||'';
 $('#sheetRecordMeta').innerHTML=header?`<h2 class="record-vehicle-name">${esc(recordDisplayName(header.vehicle))}</h2><div class="record-meta-line"><span class="record-plate">${esc(header.plate)}</span><span class="record-status ${header.done?'is-done':'is-pending'}">${header.done?'✓ Listo':'Pendiente'}</span></div>`:'';
 // Only these actions remain pinned. All other forms scroll freely while typing.
 const actions=sheet.querySelector(':scope > .sheet-actions');
 const composer=sheet.querySelector(':scope > .composer.glass-composer');
 if(actions)sheetFooter.appendChild(actions);
 if(composer)sheetFooter.appendChild(composer);
 sheetPanel.classList.toggle('sheet-has-actions',!!actions);
 sheetPanel.classList.remove('sheet-dragging');sheetSnap='normal';sheetDrag=null;sheetNatural=0;
 sheetPanel.style.removeProperty('--zero-sheet-height');
 sheet.scrollTop=0;
 backdrop.classList.remove('closing','ready');
 backdrop.classList.add('open');document.body.classList.add('sheet-open');
 // First measure unconstrained intrinsic content, then snap to 78% of the
 // actual visual viewport or natural height, whichever is shorter.
 syncSheetViewport();
 measureSheetNatural();applySheetSnap();
 sheetObserver=new MutationObserver(queueSheetMeasure);
 sheetObserver.observe(sheet,{childList:true,subtree:true,characterData:true});
 requestAnimationFrame(()=>backdrop.classList.add('ready'));
}
function closeSheet(){
 if(!backdrop.classList.contains('open'))return;
 sheetObserver?.disconnect();sheetObserver=null;
 sheetDrag=null;sheetPanel.classList.remove('sheet-dragging');
 backdrop.classList.remove('ready');backdrop.classList.add('closing');
 if(sheetCloseTimer!==null)clearTimeout(sheetCloseTimer);
 sheetCloseTimer=setTimeout(()=>{
  sheetCloseTimer=null;
  if(backdrop.classList.contains('ready'))return;
  backdrop.classList.remove('open','closing');
  document.body.classList.remove('sheet-open');sheet.innerHTML='';sheetFooter.replaceChildren();
  sheetPanel.classList.remove('sheet-has-actions','record-header-mode');$('#sheetOverline').textContent='';$('#sheetRecordMeta').replaceChildren();sheetPanel.style.removeProperty('--zero-sheet-height');
 },360);
}
// The gray handle is a real 34px touch target. Dragging changes the sheet
// height, keeping its lower edge fixed just above Android navigation.
function moveSheetHandle(e){
 if(!sheetDrag||e.pointerId!==sheetDrag.id)return;
 const dy=e.clientY-sheetDrag.startY;
 const height=Math.max(145,Math.min(sheetHeights().expanded,sheetDrag.startHeight-dy));
 sheetDrag.dy=dy;sheetDrag.lastY=e.clientY;
 sheetGestureMoved=sheetGestureMoved||Math.abs(dy)>7;
 if(e.cancelable)e.preventDefault();
 setSheetHeight(height);
}
function finishSheetHandle(e){
 if(!sheetDrag||e.pointerId!==sheetDrag.id)return;
 const drag=sheetDrag;sheetDrag=null;
 sheetPanel.classList.remove('sheet-dragging');
 try{sheetHandle.releasePointerCapture(e.pointerId)}catch{}
 const delta=drag.dy??0,elapsed=Math.max(1,performance.now()-drag.started);
 const swipe=Math.abs(delta)>34||Math.abs(delta/elapsed)>.45;
 if(!swipe){applySheetSnap();return}
 if(delta>0){
  if(drag.snap==='compact'||(sheetHeights().normal-sheetHeights().compact<12&&drag.snap==='normal')){closeSheet();return}
  sheetSnap=drag.snap==='expanded'?'normal':'compact';
 }else sheetSnap=drag.snap==='compact'?'normal':'expanded';
 applySheetSnap();
}
sheetHandle.addEventListener('pointerdown',e=>{
 if(!backdrop.classList.contains('open')||e.button!==0)return;
 sheetDrag={id:e.pointerId,startY:e.clientY,lastY:e.clientY,dy:0,
   startHeight:sheetPanel.getBoundingClientRect().height,snap:sheetSnap,started:performance.now()};
 sheetGestureMoved=false;sheetPanel.classList.add('sheet-dragging');
 try{sheetHandle.setPointerCapture(e.pointerId)}catch{}
});
sheetHandle.addEventListener('pointermove',moveSheetHandle);
sheetHandle.addEventListener('pointerup',finishSheetHandle);
sheetHandle.addEventListener('pointercancel',e=>{if(!sheetDrag)return;sheetDrag=null;sheetPanel.classList.remove('sheet-dragging');applySheetSnap()});
sheetHandle.addEventListener('click',()=>{if(sheetGestureMoved){sheetGestureMoved=false;return}if(!backdrop.classList.contains('open'))return;sheetSnap=sheetSnap==='expanded'?'normal':'expanded';applySheetSnap()});
sheetHandle.addEventListener('keydown',e=>{if(!backdrop.classList.contains('open'))return;if(e.key==='ArrowUp'){e.preventDefault();sheetSnap='expanded';applySheetSnap()}if(e.key==='ArrowDown'){e.preventDefault();if(sheetSnap==='compact')closeSheet();else{sheetSnap=sheetSnap==='expanded'?'normal':'compact';applySheetSnap()}}});
function openThemePicker(){openChoice('Apariencia',[['light','Día'],['dark','Noche']],state.settings.theme,v=>{state.settings.theme=v;save();applyTheme();render()})}
function openPanel(p){if(p==='record')recordSheet();if(p==='parts')partsSheet();if(p==='ai')openVehicleChat(state.vehicle);if(p==='history')vehicleJobsSheet()}
function itemRow(type,item={}){return `<div class="item-row" data-kind="${type}"><input class="item-name" placeholder="${type==='parts'?'Ej. bandeja, filtro, bujía':'Ej. limpiador, grasa, refrigerante'}" value="${esc(item.name||'')}"><div class="item-price"><span>$</span><input class="item-value money-entry" inputmode="numeric" placeholder="0" value="${prettyInt(item.price||'')}"></div><button class="item-remove" aria-label="Quitar">×</button></div>`}
function recordSheet(existing=null){
 const current=state.vehicle||{};
 const v=existing?(state.vehicles[vehicleKeyByPlate(existing.plate)]||findArchivedByPlate(existing.plate)?.vehicle||{plate:existing.plate,marca:'',modelo:existing.vehicle||''}):current;
 const draftKey=existing?`log:${existing.id}`:`vehicle:${plate(v)}`;
 const x={...(existing||{}),...(state.recordDrafts[draftKey]||{})};
 const parts=x.partsItems||[],materials=x.materialItems||[];
 openSheet(`<div class="record-tabs"><button class="active" data-r-tab="cost">Cobro</button><button data-r-tab="diagnosis">Diagnóstico</button><button data-r-tab="tasks">Lista de tareas</button></div><div class="record-pane active" data-r-pane="cost"><div class="record-form"><label class="full-field">Trabajo<input id="rTitle" value="${esc(x.title||'')}" placeholder="Ej. cambio de aceite"></label><div class="two-col"><label>Horas<input id="rHours" inputmode="decimal" value="${x.hours??1}"></label><label>Hora hombre<div class="affix-input"><span>$</span><input class="money-entry" id="rRate" inputmode="numeric" value="${prettyInt(x.rate??state.settings.hourRate)}"></div></label></div><div class="two-col date-fields"><label>Fecha del trabajo<input id="rServiceDate" type="date" value="${esc(x.serviceDate||todayISO())}"></label><label>Próximo mantenimiento<input id="rNextServiceDate" type="date" value="${esc(x.nextServiceDate||'')}"></label></div><section class="items-editor"><div class="items-title"><strong>Repuestos</strong><button id="addPart">${icon('plus')} Agregar</button></div><div id="partsRows">${parts.map(i=>itemRow('parts',i)).join('')}</div></section><section class="items-editor"><div class="items-title"><strong>Materiales</strong><button id="addMaterial">${icon('plus')} Agregar</button></div><div id="materialRows">${materials.map(i=>itemRow('materials',i)).join('')}</div></section><div class="two-col"><label>Desplazamiento<div class="affix-input"><span>$</span><input class="money-entry" id="rTravel" inputmode="numeric" value="${prettyInt(x.travel??state.settings.travel)}"></div></label><label>Descuento<div class="affix-input suffix"><input id="rDiscount" inputmode="decimal" value="${x.discountType==='fixed'?prettyInt(x.discountRaw??0):(x.discountRaw??0)}"><span id="discountAffix">${x.discountType==='fixed'?'$':'%'}</span></div></label></div><button class="picker-row" id="discountType"><span>Tipo de descuento</span><strong id="discountTypeLabel">${x.discountType==='fixed'?'Monto fijo':'Porcentaje'} ›</strong></button><div class="quote" id="quote"></div></div></div><div class="record-pane" data-r-pane="diagnosis"><label class="full-field">Explicación para el cliente<textarea id="rDiagnosis" placeholder="Escribe los hallazgos confirmados y qué trabajo realizaste. El chat no modifica este texto.">${esc(x.diagnosis||'')}</textarea></label><button class="soft-btn" id="rewriteDiagnosis">${icon('spark')} Redactar para el cliente con IA</button><div class="rewrite-preview" id="rewritePreview" hidden></div></div><div class="record-pane" data-r-pane="tasks"><label class="full-field">Lista de tareas<textarea id="rTasks" placeholder="Una tarea por línea…">${esc((x.tasks?.length?x.tasks:(v._manualTasks||[])).join('\n'))}</textarea></label><button class="soft-btn" id="pasteTasks">${icon('paste')} Pegar desde portapapeles</button></div><div class="record-savebar"><button class="red-btn full" id="saveRecord">${existing?'Guardar todos los cambios':'Guardar registro completo'}</button><small>Guarda Cobro, Diagnóstico y Lista de tareas juntos.</small></div>`,{recordHeader:{title:existing?'Editar registro':'Registrar trabajo',vehicle:carName(v),plate:plate(v),done:x.status==='done'}});
 let dtype=x.discountType||'percent';
 const readItems=(sel)=>$$('.item-row',$(sel)).map(r=>({name:$('.item-name',r).value.trim(),price:digits($('.item-value',r).value)})).filter(i=>i.name||i.price);
 const calc=()=>{const h=Number(String($('#rHours').value||0).replace(',','.').replace(/[^0-9.]/g,''))||0,rate=digits($('#rRate').value),labor=Math.round(h*rate),partsItems=readItems('#partsRows'),materialItems=readItems('#materialRows'),partsTotal=partsItems.reduce((a,i)=>a+i.price,0),materialsTotal=materialItems.reduce((a,i)=>a+i.price,0),travel=digits($('#rTravel').value),sub=labor+partsTotal+materialsTotal+travel,raw=dtype==='fixed'?digits($('#rDiscount').value):(Number(String($('#rDiscount').value||0).replace(',','.').replace(/[^0-9.]/g,''))||0),disc=dtype==='percent'?Math.round(sub*Math.min(100,raw)/100):Math.min(sub,raw),total=Math.max(0,sub-disc);$('#quote').innerHTML=`<div><span>Mano de obra</span><b>${money(labor)}</b></div><div><span>Repuestos</span><b>${money(partsTotal)}</b></div><div><span>Materiales</span><b>${money(materialsTotal)}</b></div><div><span>Desplazamiento</span><b>${money(travel)}</b></div><div><span>Subtotal</span><b>${money(sub)}</b></div><div class="discount"><span>Descuento</span><b>−${money(disc)}</b></div><div class="total"><span>Total</span><strong>${money(total)}</strong></div>`;return{hours:h,rate,labor,partsItems,materialItems,partsTotal,materialsTotal,travel,discountRaw:raw,discountType:dtype,discount:disc,subtotal:sub,total}};
 const snapshot=()=>{const q=calc();return{title:$('#rTitle').value.trim(),serviceDate:$('#rServiceDate').value||todayISO(),nextServiceDate:$('#rNextServiceDate').value||'',diagnosis:cleanAiText($('#rDiagnosis').value),tasks:$('#rTasks').value.split(/\n+/).map(cleanAiText).filter(Boolean),...q}};
 const stash=()=>{state.recordDrafts[draftKey]=snapshot()};
 const wire=()=>{$$('input,textarea',sheet).forEach(i=>{if(i.dataset.recordWired)return;i.dataset.recordWired='1';i.addEventListener('input',()=>{if(i.classList.contains('money-entry')){const before=i.value;i.value=prettyInt(before)}if(i.id==='rDiscount'&&dtype==='fixed')i.value=prettyInt(i.value);calc();stash()});i.addEventListener('focus',()=>sheet.classList.add('keyboard-editing'));i.addEventListener('blur',()=>setTimeout(()=>{if(!sheet.contains(document.activeElement)||!document.activeElement?.matches('input,textarea'))sheet.classList.remove('keyboard-editing')},80))});$$('.item-remove',sheet).forEach(b=>{if(b.dataset.removeWired)return;b.dataset.removeWired='1';b.onclick=()=>{b.closest('.item-row').remove();calc();stash()}})};
 $('#addPart').onclick=()=>{$('#partsRows').insertAdjacentHTML('beforeend',itemRow('parts'));wire();calc();stash()};$('#addMaterial').onclick=()=>{$('#materialRows').insertAdjacentHTML('beforeend',itemRow('materials'));wire();calc();stash()};
 $$('[data-r-tab]',sheet).forEach(b=>b.onclick=()=>{stash();$$('[data-r-tab]',sheet).forEach(x=>x.classList.toggle('active',x===b));$$('[data-r-pane]',sheet).forEach(x=>x.classList.toggle('active',x.dataset.rPane===b.dataset.rTab))});
 $('#discountType').onclick=()=>openChoice('Tipo de descuento',[['percent','Porcentaje (%)'],['fixed','Monto fijo ($)']],dtype,val=>{dtype=val;$('#discountTypeLabel').textContent=(val==='percent'?'Porcentaje':'Monto fijo')+' ›';$('#discountAffix').textContent=val==='percent'?'%':'$';if(val==='fixed')$('#rDiscount').value=prettyInt($('#rDiscount').value);else $('#rDiscount').value=String(Math.min(100,digits($('#rDiscount').value)));calc();stash()});
 $('#pasteTasks').onclick=async()=>{try{$('#rTasks').value=cleanAiText(await navigator.clipboard.readText());stash()}catch{toast('No pude leer el portapapeles')}};
 $('#rewriteDiagnosis').onclick=async()=>{
 const btn=$('#rewriteDiagnosis'),source=$('#rDiagnosis').value.trim(),job=$('#rTitle').value.trim(),preview=$('#rewritePreview');
 if(!source){toast('Primero escribe qué revisaste o realizaste. No se inventarán diagnósticos.');return}
 btn.disabled=true;btn.textContent='Redactando…';preview.hidden=true;
 try{
  const reply=cleanAiText(await aiRequest(`Redacta para un cliente automotriz en Chile una explicación CLARA, PROFESIONAL y BREVE (2 a 4 frases) del servicio: ${job||'servicio mecánico'}. Vehículo: ${carName(v)} patente ${plate(v)}. Notas CONFIRMADAS por el mecánico: ${source}. Usa lenguaje común, sin siglas técnicas sin explicar, sin Markdown, sin recomendaciones inventadas. Distingue entre trabajo realizado y falla no comprobada. No digas que se hizo nada que no figure en las notas. Devuelve SOLO el mensaje listo para el cliente.`, 'client-summary'));
  preview.hidden=false;preview.innerHTML=`<span>Vista previa · No reemplazará el original sin tu aprobación</span><p>${esc(reply)}</p><div class="rewrite-choices"><button type="button" id="rewriteApply">Usar este texto</button><button type="button" id="rewriteDiscard">Descartar</button></div>`;
  $('#rewriteApply').onclick=()=>{$('#rDiagnosis').value=reply;stash();preview.hidden=true;toast('Explicación actualizada')};
  $('#rewriteDiscard').onclick=()=>{preview.hidden=true};
 }catch(e){toast(e.message)}finally{btn.disabled=false;btn.innerHTML=`${icon('spark')} Redactar para el cliente con IA`}
};
 $('#saveRecord').onclick=()=>{const q=snapshot(),title=q.title||'Trabajo',now=new Date();const rec={...(existing||{}),id:existing?.id||Date.now(),date:displayDate(q.serviceDate)||existing?.date||now.toLocaleDateString('es-CL',{day:'2-digit',month:'short'}).toUpperCase(),plate:plate(v),vehicle:carName(v),title,note:'Registro THOKAR',status:existing?.status||'open',...q};if(existing){const idx=state.logs.findIndex(z=>z.id===existing.id);if(idx>=0)state.logs[idx]=rec}else state.logs.unshift(rec);delete state.recordDrafts[draftKey];save();closeSheet();toast(existing?'Registro actualizado completo':'Registro guardado completo')};
 wire();calc();stash()
}
function completedLogHtml(x){
 const list=(items)=>items?.length?`<div class="completed-items">${items.map(i=>`<div class="completed-item"><span>${esc(i.name||'Repuesto')}</span><b>${money(i.price)}</b></div>`).join('')}</div>`:'';
 const line=(label,value,extra='')=>`<div class="completed-row ${extra}"><span>${label}</span><strong>${value}</strong></div>`;
 const workDate=displayDate(x.serviceDate)||x.date||'—';
 const vehicleLabel=x.vehicle||vehicleNameByPlate(x.plate);
 const itemSum=items=>(items||[]).reduce((sum,i)=>sum+(Number(i.price)||0),0);
 const itemCost=(stored,items)=>stored==null?itemSum(items):(Number(stored)||0);
 const labor=x.labor==null?(Number(x.hours)||0)*(Number(x.rate)||0):x.labor;
 const charges=[['Mano de obra',labor],['Repuestos',itemCost(x.partsTotal,x.partsItems)],['Materiales',itemCost(x.materialsTotal,x.materialItems)],['Desplazamiento',x.travel]];
 const breakdown=charges.filter(([k,v])=>Number(v)>0).map(([k,v])=>line(esc(k),money(v))).join('');
 const discount=Number(x.discount)>0?line('Descuento',`−${money(x.discount)}`,'completed-discount'):'';
 const diagnosis=cleanAiText(x.diagnosis||'');
 return `<div class="completed-receipt">
  <div class="completed-hero">
   <div class="completed-hero-top"><span class="completed-success-icon" aria-hidden="true">✓</span><div><span class="completed-eyebrow">SERVICIO FINALIZADO</span><span class="completed-subtitle">Registro THOKAR</span></div></div>
   <h2>${esc(x.title||'Trabajo realizado')}</h2>
   <div class="completed-car"><span class="completed-car-icon" aria-hidden="true">${icon('car')}</span><div><strong>${esc(vehicleLabel||'Vehículo')}</strong><span>${esc(x.plate||'—')}</span></div></div>
  </div>
  <div class="completed-total-card"><span>Total del servicio</span><strong>${money(x.total||0)}</strong><small>Trabajo completado · ${esc(workDate)}</small></div>
  <section class="completed-section"><h3>Detalle del servicio</h3><div class="completed-rows">${line('Fecha del trabajo',esc(workDate))}${x.nextServiceDate?line('Próximo mantenimiento',esc(displayDate(x.nextServiceDate))):''}${breakdown}${discount}</div></section>
  ${x.partsItems?.length?`<section class="completed-section"><h3>Repuestos utilizados</h3>${list(x.partsItems)}</section>`:''}
  ${x.materialItems?.length?`<section class="completed-section"><h3>Materiales e insumos</h3>${list(x.materialItems)}</section>`:''}
  ${diagnosis?`<section class="completed-section"><h3>Diagnóstico registrado</h3><p class="completed-diagnosis">${esc(diagnosis)}</p></section>`:''}
 </div>`;
}
function openLog(id){
 const x=state.logs.find(z=>z.id===id);if(!x)return;
 const done=x.status==='done';
 const list=(items)=>items?.length?`<ul>${items.map(i=>`<li><span>${esc(i.name||'Sin nombre')}</span><b>${money(i.price)}</b></li>`).join('')}</ul>`:'<p class="muted-line">Sin detalle.</p>';
 const traditional=`<div class="sheet-title"><h2>${esc(x.title)}</h2><p>${esc(x.plate)} · ${esc(x.vehicle||'')}</p></div><div class="log-detail"><div><span>Estado</span><b>Pendiente</b></div><div><span>Fecha del trabajo</span><b>${esc(displayDate(x.serviceDate)||x.date||'—')}</b></div>${x.nextServiceDate?`<div><span>Próximo mantenimiento</span><b>${esc(displayDate(x.nextServiceDate))}</b></div>`:''}<h3>Repuestos</h3>${list(x.partsItems)}<h3>Materiales</h3>${list(x.materialItems)}<div class="detail-total"><span>Total</span><strong>${money(x.total)}</strong></div></div>`;
 const buttons=`<div class="sheet-actions ${done?'completed-actions':''}"><button id="editLog">${done?'Editar registro':'Editar'}</button><button id="toggleLog">${done?'Volver a pendiente':'Marcar listo'}</button><button class="primary" id="shareLog">${icon('share')} Compartir</button></div>`;
 openSheet((done?completedLogHtml(x):traditional)+buttons);
 $('#editLog').onclick=()=>recordSheet(x);
 $('#toggleLog').onclick=()=>{x.status=x.status==='done'?'open':'done';save();closeSheet();if(state.screen==='log')render();toast('Estado actualizado')};
 $('#shareLog').onclick=()=>shareLog(x);
}
function vehicleJobsSheet(){const v=state.vehicle||{},jobs=state.logs.filter(x=>samePlate(x.plate,plate(v)));const rows=jobs.length?jobs.map(x=>`<button class="vehicle-job-row" data-job-id="${x.id}"><span class="job-status ${x.status==='done'?'done':'open'}">${x.status==='done'?'✓':'!'}</span><span><small>${esc(displayDate(x.serviceDate)||x.date||'Sin fecha')}</small><strong>${esc(x.title||'Trabajo')}</strong><em>${x.status==='done'?'Listo':'Pendiente'} · ${money(x.total||0)}</em></span><b>›</b></button>`).join(''):'<div class="empty compact">Este vehículo todavía no tiene trabajos registrados.</div>';openSheet(`<div class="sheet-title"><h2>Trabajos registrados</h2><p>${esc(plate(v))} · ${esc(carName(v))}</p></div><div class="vehicle-jobs">${rows}</div>`);$$('[data-job-id]',sheet).forEach(b=>b.onclick=()=>openLog(Number(b.dataset.jobId)))}
function buildShareMessage(x,options={}){
 const opt={service:true,diagnosis:true,items:true,charges:true,payment:true,...options};
 const diagnosis=cleanAiText(x.diagnosis||'').trim();
 const parts=[];
 if(opt.diagnosis&&diagnosis)parts.push(`DIAGNÓSTICO PARA EL CLIENTE\n${diagnosis}`);
 if(opt.service){
  parts.push(`SERVICIO\nTrabajo: ${x.title||'Servicio automotriz'}\nVehículo: ${x.vehicle||vehicleNameByPlate(x.plate)||'Vehículo'}${x.plate?' · '+x.plate:''}\nFecha del trabajo: ${displayDate(x.serviceDate)||x.date||'No indicada'}${x.nextServiceDate?`\nPróximo mantenimiento: ${displayDate(x.nextServiceDate)}`:''}`);
 }else{
  parts.push(`Vehículo: ${x.vehicle||vehicleNameByPlate(x.plate)||'Vehículo'}${x.plate?' · '+x.plate:''}`);
 }
 if(opt.items){
  const line=(label,arr)=>arr?.length?`${label}:\n`+arr.map(i=>`• ${i.name||'Ítem'} — ${money(i.price)}`).join('\n'):'';
  const entries=[line('Repuestos',x.partsItems),line('Materiales',x.materialItems)].filter(Boolean);
  if(entries.length)parts.push(entries.join('\n\n'));
 }
 if(opt.charges){
  const charges=[`Mano de obra: ${money(x.labor)}`];
  if(x.partsItems?.length||Number(x.partsTotal)>0)charges.push(`Repuestos: ${money(x.partsTotal??x.partsItems.reduce((a,i)=>a+(Number(i.price)||0),0))}`);
  if(x.materialItems?.length||Number(x.materialsTotal)>0)charges.push(`Materiales: ${money(x.materialsTotal??x.materialItems.reduce((a,i)=>a+(Number(i.price)||0),0))}`);
  charges.push(`Desplazamiento: ${money(x.travel)}`);
  charges.push(`Subtotal: ${money(x.subtotal)}`);
  if(Number(x.discount)>0)charges.push(`Descuento THOKAR: -${money(x.discount)}`);
  charges.push(`TOTAL: ${money(x.total)}`);
  parts.push(`COBRO\n${charges.join('\n')}`);
 }
 if(opt.payment){
  parts.push('MÉTODOS DE PAGO\n• Efectivo\n• Transferencia bancaria\n\nDatos para transferencia:\nThomas Flores\nRUT: 22.073.929-5\nBanco de Chile\nCuenta Corriente\nN.º de cuenta: 00-448-11414-03\n(Opcional) Correo: thomasv.floresgalaz@gmail.com');
 }
 return `THOKAR · Ingeniería que mueve\n\nHola. Le comparto la información del servicio de su vehículo.\n\n${parts.join('\n\n')}\n\nGracias por confiar en THOKAR.\nIngeniería que mueve\nInstagram: @thokar.sa · WhatsApp: +56 9 7304 6527`;
}
function shareLog(x){openSharePreview(x)}
function openSharePreview(x){
 const hasDiagnosis=!!cleanAiText(x.diagnosis||'').trim();
 const hasItems=!!(x.partsItems?.length||x.materialItems?.length);
 const filters=[
  {key:'service',label:'Trabajo, vehículo y fechas',checked:true},
  {key:'diagnosis',label:'Diagnóstico para el cliente',checked:hasDiagnosis,disabled:!hasDiagnosis},
  {key:'items',label:'Repuestos y materiales',checked:hasItems,disabled:!hasItems},
  {key:'charges',label:'Cobro y total',checked:true},
  {key:'payment',label:'Efectivo y datos de transferencia',checked:true}
 ];
 const toggles=filters.map(f=>`<label class="share-toggle ${f.disabled?'is-disabled':''}"><input type="checkbox" data-share-part="${f.key}" ${f.checked?'checked':''} ${f.disabled?'disabled':''}><span>${esc(f.label)}</span></label>`).join('');
 const opts=Object.fromEntries(filters.map(f=>[f.key,f.checked]));
 openSheet(`<section class="share-preview-screen"><div class="sheet-title share-head"><h2>Vista previa de WhatsApp</h2><p>${esc(x.vehicle||vehicleNameByPlate(x.plate))} · ${esc(x.plate||'')}</p></div><p class="share-description">Selecciona qué incluir. Después puedes editar libremente el mensaje antes de enviarlo.</p><div class="share-toggles" id="shareToggles">${toggles}</div><label class="share-message-label" for="shareMessageText">Mensaje para el cliente</label><textarea id="shareMessageText" class="share-textarea" spellcheck="true" aria-label="Vista previa editable del mensaje de WhatsApp">${esc(buildShareMessage(x,opts))}</textarea><small class="share-tip" id="shareTip">Al cambiar una opción se vuelve a generar el texto; revisa tus ediciones antes de enviarlo.</small><button type="button" class="share-back" id="shareBack">‹ Volver al registro</button></section><div class="sheet-actions share-preview-actions"><button class="share-copy" type="button" id="shareCopy">Copiar texto</button><a class="primary share-whatsapp" id="shareWhatsApp" href="https://wa.me/" target="_blank" rel="noopener noreferrer">${icon('share')} Abrir WhatsApp</a></div>`);
 const field=$('#shareMessageText');
 const link=$('#shareWhatsApp');
 const updateLink=()=>{link.href='https://wa.me/?text='+encodeURIComponent(field.value)};
 updateLink();
 field.addEventListener('input',updateLink);
 $$('[data-share-part]',$('#shareToggles')).forEach(el=>el.addEventListener('change',()=>{
  const selected={};$$('[data-share-part]',$('#shareToggles')).forEach(box=>selected[box.dataset.sharePart]=box.checked);
  field.value=buildShareMessage(x,selected);updateLink();
 }));
 $('#shareCopy').onclick=async()=>{try{await navigator.clipboard.writeText(field.value);toast('Mensaje copiado para WhatsApp')}catch{field.focus();field.select();toast('Selecciona y copia el mensaje')}};
 $('#shareBack').onclick=()=>openLog(x.id);
}

function openChoice(t,opts,current,onpick){let layer=$('#choiceLayer');if(layer)layer.remove();layer=document.createElement('div');layer.id='choiceLayer';layer.className='choice-layer';layer.innerHTML=`<div class="choice-card"><h3>${esc(t)}</h3><div class="option-list">${opts.map(o=>`<button data-choice="${o[0]}"><span>${esc(o[1])}</span><i class="check">${o[0]===current?'✓':''}</i></button>`).join('')}</div><button class="cancel-choice">Cancelar</button></div>`;document.body.appendChild(layer);requestAnimationFrame(()=>layer.classList.add('show'));const done=()=>{layer.classList.remove('show');setTimeout(()=>layer.remove(),180)};$$('[data-choice]',layer).forEach(b=>b.onclick=()=>{const v=b.dataset.choice;done();onpick(v)});$('.cancel-choice',layer).onclick=done;layer.onclick=e=>{if(e.target===layer)done()}}
function openClientSummary(v){
 const jobs=state.logs.filter(x=>samePlate(x.plate,plate(v))&&x.status==='open');
 const jobSelect=jobs.length?`<label class="summary-field">Orden pendiente de destino<select id="clientSummaryJob">${jobs.map(x=>`<option value="${Number(x.id)}">${esc(x.title||'Trabajo')} · ${esc(displayDate(x.serviceDate)||'Sin fecha')}</option>`).join('')}</select></label>`:`<p class="summary-notice">Este vehículo no tiene trabajos pendientes. Puedes preparar y copiar el resumen, pero no se guardará en ninguna orden hasta que crees una.</p>`;
 openSheet(`<section class="client-summary-screen"><div class="sheet-title"><h2>Resumen para el cliente</h2><p>${esc(carName(v))} · ${esc(plate(v))}</p></div><p class="summary-description">Revisa lo conversado. Indica qué comprobaste o realizaste para evitar que la IA confunda sospechas con reparaciones.</p><label class="summary-field">Trabajo realmente realizado o confirmado <small>(opcional)</small><textarea id="clientSummaryFacts" placeholder="Ej. Se revisaron los fusibles y se limpió el cuerpo de aceleración. No se sustituyeron piezas."></textarea></label><button class="soft-btn" id="clientSummaryGenerate">${icon('spark')} Preparar con THOKAR</button><label class="summary-field">Texto final editable<textarea id="clientSummaryResult" placeholder="Aquí aparecerá un resumen que podrás modificar…"></textarea></label>${jobSelect}<p class="summary-description">El texto solo reemplazará el diagnóstico de la orden elegida cuando lo confirmes. El chat completo seguirá intacto.</p></section><div class="sheet-actions summary-actions"><button id="summaryCopy" type="button">Copiar</button><button class="primary" id="summarySave" type="button" ${jobs.length?'':'disabled'}>Usar en registro</button></div>`);
 $('#clientSummaryGenerate').onclick=async()=>{
  const btn=$('#clientSummaryGenerate'),result=$('#clientSummaryResult');
  const facts=$('#clientSummaryFacts').value.trim();const chat=chatFor(v).slice(-16).map(m=>`${m.role==='user'?'Mecánico':'IA'}: ${cleanAiText(m.text)}`).join('\n').slice(-8000);
  if(!chat&&!facts){toast('Todavía no hay información para resumir.');return}
  btn.disabled=true;btn.innerHTML='Preparando resumen…';
  try{const resultText=cleanAiText(await aiRequest(`Redacta una explicación en español chileno, profesional, fácil de entender para un cliente sin conocimientos mecánicos. Máximo 4 frases. Vehículo ${carName(v)}, patente ${plate(v)}.\nHECHOS CONFIRMADOS POR EL MECÁNICO (tienen prioridad): ${facts||'No se detallaron trabajos confirmados.'}\nCONVERSACIÓN TÉCNICA (puede contener hipótesis NO comprobadas):\n${chat}\nReglas: no afirmar que una pieza falló, se reparó o se reemplazó si no está confirmado explícitamente por el mecánico. Si hay solo síntomas/hipótesis, explicar que siguen en revisión. No inventes reparaciones, mediciones, presupuestos ni fechas. Sin listas ni Markdown, solo el texto listo para compartir.`, 'client-summary'));
   result.value=resultText;result.dispatchEvent(new Event('input'));toast('Resumen preparado. Revísalo antes de guardarlo.');
  }catch(e){toast(e.message||'No pude preparar el resumen. Puedes redactarlo manualmente.')}finally{if(btn.isConnected){btn.disabled=false;btn.innerHTML=`${icon('spark')} Preparar con THOKAR`}}
 };
 $('#summaryCopy').onclick=async()=>{const text=$('#clientSummaryResult').value.trim();if(!text)return toast('No hay texto para copiar');try{await navigator.clipboard.writeText(text);toast('Resumen copiado')}catch{const f=$('#clientSummaryResult');f.focus();f.select();toast('Selecciona y copia el resumen')}};
 $('#summarySave').onclick=()=>{
  const text=$('#clientSummaryResult').value.trim(),id=Number($('#clientSummaryJob')?.value);
  if(!text)return toast('Primero redacta o genera el resumen');
  const job=state.logs.find(x=>x.id===id&&x.status==='open'&&samePlate(x.plate,plate(v)));
  if(!job)return toast('La orden ya no está pendiente. No se cambió nada.');
  job.diagnosis=text;const draft=state.recordDrafts[`log:${job.id}`];if(draft)draft.diagnosis=text;
  save();toast('Resumen guardado en la orden pendiente');closeSheet();
 };
}
async function aiRequest(prompt,purpose='diagnosis',json=false){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),65000);try{const r=await fetch('/api/ai/json',{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify({purpose,contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:json?.1:.25,...(json?{responseMimeType:'application/json'}:{}),...(purpose==='client-summary'?{maxOutputTokens:440}:{})}}),signal:ctl.signal});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`Error IA (${r.status})`);return d.text||''}catch(e){if(e.name==='AbortError')throw new Error('Gemini tardó demasiado. Puedes reintentar.');if(e instanceof TypeError)throw new Error('No se pudo conectar con el servidor de IA. Reintenta en unos segundos.');throw e}finally{clearTimeout(timer)}}
const partLabels={aceite:'Aceite',filtroAceite:'Filtro de aceite',bujias:'Bujías',refrigerante:'Refrigerante',resultado:'Recomendación'};
// Recomendaciones separadas por patente: nunca se transfieren entre vehículos.
// Una modificación de motor/VIN/ficha no vuelve a consultar automáticamente:
// conserva el resultado anterior y avisa que requiere una actualización manual.
const partsIdentity=v=>JSON.stringify([plateCore(plate(v)),v.motor,v.chasis,v.marca,v.modelo,v.anio,v.cilindrada,v.combustible].map(x=>String(x??'').trim().toUpperCase()));
const savedPartsFor=v=>state.partsCache[vehicleId(v)]||null;
function storePartsFor(v,recommendations){const key=vehicleId(v);if(!key)return;const prev=savedPartsFor(v);state.partsCache[key]={identity:partsIdentity(v),updatedAt:new Date().toISOString(),recommendations,questions:prev?.identity===partsIdentity(v)?prev.questions||{}:{}};save()}
function storePartQuestion(v,key,question,answer){const saved=savedPartsFor(v);if(!saved)return;saved.questions??={};saved.questions[key]={question,answer,at:new Date().toISOString()};save()}
function renderSavedPartQuestion(saved){return saved?`<div class="mini-qa-user">${esc(saved.question)}</div><div class="mini-qa-model">${esc(saved.answer)}</div><button class="mini-chat-close">Cerrar consulta</button>`:''}
function renderPartsFor(v,data,result){if(!result?.isConnected)return;const recommendations=data.recommendations||{},old=data.identity!==partsIdentity(v),keys=['aceite','filtroAceite','bujias','refrigerante'];const order=keys.filter(k=>Object.hasOwn(recommendations,k));Object.keys(recommendations).forEach(k=>{if(!order.includes(k))order.push(k)});
 const info=old?'<p class="parts-stale">La ficha del vehículo cambió desde esta consulta. Se muestran las recomendaciones anteriores; actualízalas para utilizar los nuevos datos.</p>':`<p class="parts-saved">Consulta guardada · ${esc(new Date(data.updatedAt).toLocaleDateString('es-CL'))}. No se consumen nuevas consultas al abrir.</p>`;
 result.innerHTML=`${info}<div class="parts-toolbar"><button id="refreshParts" type="button">${icon('reload')} Actualizar recomendaciones</button></div>${order.map(k=>`<section class="part-card" data-part-key="${esc(k)}"><span>${esc(partLabels[k]||k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()))}</span><strong>${esc(cleanAiText(recommendations[k]))}</strong><button class="part-ask-toggle">Preguntar a THOKAR</button><div class="part-mini-chat"><div class="part-answer">${renderSavedPartQuestion(data.questions?.[k])}</div><div class="part-composer"><input class="part-question" placeholder="Ej. ¿Por qué este y no 10W-40?"><button class="part-send">Enviar</button></div></div></section>`).join('')}`;
 $('#refreshParts',result).onclick=()=>partsSheet(true);wirePartQuestions(v,recommendations,result)
}
function wirePartQuestions(v,recs,result){$$('.part-card',result).forEach(card=>{const key=card.dataset.partKey,toggle=$('.part-ask-toggle',card),chat=$('.part-mini-chat',card),input=$('.part-question',card),send=$('.part-send',card),answer=$('.part-answer',card);const collapse=()=>{chat.classList.remove('open');toggle.hidden=false};
 const bindClose=()=>{const closer=$('.mini-chat-close',answer);if(closer)closer.onclick=collapse};bindClose();
 toggle.onclick=()=>{$$('.part-mini-chat.open',result).forEach(x=>{x.classList.remove('open');const c=x.closest('.part-card'),t=c&&$('.part-ask-toggle',c);if(t)t.hidden=false});chat.classList.add('open');toggle.hidden=true;if(!answer.children.length)setTimeout(()=>input.focus(),120)};
 send.onclick=async()=>{const q=input.value.trim();if(!q)return;input.disabled=true;send.disabled=true;answer.innerHTML=`<div class="mini-qa-user">${esc(q)}</div><div class="mini-qa-thinking"><i></i><i></i><i></i></div>`;
 try{const label=partLabels[key]||key,rec=cleanAiText(recs[key]||'');const text=cleanAiText(await aiRequest(`Responde como asesor mecánico THOKAR en palabras claras y breves. Vehículo: ${plate(v)} · ${carName(v)} · año ${v.anio||'no informado'} · número de motor prioritario ${v.motor||'no confirmado'} · VIN secundario ${v.chasis||'no confirmado'}. Repuesto o fluido consultado: ${label}. Recomendación actual: ${rec}. Pregunta del mecánico: ${q}. Explica el motivo sin inventar especificaciones, números de parte ni datos no confirmados. Responde solo texto plano, sin Markdown ni asteriscos.`,'recommendations'));storePartQuestion(v,key,q,text);if(answer.isConnected){answer.innerHTML=renderSavedPartQuestion({question:q,answer:text});bindClose()}}
 catch(e){if(answer.isConnected){answer.innerHTML=`<div class="mini-qa-user">${esc(q)}</div><div class="mini-qa-model error">${esc(e.message)}</div><button class="mini-chat-close">Cerrar consulta</button>`;bindClose()}}finally{input.disabled=false;send.disabled=false}};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send.click()}})})}
async function partsSheet(force=false){const v={...(state.vehicle||{})},cached=savedPartsFor(v);openSheet(`<div class="sheet-title"><h2>Repuestos recomendados</h2><p>Prioridad: número de motor y luego VIN/chasis. Confirma referencias críticas con catálogo o fabricante.</p></div><div id="aiResult" class="ai-result parts-result"></div>`);const result=$('#aiResult');
 if(cached?.recommendations&&!force){renderPartsFor(v,cached,result);return}
 if(cached?.recommendations){renderPartsFor(v,cached,result);const refresh=$('#refreshParts',result);if(refresh){refresh.disabled=true;refresh.textContent='Actualizando…'}result.insertAdjacentHTML('afterbegin','<p class="parts-updating"><span class="mini-spinner"></span> Consultando nuevamente…</p>')}
 else result.innerHTML='<div class="parts-loading"><span class="spinner"></span> Consultando IA…</div>';
 try{const tx=await aiRequest(`Vehículo: ${plate(v)} · ${carName(v)} · año ${v.anio||'no informado'} · NÚMERO DE MOTOR ${v.motor||'no confirmado'} · VIN/chasis secundario ${v.chasis||'no confirmado'} · cilindrada ${v.cilindrada||'no confirmada'} · combustible ${v.combustible||'no informado'}. Para identificar compatibilidad, PRIORIZA el número de motor como dato principal; usa VIN/chasis, marca, modelo y año solo como apoyo. Recomienda brevemente aceite (viscosidad/norma), filtro de aceite, bujías y refrigerante. No inventes números de parte ni afirmes acceso a un catálogo que no tienes. Si aún no hay certeza, explica brevemente qué dato falta y escribe "Confirmar por catálogo". Devuelve SOLO JSON con claves aceite, filtroAceite, bujias, refrigerante.`,'recommendations',true);
 let obj;try{obj=JSON.parse(tx)}catch{const m=tx.match(/\{[\s\S]*\}/);obj=m?JSON.parse(m[0]):{resultado:tx}};
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||!Object.keys(obj).length)throw new Error('Gemini no devolvió recomendaciones válidas.');storePartsFor(v,obj);renderPartsFor(v,savedPartsFor(v),result);toast('Recomendaciones guardadas para este vehículo')}
 catch(e){if(!result.isConnected)return;if(cached?.recommendations){renderPartsFor(v,cached,result);result.insertAdjacentHTML('afterbegin',`<div class="parts-update-error">No se pudieron actualizar las recomendaciones: ${esc(e.message)}. Se mantienen los datos guardados.</div>`)}else{result.innerHTML=`<div class="ai-error"><p>${esc(e.message)}</p><button id="retryParts">${icon('reload')} Reintentar</button></div>`;$('#retryParts',result).onclick=()=>partsSheet(true)}}
}
function renderChatMessage(m,index){const text=esc(cleanAiText(m.text||''));if(m.role==='user')return `<div class="bubble user enter" data-message-index="${index}">${text}</div>`;return `<div class="chat-model-wrap" data-message-index="${index}"><div class="bubble model enter">${text}</div><button class="use-tasks" data-use-tasks="${index}">Usar como tareas</button></div>`}
// Chat técnico y diagnóstico para el cliente son datos distintos.
// Se conserva la función vieja únicamente como compatibilidad, pero no se usa
// para escribir automáticamente las órdenes de trabajo.
async function useMessageAsTasks(v,text,btn){btn.disabled=true;const original=btn.textContent;btn.textContent='Preparando…';try{const tx=cleanAiText(await aiRequest(`Convierte el siguiente contenido en una lista de tareas mecánicas breve, ordenada y accionable para ${plate(v)} ${carName(v)}. Una tarea por línea, sin viñetas, sin Markdown y sin explicaciones adicionales. No inventes pasos que no estén respaldados por el texto:\n${cleanAiText(text)}`,'diagnosis'));const tasks=tx.split(/\n+/).map(x=>cleanAiText(x).replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean).slice(0,20);v._manualTasks=tasks;const key=findActiveByPlate(plate(v))?.key;if(key)state.vehicles[key]=v;const pending=state.logs.find(x=>samePlate(x.plate,plate(v))&&x.status==='open');if(pending){pending.tasks=[...tasks];const logDraft=state.recordDrafts[`log:${pending.id}`];if(logDraft)logDraft.tasks=[...tasks]}save();btn.textContent='Lista guardada';toast('Lista de tareas actualizada por tu decisión');setTimeout(()=>{if(document.body.contains(btn)){btn.disabled=false;btn.textContent=original}},1300)}catch(e){btn.disabled=false;btn.textContent=original;toast(e.message)}}
// ZERO 5.5.0: lista de conversaciones por patente, interfaz propia de altura completa.
function chatVehicles(){
 const all=[...Object.values(state.vehicles),...Object.values(state.archivedVehicles)];
 return all.filter(v=>vehicleId(v)).sort((a,b)=>{
  const last=v=>{const h=chatFor(v);return h.length?Number(h[h.length-1].at||0):0};
  return last(b)-last(a)||carName(a).localeCompare(carName(b),'es');
 });
}
function chatSnippet(v){const h=chatFor(v),last=h[h.length-1];return last?cleanAiText(last.text).slice(0,105):'Iniciar conversación técnica';}
function chatsScreen(){
 const cars=chatVehicles();
 return `<div class="chats-intro"><p>Un historial independiente por vehículo. Tus chats anteriores siguen disponibles.</p></div>
 <label class="searchbox chats-search">${icon('search')}<input id="chatSearch" type="search" placeholder="Buscar patente, mensajes o DTC" aria-label="Buscar en vehículos y conversaciones"></label>
 <div class="chat-list" id="chatList">${chatRows(cars)}</div>`;
}
function chatRows(cars,term=''){return cars.length?cars.map(v=>{
 const h=chatFor(v),last=h[h.length-1],hit=messageHit(v,term);
 const snippet=hit?cleanAiText(hit.text).slice(0,120):chatSnippet(v);
 const count=term?h.filter(m=>chatNorm(m.text).includes(chatNorm(term))).length:0;
 return `<button class="chat-vehicle-row" data-chat-plate="${esc(plate(v))}"><span class="chat-car-avatar">${icon('car')}</span><span class="chat-item-main"><strong>${esc(carName(v))}</strong><small>${esc(plate(v))}${v._archived?' · Archivado':''}${count?` · ${count} coincidencia${count===1?'':'s'}`:''}</small><em>${esc(snippet)}</em></span><span class="chat-item-side">${last?.at?esc(new Date(last.at).toLocaleDateString('es-CL',{day:'2-digit',month:'short'})):''}<b>›</b></span></button>`;
 }).join(''):'<div class="empty">No hay conversaciones ni vehículos que coincidan con la búsqueda.</div>'}
function openVehicleChat(v){const id=vehicleId(v);if(!id)return;state.chatVehicleId=id;go('conversation')}
function chatVehicle(){return state.chatVehicleId&&(findActiveByPlate(state.chatVehicleId)?.vehicle||findArchivedByPlate(state.chatVehicleId)?.vehicle)||null}
function conversationScreen(){const v=chatVehicle();if(!v)return `<button class="back" data-go="chats">‹ Chats</button><div class="empty">No se encontró el vehículo.</div>`;
 const messages=chatFor(v);
 const emptyChat='<div class="chat-welcome"><span>✦</span><h2>¿Qué revisamos de este vehículo?</h2><p>El historial es privado de esta patente. Las respuestas del chat no modifican tus órdenes de trabajo.</p></div>';
 return `<div class="conversation-layout">
   <header class="conversation-header"><button class="chat-back" id="chatBack" aria-label="Volver a conversaciones">‹</button><div class="conversation-heading"><strong>${esc(carName(v))}</strong><small>${esc(plate(v))}${v._archived?' · Archivado':''}</small></div><button class="chat-find-btn" id="chatFindToggle" type="button" aria-label="Buscar en esta conversación">${icon('search')}</button></header><div class="chat-utilities"><button type="button" id="chatClientSummary">${icon('spark')} Resumen para el cliente</button></div><div class="chat-find-panel" id="chatFindPanel" hidden><input id="chatFindInput" type="search" placeholder="Busca palabra, síntoma o DTC" aria-label="Buscar mensajes"><span id="chatFindCount"></span><button id="chatFindPrev" type="button" aria-label="Anterior coincidencia">↑</button><button id="chatFindNext" type="button" aria-label="Siguiente coincidencia">↓</button><button id="chatFindClose" type="button" aria-label="Cerrar búsqueda">×</button></div>
   <div class="conversation-scroll" id="chatHistory" role="log" aria-live="polite" aria-label="Conversación de ${esc(carName(v))}">${messages.length?messages.map(renderChatMessage).join(''):emptyChat}</div>
   <div class="conversation-bottom"><div class="chat-error-area" id="chatErrorArea" aria-live="polite"></div><form class="chat-compose-form" id="chatCompose" autocomplete="off"><textarea id="chatText" rows="1" placeholder="Pregunta sobre este vehículo…" enterkeyhint="enter" aria-label="Mensaje a THOKAR"></textarea><button class="chat-send" id="chatSend" type="submit" aria-label="Enviar mensaje"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7"/></svg></button></form><small class="chat-disclaimer">Verifica las indicaciones técnicas antes de intervenir.</small></div>
 </div>`;
}
function applyChatFind(v,direction=0){
 const field=$('#chatFindInput'),label=$('#chatFindCount'),history=$('#chatHistory');if(!field||!history)return;
 const q=chatNorm(field.value).trim(),messages=chatFor(v);
 const indices=q?messages.map((m,i)=>chatNorm(m.text).includes(q)?i:-1).filter(i=>i>=0):[];
 $$('.chat-hit',history).forEach(el=>el.classList.remove('chat-hit','chat-hit-active'));
 if(!indices.length){label.textContent=q?'Sin resultados':'';return}
 let pos=Number(field.dataset.hitPos||0);
 if(direction!==0)pos=(pos+direction+indices.length)%indices.length;
 else if(pos>=indices.length)pos=0;
 field.dataset.hitPos=String(pos);label.textContent=`${pos+1} de ${indices.length}`;
 indices.forEach((i,j)=>{const el=$(`[data-message-index="${i}"]`,history);if(el){el.classList.add('chat-hit');if(j===pos){el.classList.add('chat-hit-active');el.scrollIntoView({block:'center',behavior:'smooth'})}}});
}
function bindChatFind(v){
 const toggle=$('#chatFindToggle'),panel=$('#chatFindPanel'),field=$('#chatFindInput');if(!toggle||!panel)return;
 const open=(term='')=>{panel.hidden=false;field.value=term;field.dataset.hitPos='0';applyChatFind(v);if(!term)field.focus()};
 toggle.onclick=()=>{if(panel.hidden)open();else{panel.hidden=true;$$('.chat-hit',document).forEach(el=>el.classList.remove('chat-hit','chat-hit-active'))}};
 $('#chatFindClose').onclick=()=>toggle.click();
 field.oninput=()=>{field.dataset.hitPos='0';applyChatFind(v)};
 $('#chatFindPrev').onclick=()=>applyChatFind(v,-1);
 $('#chatFindNext').onclick=()=>applyChatFind(v,1);
 if(state.chatJumpTerm){const term=state.chatJumpTerm;state.chatJumpTerm='';requestAnimationFrame(()=>open(term))}
}
function chatScrollEnd(){const c=$('#chatHistory');if(c)requestAnimationFrame(()=>{c.scrollTop=c.scrollHeight})}
function syncChatViewport(){
 const vv=window.visualViewport;
 if(!vv)return;
 document.documentElement.style.setProperty('--chat-visible-height',`${Math.round(vv.height)}px`);
 document.documentElement.style.setProperty('--chat-visible-top',`${Math.round(vv.offsetTop)}px`);
}
function chatAutoHeight(){const el=$('#chatText');if(!el)return;el.style.height='auto';el.style.height=Math.min(125,Math.max(44,el.scrollHeight))+'px'}
function chatErrorUI(v){const box=$('#chatErrorArea');if(!box||state.screen!=='conversation'||state.chatVehicleId!==vehicleId(v))return;const h=chatFor(v),last=h[h.length-1],er=state.chatErrors[vehicleId(v)]||(!state.aiBusy[vehicleId(v)]&&last?.role==='user'?'Esta pregunta aún no tiene respuesta.':'');box.innerHTML=er?`<div class="chat-retry"><span>${esc(er)}</span><button id="retryChat" type="button">Reintentar</button></div>`:'';
 if(er)$('#retryChat').onclick=()=>chatSendMessage(v,null,true);
}
function chatRenderMessages(v){if(state.screen!=='conversation'||state.chatVehicleId!==vehicleId(v))return;const c=$('#chatHistory');if(!c)return;const messages=chatFor(v);c.innerHTML=messages.length?messages.map(renderChatMessage).join(''):'<div class="chat-welcome">Cuéntame qué necesitas revisar de este vehículo.</div>';chatBindMessageActions(v);const finder=$('#chatFindInput');if(finder&&!$('#chatFindPanel')?.hidden&&finder.value.trim())applyChatFind(v);else chatScrollEnd();}
async function aiConversationRequest(v,history){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),56000);
 const contents=history.slice(-9).map(m=>({role:m.role==='model'?'model':'user',parts:[{text:String(m.text||'').slice(-2000)}]}));
 try{
  const r=await fetch('/api/ai/json',{method:'POST',headers:{...auth(),'Content-Type':'application/json'},signal:ctl.signal,
   body:JSON.stringify({purpose:'chat',systemInstruction:{parts:[{text:`Eres THOKAR, asistente técnico de mecánica automotriz. Responde en español de Chile, claro y directo; formato texto plano, sin asteriscos. Este chat corresponde ÚNICAMENTE a: patente ${plate(v)}, ${carName(v)}, año ${v.anio||'no informado'}, motor ${v.motor||'no confirmado'}, VIN ${v.chasis||'no confirmado'}. No mezcles vehículos, no inventes medidas ni reparaciones. La conversación es exploratoria; NO redactes ni modifiques órdenes de trabajo ni informes para clientes. Prioriza una respuesta práctica y breve, explica cómo comprobar hipótesis y evita diagnósticos definitivos sin mediciones.`}]},contents,generationConfig:{temperature:.25,maxOutputTokens:800}})
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const err=new Error(d?.error?.message||`Gemini no respondió (${r.status})`);err.status=r.status;throw err}
  const answer=cleanAiText(d.text||'');if(!answer)throw new Error('Gemini no entregó una respuesta útil.');
  return answer;
 }catch(e){
  if(e.name==='AbortError')throw new Error('Se agotó el tiempo de respuesta. Reintenta sin perder el mensaje.');
  if(e instanceof TypeError)throw new Error('No se pudo contactar con el servidor. Comprueba la conexión e intenta otra vez.');
  throw e;
 }finally{clearTimeout(timer)}
}
function chatBindMessageActions(v){
 const messages=chatFor(v);
 $$('[data-use-tasks]',$('#chatHistory')||document).forEach(b=>{b.onclick=()=>{const m=messages[Number(b.dataset.useTasks)];if(m?.role==='model')useMessageAsTasks(v,m.text,b)}});
}
async function chatSendMessage(v,txt,retry=false){
 const id=vehicleId(v);
 if(state.aiBusy[id])return;
 let messages=[...chatFor(v)];
 if(!retry){txt=String(txt||'').trim();if(!txt)return;messages.push({role:'user',text:txt,at:Date.now()});saveChat(v,messages)}
 else if(!messages.length||messages[messages.length-1].role!=='user'){delete state.chatErrors[id];chatErrorUI(v);return}
 state.aiBusy[id]=true;delete state.chatErrors[id];chatErrorUI(v);
 const current=state.screen==='conversation'&&state.chatVehicleId===id;
 if(current){chatRenderMessages(v);const c=$('#chatHistory');c.insertAdjacentHTML('beforeend','<div class="bubble model chat-loading"><span>Pensando</span><i></i><i></i><i></i></div>');const b=$('#chatSend');if(b)b.disabled=true;chatScrollEnd()}
 try{
  const answer=await aiConversationRequest(v,messages);
  messages.push({role:'model',text:answer,at:Date.now()});saveChat(v,messages);
 }catch(e){state.chatErrors[id]=e.message||'No fue posible responder.'}
 finally{state.aiBusy[id]=false;if(state.screen==='conversation'&&state.chatVehicleId===id){chatRenderMessages(v);chatErrorUI(v);const b=$('#chatSend');if(b)b.disabled=false}}
}
function bindConversation(){
 const v=chatVehicle();if(!v)return;
 const back=$('#chatBack');if(back)back.onclick=()=>go('chats');
 const form=$('#chatCompose'),field=$('#chatText');
 field.addEventListener('input',chatAutoHeight);
 field.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
 form.onsubmit=e=>{e.preventDefault();const t=field.value.trim();if(!t||state.aiBusy[vehicleId(v)])return;field.value='';chatAutoHeight();chatSendMessage(v,t)};
 const send=$('#chatSend');send.disabled=!!state.aiBusy[vehicleId(v)];
 if(state.aiBusy[vehicleId(v)])$('#chatHistory').insertAdjacentHTML('beforeend','<div class="bubble model chat-loading"><span>Pensando</span><i></i><i></i><i></i></div>');
 chatBindMessageActions(v);chatErrorUI(v);chatScrollEnd();bindChatFind(v);const summary=$('#chatClientSummary');if(summary)summary.onclick=()=>openClientSummary(v);
}
$('#sheetClose').onclick=closeSheet;backdrop.onclick=e=>{if(e.target===backdrop)closeSheet()};$('#profileBtn').onclick=()=>go('settings');document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g&&!content.contains(g))go(g.dataset.go)});addEventListener('resize',()=>requestAnimationFrame(moveLens));if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));render();

// ZERO 5.2.4: Samsung/Android edge-to-edge may reserve a visual system-nav
// strip that env(safe-area-inset-bottom) reports as zero. Re-anchor the dock to
// the visible viewport, without jumping over the on-screen keyboard.
function syncAndroidVisibleBottom(){
 const vv=window.visualViewport;
 if(!vv)return;
 const uncovered=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
 const focused=!!document.activeElement?.matches?.('input,textarea,[contenteditable="true"]');
 const keyboard=focused&&uncovered>140;
 document.body.classList.toggle('zero-keyboard-open',keyboard);
 document.documentElement.style.setProperty('--zero-visible-gap',`${Math.round(keyboard?0:Math.min(150,uncovered))}px`);
}
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',syncAndroidVisibleBottom,{passive:true});
 window.visualViewport.addEventListener('resize',syncSheetViewport,{passive:true});
 window.visualViewport.addEventListener('resize',syncChatViewport,{passive:true});
 window.visualViewport.addEventListener('scroll',syncChatViewport,{passive:true});
 window.visualViewport.addEventListener('scroll',syncSheetViewport,{passive:true});
 window.visualViewport.addEventListener('scroll',syncAndroidVisibleBottom,{passive:true});
 window.addEventListener('resize',syncAndroidVisibleBottom,{passive:true});
 window.addEventListener('pageshow',syncAndroidVisibleBottom);
 window.addEventListener('pageshow',syncSheetViewport);
 window.addEventListener('pageshow',syncChatViewport);
 window.addEventListener('resize',syncChatViewport,{passive:true});
 document.addEventListener('focusin',syncAndroidVisibleBottom,{passive:true});
 document.addEventListener('focusout',()=>requestAnimationFrame(syncAndroidVisibleBottom),{passive:true});
 syncAndroidVisibleBottom();
 syncSheetViewport();
}
})();
