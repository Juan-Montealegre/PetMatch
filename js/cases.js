/* Solicitudes y seguimiento local de PetMatch */
const caseStatuses={
 pending:'Recibida', reviewing:'En revisión', scheduled:'Visita confirmada',
 delivered:'Entregada', declined:'Cerrada'
};
const caseTransitions={
 pending:[['reviewing','Iniciar revisión'],['declined','Cerrar solicitud']],
 reviewing:[['scheduled','Confirmar visita'],['declined','Cerrar solicitud']],
 scheduled:[['delivered','Registrar entrega'],['declined','Cerrar solicitud']],
 delivered:[], declined:[]
};
const followUpKinds={
 family:'Reporte de la familia', digital:'Contacto virtual', visit:'Visita presencial'
};
const caseDay=record=>Math.max(1,Math.floor((Date.now()-record.deliveredAt)/864e5)+1)+(record.offset||0);
const caseByCode=code=>S.cases.find(record=>record.code===code);
const familyCases=()=>S.cases.filter(record=>record.owner===S.session).slice().reverse();
const modeLabel=record=>record.type==='buy'?'Compra':'Adopción gratuita';
let lastRequestCode;
let adminSection='requests';
const adminLists={
 requests:{query:'',filter:'all',page:1},
 followup:{query:'',filter:'all',page:1}
};
const adminTabs=[['requests','Solicitudes','inbox'],['followup','Seguimiento','activity'],['profile','Perfil','circle-user-round']];
const adminPageSize=8;

function createCase(p,details){
 const code='PM-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8,'0').toUpperCase();
 const record={code,id:p.id,type:acquisition(p),status:'pending',ts:Date.now(),events:[],...details};
 record.events.unshift({kind:'status',text:caseStatuses[record.status],ts:record.ts});
 S.cases.push(record);
 save();
 return record;
}

function advanceCase(record,days){
 if(record.status!=='delivered'||![1,7].includes(days))return;
 record.offset=(record.offset||0)+days;
 save();
 toast('Seguimiento en día '+caseDay(record),'fast-forward');
}

function installCases(){
 const legacy=S.adopt;
 if(legacy&&pet(legacy.id)&&!caseByCode(legacy.code)){
  const owner=S.session||legacy.contact?.email||DEMO.email;
  S.cases.push({...legacy,owner,status:'delivered',deliveredAt:legacy.ts,events:[
   {kind:'status',text:'Entrega registrada en la versión anterior',ts:legacy.ts}
  ]});
  delete S.adopt;
  save();
 }
}

function caseHeader(title,description,icon){
 return `<header class="case-hero"><span class="case-hero-icon">${ic(icon)}</span><h1 class="h-l">${title}</h1><p>${description}</p></header>`;
}

function caseFamily(record){
 return record.contact?.name||S.users.find(account=>account.email===record.owner)?.name||record.owner||'Sin familia asociada';
}

function caseCard(record,action,showReport=false){
 const p=pet(record.id), admin=action==='adminCase';
 const family=admin?caseFamily(record):'';
 const report=showReport?lastReport(record):null;
 return `<button class="case-card" data-a="${action}" data-v="${record.code}">
 <img src="${p.img}" alt=""><span><b>${p.n}</b><small class="case-owner">${family?escapeText(family)+' · ':''}${modeLabel(record)}</small><small>${record.code} ${record.sampleKey&&admin?'· Caso de feria':''}</small>
 <span class="case-status" data-status="${record.status}">${caseStatuses[record.status]}</span> ${needsAttention(record)?'<span class="case-flag">Requiere atención</span>':''}
 ${showReport?`<small class="case-report-preview">${report?'Día '+report.day+' · '+escapeText(report.result):'Pendiente del primer reporte'}</small>`:''}</span>${ic('chevron-right')}</button>`;
}

