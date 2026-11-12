const CACHE='orbit-shell-v2.1.0';
const SHELL=['./','./index.html','./search-query-builder.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./noto-sans.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('orbit-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
if(new URL(e.request.url).pathname.endsWith('/library.json'))return;
if(e.request.mode==='navigate'){const u=new URL(e.request.url);u.search='';const key=u.href;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(key,copy));}return r;}).catch(()=>caches.match(key).then(r=>r||caches.match('./index.html'))));return;}
if(SHELL.some(p=>new URL(p,self.registration.scope).href===e.request.url))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});