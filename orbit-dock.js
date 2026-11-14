/* Orbit dock: tab switching, swipe-to-switch, hold-to-move (left / centre / right). Shared by index.html and contacts.html. */
(()=>{
'use strict';
const dock=document.getElementById('odock');
if(!dock)return;
const root=document.documentElement;
const page=dock.dataset.active;
const ORDER=['bookmarks','contacts'];
const URLS={bookmarks:'./',contacts:'./contacts.html'};
const ICONS={
  bookmarks:'<svg viewBox="0 0 24 24"><path d="M7 3.5h10a1 1 0 0 1 1 1V20l-6-3.6L6 20V4.5a1 1 0 0 1 1-1z"/></svg>',
  contacts:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20c.8-3.6 3.7-5.8 7.2-5.8s6.4 2.2 7.2 5.8"/></svg>'
};
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const haptic=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch{}};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const crossDocVT='CSSViewTransitionRule' in window;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- position (handedness) ---------- */
const POS=['left','center','right'];
function setPos(p){if(!POS.includes(p))p='center';dock.dataset.pos=p;root.dataset.dockPos=p;dispatchEvent(new CustomEvent('orbit-dock-pos',{detail:p}))}
setPos(store.get('orbit-dock-pos')||'center');
addEventListener('storage',e=>{if(e.key==='orbit-dock-pos')setPos(e.newValue)});

/* ---------- switching pages ---------- */
let leaving=false;
function go(target){
  if(leaving)return;
  if(target===page){haptic(6);dock.querySelector('.odock-glow')?.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:320,easing:'cubic-bezier(.2,.9,.3,1.3)'});return}
  leaving=true;
  const dir=ORDER.indexOf(target)>ORDER.indexOf(page)?'forward':'back';
  try{sessionStorage.setItem('orbit-nav',dir)}catch{}
  haptic(10);
  if(crossDocVT||reduce){location.replace(URLS[target]);return}
  root.classList.add('ot-leave-'+dir);
  setTimeout(()=>location.replace(URLS[target]),170);
}
window.orbitGo=go;
addEventListener('pageshow',()=>{leaving=false;root.classList.remove('ot-leave-forward','ot-leave-back');if(surface){surface.style.transition='';surface.style.transform=''}});
setTimeout(()=>root.classList.remove('ot-arrive-forward','ot-arrive-back'),700);

/* ---------- hold the dock to move it ---------- */
let lpTimer=0,moving=false,suppressClick=false,startX=0,startLeft=0,pid=null,guides=null;
function makeGuides(){if(guides)return guides;guides=document.createElement('div');guides.className='odock-guides';guides.setAttribute('aria-hidden','true');guides.innerHTML='<i></i><i></i><i></i>';document.body.appendChild(guides);return guides}
function nearest(){const r=dock.getBoundingClientRect(),c=r.left+r.width/2,w=innerWidth;const slots=[r.width/2+14,w/2,w-r.width/2-14];let best=0;slots.forEach((s,i)=>{if(Math.abs(s-c)<Math.abs(slots[best]-c))best=i});return best}
function enterMove(){
  moving=true;suppressClick=true;haptic([12,40,12]);
  startLeft=dock.getBoundingClientRect().left;
  dock.style.transition='transform .25s,box-shadow .25s';dock.style.left=startLeft+'px';
  dock.classList.add('moving');makeGuides().classList.add('show');markNear();
  try{if(pid!==null)dock.setPointerCapture(pid)}catch{}
}
function markNear(){if(!guides)return;const n=nearest();[...guides.children].forEach((g,i)=>g.classList.toggle('near',i===n))}
let lastNear=-1;
dock.addEventListener('pointerdown',e=>{if(e.button>0)return;pid=e.pointerId;startX=e.clientX;clearTimeout(lpTimer);lpTimer=setTimeout(enterMove,430)});
dock.addEventListener('pointermove',e=>{
  if(!moving){if(Math.abs(e.clientX-startX)>10)clearTimeout(lpTimer);return}
  const w=dock.offsetWidth,x=clamp(startLeft+e.clientX-startX,6,innerWidth-w-6);dock.style.left=x+'px';markNear();
  const n=nearest();if(n!==lastNear){if(lastNear!==-1)haptic(5);lastNear=n}
});
function endPress(){
  clearTimeout(lpTimer);
  if(!moving)return;
  moving=false;lastNear=-1;
  const p=POS[nearest()];
  dock.classList.remove('moving');guides?.classList.remove('show');
  dock.style.transition='';requestAnimationFrame(()=>{dock.style.left='';setPos(p);store.set('orbit-dock-pos',p)});
  haptic(14);
  hint(p==='center'?'Dock centred':'Dock moved to the '+p+' for one-handed use');
  setTimeout(()=>{suppressClick=false},380);
}
dock.addEventListener('pointerup',endPress);
dock.addEventListener('pointercancel',endPress);
dock.addEventListener('lostpointercapture',()=>{if(moving)endPress()});
dock.addEventListener('contextmenu',e=>e.preventDefault());
dock.addEventListener('click',e=>{
  if(suppressClick){e.preventDefault();e.stopImmediatePropagation();return}
  const tab=e.target.closest('[data-tab]');
  if(tab){e.preventDefault();go(tab.dataset.tab);return}
  const fab=e.target.closest('.fab');
  if(fab){haptic(8);fab.classList.add('burst');setTimeout(()=>fab.classList.remove('burst'),900)}
},true);