function caseTimeline(record){
 return `<section class="card case-section"><h2 class="h-s">Historial</h2><ol class="case-timeline">${record.events.slice().reverse().map(event=>`
 <li><span class="case-point">${ic(event.kind==='status'?'flag':event.kind==='visit'?'map-pin':'message-circle')}</span>
 <div><b>${followUpKinds[event.kind]||'Estado de la solicitud'}</b>
 <small class="muted">${event.day?'Día '+event.day+' · ':''}${new Date(event.ts).toLocaleDateString('es-CO',{timeZone:'America/Bogota'})}</small>
 ${event.daily?`<small class="daily-summary">Apetito: ${escapeText(event.daily.appetite)} · Actividad: ${escapeText(event.daily.activity)} · Adaptación: ${escapeText(event.daily.adjustment)}</small>`:''}
 <p>${event.result?'<strong>'+escapeText(event.result)+'</strong> · ':''}${escapeText(event.text)}</p>
 ${event.next?'<small>Próximo contacto: '+escapeText(event.next.split('-').reverse().join('/'))+'</small>':''}</div></li>`).join('')}</ol></section>`;
}

const dailyFields=[
 ['appetite','Apetito',['Normal','Comió menos','No comió']],
 ['activity','Actividad',['Habitual','Menos activa','Inquieta']],
 ['adjustment','Adaptación',['Se siente en casa','Se está adaptando','Le está costando']]
];
const lastReport=record=>record.events.findLast(event=>event.kind==='family');
const needsAttention=record=>{
 const report=lastReport(record);
 return record.status==='delivered'&&Boolean(report&&(report.result!=='Se está adaptando bien'||report.daily?.appetite==='No comió'||report.daily?.adjustment==='Le está costando'));
};

function caseChat(record,admin){
 const messages=record.messages||[];
 return {cls:'case-page chat-page',html:`<div class="row case-back"><button class="iconbtn" data-a="caseChatBack" data-v="${record.code}" aria-label="Volver al caso">${ic('arrow-left')}</button><span class="small muted">${record.code}</span></div>
 ${caseHeader(admin?'Chat con la familia':'Chat con PetMatch',pet(record.id).n,'messages-square')}
 <ol class="chat-history" aria-label="Conversación">${messages.length?messages.map(message=>{
 const mine=message.role===(admin?'admin':'family');
 return `<li class="${mine?'mine':''}"><small>${message.role==='admin'?'Equipo PetMatch':'Familia'} · ${new Date(message.ts).toLocaleString('es-CO',{timeZone:'America/Bogota',dateStyle:'short',timeStyle:'short'})}</small><p>${escapeText(message.text)}</p></li>`;
 }).join(''):'<li class="muted">Aún no hay mensajes en este caso.</li>'}</ol>
 <form class="chat-compose request-fields" data-form="case-chat" data-code="${record.code}">
 <label class="field"><span>Mensaje</span><textarea name="message" maxlength="600" required></textarea></label>
 <p role="alert" class="form-error"></p><button class="btn pri" type="submit">${ic('send')} Enviar mensaje</button></form>`,
 mount(el){const history=$('.chat-history',el);history.scrollTop=history.scrollHeight;}};
}

function submitCaseChat(form){
 const admin=isAdmin();
 const record=(admin?S.cases:familyCases()).find(item=>item.code===form.dataset.code);
 if(!record)return;
 const value=form.elements.message.value.trim();
 if(!value){$('.form-error',form).textContent='Escribe un mensaje antes de enviarlo.';return}
 (record.messages||=[]).push({role:admin?'admin':'family',text:value,ts:Date.now()});
 save();
 go(admin?'admin':'track',{code:record.code,chat:true},'fade');
}

function caseForm(record,admin){
 return `<form class="card case-section request-fields" data-form="case-note" data-code="${record.code}">
 <h2 class="h-s">${admin?'Registrar seguimiento':'Registrar cómo está hoy'}</h2>
 ${admin?`<label class="field"><span>Canal</span><select name="kind" required><option value="digital">Contacto virtual</option><option value="visit">Visita presencial</option></select></label>`:''}
 <label class="field"><span>${admin?'Resultado':'Estado de la mascota'}</span><select name="result" required><option value="">Selecciona una opción</option>${(admin?['Evolución favorable','Requiere seguimiento','Contacto pendiente']:['Se está adaptando bien','Necesita apoyo','Tengo una inquietud']).map(text=>'<option>'+text+'</option>').join('')}</select></label>
 ${admin?'':dailyFields.map(([key,label,values])=>`<label class="field"><span>${label}</span><select name="${key}" required><option value="">Selecciona una opción</option>${values.map(value=>'<option>'+value+'</option>').join('')}</select></label>`).join('')}
 <label class="field"><span>${admin?'Observaciones y acuerdos':'¿Qué observaste hoy?'}</span><textarea name="note" maxlength="400" required></textarea></label>
 ${admin?'<label class="field"><span>Próximo contacto (opcional)</span><input type="date" name="next"></label>':''}
 <p class="form-error" role="alert"></p><button type="submit" class="btn pri">Guardar registro</button></form>`;
}

