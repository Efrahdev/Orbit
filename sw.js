const CACHE='orbit-shell-v2.4.0';
const SHELL=['./','./index.html','./contacts.html','./search-query-builder.html','./orbit-dock.css','./orbit-dock.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./noto-sans.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('orbit-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
if(new URL(req.url).pathname.endsWith('/library.json'))return;
if(req.mode==='navigate'){const u=new URL(req.url);u.search='';const key=u.href;
  // Network first so a deploy shows at once; after 3 s or when offline, fall back to the cached copy of that page.
  e.respondWith(new Promise(resolve=>{let done=false;const fallback=()=>caches.match(key).then(r=>r||caches.match('./index.html'));
    const t=setTimeout(()=>fallback().then(r=>{if(r&&!done){done=true;resolve(r)}}),3000);
    fetch(req).then(r=>{if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(key,copy));}clearTimeout(t);if(!done){done=true;resolve(r)}})
      .catch(()=>{clearTimeout(t);fallback().then(r=>{if(!done){done=true;resolve(r||Response.error())}})});}));return;}
if(SHELL.some(p=>new URL(p,self.registration.scope).href===req.url))e.respondWith(caches.match(req).then(r=>r||fetch(req)));});
