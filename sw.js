const CACHE='orbit-shell-v2.1.0';
const SHELL=['./','./index.html','./contacts.html','./orbit-dock.css','./orbit-dock.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./noto-sans.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('orbit-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const pageKey=url=>{const p=new URL(url).pathname;return p.endsWith('/contacts.html')?'./contacts.html':p.endsWith('/')||p.endsWith('/index.html')?'./index.html':null;};
self.addEventListener('fetch',e=>{const req=e.request,u=new URL(req.url);if(req.method!=='GET'||u.origin!==self.location.origin)return;
if(u.pathname.endsWith('/library.json'))return;
if(req.mode==='navigate'){const key=pageKey(req.url);
  // Network first (fresh after a deploy), but fall back to the cached page after 3 s or when offline.
  e.respondWith(new Promise(resolve=>{let done=false;const fallback=()=>caches.match(key||req).then(r=>r||caches.match('./index.html'));
    const t=setTimeout(()=>fallback().then(r=>{if(r&&!done){done=true;resolve(r)}}),3000);
    fetch(req).then(r=>{if(r.ok&&key){const copy=r.clone();caches.open(CACHE).then(c=>c.put(key,copy));}clearTimeout(t);if(!done){done=true;resolve(r)}})
      .catch(()=>{clearTimeout(t);fallback().then(r=>{if(!done){done=true;resolve(r||Response.error())}})});}));return;}
if(SHELL.some(p=>new URL(p,self.registration.scope).href===req.url))e.respondWith(caches.match(req).then(r=>r||fetch(req)));});
