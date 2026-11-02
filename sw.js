/* THOKAR Prototipo 3 · network-first y activación manual */
const CACHE='thokar-prototipo-3-warm-identity';
const SHELL=['./','index.html','styles.css?v=p3','lib.js?v=p3','app.js?v=p3','manifest.webmanifest?v=p3','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)))});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname==='/healthz'){event.respondWith(fetch(req));return}
  event.respondWith(fetch(req,{cache:'no-cache'}).then(res=>{if(res&&res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone()));return res}).catch(()=>caches.match(req,{ignoreSearch:true}).then(hit=>hit||(req.mode==='navigate'?caches.match('index.html'):undefined))))
});