function caseDetail(record,admin){
 const p=pet(record.id), contact=record.contact||{};
 const visit=Number(record.visit?.day);
 const date=visit?visitFormat.format(visit)+' · '+escapeText(record.visit.slot):'Por definir';
 const day=record.status==='delivered'?caseDay(record):null;
 const followUps=record.events.filter(event=>event.kind==='digital'||event.kind==='visit');
 const reports=record.events.filter(event=>event.kind==='family');
 return {cls:'case-page',html:`<div class="row case-back"><button class="iconbtn" data-a="${admin?'adminList':'trackList'}" aria-label="Volver a la lista">${ic('arrow-left')}</button><span class="small muted">${record.code}</span></div>
 ${caseHeader(p.n,modeLabel(record),admin?'shield-check':'paw-print')}
 <div class="case-metrics"><div><b>${day?'Día '+day:caseStatuses[record.status]}</b><small>${day?'Desde la entrega':'Estado'}</small></div>
 <div><b>${reports.length}</b><small>Reportes</small></div><div><b>${followUps.length}</b><small>Contactos</small></div></div>
 ${day?`<section class="card case-section case-check-in"><h2 class="h-s">Último reporte de la familia</h2><p>${lastReport(record)?'Día '+lastReport(record).day+' · '+escapeText(lastReport(record).result):'Pendiente de registrar'}</p>${needsAttention(record)?'<span class="case-flag">Requiere revisión</span>':''}</section>`:''}
 <button class="btn ghost case-chat-button" data-a="caseChat" data-v="${record.code}">${ic('messages-square')} Chat <span>${(record.messages||[]).length}</span></button>
 <section class="card case-section"><h2 class="h-s">Solicitud</h2>${facts([
  ['Estado',caseStatuses[record.status]],['Visita',date],['Localidad',p.area],['Costo',costOf(p)],
  ...(followUps.at(-1)?.next?[['Próximo contacto',escapeText(followUps.at(-1).next.split('-').reverse().join('/'))]]:[]),
  ...(admin&&contact.name?[['Familia',escapeText(contact.name)],['Correo',escapeText(contact.email||'')],['Celular',escapeText(contact.phone||'Sin registrar')],['Ciudad',escapeText(contact.city||'Sin registrar')],...(contact.housing?[['Vivienda',escapeText(contact.housing)],['Rutina propuesta',escapeText(contact.routine)]]:[])]:[])
 ])}</section>
 ${admin&&caseTransitions[record.status].length?`<section class="card case-section"><h2 class="h-s">Gestionar solicitud</h2><div class="case-buttons">${caseTransitions[record.status].map(([value,label])=>`<button class="btn ${value==='declined'?'dark':'pri'}" data-a="caseStatus" data-v="${value}">${label}</button>`).join('')}</div></section>`:''}
 ${admin&&day?`<section class="card case-section"><h2 class="h-s">Simular el paso del tiempo</h2><div class="case-buttons"><button class="btn dark" data-a="caseAdvance" data-v="1">Avanzar 1 día</button><button class="btn dark" data-a="caseAdvance" data-v="7">Avanzar 7 días</button></div></section>`:''}
 ${caseTimeline(record)}
 ${day?caseForm(record,admin):''}
 `};
}

function adminNavigation(){
 return `<nav class="admin-navigation" aria-label="Administración">${adminTabs.map(([key,label,icon])=>`
 <button data-a="adminSection" data-v="${key}" ${adminSection===key?'aria-current="page"':''}>${ic(icon)}<span>${label}</span></button>`).join('')}</nav>`;
}

