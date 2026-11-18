/* Datos y lógica de compatibilidad de PetMatch */
const PETS=[
{id:'toby',n:'Toby',sp:'Perro',br:'Mestizo pomerania',age:'2 años',size:'Pequeño',space:0,time:0,energy:0,exp:0,kids:true,w:4.2,dist:1.2,tr:['Tranquilo','Cariñoso','Apto apartamento'],needs:'Poca actividad, compañía y una rutina estable.',story:'Llegó al refugio hace 6 meses. Le encanta dormir junto a la ventana y dar paseos cortos por el parque. Es sociable con niños y con otros perros.'},
{id:'mora',n:'Mora',sp:'Gato',br:'Criolla naranja',age:'1 año',size:'Pequeño',space:0,time:0,energy:1,exp:0,kids:false,w:3.6,dist:2.4,tr:['Curiosa','Independiente','Juguetona'],needs:'Rascadores, juguetes y un rincón tranquilo.',story:'Mora explora cada rincón de la casa. Es independiente pero busca mimos al final del día. Prefiere hogares sin niños muy pequeños.'},
{id:'luna',n:'Luna',sp:'Perro',br:'Beagle',age:'4 meses',size:'Mediano',space:1,time:1,energy:1,exp:1,kids:true,w:6.1,dist:3.8,tr:['Sociable','Curiosa','Necesita paseos'],needs:'Paseos diarios y estímulo mental.',story:'Cachorra muy cariñosa que sigue a todos por la casa. Necesita paseos diarios y entrenamiento básico; se adapta bien a un apartamento con balcón.'},
{id:'max',n:'Max',sp:'Perro',br:'Golden retriever',age:'5 meses',size:'Grande',space:2,time:2,energy:2,exp:1,kids:true,w:9.8,dist:2.9,tr:['Amigable','Activo','Le encanta el agua'],needs:'Mucho paseo, juego diario y espacio para correr.',story:'Max es un cachorro feliz que saluda a todo el mundo. Aprende rápido, pero necesita ejercicio todos los días y compañía durante el día.'},
{id:'cafe',n:'Café',sp:'Conejo',br:'Enano mestizo',age:'8 meses',size:'Pequeño',space:0,time:0,energy:1,exp:1,kids:false,w:1.4,dist:5.1,tr:['Tímido','Tranquilo','Dulce'],needs:'Heno fresco, espacio para saltar y paciencia.',story:'Café es tímido al principio, pero se vuelve muy dulce con la rutina. Necesita un hogar tranquilo y manos suaves.'},
{id:'nala',n:'Nala',sp:'Gato',br:'Gris europeo',age:'3 años',size:'Mediano',space:0,time:0,energy:0,exp:0,kids:true,w:4.4,dist:6.3,tr:['Tranquila','Cariñosa','Ideal primerizos'],needs:'Mimos, una ventana soleada y rutina.',story:'Nala es una gata serena que adora el sol. Es perfecta para quien adopta por primera vez y convive bien con niños.'},
{id:'rocky',n:'Rocky',sp:'Perro',br:'Mestizo',age:'3 meses',size:'Mediano',space:2,time:2,energy:2,exp:2,kids:true,w:5.3,dist:4.4,tr:['Juguetón','Mucha energía','Prefiere patio'],needs:'Mucho juego, patio y entrenamiento.',story:'Cachorro lleno de energía y curiosidad. Requiere tiempo de juego y entrenamiento; ideal para casas con patio y dueños con experiencia.'},
{id:'bruno',n:'Bruno',sp:'Perro',br:'Mestizo',age:'4 años',size:'Grande',space:1,time:1,energy:1,exp:1,kids:true,w:23,dist:7,tr:['Paciente','Sociable'],needs:'Paseos diarios y una rutina estable.',story:'Bruno disfruta los paseos tranquilos y aprende rápido con refuerzo positivo.'},
{id:'canela',n:'Canela',sp:'Gato',br:'Criolla tricolor',age:'2 años',size:'Pequeño',space:0,time:0,energy:0,exp:0,kids:true,w:3.9,dist:3,tr:['Curiosa','Cariñosa'],needs:'Rascadores, ventanas protegidas y lugares altos.',story:'Canela llegó a un hogar temporal y ahora disfruta dormir al sol y jugar con varitas.'},
{id:'nube',n:'Nube',sp:'Conejo',br:'Enano blanco',age:'2 años',size:'Pequeño',space:1,time:1,energy:0,exp:1,kids:false,w:1.7,dist:5,tr:['Sereno','Curioso'],needs:'Heno, un recinto amplio y supervisión al explorar.',story:'Nube se acerca por curiosidad después de acostumbrarse al espacio.'},
{id:'salchi',n:'Salchi',sp:'Perro',br:'Dachshund miniatura',age:'4 meses',size:'Pequeño',space:0,time:1,energy:1,exp:1,kids:true,w:2.9,dist:4,tr:['Juguetón','Afectuoso'],needs:'Juegos cortos, socialización y evitar saltos altos.',story:'Salchi es un cachorro curioso que pasa del juego a la siesta en minutos.'},
{id:'milo',n:'Milo',sp:'Gato',br:'Criollo gris',age:'3 meses',size:'Pequeño',space:0,time:1,energy:2,exp:0,kids:true,w:1.3,dist:8,tr:['Explorador','Activo'],needs:'Juego frecuente, refugios y ventanas protegidas.',story:'Milo fue encontrado muy pequeño y creció en un hogar temporal.'},
{id:'oliva',n:'Oliva',sp:'Perro',br:'Border collie',age:'5 años',size:'Mediano',space:2,time:2,energy:2,exp:2,kids:false,w:17,dist:6,tr:['Activa','Atenta'],needs:'Retos mentales, ejercicio y adaptación progresiva.',story:'Oliva llegó de una finca y disfruta buscar juguetes y aprender nuevas señales.'}
];
const PET_PROFILES = {
  toby:  {months:24, rescued:true,  sex:'Macho',  area:'Teusaquillo', source:'Refugio Huellas', vaccines:'Al día', sterilized:'Sí', company:'Niños y otros perros', routine:'Paseos cortos'},
  mora:  {months:12, rescued:true,  sex:'Hembra', area:'Chapinero', source:'Hogar temporal', vaccines:'Al día', sterilized:'Sí', company:'Prefiere un hogar sin niños pequeños', routine:'Juego dentro de casa'},
  luna:  {months:4,  rescued:false, sex:'Hembra', area:'Suba', source:'Criadero de demostración', vaccines:'Esquema inicial', sterilized:'Pendiente', company:'Convive con niños', routine:'Paseos y entrenamiento', price:900000},
  max:   {months:5,  rescued:false, sex:'Macho',  area:'Usaquén', source:'Criadero de demostración', vaccines:'Esquema en curso', sterilized:'Pendiente', company:'Convive con niños', routine:'Ejercicio y compañía diaria', price:1400000},
  cafe:  {months:8,  rescued:true,  sex:'Macho',  area:'Engativá', source:'Hogar temporal', vaccines:'Consultar ficha veterinaria', sterilized:'Por confirmar', company:'Prefiere un hogar tranquilo', routine:'Heno y espacio para saltar'},
  nala:  {months:36, rescued:true,  sex:'Hembra', area:'Fontibón', source:'Refugio Huellas', vaccines:'Al día', sterilized:'Sí', company:'Convive con niños', routine:'Juego suave y descanso'},
  rocky: {months:3,  rescued:false, sex:'Macho',  area:'Kennedy', source:'Criadero de demostración', vaccines:'Primera dosis', sterilized:'Pendiente', company:'Convive con niños', routine:'Juego activo y entrenamiento', price:420000},
  bruno: {months:48,rescued:true,sex:'Macho',area:'Bosa',source:'Refugio Huellas',vaccines:'Al día',sterilized:'Sí',company:'Convive con niños',routine:'Paseos tranquilos'},
  canela:{months:24,rescued:true,sex:'Hembra',area:'Barrios Unidos',source:'Hogar temporal',vaccines:'Al día',sterilized:'Sí',company:'Niños con supervisión',routine:'Juego en interiores'},
  nube:  {months:24,rescued:true,sex:'Macho',area:'Puente Aranda',source:'Hogar temporal',vaccines:'Consultar ficha veterinaria',sterilized:'Sí',company:'Prefiere un hogar tranquilo',routine:'Exploración supervisada'},
  salchi:{months:4,rescued:false,sex:'Macho',area:'Suba',source:'Criadero de demostración',vaccines:'Esquema en curso',sterilized:'Pendiente',company:'Convive con niños',routine:'Socialización y juego corto',price:1100000},
  milo:  {months:3,rescued:true,sex:'Macho',area:'Antonio Nariño',source:'Hogar temporal',vaccines:'Primera dosis',sterilized:'Pendiente',company:'Convive con niños',routine:'Juego y exploración'},
  oliva: {months:60,rescued:true,sex:'Hembra',area:'Usme',source:'Refugio Huellas',vaccines:'Al día',sterilized:'Sí',company:'Prefiere un hogar sin niños pequeños',routine:'Ejercicio y retos mentales'}
};

