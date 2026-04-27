/* ─────────────────────────────────────────────
   DEFAULT FISH
───────────────────────────────────────────── */
const DEFAULTS = [
  {id:'F1', name:'', image:'img/F1.JPG', luc:-5, eur:-3, desc:'Brain dead. Completely zoned out. The lights are off and nobody is home.'},
  {id:'F2', name:'', image:'img/F2.JPG', luc:3, eur:2, desc:'Smooth sailing. Sharp, steady — the best version of yourself at a party.'},
  {id:'F3', name:'', image:'img/F3.JPG', luc:-1, eur:5, desc:'Everything is the funniest thing ever. Absolute chaos energy, no regrets.'},
  {id:'F4', name:'', image:'img/F4.JPG', luc:-3, eur:3, desc:'Bloated with confidence. Questionable decisions incoming. Watch out.'},
  {id:'F5', name:'', image:'img/F5.JPG',luc:5, eur:4, desc:'Bright, bubbly, and fully present. The suspiciously responsible one tonight.'},
  {id:'F6', name:'', image:'img/F6.JPG', luc:-2, eur:-5, desc:'Lurking in the deep dark abyss. Do not approach. Do not make eye contact.'},
  {id:'F7', name:'', image:'img/F7.JPG', luc:-4, eur:0, desc:'Just drifting. No thoughts, head empty. What is a WiFi password?'},
  {id:'F8', name:'', image:'img/F8.JPG', luc:4, eur:1, desc:'Sharp and focused. You could legitimately solve a maths problem right now.'},
  {id:'F9', name:'', image:'img/F9.JPG', luc:2, eur:-3, desc:'Overwhelmed and a little sad. The party is loud, you are tired, you miss your bed.'},
  {id:'F10', name:'', image:'img/F10.JPG', luc:1, eur:5, desc:'Absolutely sky high. You have transcended earthly concerns. Legendary status.'},
  {id:'F11', name:'', image:'img/F11.JPG', luc:4, eur:-3, desc:'Stone cold sober and mildly bored. Counting the tiles on the ceiling.'},
  {id:'F12', name:'', image:'img/F12.JPG', luc:2, eur:3, desc:'Buzzing with raw energy. Unpredictable, electrifying, touch you and get shocked.'},
  {id:'F13', name:'', image:'img/F13.JPG', luc:-5, eur:-3, desc:'Brain dead. Completely zoned out. The lights are off and nobody is home.'},
  {id:'F14', name:'', image:'img/F14.JPG', luc:3, eur:2, desc:'Smooth sailing. Sharp, steady — the best version of yourself at a party.'},
  {id:'F15', name:'', image:'img/F15.JPG', luc:5, eur:4, desc:'Bright, bubbly, and fully present. The suspiciously responsible one tonight.'},
  {id:'F16', name:'', image:'img/F16.JPG', luc:-2, eur:-5, desc:'Lurking in the deep dark abyss. Do not approach. Do not make eye contact.'},
  {id:'F17', name:'', image:'img/F17.JPG', luc:-4, eur:0, desc:'Just drifting. No thoughts, head empty. What is a WiFi password?'},
  {id:'F18', name:'', image:'img/F18.JPG', luc:4, eur:1, desc:'Sharp and focused. You could legitimately solve a maths problem right now.'},
  {id:'F19', name:'', image:'img/F19.JPG', luc:2, eur:-3, desc:'Overwhelmed and a little sad. The party is loud, you are tired, you miss your bed.'},
  {id:'F20', name:'', image:'img/F20.JPG',luc:1, eur:5, desc:'Absolutely sky high. You have transcended earthly concerns. Legendary status.'},
  {id:'F21', name:'', image:'img/F21.JPG', luc:4, eur:-3, desc:'Stone cold sober and mildly bored. Counting the tiles on the ceiling.'},
  {id:'F22', name:'', image:'img/F22.JPG', luc:2, eur:3, desc:'Buzzing with raw energy. Unpredictable, electrifying, touch you and get shocked.'},
];

/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
let S = {parties:{},custom:[],curParty:null,curUser:null,saved:[],pendFish:null,imgMode:'upload',uploadImg:null};