function addFairCases(){
 const now=Date.now(), oneDay=864e5;
 const examples=[
  {id:'nala',family:'Familia Rivera',key:'good',offset:2,result:'Se está adaptando bien',note:'Comió con normalidad y usó su rascador. Se acerca a la familia a la hora de jugar.',daily:{appetite:'Normal',activity:'Habitual',adjustment:'Se está adaptando'}},
  {id:'milo',family:'Familia Torres',key:'attention',offset:3,result:'Necesita apoyo',note:'Hoy no comió y permaneció escondido. La familia solicita orientación sobre el siguiente paso.',daily:{appetite:'No comió',activity:'Menos activa',adjustment:'Le está costando'}}
 ];
 for(const sample of examples){
  if(S.cases.some(item=>item.sampleKey===sample.key))continue;
  createCase(pet(sample.id),{
   owner:'feria-'+sample.key+'@example.invalid',
   contact:{name:sample.family,city:'Bogotá'},
   ts:now-3*oneDay,status:'delivered',deliveredAt:now,offset:sample.offset,sampleKey:sample.key,
   events:[{kind:'family',result:sample.result,text:sample.note,daily:sample.daily,day:sample.offset+1,ts:now}]
  });
 }
}

function adminScreen({code,chat}){
 const record=caseByCode(code);
 if(record)return chat?caseChat(record,true):caseDetail(record,true);
 if(adminSection==='profile'){
  const account=user();
  return {cls:'case-page',html:`${caseHeader('Perfil del equipo','Gestiona tu acceso de administración.','circle-user-round')}
  ${adminNavigation()}
  <section class="card case-section"><h2 class="h-s">${escapeText(account.name)}</h2>
  ${facts([['Correo',escapeText(account.email)],['Rol','Administración'],['Entorno','Demostración local']])}
  <button class="btn ghost admin-logout" data-a="logout">${ic('log-out')} Cerrar sesión</button></section>`};
 }
 const follow=adminSection==='followup';
 const state=adminLists[adminSection];
 const delivered=S.cases.filter(item=>item.status==='delivered');
 const attention=delivered.filter(needsAttention).length;
 const recent=S.cases.filter(item=>item.status==='pending').length;
 const filters=follow?[['attention','Requieren atención'],['good','Evolución favorable'],['waiting','Sin reporte']]:Object.entries(caseStatuses);
 return {cls:'case-page admin-overview',html:`${caseHeader(follow?'Seguimiento':'Solicitudes',follow?'Revisa primero los casos que necesitan atención.':'Encuentra y gestiona solicitudes de compra y adopción.','shield-check')}
 ${adminNavigation()}
 <div class="case-metrics"><div><b>${follow?delivered.length:S.cases.length}</b><small>${follow?'Entregadas':'Solicitudes'}</small></div>
 <div><b>${follow?attention:recent}</b><small>${follow?'Por revisar':'Nuevas'}</small></div>
 <div><b>${follow?delivered.filter(item=>!lastReport(item)).length:delivered.length}</b><small>${follow?'Sin reporte':'Entregadas'}</small></div></div>
 <div class="card admin-tools">
 <label class="input search">${ic('search')}<input id="admin-search" type="search" placeholder="Familia, mascota o folio" aria-label="Buscar por familia, mascota o folio"></label>
 <label class="case-filter"><span>${follow?'Filtrar por reporte':'Filtrar por estado'}</span><select id="admin-filter"><option value="all">Todos</option>${filters.map(([key,label])=>`<option value="${key}" ${key===state.filter?'selected':''}>${label}</option>`).join('')}</select></label>
 </div>
 ${S.cases.filter(item=>item.sampleKey).length<2?`<button class="btn ghost admin-load" data-a="adminSamples">${ic('flask-conical')} Cargar dos casos de feria</button>`:''}
 <div class="small muted admin-result" role="status"></div><div class="stack admin-list"></div><div class="admin-pagination"></div>`,
 mount(el){
  const input=$('#admin-search',el), filter=$('#admin-filter',el), pageControls=$('.admin-pagination',el);
  input.value=state.query;
  const draw=()=>{
   const query=normalizeSearch(state.query.trim());
   const list=(follow?delivered:S.cases).filter(item=>{
    const report=lastReport(item);
    const type=follow?(needsAttention(item)?'attention':report?'good':'waiting'):item.status;
    return (state.filter==='all'||state.filter===type)&&normalizeSearch([pet(item.id).n,caseFamily(item),item.code].join(' ')).includes(query);
   }).sort((a,b)=>(follow?Number(needsAttention(b))-Number(needsAttention(a)):0)||(follow?(lastReport(b)?.ts||b.ts)-(lastReport(a)?.ts||a.ts):b.ts-a.ts));
   const pages=Math.max(1,Math.ceil(list.length/adminPageSize));
   state.page=Math.min(state.page,pages);
   const offset=(state.page-1)*adminPageSize;
   $('.admin-result',el).textContent=list.length?offset+1+'–'+Math.min(offset+adminPageSize,list.length)+' de '+list.length+' casos':'0 casos';
   $('.admin-list',el).innerHTML=list.length?list.slice(offset,offset+adminPageSize).map(item=>caseCard(item,'adminCase',follow)).join(''):'<div class="empty"><h2 class="h-s">Sin casos para mostrar</h2><p class="small muted">Prueba con otra búsqueda o cambia el filtro.</p></div>';
   pageControls.innerHTML=pages>1?`<button class="btn ghost" data-page="-1" ${state.page===1?'disabled':''}>Anterior</button><span>${state.page} de ${pages}</span><button class="btn ghost" data-page="1" ${state.page===pages?'disabled':''}>Siguiente</button>`:'';
   icons();
  };
  input.oninput=()=>{state.query=input.value;state.page=1;draw()};
  filter.onchange=()=>{state.filter=filter.value;state.page=1;draw()};
  pageControls.onclick=event=>{
   const button=event.target.closest('[data-page]');
   if(!button||button.disabled)return;
   state.page+=Number(button.dataset.page);draw();
   $('.admin-result',el).scrollIntoView({block:'nearest'});
   $('[data-page="'+button.dataset.page+'"]:not(:disabled)',pageControls)?.focus();
  };
  draw();
 }};
}