/* ---------- one-time hint ---------- */
let hintEl=null,hintTimer=0;
function hint(text,ms=2600){
  if(!hintEl){hintEl=document.createElement('div');hintEl.className='odock-hint';hintEl.setAttribute('role','status');document.body.appendChild(hintEl)}
  hintEl.textContent=text;clearTimeout(hintTimer);requestAnimationFrame(()=>hintEl.classList.add('show'));
  hintTimer=setTimeout(()=>hintEl.classList.remove('show'),ms);
}
if(!store.get('orbit-dock-tip')&&matchMedia('(pointer:coarse)').matches){
  setTimeout(()=>{hint('Swipe sideways to switch · hold the dock to move it',5200);store.set('orbit-dock-tip','1')},1400);
}

/* ---------- swipe anywhere to switch ---------- */
const surface=document.querySelector('[data-swipe-surface]');
const target=page==='bookmarks'?'contacts':'bookmarks';
const towards=page==='bookmarks'?-1:1; // finger moves left on Bookmarks, right on Contacts
let portal=null;
function makePortal(){if(portal)return portal;portal=document.createElement('div');portal.className='oswipe '+(towards<0?'right':'left');portal.setAttribute('aria-hidden','true');portal.innerHTML=ICONS[target];document.body.appendChild(portal);return portal}
function blocked(el){
  if(document.querySelector('dialog[open]')||root.classList.contains('layer-open'))return true;
  for(;el&&el!==document.body&&el.nodeType===1;el=el.parentElement){
    if(el.matches('input,textarea,select,dialog,[contenteditable="true"],[data-noswipe],.odock'))return true;
    const ox=getComputedStyle(el).overflowX;
    if((ox==='auto'||ox==='scroll')&&el.scrollWidth>el.clientWidth+2)return true;
  }
  return false;
}
let sx=0,sy=0,st=0,track=false,decided=false,horiz=false,armed=false,lastDx=0;
function reset(spring){
  if(surface){surface.style.transition=spring?'transform .45s cubic-bezier(.2,.9,.3,1.25),opacity .3s':'';surface.style.transform='';surface.style.opacity=''}
  if(portal){portal.style.transition='transform .3s,opacity .25s';portal.style.opacity='0';portal.style.transform='scale(.4)';portal.classList.remove('armed')}
}
addEventListener('touchstart',e=>{
  track=false;
  if(!surface||leaving||e.touches.length!==1)return;
  const t=e.touches[0];
  if(t.clientX<18||t.clientX>innerWidth-18)return; // leave the screen edges to the system back gesture
  if(blocked(e.target))return;
  sx=t.clientX;sy=t.clientY;st=performance.now();track=true;decided=false;horiz=false;armed=false;lastDx=0;
},{passive:true});
addEventListener('touchmove',e=>{
  if(!track)return;
  const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(!decided){
    if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
    decided=true;horiz=Math.abs(dx)>Math.abs(dy)*1.35;
    if(!horiz){track=false;return}
    makePortal();surface.style.transition='none';portal.style.transition='none';
  }
  if(!horiz)return;
  if(e.cancelable)e.preventDefault();
  lastDx=dx;
  const toward=dx*towards; // positive when moving toward the other tab
  const off=toward>0?towards*Math.min(toward*.42,120):dx*.12;
  surface.style.transform=`translateX(${off}px)`;
  surface.style.opacity=String(1-Math.min(Math.max(toward,0)/600,.25));
  const p=clamp(toward/105,0,1);
  portal.style.opacity=String(Math.min(1,p*1.4));
  portal.style.transform=`scale(${.4+p*.6}) rotate(${(1-p)*-40*towards}deg)`;
  if(p>=1&&!armed){armed=true;portal.classList.add('armed');haptic(12)}
  else if(p<1&&armed){armed=false;portal.classList.remove('armed')}
},{passive:false});
function touchEnd(){
  if(!track)return;track=false;
  if(!horiz){return}
  const toward=lastDx*towards,v=toward/Math.max(1,performance.now()-st);
  if(armed||(toward>55&&v>.55)){
    if(portal){portal.style.transition='transform .35s cubic-bezier(.2,.9,.3,1.3),opacity .35s';portal.style.transform='scale(1.35)';portal.style.opacity='0'}
    go(target);
  }else reset(true);
}
addEventListener('touchend',touchEnd,{passive:true});
addEventListener('touchcancel',()=>{if(track&&horiz)reset(true);track=false},{passive:true});
})();
