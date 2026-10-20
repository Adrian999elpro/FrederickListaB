import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
mkdirSync('.preview',{recursive:true});
for(const name of ['js','css','img']) cpSync(name,`.preview/${name}`,{recursive:true});
for(const name of ['app.html','login.html']) cpSync(name,`.preview/${name}`);
writeFileSync('.preview/js/core.js',`
export const CONFIG={APP_NAME:'Consejo Estudiantil',APP_SHORT:'CONSEJO',LOGO_URL:'img/sello.png',TAGLINE:'Tu voz cuenta'};
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const access={id:'demo-admin',full_name:'Administración del Consejo Estudiantil',email:'admin@example.test',role:'admin',permissions:['users.read','users.manage','suggestions.read']};
export const can=(a,p)=>a.permissions.includes(p);
export const requireAccess=async()=>access;
export const getAccess=async()=>access;
export const logout=()=>{};
export const login=async()=>({});
export const withBusy=async(b,fn)=>{b.disabled=true;try{return await fn()}finally{b.disabled=false}};
export const toast=(text)=>{document.querySelector('#toasts').textContent=text};
export const showError=(e)=>toast(e.message||String(e));
export const fmtDate=(s)=>new Date(s).toLocaleString('es-EC');
export const mediaUrl=(s)=>s;
export const uploadMedia=async()=>null;
const courses=[['egb8','8vo de básica','basica'],['egb9','9no de básica','basica'],['egb10','10mo de básica','basica'],['bach1','1ro de bachillerato','bachillerato'],['bach2','2do de bachillerato','bachillerato'],['bach3','3ro de bachillerato','bachillerato']].map(([id,name,level],position)=>({id,name,level,position}));
const db={school_courses:courses,school_parallels:[{id:'A',name:'A'},{id:'B',name:'B'}],school_specialties:[{id:'spec-info',name:'Informática'},{id:'spec-auto',name:'Electromecánica automotriz'}],roles:[{id:'role-admin',name:'admin'},{id:'role-user',name:'usuario'}],site_settings:[],
profiles:[{id:'demo-admin',email:'administracion.consejo@example.test',full_name:access.full_name,course:'2do de bachillerato A',course_id:'bach2',parallel:'A',specialty_id:'spec-info',role_id:'role-admin'},
{id:'demo-student',email:'estudiante.nombre.apellido.muy.largo@example.test',full_name:'Estudiante de prueba con nombre y apellidos completos',course:'1ro de bachillerato B',course_id:'bach1',parallel:'B',specialty_id:'spec-auto',role_id:'role-user'},
{id:'demo-basic',email:'basica@example.test',full_name:'Estudiante de básica',course:'8vo de básica A',course_id:'egb8',parallel:'A',specialty_id:null,role_id:'role-user'}],
suggestions:[{id:'suggestion-a',author_name:'Estudiante de básica · 8vo de básica A',kind:'necesidad',body:'Nos gustaría contar con más actividades deportivas y espacios de participación para todo el curso.',course_id:'egb8',parallel:'A',specialty_id:null,created_at:'2026-10-20T10:00:00Z'},
{id:'suggestion-b',author_name:'Estudiante de bachillerato · 1ro de bachillerato B',kind:'sugerencia',body:'Proponemos una feria de proyectos de electromecánica automotriz.',course_id:'bach1',parallel:'B',specialty_id:'spec-auto',created_at:'2026-10-20T11:00:00Z'}]};
export const sb={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{},signUp:async()=>({data:{session:{user:{id:'demo-user'}}},error:null}),resetPasswordForEmail:async()=>({}),updateUser:async()=>({}),signOut:async()=>({})},
from(table){let filters=[],start=0,end=999,single=false,insert;
const q={select(){return q},order(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},or(text){let needle=text.split('%')[1].toLowerCase();filters.push(r=>(r.full_name+' '+r.email).toLowerCase().includes(needle));return q},range(a,b){start=a;end=b;return q},limit(n){end=n-1;return q},maybeSingle(){single=true;return q},single(){single=true;return q},insert(row){insert=row;return q},then(resolve,reject){try{if(insert){db[table].push({id:insert.id||crypto.randomUUID(),...insert});return Promise.resolve({error:null}).then(resolve,reject)}let rows=(db[table]||[]).filter(r=>filters.every(f=>f(r)));return Promise.resolve({data:single?rows[0]:rows.slice(start,end+1),count:rows.length,error:null}).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject)}}};return q},
rpc:async(name,p)=>{if(name==='public_registration_mode')return{data:'open'};if(name==='set_student_profile'){const u=db.profiles.find(x=>x.id===p.p_id);Object.assign(u,{full_name:p.p_full_name,course_id:p.p_course_id,parallel:p.p_parallel,specialty_id:p.p_specialty_id,role_id:p.p_role});}return{data:null,error:null}}};
`);
console.log('UI fixture ready at http://127.0.0.1:8766/.preview/app.html#users (synthetic data, no remote writes).');