function trackScreen({code,chat}){
 const list=familyCases(), record=list.find(item=>item.code===code);
 if(record)return chat?caseChat(record,false):caseDetail(record,false);
 return {cls:'case-page',html:`${caseHeader('Seguimiento','Consulta tus solicitudes y comparte la evolución de tu mascota.','activity')}
 <div class="stack">${list.length?list.map(item=>caseCard(item,'trackCase')).join(''):'<div class="empty"><h2 class="h-s">Aún no tienes solicitudes</h2><button class="btn pri quiz-next" data-a="tab" data-v="explore">Explorar mascotas</button></div>'}</div>`};
}

function submitCaseNote(form){
 const admin=isAdmin();
 const record=(admin?S.cases:familyCases()).find(item=>item.code===form.dataset.code);
 const values=Object.fromEntries(new FormData(form));
 const note=values.note.trim();
 if(!record||record.status!=='delivered')return;
 if(!note){$('.form-error',form).textContent='Escribe una observación para guardar el registro.';return}
 record.events.push({kind:admin?values.kind:'family',result:values.result,text:note,next:values.next,day:caseDay(record),ts:Date.now(),...(!admin?{daily:Object.fromEntries(dailyFields.map(([key])=>[key,values[key]]))}:{})});
 save();
 toast('Registro guardado','check-circle');
 go(cur.name,{code:record.code},'fade');
}

const caseActions={
 adminSection:section=>{
  if(!isAdmin()||!adminTabs.some(([key])=>key===section)||section===adminSection)return;
  adminSection=section;
  go('admin',{},'tab');
 },
 adminSamples:()=>{
  if(!isAdmin())return;
  addFairCases();
  adminLists.followup={query:'',filter:'all',page:1};
  adminSection='followup';
  go('admin',{},'tab');
 },
 caseChat:code=>go(isAdmin()?'admin':'track',{code,chat:true}),
 caseChatBack:code=>go(isAdmin()?'admin':'track',{code},'fade'),
 adminCase:code=>go('admin',{code}),
 trackCase:code=>go('track',{code}),
 adminList:()=>go('admin',{},'fade'),
 trackList:()=>go('track',{},'fade'),
 caseStatus:value=>{
  const record=isAdmin()&&cur.name==='admin'&&caseByCode(cur.p.code);
  if(!record||!caseTransitions[record.status].some(([status])=>status===value))return;
  record.status=value;
  if(value==='delivered')record.deliveredAt=Date.now();
  record.events.push({kind:'status',text:caseStatuses[value],ts:Date.now()});
  save();
  go('admin',{code:record.code},'fade');
 },
 caseAdvance:value=>{
  const record=isAdmin()&&cur.name==='admin'&&caseByCode(cur.p.code);
  if(!record)return;
  advanceCase(record,Number(value));
  go('admin',{code:record.code},'fade');
 }
};
