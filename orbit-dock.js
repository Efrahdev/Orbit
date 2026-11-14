/* Orbit dock: tab switching and swipe-to-switch. Shared by index.html and contacts.html.
   Bookmarks and Contacts can swap sides (Contacts > Settings > Bottom bar); the choice is kept in localStorage. */
(()=>{
'use strict';
const dock=document.getElementById('odock');
if(!dock)return;
const root=document.documentElement;
const page=dock.dataset.active;
const URLS={bookmarks:'./',contacts:'./contacts.html'};
const store={get(k){try{return localStorage.getItem(k)}catch{return null}}};
const haptic=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch{}};
const crossDocVT='CSSViewTransitionRule' in window;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

function applySwap(v){if(v==='1')root.dataset.dockSwap='1';else delete root.dataset.dockSwap}
applySwap(store.get('orbit-dock-swap'));
addEventListener('storage',e=>{if(e.key==='orbit-dock-swap')applySwap(e.newValue)});
window.orbitDockSwap=applySwap;
// Which side is each tab on right now? Used for the slide direction and for swipes.
const sideOf=tab=>((tab==='contacts')!==(root.dataset.dockSwap==='1'))?'right':'left';

let leaving=false;
function go(target){
  if(leaving||target===page)return;
  leaving=true;
  const dir=sideOf(target)==='right'?'forward':'back';
  try{sessionStorage.setItem('orbit-nav',dir)}catch{}
  haptic(8);
  if(crossDocVT||reduce){location.replace(URLS[target]);return}
  root.classList.add('ot-leave-'+dir);
  setTimeout(()=>location.replace(URLS[target]),140);
}
window.orbitGo=go;
addEventListener('pageshow',()=>{leaving=false;root.classList.remove('ot-leave-forward','ot-leave-back');if(surface){surface.style.transition='';surface.style.transform=''}});
setTimeout(()=>root.classList.remove('ot-arrive-forward','ot-arrive-back'),400);

dock.addEventListener('click',e=>{const tab=e.target.closest('[data-tab]');if(tab){e.preventDefault();go(tab.dataset.tab);return}
  if(e.target.closest('.odock-search')){haptic(6);if(window.orbitSearch)window.orbitSearch();else{const f=document.getElementById('search');if(f){window.scrollTo({top:0,behavior:'instant'});f.focus()}}}});
dock.addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- swipe sideways to switch ---------- */
const surface=document.querySelector('[data-swipe-surface]');
const target=page==='bookmarks'?'contacts':'bookmarks';
function blocked(el){
  if(document.querySelector('dialog[open]')||root.classList.contains('layer-open')||document.body.classList.contains('selecting'))return true;
  for(;el&&el!==document.body&&el.nodeType===1;el=el.parentElement){
    if(el.matches('input,textarea,select,dialog,[contenteditable="true"],[data-noswipe],.odock'))return true;
    const ox=getComputedStyle(el).overflowX;
    if((ox==='auto'||ox==='scroll')&&el.scrollWidth>el.clientWidth+2)return true;
  }
  return false;
}
let sx=0,sy=0,st=0,track=false,decided=false,horiz=false,lastDx=0,towards=-1;
addEventListener('touchstart',e=>{
  track=false;
  if(!surface||leaving||e.touches.length!==1)return;
  const t=e.touches[0];
  if(t.clientX<18||t.clientX>innerWidth-18)return; // screen edges belong to the system Back gesture
  if(blocked(e.target))return;
  towards=sideOf(target)==='right'?-1:1; // finger moves left to reach a tab on the right
  sx=t.clientX;sy=t.clientY;st=performance.now();track=true;decided=false;horiz=false;lastDx=0;
},{passive:true});
addEventListener('touchmove',e=>{
  if(!track)return;
  const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(!decided){
    if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
    decided=true;horiz=Math.abs(dx)>Math.abs(dy)*1.4;
    if(!horiz){track=false;return}
    surface.style.transition='none';
  }
  if(e.cancelable)e.preventDefault();
  lastDx=dx;
  const toward=dx*towards;
  surface.style.transform=`translateX(${toward>0?towards*Math.min(toward*.25,48):dx*.06}px)`;
},{passive:false});
function reset(){if(surface){surface.style.transition='transform .2s ease';surface.style.transform=''}}
addEventListener('touchend',()=>{
  if(!track)return;track=false;
  if(!horiz)return;
  const toward=lastDx*towards,v=toward/Math.max(1,performance.now()-st);
  if(toward>90||(toward>50&&v>.5))go(target);else reset();
},{passive:true});
addEventListener('touchcancel',()=>{if(track&&horiz)reset();track=false},{passive:true});
})();
