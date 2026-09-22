/* Meridian Clinic core app (ported from the original single-file build).
   Prototype only: data + session live in localStorage. Production needs a real backend. */
/* eslint-disable */


/* ---------------------------------------------------------- helpers ---- */
function uid(prefix){ return prefix+'-'+Math.random().toString(36).slice(2,7).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function money(n){ return '₹'+Number(n||0).toLocaleString('en-IN'); }
function fmtDate(d){ const dt=new Date(d+'T00:00:00'); return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function fmtDateShort(d){ const dt=new Date(d+'T00:00:00'); return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }
function todayStr(){ return new Date(2026,8,21).toISOString().slice(0,10); } // demo "today" = 21 Sep 2026
function addDays(dstr,n){ const dt=new Date(dstr+'T00:00:00'); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); }
function dayName(dstr){ return new Date(dstr+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'}); }
function initials(name){ return (name||'?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
const AVATAR_COLORS=['#0E7C7B','#E8734A','#6D5DD3','#2F9E68','#C9822E','#3E7CB1','#B4548C'];
function avatarColor(seed){ let h=0; for(const c of String(seed)) h=(h*31+c.charCodeAt(0))>>>0; return AVATAR_COLORS[h%AVATAR_COLORS.length]; }

function icon(name,size){
  size=size||18;
  const P={
    dashboard:'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z',
    patients:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
    doctors:'M9 3h6v4a3 3 0 0 1-6 0V3Zm3 9v3m-6 6c0-3.5 2.5-6 6-6s6 2.5 6 6',
    calendar:'M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
    records:'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6M9 9h2',
    rx:'M6 3h6a3 3 0 0 1 0 6H9v4M9 13l6 8M6 3v18',
    billing:'M4 5h16v14H4V5Zm3 4h10M7 12h6M7 15h4',
    bell:'M12 3a5 5 0 0 0-5 5v3.2c0 .7-.25 1.36-.7 1.9L5 15h14l-1.3-1.9a3 3 0 0 1-.7-1.9V8a5 5 0 0 0-5-5Zm-2.4 15a2.4 2.4 0 0 0 4.8 0',
    search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 16-5.6-5.6',
    plus:'M12 5v14M5 12h14',
    logout:'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9',
    chevronR:'M9 5l7 7-7 7',
    chevronL:'M15 5l-7 7 7 7',
    check:'M5 13l4 4L19 7',
    x:'M6 6l12 12M18 6 6 18',
    edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z',
    eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    pin:'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    phone:'M6.6 10.8a15.9 15.9 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.4.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.4 1 1 0 0 1-.25 1l-2.2 2.4Z',
    clock:'M12 7v5l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    trash:'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
    droplet:'M12 2s6 7.2 6 11.5a6 6 0 1 1-12 0C6 9.2 12 2 12 2Z',
    settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.3 3H9.7l-.3 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L9.7 21h4.6l.3-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z',
    stethoscope:'M5 3v6a4 4 0 0 0 8 0V3M9 13v2a5 5 0 0 0 10 0v-2m-2 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    money:'M3 7h18v10H3V7Zm9 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 9v6M18 9v6',
    file:'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5',
    users:'M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 0a3.5 3.5 0 0 0 0-7',
    menu:'M4 7h16M4 12h16M4 17h16',
    heart:'M12 21s-7.5-4.6-10-9.3C.4 8.2 2 4 6 4c2.2 0 3.8 1.3 6 4 2.2-2.7 3.8-4 6-4 4 0 5.6 4.2 4 7.7-2.5 4.7-10 9.3-10 9.3Z'
  };
  const d=P[name]||P.dashboard;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d.split('M').filter(Boolean).map(p=>'<path d="M'+p+'"/>').join('')}</svg>`;
}

/* ------------------------------------------------------ seed data ------ */
function seed(){
  const doctors=[
    {id:'d1',name:'Dr. Priya Sharma',specialization:'Cardiology',qualification:'MBBS, MD (Cardiology)',experience:8,phone:'98765 00001',email:'priya.sharma@meridian.demo',fee:700,days:['Mon','Tue','Wed','Thu','Fri'],start:'10:00',end:'14:00',slot:30},
    {id:'d2',name:'Dr. Arjun Rao',specialization:'Dermatology',qualification:'MBBS, DVD',experience:6,phone:'98765 00002',email:'arjun.rao@meridian.demo',fee:500,days:['Mon','Wed','Fri'],start:'11:00',end:'15:00',slot:20},
    {id:'d3',name:'Dr. Kavitha Reddy',specialization:'Pediatrics',qualification:'MBBS, MD (Peds)',experience:10,phone:'98765 00003',email:'kavitha.reddy@meridian.demo',fee:600,days:['Tue','Thu','Sat'],start:'09:00',end:'13:00',slot:20},
    {id:'d4',name:'Dr. Suresh Kumar',specialization:'Orthopedics',qualification:'MBBS, MS (Ortho)',experience:12,phone:'98765 00004',email:'suresh.kumar@meridian.demo',fee:800,days:['Mon','Tue','Thu'],start:'15:00',end:'19:00',slot:30},
    {id:'d5',name:'Dr. Meena Iyer',specialization:'General Medicine',qualification:'MBBS',experience:5,phone:'98765 00005',email:'meena.iyer@meridian.demo',fee:400,days:['Mon','Tue','Wed','Thu','Fri','Sat'],start:'09:00',end:'12:00',slot:15}
  ];
  const patients=[
    {id:'p1',name:'Rahul Verma',age:29,gender:'Male',phone:'99988 87771',email:'rahul.verma@mail.demo',address:'Banjara Hills, Hyderabad',bloodGroup:'O+',emergencyName:'Sunita Verma',emergencyPhone:'99988 87772'},
    {id:'p2',name:'Ananya Singh',age:34,gender:'Female',phone:'99988 87773',email:'ananya.singh@mail.demo',address:'Gachibowli, Hyderabad',bloodGroup:'A+',emergencyName:'Rohit Singh',emergencyPhone:'99988 87774'},
    {id:'p3',name:'Vikram Patel',age:45,gender:'Male',phone:'99988 87775',email:'vikram.patel@mail.demo',address:'Kondapur, Hyderabad',bloodGroup:'B+',emergencyName:'Meera Patel',emergencyPhone:'99988 87776'},
    {id:'p4',name:'Sneha Nair',age:27,gender:'Female',phone:'99988 87777',email:'sneha.nair@mail.demo',address:'Madhapur, Hyderabad',bloodGroup:'AB+',emergencyName:'Arun Nair',emergencyPhone:'99988 87778'},
    {id:'p5',name:'Karthik Menon',age:52,gender:'Male',phone:'99988 87779',email:'karthik.menon@mail.demo',address:'Jubilee Hills, Hyderabad',bloodGroup:'O-',emergencyName:'Lakshmi Menon',emergencyPhone:'99988 87780'},
    {id:'p6',name:'Divya Joshi',age:31,gender:'Female',phone:'99988 87781',email:'divya.joshi@mail.demo',address:'Kukatpally, Hyderabad',bloodGroup:'A-',emergencyName:'Sanjay Joshi',emergencyPhone:'99988 87782'},
    {id:'p7',name:'Farhan Sheikh',age:39,gender:'Male',phone:'99988 87783',email:'farhan.sheikh@mail.demo',address:'Secunderabad',bloodGroup:'B-',emergencyName:'Ayesha Sheikh',emergencyPhone:'99988 87784'},
    {id:'p8',name:'Priyanka Das',age:24,gender:'Female',phone:'99988 87785',email:'priyanka.das@mail.demo',address:'Begumpet, Hyderabad',bloodGroup:'O+',emergencyName:'Tapan Das',emergencyPhone:'99988 87786'}
  ];
  const today=todayStr();
  const appointments=[
    {id:'APT-1001',patientId:'p2',doctorId:'d1',date:addDays(today,-6),time:'10:00',status:'Completed'},
    {id:'APT-1002',patientId:'p3',doctorId:'d4',date:addDays(today,-3),time:'15:30',status:'Completed'},
    {id:'APT-1003',patientId:'p1',doctorId:'d1',date:addDays(today,-14),time:'11:00',status:'Completed'},
    {id:'APT-1010',patientId:'p1',doctorId:'d1',date:today,time:'10:30',status:'Confirmed'},
    {id:'APT-1011',patientId:'p4',doctorId:'d1',date:today,time:'11:00',status:'Confirmed'},
    {id:'APT-1012',patientId:'p5',doctorId:'d2',date:today,time:'11:20',status:'Confirmed'},
    {id:'APT-1013',patientId:'p6',doctorId:'d5',date:today,time:'09:15',status:'Completed'},
    {id:'APT-1014',patientId:'p7',doctorId:'d4',date:today,time:'15:30',status:'Confirmed'},
    {id:'APT-1020',patientId:'p8',doctorId:'d3',date:addDays(today,1),time:'09:20',status:'Pending'},
    {id:'APT-1021',patientId:'p2',doctorId:'d2',date:addDays(today,2),time:'11:40',status:'Confirmed'},
    {id:'APT-1022',patientId:'p1',doctorId:'d5',date:addDays(today,5),time:'09:30',status:'Pending'}
  ];
  const medicalRecords=[
    {id:'MR-501',appointmentId:'APT-1001',patientId:'p2',doctorId:'d1',date:addDays(today,-6),chiefComplaint:'Occasional chest tightness on exertion',symptoms:'Mild breathlessness, fatigue by evening',diagnosis:'Stable angina, early stage',notes:'Advised lifestyle changes, follow-up ECG in 4 weeks.',bp:'128/84',temp:'98.2',weight:'71'},
    {id:'MR-502',appointmentId:'APT-1002',patientId:'p3',doctorId:'d4',date:addDays(today,-3),chiefComplaint:'Lower back pain, 2 weeks',symptoms:'Stiffness in the morning, pain radiating to left leg',diagnosis:'Lumbar muscle strain',notes:'Recommend physiotherapy, avoid heavy lifting for 3 weeks.',bp:'118/76',temp:'98.6',weight:'82'},
    {id:'MR-503',appointmentId:'APT-1003',patientId:'p1',doctorId:'d1',date:addDays(today,-14),chiefComplaint:'Routine cardiac check-up',symptoms:'None reported',diagnosis:'Normal sinus rhythm, healthy',notes:'Continue current exercise routine, review in 6 months.',bp:'118/78',temp:'98.4',weight:'68'},
    {id:'MR-504',appointmentId:'APT-1013',patientId:'p6',doctorId:'d5',date:today,chiefComplaint:'Fever and sore throat for 2 days',symptoms:'Fever 101°F, throat pain, mild cough',diagnosis:'Viral pharyngitis',notes:'Rest, fluids and symptomatic treatment. Review if fever persists beyond 3 days.',bp:'112/74',temp:'101.2',weight:'59'}
  ];
  const prescriptions=[
    {id:'RX-701',medicalRecordId:'MR-501',patientId:'p2',doctorId:'d1',date:addDays(today,-6),diagnosis:'Stable angina, early stage',items:[
      {medicine:'Atorvastatin 10 mg',dosage:'1 tablet',frequency:'Once at night',duration:'30 days',instructions:'After food'},
      {medicine:'Aspirin 75 mg',dosage:'1 tablet',frequency:'Once daily',duration:'30 days',instructions:'After breakfast'}
    ]},
    {id:'RX-702',medicalRecordId:'MR-502',patientId:'p3',doctorId:'d4',date:addDays(today,-3),diagnosis:'Lumbar muscle strain',items:[
      {medicine:'Aceclofenac 100 mg',dosage:'1 tablet',frequency:'Twice daily',duration:'5 days',instructions:'After food'},
      {medicine:'Thiocolchicoside 4 mg',dosage:'1 tablet',frequency:'Twice daily',duration:'5 days',instructions:'After food'}
    ]},
    {id:'RX-703',medicalRecordId:'MR-504',patientId:'p6',doctorId:'d5',date:today,diagnosis:'Viral pharyngitis',items:[
      {medicine:'Paracetamol 500 mg',dosage:'1 tablet',frequency:'After food, if fever',duration:'3 days',instructions:'Max 3 per day'},
      {medicine:'Cetirizine 10 mg',dosage:'1 tablet',frequency:'Night',duration:'5 days',instructions:'May cause drowsiness'}
    ]}
  ];
  const invoices=[
    {id:'INV-901',appointmentId:'APT-1001',patientId:'p2',date:addDays(today,-6),items:[{desc:'Consultation — Cardiology',amount:700},{desc:'ECG',amount:350},{desc:'Medicines',amount:280}],discount:50,status:'Paid'},
    {id:'INV-902',appointmentId:'APT-1002',patientId:'p3',date:addDays(today,-3),items:[{desc:'Consultation — Orthopedics',amount:800},{desc:'Medicines',amount:210}],discount:0,status:'Paid'},
    {id:'INV-903',appointmentId:'APT-1003',patientId:'p1',date:addDays(today,-14),items:[{desc:'Consultation — Cardiology',amount:700}],discount:0,status:'Paid'},
    {id:'INV-904',appointmentId:'APT-1013',patientId:'p6',date:today,items:[{desc:'Consultation — General Medicine',amount:400},{desc:'Medicines',amount:150}],discount:0,status:'Pending'}
  ];
  const users=[
    {id:'u1',email:'admin@meridian.demo',password:'admin123',role:'admin',linkedId:null,name:'Suja Menon'},
    {id:'u2',email:'doctor@meridian.demo',password:'doctor123',role:'doctor',linkedId:'d1',name:'Dr. Priya Sharma'},
    {id:'u3',email:'patient@meridian.demo',password:'patient123',role:'patient',linkedId:'p1',name:'Rahul Verma'}
  ];
  return {doctors,patients,appointments,medicalRecords,prescriptions,invoices,users,notifications:[
    {id:'n1',text:'Appointment APT-1014 confirmed for today, 3:30 PM',read:false},
    {id:'n2',text:'New prescription RX-703 generated for Divya Joshi',read:false},
    {id:'n3',text:'Invoice INV-904 pending payment',read:true}
  ]};
}

/* ------------------------------------------------------------- store ---- */
const Store={
  data:null,
  load(){
    try{
      const raw=localStorage.getItem('meridian_clinic_db_v1');
      this.data = raw? JSON.parse(raw) : seed();
    }catch(e){ this.data = seed(); }
    if(!this.data || !this.data.doctors) this.data = seed();
  },
  save(){
    try{ localStorage.setItem('meridian_clinic_db_v1', JSON.stringify(this.data)); }catch(e){ /* storage unavailable, continue in-memory */ }
  },
  reset(){ this.data=seed(); this.save(); }
};

/* ------------------------------------------------------------ session --- */
const Session={
  get(){
    try{ return JSON.parse(localStorage.getItem('meridian_clinic_session_v1')||'null'); }catch(e){ return null; }
  },
  set(s){ try{ localStorage.setItem('meridian_clinic_session_v1', JSON.stringify(s)); }catch(e){} },
  clear(){ try{ localStorage.removeItem('meridian_clinic_session_v1'); }catch(e){} }
};

/* =========================================================== App ======= */
const App = {
  toastTimer:null,

  init(){
    Store.load();
    window.addEventListener('hashchange', ()=>this.render());
    if(!location.hash) location.hash='#/login';
    this.render();
  },

  toast(msg){
    let el=document.getElementById('toast');
    if(el) el.remove();
    el=document.createElement('div');
    el.id='toast'; el.className='toast'; el.textContent=msg;
    document.body.appendChild(el);
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>el.remove(),2600);
  },

  session(){ return Session.get(); },
  db(){ return Store.data; },

  logout(){ Session.clear(); location.hash='#/login'; this.render(); },

  quickLogin(role){
    const u = Store.data.users.find(x=>x.role===role);
    Session.set({userId:u.id});
    location.hash = '#/'+role+'/dashboard';
    this.render();
    this.toast('Signed in as '+u.name);
  },

  doLogin(e){
    e.preventDefault();
    const f=e.target;
    const email=f.email.value.trim().toLowerCase();
    const pass=f.password.value;
    const u=Store.data.users.find(x=>x.email.toLowerCase()===email && x.password===pass);
    if(!u){ this.toast('Invalid email or password'); return false; }
    Session.set({userId:u.id});
    location.hash='#/'+u.role+'/dashboard';
    this.render();
    return false;
  },

  doRegister(e){
    e.preventDefault();
    const f=e.target;
    const name=f.name.value.trim(), email=f.email.value.trim(), phone=f.phone.value.trim(), pass=f.password.value;
    if(!name||!email||!pass){ this.toast('Please fill all required fields'); return false; }
    if(Store.data.users.some(u=>u.email.toLowerCase()===email.toLowerCase())){ this.toast('An account already exists with this email'); return false; }
    const pid=uid('p');
    Store.data.patients.push({id:pid,name,age:f.age.value||'—',gender:f.gender.value||'—',phone,email,address:f.address.value||'—',bloodGroup:f.bloodGroup.value||'—',emergencyName:'—',emergencyPhone:'—'});
    const uidNew=uid('u');
    Store.data.users.push({id:uidNew,email,password:pass,role:'patient',linkedId:pid,name});
    Store.save();
    Session.set({userId:uidNew});
    location.hash='#/patient/dashboard';
    this.render();
    this.toast('Account created — welcome, '+name.split(' ')[0]+'!');
    return false;
  },

  currentUser(){
    const s=Session.get(); if(!s) return null;
    return Store.data.users.find(u=>u.id===s.userId)||null;
  },

  navigate(hash){ location.hash=hash; },

  /* ---------------------------------------------------------- render --- */
  render(){
    const app=document.getElementById('app');
    const hash=location.hash||'#/login';
    const user=this.currentUser();

    if(!user){
      if(hash.startsWith('#/register')) { app.innerHTML=this.viewRegister(); return; }
      app.innerHTML=this.viewLogin();
      return;
    }
    if(hash==='#/login'||hash==='#/'||hash.startsWith('#/register')){
      location.hash='#/'+user.role+'/dashboard'; return;
    }
    const parts=hash.replace('#/','').split('/');
    const section=parts[0];
    if(section!==user.role){ location.hash='#/'+user.role+'/dashboard'; return; }

    let content='', active=parts[1]||'dashboard';
    try{
      if(user.role==='admin') content=this.renderAdmin(parts,user);
      else if(user.role==='doctor') content=this.renderDoctor(parts,user);
      else content=this.renderPatient(parts,user);
    }catch(err){
      content='<div class="p-10 text-center"><p class="font-display text-lg mb-2">Something needs a moment</p><p style="color:var(--muted)">'+esc(err.message)+'</p></div>';
    }
    app.innerHTML = this.shell(content, user, active);
    window.scrollTo(0,0);
  },

  /* ----------------------------------------------------------- shell --- */
  navItemsFor(role){
    if(role==='admin') return [
      ['dashboard','Dashboard','dashboard'],
      ['patients','Patients','patients'],
      ['doctors','Doctors','doctors'],
      ['appointments','Appointments','calendar'],
      ['billing','Billing','billing']
    ];
    if(role==='doctor') return [
      ['dashboard','Dashboard','dashboard'],
      ['appointments','Appointments','calendar'],
      ['prescriptions','Prescriptions','rx']
    ];
    return [
      ['dashboard','Dashboard','dashboard'],
      ['doctors','Find a doctor','doctors'],
      ['appointments','My appointments','calendar'],
      ['records','Medical records','records'],
      ['prescriptions','Prescriptions','rx'],
      ['bills','Bills','billing'],
      ['profile','Profile','patients']
    ];
  },

  shell(content,user,active){
    const nav=this.navItemsFor(user.role);
    const roleLabel = user.role==='admin'?'Administrator':user.role==='doctor'?'Doctor':'Patient';
    const doctorRec = user.role==='doctor' ? Store.data.doctors.find(d=>d.id===user.linkedId) : null;
    const unread = Store.data.notifications.filter(n=>!n.read).length;
    return `
    <div style="min-height:100%;">
      <div class="mobile-only" style="position:sticky;top:0;z-index:40;background:var(--sidebar);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;padding-top:calc(12px + env(safe-area-inset-top,0px));">
        <div style="display:flex;align-items:center;gap:9px;">
          <span style="font-size:20px;">🏥</span>
          <span class="font-display" style="font-weight:700;font-size:15px;">Meridian</span>
        </div>
        <button class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.3);" onclick="App.toggleMobileNav()">${icon('menu',18)}</button>
      </div>
      <div id="mobileNav" style="display:none;" class="mobile-only"></div>
      <div style="display:flex;align-items:flex-start;">
        <aside class="sidebar desktop-only" style="width:236px;flex-shrink:0;min-height:100vh;padding:20px 14px;position:sticky;top:0;">
          <div style="display:flex;align-items:center;gap:10px;padding:6px 8px 22px;">
            <span style="font-size:24px;">🏥</span>
            <div>
              <div class="font-display" style="font-weight:700;font-size:16px;color:#fff;">Meridian</div>
              <div style="font-size:11px;color:#8FADA7;">Clinic Management</div>
            </div>
          </div>
          <nav style="display:flex;flex-direction:column;gap:3px;">
            ${nav.map(([key,label,ic])=>`<div class="navlink ${active===key?'active':''}" onclick="App.navigate('#/${user.role}/${key}')">${icon(ic,17)}<span>${esc(label)}</span></div>`).join('')}
          </nav>
          <div style="margin-top:28px;padding-top:16px;border-top:1px solid var(--sidebar-hover);">
            <div class="navlink" onclick="App.logout()">${icon('logout',17)}<span>Sign out</span></div>
          </div>
        </aside>
        <div style="flex:1;min-width:0;">
          <header class="desktop-only card" style="border-radius:0;border-top:none;border-left:none;border-right:none;position:sticky;top:0;z-index:30;background:var(--surface);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 24px;">
              <div>
                <div style="font-size:12px;color:var(--muted);">${esc(roleLabel)}${doctorRec?' · '+esc(doctorRec.specialization):''}</div>
                <div class="font-display" style="font-weight:700;font-size:15px;">${this.pageTitle(active,user.role)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="position:relative;cursor:pointer;" onclick="App.toast('${unread} new notification${unread===1?'':'s'}: '+${JSON.stringify((Store.data.notifications.find(n=>!n.read)||{}).text||'You are all caught up')})" title="Notifications">
                  ${icon('bell',20)}
                  ${unread>0?`<span style="position:absolute;top:-4px;right:-5px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;border-radius:99px;padding:1px 5px;">${unread}</span>`:''}
                </div>
                <div style="display:flex;align-items:center;gap:9px;">
                  <div class="avatar" style="background:${avatarColor(user.name)};width:32px;height:32px;font-size:12px;">${initials(user.name)}</div>
                  <div style="font-size:13px;font-weight:600;">${esc(user.name)}</div>
                </div>
              </div>
            </div>
          </header>
          <main style="padding:20px;max-width:1280px;margin:0 auto;">
            ${content}
          </main>
        </div>
      </div>
    </div>`;
  },

  toggleMobileNav(){
    const el=document.getElementById('mobileNav');
    const user=this.currentUser(); if(!user) return;
    if(el.style.display==='none'){
      const nav=this.navItemsFor(user.role);
      el.innerHTML=`<div style="background:var(--sidebar);padding:8px 14px 14px;">
        ${nav.map(([key,label,ic])=>`<div class="navlink" onclick="App.navigate('#/${user.role}/${key}');App.toggleMobileNav();" style="padding:12px 10px;">${icon(ic,17)}<span>${esc(label)}</span></div>`).join('')}
        <div class="navlink" onclick="App.logout()" style="padding:12px 10px;">${icon('logout',17)}<span>Sign out</span></div>
      </div>`;
      el.style.display='block';
    } else { el.style.display='none'; el.innerHTML=''; }
  },

  pageTitle(active,role){
    const map={dashboard:'Dashboard',patients:role==='patient'?'Find a doctor':'Patients',doctors:role==='patient'?'Find a doctor':'Doctors',
      appointments:'Appointments',billing:'Billing',records:'Medical records',prescriptions:'Prescriptions',bills:'Bills',profile:'My profile'};
    return map[active]||'Dashboard';
  },

  /* =====================================================  LOGIN / REGISTER */
  viewLogin(){
    return `
    <div style="min-height:100vh;display:flex;">
      <div class="desktop-only" style="flex:1;background:linear-gradient(160deg,var(--sidebar),#0A3D3A);color:#fff;padding:56px;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:28px;">🏥</span>
          <span class="font-display" style="font-weight:700;font-size:19px;">Meridian Clinic</span>
        </div>
        <div style="max-width:420px;">
          <div class="font-display" style="font-size:34px;font-weight:700;line-height:1.25;margin-bottom:16px;">Care, coordinated — from the front desk to the prescription pad.</div>
          <p style="color:#B9D0CB;font-size:14.5px;line-height:1.6;">One workspace for admins, doctors and patients: bookings, consultations, records and billing, all in sync.</p>
          <div style="display:flex;gap:22px;margin-top:32px;">
            <div><div class="font-display" style="font-size:22px;font-weight:700;">1,248</div><div style="color:#8FADA7;font-size:12.5px;">patients cared for</div></div>
            <div><div class="font-display" style="font-size:22px;font-weight:700;">42</div><div style="color:#8FADA7;font-size:12.5px;">specialists</div></div>
            <div><div class="font-display" style="font-size:22px;font-weight:700;">36</div><div style="color:#8FADA7;font-size:12.5px;">visits today</div></div>
          </div>
        </div>
        <div style="color:#7FA39C;font-size:12px;">Runtime Rabels — Hackathon build</div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:28px;">
        <div style="width:100%;max-width:380px;">
          <div class="mobile-only" style="text-align:center;margin-bottom:22px;">
            <span style="font-size:30px;">🏥</span>
            <div class="font-display" style="font-weight:700;font-size:18px;">Meridian Clinic</div>
          </div>
          <h1 class="font-display" style="font-size:22px;font-weight:700;margin-bottom:4px;">Sign in</h1>
          <p style="color:var(--muted);font-size:13.5px;margin-bottom:22px;">Welcome back. Choose your workspace below.</p>
          <form onsubmit="return App.doLogin(event)" style="display:flex;flex-direction:column;gap:13px;">
            <div><label class="field-label">Email</label><input class="input" name="email" type="email" placeholder="you@meridian.demo" required></div>
            <div><label class="field-label">Password</label><input class="input" name="password" type="password" placeholder="••••••••" required></div>
            <button class="btn btn-primary" type="submit" style="width:100%;margin-top:4px;">Sign in</button>
          </form>
          <div style="display:flex;align-items:center;gap:10px;margin:20px 0;color:var(--muted);font-size:12px;">
            <div style="flex:1;height:1px;background:var(--border);"></div>OR TRY A DEMO ACCOUNT<div style="flex:1;height:1px;background:var(--border);"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="btn btn-ghost" style="justify-content:space-between;" onclick="App.quickLogin('admin')"><span style="display:flex;align-items:center;gap:8px;">${icon('settings',16)}Continue as Admin</span>${icon('chevronR',15)}</button>
            <button class="btn btn-ghost" style="justify-content:space-between;" onclick="App.quickLogin('doctor')"><span style="display:flex;align-items:center;gap:8px;">${icon('stethoscope',16)}Continue as Doctor</span>${icon('chevronR',15)}</button>
            <button class="btn btn-ghost" style="justify-content:space-between;" onclick="App.quickLogin('patient')"><span style="display:flex;align-items:center;gap:8px;">${icon('heart',16)}Continue as Patient</span>${icon('chevronR',15)}</button>
          </div>
          <p style="text-align:center;font-size:13px;color:var(--muted);margin-top:22px;">New patient? <a href="#/register" style="color:var(--primary);font-weight:600;">Create an account</a></p>
        </div>
      </div>
    </div>`;
  },

  viewRegister(){
    return `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px;background:var(--bg);">
      <div class="card" style="width:100%;max-width:460px;padding:30px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:28px;">🏥</span>
          <h1 class="font-display" style="font-size:20px;font-weight:700;margin-top:6px;">Create your patient account</h1>
          <p style="color:var(--muted);font-size:13px;">Book appointments and track your care in one place.</p>
        </div>
        <form onsubmit="return App.doRegister(event)" style="display:flex;flex-direction:column;gap:12px;">
          <div><label class="field-label">Full name *</label><input class="input" name="name" required placeholder="Your name"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><label class="field-label">Age</label><input class="input" name="age" type="number" min="0" placeholder="29"></div>
            <div><label class="field-label">Gender</label><select class="input" name="gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
          </div>
          <div><label class="field-label">Email *</label><input class="input" name="email" type="email" required placeholder="you@email.com"></div>
          <div><label class="field-label">Phone</label><input class="input" name="phone" placeholder="99988 87771"></div>
          <div><label class="field-label">Address</label><input class="input" name="address" placeholder="City, area"></div>
          <div><label class="field-label">Blood group</label><select class="input" name="bloodGroup"><option value="">Select</option>${['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(b=>`<option>${b}</option>`).join('')}</select></div>
          <div><label class="field-label">Password *</label><input class="input" name="password" type="password" required placeholder="Create a password"></div>
          <button class="btn btn-primary" type="submit" style="margin-top:6px;">Create account</button>
        </form>
        <p style="text-align:center;font-size:13px;color:var(--muted);margin-top:16px;">Already have an account? <a href="#/login" style="color:var(--primary);font-weight:600;">Sign in</a></p>
      </div>
    </div>`;
  },

  /* small reusable pieces */
  statCard(label,value,ic,tint){
    return `<div class="stat-card" style="border-left-color:${tint||'var(--primary)'};">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:12.5px;color:var(--muted);font-weight:500;">${esc(label)}</div>
        <div style="color:${tint||'var(--primary)'};">${icon(ic,18)}</div>
      </div>
      <div class="font-display" style="font-size:26px;font-weight:700;margin-top:6px;">${value}</div>
    </div>`;
  },
  statusBadge(status){
    const map={Confirmed:'badge-success',Pending:'badge-warning',Cancelled:'badge-danger',Completed:'badge-muted',Paid:'badge-success'};
    return `<span class="badge ${map[status]||'badge-muted'}">${esc(status)}</span>`;
  },
  emptyState(text,sub){
    return `<div style="text-align:center;padding:48px 20px;color:var(--muted);">
      <div style="font-size:30px;margin-bottom:8px;">🗂️</div>
      <div class="font-display" style="font-weight:600;color:var(--ink);font-size:15px;">${esc(text)}</div>
      ${sub?`<div style="font-size:13px;margin-top:4px;">${esc(sub)}</div>`:''}
    </div>`;
  },
  patientById(id){ return Store.data.patients.find(p=>p.id===id); },
  doctorById(id){ return Store.data.doctors.find(d=>d.id===id); },

  /* =========================================================  ADMIN  === */
  renderAdmin(parts,user){
    const page=parts[1]||'dashboard';
    if(page==='dashboard') return this.adminDashboard();
    if(page==='patients') return parts[2]? this.patientProfile(parts[2],'admin') : this.adminPatients();
    if(page==='doctors') return parts[2]? this.doctorProfile(parts[2],'admin') : this.adminDoctors();
    if(page==='appointments') return this.adminAppointments();
    if(page==='billing') return parts[2]? this.invoiceView(parts[2],'admin') : this.adminBilling();
    return this.adminDashboard();
  },

  adminDashboard(){
    const db=Store.data, today=todayStr();
    const todays=db.appointments.filter(a=>a.date===today);
    const revenue=db.invoices.filter(i=>i.date===today || (i.date>=addDays(today,-30))).reduce((s,i)=>s+i.items.reduce((a,x)=>a+x.amount,0)-i.discount,0);
    const pending=db.appointments.filter(a=>a.status==='Pending').length;
    const recentPatients=[...db.patients].slice(-5).reverse();
    const recentPayments=[...db.invoices].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

    return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;" class="scrollx">
      ${this.statCard('Total patients',db.patients.length,'patients','var(--primary)')}
      ${this.statCard('Total doctors',db.doctors.length,'doctors','#6D5DD3')}
      ${this.statCard("Today's appointments",todays.length,'calendar','var(--accent)')}
      ${this.statCard('Revenue (30 days)',money(revenue),'money','var(--success)')}
    </div>

    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-top:18px;align-items:start;">
      <div class="card">
        <div style="padding:16px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div class="font-display" style="font-weight:700;font-size:14.5px;">Today's appointments</div>
          <a href="#/admin/appointments" style="font-size:12.5px;color:var(--primary);font-weight:600;">View all</a>
        </div>
        <div class="scrollx">
        <table>
          <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead>
          <tbody>
          ${todays.length? todays.sort((a,b)=>a.time.localeCompare(b.time)).map(a=>{
            const p=this.patientById(a.patientId), d=this.doctorById(a.doctorId);
            return `<tr><td>${esc(a.time)}</td><td>${esc(p?p.name:'—')}</td><td>${esc(d?d.name:'—')}</td><td>${this.statusBadge(a.status)}</td></tr>`;
          }).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px;">No appointments scheduled for today</td></tr>`}
          </tbody>
        </table>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="card" style="padding:16px 18px;">
          <div class="font-display" style="font-weight:700;font-size:14.5px;margin-bottom:10px;">Overview</div>
          <div style="display:flex;justify-content:space-between;font-size:13.5px;padding:7px 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted);">Pending appointments</span><b>${pending}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:13.5px;padding:7px 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted);">Confirmed today</span><b>${todays.filter(a=>a.status==='Confirmed').length}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:13.5px;padding:7px 0;"><span style="color:var(--muted);">Completed today</span><b>${todays.filter(a=>a.status==='Completed').length}</b></div>
        </div>
        <div class="card" style="padding:16px 18px;">
          <div class="font-display" style="font-weight:700;font-size:14.5px;margin-bottom:10px;">Recent patients</div>
          ${recentPatients.map(p=>`<div style="display:flex;align-items:center;gap:9px;padding:6px 0;cursor:pointer;" onclick="App.navigate('#/admin/patients/${p.id}')">
            <div class="avatar" style="background:${avatarColor(p.name)};width:28px;height:28px;font-size:11px;">${initials(p.name)}</div>
            <div style="font-size:13px;">${esc(p.name)}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div style="padding:16px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <div class="font-display" style="font-weight:700;font-size:14.5px;">Recent payments</div>
        <a href="#/admin/billing" style="font-size:12.5px;color:var(--primary);font-weight:600;">View billing</a>
      </div>
      <div class="scrollx">
      <table>
        <thead><tr><th>Invoice</th><th>Patient</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
        ${recentPayments.map(inv=>{
          const p=this.patientById(inv.patientId); const total=inv.items.reduce((s,x)=>s+x.amount,0)-inv.discount;
          return `<tr style="cursor:pointer;" onclick="App.navigate('#/admin/billing/${inv.id}')"><td>${esc(inv.id)}</td><td>${esc(p?p.name:'—')}</td><td>${fmtDateShort(inv.date)}</td><td>${money(total)}</td><td>${this.statusBadge(inv.status)}</td></tr>`;
        }).join('')}
        </tbody>
      </table>
      </div>
    </div>`;
  },

  adminPatients(){
    const db=Store.data;
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="position:relative;max-width:320px;flex:1;min-width:220px;">
        <span style="position:absolute;left:11px;top:10px;color:var(--muted);">${icon('search',16)}</span>
        <input class="input" style="padding-left:34px;" id="patientSearch" placeholder="Search patients by name or phone" oninput="App.filterPatients(this.value)">
      </div>
      <button class="btn btn-primary" onclick="App.openModal('addPatient')">${icon('plus',16)}Add patient</button>
    </div>
    <div class="card">
      <div class="scrollx">
      <table id="patientTable">
        <thead><tr><th>Name</th><th>Age/Gender</th><th>Phone</th><th>Blood group</th><th></th></tr></thead>
        <tbody>${this.patientRows(db.patients)}</tbody>
      </table>
      </div>
    </div>`;
  },
  patientRows(list){
    if(!list.length) return `<tr><td colspan="5">${this.emptyState('No patients found')}</td></tr>`;
    return list.map(p=>`<tr>
      <td><div style="display:flex;align-items:center;gap:9px;"><div class="avatar" style="background:${avatarColor(p.name)};width:30px;height:30px;font-size:11.5px;">${initials(p.name)}</div><div><div style="font-weight:600;">${esc(p.name)}</div><div style="font-size:11.5px;color:var(--muted);">${esc(p.email)}</div></div></div></td>
      <td>${esc(p.age)} · ${esc(p.gender)}</td>
      <td>${esc(p.phone)}</td>
      <td><span class="badge badge-muted">${esc(p.bloodGroup)}</span></td>
      <td style="text-align:right;"><button class="btn btn-ghost btn-sm" onclick="App.navigate('#/admin/patients/${p.id}')">${icon('eye',14)}View</button></td>
    </tr>`).join('');
  },
  filterPatients(q){
    q=q.toLowerCase();
    const list=Store.data.patients.filter(p=>p.name.toLowerCase().includes(q)||p.phone.includes(q));
    document.querySelector('#patientTable tbody').innerHTML=this.patientRows(list);
  },

  patientProfile(id,role){
    const p=this.patientById(id);
    if(!p) return this.emptyState('Patient not found');
    const db=Store.data;
    const appts=db.appointments.filter(a=>a.patientId===id).sort((a,b)=>b.date.localeCompare(a.date));
    const records=db.medicalRecords.filter(r=>r.patientId===id).sort((a,b)=>b.date.localeCompare(a.date));
    const rx=db.prescriptions.filter(r=>r.patientId===id).sort((a,b)=>b.date.localeCompare(a.date));
    const bills=db.invoices.filter(i=>i.patientId===id).sort((a,b)=>b.date.localeCompare(a.date));
    const back = role==='admin'?'#/admin/patients':'#/doctor/dashboard';
    return `
    <div style="margin-bottom:14px;"><a href="${back}" style="font-size:13px;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:5px;">${icon('chevronL',14)}Back</a></div>
    <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:start;" class="scrollx">
      <div class="card" style="padding:20px;">
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
          <div class="avatar" style="background:${avatarColor(p.name)};width:64px;height:64px;font-size:22px;">${initials(p.name)}</div>
          <div class="font-display" style="font-weight:700;font-size:17px;margin-top:10px;">${esc(p.name)}</div>
          <div style="color:var(--muted);font-size:12.5px;">${esc(p.age)} yrs · ${esc(p.gender)}</div>
          <span class="badge badge-muted" style="margin-top:8px;">Blood group ${esc(p.bloodGroup)}</span>
        </div>
        <div style="margin-top:18px;display:flex;flex-direction:column;gap:10px;font-size:13px;">
          <div style="display:flex;gap:8px;align-items:flex-start;">${icon('phone',15)}<span>${esc(p.phone)}</span></div>
          <div style="display:flex;gap:8px;align-items:flex-start;">${icon('pin',15)}<span>${esc(p.address)}</span></div>
          <div style="display:flex;gap:8px;align-items:flex-start;">✉️<span style="word-break:break-all;">${esc(p.email)}</span></div>
        </div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:12.5px;">
          <div style="color:var(--muted);margin-bottom:3px;">Emergency contact</div>
          <div style="font-weight:600;">${esc(p.emergencyName)}</div>
          <div style="color:var(--muted);">${esc(p.emergencyPhone)}</div>
        </div>
        ${role==='admin'?`<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:16px;" onclick="App.openModal('editPatient','${p.id}')">${icon('edit',14)}Edit patient</button>`:''}
      </div>
      <div>
        <div style="display:flex;gap:18px;border-bottom:1px solid var(--border);margin-bottom:14px;">
          <div class="tab-btn active" data-tab="appts" onclick="App.switchTab(this,'appts')">Appointments (${appts.length})</div>
          <div class="tab-btn" data-tab="records" onclick="App.switchTab(this,'records')">Medical records (${records.length})</div>
          <div class="tab-btn" data-tab="rx" onclick="App.switchTab(this,'rx')">Prescriptions (${rx.length})</div>
          <div class="tab-btn" data-tab="bills" onclick="App.switchTab(this,'bills')">Bills (${bills.length})</div>
        </div>
        <div class="tab-panel" data-panel="appts">
          <div class="card scrollx"><table><thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Status</th></tr></thead><tbody>
          ${appts.length? appts.map(a=>{const d=this.doctorById(a.doctorId);return `<tr><td>${fmtDateShort(a.date)}</td><td>${esc(a.time)}</td><td>${esc(d?d.name:'—')}</td><td>${this.statusBadge(a.status)}</td></tr>`}).join(''):`<tr><td colspan="4">${this.emptyState('No appointments yet')}</td></tr>`}
          </tbody></table></div>
        </div>
        <div class="tab-panel" data-panel="records" style="display:none;">
          ${records.length? records.map(r=>{const d=this.doctorById(r.doctorId);return `<div class="card" style="padding:15px 18px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;">${esc(r.diagnosis)}</div><div style="font-size:12px;color:var(--muted);">${fmtDateShort(r.date)}</div></div>
            <div style="font-size:12.5px;color:var(--muted);margin-top:3px;">${esc(d?d.name:'—')} · ${esc(d?d.specialization:'')}</div>
            <div style="font-size:13px;margin-top:8px;"><b>Complaint:</b> ${esc(r.chiefComplaint)}</div>
            <div style="font-size:13px;margin-top:2px;"><b>Symptoms:</b> ${esc(r.symptoms)}</div>
            <div style="font-size:13px;margin-top:2px;"><b>Notes:</b> ${esc(r.notes)}</div>
            <div style="display:flex;gap:14px;margin-top:8px;font-size:12px;color:var(--muted);">
              <span>BP ${esc(r.bp)}</span><span>Temp ${esc(r.temp)}°F</span><span>Weight ${esc(r.weight)} kg</span>
            </div>
          </div>`}).join('') : this.emptyState('No medical records yet')}
        </div>
        <div class="tab-panel" data-panel="rx" style="display:none;">
          ${rx.length? rx.map(r=>this.prescriptionCard(r)).join('') : this.emptyState('No prescriptions yet')}
        </div>
        <div class="tab-panel" data-panel="bills" style="display:none;">
          <div class="card scrollx"><table><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
          ${bills.length? bills.map(inv=>{const total=inv.items.reduce((s,x)=>s+x.amount,0)-inv.discount; return `<tr><td>${esc(inv.id)}</td><td>${fmtDateShort(inv.date)}</td><td>${money(total)}</td><td>${this.statusBadge(inv.status)}</td><td style="text-align:right;"><button class="btn btn-ghost btn-sm" onclick="App.navigate('#/${role}/billing/${inv.id}')">View</button></td></tr>`}).join(''):`<tr><td colspan="5">${this.emptyState('No bills yet')}</td></tr>`}
          </tbody></table></div>
        </div>
      </div>
    </div>`;
  },

  prescriptionCard(r){
    const d=this.doctorById(r.doctorId);
    return `<div class="card" style="padding:15px 18px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div><div style="font-weight:700;">${esc(r.id)} — ${esc(r.diagnosis)}</div><div style="font-size:12px;color:var(--muted);">${esc(d?d.name:'—')} · ${fmtDateShort(r.date)}</div></div>
      </div>
      <div class="scrollx" style="margin-top:10px;">
      <table style="font-size:12.5px;"><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
      <tbody>${r.items.map(it=>`<tr><td>${esc(it.medicine)}</td><td>${esc(it.dosage)}</td><td>${esc(it.frequency)}</td><td>${esc(it.duration)}</td><td>${esc(it.instructions)}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>`;
  },

  switchTab(el,name){
    el.parentElement.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
    const container=el.closest('div').parentElement;
    container.querySelectorAll('.tab-panel').forEach(p=>p.style.display = p.dataset.panel===name?'block':'none');
  },

  adminDoctors(){
    const db=Store.data;
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div class="font-display" style="font-weight:700;font-size:15px;">${db.doctors.length} specialists</div>
      <button class="btn btn-primary" onclick="App.openModal('addDoctor')">${icon('plus',16)}Add doctor</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
      ${db.doctors.map(d=>this.doctorCard(d)).join('')}
    </div>`;
  },
  doctorCard(d){
    return `<div class="card" style="padding:18px;cursor:pointer;" onclick="App.navigate('#/${this.currentUser().role}/doctors/${d.id}')">
      <div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar" style="background:${avatarColor(d.name)};width:44px;height:44px;font-size:15px;">${initials(d.name)}</div>
        <div>
          <div style="font-weight:700;font-size:14.5px;">${esc(d.name)}</div>
          <div style="font-size:12.5px;color:var(--muted);">${esc(d.specialization)}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:12.5px;color:var(--muted);">
        <span>${esc(d.experience)} yrs experience</span><span style="font-weight:700;color:var(--ink);">${money(d.fee)}</span>
      </div>
      <div style="margin-top:10px;font-size:11.5px;color:var(--muted);">${d.days.join(', ')} · ${d.start}–${d.end}</div>
    </div>`;
  },

  doctorProfile(id,role){
    const d=this.doctorById(id);
    if(!d) return this.emptyState('Doctor not found');
    const db=Store.data;
    const appts=db.appointments.filter(a=>a.doctorId===id).sort((a,b)=>b.date.localeCompare(a.date));
    return `
    <div style="margin-bottom:14px;"><a href="#/${role}/doctors" style="font-size:13px;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:5px;">${icon('chevronL',14)}Back</a></div>
    <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:start;" class="scrollx">
      <div class="card" style="padding:20px;text-align:center;">
        <div class="avatar" style="background:${avatarColor(d.name)};width:64px;height:64px;font-size:22px;margin:0 auto;">${initials(d.name)}</div>
        <div class="font-display" style="font-weight:700;font-size:17px;margin-top:10px;">${esc(d.name)}</div>
        <div style="color:var(--muted);font-size:12.5px;">${esc(d.specialization)}</div>
        <div style="text-align:left;margin-top:16px;font-size:13px;display:flex;flex-direction:column;gap:8px;">
          <div><b>Qualification:</b> ${esc(d.qualification)}</div>
          <div><b>Experience:</b> ${esc(d.experience)} years</div>
          <div><b>Phone:</b> ${esc(d.phone)}</div>
          <div><b>Email:</b> ${esc(d.email)}</div>
          <div><b>Fee:</b> ${money(d.fee)}</div>
        </div>
        <div style="text-align:left;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
          <div style="font-size:12.5px;color:var(--muted);margin-bottom:6px;">Availability</div>
          <div style="font-size:13px;">${d.days.join(', ')}</div>
          <div style="font-size:13px;color:var(--muted);">${d.start} – ${d.end}, ${d.slot} min slots</div>
        </div>
        ${role==='patient'?`<button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="App.navigate('#/patient/book/${d.id}')">Book appointment</button>`:''}
      </div>
      <div class="card">
        <div style="padding:16px 18px;border-bottom:1px solid var(--border);font-weight:700;" class="font-display">Appointments</div>
        <div class="scrollx"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Status</th></tr></thead><tbody>
        ${appts.length? appts.map(a=>{const p=this.patientById(a.patientId);return `<tr><td>${fmtDateShort(a.date)}</td><td>${esc(a.time)}</td><td>${esc(p?p.name:'—')}</td><td>${this.statusBadge(a.status)}</td></tr>`}).join(''):`<tr><td colspan="4">${this.emptyState('No appointments yet')}</td></tr>`}
        </tbody></table></div>
      </div>
    </div>`;
  },

  adminAppointments(){
    const db=Store.data;
    const list=[...db.appointments].sort((a,b)=> b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
    return `
    <div class="card">
      <div class="scrollx">
      <table id="apptTable">
        <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th></th></tr></thead>
        <tbody>${this.apptRows(list,'admin')}</tbody>
      </table>
      </div>
    </div>`;
  },
  apptRows(list,role){
    if(!list.length) return `<tr><td colspan="7">${this.emptyState('No appointments')}</td></tr>`;
    return list.map(a=>{
      const p=this.patientById(a.patientId), d=this.doctorById(a.doctorId);
      const canAct = role==='admin' && a.status!=='Cancelled' && a.status!=='Completed';
      return `<tr>
        <td>${esc(a.id)}</td><td>${fmtDateShort(a.date)}</td><td>${esc(a.time)}</td>
        <td>${esc(p?p.name:'—')}</td><td>${esc(d?d.name:'—')}</td><td>${this.statusBadge(a.status)}</td>
        <td style="text-align:right;white-space:nowrap;">
        ${canAct? `<button class="btn btn-ghost btn-sm" onclick="App.setApptStatus('${a.id}','Confirmed')">Confirm</button>
        <button class="btn btn-danger btn-sm" onclick="App.setApptStatus('${a.id}','Cancelled')">Cancel</button>`:''}
        </td>
      </tr>`;
    }).join('');
  },
  setApptStatus(id,status){
    const a=Store.data.appointments.find(x=>x.id===id); if(!a) return;
    a.status=status; Store.save();
    this.toast('Appointment '+id+' marked '+status);
    this.render();
  },

  adminBilling(){
    const db=Store.data;
    const list=[...db.invoices].sort((a,b)=>b.date.localeCompare(a.date));
    return `
    <div class="card">
      <div class="scrollx">
      <table>
        <thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.map(inv=>{
          const p=this.patientById(inv.patientId); const total=inv.items.reduce((s,x)=>s+x.amount,0)-inv.discount;
          return `<tr><td>${esc(inv.id)}</td><td>${fmtDateShort(inv.date)}</td><td>${esc(p?p.name:'—')}</td><td>${money(total)}</td><td>${this.statusBadge(inv.status)}</td>
          <td style="text-align:right;"><button class="btn btn-ghost btn-sm" onclick="App.navigate('#/admin/billing/${inv.id}')">${icon('eye',14)}View</button></td></tr>`;
        }).join('')}</tbody>
      </table>
      </div>
    </div>`;
  },
  invoiceView(id,role){
    const inv=Store.data.invoices.find(i=>i.id===id);
    if(!inv) return this.emptyState('Invoice not found');
    const p=this.patientById(inv.patientId);
    const subtotal=inv.items.reduce((s,x)=>s+x.amount,0);
    const total=subtotal-inv.discount;
    return `
    <div style="margin-bottom:14px;"><a href="#/${role}/billing" style="font-size:13px;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:5px;">${icon('chevronL',14)}Back to billing</a></div>
    <div class="card" style="max-width:560px;margin:0 auto;padding:28px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div><div style="font-size:18px;">🏥</div><div class="font-display" style="font-weight:700;font-size:16px;margin-top:4px;">Meridian Clinic</div></div>
        <div style="text-align:right;">${this.statusBadge(inv.status)}<div class="font-display" style="font-weight:700;font-size:15px;margin-top:6px;">${esc(inv.id)}</div><div style="font-size:12px;color:var(--muted);">${fmtDate(inv.date)}</div></div>
      </div>
      <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);font-size:13px;">
        <div style="color:var(--muted);">Billed to</div><div style="font-weight:600;">${esc(p?p.name:'—')}</div>
      </div>
      <table style="margin-top:16px;"><thead><tr><th>Item</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${inv.items.map(it=>`<tr><td>${esc(it.desc)}</td><td style="text-align:right;">${money(it.amount)}</td></tr>`).join('')}</tbody></table>
      <div style="margin-top:10px;font-size:13.5px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:var(--muted);">Subtotal</span><span>${money(subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:var(--muted);">Discount</span><span>−${money(inv.discount)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;margin-top:4px;border-top:1px solid var(--border);font-weight:700;font-size:15.5px;"><span>Total</span><span>${money(total)}</span></div>
      </div>
      ${role==='admin' && inv.status!=='Paid'?`<button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="App.markPaid('${inv.id}')">Mark as paid</button>`:''}
    </div>`;
  },
  markPaid(id){
    const inv=Store.data.invoices.find(i=>i.id===id); if(!inv) return;
    inv.status='Paid'; Store.save(); this.toast('Invoice '+id+' marked as paid'); this.render();
  },

  /* =========================================================  DOCTOR  === */
  renderDoctor(parts,user){
    const page=parts[1]||'dashboard';
    const doc=this.doctorById(user.linkedId);
    if(page==='dashboard') return this.doctorDashboard(doc);
    if(page==='appointments') return this.doctorAppointments(doc);
    if(page==='consult') return this.doctorConsult(parts[2],doc);
    if(page==='prescriptions') return parts[2]==='new'? this.rxForm(parts[3],doc) : this.doctorPrescriptions(doc);
    if(page==='patients') return this.patientProfile(parts[2],'doctor');
    return this.doctorDashboard(doc);
  },

  doctorDashboard(doc){
    const today=todayStr();
    const list=Store.data.appointments.filter(a=>a.doctorId===doc.id && a.date===today).sort((a,b)=>a.time.localeCompare(b.time));
    return `
    <div class="card" style="padding:18px 20px;margin-bottom:16px;background:linear-gradient(120deg,var(--primary-light),transparent);">
      <div style="font-size:13px;color:var(--muted);">Good to see you,</div>
      <div class="font-display" style="font-weight:700;font-size:19px;">${esc(doc.name)}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">${esc(doc.specialization)} · ${list.length} appointment${list.length===1?'':'s'} today</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;" class="scrollx">
      ${this.statCard('Today',list.length,'calendar','var(--primary)')}
      ${this.statCard('Confirmed',list.filter(a=>a.status==='Confirmed').length,'check','var(--success)')}
      ${this.statCard('Completed',list.filter(a=>a.status==='Completed').length,'file','var(--accent)')}
    </div>
    <div class="card">
      <div style="padding:16px 18px;border-bottom:1px solid var(--border);font-weight:700;" class="font-display">Today's appointments</div>
      <div class="scrollx">
      <table>
        <thead><tr><th>Time</th><th>Patient</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.length? list.map(a=>{
          const p=this.patientById(a.patientId);
          return `<tr>
            <td>${esc(a.time)}</td>
            <td><div style="display:flex;align-items:center;gap:8px;"><div class="avatar" style="background:${avatarColor(p.name)};width:26px;height:26px;font-size:10.5px;">${initials(p.name)}</div>${esc(p.name)}</div></td>
            <td>${this.statusBadge(a.status)}</td>
            <td style="text-align:right;">${a.status!=='Completed'?`<button class="btn btn-primary btn-sm" onclick="App.navigate('#/doctor/consult/${a.id}')">Open consultation</button>`:`<button class="btn btn-ghost btn-sm" onclick="App.navigate('#/doctor/patients/${p.id}')">View record</button>`}</td>
          </tr>`;
        }).join('') : `<tr><td colspan="4">${this.emptyState('No appointments today','Enjoy the quiet moment')}</td></tr>`}
        </tbody>
      </table>
      </div>
    </div>`;
  },

  doctorAppointments(doc){
    const list=[...Store.data.appointments.filter(a=>a.doctorId===doc.id)].sort((a,b)=>b.date.localeCompare(a.date)||a.time.localeCompare(b.time));
    return `<div class="card"><div class="scrollx"><table>
      <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.length? list.map(a=>{const p=this.patientById(a.patientId);
        return `<tr><td>${fmtDateShort(a.date)}</td><td>${esc(a.time)}</td><td>${esc(p.name)}</td><td>${this.statusBadge(a.status)}</td>
        <td style="text-align:right;">${a.status!=='Completed'?`<button class="btn btn-primary btn-sm" onclick="App.navigate('#/doctor/consult/${a.id}')">Consult</button>`:`<button class="btn btn-ghost btn-sm" onclick="App.navigate('#/doctor/patients/${p.id}')">View</button>`}</td></tr>`;
      }).join(''):`<tr><td colspan="5">${this.emptyState('No appointments yet')}</td></tr>`}</tbody>
    </table></div></div>`;
  },

  doctorConsult(apptId,doc){
    const a=Store.data.appointments.find(x=>x.id===apptId);
    if(!a) return this.emptyState('Appointment not found');
    const p=this.patientById(a.patientId);
    const existingRecord=Store.data.medicalRecords.find(r=>r.appointmentId===apptId);
    return `
    <div style="margin-bottom:14px;"><a href="#/doctor/dashboard" style="font-size:13px;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:5px;">${icon('chevronL',14)}Back to dashboard</a></div>
    <div style="display:grid;grid-template-columns:260px 1fr;gap:16px;align-items:start;" class="scrollx">
      <div class="card" style="padding:18px;text-align:center;">
        <div class="avatar" style="background:${avatarColor(p.name)};width:54px;height:54px;font-size:19px;margin:0 auto;">${initials(p.name)}</div>
        <div class="font-display" style="font-weight:700;font-size:15.5px;margin-top:8px;">${esc(p.name)}</div>
        <div style="font-size:12.5px;color:var(--muted);">${esc(p.age)} yrs · ${esc(p.gender)} · ${esc(p.bloodGroup)}</div>
        <div style="text-align:left;margin-top:14px;font-size:12.5px;color:var(--muted);">
          <div>${esc(a.date)} at ${esc(a.time)}</div>
          <div style="margin-top:4px;">${this.statusBadge(a.status)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:14px;" onclick="App.navigate('#/doctor/patients/${p.id}')">View full history</button>
      </div>
      <div class="card" style="padding:20px;">
        <div class="font-display" style="font-weight:700;font-size:15px;margin-bottom:14px;">${existingRecord?'Consultation record':'New consultation'}</div>
        <form onsubmit="return App.saveConsultation(event,'${a.id}')" style="display:flex;flex-direction:column;gap:13px;">
          <div><label class="field-label">Chief complaint</label><input class="input" name="chiefComplaint" required value="${esc(existingRecord?existingRecord.chiefComplaint:'')}"></div>
          <div><label class="field-label">Symptoms</label><textarea class="input" name="symptoms" rows="2" required>${esc(existingRecord?existingRecord.symptoms:'')}</textarea></div>
          <div><label class="field-label">Diagnosis</label><input class="input" name="diagnosis" required value="${esc(existingRecord?existingRecord.diagnosis:'')}"></div>
          <div><label class="field-label">Notes</label><textarea class="input" name="notes" rows="2">${esc(existingRecord?existingRecord.notes:'')}</textarea></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            <div><label class="field-label">Blood pressure</label><input class="input" name="bp" placeholder="120/80" value="${esc(existingRecord?existingRecord.bp:'')}"></div>
            <div><label class="field-label">Temperature (°F)</label><input class="input" name="temp" placeholder="98.4" value="${esc(existingRecord?existingRecord.temp:'')}"></div>
            <div><label class="field-label">Weight (kg)</label><input class="input" name="weight" placeholder="68" value="${esc(existingRecord?existingRecord.weight:'')}"></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;">
            <button class="btn btn-primary" type="submit">${existingRecord?'Update record':'Save medical record'}</button>
            <button class="btn btn-accent" type="button" onclick="App.navigate('#/doctor/prescriptions/new/${p.id}')">${icon('rx',15)}Create prescription</button>
          </div>
        </form>
      </div>
    </div>`;
  },

  saveConsultation(e,apptId){
    e.preventDefault();
    const f=e.target, a=Store.data.appointments.find(x=>x.id===apptId);
    if(!a) return false;
    let rec=Store.data.medicalRecords.find(r=>r.appointmentId===apptId);
    const payload={chiefComplaint:f.chiefComplaint.value,symptoms:f.symptoms.value,diagnosis:f.diagnosis.value,notes:f.notes.value,bp:f.bp.value,temp:f.temp.value,weight:f.weight.value};
    if(rec){ Object.assign(rec,payload); }
    else{
      rec={id:uid('MR'),appointmentId:apptId,patientId:a.patientId,doctorId:a.doctorId,date:a.date,...payload};
      Store.data.medicalRecords.push(rec);
    }
    a.status='Completed';
    if(!Store.data.invoices.find(i=>i.appointmentId===apptId)){
      const doc=this.doctorById(a.doctorId);
      Store.data.invoices.push({id:uid('INV'),appointmentId:apptId,patientId:a.patientId,date:a.date,items:[{desc:'Consultation — '+doc.specialization,amount:doc.fee}],discount:0,status:'Pending'});
    }
    Store.save();
    this.toast('Medical record saved');
    this.render();
    return false;
  },

  doctorPrescriptions(doc){
    const list=Store.data.prescriptions.filter(r=>r.doctorId===doc.id).sort((a,b)=>b.date.localeCompare(a.date));
    return `
    <div style="margin-bottom:14px;color:var(--muted);font-size:13px;">Prescriptions you've written recently.</div>
    ${list.length? list.map(r=>{
      const p=this.patientById(r.patientId);
      return `<div class="card" style="padding:15px 18px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;">${esc(r.id)} — ${esc(p?p.name:'—')}</div><div style="font-size:12px;color:var(--muted);">${fmtDateShort(r.date)}</div></div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">${esc(r.diagnosis)}</div>
        <div class="scrollx" style="margin-top:10px;"><table style="font-size:12.5px;"><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
        <tbody>${r.items.map(it=>`<tr><td>${esc(it.medicine)}</td><td>${esc(it.dosage)}</td><td>${esc(it.frequency)}</td><td>${esc(it.duration)}</td></tr>`).join('')}</tbody></table></div>
      </div>`;
    }).join('') : this.emptyState('No prescriptions yet')}`;
  },

  rxForm(patientId,doc){
    const p=this.patientById(patientId);
    if(!p) return this.emptyState('Patient not found');
    const record=[...Store.data.medicalRecords].reverse().find(r=>r.patientId===patientId && r.doctorId===doc.id);
    return `
    <div style="margin-bottom:14px;"><a href="#/doctor/dashboard" style="font-size:13px;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:5px;">${icon('chevronL',14)}Back</a></div>
    <div class="card" style="max-width:640px;margin:0 auto;padding:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div class="font-display" style="font-weight:700;font-size:16px;">New prescription</div>
          <div style="font-size:12.5px;color:var(--muted);">${esc(p.name)} · ${esc(p.age)} yrs</div>
        </div>
      </div>
      <form onsubmit="return App.saveRx(event,'${patientId}')">
        <label class="field-label">Diagnosis</label>
        <input class="input" name="diagnosis" required value="${esc(record?record.diagnosis:'')}" style="margin-bottom:14px;">
        <div id="rxItems">${this.rxItemRow(0)}</div>
        <button type="button" class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="App.addRxRow()">${icon('plus',14)}Add medicine</button>
        <div style="margin-top:18px;"><button class="btn btn-primary" type="submit" style="width:100%;">Generate prescription</button></div>
      </form>
    </div>`;
  },
  rxRowIndex:0,
  rxItemRow(i){
    return `<div class="rx-row" style="display:grid;grid-template-columns:1.4fr 1fr 1fr 0.8fr 1.2fr auto;gap:8px;margin-bottom:8px;align-items:center;">
      <input class="input" placeholder="Medicine" name="med_${i}" required>
      <input class="input" placeholder="Dosage" name="dose_${i}" required>
      <input class="input" placeholder="Frequency" name="freq_${i}" required>
      <input class="input" placeholder="Duration" name="dur_${i}" required>
      <input class="input" placeholder="Instructions" name="inst_${i}">
      <button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.rx-row').remove()">${icon('trash',14)}</button>
    </div>`;
  },
  addRxRow(){ this.rxRowIndex++; document.getElementById('rxItems').insertAdjacentHTML('beforeend', this.rxItemRow(this.rxRowIndex)); },
  saveRx(e,patientId){
    e.preventDefault();
    const f=e.target;
    const rows=f.querySelectorAll('.rx-row');
    const items=[];
    rows.forEach(row=>{
      const inputs=row.querySelectorAll('input');
      const [med,dose,freq,dur,inst]=inputs;
      if(med.value.trim()) items.push({medicine:med.value,dosage:dose.value,frequency:freq.value,duration:dur.value,instructions:inst.value||'—'});
    });
    if(!items.length){ this.toast('Add at least one medicine'); return false; }
    const doc=this.doctorById(this.currentUser().linkedId);
    const record=[...Store.data.medicalRecords].reverse().find(r=>r.patientId===patientId && r.doctorId===doc.id);
    const rx={id:uid('RX'),medicalRecordId:record?record.id:null,patientId,doctorId:doc.id,date:todayStr(),diagnosis:f.diagnosis.value,items};
    Store.data.prescriptions.push(rx);
    Store.save();
    this.toast('Prescription '+rx.id+' generated');
    this.rxRowIndex=0;
    this.navigate('#/doctor/prescriptions');
    return false;
  },

  /* ========================================================  PATIENT  === */
  renderPatient(parts,user){
    const page=parts[1]||'dashboard';
    const p=this.patientById(user.linkedId);
    if(page==='dashboard') return this.patientDashboard(p);
    if(page==='doctors') return parts[2]? this.doctorProfile(parts[2],'patient') : this.patientFindDoctors();
    if(page==='book') return this.bookingFlow(parts[2],p);
    if(page==='appointments') return this.patientAppointments(p);
    if(page==='records') return this.patientRecords(p);
    if(page==='prescriptions') return this.patientRx(p);
    if(page==='bills') return this.adminBillingForPatient(p);
    if(page==='billing') return this.invoiceView(parts[2],'patient');
    if(page==='profile') return this.patientProfileSelf(p);
    return this.patientDashboard(p);
  },

  patientDashboard(p){
    const db=Store.data, today=todayStr();
    const upcoming=[...db.appointments].filter(a=>a.patientId===p.id && a.date>=today && a.status!=='Cancelled').sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0];
    const records=db.medicalRecords.filter(r=>r.patientId===p.id).length;
    const rx=db.prescriptions.filter(r=>r.patientId===p.id).length;
    const bills=db.invoices.filter(i=>i.patientId===p.id && i.status==='Pending').length;
    return `
    <div class="card" style="padding:20px;margin-bottom:16px;background:linear-gradient(120deg,var(--primary-light),transparent);">
      <div class="font-display" style="font-weight:700;font-size:20px;">Welcome, ${esc(p.name.split(' ')[0])}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:2px;">Here's what's coming up for your care.</div>
    </div>
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:16px;align-items:start;" class="scrollx">
      <div class="card" style="padding:20px;">
        <div class="font-display" style="font-weight:700;font-size:14.5px;margin-bottom:12px;">Upcoming appointment</div>
        ${upcoming? (()=>{ const d=this.doctorById(upcoming.doctorId);
          return `<div style="display:flex;align-items:center;gap:12px;">
            <div class="avatar" style="background:${avatarColor(d.name)};width:46px;height:46px;font-size:16px;">${initials(d.name)}</div>
            <div style="flex:1;">
              <div style="font-weight:700;">${esc(d.name)}</div>
              <div style="font-size:12.5px;color:var(--muted);">${esc(d.specialization)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700;">${fmtDateShort(upcoming.date)}</div>
              <div style="font-size:12.5px;color:var(--muted);">${esc(upcoming.time)}</div>
            </div>
          </div>
          <div style="margin-top:12px;">${this.statusBadge(upcoming.status)}</div>`; })() : this.emptyState('No upcoming appointments','Book a visit with a specialist below')}
        <button class="btn btn-primary" style="margin-top:16px;" onclick="App.navigate('#/patient/doctors')">${icon('plus',15)}Book new appointment</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card" style="padding:15px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="App.navigate('#/patient/records')"><div><div style="font-weight:700;">Medical records</div><div style="font-size:12px;color:var(--muted);">${records} record${records===1?'':'s'} on file</div></div>${icon('chevronR',16)}</div>
        <div class="card" style="padding:15px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="App.navigate('#/patient/prescriptions')"><div><div style="font-weight:700;">Prescriptions</div><div style="font-size:12px;color:var(--muted);">${rx} prescription${rx===1?'':'s'}</div></div>${icon('chevronR',16)}</div>
        <div class="card" style="padding:15px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="App.navigate('#/patient/bills')"><div><div style="font-weight:700;">Bills</div><div style="font-size:12px;color:var(--muted);">${bills} pending payment${bills===1?'':'s'}</div></div>${icon('chevronR',16)}</div>
      </div>
    </div>`;
  },

  patientFindDoctors(){
    const db=Store.data;
    const specs=[...new Set(db.doctors.map(d=>d.specialization))];
    return `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <button class="btn btn-ghost btn-sm" onclick="App.filterDoctors('all')" id="specall">All specialties</button>
      ${specs.map(s=>`<button class="btn btn-ghost btn-sm" onclick="App.filterDoctors('${esc(s)}')">${esc(s)}</button>`).join('')}
    </div>
    <div id="doctorGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
      ${db.doctors.map(d=>this.doctorCard(d)).join('')}
    </div>`;
  },
  filterDoctors(spec){
    const list = spec==='all'? Store.data.doctors : Store.data.doctors.filter(d=>d.specialization===spec);
    document.getElementById('doctorGrid').innerHTML = list.map(d=>this.doctorCard(d)).join('');
  },

  bookingFlow(doctorId,p){
    const d=this.doctorById(doctorId);
    if(!d) return this.emptyState('Doctor not found');
    const today=todayStr();
    const dateOptions=[]; for(let i=0;i<14;i++) dateOptions.push(addDays(today,i));
    const validDates=dateOptions.filter(ds=>d.days.includes(dayName(ds)));
    return `
    <div style="margin-bottom:14px;"><a href="#/patient/doctors/${d.id}" style="font-size:13px;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:5px;">${icon('chevronL',14)}Back to doctor</a></div>
    <div class="card" style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div class="avatar" style="background:${avatarColor(d.name)};width:44px;height:44px;">${initials(d.name)}</div>
        <div><div style="font-weight:700;">${esc(d.name)}</div><div style="font-size:12.5px;color:var(--muted);">${esc(d.specialization)} · ${money(d.fee)}</div></div>
      </div>
      <label class="field-label">Choose a date</label>
      <div id="dateRow" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:16px;">
        ${validDates.slice(0,8).map((ds,i)=>`<div class="date-pill" data-date="${ds}" onclick="App.pickDate(this,'${d.id}')" style="flex-shrink:0;cursor:pointer;text-align:center;border:1px solid var(--border);border-radius:10px;padding:9px 13px;${i===0?'background:var(--primary);color:#fff;border-color:var(--primary);':''}">
          <div style="font-size:11px;${i===0?'color:#DDEFED;':'color:var(--muted);'}">${dayName(ds)}</div>
          <div style="font-weight:700;font-size:14px;">${fmtDateShort(ds)}</div>
        </div>`).join('')}
      </div>
      <label class="field-label">Available slots</label>
      <div id="slotGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px;"></div>
      <button class="btn btn-primary" id="confirmBtn" style="width:100%;" disabled onclick="App.confirmBooking('${d.id}','${p.id}')">Confirm appointment</button>
    </div>`;
  },

  selectedDate:null, selectedTime:null,
  pickDate(el,doctorId){
    document.querySelectorAll('.date-pill').forEach(x=>{x.style.background='';x.style.color='';x.style.borderColor='var(--border)';x.querySelector('div').style.color='var(--muted)';});
    el.style.background='var(--primary)'; el.style.color='#fff'; el.style.borderColor='var(--primary)';
    this.selectedDate=el.dataset.date; this.selectedTime=null;
    this.renderSlots(doctorId);
  },
  renderSlots(doctorId){
    const d=this.doctorById(doctorId);
    const date=this.selectedDate;
    const grid=document.getElementById('slotGrid');
    if(!date){ grid.innerHTML=''; return; }
    const [sh,sm]=d.start.split(':').map(Number), [eh,em]=d.end.split(':').map(Number);
    let mins=sh*60+sm; const endMins=eh*60+em;
    const booked=Store.data.appointments.filter(a=>a.doctorId===doctorId && a.date===date && a.status!=='Cancelled').map(a=>a.time);
    let html='';
    while(mins+d.slot<=endMins){
      const hh=String(Math.floor(mins/60)).padStart(2,'0'), mm=String(mins%60).padStart(2,'0');
      const t=hh+':'+mm;
      const isBooked=booked.includes(t);
      const label = ((mins%720===0)?12:mins/60%12|0)+':'+mm+' '+(mins<720?'AM':'PM');
      html+=`<button type="button" class="btn btn-sm" style="border:1px solid var(--border);background:${isBooked?'var(--danger-light)':'var(--surface)'};color:${isBooked?'var(--danger)':'var(--ink)'};" ${isBooked?'disabled':''} onclick="App.pickTime(this,'${t}')">${label}</button>`;
      mins+=d.slot;
    }
    grid.innerHTML=html || `<div style="grid-column:1/-1;color:var(--muted);font-size:13px;">No slots configured</div>`;
  },
  pickTime(el,t){
    document.querySelectorAll('#slotGrid button').forEach(b=>{ if(!b.disabled){ b.style.background='var(--surface)'; b.style.color='var(--ink)'; b.style.borderColor='var(--border)'; }});
    el.style.background='var(--primary)'; el.style.color='#fff'; el.style.borderColor='var(--primary)';
    this.selectedTime=t;
    document.getElementById('confirmBtn').disabled=false;
  },
  confirmBooking(doctorId,patientId){
    if(!this.selectedDate||!this.selectedTime){ this.toast('Choose a date and time'); return; }
    const id=uid('APT');
    Store.data.appointments.push({id,patientId,doctorId,date:this.selectedDate,time:this.selectedTime,status:'Confirmed'});
    Store.save();
    const d=this.doctorById(doctorId);
    this.selectedDate=null; this.selectedTime=null;
    document.getElementById('app').innerHTML = this.shell(`
      <div class="card" style="max-width:440px;margin:60px auto;padding:32px;text-align:center;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--success-light);color:var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">${icon('check',24)}</div>
        <div class="font-display" style="font-weight:700;font-size:18px;">Appointment confirmed</div>
        <div style="color:var(--muted);font-size:13.5px;margin-top:6px;">${esc(d.name)} · ${esc(d.specialization)}</div>
        <div style="margin-top:14px;font-weight:700;">${fmtDate(Store.data.appointments.find(a=>a.id===id).date)} at ${esc(this.selectedTimeLabel||Store.data.appointments.find(a=>a.id===id).time)}</div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:4px;">Appointment ID: ${id}</div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="App.navigate('#/patient/dashboard')">Go to dashboard</button>
      </div>`, this.currentUser(), 'doctors');
    this.toast('Appointment booked with '+d.name);
  },

  patientAppointments(p){
    const list=[...Store.data.appointments.filter(a=>a.patientId===p.id)].sort((a,b)=>b.date.localeCompare(a.date));
    const today=todayStr();
    return `<div class="card"><div class="scrollx"><table>
      <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.length? list.map(a=>{const d=this.doctorById(a.doctorId); const canCancel=a.date>=today && a.status!=='Cancelled' && a.status!=='Completed';
        return `<tr><td>${fmtDateShort(a.date)}</td><td>${esc(a.time)}</td><td>${esc(d.name)}</td><td>${this.statusBadge(a.status)}</td>
        <td style="text-align:right;">${canCancel?`<button class="btn btn-danger btn-sm" onclick="App.cancelAppt('${a.id}')">Cancel</button>`:''}</td></tr>`;
      }).join(''):`<tr><td colspan="5">${this.emptyState('No appointments yet','Book your first visit')}</td></tr>`}</tbody>
    </table></div></div>`;
  },
  cancelAppt(id){
    const a=Store.data.appointments.find(x=>x.id===id); if(!a) return;
    a.status='Cancelled'; Store.save(); this.toast('Appointment cancelled'); this.render();
  },

  patientRecords(p){
    const records=Store.data.medicalRecords.filter(r=>r.patientId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
    if(!records.length) return this.emptyState('No medical records yet','Records appear here after a consultation');
    return records.map(r=>{const d=this.doctorById(r.doctorId);return `<div class="card" style="padding:16px 18px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;">${esc(r.diagnosis)}</div><div style="font-size:12px;color:var(--muted);">${fmtDateShort(r.date)}</div></div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">${esc(d.name)} · ${esc(d.specialization)}</div>
      <div style="font-size:13px;margin-top:8px;"><b>Complaint:</b> ${esc(r.chiefComplaint)}</div>
      <div style="font-size:13px;margin-top:2px;"><b>Symptoms:</b> ${esc(r.symptoms)}</div>
      <div style="font-size:13px;margin-top:2px;"><b>Notes:</b> ${esc(r.notes)}</div>
      <div style="display:flex;gap:14px;margin-top:8px;font-size:12px;color:var(--muted);"><span>BP ${esc(r.bp)}</span><span>Temp ${esc(r.temp)}°F</span><span>Weight ${esc(r.weight)} kg</span></div>
    </div>`}).join('');
  },

  patientRx(p){
    const list=Store.data.prescriptions.filter(r=>r.patientId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
    if(!list.length) return this.emptyState('No prescriptions yet');
    return list.map(r=>this.prescriptionCard(r)).join('');
  },

  adminBillingForPatient(p){
    const list=Store.data.invoices.filter(i=>i.patientId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
    if(!list.length) return this.emptyState('No bills yet');
    return `<div class="card"><div class="scrollx"><table>
      <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.map(inv=>{const total=inv.items.reduce((s,x)=>s+x.amount,0)-inv.discount;
        return `<tr><td>${esc(inv.id)}</td><td>${fmtDateShort(inv.date)}</td><td>${money(total)}</td><td>${this.statusBadge(inv.status)}</td>
        <td style="text-align:right;"><button class="btn btn-ghost btn-sm" onclick="App.navigate('#/patient/billing/${inv.id}')">View</button></td></tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  },

  patientProfileSelf(p){
    return `
    <div class="card" style="max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;">
        <div class="avatar" style="background:${avatarColor(p.name)};width:60px;height:60px;font-size:20px;margin:0 auto;">${initials(p.name)}</div>
        <div class="font-display" style="font-weight:700;font-size:17px;margin-top:8px;">${esc(p.name)}</div>
        <span class="badge badge-muted" style="margin-top:6px;">Blood group ${esc(p.bloodGroup)}</span>
      </div>
      <div style="margin-top:18px;display:flex;flex-direction:column;gap:10px;font-size:13.5px;">
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted);">Age / Gender</span><span>${esc(p.age)} · ${esc(p.gender)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted);">Phone</span><span>${esc(p.phone)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted);">Email</span><span>${esc(p.email)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted);">Address</span><span style="text-align:right;">${esc(p.address)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;"><span style="color:var(--muted);">Emergency contact</span><span style="text-align:right;">${esc(p.emergencyName)}<br><span style="color:var(--muted);font-size:12px;">${esc(p.emergencyPhone)}</span></span></div>
      </div>
    </div>`;
  },

  /* ============================================================ modals == */
  openModal(kind,arg){
    let body='';
    if(kind==='addPatient'){
      body=`<h3 class="font-display" style="font-weight:700;font-size:16px;margin-bottom:14px;">Add patient</h3>
      <form onsubmit="return App.submitAddPatient(event)" style="display:flex;flex-direction:column;gap:11px;">
        <div><label class="field-label">Full name *</label><input class="input" name="name" required></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label class="field-label">Age</label><input class="input" name="age" type="number" min="0"></div>
          <div><label class="field-label">Gender</label><select class="input" name="gender"><option>Male</option><option>Female</option><option>Other</option></select></div>
        </div>
        <div><label class="field-label">Phone</label><input class="input" name="phone"></div>
        <div><label class="field-label">Email</label><input class="input" name="email" type="email"></div>
        <div><label class="field-label">Address</label><input class="input" name="address"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label class="field-label">Blood group</label><select class="input" name="bloodGroup">${['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(b=>`<option>${b}</option>`).join('')}</select></div>
          <div><label class="field-label">Emergency phone</label><input class="input" name="emergencyPhone"></div>
        </div>
        <div><label class="field-label">Emergency contact name</label><input class="input" name="emergencyName"></div>
        <div style="display:flex;gap:8px;margin-top:8px;"><button class="btn btn-primary" type="submit" style="flex:1;">Add patient</button><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
      </form>`;
    } else if(kind==='editPatient'){
      const p=this.patientById(arg);
      body=`<h3 class="font-display" style="font-weight:700;font-size:16px;margin-bottom:14px;">Edit patient</h3>
      <form onsubmit="return App.submitEditPatient(event,'${arg}')" style="display:flex;flex-direction:column;gap:11px;">
        <div><label class="field-label">Full name *</label><input class="input" name="name" required value="${esc(p.name)}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label class="field-label">Age</label><input class="input" name="age" type="number" value="${esc(p.age)}"></div>
          <div><label class="field-label">Gender</label><select class="input" name="gender"><option ${p.gender==='Male'?'selected':''}>Male</option><option ${p.gender==='Female'?'selected':''}>Female</option><option ${p.gender==='Other'?'selected':''}>Other</option></select></div>
        </div>
        <div><label class="field-label">Phone</label><input class="input" name="phone" value="${esc(p.phone)}"></div>
        <div><label class="field-label">Email</label><input class="input" name="email" value="${esc(p.email)}"></div>
        <div><label class="field-label">Address</label><input class="input" name="address" value="${esc(p.address)}"></div>
        <div style="display:flex;gap:8px;margin-top:8px;"><button class="btn btn-primary" type="submit" style="flex:1;">Save changes</button><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
      </form>`;
    } else if(kind==='addDoctor'){
      body=`<h3 class="font-display" style="font-weight:700;font-size:16px;margin-bottom:14px;">Add doctor</h3>
      <form onsubmit="return App.submitAddDoctor(event)" style="display:flex;flex-direction:column;gap:11px;">
        <div><label class="field-label">Full name *</label><input class="input" name="name" required placeholder="Dr. Jane Doe"></div>
        <div><label class="field-label">Specialization *</label><input class="input" name="specialization" required></div>
        <div><label class="field-label">Qualification</label><input class="input" name="qualification"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label class="field-label">Experience (yrs)</label><input class="input" name="experience" type="number" min="0"></div>
          <div><label class="field-label">Consultation fee</label><input class="input" name="fee" type="number" min="0"></div>
        </div>
        <div><label class="field-label">Phone</label><input class="input" name="phone"></div>
        <div><label class="field-label">Email</label><input class="input" name="email" type="email"></div>
        <div style="display:flex;gap:8px;margin-top:8px;"><button class="btn btn-primary" type="submit" style="flex:1;">Add doctor</button><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
      </form>`;
    }
    const wrap=document.createElement('div');
    wrap.className='modal-backdrop'; wrap.id='modalRoot';
    wrap.onclick=(e)=>{ if(e.target===wrap) this.closeModal(); };
    wrap.innerHTML=`<div class="card" style="width:100%;max-width:440px;padding:22px;margin-top:26px;">${body}</div>`;
    document.body.appendChild(wrap);
  },
  closeModal(){ const m=document.getElementById('modalRoot'); if(m) m.remove(); },
  submitAddPatient(e){
    e.preventDefault(); const f=e.target;
    Store.data.patients.push({id:uid('p'),name:f.name.value,age:f.age.value||'—',gender:f.gender.value,phone:f.phone.value||'—',email:f.email.value||'—',address:f.address.value||'—',bloodGroup:f.bloodGroup.value||'—',emergencyName:f.emergencyName.value||'—',emergencyPhone:f.emergencyPhone.value||'—'});
    Store.save(); this.closeModal(); this.toast('Patient added'); this.render();
    return false;
  },
  submitEditPatient(e,id){
    e.preventDefault(); const f=e.target, p=this.patientById(id);
    Object.assign(p,{name:f.name.value,age:f.age.value,gender:f.gender.value,phone:f.phone.value,email:f.email.value,address:f.address.value});
    Store.save(); this.closeModal(); this.toast('Patient updated'); this.render();
    return false;
  },
  submitAddDoctor(e){
    e.preventDefault(); const f=e.target;
    Store.data.doctors.push({id:uid('d'),name:f.name.value,specialization:f.specialization.value,qualification:f.qualification.value||'—',experience:Number(f.experience.value)||0,phone:f.phone.value||'—',email:f.email.value||'—',fee:Number(f.fee.value)||0,days:['Mon','Wed','Fri'],start:'10:00',end:'14:00',slot:30});
    Store.save(); this.closeModal(); this.toast('Doctor added'); this.render();
    return false;
  }
};


export { App, Store, Session, seed };
export { uid, esc, money, fmtDate, fmtDateShort, todayStr, addDays, dayName, initials, avatarColor, icon };
