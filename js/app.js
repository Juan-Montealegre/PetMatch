/* PetMatch — lógica de la aplicación */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ic=(n,c='')=>`<i data-lucide="${n}" class="i ${c}"></i>`;
const KEY='pm3';
const DEF={users:[],session:null,favs:[],swiped:[],adopt:null,cases:[],theme:'light',tourDone:false};
let S; try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S={...DEF}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const user=()=>S.users.find(u=>u.email===S.session);
const mt=p=>match(p,user());
const ranked=()=>[...PETS].sort((a,b)=>mt(b).t-mt(a).t);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const DEMO={name:'Camila Rojas',email:'camila@demo.co',pass:'demo1234',prefs:{space:1,time:1,energy:1,exp:1,kids:true}};

const ADMIN_DEMO={name:'Equipo PetMatch',email:'admin@demo.co',pass:'admin1234',role:'admin'};
const isAdmin=()=>user()?.email===ADMIN_DEMO.email&&user()?.role==='admin';
const startPage=()=>isAdmin()?'admin':'home';
const publicPages=['splash','onboard','login','register'];

function beginSession(account){
 if(!account.favs)account.favs=account.email===(S.session||DEMO.email)?S.favs:[];
 if(!account.swiped)account.swiped=account.email===(S.session||DEMO.email)?S.swiped:[];
 adminSection='requests';
 S.session=account.email;
 save();
 reset();
}

/* ---------- utilidades de UI ---------- */
const view=$('#view'), tabs=$('#tabs'), lens=$('.glass-lens',tabs);
function icons(root){lucide.createIcons({attrs:{}, nameAttr:'data-lucide'})}
function toast(msg,icon='check-circle-2'){
  const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  t.innerHTML=ic(icon)+`<span>${msg}</span>`;$('.screen').appendChild(t);icons();
  gsap.fromTo(t,{y:-30,opacity:0},{y:0,opacity:1,duration:.4,ease:'back.out(1.6)'});
  gsap.to(t,{y:-30,opacity:0,delay:2.4,duration:.3,onComplete:()=>t.remove()});
}
function modal(html){
  const sc=document.createElement('div');sc.className='scrim';
  const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');
  m.innerHTML='<div class="grab"></div>'+html;
  $('.screen').append(sc,m);icons();
  gsap.to(sc,{opacity:1,duration:.25});gsap.fromTo(m,{yPercent:100},{yPercent:0,duration:.45,ease:'power3.out'});
  const close=()=>{gsap.to(sc,{opacity:0,duration:.2});gsap.to(m,{yPercent:100,duration:.3,ease:'power2.in',onComplete:()=>{sc.remove();m.remove()}})};
  sc.onclick=close;m.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close()});
  return close;
}
const first=n=>(n||'').split(' ')[0];

/* ---------- router ---------- */
const hist=[]; let cur=null; const TAB=['home','explore','favs','track','profile'];
function setLens(index,animate){
  const gap=parseFloat(getComputedStyle(tabs).columnGap);
  const position={xPercent:index*100,x:index*gap};
  gsap.killTweensOf(lens);
  if(reduce||!animate)gsap.set(lens,{...position,scaleX:1,scaleY:1});
  else{
    gsap.to(lens,{...position,duration:.44,ease:'power3.out'});
    gsap.fromTo(lens,{scaleX:1.16,scaleY:.92},{scaleX:1,scaleY:1,duration:.48,ease:'back.out(1.7)',overwrite:'auto'});
  }
}
function go(name,p={},mode='fwd'){
  if(!publicPages.includes(name)){
    if(!user()){name='login';p={};mode='fade'}
    else if(isAdmin()&&name!=='admin'){name='admin';p={};mode='fade'}
    else if(!isAdmin()&&name==='admin'){name='home';p={};mode='fade'}
    else if(name==='success'&&!familyCases().length){name='track';p={};mode='fade'}
  }
  const def=SC[name]; if(!def) return;
  clearTabDrag();
  document.documentElement.dataset.workspace=!publicPages.includes(name)&&isAdmin()?'admin':'family';
  if(mode==='fwd'&&cur) hist.push({name:cur.name,p:cur.p});
  const s=def(p); const el=document.createElement('div');
  el.className='page '+(s.cls||''); el.innerHTML=s.html; view.appendChild(el);
  const previous=cur, old=previous?.el;
  for(const page of [...view.children]){if(page!==old&&page!==el){gsap.killTweensOf(page);page.remove();}}
  if(old)old.inert=true;
  cur={name,p,el};
  icons();
  const index=TAB.indexOf(name), previousTab=TAB.indexOf(previous?.name), isTab=index>=0;
  if(isTab){
    $$('.tab',tabs).forEach(t=>{
      const active=t.dataset.go===name;
      t.classList.toggle('on',active);
      if(active)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current');
    });
    $('.dot',tabs).style.display=familyCases().length?'':'none';
    setLens(index,previousTab>=0);
  }
  tabs.inert=!isTab;
  tabs.setAttribute('aria-hidden',String(!isTab));
  const barPosition={y:isTab?0:92,opacity:isTab?1:0};
  if(reduce)gsap.set(tabs,barPosition);
  else gsap.to(tabs,{...barPosition,duration:.32,ease:'power3.out',overwrite:'auto'});
  tabs.style.pointerEvents=isTab?'auto':'none';
  if(!old||reduce){old?.remove();s.mount?.(el);return}
  gsap.killTweensOf(old);
  const done=()=>{old.remove();gsap.set(el,{clearProps:'transform,opacity,filter'})};
  if(mode==='fwd'||mode==='back'){
    const direction=mode==='back'?-1:1;
    gsap.fromTo(el,{x:direction*28,opacity:0},{x:0,opacity:1,duration:.31,ease:'power3.out',onComplete:done});
    gsap.to(old,{x:-direction*18,opacity:0,duration:.2,ease:'power2.out'});
  }else if(mode==='tab'){
    const entrance=gsap.timeline({onComplete:done});
    entrance.fromTo(el,{opacity:0},{opacity:1,duration:.5,ease:'power2.out'},0);
    entrance.fromTo(el,{filter:'blur(0px)'},{filter:'blur(5px)',duration:.25,ease:'power2.in'},0);
    entrance.to(el,{filter:'blur(0px)',duration:.25,ease:'power2.out'},.25);
    entrance.fromTo(el,{y:12},{y:-5,duration:.33,ease:'power2.out'},0);
    entrance.to(el,{y:0,duration:.17,ease:'power2.inOut'},.33);
    gsap.to(old,{opacity:0,duration:.2,ease:'power2.out'});
  }else{
    gsap.fromTo(el,{opacity:0,y:8},{opacity:1,y:0,duration:.25,ease:'power2.out',onComplete:done});
    gsap.to(old,{opacity:0,duration:.16,ease:'power2.out'});
  }
  s.mount&&s.mount(el);
}
function back(){const h=hist.pop();h?go(h.name,h.p,'back'):go(user()?startPage():'login',{},'back')}
const reset=()=>{hist.length=0};

