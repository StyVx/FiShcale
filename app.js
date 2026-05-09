function esc(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─────────────────────────────────────────────
   DEFAULT FISH
───────────────────────────────────────────── */
const DEFAULTS = [
  {id:'F1',  name:'Soberly self-conscious', image:'img/F1.png',  luc:-5, eur:-3, desc:'salut ça va ?'},
  {id:'F2',  name:'Midkey vibes', image:'img/F2.png',  luc:3,  eur:2,  desc:''},
  {id:'F3',  name:'Feeling cheeky', image:'img/F3.png',  luc:-1, eur:5,  desc:''},
  {id:'F4',  name:'Charisma +1', image:'img/F4.png',  luc:-3, eur:3,  desc:''},
  {id:'F5',  name:'Definitely buzzin`', image:'img/F5.png',  luc:5,  eur:4,  desc:''},
  {id:'F6',  name:'Smoked salmon', image:'img/F6.png',  luc:-2, eur:-5, desc:''},
  {id:'F7',  name:'Deeply tipsy', image:'img/F7.png',  luc:-4, eur:0,  desc:''},
  {id:'F8',  name:'Sorta Blasted', image:'img/F8.png',  luc:4,  eur:1,  desc:''},
  {id:'F9',  name:'Feeling fly like a G6', image:'img/F9.png',  luc:2,  eur:-3, desc:''},
  {id:'F10', name:'Sufficiently sauced', image:'img/F10.png', luc:1,  eur:5,  desc:''},
  {id:'F11', name:'Absolutely torqued', image:'img/F11.png', luc:4,  eur:-3, desc:''},
  {id:'F12', name:'Outright obliterated', image:'img/F12.png', luc:2,  eur:3,  desc:''},
  {id:'F13', name:'Suffering symptoms', image:'img/F13.png', luc:-5, eur:-3, desc:''},
  {id:'F14', name:'Brain dead', image:'img/F14.png', luc:3,  eur:2,  desc:''},
  {id:'F15', name:'Zonked', image:'img/F15.png', luc:5,  eur:4,  desc:''},
  {id:'F16', name:'Dragged through mud', image:'img/F16.png', luc:-2, eur:-5, desc:''},
];

const HonorableMentions = [
  {id:'F17', name:'Smooth sailing', image:'img/F17.png', luc:-4, eur:0,  desc:''},
  {id:'F18', name:'Meow meow meow meow meow :3', image:'img/F18.png', luc:4,  eur:1,  desc:''},
  {id:'F19', name:'Slippery slope', image:'img/F19.png', luc:2,  eur:-3, desc:''},
  {id:'F20', name:'Cunty realness', image:'img/F20.png', luc:1,  eur:5,  desc:''},
  {id:'F21', name:'Wig snatched', image:'img/F21.png', luc:4,  eur:-3, desc:''},
  {id:'F22', name:'Wahoo Wahooooooooo', image:'img/F22.png', luc:2,  eur:3,  desc:''},
  {id:'F23', name:'Blub blub blub blub', image:'img/F23.png', luc:2,  eur:3,  desc:''},
];

/* ─────────────────────────────────────────────
   LOCAL STATE  (session only — not persisted to localStorage)
   All party/user data lives in Firebase.
───────────────────────────────────────────── */
let S = {
  curParty: null,   // party code string
  curUser:  null,   // username string
  pendFish: null,   // id of fish selected but not yet confirmed
  imgMode:  'upload',
  uploadImg: null,
  custom: [],       // custom fish (still local; stored in localStorage)
};

// Custom fish stay local (images can be large base64 blobs)
function saveLocal(){ try{ localStorage.setItem('fihscale_custom', JSON.stringify(S.custom)); }catch(e){} }
function loadLocal(){ try{ const r=localStorage.getItem('fihscale_custom'); if(r) S.custom=JSON.parse(r); }catch(e){} }

// Session persistence (which party/user you belong to)
function saveSession(){ try{ sessionStorage.setItem('fihscale_session', JSON.stringify({curParty:S.curParty,curUser:S.curUser})); }catch(e){} }
function loadSession(){ try{ const r=sessionStorage.getItem('fihscale_session'); if(r){ const d=JSON.parse(r); S.curParty=d.curParty; S.curUser=d.curUser; } }catch(e){} }

function allFish(){ return [...DEFAULTS, ...HonorableMentions, ...(S.custom||[])]; }

/* ─────────────────────────────────────────────
   FIREBASE HELPERS
   `db` is the firebase.database() reference injected by index.html
───────────────────────────────────────────── */

// Shorthand refs
function partyRef(code){ return db.ref('parties/'+code); }
function usersRef(code){ return db.ref('parties/'+code+'/users'); }
function userRef(code, uname){ return db.ref('parties/'+code+'/users/'+sanitize(uname)); }
function historyRef(code, uname){ return db.ref('parties/'+code+'/users/'+sanitize(uname)+'/history'); }

// Firebase keys cannot contain . # $ [ ]
function sanitize(s){ return s.replace(/[.#$\[\]]/g,'_'); }

// Active listener handles so we can detach on leave
let _partyListener = null;
let _partyListenerRef = null;

function attachPartyListener(code){
  detachPartyListener();
  _partyListenerRef = partyRef(code);
  _partyListener = _partyListenerRef.on('value', snap => {
    const party = snap.val();
    if(!party){ toast('❌ Party no longer exists.'); leavePartyLocal(); return; }
    // Re-render whatever page is visible
    const cur = document.querySelector('.page.on')?.id?.replace('page-','');
    if(cur==='board')  renderBoardFromParty(party);
    if(cur==='picker') renderPickerFromParty(party);
    if(cur==='home')   renderHomeFromParty(party);
    updateNavFromParty(party);
  });
}

function detachPartyListener(){
  if(_partyListenerRef && _partyListener){
    _partyListenerRef.off('value', _partyListener);
  }
  _partyListener = null;
  _partyListenerRef = null;
}

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
function showPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(x=>x.classList.remove('on'));
  document.getElementById('page-'+p).classList.add('on');
  const tabEl = document.getElementById('tab-'+p);
  if(tabEl) tabEl.classList.add('on');
  if(p==='addfish') renderLib();
  if(p==='home' && !S.curParty) renderHomeFromParty(null);
  if(p==='picker') renderPicker();
  if(p==='board') renderBoard();
}

function updateNavFromParty(party){
  const has = !!party;
  document.getElementById('tab-picker').disabled = !has;
  document.getElementById('tab-board').disabled  = !has;
  const nu = document.getElementById('nuser');
  if(S.curUser && has){
    nu.style.display='flex';
    document.getElementById('nusername').textContent = S.curUser;
    const lf = latestFishFromParty(party, S.curUser);
    document.getElementById('nfishemoji').textContent = lf ? (lf.emoji||'🐟') : '🐟';
  } else {
    nu.style.display='none';
  }
}
function updateNav(){
  // Called when no party object is handy — just disable tabs
  document.getElementById('tab-picker').disabled = !S.curParty;
  document.getElementById('tab-board').disabled  = !S.curParty;
  document.getElementById('nuser').style.display = 'none';
}

/* ─────────────────────────────────────────────
   PARTY — CREATE
───────────────────────────────────────────── */
function genCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return s;
}

async function createParty(){
  const name  = document.getElementById('cname').value.trim() || 'Mystery Party';
  const pwd   = document.getElementById('cpwd').value.trim();
  const uname = document.getElementById('cuname').value.trim();
  if(!uname){ toast('⚠️ Enter your name!'); return; }

  const code = (pwd || genCode()).toUpperCase();
  const ref  = partyRef(code);

  // Check if already exists
  const snap = await ref.once('value');
  if(snap.exists()){ toast('⚠️ That code already exists. Pick another.'); return; }

  const ukey = sanitize(uname);
  await ref.set({
    name,
    code,
    created: Date.now(),
    host: ukey,
    users: { [ukey]: { displayName: uname, history: [] } }
  });

  S.curParty = code; S.curUser = uname;
  saveSession();
  attachPartyListener(code);
  toast('🎉 Party created! Code: '+code);
  showPage('home');
}

/* ─────────────────────────────────────────────
   PARTY — JOIN
───────────────────────────────────────────── */
async function joinParty(){
  const code  = document.getElementById('jcode').value.trim().toUpperCase();
  const uname = document.getElementById('juname').value.trim();
  if(!code){  toast('⚠️ Enter a party code!'); return; }
  if(!uname){ toast('⚠️ Enter your name!');    return; }

  const ref  = partyRef(code);
  const snap = await ref.once('value');
  if(!snap.exists()){ toast('❌ Party not found. Check the code!'); return; }

  const party = snap.val();
  const ukey  = sanitize(uname);

  // Name taken by someone else?
  if(party.users && party.users[ukey] && party.users[ukey].displayName !== uname){
    toast('❌ That name is taken in this party!'); return;
  }

  // Create user slot if new
  if(!party.users || !party.users[ukey]){
    await userRef(code, uname).set({ displayName: uname, history: [] });
  }

  S.curParty = code; S.curUser = uname;
  saveSession();
  attachPartyListener(code);
  toast('🐟 Welcome '+uname+'!');
  showPage('home');
}

/* ─────────────────────────────────────────────
   PARTY — LEAVE
───────────────────────────────────────────── */
function leavePartyLocal(){
  detachPartyListener();
  S.curParty = null; S.curUser = null; S.pendFish = null;
  saveSession(); updateNav(); renderHomeFromParty(null);
}
function leaveParty(){
  leavePartyLocal();
  toast('👋 Left the party');
}

/* ─────────────────────────────────────────────
   PARTY — SAVE & RESET  (archive current round)
───────────────────────────────────────────── */
async function saveAndReset(){
  if(!S.curParty) return;
  const snap  = await partyRef(S.curParty).once('value');
  const party = snap.val(); if(!party) return;
  if(!confirm(`Archive "${party.name}" and reset all picks?`)) return;

  // Write archive under parties/<code>/archives/<ts>
  const archiveRef = db.ref('parties/'+S.curParty+'/archives/'+Date.now());
  await archiveRef.set(JSON.parse(JSON.stringify(party.users)));

  // Reset all user histories
  const updates = {};
  Object.keys(party.users||{}).forEach(u=>{ updates['parties/'+S.curParty+'/users/'+u+'/history'] = []; });
  await db.ref().update(updates);

  toast('💾 Archived & reset!');
}

/* ─────────────────────────────────────────────
   RENDER HOME
───────────────────────────────────────────── */
function renderHome(){
  // Will be called by listener callback with fresh party data
  if(S.curParty){
    partyRef(S.curParty).once('value').then(snap=>renderHomeFromParty(snap.val()));
  } else {
    renderHomeFromParty(null);
  }
}

function renderHomeFromParty(party){
  const ap = document.getElementById('activepanel');
  if(party && S.curParty){
    ap.style.display='';
    const link = location.href.split('?')[0]+'?party='+S.curParty;
    const userCount = Object.keys(party.users||{}).length;
    document.getElementById('activeinfo').innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-size:19px;font-family:var(--fd);color:var(--a2)">${esc(party.name)}</div>
          <div style="font-size:12px;color:var(--tx2);margin-top:3px">You: <b style="color:var(--tx)">${esc(S.curUser)}</b> &nbsp;·&nbsp; ${userCount} swimmer(s)</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--tx3);letter-spacing:.5px">PARTY CODE</div>
          <div class="party-code">${esc(S.curParty)}</div>
        </div>
      </div>
      <hr class="divider">
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <button class="btn bs bsm" onclick="copyLink('${link}')">📋 Copy Invite Link</button>
        <button class="btn bd bsm" onclick="leaveParty()">🚪 Leave Party</button>
      </div>`;


    // Render users list for home canvas too
    drawGroupGraph(party, 'hcanvas');
    const ul = document.getElementById('userslist');
    if(ul) ul.innerHTML = Object.keys(party.users||{}).map(u=>{
      const f = latestFishFromParty(party, party.users[u].displayName||u);
      const me = (party.users[u].displayName||u) === S.curUser;
      return`<div class="chip${me?' me':''}">${f ? f.emoji : '❓'} ${esc(party.users[u].displayName||u)}${me?' ★':''}</div>`;
    }).join('');
  } else {
    ap.style.display='none';
  }

  // Archives panel — load from Firebase
  if(S.curParty){
    db.ref('parties/'+S.curParty+'/archives').once('value').then(snap=>{
      const archives = snap.val();
      const archp = document.getElementById('archivepanel');
      const al    = document.getElementById('archivelist');
      if(archives){
        archp.style.display='';
        al.innerHTML = Object.entries(archives).map(([ts, users])=>{
          const date = new Date(parseInt(ts)).toLocaleDateString();
          const cnt  = Object.keys(users).length;
          return`<div class="archive-item">
            <div style="font-weight:700">Archived round</div>
            <div style="font-size:11px;color:var(--tx3)">${date} · ${cnt} swimmer(s)</div></div>
          </div>`;
        }).join('');
      } else {
        document.getElementById('archivepanel').style.display='none';
      }
    });
  } else {
    document.getElementById('archivepanel').style.display='none';
  }
}

function copyLink(url){
  navigator.clipboard.writeText(url)
    .then(()=>toast('📋 Link copied!'))
    .catch(()=>prompt('Copy this link:', url));
}

/* ─────────────────────────────────────────────
   PICKER
───────────────────────────────────────────── */
function renderPicker(){
  if(!S.curParty){
    document.getElementById('picknop').style.display='';
    document.getElementById('pickcont').style.display='none';
    return;
  }
  partyRef(S.curParty).once('value').then(snap=>renderPickerFromParty(snap.val()));
}

function renderPickerFromParty(party){
  const nop  = document.getElementById('picknop');
  const cont = document.getElementById('pickcont');
  if(!party){ nop.style.display=''; cont.style.display='none'; return; }
  nop.style.display='none'; cont.style.display='';

  const lf = latestFishFromParty(party, S.curUser);
  document.getElementById('pickstatus').innerHTML =
    `🌊 <b>${party.name}</b> &nbsp;·&nbsp; You are: ${lf ? lf.emoji+' <b>'+(lf.name||'?')+'</b>' : '❓ not picked yet'}&nbsp;&nbsp;<span style="font-size:11px;color:var(--tx3)">Code: <b style="color:var(--a)">${esc(S.curParty)}</b></span>`;

  const grid = document.getElementById('fishgrid');
  const sectionLabel = (title) => `<div class="grid-section-label">${title}</div>`;
  grid.innerHTML =
    sectionLabel('The Fish Vibes Scale') +
    DEFAULTS.map(f => fishCardHTML(f, lf && lf.id === f.id)).join('') +
    sectionLabel('Honorable Mentions') +
    HonorableMentions.map(f => fishCardHTML(f, lf && lf.id === f.id)).join('');
    //injectAds(grid);

  // Re-highlight pending selection if user switched tabs and came back
  if(S.pendFish){
    document.querySelectorAll('.fcard').forEach(c=>c.classList.toggle('sel', c.dataset.id===S.pendFish));
    document.getElementById('confirmbtn').disabled = false;
  } else {
    document.getElementById('confirmbtn').disabled = true;
  }
}

function fishCardHTML(f, sel){
  const imgEl = f.image
    ? `<div class="fcard-img-wrap"><img class="fimg" src="${f.image}" onerror="this.parentElement.innerHTML='<span class=femoji>${f.emoji||'🐟'}</span>'"></div>`
    : `<div class="fcard-img-wrap"><span class="femoji">${f.emoji||'🐟'}</span></div>`;
  return `<div class="fcard${sel?' sel':''}" onclick="selFish('${f.id}')" data-id="${f.id}">
    <div class="tip">${f.desc||'No description.'}</div>
    ${imgEl}
    <div class="fname">${f.name||''}</div>
  </div>`;
}

function selFish(id){
  S.pendFish = id;
  document.querySelectorAll('.fcard').forEach(c=>c.classList.toggle('sel', c.dataset.id===id));
  document.getElementById('confirmbtn').disabled = false;
}

async function confirmPick(){
  if(!S.pendFish || !S.curParty || !S.curUser) return;
  const ukey    = sanitize(S.curUser);
  const hRef    = db.ref('parties/'+S.curParty+'/users/'+ukey+'/history');
  const snap    = await hRef.once('value');
  const history = snap.val() || [];
  history.push({ fishId: S.pendFish, ts: Date.now() });
  await hRef.set(history);

  S.pendFish = null;
  const f = allFish().find(x=>x.id===history[history.length-1].fishId);
  toast(`${f ? (f.emoji||'🐟') : '🐟'} Pick confirmed!`);
  showPage('board');
}

/* ─────────────────────────────────────────────
   LATEST FISH HELPER  (works with party snapshot)
───────────────────────────────────────────── */
function latestFishFromParty(party, uname){
  if(!party || !uname) return null;
  const ukey = sanitize(uname);
  const userData = party.users && party.users[ukey];
  if(!userData) return null;
  const h = userData.history;
  if(!h || !h.length) return null;
  // history can be array or Firebase object with numeric keys
  const entries = Array.isArray(h) ? h : Object.values(h);
  if(!entries.length) return null;
  const last = entries[entries.length-1];
  return allFish().find(f=>f.id===last.fishId) || null;
}

/* ─────────────────────────────────────────────
   BOARD
───────────────────────────────────────────── */
let activeBTab = 'group';

function switchBTab(t){
  activeBTab = t;
  document.getElementById('bgroup').style.display    = t==='group'    ? '' : 'none';
  document.getElementById('bpersonal').style.display = t==='personal' ? '' : 'none';
  document.getElementById('btab-group').classList.toggle('on',    t==='group');
  document.getElementById('btab-personal').classList.toggle('on', t==='personal');
  renderBoard();
}

function renderBoard(){
  if(!S.curParty){
    document.getElementById('boardnop').style.display='';
    document.getElementById('boardcont').style.display='none';
    return;
  }
  partyRef(S.curParty).once('value').then(snap=>renderBoardFromParty(snap.val()));
}

function renderBoardFromParty(party){
  const nop  = document.getElementById('boardnop');
  const cont = document.getElementById('boardcont');
  if(!party){ nop.style.display=''; cont.style.display='none'; return; }
  nop.style.display='none'; cont.style.display='';

  const userCount = Object.keys(party.users||{}).length;
  document.getElementById('boardstatus').innerHTML =
    `🌊 <b>${party.name}</b> &nbsp;·&nbsp; Code: <b style="color:var(--a)">${esc(S.curParty)}</b> &nbsp;·&nbsp; ${userCount} swimmer(s)`;

  drawGroupGraph(party, 'gcanvas');
  drawGroupGraph(party, 'hcanvas');
  drawPersonalGraph(party);

  const ul = document.getElementById('userslist');
  if(ul) ul.innerHTML = Object.keys(party.users||{}).map(ukey=>{
    const udata = party.users[ukey];
    const uname = udata.displayName || ukey;
    const f     = latestFishFromParty(party, uname);
    const me    = uname === S.curUser;
    return `<div class="chip${me?' me':''}">${f?f.emoji:'❓'} ${uname}${me?' ★':''}</div>`;
  }).join('');
}

function refreshBoard(){
  renderBoard();
  toast('🔄 Refreshed!');
}

/* ─────────────────────────────────────────────
   CANVAS GRAPH
───────────────────────────────────────────── */
const UCOLS=['#00d4ff','#00ff9d','#ff6b35','#b44fff','#ffeb3b','#ff4488','#44ffcc','#ff8844'];

function graphBase(ctx,W,H){
  const pad=64,cX=W/2,cY=H/2,gW=W-pad*2,gH=H-pad*2;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#04080f'; ctx.fillRect(0,0,W,H);
  const quads=[
    [pad,pad,gW/2,gH/2,'rgba(255,130,60,0.07)'],
    [cX,pad,gW/2,gH/2,'rgba(0,255,150,0.07)'],
    [pad,cY,gW/2,gH/2,'rgba(80,0,160,0.09)'],
    [cX,cY,gW/2,gH/2,'rgba(0,80,200,0.07)']
  ];
  quads.forEach(([x,y,w,h,c])=>{ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); });
  ctx.save(); ctx.strokeStyle='rgba(0,180,255,0.08)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
  for(let i=1;i<=4;i++){
    ctx.beginPath(); ctx.moveTo(pad+gW*i/4,pad); ctx.lineTo(pad+gW*i/4,pad+gH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad,pad+gH*i/4); ctx.lineTo(pad+gW,pad+gH*i/4); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.strokeStyle='rgba(0,212,255,0.35)'; ctx.lineWidth=1.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(pad,cY); ctx.lineTo(pad+gW,cY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cX,pad); ctx.lineTo(cX,pad+gH); ctx.stroke();
  ctx.restore();
  ctx.font='bold 10px Nunito,sans-serif'; ctx.fillStyle='rgba(90,154,184,0.7)'; ctx.textAlign='center';
  ctx.fillText('CLOUDY',pad+gW*0.18,cY-7);
  ctx.fillText('LUCID', pad+gW*0.82,cY-7);
  ctx.save(); ctx.translate(pad-5,cY-gH*0.28); ctx.rotate(-Math.PI/2); ctx.fillText('EUPHORIC',0,0); ctx.restore();
  ctx.save(); ctx.translate(pad-5,cY+gH*0.28); ctx.rotate(-Math.PI/2); ctx.fillText('FEELING BLUE',0,0); ctx.restore();
  ctx.font='9px Nunito,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.16)';
  ctx.fillText('HAPPY CHAOS',   pad+gW*0.25,pad+14);
  ctx.fillText('THE SWEET SPOT',pad+gW*0.75,pad+14);
  ctx.fillText('THE ABYSS',     pad+gW*0.25,pad+gH-6);
  ctx.fillText('SOBER SADNESS', pad+gW*0.75,pad+gH-6);
  return{pad,cX,cY,gW,gH};
}

function s2c(v,center,half){ return center+(v/5)*half; }

function drawDot(ctx,fish,x,y,label,col,num,imgCache){
  const r=21;
  ctx.save();
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=(fish.col||'#00d4ff')+'28'; ctx.fill();
  ctx.strokeStyle=col||fish.col||'#00d4ff'; ctx.lineWidth=2; ctx.stroke();
  if(fish.image && imgCache && imgCache[fish.id]){
    const img=imgCache[fish.id];
    ctx.save(); ctx.beginPath(); ctx.arc(x,y,r-2,0,Math.PI*2); ctx.clip();
    ctx.drawImage(img,x-r+2,y-r+2,(r-2)*2,(r-2)*2); ctx.restore();
  } else {
    ctx.font='20px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(fish.emoji||'🐟',x,y+1);
  }
  if(num!==undefined){
    ctx.beginPath(); ctx.arc(x+r*.65,y-r*.65,9,0,Math.PI*2);
    ctx.fillStyle='#04080f'; ctx.fill();
    ctx.strokeStyle=col||'#00d4ff'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 9px Nunito'; ctx.fillStyle='#fff';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(num),x+r*.65,y-r*.65+1);
  }
  if(label){
    ctx.font='bold 10px Nunito,sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='top';
    const tw=ctx.measureText(label).width+8;
    ctx.fillStyle='rgba(4,8,15,0.85)';
    ctx.beginPath(); ctx.roundRect(x-tw/2,y+r+3,tw,15,4); ctx.fill();
    ctx.fillStyle=col||'#d8f0ff';
    ctx.fillText(label,x,y+r+5);
  }
  ctx.restore();
}

function drawGroupGraph(party, canvasId){
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const{pad,cX,cY,gW,gH}=graphBase(ctx,W,H);

  const legendEl=document.getElementById('glegend');
  const items=[];
  const usersArr=Object.keys(party.users||{});
  const fishImages={};
  let toLoad=0, loaded=0;

  usersArr.forEach(ukey=>{
    const udata=party.users[ukey];
    const uname=udata.displayName||ukey;
    const f=latestFishFromParty(party,uname);
    if(f&&f.image) toLoad++;
  });

  function doDraw(){
    let ci=0;
    usersArr.forEach(ukey=>{
      const udata=party.users[ukey];
      const uname=udata.displayName||ukey;
      const f=latestFishFromParty(party,uname); if(!f) return;
      const x=s2c(f.luc,cX,gW/2), y=s2c(-f.eur,cY,gH/2);
      const col=UCOLS[ci%UCOLS.length]; ci++;
      const me=uname===S.curUser;
      drawDot(ctx,f,x,y,uname+(me?' ★':''),col,undefined,fishImages);
      items.push(`<div class="legitem"><div class="legdot" style="background:${col}"></div>${f.emoji||'🐟'} ${uname}</div>`);
    });
    if(legendEl) legendEl.innerHTML=items.join('');
    if(!usersArr.some(ukey=>latestFishFromParty(party,party.users[ukey].displayName||ukey))){
      ctx.font='bold 15px Nunito'; ctx.fillStyle='rgba(90,154,184,0.5)';
      ctx.textAlign='center'; ctx.fillText('No one has picked a fish yet!',W/2,H/2);
    }
  }

  usersArr.forEach(ukey=>{
    const udata=party.users[ukey];
    const uname=udata.displayName||ukey;
    const f=latestFishFromParty(party,uname);
    if(f&&f.image){
      const img=new Image();
      img.onload=()=>{ fishImages[f.id]=img; loaded++; if(loaded===toLoad) doDraw(); };
      img.onerror=()=>{ loaded++; if(loaded===toLoad) doDraw(); };
      img.src=f.image;
    }
  });
  if(toLoad===0) doDraw();
}

function drawPersonalGraph(party){
  const canvas=document.getElementById('pcanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const{pad,cX,cY,gW,gH}=graphBase(ctx,W,H);

  if(!S.curUser||!party.users) return;
  const ukey=sanitize(S.curUser);
  const udata=party.users[ukey]; if(!udata) return;
  const h=udata.history;
  const entries=Array.isArray(h)?h:(h?Object.values(h):[]);

  if(!entries.length){
    ctx.font='bold 14px Nunito'; ctx.fillStyle='rgba(90,154,184,0.5)';
    ctx.textAlign='center'; ctx.fillText('No picks yet — go catch some fish!',W/2,H/2);
    return;
  }

  const pts=entries.map(e=>{
    const f=allFish().find(x=>x.id===e.fishId); if(!f) return null;
    return{x:s2c(f.luc,cX,gW/2), y:s2c(-f.eur,cY,gH/2), f};
  }).filter(Boolean);

  if(pts.length>1){
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='rgba(0,212,255,0.25)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.stroke();
    ctx.restore();
  }
  pts.forEach((pt,i)=>drawDot(ctx,pt.f,pt.x,pt.y,null,i===pts.length-1?'#00ff9d':'rgba(0,212,255,0.55)',i+1,{}));
}

/* ─────────────────────────────────────────────
   ADD FISH  (custom fish are local only)
───────────────────────────────────────────── */
let curITab='upload', eraserOn=false, drawHist=[];

function switchITab(t,btn){
  curITab=t;
  document.querySelectorAll('.itab').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.ipanel').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('ip-'+t).classList.add('on');
  updatePreview();
}
function handleUpload(e){
  const file=e.target.files[0]; if(!file) return;
  const rd=new FileReader();
  rd.onload=ev=>{ S.uploadImg=ev.target.result; document.getElementById('uploadlabel').textContent='✅ '+file.name; updatePreview(); };
  rd.readAsDataURL(file);
}
function getImgData(){
  if(curITab==='upload'&&S.uploadImg) return S.uploadImg;
  if(curITab==='url'){ const v=document.getElementById('afurl').value.trim(); return v||null; }
  if(curITab==='draw'){
    const c=document.getElementById('drawCanvas');
    const ctx=c.getContext('2d');
    const d=ctx.getImageData(0,0,c.width,c.height).data;
    const has=[...d].some((v,i)=>i%4===3&&v>10);
    return has?c.toDataURL():null;
  }
  return null;
}
function updatePreview(){
  const name  = document.getElementById('afname').value||'Your Fish';
  const emoji = '🐟';
  const desc  = document.getElementById('afdesc').value||'Add a description...';
  document.getElementById('fprevname').textContent=name;
  //document.getElementById('fprevemoji').textContent=emoji;
  document.getElementById('fprevdesc').textContent=desc;
  const img=getImgData();
  const box=document.getElementById('fprev');
  box.innerHTML=img?`<img src="${img}" onerror="this.parentNode.innerHTML='<span>${emoji}</span>'">`:`<span>${emoji}</span>`;
}
function addFish(){
  const name=document.getElementById('afname').value.trim();
  if(!name){ toast('⚠️ Fish needs a name!'); return; }
  const luc   = parseInt(document.getElementById('afluc').value);
  const eur   = parseInt(document.getElementById('afeur').value);
  const desc  = document.getElementById('afdesc').value.trim();
  const image = getImgData();
  const id    = 'c_'+Date.now();
  const cols  = ['#ff6b35','#b44fff','#00ff9d','#ff4488','#ffeb3b','#00ccff','#ff8844'];
  const col   = cols[Math.floor(Math.random()*cols.length)];
  S.custom=S.custom||[];
  S.custom.push({id,name,emoji:'🐟',col,luc,eur,desc,image,isCustom:true});
  saveLocal();
  document.getElementById('afname').value='';
  document.getElementById('afdesc').value='';
  document.getElementById('afluc').value=0; document.getElementById('afluv').textContent='0';
  document.getElementById('afeur').value=0; document.getElementById('afeuv').textContent='0';
  S.uploadImg=null;
  document.getElementById('uploadlabel').textContent='Click to upload · PNG, JPG, GIF, WebP';
  document.getElementById('afurl').value='';
  clearDraw(); updatePreview(); renderLib();
  toast(`🐟 ${name} added to the scale!`);
}
function renderLib(){
  const grid=document.getElementById('libgrid'); if(!grid) return;
  grid.innerHTML=allFish().map(f=>{
    const imgEl=f.image
      ?`<div class="fcard-img-wrap"><img class="fimg" src="${f.image}" onerror="this.parentElement.innerHTML='<span class=femoji>${f.emoji||'🐟'}</span>'"></div>`
      :`<div class="fcard-img-wrap"><span class="femoji">${f.emoji||'🐟'}</span></div>`;
    const delBtn=f.isCustom?`<button class="btn bd bsm" style="margin:6px auto;font-size:10px;padding:3px 8px;display:flex" onclick="delFish('${f.id}')">🗑 Remove</button>`:'';
    return`<div class="fcard" style="cursor:default">
      <div class="tip">${f.desc||'No description.'}</div>
      ${imgEl}
      <div class="fname">${f.name||''}</div>
      ${delBtn}
    </div>`;
  }).join('');
  injectAds(grid);
}
function delFish(id){
  if(!confirm('Remove this fish from the scale?')) return;
  S.custom=S.custom.filter(f=>f.id!==id); saveLocal(); renderLib(); toast('🗑 Fish removed');
}

/* ─────────────────────────────────────────────
   DRAWING CANVAS
───────────────────────────────────────────── */
function initDraw(){
  const c=document.getElementById('drawCanvas');
  const ctx=c.getContext('2d');
  ctx.fillStyle='#060e1c'; ctx.fillRect(0,0,c.width,c.height);
  let drawing=false,lx=0,ly=0;
  function pos(e){
    const r=c.getBoundingClientRect();
    const sx=c.width/r.width, sy=c.height/r.height;
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    return[(cx-r.left)*sx,(cy-r.top)*sy];
  }
  c.addEventListener('mousedown',e=>{e.preventDefault();drawing=true;drawHist.push(ctx.getImageData(0,0,c.width,c.height));[lx,ly]=pos(e);});
  c.addEventListener('mousemove',e=>{
    e.preventDefault(); if(!drawing) return;
    const[x,y]=pos(e);
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(x,y);
    ctx.strokeStyle=eraserOn?'#060e1c':document.getElementById('dcolor').value;
    ctx.lineWidth=parseInt(document.getElementById('dsize').value);
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
    lx=x; ly=y;
  });
  c.addEventListener('mouseup',()=>drawing=false);
  c.addEventListener('mouseleave',()=>drawing=false);
  c.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;drawHist.push(ctx.getImageData(0,0,c.width,c.height));[lx,ly]=pos(e);},{passive:false});
  c.addEventListener('touchmove',e=>{
    e.preventDefault(); if(!drawing) return;
    const[x,y]=pos(e);
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(x,y);
    ctx.strokeStyle=eraserOn?'#060e1c':document.getElementById('dcolor').value;
    ctx.lineWidth=parseInt(document.getElementById('dsize').value);
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
    lx=x; ly=y;
  },{passive:false});
  c.addEventListener('touchend',()=>drawing=false);
}
function toggleEraser(btn){
  eraserOn=!eraserOn;
  btn.textContent=eraserOn?'✏️ Draw':'🧹 Eraser';
  btn.classList.toggle('on',eraserOn);
}
function undoDraw(){
  if(!drawHist.length) return;
  const c=document.getElementById('drawCanvas');
  c.getContext('2d').putImageData(drawHist.pop(),0,0);
}
function clearDraw(){
  drawHist=[];
  const c=document.getElementById('drawCanvas');
  const ctx=c.getContext('2d');
  ctx.fillStyle='#060e1c'; ctx.fillRect(0,0,c.width,c.height);
}

/* ─────────────────────────────────────────────
   ADS
───────────────────────────────────────────── */
const ADS=[
  {brand:'FISH GULP™',    tagline:'Energy drink for certified party fish 🐟',         emoji:'🍹',gradient:'linear-gradient(100deg,rgba(0,30,60,0.95) 0%,rgba(0,80,120,0.85) 100%)',   accent:'#00d4ff',ctaBg:'#00d4ff',ctaColor:'#000',cta:'Get a can',  msg:'🍹 Not an actual ad, go drink some water!'},
  {brand:'AQUA RAVE',     tagline:'Every Friday night — No sardines allowed 🪩',       emoji:'🌐',gradient:'linear-gradient(100deg,rgba(30,0,60,0.95) 0%,rgba(80,0,120,0.85) 100%)',   accent:'#b44fff',ctaBg:'#b44fff',ctaColor:'#fff',cta:'Get tickets',msg:'🐠 Not an actual ad either. Pace yourself.'},
  {brand:'DEEP SEA VPN',  tagline:'Browse the dark web of the ocean, anonymously',    emoji:'🦑',gradient:'linear-gradient(100deg,rgba(0,20,20,0.95) 0%,rgba(0,60,50,0.85) 100%)',    accent:'#00ff9d',ctaBg:'#00ff9d',ctaColor:'#000',cta:'Try free',  msg:'🦑 Not a real VPN. Your data is already wet.'},
  {brand:'KELP & CO.',    tagline:'Premium seaweed snacks for the discerning fish',   emoji:'🌿',gradient:'linear-gradient(100deg,rgba(10,25,0,0.95) 0%,rgba(30,70,10,0.85) 100%)',   accent:'#a8ff3e',ctaBg:'#a8ff3e',ctaColor:'#000',cta:'Shop now',  msg:'🌿 Not edible. Please eat actual food tonight.'}
];
function makeAdEl(adIdx){
  const a=ADS[adIdx%ADS.length];
  const el=document.createElement('div'); el.className='ad-banner';
  el.innerHTML=`<div class="ad-label">SPONSORED</div>
    <div class="ad-inner" style="background:${a.gradient};border:1px solid ${a.accent}33;border-radius:10px">
      <div class="ad-icon">${a.emoji}</div>
      <div class="ad-copy"><div class="ad-brand" style="color:${a.accent}">${a.brand}</div><div class="ad-tagline">${a.tagline}</div></div>
      <button class="ad-cta" style="background:${a.ctaBg};color:${a.ctaColor}">${a.cta}</button>
    </div>`;
  el.addEventListener('click',()=>toast(a.msg));
  return el;
}
let _adsFixed=[];
function renderSideAds(){
  _adsFixed.forEach(el=>el.remove()); _adsFixed=[];
  const W=window.innerWidth, mainW=860, sideSpace=(W-mainW)/2;
  if(sideSpace>=220){
    const positions=[{top:'80px',left:'10px'},{top:'80px',right:'10px'},{bottom:'30px',left:'10px'},{bottom:'30px',right:'10px'}];
    ADS.forEach((a,i)=>{ const el=makeAdEl(i); el.classList.add('ad-fixed'); Object.assign(el.style,positions[i]||{top:'80px',right:'10px'}); document.body.appendChild(el); _adsFixed.push(el); });
  } else { injectInlineAds(); }
}
function injectInlineAds(){
  ['fishgrid','libgrid'].forEach((gid,gi)=>{
    const grid=document.getElementById(gid); if(!grid) return;
    grid.querySelectorAll('.ad-inline-wrap').forEach(el=>el.remove());
    const cards=[...grid.children]; if(cards.length<4) return;
    let adN=gi*2;
    for(let i=8;i<cards.length;i+=9){
      const outer=document.createElement('div');
      outer.className='ad-inline-wrap'; outer.style.cssText='grid-column:1/-1;margin:4px 0';
      outer.appendChild(makeAdEl(adN++));
      const ref=cards[i]; if(ref) grid.insertBefore(outer,ref);
    }
  });
}
function injectAds(gridEl){
  gridEl.querySelectorAll('.ad-inline-wrap').forEach(el=>el.remove());
  renderSideAds();
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
let toastT;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('on');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),3000);
}

/* ─────────────────────────────────────────────
   BUBBLES
───────────────────────────────────────────── */
function initBubbles(){
  const cont=document.getElementById('bubbles');
  for(let i=0;i<18;i++){
    const b=document.createElement('div'); b.className='bubble';
    const sz=Math.random()*40+10;
    b.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;animation-duration:${Math.random()*18+12}s;animation-delay:${Math.random()*12}s`;
    cont.appendChild(b);
  }
}

/* ─────────────────────────────────────────────
   ROUNDRECT POLYFILL
───────────────────────────────────────────── */
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    this.beginPath(); this.moveTo(x+r,y); this.lineTo(x+w-r,y);
    this.quadraticCurveTo(x+w,y,x+w,y+r); this.lineTo(x+w,y+h-r);
    this.quadraticCurveTo(x+w,y+h,x+w-r,y+h); this.lineTo(x+r,y+h);
    this.quadraticCurveTo(x,y+h,x,y+h-r); this.lineTo(x,y+r);
    this.quadraticCurveTo(x,y,x+r,y); this.closePath();
  };
}

/* ─────────────────────────────────────────────
   INIT
   Note: `db` is set by the Firebase snippet at the bottom of index.html
   before this script runs, so it is available here.
───────────────────────────────────────────── */
function init(){
  loadLocal();
  loadSession();

  // Auto-fill party code from URL ?party=XXXX
  const p=new URLSearchParams(location.search).get('party');
  if(p) document.getElementById('jcode').value=p.toUpperCase();

  // Re-attach Firebase listener if returning to an active session
  if(S.curParty && S.curUser){
    attachPartyListener(S.curParty);
  } else {
    updateNav();
    renderHomeFromParty(null);
  }

  initDraw();
  renderLib();
  initBubbles();
  renderSideAds();
  window.addEventListener('resize', ()=>renderSideAds());

  // Periodic board refresh as a safety net (listener already pushes updates)
  setInterval(()=>{
    if(document.getElementById('page-board').classList.contains('on')) renderBoard();
  }, 30000);
}

// Wait until Firebase `db` is ready (index.html initialises it after this script)
window.addEventListener('load', init);