PETS.forEach(p => Object.assign(p, PET_PROFILES[p.id], {img:'img/'+p.id+'.jpg'}));
const acquisition = p => !p.rescued && p.months < 12 && p.price > 0 ? 'buy' : 'adopt';
const stageOf = p => p.months < 12 ? 'Cachorro' : 'Adulto';
const modeOf = p => acquisition(p) === 'buy' ? 'Compra' : 'Adopción gratuita';
const costOf = p => acquisition(p) === 'buy' ? money(p.price) + ' COP' : 'Gratis';
const pet=id=>PETS.find(p=>p.id===id);

const DIMS=[
 {k:'space',l:'Vivienda',q:'¿Dónde vivirá tu mascota?',hint:'Piensa en el espacio al que tendrá acceso todos los días.',opts:[
  ['Apartamento o estudio','Sin acceso exterior propio','building-2',0],
  ['Apartamento con balcón o terraza','Espacio exterior que se puede proteger','building',1],
  ['Casa sin patio','Las salidas se hacen fuera de casa','house',0],
  ['Casa con patio o jardín','Espacio exterior para moverse','trees',2],
  ['Finca o casa rural','Terreno exterior disponible','tractor',2],
  ['Vivienda compartida','Acceso a espacios comunes','users',1]
 ],bands:['Sin espacio exterior propio','Balcón, terraza o zona común','Patio, jardín o terreno']},
 {k:'time',l:'Tiempo',q:'¿Cuánto tiempo puedes dedicarle al día?',hint:'Incluye juego, paseos, alimentación y compañía.',opts:[
  ['Menos de 1 hora','Momentos cortos durante el día','clock',0],
  ['De 1 a menos de 2 horas','Puedo hacer varias pausas cortas','hourglass',0],
  ['De 2 a 4 horas','Tengo tiempo para una rutina diaria','calendar',1],
  ['Más de 4 horas','Puedo acompañarla gran parte del día','sun',2],
  ['Mi horario cambia','Depende de mis turnos, clases o viajes','calendar-days',null]
 ],bands:['Menos de 2 horas','De 2 a 4 horas','Más de 4 horas'],bandLabel:'¿Cuánto tiempo puedes asegurar la mayoría de los días?'},
 {k:'energy',l:'Energía',q:'¿Qué ritmo de vida llevas?',hint:'Elige el nivel de actividad que puedes mantener con tu mascota.',opts:[
  ['Casero','Prefiero planes tranquilos dentro de casa','moon',0],
  ['Caminatas cortas','Disfruto salir un rato a un ritmo suave','footprints',0],
  ['Activo a diario','Puedo hacer paseos o juegos todos los días','sun',1],
  ['Deporte y aire libre','Hago ejercicio intenso con frecuencia','zap',2],
  ['Mi actividad cambia','Alterno días tranquilos y muy activos','activity',null]
 ],bands:['Actividad suave','Actividad moderada','Actividad intensa'],bandLabel:'¿Qué nivel de actividad puedes mantener habitualmente?'},
 {k:'exp',l:'Experiencia',q:'¿Qué experiencia tienes cuidando mascotas?',hint:'Cuenta tanto el cuidado en casa como el apoyo a otras personas.',opts:[
  ['Sería mi primera mascota','Aún no he cuidado una','sparkles',0],
  ['He ayudado ocasionalmente','He cuidado mascotas de familiares o amigos','hand-heart',0],
  ['He sido responsable de una mascota','Me he encargado de su rutina y cuidados','paw-print',1],
  ['He cuidado varias mascotas','Tengo práctica con diferentes necesidades','heart-handshake',2],
  ['Tengo experiencia en rescate o entrenamiento','He acompañado procesos de adaptación o conducta','award',2]
 ],bands:['Poca o ninguna','Experiencia con cuidados diarios','Experiencia avanzada']}
];
const KIDS_QUESTION={k:'kids',l:'Convivencia con niños',q:'¿La mascota convivirá con niños?',hint:'Incluye a los niños que visitan el hogar con frecuencia.',opts:[
 ['Sí, viven en el hogar','Compartirán espacios a diario','baby',true],
 ['Sí, vienen de visita','Coincidirán con cierta frecuencia','calendar',true],
 ['No','No hay convivencia habitual','user',false]
 ],bands:['Sin convivencia habitual','Convivirá con niños'],bandLabel:'¿Convivirá con niños de forma habitual?'};