/* ---------- componentes ---------- */
function ringHTML(t,size=76,cl=''){return `<div class="ring ${cl}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 76 76"><circle class="bg" cx="38" cy="38" r="32" fill="none" stroke-width="7"/><circle class="fg" cx="38" cy="38" r="32" fill="none" stroke-width="7" stroke-dasharray="201" stroke-dashoffset="201" data-t="${t}"/></svg><b>${t}%</b><small>compatible</small></div>`}
function animRings(root){$$('.fg',root).forEach(c=>gsap.to(c,{strokeDashoffset:201*(1-c.dataset.t/100),duration:1.1,ease:'power3.out',delay:.15}))}
function heartBtn(id){const on=user().favs.includes(id);return `<button class="heart ${on?'on':''}" data-a="fav" data-v="${id}" aria-label="${on?'Quitar de guardadas':'Guardar'}">${ic('heart')}</button>`}
const modeBadge = p => '<span class="mode-badge '+acquisition(p)+'">'+ic(acquisition(p)==='buy'?'shopping-bag':'heart-handshake')+' '+modeOf(p)+'</span>';
const facts = rows => '<dl class="pet-facts">'+rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>';
const normalizeSearch = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function pcard(p){const m=mt(p);return `<div class="pcard" role="button" tabindex="0" data-a="open" data-v="${p.id}">
 <img class="ph" src="${p.img}" alt="${p.n}, ${p.br}">
 <div class="bd">${modeBadge(p)}<div class="h-m">${p.n}</div><div class="small muted">${p.br} · ${p.age}</div>
 <div class="listing-cost"><b>${costOf(p)}</b> <span class="muted">· ${p.area}</span></div>
 <div class="pc"><div class="bar"><i style="width:${m.t}%"></i></div><span class="mt">${m.t}%</span></div></div>${heartBtn(p.id)}</div>`}