function save(){try{localStorage.setItem('fihscale3',JSON.stringify(S))}catch(e){}}
function load(){try{const r=localStorage.getItem('fihscale3');if(r)S={...S,...JSON.parse(r)}}catch(e){}}
function allFish(){return[...DEFAULTS,...(S.custom||[])]}

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
function showPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(x=>x.classList.remove('on'));
  document.getElementById('page-'+p).classList.add('on');
  document.getElementById('tab-'+p).classList.add('on');
  if(p==='board')renderBoard();
  if(p==='picker')renderPicker();
  if(p==='addfish')renderLib();
  if(p==='home')renderHome();
}
function updateNav(){
  const party=S.curParty?S.parties[S.curParty]:null;
  const has=!!party;
  document.getElementById('tab-picker').disabled=!has;
  document.getElementById('tab-board').disabled=!has;
  const nu=document.getElementById('nuser');
  if(S.curUser&&has){
    nu.style.display='flex';
    document.getElementById('nusername').textContent=S.curUser;
    const lf=latestFish();
    document.getElementById('nfishemoji').textContent=lf?lf.emoji:'🐟';
  }else nu.style.display='none';
}

/* ─────────────────────────────────────────────
   PARTY
───────────────────────────────────────────── */
function genCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s='';for(let i=0;i<4;i++)s+=c[Math.floor(Math.random()*c.length)];return s;
}
function createParty(){
  const name=document.getElementById('cname').value.trim()||'Mystery Party';
  const pwd=document.getElementById('cpwd').value.trim();
  const uname=document.getElementById('cuname').value.trim();
  if(!uname){toast('⚠️ Enter your name!');return;}
  const code=(pwd||genCode()).toUpperCase();
  if(S.parties[code]){toast('⚠️ That code exists already. Pick another.');return;}
  S.parties[code]={name,code,created:Date.now(),users:{[uname]:{history:[]}}};
  S.curParty=code;S.curUser=uname;
  save();updateNav();renderHome();
  toast('🎉 Party created! Code: '+code);
}
function joinParty(){
  const code=document.getElementById('jcode').value.trim().toUpperCase();
  const uname=document.getElementById('juname').value.trim();
  if(!code){toast('⚠️ Enter a party code!');return;}
  if(!uname){toast('⚠️ Enter your name!');return;}
  const party=S.parties[code];
  if(!party){toast('❌ Party not found. Check the code!');return;}
  if(party.users[uname]&&uname!==S.curUser){toast('❌ That name is taken in this party!');return;}
  if(!party.users[uname])party.users[uname]={history:[]};
  S.curParty=code;S.curUser=uname;
  save();updateNav();renderHome();
  toast('🐟 Welcome '+uname+'!');
}
function leaveParty(){
  S.curParty=null;S.curUser=null;
  save();updateNav();renderHome();
  toast('👋 Left the party');
}
function saveAndReset(){
  if(!S.curParty)return;
  const party=S.parties[S.curParty];
  if(!confirm(`Archive "${party.name}" and reset all picks?`))return;
  S.saved=S.saved||[];
  S.saved.push({...JSON.parse(JSON.stringify(party)),archivedAt:Date.now()});
  Object.keys(party.users).forEach(u=>{party.users[u].history=[]});
  save();renderBoard();renderHome();
  toast('💾 Archived & reset!');
}
function dlArchive(i){
  const a=S.saved[i];
  const b=new Blob([JSON.stringify(a,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(b);
  const el=document.createElement('a');
  el.href=url;el.download=`fihscale-${a.name.replace(/\s/g,'-')}.json`;el.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
   RENDER HOME
───────────────────────────────────────────── */
function renderHome(){
  const party=S.curParty?S.parties[S.curParty]:null;
  const ap=document.getElementById('activepanel');
  if(party){
    renderBoard();
    ap.style.display='';
    const link=location.href.split('?')[0]+'?party='+S.curParty;
    document.getElementById('activeinfo').innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-size:19px;font-family:var(--fd);color:var(--a2)">${party.name}</div>
          <div style="font-size:12px;color:var(--tx2);margin-top:3px">You: <b style="color:var(--tx)">${S.curUser}</b> &nbsp;·&nbsp; ${Object.keys(party.users).length} swimmer(s)</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--tx3);letter-spacing:.5px">PARTY CODE</div>
          <div class="party-code">${S.curParty}</div>
        </div>
      </div>
      <hr class="divider">
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <button class="btn bs bsm" onclick="copyLink('${link}')">📋 Copy Invite Link</button>
        <button class="btn bd bsm" onclick="leaveParty()">🚪 Leave Party</button>
      </div>`;
  }else ap.style.display='none';

  const archp=document.getElementById('archivepanel');
  const al=document.getElementById('archivelist');
  if(S.saved&&S.saved.length){
    archp.style.display='';
    al.innerHTML=S.saved.map((p,i)=>`
      <div class="archive-item">
        <div><div style="font-weight:700">${p.name}</div>
        <div style="font-size:11px;color:var(--tx3)">${new Date(p.archivedAt).toLocaleDateString()} · ${Object.keys(p.users).length} swimmer(s)</div></div>
        <button class="btn bs bsm" onclick="dlArchive(${i})">💾 Download</button>
      </div>`).join('');
  }else archp.style.display='none';
}
function copyLink(url){
  navigator.clipboard.writeText(url).then(()=>toast('📋 Link copied!')).catch(()=>prompt('Copy this link:',url));
}

/* ─────────────────────────────────────────────
   PICKER
───────────────────────────────────────────── */
function renderPicker(){
  const party=S.curParty?S.parties[S.curParty]:null;
  document.getElementById('picknop').style.display=party?'none':'';
  document.getElementById('pickcont').style.display=party?'':'none';
  if(!party)return;
  const lf=latestFish();
  document.getElementById('pickstatus').innerHTML=
    `🌊 <b>${party.name}</b> &nbsp;·&nbsp; You are: ${lf?lf.emoji+' <b>'+lf.name+'</b>':'❓ not picked yet'}&nbsp;&nbsp;<span style="font-size:11px;color:var(--tx3)">Code: <b style="color:var(--a)">${S.curParty}</b></span>`;
  const grid=document.getElementById('fishgrid');
  grid.innerHTML=allFish().map(f=>fishCardHTML(f,lf&&lf.id===f.id)).join('');
  injectAds(grid);
  S.pendFish=null;
  document.getElementById('confirmbtn').disabled=true;
}
function fishCardHTML(f,sel){
  const imgEl=f.image
    ?`<div class="fcard-img-wrap"><img class="fimg" src="${f.image}" onerror="this.parentElement.innerHTML='<span class=femoji>${f.emoji}</span>'"></div>`
    :`<div class="fcard-img-wrap"><span class="femoji">${f.emoji}</span></div>`;
  return`<div class="fcard${sel?' sel':''}" onclick="selFish('${f.id}')" data-id="${f.id}">
    <div class="tip">${f.desc||'No description.'}</div>
    ${imgEl}
    <div class="fname">${f.name}</div>
  </div>`;
}
function selFish(id){
  S.pendFish=id;
  document.querySelectorAll('.fcard').forEach(c=>c.classList.toggle('sel',c.dataset.id===id));
  document.getElementById('confirmbtn').disabled=false;
}
function confirmPick(){
  if(!S.pendFish||!S.curParty||!S.curUser)return;
  const party=S.parties[S.curParty];
  party.users[S.curUser].history.push({fishId:S.pendFish,ts:Date.now()});
  save();updateNav();renderPicker();showPage('board');
  const f=allFish().find(x=>x.id===S.pendFish);
  toast(`${f.emoji} You are now a ${f.name}!`);
}

function latestFish(u,p){
  const uname=u||S.curUser,pid=p||S.curParty;
  if(!uname||!pid)return null;
  const party=S.parties[pid];if(!party)return null;
  const h=party.users[uname]?.history||[];if(!h.length)return null;
  return allFish().find(f=>f.id===h[h.length-1].fishId)||null;
}

/* ─────────────────────────────────────────────
   BOARD
───────────────────────────────────────────── */
let activeBTab='group';
function switchBTab(t){
  activeBTab=t;
  document.getElementById('bgroup').style.display=t==='group'?'':'none';
  document.getElementById('bpersonal').style.display=t==='personal'?'':'none';
  document.getElementById('btab-group').classList.toggle('on',t==='group');
  document.getElementById('btab-personal').classList.toggle('on',t==='personal');
  renderBoard();
}
function renderBoard(){
  const party=S.curParty?S.parties[S.curParty]:null;
  document.getElementById('boardnop').style.display=party?'none':'';
  document.getElementById('boardcont').style.display=party?'':'none';
  if(!party)return;
  document.getElementById('boardstatus').innerHTML=
    `🌊 <b>${party.name}</b> &nbsp;·&nbsp; Code: <b style="color:var(--a)">${S.curParty}</b> &nbsp;·&nbsp; ${Object.keys(party.users).length} swimmer(s)`;
  drawGroupGraph(party,'gcanvas');
  drawGroupGraph(party,'hcanvas');
  drawPersonalGraph(party);
  const ul=document.getElementById('userslist');
  ul.innerHTML=Object.keys(party.users).map(u=>{
    const f=latestFish(u,S.curParty);
    const me=u===S.curUser;
    return`<div class="chip${me?' me':''}">${f?f.emoji:'❓'} ${u}${me?' ★':''}</div>`;
  }).join('');
}
function refreshBoard(){renderBoard();toast('🔄 Refreshed!');}

/* ─────────────────────────────────────────────
   CANVAS GRAPH
───────────────────────────────────────────── */
const UCOLS=['#00d4ff','#00ff9d','#ff6b35','#b44fff','#ffeb3b','#ff4488','#44ffcc','#ff8844'];
function graphBase(ctx,W,H){
  const pad=64,cX=W/2,cY=H/2,gW=W-pad*2,gH=H-pad*2;
  // Background
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#04080f';ctx.fillRect(0,0,W,H);
  // Quadrant fills
  const quads=[[pad,pad,gW/2,gH/2,'rgba(255,130,60,0.07)'],
    [cX,pad,gW/2,gH/2,'rgba(0,255,150,0.07)'],
    [pad,cY,gW/2,gH/2,'rgba(80,0,160,0.09)'],
    [cX,cY,gW/2,gH/2,'rgba(0,80,200,0.07)']];
  quads.forEach(([x,y,w,h,c])=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)});
  // Grid
  ctx.save();ctx.strokeStyle='rgba(0,180,255,0.08)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  for(let i=1;i<=4;i++){
    ctx.beginPath();ctx.moveTo(pad+gW*i/4,pad);ctx.lineTo(pad+gW*i/4,pad+gH);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pad,pad+gH*i/4);ctx.lineTo(pad+gW,pad+gH*i/4);ctx.stroke();
  }ctx.restore();
  // Axes
  ctx.save();ctx.strokeStyle='rgba(0,212,255,0.35)';ctx.lineWidth=1.5;ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(pad,cY);ctx.lineTo(pad+gW,cY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cX,pad);ctx.lineTo(cX,pad+gH);ctx.stroke();
  ctx.restore();
  // Labels
  ctx.font='bold 10px Nunito,sans-serif';ctx.fillStyle='rgba(90,154,184,0.7)';ctx.textAlign='center';
  ctx.fillText('CLOUDY',pad+gW*0.18,cY-7);
  ctx.fillText('LUCID',pad+gW*0.82,cY-7);
  ctx.save();
  ctx.translate(pad-5,cY-gH*0.28);ctx.rotate(-Math.PI/2);
  ctx.fillText('EUPHORIC',0,0);ctx.restore();
  ctx.save();
  ctx.translate(pad-5,cY+gH*0.28);ctx.rotate(-Math.PI/2);
  ctx.fillText('FEELING BLUE',0,0);ctx.restore();
  // Quadrant hints
  ctx.font='9px Nunito,sans-serif';ctx.fillStyle='rgba(255,255,255,0.16)';
  ctx.fillText('HAPPY CHAOS',pad+gW*0.25,pad+14);
  ctx.fillText('THE SWEET SPOT',pad+gW*0.75,pad+14);
  ctx.fillText('THE ABYSS',pad+gW*0.25,pad+gH-6);
  ctx.fillText('SOBER SADNESS',pad+gW*0.75,pad+gH-6);
  return{pad,cX,cY,gW,gH};
}
function s2c(v,center,half){return center+(v/5)*half}
function drawDot(ctx,fish,x,y,label,col,num,imgCache){
  const r=21;
  ctx.save();
  // Circle bg
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=(fish.col||'#00d4ff')+'28';ctx.fill();
  ctx.strokeStyle=col||fish.col||'#00d4ff';ctx.lineWidth=2;ctx.stroke();
  // Image or emoji
  if(fish.image&&imgCache&&imgCache[fish.id]){
    const img=imgCache[fish.id];
    ctx.save();ctx.beginPath();ctx.arc(x,y,r-2,0,Math.PI*2);ctx.clip();
    ctx.drawImage(img,x-r+2,y-r+2,(r-2)*2,(r-2)*2);ctx.restore();
  }else{
    ctx.font='20px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(fish.emoji,x,y+1);
  }
  // Number badge
  if(num!==undefined){
    ctx.beginPath();ctx.arc(x+r*.65,y-r*.65,9,0,Math.PI*2);
    ctx.fillStyle='#04080f';ctx.fill();
    ctx.strokeStyle=col||'#00d4ff';ctx.lineWidth=1.5;ctx.stroke();
    ctx.font='bold 9px Nunito';ctx.fillStyle='#fff';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(num),x+r*.65,y-r*.65+1);
  }
  // Label
  if(label){
    ctx.font='bold 10px Nunito,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='top';
    const tw=ctx.measureText(label).width+8;
    ctx.fillStyle='rgba(4,8,15,0.85)';
    ctx.beginPath();ctx.roundRect(x-tw/2,y+r+3,tw,15,4);ctx.fill();
    ctx.fillStyle=col||'#d8f0ff';
    ctx.fillText(label,x,y+r+5);
  }
  ctx.restore();
}
function drawGroupGraph(party,canvasId){
  const canvas=document.getElementById(canvasId);
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const{pad,cX,cY,gW,gH}=graphBase(ctx,W,H);
  const legend=document.getElementById('glegend');
  const items=[];
  // Preload images then draw
  const usersArr=Object.keys(party.users);
  const fishImages={};
  let toLoad=0,loaded=0;
  const fishList=allFish();
  usersArr.forEach(u=>{
    const f=latestFish(u,S.curParty);
    if(f&&f.image){toLoad++;}
  });
  function doDraw(){
    let ci=0;
    usersArr.forEach(u=>{
      const f=latestFish(u,S.curParty);if(!f)return;
      const x=s2c(f.luc,cX,gW/2),y=s2c(-f.eur,cY,gH/2);
      const col=UCOLS[ci%UCOLS.length];ci++;
      const me=u===S.curUser;
      drawDot(ctx,f,x,y,u+(me?' ★':''),col,undefined,fishImages);
      items.push(`<div class="legitem"><div class="legdot" style="background:${col}"></div>${f.emoji} ${u}</div>`);
    });
    legend.innerHTML=items.join('');
    if(!usersArr.some(u=>latestFish(u,S.curParty))){
      ctx.font='bold 15px Nunito';ctx.fillStyle='rgba(90,154,184,0.5)';
      ctx.textAlign='center';ctx.fillText('No one has picked a fish yet!',W/2,H/2);
    }
  }
  // Load images
  usersArr.forEach(u=>{
    const f=latestFish(u,S.curParty);
    if(f&&f.image){
      const img=new Image();
      img.onload=()=>{fishImages[f.id]=img;loaded++;if(loaded===toLoad)doDraw()};
      img.onerror=()=>{loaded++;if(loaded===toLoad)doDraw()};
      img.src=f.image;
    }
  });
  if(toLoad===0)doDraw();
}
function drawPersonalGraph(party){
  const canvas=document.getElementById('pcanvas');
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const{pad,cX,cY,gW,gH}=graphBase(ctx,W,H);
  if(!S.curUser||!party.users[S.curUser])return;
  const hist=party.users[S.curUser].history||[];
  const fl=allFish();
  if(!hist.length){
    ctx.font='bold 14px Nunito';ctx.fillStyle='rgba(90,154,184,0.5)';
    ctx.textAlign='center';ctx.fillText('No picks yet — go catch some fish!',W/2,H/2);
    return;
  }
  const pts=hist.map(h=>{
    const f=fl.find(x=>x.id===h.fishId);if(!f)return null;
    return{x:s2c(f.luc,cX,gW/2),y:s2c(-f.eur,cY,gH/2),f};
  }).filter(Boolean);
  // Path
  if(pts.length>1){
    ctx.save();ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='rgba(0,212,255,0.25)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();
    ctx.restore();
  }
  pts.forEach((pt,i)=>drawDot(ctx,pt.f,pt.x,pt.y,null,i===pts.length-1?'#00ff9d':'rgba(0,212,255,0.55)',i+1,{}));
}

/* ─────────────────────────────────────────────
   ADD FISH
───────────────────────────────────────────── */
let curITab='upload',eraserOn=false,drawHist=[];

function switchITab(t,btn){
  curITab=t;
  document.querySelectorAll('.itab').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.ipanel').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('ip-'+t).classList.add('on');
  updatePreview();
}
function handleUpload(e){
  const file=e.target.files[0];if(!file)return;
  const rd=new FileReader();
  rd.onload=ev=>{S.uploadImg=ev.target.result;document.getElementById('uploadlabel').textContent='✅ '+file.name;updatePreview()};
  rd.readAsDataURL(file);
}
function getImgData(){
  if(curITab==='upload'&&S.uploadImg)return S.uploadImg;
  if(curITab==='url'){const v=document.getElementById('afurl').value.trim();return v||null;}
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
  const name=document.getElementById('afname').value||'Your Fish';
  const emoji=document.getElementById('afemoji').value||'🐟';
  const desc=document.getElementById('afdesc').value||'Add a description...';
  document.getElementById('fprevname').textContent=name;
  document.getElementById('fprevemoji').textContent=emoji;
  document.getElementById('fprevdesc').textContent=desc;
  const img=getImgData();
  const box=document.getElementById('fprev');
  box.innerHTML=img?`<img src="${img}" onerror="this.parentNode.innerHTML='<span>${emoji}</span>'">`:`<span>${emoji}</span>`;
}
function addFish(){
  const name=document.getElementById('afname').value.trim();
  if(!name){toast('⚠️ Fish needs a name!');return;}
  const luc=parseInt(document.getElementById('afluc').value);
  const eur=parseInt(document.getElementById('afeur').value);
  const desc=document.getElementById('afdesc').value.trim();
  const emoji=document.getElementById('afemoji').value.trim()||'🐟';
  const image=getImgData();
  const id='c_'+Date.now();
  const cols=['#ff6b35','#b44fff','#00ff9d','#ff4488','#ffeb3b','#00ccff','#ff8844'];
  const col=cols[Math.floor(Math.random()*cols.length)];
  S.custom=S.custom||[];
  S.custom.push({id,name,emoji,col,luc,eur,desc,image,isCustom:true});
  save();
  // Reset
  document.getElementById('afname').value='';
  document.getElementById('afemoji').value='';
  document.getElementById('afdesc').value='';
  document.getElementById('afluc').value=0;document.getElementById('afluv').textContent='0';
  document.getElementById('afeur').value=0;document.getElementById('afeuv').textContent='0';
  S.uploadImg=null;document.getElementById('uploadlabel').textContent='Click to upload · PNG, JPG, GIF, WebP';
  document.getElementById('afurl').value='';
  clearDraw();updatePreview();renderLib();
  toast(`🐟 ${name} added to the scale!`);
}
function renderLib(){
  const grid=document.getElementById('libgrid');
  grid.innerHTML=allFish().map(f=>{
    const imgEl=f.image
      ?`<div class="fcard-img-wrap"><img class="fimg" src="${f.image}" onerror="this.parentElement.innerHTML='<span class=femoji>${f.emoji}</span>'"></div>`
      :`<div class="fcard-img-wrap"><span class="femoji">${f.emoji}</span></div>`;
    const delBtn=f.isCustom?`<button class="btn bd bsm" style="margin:6px auto;font-size:10px;padding:3px 8px;display:flex" onclick="delFish('${f.id}')">🗑 Remove</button>`:'';
    return`<div class="fcard" style="cursor:default">
      <div class="tip">${f.desc||'No description.'}</div>
      ${imgEl}
      <div class="fname">${f.name}</div>
      ${delBtn}
    </div>`;
  }).join('');
  injectAds(grid);
}
function delFish(id){
  if(!confirm('Remove this fish from the scale?'))return;
  S.custom=S.custom.filter(f=>f.id!==id);save();renderLib();toast('🗑 Fish removed');
}

/* ─────────────────────────────────────────────
   DRAWING CANVAS
───────────────────────────────────────────── */
function initDraw(){
  const c=document.getElementById('drawCanvas');
  const ctx=c.getContext('2d');
  ctx.fillStyle='#060e1c';ctx.fillRect(0,0,c.width,c.height);
  let drawing=false,lx=0,ly=0;
  function pos(e){
    const r=c.getBoundingClientRect();
    const sx=c.width/r.width,sy=c.height/r.height;
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    return[(cx-r.left)*sx,(cy-r.top)*sy];
  }
  c.addEventListener('mousedown',e=>{e.preventDefault();drawing=true;drawHist.push(ctx.getImageData(0,0,c.width,c.height));[lx,ly]=pos(e)});
  c.addEventListener('mousemove',e=>{
    e.preventDefault();if(!drawing)return;
    const[x,y]=pos(e);
    ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);
    ctx.strokeStyle=eraserOn?'#060e1c':document.getElementById('dcolor').value;
    ctx.lineWidth=parseInt(document.getElementById('dsize').value);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    lx=x;ly=y;
  });
  c.addEventListener('mouseup',()=>drawing=false);
  c.addEventListener('mouseleave',()=>drawing=false);
  c.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;drawHist.push(ctx.getImageData(0,0,c.width,c.height));[lx,ly]=pos(e)},{passive:false});
  c.addEventListener('touchmove',e=>{
    e.preventDefault();if(!drawing)return;
    const[x,y]=pos(e);
    ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);
    ctx.strokeStyle=eraserOn?'#060e1c':document.getElementById('dcolor').value;
    ctx.lineWidth=parseInt(document.getElementById('dsize').value);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    lx=x;ly=y;
  },{passive:false});
  c.addEventListener('touchend',()=>drawing=false);
}
function toggleEraser(btn){
  eraserOn=!eraserOn;
  btn.textContent=eraserOn?'✏️ Draw':'🧹 Eraser';
  btn.classList.toggle('on',eraserOn);
}
function undoDraw(){
  if(!drawHist.length)return;
  const c=document.getElementById('drawCanvas');
  c.getContext('2d').putImageData(drawHist.pop(),0,0);
}
function clearDraw(){
  drawHist=[];
  const c=document.getElementById('drawCanvas');
  const ctx=c.getContext('2d');
  ctx.fillStyle='#060e1c';ctx.fillRect(0,0,c.width,c.height);
}


/* ─────────────────────────────────────────────
   ADS — Display banners organiques
───────────────────────────────────────────── */
const ADS = [
  {
    brand:'FISH GULP™',
    tagline:'Energy drink for certified party fish 🐟',
    emoji:'🍹',
    cta:'Get a can',
    gradient:'linear-gradient(100deg,rgba(0,30,60,0.95) 0%,rgba(0,80,120,0.85) 100%)',
    accent:'#00d4ff',
    ctaBg:'#00d4ff',
    ctaColor:'#000',
    msg:'🍹 Not an actual ad, go drink some water!'
  },
  {
    brand:'AQUA RAVE',
    tagline:'Every Friday night — No sardines allowed 🪩',
    emoji:'🌐',
    cta:'Get tickets',
    gradient:'linear-gradient(100deg,rgba(30,0,60,0.95) 0%,rgba(80,0,120,0.85) 100%)',
    accent:'#b44fff',
    ctaBg:'#b44fff',
    ctaColor:'#fff',
    msg:'🐠 Not an actual ad either. Pace yourself.'
  },
  {
    brand:'DEEP SEA VPN',
    tagline:'Browse the dark web of the ocean, anonymously',
    emoji:'🦑',
    cta:'Try free',
    gradient:'linear-gradient(100deg,rgba(0,20,20,0.95) 0%,rgba(0,60,50,0.85) 100%)',
    accent:'#00ff9d',
    ctaBg:'#00ff9d',
    ctaColor:'#000',
    msg:'🦑 Not a real VPN. Your data is already wet.'
  },
  {
    brand:'KELP & CO.',
    tagline:'Premium seaweed snacks for the discerning fish',
    emoji:'🌿',
    cta:'Shop now',
    gradient:'linear-gradient(100deg,rgba(10,25,0,0.95) 0%,rgba(30,70,10,0.85) 100%)',
    accent:'#a8ff3e',
    ctaBg:'#a8ff3e',
    ctaColor:'#000',
    msg:'🌿 Not edible. Please eat actual food tonight.'
  }
];

function makeAdEl(adIdx){
  const a=ADS[adIdx%ADS.length];
  const el=document.createElement('div');
  el.className='ad-banner';
  el.innerHTML=`
    <div class="ad-label">SPONSORED</div>
    <div class="ad-inner" style="background:${a.gradient};border:1px solid ${a.accent}33;border-radius:10px">
      <div class="ad-icon">${a.emoji}</div>
      <div class="ad-copy">
        <div class="ad-brand" style="color:${a.accent}">${a.brand}</div>
        <div class="ad-tagline">${a.tagline}</div>
      </div>
      <button class="ad-cta" style="background:${a.ctaBg};color:${a.ctaColor}">${a.cta}</button>
    </div>`;
  el.addEventListener('click',()=>toast(a.msg));
  return el;
}

/* Pubs fixes sur les côtés si assez de place, sinon inline dans la grille */
let _adsFixed=[];
function renderSideAds(){
  _adsFixed.forEach(el=>el.remove());
  _adsFixed=[];
  const W=window.innerWidth;
  const mainW=860; // max-width du main
  const sideSpace=(W-mainW)/2;
  if(sideSpace>=220){
    // Assez de place des deux côtés
    const positions=[
      {top:'80px',left:'10px'},
      {top:'80px',right:'10px'},
      {bottom:'30px',left:'10px'},
      {bottom:'30px',right:'10px'}
    ];
    ADS.forEach((a,i)=>{
      const el=makeAdEl(i);
      el.classList.add('ad-fixed');
      Object.assign(el.style,positions[i]||{top:'80px',right:'10px'});
      document.body.appendChild(el);
      _adsFixed.push(el);
    });
  } else {
    // Pas de place : on injecte dans les grilles visibles
    injectInlineAds();
  }
}

function injectInlineAds(){
  ['fishgrid','libgrid'].forEach((gid,gi)=>{
    const grid=document.getElementById(gid);
    if(!grid)return;
    // Retirer les anciennes pubs inline
    grid.querySelectorAll('.ad-inline-wrap').forEach(el=>el.remove());
    const cards=[...grid.children];
    if(cards.length<4)return;
    const insertAfter=8;
    let adN=gi*2;
    for(let i=insertAfter;i<cards.length;i+=insertAfter+1){
      const outer=document.createElement('div');
      outer.className='ad-inline-wrap';
      outer.style.cssText='grid-column:1/-1;margin:4px 0';
      outer.appendChild(makeAdEl(adN++));
      const ref=cards[i];
      if(ref)grid.insertBefore(outer,ref);
    }
  });
}

function injectAds(gridEl){
  // Nettoyage des pubs inline dans cette grille
  gridEl.querySelectorAll('.ad-inline-wrap').forEach(el=>el.remove());
  // Laisser renderSideAds décider du mode
  renderSideAds();
}



let toastT;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('on');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),3000);
}

/* ─────────────────────────────────────────────
   BUBBLES BACKGROUND
───────────────────────────────────────────── */
function initBubbles(){
  const cont=document.getElementById('bubbles');
  for(let i=0;i<18;i++){
    const b=document.createElement('div');b.className='bubble';
    const sz=Math.random()*40+10;
    b.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;animation-duration:${Math.random()*18+12}s;animation-delay:${Math.random()*12}s`;
    cont.appendChild(b);
  }
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
// Polyfill roundRect for older browsers
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    this.beginPath();this.moveTo(x+r,y);this.lineTo(x+w-r,y);
    this.quadraticCurveTo(x+w,y,x+w,y+r);this.lineTo(x+w,y+h-r);
    this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);this.lineTo(x+r,y+h);
    this.quadraticCurveTo(x,y+h,x,y+h-r);this.lineTo(x,y+r);
    this.quadraticCurveTo(x,y,x+r,y);this.closePath();
  };
}

function init(){
  load();
  const p=new URLSearchParams(location.search).get('party');
  if(p)document.getElementById('jcode').value=p.toUpperCase();
  updateNav();renderHome();initDraw();renderLib();initBubbles();
  renderSideAds();
  window.addEventListener('resize',()=>renderSideAds());
  setInterval(()=>{if(document.getElementById('page-board').classList.contains('on'))renderBoard();},30000);
}
init();