const dm=(a,b)=>Math.max(0,100-Math.abs(a-b)*45);
function match(p,u){
  const pr=u.prefs;
  const d=DIMS.map(x=>({k:x.k,l:x.l,v:dm(p[x.k],pr[x.k]),pet:p[x.k],you:pr[x.k]}));
  const kids=pr.kids&&!p.kids?30:100, w=[.3,.25,.2,.15];
  let t=d.reduce((s,x,i)=>s+x.v*w[i],0)+kids*.1; t=Math.max(35,Math.round(t));
  const R={space:'Encaja con tu espacio',time:'Tu tiempo le alcanza',energy:'Misma energía que tú',exp:'Acorde a tu experiencia'};
  const r=d.filter(x=>x.v>=90).map(x=>R[x.k]); if(pr.kids&&p.kids) r.push('Buena con niños');
  const warn=[]; if(pr.kids&&!p.kids) warn.push('Prefiere hogares sin niños pequeños');
  d.filter(x=>x.v<=10).forEach(x=>warn.push({space:'Necesita más espacio del que tienes',time:'Necesita más tiempo del que tienes',energy:'Su energía no coincide con la tuya',exp:'Requiere más experiencia'}[x.k]));
  return{t,d,r:r.slice(0,4),warn};
}
const money=n=>'$'+n.toLocaleString('es-CO');
const LEVEL={space:['Apartamento','Balcón','Patio'],time:['Poco','Medio','Mucho'],energy:['Tranquila','Moderada','Activa'],exp:['Primerizo','Intermedio','Experto']};