function radar(p,m){
  const cx=165,cy=122,R=80,n=4,ang=i=>-Math.PI/2+i*2*Math.PI/n;
  const pt=(i,v)=>{const r=R*(0.25+0.75*v/2)/1;return [cx+r*Math.cos(ang(i)),cy+r*Math.sin(ang(i))]};
  const poly=arr=>arr.map((v,i)=>pt(i,v).join(',')).join(' ');
  const rings=[0.25,.5,.75,1].map(k=>`<polygon points="${[0,1,2,3].map(i=>[cx+R*k*Math.cos(ang(i)),cy+R*k*Math.sin(ang(i))].join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
  const axes=[0,1,2,3].map(i=>`<line x1="${cx}" y1="${cy}" x2="${cx+R*Math.cos(ang(i))}" y2="${cy+R*Math.sin(ang(i))}" stroke="var(--line)"/>`).join('');
  const lab=DIMS.map((d,i)=>{const x=cx+(R+(i%2?16:22))*Math.cos(ang(i)),y=cy+(R+22)*Math.sin(ang(i))+4;const a=i%2?(i==1?'start':'end'):'middle';return `<text x="${x}" y="${y}" text-anchor="${a}">${d.l}</text>`}).join('');
  const you=m.d.map(x=>x.you),pe=m.d.map(x=>x.pet);
  return `<svg class="radar" viewBox="0 0 330 250" width="100%" role="img" aria-label="Comparación entre tu perfil y lo que necesita ${p.n}">${rings}${axes}
  <polygon class="rp" points="${poly(pe)}" fill="var(--mango)" fill-opacity=".35" stroke="var(--mango)" stroke-width="2.5" stroke-linejoin="round"/>
  <polygon class="ry" points="${poly(you)}" fill="var(--lagoon-2)" fill-opacity=".18" stroke="var(--lagoon-2)" stroke-width="2.5" stroke-linejoin="round"/>${lab}</svg>
  <div class="legend"><span><i style="background:var(--lagoon-2)"></i>Tú</span><span><i style="background:var(--mango)"></i>Lo que ${p.n} necesita</span></div>`}

/* ---------- baraja de swipe ---------- */
let deck=[];
function deckCard(p){const m=mt(p);
 return `<div class="dcard" data-id="${p.id}"><img src="${p.img}" alt="${p.n}" draggable="false">${ringHTML(m.t)}
 <span class="stamp yes">ME GUSTA</span><span class="stamp no">PASAR</span>
 <div class="dinfo">${modeBadge(p)}<div class="nm">${p.n}</div><div class="meta">${p.br} · ${p.age} · a ${p.dist} km</div>
 <div class="tags">${m.r.slice(0,2).map(r=>`<span class="tag">${r}</span>`).join('')||p.tr.slice(0,2).map(r=>`<span class="tag">${r}</span>`).join('')}</div></div></div>`}
function buildDeck(root){
  const wrap=$('.deckwrap',root); deck=ranked().filter(p=>!user().swiped.includes(p.id));
  if(!deck.length){wrap.innerHTML=`<div class="empty"><div class="ic">${ic('check-check')}</div><div class="h-m">Ya viste todas las mascotas</div><p class="muted" style="margin:8px 0 18px">Revisa tus guardadas o vuelve a empezar la baraja.</p><div class="stack"><button class="btn dark" data-a="tab" data-v="favs">Ver guardadas</button><button class="btn ghost" data-a="deckreset">Ver de nuevo</button></div></div>`;$('.decks-actions',root).style.display='none';icons();return}
  $('.decks-actions',root).style.display='';
  wrap.innerHTML=deck.slice(0,3).reverse().map(deckCard).join('');icons();
  layout(wrap);animRings(wrap);attach($$('.dcard',wrap).pop(),wrap,root);
}
function layout(wrap){const cs=$$('.dcard',wrap);cs.forEach((c,i)=>{const d=cs.length-1-i;gsap.to(c,{scale:1-d*.055,y:d*16,duration:reduce?0:.35,ease:'power3.out'})})}
function attach(card,wrap,root){
  let sx=0,dx=0,drag=false,moved=false,t0=0;
  const yes=$('.stamp.yes',card),no=$('.stamp.no',card);
  card.onpointerdown=e=>{drag=true;moved=false;sx=e.clientX;dx=0;t0=Date.now();card.setPointerCapture(e.pointerId)};
  card.onpointermove=e=>{if(!drag)return;dx=e.clientX-sx;if(Math.abs(dx)>6)moved=true;
    gsap.set(card,{x:dx,rotation:dx/18});yes.style.opacity=Math.max(0,Math.min(1,dx/90));no.style.opacity=Math.max(0,Math.min(1,-dx/90))};
  card.onpointercancel=()=>{
    drag=false;
    gsap.to(card,{x:0,rotation:0,duration:reduce?0:.22,ease:'power3.out'});
    gsap.set([yes,no],{opacity:0});
  };
  card.onpointerup=e=>{if(!drag)return;drag=false;const v=dx/(Date.now()-t0+1);
    if(Math.abs(dx)>110||Math.abs(v)>.7&&Math.abs(dx)>50)fly(dx>0?1:-1);
    else{gsap.to(card,{x:0,rotation:0,duration:reduce?0:.32,ease:'power3.out'});gsap.to([yes,no],{opacity:0,duration:.2});
      if(!moved)go('detail',{id:card.dataset.id})}};
}
function fly(dir){
  const root=cur.el, wrap=$('.deckwrap',root);if(!wrap)return;const top=$$('.dcard',wrap).pop();if(!top||top.dataset.busy)return;top.dataset.busy=1;
  const id=top.dataset.id;user().swiped.push(id);
  if(dir>0&&!user().favs.includes(id)){user().favs.push(id);toast(`${pet(id).n} está en tus guardadas`,'heart')}
  save();
  const st=$(dir>0?'.stamp.yes':'.stamp.no',top);gsap.set(st,{opacity:1});
  gsap.to(top,{x:dir*520,rotation:dir*22,opacity:0,duration:reduce?0:.32,ease:'power2.in',onComplete:()=>{top.remove();
    if(cur.el!==root)return;
    const rest=ranked().filter(p=>!user().swiped.includes(p.id));
    if(rest.length>=3){const nc=document.createElement('div');nc.innerHTML=deckCard(rest[2]);const c=nc.firstChild;wrap.prepend(c);icons();gsap.set(c,{scale:.89,y:32});animRings(c)}
    if(!rest.length){buildDeck(root);return}
    layout(wrap);attach($$('.dcard',wrap).pop(),wrap,root)}});
}

/* ---------- pantallas ---------- */
const SC={};
SC.splash=()=>({cls:'splash nonav',html:`<div><div class="mark">${ic('paw-print')}</div><div class="name">PetMatch</div><p>La mascota correcta para tu vida</p></div>`,
 mount(el){gsap.from($('.mark',el),{scale:0,rotation:-40,duration:.9,ease:'back.out(1.8)'});gsap.from($('.name',el),{y:24,opacity:0,delay:.35,duration:.6});gsap.from($('p',el),{opacity:0,delay:.7,duration:.6});
  setTimeout(()=>{if(cur&&cur.name==='splash')go(S.session&&user()?'home':(S.tourDone?'login':'onboard'),{},'fade')},reduce?300:2100)}});

const OB=[
 {t:'Encuentra a quien encaja contigo',d:'Cuéntanos cómo vives y ordenamos las mascotas por compatibilidad real.',imgs:[['luna',16,100,176,224,-6],['toby',166,214,184,232,5]]},
 {t:'Desliza y conoce su historia',d:'Guarda las que te gusten y mira por qué son buen match para ti y para ellas.',imgs:[['max',16,214,176,224,-5],['mora',170,100,184,232,6]]},
 {t:'Acompáñalo en su nueva casa',d:'Tras la adopción, sigue su adaptación día a día con recordatorios de salud.',imgs:[['nala',16,100,184,232,-4],['cafe',176,222,170,216,5]]}];
SC.onboard=(p)=>{const i=p.i||0,o=OB[i];
 return{cls:'flush nonav',html:`<div class="ob"><div class="art">${o.imgs.map(([n,x,y,w,h,r])=>`<img src="${pet(n).img}" alt="" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;rotate:${r}deg">`).join('')}
 <button class="btn sm" style="position:absolute;top:56px;right:18px;background:rgba(255,255,255,.18);color:#fff" data-a="skipob">Saltar</button></div>
 <div class="copy"><div class="dots">${OB.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
 <h2 class="h-l">${o.t}</h2><p class="muted" style="margin:10px 0 22px">${o.d}</p>
 <button class="btn pri" data-a="nextob" data-v="${i}">${i<2?'Siguiente':'Comenzar'}</button></div></div>`,
 mount(el){$$('.art img',el).forEach((im,k)=>gsap.from(im,{y:60,opacity:0,scale:.9,delay:.1+k*.12,duration:.7,ease:'power3.out'}))}}};

SC.login=()=>({cls:'nonav',html:`<div class="lmark" style="width:60px;height:60px;border-radius:20px;background:var(--lagoon);color:#fff;display:grid;place-items:center;margin:14px 0 26px">${ic('paw-print','')}</div>
 <h1 class="h-l">Entra a PetMatch</h1><p class="muted" style="margin:8px 0 26px">Tu cuenta abre el espacio de familia o el de administración.</p>
 <form class="stack" data-form="login" novalidate>
 <div class="field"><label for="le">Correo</label><div class="input">${ic('mail')}<input id="le" type="email" autocomplete="email" placeholder="tucorreo@ejemplo.com"></div></div>
 <div class="field"><label for="lp">Contraseña</label><div class="input">${ic('lock')}<input id="lp" type="password" autocomplete="current-password" placeholder="Tu contraseña"><button type="button" data-a="eye" aria-label="Mostrar contraseña">${ic('eye')}</button></div></div>
 <div class="err" id="er" aria-live="polite"></div>
 <button class="btn pri" type="button" data-a="submit">Entrar</button></form>
 <div class="demo-access"><h2 class="h-s">Accesos de demostración</h2>
 <button class="btn ghost" data-a="demofill" data-v="family">${ic('paw-print')} Entrar como familia</button>
 <button class="btn ghost" data-a="demofill" data-v="admin">${ic('shield-check')} Entrar como administrador</button></div>
 <p class="muted small" style="text-align:center;margin-top:22px">¿Aún no tienes cuenta? <button data-a="goreg" style="font-weight:700;color:var(--lagoon-2);text-decoration:underline">Crear cuenta</button></p>`});

SC.register=()=>({cls:'nonav',html:`<button class="iconbtn" data-a="back" aria-label="Volver">${ic('arrow-left')}</button>
 <h1 class="h-l" style="margin:22px 0 8px">Crea tu cuenta</h1><p class="muted" style="margin-bottom:22px">Toma menos de un minuto.</p>
 <form class="stack" data-form="register" novalidate>
 <div class="field"><label for="rn">Nombre</label><div class="input">${ic('user')}<input id="rn" autocomplete="name" placeholder="Tu nombre"></div></div>
 <div class="field"><label for="re">Correo</label><div class="input">${ic('mail')}<input id="re" type="email" autocomplete="email" placeholder="tucorreo@ejemplo.com"></div></div>
 <div class="field"><label for="rp">Contraseña</label><div class="input">${ic('lock')}<input id="rp" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></div></div>
 <div class="err" id="er" aria-live="polite"></div>
 <button class="btn pri" type="button" data-a="submit">Crear cuenta</button></form>`});

const quizQuestions=[...DIMS,KIDS_QUESTION];
let setup={i:0,answers:{}};

SC.setup=({reset})=>{
 if(reset)setup={i:0,answers:{}};
 const i=setup.i, question=quizQuestions[i], total=quizQuestions.length;
 const answer=setup.answers[question.k]||{};
 const options=[...question.opts,['Otra opción','Describe tu situación','ellipsis',null]];
 return{cls:'nonav quiz',html:`<div class="row quiz-progress">
 ${i>0?'<button class="iconbtn" data-a="setback" aria-label="Anterior">'+ic('arrow-left')+'</button>':''}
 <div class="prog sp" role="progressbar" aria-label="Progreso del test" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${i+1}"><i style="width:${(i+1)/total*100}%"></i></div>
 <span class="small muted">${i+1} de ${total}</span></div>
 <h1 class="h-l">${question.q}</h1><p class="muted quiz-hint">${question.hint}</p>
 <form data-form="quiz">
 <fieldset class="stack quiz-options" aria-label="${question.l}">${options.map(([title,subtitle,icon],index)=>`
 <label class="opt quiz-option"><span class="ic">${ic(icon)}</span><span class="quiz-option-copy"><b>${title}</b><span>${subtitle}</span></span>
 <input type="radio" name="choice" value="${index}" required ${answer.choice===String(index)?'checked':''}></label>`).join('')}</fieldset>
 <div class="card quiz-extra" hidden>
 <label class="field" data-quiz-description hidden><span>Cuéntanos cuál</span><input name="description" minlength="2" maxlength="100" value="${escapeText(answer.description||'')}"></label>
 <label class="field"><span>${question.bandLabel||{space:'¿A qué espacio tendrá acceso?',exp:'¿Qué nivel se parece más a tu experiencia?'}[question.k]}</span>
 <select name="band"><option value="">Selecciona una opción</option>${question.bands.map((band,index)=>`<option value="${index}" ${answer.band===String(index)?'selected':''}>${band}</option>`).join('')}</select></label>
 </div>
 <button class="btn pri quiz-next" type="submit">${i===total-1?'Ver mis matches':'Continuar'}</button>
 </form>`,
 mount(el){
  const form=$('form',el), extra=$('.quiz-extra',form);
  const {choice,description,band}=form.elements;
  const update=()=>{
   const custom=choice.value===String(question.opts.length);
   const variable=choice.value!==''&&options[Number(choice.value)][3]===null;
   extra.hidden=!variable;
   $('[data-quiz-description]',form).hidden=!custom;
   description.disabled=!custom;
   description.required=custom;
   band.disabled=!variable;
   band.required=variable;
   setup.answers[question.k]={choice:choice.value,description:description.value,band:band.value};
  };
  form.addEventListener('input',event=>{
   if(event.target.name==='choice'&&choice.value!==setup.answers[question.k]?.choice)band.value='';
   update();
  });
  update();
 }};
};

function submitQuiz(form){
 const description=form.elements.description;
 if(description.required&&description.value.trim().length<2){
  description.setCustomValidity('Escribe al menos dos caracteres para describir tu situación.');
  description.reportValidity();
  description.setCustomValidity('');
  return;
 }
 if(setup.i<quizQuestions.length-1){
  setup.i++;
  go('setup',{},'fade');
 }else commitSetup();
}

SC.home=()=>{const u=user();
 return{cls:'matches-page',html:`<div class="topbar matches-head"><div><div class="small muted">Hola, ${first(u.name)}</div><h1 class="h-l">Tus matches</h1></div><span class="sp"></span>
 <button class="iconbtn" data-a="notif" aria-label="Notificaciones">${ic('bell')}</button></div>
 <div class="match-tools"><span>${PETS.length} mascotas en el catálogo</span><button data-a="tab" data-v="explore">Ver todas ${ic("arrow-up-right")}</button></div>
 <div class="deckwrap"></div>
 <div class="decks-actions"><button class="round no" data-a="pass" aria-label="Pasar">${ic('x')}</button><button class="round yes" data-a="like" aria-label="Me gusta">${ic('heart')}</button><button class="round mid" data-a="infotop" aria-label="Ver perfil">${ic('info')}</button></div>
`,
 mount(el){buildDeck(el)}}};

const catalogModes = [['all','Todas','layout-grid'],['adopt','Adopción gratuita','heart-handshake'],['buy','Compra de cachorros','shopping-bag']];
const catalogFilters = [
  ['species','Especie',['Perro','Gato','Conejo']],
  ['stage','Etapa',['Cachorro','Adulto']],
  ['size','Tamaño',['Pequeño','Mediano','Grande']]
];
let catalog = {mode:'all',query:'',species:'',stage:'',size:''};

SC.explore=()=>({cls:'catalog',html:`<header class="catalog-head">
 <h1 class="h-xl">Encuentra tu match</h1><p>Explora mascotas según tu hogar y tu estilo de vida.</p></header>
 <div class="catalog-modes" role="group" aria-label="Modalidad">${catalogModes.map(([key,label,icon])=>`<button data-a="catalogMode" data-v="${key}" aria-pressed="${catalog.mode===key}">${ic(icon)}<span>${label}</span></button>`).join('')}</div>
 <div class="catalog-tools">
 <label class="input search">${ic('search')}<input id="q" type="search" placeholder="Nombre, raza o localidad" aria-label="Buscar por nombre, raza o localidad"></label>
 <div class="catalog-filters">${catalogFilters.map(([key,label,options])=>`<label>${label}<select data-filter="${key}"><option value="">${key==='species'?'Todas':'Todos'}</option>${options.map(option=>`<option>${option}</option>`).join('')}</select></label>`).join('')}</div></div>
 <div class="catalog-count"><span role="status" id="result-count"></span><button data-a="clearCatalog">Limpiar filtros</button></div>
 <div class="stack" id="list"></div>`,
 mount(el){
  const query=$('#q',el), filters=$$('[data-filter]',el);
  const draw=()=>{
    const q=normalizeSearch(catalog.query.trim());
    const list=ranked().filter(p=>(catalog.mode==='all'||catalog.mode===acquisition(p))
      &&(!catalog.species||catalog.species===p.sp)&&(!catalog.stage||catalog.stage===stageOf(p))
      &&(!catalog.size||catalog.size===p.size)&&normalizeSearch([p.n,p.br,p.area].join(' ')).includes(q));
    $('#result-count',el).textContent=list.length===1?'1 mascota':list.length+' mascotas';
    $('#list',el).innerHTML=list.length?list.map(pcard).join(''):`<div class="empty"><div class="ic">${ic('search-x')}</div><div class="h-s">Sin resultados</div><p class="muted small">Prueba con otros filtros o cambia tu búsqueda.</p></div>`;
    icons();
  };
  el._refresh=()=>{
    query.value=catalog.query;
    filters.forEach(select=>{select.value=catalog[select.dataset.filter]});
    $$('[data-a="catalogMode"]',el).forEach(button=>button.setAttribute('aria-pressed',catalog.mode===button.dataset.v));
    draw();
  };
  query.oninput=()=>{catalog.query=query.value;draw()};
  filters.forEach(select=>{select.onchange=()=>{catalog[select.dataset.filter]=select.value;draw()}});
  el._refresh();
 }});

SC.favs=()=>{const l=ranked().filter(p=>user().favs.includes(p.id));
 return{html:`<h1 class="h-l">Guardadas</h1><p class="muted" style="margin:4px 0 18px">${l.length?l.length+' mascotas que te gustaron':'Aquí aparecerán tus favoritas'}</p>
 ${l.length?`<div class="stack">${l.map(pcard).join('')}</div>`:`<div class="empty"><div class="ic">${ic('heart')}</div><div class="h-m">Aún no guardas ninguna</div><p class="muted" style="margin:8px 0 18px">Toca el corazón en una mascota para guardarla.</p><button class="btn dark" data-a="tab" data-v="home">Ir a mis matches</button></div>`}`}};

SC.detail=(p0)=>{const p=pet(p0.id),m=mt(p);
 return{cls:'flush nonav',html:`<div class="hero"><img src="${p.img}" alt="${p.n}, ${p.br}"><div class="bar-top"><button class="iconbtn glass" data-a="back" aria-label="Volver">${ic('arrow-left')}</button><button class="iconbtn glass" data-a="fav" data-v="${p.id}" id="dfav" aria-label="Guardar">${ic('heart',user().favs.includes(p.id)?'':'')}</button></div></div>
 <div class="sheet">${modeBadge(p)}<div class="row detail-name" style="align-items:flex-start"><div><h1 class="h-xl">${p.n}</h1><div class="muted" style="margin-top:6px">${p.br} · ${p.age}</div></div><span class="sp"></span>${ringHTML(m.t,78,'rel lt')}</div>
 <div class="tags" style="margin:14px 0 18px">${p.tr.map(t=>`<span class="tag l">${t}</span>`).join('')}</div>
 <div class="facts"><div class="fact"><b>${p.w} kg</b><span>Peso</span></div><div class="fact"><b>${p.size}</b><span>Tamaño</span></div><div class="fact"><b>${p.dist} km</b><span>Distancia</span></div></div>
 <div class="card" style="margin-top:14px"><div class="h-s">Compatibilidad contigo</div>${radar(p,m)}</div>
 <div class="card" style="margin-top:14px"><div class="h-s" style="margin-bottom:4px">Por qué es buen match</div>${m.r.map(r=>`<div class="reason">${ic('check')}<span>${r}</span></div>`).join('')||'<p class="muted">Encaja de forma parcial con tu perfil.</p>'}
 ${m.warn.length?`<div class="h-s" style="margin:12px 0 4px">Ten en cuenta</div>${m.warn.map(w=>`<div class="reason"><span style="color:var(--coral)">${ic('triangle-alert','')}</span><span>${w}</span></div>`).join('')}`:''}</div>
 <div class="card" style="margin-top:14px"><div class="h-s">Su historia</div><p class="muted" style="margin-top:8px">${p.story}</p><p style="margin-top:10px"><b>Necesita:</b> <span class="muted">${p.needs}</span></p></div>
 <section class="card detail-section"><h2 class="h-s">Salud y cuidados</h2>${facts([['Vacunas',p.vaccines],['Esterilización',p.sterilized],['Rutina',p.routine],['Convivencia',p.company]])}</section>
 <section class="card detail-section"><h2 class="h-s">Datos de la publicación</h2>${facts([['Sexo',p.sex],['Etapa',stageOf(p)],['Origen',p.rescued?'Rescate':'Criadero'],['Responsable',p.source],['Localidad',p.area],['Costo',costOf(p)]])}</section>
 <div style="height:24px"></div></div>
 <div class="cta"><button class="btn pri" data-a="adopt" data-v="${p.id}">${ic(acquisition(p)==='buy'?'shopping-bag':'heart-handshake')} ${acquisition(p)==='buy'?'Solicitar compra':'Solicitar adopción'}</button></div>`,
 mount(el){animRings(el);const rp=$('.rp',el),ry=$('.ry',el);[rp,ry].forEach((g,k)=>gsap.from(g,{scale:.1,transformOrigin:'165px 122px',duration:.9,delay:.25+k*.15,ease:'power3.out'}));
  const f=$('#dfav',el);f.classList.toggle('on',user().favs.includes(p.id));
  gsap.from($('.hero img',el),{scale:1.15,duration:1.2,ease:'power2.out'})}}};

const housingOptions=['Apartamento','Casa','Otro'];
const visitSlots=['9:00 a. m.','11:00 a. m.','2:00 p. m.','4:00 p. m.'];
const visitFormat=new Intl.DateTimeFormat('es-CO',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Bogota'});
const escapeText=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let flow={};

SC.adopt=({id})=>{
 if(id){
  const dates=Array.from({length:4},(_,i)=>Date.now()+(i+1)*864e5);
  flow={id,step:1,dates,contact:{name:user().name,email:user().email},visit:{}};
 }
 const pt=pet(flow.id), st=flow.step, buying=acquisition(pt)==='buy';
 const title=buying?'Solicitud de compra':'Solicitud de adopción';
 const contact=flow.contact, visit=flow.visit;
 const selected=(value,current)=>value===current?'selected':'';
 const input=(label,key,type,attrs)=>`<label class="field"><span>${label}</span><input name="${key}" type="${type}" value="${escapeText(contact[key]||'')}" ${attrs} required></label>`;
 let body;
 if(st===1)body=`<section class="request-summary"><img src="${pt.img}" alt=""><div>${modeBadge(pt)}<h2 class="h-m">${pt.n}</h2><b>${costOf(pt)}</b></div></section>
 <h2 class="h-m">Datos de contacto</h2><div class="request-fields">
 ${input('Nombre completo','name','text','autocomplete="name" minlength="2" maxlength="80"')}
 ${input('Correo electrónico','email','email','autocomplete="email" maxlength="120"')}
 ${input('Celular','phone','tel','autocomplete="tel" pattern="[+]?[0-9]{7,15}" placeholder="Ej. 3001234567" title="Ingresa entre 7 y 15 dígitos, sin espacios"')}
 ${input('Ciudad o municipio','city','text','autocomplete="address-level2" minlength="2" maxlength="60"')}
 ${buying?'':`<label class="field"><span>Tipo de vivienda</span><select name="housing" required><option value="">Selecciona una opción</option>${housingOptions.map(value=>`<option ${selected(value,contact.housing)}>${value}</option>`).join('')}</select></label>
 <label class="field"><span>¿Cómo sería su rutina en tu hogar?</span><textarea name="routine" minlength="10" maxlength="300" required>${escapeText(contact.routine||'')}</textarea></label>`}</div>`;
 if(st===2)body=`<h2 class="h-m">Agenda una visita</h2><p class="muted">Conoce a ${pt.n} en ${pt.area}. Responsable de la publicación: ${pt.source}.</p>
 <div class="request-fields"><label class="field"><span>Fecha</span><select name="day" required><option value="">Selecciona un día</option>${flow.dates.map(date=>`<option value="${date}" ${selected(String(date),visit.day)}>${visitFormat.format(date)}</option>`).join('')}</select></label>
 <label class="field"><span>Hora (Colombia)</span><select name="slot" required><option value="">Selecciona una hora</option>${visitSlots.map(slot=>`<option ${selected(slot,visit.slot)}>${slot}</option>`).join('')}</select></label>
 <label class="commitment"><input type="checkbox" name="ok" required ${visit.ok?'checked':''}> Me comprometo a brindarle atención veterinaria, alimentación y cuidados adecuados.</label></div>`;
 if(st===3)body=`<h2 class="h-m">Revisa la solicitud</h2><div class="card">
 ${facts([['Mascota',pt.n],['Modalidad',modeOf(pt)],['Costo',costOf(pt)],['Visita',visitFormat.format(Number(visit.day))+' · '+visit.slot],['Localidad',pt.area],['Contacto',escapeText(contact.name)],['Correo',escapeText(contact.email)],['Celular',escapeText(contact.phone)],['Ciudad',escapeText(contact.city)],...(!buying?[['Vivienda',escapeText(contact.housing)],['Rutina',escapeText(contact.routine)]]:[])])}</div>
 <p class="small muted">La confirmación se guarda en este navegador y crea un comprobante y envía la solicitud al panel de demostración.</p>`;
 return{cls:'nonav request',html:`<div class="row request-top"><button class="iconbtn" data-a="${st>1?'fback':'back'}" aria-label="Volver">${ic('arrow-left')}</button>
 <div><span class="small muted">Paso ${st} de 3</span><h1 class="h-l">${title}</h1></div></div>
 <form data-form="request" class="request-form">${body}<p class="form-error" role="alert"></p><button type="submit" class="btn pri">${st===3?'Confirmar solicitud':'Continuar'}</button></form>`};
};

function submitRequest(form){
 const values=Object.fromEntries(new FormData(form));
 if(flow.step===1){
  for(const key of Object.keys(values))values[key]=values[key].trim();
  if(values.name.length<2||values.city.length<2||(values.routine!==undefined&&values.routine.length<10)){
   $('.form-error',form).textContent='Completa tu nombre, ciudad y los datos de vivienda que se solicitan.';
   return;
  }
  flow.contact=values;
 }else if(flow.step===2){
  if(!flow.dates.includes(Number(values.day))||!visitSlots.includes(values.slot)||!values.ok)return;
  flow.visit=values;
 }else{
  confirmAdopt();
  return;
 }
 flow.step++;
 go('adopt',{},'fade');
}

SC.success=()=>{const a=familyCases().find(record=>record.code===lastRequestCode)||familyCases()[0],pt=pet(a.id);const q=qrcode(0,'M');q.addData(`PETMATCH|${a.code}|${pt.n}|${user().name}`);q.make();
 return{cls:'done nonav',html:`<div style="text-align:center;margin:6px 0 20px"><div class="h-l">Solicitud recibida</div><p style="color:#A8D4CC;margin-top:6px">Comprobante digital de ${pt.n}</p></div>
 <div class="passport"><div class="top"><img src="${pt.img}" alt=""><div><div class="h-m">${pt.n}</div><div class="small">${pt.br}</div><div class="small" style="margin-top:6px;font-weight:600">${pt.age} · ${pt.size}</div></div></div>
 <div class="body"><div class="perf"></div><div class="pf"><div><small>Familia</small><b>${user().name}</b></div><div><small>Modalidad</small><b>${a.type==='buy'?'Compra':'Adopción gratuita'}</b></div><div><small>Fecha</small><b>${new Date(a.ts).toLocaleDateString('es-CO')}</b></div><div><small>Código</small><b>${a.code}</b></div></div>
 <div class="row" style="gap:14px"><div class="qr">${q.createSvgTag({cellSize:4,margin:0,scalable:true})}</div><p class="small" style="color:#4c6a6d">Este código identifica el comprobante de demostración.</p></div></div></div>
 <div class="stack" style="margin-top:22px"><button class="btn pri" data-a="tab" data-v="track">Ver su seguimiento</button><button class="btn" style="background:rgba(255,255,255,.12);color:#fff" data-a="tab" data-v="home">Volver al inicio</button></div>`,
 mount(el){gsap.from($('.passport',el),{y:120,rotation:4,opacity:0,duration:.9,ease:'power3.out'});
  if(!reduce){const f=(o)=>confetti(Object.assign({particleCount:70,spread:70,colors:['#FFB000','#1FBF8F','#FF5C4D','#C9C3FF','#fff'],zIndex:999},o));setTimeout(()=>f({origin:{x:.3,y:.4},angle:60}),350);setTimeout(()=>f({origin:{x:.7,y:.4},angle:120}),500)}}}};

SC.profile=()=>{const u=user(),pr=u.prefs;
 return{html:`<div class="row" style="margin-bottom:22px"><div class="avatar">${u.name[0]}</div><div><h1 class="h-m">${u.name}</h1><div class="muted small">${u.email}</div></div></div>
 <div class="stats"><div class="stat"><b>${user().favs.length}</b><span>Guardadas</span></div><div class="stat"><b>${user().swiped.length}</b><span>Vistas</span></div><div class="stat"><b>${familyCases().length}</b><span>Solicitudes</span></div></div>
 <div class="card" style="margin-top:14px"><div class="row" style="margin-bottom:10px"><div class="h-s">Tu perfil de vida</div><span class="sp"></span><button class="btn sm ghost" data-a="retest">Rehacer</button></div>
 ${quizQuestions.map(d=>`<div class="sumrow quiz-profile"><span class="muted">${d.l}</span><b>${escapeText(pr.labels?.[d.k]||(d.k==='kids'?(pr.kids?'Sí':'No'):LEVEL[d.k][pr[d.k]]))}</b></div>`).join('')}</div>
 <div class="menu" style="margin-top:14px"><button class="mi" data-a="notif">${ic('bell')}Notificaciones</button><button class="mi" data-a="theme">${ic('moon')}Modo oscuro<span class="sw ${S.theme==='dark'?'on':''}"></span></button><button class="mi" data-a="help">${ic('circle-help')}Cómo funciona el match</button><button class="mi" data-a="logout" style="color:var(--coral)">${ic('log-out')}Cerrar sesión</button></div>`}};

/* ---------- acciones ---------- */
const emailOk=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
function commitSetup(){
 const prefs={labels:{}};
 for(const question of quizQuestions){
  const answer=setup.answers[question.k];
  const option=question.opts[Number(answer.choice)];
  const score=option?.[3]??Number(answer.band);
  prefs[question.k]=question.k==='kids'?Boolean(score):score;
  prefs.labels[question.k]=option?.[0]||answer.description.trim();
 }
 user().prefs=prefs;
 user().swiped=[];
 save();
 reset();
 go('home',{},'fade');
}
function confirmAdopt(){
 const pt=pet(flow.id);
 const record=createCase(pt,{owner:S.session,contact:flow.contact,visit:flow.visit});
 lastRequestCode=record.code;
 go('success',{},'fade');
}
const A={
 back,
 tab:v=>{if(cur.name===v)return;reset();go(v,{},'tab')},
 open:v=>go('detail',{id:v}),
 fav:(v,el)=>{const had=user().favs.includes(v);user().favs=had?user().favs.filter(x=>x!==v):[...user().favs,v];save();
   $$(`[data-a="fav"][data-v="${v}"]`).forEach(b=>{b.classList.toggle('on',!had);b.setAttribute('aria-label',had?'Guardar':'Quitar de guardadas')});
   const b=el.closest('[data-a="fav"]');if(b)gsap.fromTo(b,{scale:.6},{scale:1,duration:.5,ease:'elastic.out(1.2,.5)'});if(cur.name==='favs'&&had)setTimeout(()=>go('favs',{},'fade'),200)},
 pass:()=>fly(-1),like:()=>fly(1),infotop:()=>{const t=$$('.dcard').pop();t&&go('detail',{id:t.dataset.id})},
 deckreset:()=>{user().swiped=[];save();go('home',{},'fade')},
 notif:()=>modal(`<div class="h-m" style="margin-bottom:6px">Notificaciones</div>
  ${[['sparkles','Nuevo match','Revisa tus recomendaciones en Matches.'],['syringe','Recordatorio','Cuida que las vacunas estén al día.'],familyCases().length?['paw-print','Tus solicitudes','Consulta su estado y los registros en Seguimiento.']:['heart','Guarda tus favoritas','Toca el corazón para compararlas después.']].map(([i,t,s])=>`<div class="notif"><span class="ic">${ic(i)}</span><div><b>${t}</b><div class="small muted">${s}</div></div></div>`).join('')}<button class="btn dark" style="margin-top:16px" data-close>Cerrar</button>`),
 help:()=>modal(`<div class="h-m" style="margin-bottom:8px">Cómo funciona el match</div><p class="muted">Comparamos cuatro cosas de tu vida con lo que cada mascota necesita: espacio, tiempo, energía y experiencia. Si hay niños en casa, también lo tenemos en cuenta.</p><p class="muted" style="margin-top:10px">Mientras más se parecen tu perfil y sus necesidades, más alto es el porcentaje. Así cuidamos tu bienestar y el suyo.</p><button class="btn dark" style="margin-top:18px" data-close>Entendido</button>`),
 theme:()=>{S.theme=S.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=S.theme;save();$('.sw')?.classList.toggle('on',S.theme==='dark')},
 logout:()=>{S.session=null;save();reset();go('login',{},'fade')},
 retest:()=>{reset();go('setup',{reset:1})},
 catalogMode:v=>{catalog.mode=v;cur.el._refresh()},
 clearCatalog:()=>{catalog={mode:'all',query:'',species:'',stage:'',size:''};cur.el._refresh()},
 eye:(v,el)=>{const i=$('#lp');i.type=i.type==='password'?'text':'password';el.innerHTML=ic(i.type==='password'?'eye':'eye-off');icons()},
 demofill:role=>{
  const account=role==='admin'?ADMIN_DEMO:DEMO;
  $('#le',cur.el).value=account.email;
  $('#lp',cur.el).value=account.pass;
  submitForm($('[data-form=login]',cur.el));
 },
 submit:(v,el)=>submitForm(el.closest('[data-form]')),
 goreg:()=>go('register'),
 skipob:()=>{S.tourDone=true;save();go('login',{},'fade')},
 nextob:v=>{v=+v;if(v<2)go('onboard',{i:v+1},'fade');else{S.tourDone=true;save();go('login',{},'fade')}},
 setback:()=>{setup.i--;go('setup',{},'fade')},
 adopt:v=>go('adopt',{id:v}),
 fback:()=>{if(flow.step>1){flow.step--;go('adopt',{},'fade')}},
 ...caseActions
};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const f=A[t.dataset.a];if(f){e.stopPropagation();f(t.dataset.v,t)}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.pcard[data-a]')){e.preventDefault();e.target.click()}});
function submitForm(f){const er=$('#er',f);
 if(f.dataset.form==='login'){const em=$('#le').value.trim().toLowerCase(),pw=$('#lp').value;
  if(!emailOk(em)){er.textContent='Escribe un correo válido, como nombre@correo.com';return}
  if(!pw){er.textContent='Escribe tu contraseña';return}
  const demo=[ADMIN_DEMO,DEMO].find(account=>account.email===em&&account.pass===pw);
  let u=S.users.find(x=>x.email===em);
  if(demo){
   if(!u){u={...demo,prefs:demo.prefs?{...demo.prefs}:undefined};S.users.push(u)}
   else if(demo===ADMIN_DEMO)Object.assign(u,ADMIN_DEMO);
  }
  if(!u||u.pass!==pw){er.textContent='El correo o la contraseña no coinciden. Revisa e inténtalo otra vez.';gsap.fromTo(f,{x:-8},{x:0,duration:.5,ease:'elastic.out(1,.3)'});return}
  beginSession(u);
  go(startPage(),{},'fade')}
 else{const n=$('#rn').value.trim(),em=$('#re').value.trim().toLowerCase(),pw=$('#rp').value;
  if(n.length<2){er.textContent='Escribe tu nombre';return}
  if(!emailOk(em)){er.textContent='Escribe un correo válido, como nombre@correo.com';return}
  if(pw.length<6){er.textContent='La contraseña debe tener mínimo 6 caracteres';return}
  if([ADMIN_DEMO.email,DEMO.email].includes(em)||S.users.some(x=>x.email===em)){er.textContent='Ese correo ya tiene cuenta. Inicia sesión.';return}
  const account={name:n,email:em,pass:pw,favs:[],swiped:[],prefs:{space:1,time:1,energy:1,exp:1,kids:false}};S.users.push(account);beginSession(account);go('setup',{reset:1},'fade')}}
document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(f){e.preventDefault();if(!cur.el.contains(f))return;if(f.dataset.form==='request')submitRequest(f);else if(f.dataset.form==='quiz')submitQuiz(f);else if(f.dataset.form==='case-note')submitCaseNote(f);else if(f.dataset.form==='case-chat')submitCaseChat(f);else submitForm(f)}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-form=login] input,[data-form=register] input')){e.preventDefault();submitForm(e.target.closest('[data-form]'))}});
function selectTab(name){
 if(tabs.inert||name===cur.name)return;
 reset();
 go(name,{},'tab');
}

let tabDrag=null;
function clearTabDrag(){
 if(!tabDrag)return;
 const drag=tabDrag;
 tabDrag=null;
 tabs.classList.remove('is-dragging');
 if(tabs.hasPointerCapture(drag.id))tabs.releasePointerCapture(drag.id);
 return drag;
}

tabs.addEventListener('pointerdown',event=>{
 if(tabs.inert||tabDrag||!event.isPrimary||event.button!==0||!event.target.closest('.tab'))return;
 tabDrag={id:event.pointerId,startX:event.clientX,index:0,active:false};
});
tabs.addEventListener('pointermove',event=>{
 const drag=tabDrag;
 if(!drag||event.pointerId!==drag.id)return;
 if(!drag.active){
  if(Math.abs(event.clientX-drag.startX)<7)return;
  drag.active=true;
  tabs.setPointerCapture(drag.id);
  tabs.classList.add('is-dragging');
 }
 const first=tabs.querySelector('.tab').getBoundingClientRect();
 const last=tabs.lastElementChild.getBoundingClientRect();
 const fraction=(event.clientX-first.left-first.width/2)/(last.left+last.width/2-first.left-first.width/2);
 const position=Math.min(TAB.length-1,Math.max(0,fraction*(TAB.length-1)));
 drag.index=Math.round(position);
 setLens(reduce?drag.index:position,false);
});

function finishTabDrag(event,commit){
 if(event.pointerId!==tabDrag?.id)return;
 const drag=clearTabDrag();
 if(!drag.active)return;
 const selected=TAB[drag.index];
 if(commit&&selected!==cur.name)selectTab(selected);
 else setLens(TAB.indexOf(cur.name),true);
}
tabs.addEventListener('pointerup',event=>finishTabDrag(event,true));
tabs.addEventListener('pointercancel',event=>finishTabDrag(event,false));
tabs.addEventListener('lostpointercapture',event=>{
 if(event.target===tabs)finishTabDrag(event,false);
});
tabs.addEventListener('pointerleave',event=>{
 if(tabDrag&&!tabDrag.active&&event.pointerId===tabDrag.id)clearTabDrag();
});
tabs.addEventListener('click',event=>{
 const tab=event.target.closest('.tab');
 if(tab)selectTab(tab.dataset.go);
});

/* ---------- arranque ---------- */
function fit(){const ph=$('.phone');if(innerWidth<=520){ph.style.transform='none';ph.style.margin='0';return}const s=Math.min(1,(innerHeight-24)/844);ph.style.transform=`scale(${s})`;ph.style.margin=`${-(844*(1-s))/2}px 0`}
addEventListener('resize',fit);fit();
document.documentElement.dataset.theme=S.theme;
const q=new URLSearchParams(location.search);
SC.admin=adminScreen;
SC.track=trackScreen;
installCases();
if(user()){beginSession(user());go(startPage());}
else go(publicPages.includes(q.get('s'))?q.get('s'):'splash');
