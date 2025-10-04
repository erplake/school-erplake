import React, { useState, useMemo, useEffect } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';

// Lightweight primitives
const Card = ({children,className=''}) => <div className={`rounded-xl border bg-white ${className}`}>{children}</div>;
const CardHeader = ({children,className=''}) => <div className={`p-4 border-b flex items-center justify-between ${className}`}>{children}</div>;
const CardTitle = ({children,className=''}) => <h3 className={`font-semibold ${className}`}>{children}</h3>;
const CardContent = ({children,className=''}) => <div className={`p-4 space-y-4 ${className}`}>{children}</div>;
const Button = ({children,className='',variant='default',...p}) => { const v = variant==='primary' ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : variant==='danger'? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-500' : 'bg-white hover:bg-slate-50'; return <button className={`px-3 py-1.5 rounded-lg border text-sm transition ${v} ${className}`} {...p}>{children}</button>; };
const Badge = ({children,className='',tone='slate'}) => { const toneMap={slate:'bg-slate-100 text-slate-700',amber:'bg-amber-100 text-amber-700',red:'bg-red-100 text-red-700',emerald:'bg-emerald-100 text-emerald-700'}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${toneMap[tone]||toneMap.slate} ${className}`}>{children}</span>; };
const Input = (p) => <input {...p} className={`px-2 py-1.5 rounded-lg border text-sm w-full ${p.className||''}`} />;
const Textarea = (p) => <textarea {...p} className={`px-3 py-2 rounded-lg border text-sm w-full ${p.className||''}`} />;

// Seeds
const seedVisits=[
  { id:'V-1001', studentName:'Aarav Sharma', rollNo:'7A-12', class:'VII', section:'A', age:12, gender:'M', symptoms:'Fever, mild headache', triage:'Medium', vitals:{ temp:100.8, pulse:92, spo2:98, bp:'110/70' }, allergies:'Penicillin', medicationsGiven:['Paracetamol 250mg'], nurse:'Nurse Kavita', timeIn:'2025-10-02T08:50:00', timeOut:null, status:'In Ward', parentNotified:false, notes:'Advised rest. Monitor temperature every 30 mins.', bed:'B2', guardianPhone:'+91 98xxxxxx21', doctor:'Dr. Rao' },
  { id:'V-1002', studentName:'Meera Iyer', rollNo:'10B-05', class:'X', section:'B', age:15, gender:'F', symptoms:'Sprained ankle during PE', triage:'High', vitals:{ temp:98.4, pulse:88, spo2:99, bp:'112/72' }, allergies:'None', medicationsGiven:['Cold compress','Elastic bandage'], nurse:'Nurse Rahim', timeIn:'2025-10-02T09:10:00', timeOut:null, status:'In Ward', parentNotified:true, notes:'Elevate leg. Refer to Ortho if swelling persists.', bed:'A1', guardianPhone:'+91 88xxxxxx90', doctor:'Dr. Rao' },
  { id:'V-0996', studentName:'Kabir Khan', rollNo:'5C-19', class:'V', section:'C', age:10, gender:'M', symptoms:'Seasonal allergy sneeze', triage:'Low', vitals:{ temp:98.2, pulse:80, spo2:99, bp:'108/68' }, allergies:'Pollen', medicationsGiven:['Cetirizine 5mg'], nurse:'Nurse Kavita', timeIn:'2025-09-30T10:20:00', timeOut:'2025-09-30T11:05:00', status:'Released', parentNotified:true, notes:'Given antihistamine. Returned to class.', bed:null, guardianPhone:'+91 99xxxxxx43', doctor:'Dr. Sen' }
];
const seedInventory=[
  { id:'MED-01', name:'Paracetamol 250mg', stock:34, min:20, unit:'tabs', expires:'2026-02-01' },
  { id:'MED-02', name:'Cetirizine 5mg', stock:8, min:15, unit:'tabs', expires:'2025-12-15' },
  { id:'KIT-01', name:'Elastic Bandage', stock:3, min:6, unit:'pcs', expires:'2027-01-01' },
  { id:'KIT-02', name:'Cold Pack', stock:12, min:10, unit:'pcs', expires:'2026-11-20' }
];
const seedImmunization=[
  { student:'Ria Verma', class:'I', section:'B', vaccine:'MMR (Dose 2)', due:'2025-10-10' },
  { student:'Dev Patel', class:'III', section:'A', vaccine:'DTaP Booster', due:'2025-10-05' },
];

// localStorage helpers
function loadLs(key, fallback){ try{ const raw=localStorage.getItem(key); return raw? JSON.parse(raw): fallback; }catch{return fallback;} }
function saveLs(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }

export default function Infirmary(){
  const [visits,setVisits] = useState(()=> loadLs('inf_visits', seedVisits));
  const [inventory,setInventory] = useState(()=> loadLs('inf_inventory', seedInventory));
  const [immunization] = useState(seedImmunization);
  const [tab,setTab] = useState('triage');
  const [search,setSearch] = useState('');
  const [klass,setKlass] = useState('All');
  const [section,setSection] = useState('All');
  const [detail,setDetail] = useState(null);
  const [newVisitOpen,setNewVisitOpen] = useState(false);
  const [reportOpen,setReportOpen] = useState(false);
  const [form,setForm] = useState({ studentName:'', class:'', section:'', rollNo:'', age:'', gender:'', symptoms:'', triage:'Medium', bed:'', notes:'', allergies:'', nurse:'Nurse Kavita', doctor:'Dr. Rao' });
  const [medDispense,setMedDispense] = useState({ name:'', qty:1 });
  const [staff,setStaff] = useState(()=> loadLs('inf_staff',[
    { id:'D-01', name:'Dr. Rao', role:'Doctor', onDuty:true, specialty:'Pediatrics' },
    { id:'D-02', name:'Dr. Sen', role:'Doctor', onDuty:false, specialty:'Orthopedics' },
    { id:'N-01', name:'Nurse Kavita', role:'Nurse', onDuty:true, specialty:'General' },
    { id:'N-02', name:'Nurse Rahim', role:'Nurse', onDuty:true, specialty:'First Aid' },
  ]));
  const [emergencies,setEmergencies] = useState(()=> loadLs('inf_emergencies', [])); // {id,code,description,time,status,resolvedBy,resolvedAt}
  const [activeEmergency,setActiveEmergency] = useState(null);
  const emergencyCodes=['Code Red','Code Blue','Code Yellow','Code Orange'];
  const [codeDialog,setCodeDialog] = useState(false);
  const [codeDesc,setCodeDesc] = useState('');
  const [showOnlyOnDuty,setShowOnlyOnDuty] = useState(true);
  const [editingVitals,setEditingVitals] = useState(false);
  const [vitalsDraft,setVitalsDraft] = useState({ temp:'', pulse:'', spo2:'', bp:'' });
  const [esiScores,setEsiScores] = useState(()=> loadLs('inf_esi', {}));

  const inWard = useMemo(()=> visits.filter(v=> v.status==='In Ward'),[visits]);
  const history = useMemo(()=> visits.filter(v=> v.status!=='In Ward'),[visits]);
  const classes = useMemo(()=> Array.from(new Set(visits.map(v=>v.class))).sort(),[visits]);
  const sections = useMemo(()=> Array.from(new Set(visits.map(v=>v.section))).sort(),[visits]);
  const bedsTotal = 8;
  const bedsUsed = inWard.filter(v=> v.bed).length;
  const lowStock = useMemo(()=> inventory.filter(i=> i.stock<=i.min),[inventory]);

  const filteredTriage = useMemo(()=> inWard.filter(v=> {
    if(search && !v.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    if(klass!=='All' && v.class!==klass) return false;
    if(section!=='All' && v.section!==section) return false;
    if(showOnlyOnDuty){
      const nurseOn = staff.find(s=> s.name===v.nurse && s.onDuty);
      const docOn = staff.find(s=> s.name===v.doctor && s.onDuty);
      if(!nurseOn && !docOn) return false;
    }
    return true;
  }),[inWard,search,klass,section,showOnlyOnDuty,staff]);
  const filteredHistory = useMemo(()=> history.filter(v=> search==='' || v.studentName.toLowerCase().includes(search.toLowerCase())),[history,search]);

  function admitNewVisit(){
    if(!form.studentName || !form.class) return;
    const id='V-'+(Math.floor(Math.random()*9000)+1000);
    const visit={ id, studentName:form.studentName, rollNo:form.rollNo||'', class:form.class, section:form.section||'', age:Number(form.age)||0, gender:form.gender||'', symptoms:form.symptoms, triage:form.triage, vitals:{ temp:'—', pulse:'—', spo2:'—', bp:'—' }, allergies:form.allergies||'', medicationsGiven:[], nurse:form.nurse||'Nurse', doctor:form.doctor||'Unassigned', timeIn:new Date().toISOString(), timeOut:null, status:'In Ward', parentNotified:false, notes:form.notes||'', bed:form.bed||null, guardianPhone:'' };
    setVisits(v=> [visit,...v]);
    setForm({ studentName:'', class:'', section:'', rollNo:'', age:'', gender:'', symptoms:'', triage:'Medium', bed:'', notes:'', allergies:'', nurse:'Nurse Kavita', doctor:'Dr. Rao' });
    setNewVisitOpen(false);
  }
  function markReleased(v){ setVisits(prev=> prev.map(x=> x.id===v.id? { ...x, status:'Released', timeOut:new Date().toISOString(), bed:null }:x)); setDetail(null); }
  function markReferred(v){ setVisits(prev=> prev.map(x=> x.id===v.id? { ...x, status:'Referred', timeOut:new Date().toISOString(), bed:null }:x)); setDetail(null); }
  function toggleParent(v){ setVisits(prev=> prev.map(x=> x.id===v.id? { ...x, parentNotified:!x.parentNotified }:x)); }
  function dispenseMedication(v){ if(!medDispense.name) return; setVisits(prev=> prev.map(x=> x.id===v.id? { ...x, medicationsGiven:[...x.medicationsGiven, medDispense.name+(medDispense.qty>1?` x${medDispense.qty}`:'')] }:x)); setInventory(inv=> inv.map(i=> i.name===medDispense.name? { ...i, stock: Math.max(0,i.stock-medDispense.qty)}:i)); setMedDispense({ name:'', qty:1 }); }
  function exportVisits(){
    const headers = [ 'Visit','Student','Class','Section','Status','Triage','Time In','Time Out','Bed','Parent Notified','Medications','Nurse','Doctor' ];
    const rows = visits.map(v=> [v.id,v.studentName,v.class,v.section,v.status,v.triage,v.timeIn,v.timeOut||'',v.bed||'',v.parentNotified?'Yes':'No',v.medicationsGiven.join('|'),v.nurse,v.doctor||'']);
    exportRowsAsCSV(headers, rows, { filename:'infirmary_visits.csv', bom:true });
  }
  function exportInventory(){
    const headers = [ 'ID','Name','Stock','Min','Unit','Expires' ];
    const rows = inventory.map(i=> [i.id,i.name,i.stock,i.min,i.unit,i.expires]);
    exportRowsAsCSV(headers, rows, { filename:'infirmary_inventory.csv', bom:true });
  }
  function exportEmergencies(){
    const headers = [ 'ID','Code','Description','Started','Resolved','Response (m)','Status','Resolved By' ];
    const rows = emergencies.map(e=> { const resp=e.resolvedAt? Math.max(0,Math.round((new Date(e.resolvedAt)-new Date(e.time))/60000)):''; return [e.id,e.code,e.description,e.time,e.resolvedAt||'',resp,e.status,e.resolvedBy||'']; });
    exportRowsAsCSV(headers, rows, { filename:'infirmary_emergencies.csv', bom:true });
  }
  function toggleDuty(member){ setStaff(s=> s.map(m=> m.id===member.id? { ...m, onDuty:!m.onDuty }:m)); }
  function assignDoctor(visitId, doctorName){ setVisits(v=> v.map(x=> x.id===visitId? { ...x, doctor:doctorName }:x)); }
  function triggerEmergency(code){ const id='E-'+(Math.floor(Math.random()*9000)+1000); const entry={ id, code, description:codeDesc||'', time:new Date().toISOString(), status:'Active', resolvedBy:null, resolvedAt:null }; setEmergencies(e=> [entry,...e]); setActiveEmergency(code); setCodeDialog(false); setCodeDesc(''); }
  function resolveEmergency(eid, resolver){ setEmergencies(list=> list.map(e=> e.id===eid? { ...e, status:'Resolved', resolvedBy:resolver, resolvedAt:new Date().toISOString() }:e)); setActiveEmergency(null); }
  function startEditVitals(){ if(!detail) return; setVitalsDraft(detail.vitals); setEditingVitals(true); }
  function saveVitals(){ if(!detail) return; setVisits(v=> v.map(x=> x.id===detail.id? { ...x, vitals:{ ...x.vitals, ...vitalsDraft } }:x)); setEditingVitals(false); }
  function cancelVitals(){ setEditingVitals(false); }
  function setEsi(visitId, score){ setEsiScores(s=> ({...s,[visitId]:score})); setVisits(v=> v.map(x=> x.id===visitId? { ...x, triage: score<=2? 'High': score===3? 'Medium':'Low' }:x)); }

  useEffect(()=> saveLs('inf_visits', visits),[visits]);
  useEffect(()=> saveLs('inf_inventory', inventory),[inventory]);
  useEffect(()=> saveLs('inf_staff', staff),[staff]);
  useEffect(()=> saveLs('inf_emergencies', emergencies),[emergencies]);
  useEffect(()=> saveLs('inf_esi', esiScores),[esiScores]);

  function TriageChip({level}){ const map={ High:'red', Medium:'amber', Low:'emerald'}; return <Badge tone={map[level]||'slate'}>{level}</Badge>; }

  return <div className="p-6 space-y-6 max-w-7xl mx-auto">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Infirmary</h1>
        <p className="text-sm text-slate-500">Triage • Bed Occupancy • Medication Log</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={klass} onChange={e=>setKlass(e.target.value)} className="px-2 py-1.5 rounded-lg border text-sm"><option>All</option>{classes.map(c=> <option key={c}>{c}</option>)}</select>
        <select value={section} onChange={e=>setSection(e.target.value)} className="px-2 py-1.5 rounded-lg border text-sm"><option>All</option>{sections.map(s=> <option key={s}>{s}</option>)}</select>
        <Button onClick={()=>setNewVisitOpen(true)} variant="primary">Admit Visit</Button>
        <Button onClick={()=>setReportOpen(true)}>Report</Button>
      </div>
    </header>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-0"><CardContent className="p-4 space-y-1"><div className="text-xs text-slate-500">In Ward</div><div className="text-2xl font-semibold">{inWard.length}</div></CardContent></Card>
      <Card className="p-0"><CardContent className="p-4 space-y-1"><div className="text-xs text-slate-500">Bed Occupancy</div><div className="text-2xl font-semibold">{bedsUsed}/{bedsTotal}</div></CardContent></Card>
      <Card className="p-0"><CardContent className="p-4 space-y-1"><div className="text-xs text-slate-500">Low Stock</div><div className="text-2xl font-semibold">{lowStock.length}</div></CardContent></Card>
      <Card className="p-0"><CardContent className="p-4 space-y-1"><div className="text-xs text-slate-500">Upcoming Vaccines</div><div className="text-2xl font-semibold">{immunization.length}</div></CardContent></Card>
    </div>

    <div className="flex flex-wrap gap-2 items-center">
      {['triage','inventory','immunization','history','staff','emergencies'].map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full border text-sm ${tab===t?'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
      {tab==='triage' && <label className='flex items-center gap-1 text-xs text-slate-600 ml-2'><input type='checkbox' checked={showOnlyOnDuty} onChange={e=> setShowOnlyOnDuty(e.target.checked)} /> On-duty only</label>}
      <div className="ml-auto flex gap-2 flex-wrap"><Button onClick={exportVisits}>Export Visits</Button><Button onClick={exportInventory}>Export Inventory</Button><Button onClick={exportEmergencies}>Export Emergencies</Button><Button variant='danger' onClick={()=>setCodeDialog(true)}>Trigger Code</Button></div>
    </div>

    {activeEmergency && <div className="rounded-lg border bg-red-600/10 border-red-600 p-3 flex items-center justify-between animate-pulse">
      <div className="text-sm font-medium text-red-700 flex items-center gap-2">🚨 Active {activeEmergency}! Follow protocol.</div>
      <Button onClick={()=> setActiveEmergency(null)}>Ack</Button>
    </div>}

    {tab==='triage' && <Card>
      <CardHeader><CardTitle className="text-sm">Students Under Care ({filteredTriage.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Visit</th><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Symptoms</th><th className="px-3 py-2 text-left">Triage</th><th className="px-3 py-2 text-left">Bed</th><th className="px-3 py-2 text-left">Actions</th></tr></thead>
            <tbody>
              {filteredTriage.map(v=> <tr key={v.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2 font-medium">{v.id}</td>
                <td className="px-3 py-2 cursor-pointer" onClick={()=>setDetail(v)}>{v.studentName}<div className="text-xs text-slate-500">{v.class}-{v.section}</div></td>
                <td className="px-3 py-2 max-w-[200px] truncate" title={v.symptoms}>{v.symptoms}</td>
                <td className="px-3 py-2"><TriageChip level={v.triage} /></td>
                <td className="px-3 py-2">{v.bed||'-'}</td>
                <td className="px-3 py-2 flex flex-wrap gap-2">
                  <Button className="text-xs" onClick={()=>toggleParent(v)}>{v.parentNotified? 'Parent ✔':'Notify'}</Button>
                  <Button className="text-xs" onClick={()=>setDetail(v)}>Detail</Button>
                  <Button className="text-xs" variant="danger" onClick={()=>markReleased(v)}>Release</Button>
                </td>
              </tr>)}
              {filteredTriage.length===0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No active cases</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}

    {tab==='inventory' && <Card>
      <CardHeader><CardTitle className="text-sm">Inventory ({inventory.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Stock</th><th className="px-3 py-2 text-left">Min</th><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-left">Expires</th></tr></thead>
            <tbody>
              {inventory.map(i=> <tr key={i.id} className={`border-t ${i.stock<=i.min? 'bg-amber-50':''}`}>
                <td className="px-3 py-2 font-medium">{i.id}</td>
                <td className="px-3 py-2">{i.name}</td>
                <td className="px-3 py-2">{i.stock}</td>
                <td className="px-3 py-2">{i.min}</td>
                <td className="px-3 py-2">{i.unit}</td>
                <td className="px-3 py-2">{i.expires}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}

    {tab==='immunization' && <Card>
      <CardHeader><CardTitle className="text-sm">Immunization Schedule</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Class</th><th className="px-3 py-2 text-left">Vaccine</th><th className="px-3 py-2 text-left">Due</th></tr></thead>
            <tbody>
              {immunization.map(r=> <tr key={r.student+r.vaccine} className="border-t"><td className="px-3 py-2 font-medium">{r.student}</td><td className="px-3 py-2">{r.class}-{r.section}</td><td className="px-3 py-2">{r.vaccine}</td><td className="px-3 py-2">{r.due}</td></tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}

    {tab==='history' && <Card>
      <CardHeader><CardTitle className="text-sm">Recent History ({filteredHistory.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Visit</th><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Triage</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">In</th><th className="px-3 py-2 text-left">Out</th></tr></thead>
            <tbody>
              {filteredHistory.map(v=> <tr key={v.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={()=>setDetail(v)}>
                <td className="px-3 py-2 font-medium">{v.id}</td>
                <td className="px-3 py-2">{v.studentName}</td>
                <td className="px-3 py-2">{v.triage}</td>
                <td className="px-3 py-2">{v.status}</td>
                <td className="px-3 py-2">{new Date(v.timeIn).toLocaleString()}</td>
                <td className="px-3 py-2">{v.timeOut? new Date(v.timeOut).toLocaleString():'-'}</td>
              </tr>)}
              {filteredHistory.length===0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}

    {tab==='staff' && <Card>
      <CardHeader><CardTitle className="text-sm">Medical Staff ({staff.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className='px-3 py-2 text-left'>Name</th><th className='px-3 py-2 text-left'>Role</th><th className='px-3 py-2 text-left'>Specialty</th><th className='px-3 py-2 text-left'>On Duty</th><th className='px-3 py-2 text-left'>Actions</th></tr></thead>
            <tbody>
              {staff.map(m=> <tr key={m.id} className="border-t">
                <td className='px-3 py-2 font-medium'>{m.name}</td>
                <td className='px-3 py-2'>{m.role}</td>
                <td className='px-3 py-2'>{m.specialty}</td>
                <td className='px-3 py-2'>{m.onDuty? <Badge tone='emerald'>Yes</Badge>:<Badge tone='red'>No</Badge>}</td>
                <td className='px-3 py-2'><Button className='text-xs' onClick={()=>toggleDuty(m)}>{m.onDuty? 'Set Off':'Set On'}</Button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}

    {tab==='emergencies' && <Card>
      <CardHeader><CardTitle className='text-sm'>Emergency Log ({emergencies.length})</CardTitle></CardHeader>
      <CardContent>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead className='bg-red-50 text-red-700'><tr><th className='px-3 py-2 text-left'>ID</th><th className='px-3 py-2 text-left'>Code</th><th className='px-3 py-2 text-left'>Description</th><th className='px-3 py-2 text-left'>Started</th><th className='px-3 py-2 text-left'>Resolved</th><th className='px-3 py-2 text-left'>Response (m)</th><th className='px-3 py-2 text-left'>Status</th><th className='px-3 py-2 text-left'>Actions</th></tr></thead>
            <tbody>
              {emergencies.map(e=> { const resp=e.resolvedAt? Math.max(0,Math.round((new Date(e.resolvedAt)-new Date(e.time))/60000)):''; return (
                <tr key={e.id} className='border-t'>
                  <td className='px-3 py-2 font-medium'>{e.id}</td>
                  <td className='px-3 py-2'>{e.code}</td>
                  <td className='px-3 py-2 max-w-[220px] truncate' title={e.description}>{e.description||'—'}</td>
                  <td className='px-3 py-2'>{new Date(e.time).toLocaleTimeString()}</td>
                  <td className='px-3 py-2'>{e.resolvedAt? new Date(e.resolvedAt).toLocaleTimeString():'—'}</td>
                  <td className='px-3 py-2'>{resp}</td>
                  <td className='px-3 py-2'>{e.status}</td>
                  <td className='px-3 py-2 flex gap-2'>{e.status==='Active' && <Button className='text-xs' onClick={()=>resolveEmergency(e.id,'Dispatch')}>Resolve</Button>}</td>
                </tr> ); })}
              {emergencies.length===0 && <tr><td colSpan={8} className='px-3 py-6 text-center text-slate-500'>No emergencies logged</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}

    {/* Detail Drawer */}
    {detail && <div className="fixed inset-0 bg-slate-900/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:w-[820px] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between"><h3 className="text-sm font-semibold">Visit Detail: {detail.studentName}</h3><button onClick={()=>setDetail(null)} className="text-slate-500 hover:text-slate-700">✕</button></div>
        <div className="p-4 overflow-y-auto text-sm space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge>{detail.class}-{detail.section}</Badge>
            <TriageChip level={detail.triage} />
            {detail.allergies && <Badge tone='amber'>{detail.allergies}</Badge>}
            <Badge tone={detail.status==='Released'?'emerald': detail.status==='Referred'?'red':'slate'}>{detail.status}</Badge>
          </div>
          <div className="grid md:grid-cols-4 gap-2">
            {['temp','pulse','spo2','bp'].map(k=> <div key={k} className="rounded-lg border p-2"><div className="text-[10px] text-slate-500 uppercase">{k}</div><div className="font-medium">{editingVitals? <Input value={vitalsDraft[k]} onChange={e=> setVitalsDraft(d=> ({...d,[k]:e.target.value}))} />: detail.vitals[k]}</div></div>)}
          </div>
          <div>
            <div className="text-xs text-slate-500">Symptoms</div>
            <div className="font-medium">{detail.symptoms}</div>
          </div>
          <div className='flex flex-wrap gap-3 items-center'>
            <div className='text-xs text-slate-500'>ESI Score:</div>
            {[1,2,3,4,5].map(s=> <Button key={s} className={`text-xs ${esiScores[detail.id]===s? 'bg-slate-800 text-white':''}`} onClick={()=> setEsi(detail.id,s)}>{s}</Button>)}
            {esiScores[detail.id] && <Badge tone='amber'>Level {esiScores[detail.id]}</Badge>}
          </div>
          <div>
            <div className="text-xs text-slate-500">Notes</div>
            <div className="font-medium whitespace-pre-wrap">{detail.notes||'—'}</div>
          </div>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <div className="text-xs text-slate-500">Medications</div>
              <div className="font-medium flex flex-wrap gap-1">{detail.medicationsGiven.map(m=> <Badge key={m}>{m}</Badge>)||'—'}</div>
            </div>
            <div className='space-y-1'>
              <div className='text-xs text-slate-500'>Assigned Doctor</div>
              <select value={detail.doctor||''} onChange={e=> assignDoctor(detail.id,e.target.value)} className='px-2 py-1.5 border rounded-lg text-sm'>
                <option value=''>Unassigned</option>
                {staff.filter(s=> s.role==='Doctor' && s.onDuty).map(d=> <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Medication</label><select value={medDispense.name} onChange={e=>setMedDispense(s=>({...s,name:e.target.value}))} className="px-2 py-1.5 border rounded-lg text-sm"><option value=''>Select</option>{inventory.map(i=> <option key={i.id} value={i.name}>{i.name} ({i.stock})</option>)}</select></div>
            <div className="flex flex-col gap-1 w-24"><label className="text-xs font-medium text-slate-500">Qty</label><Input type='number' min={1} value={medDispense.qty} onChange={e=>setMedDispense(s=>({...s, qty:Number(e.target.value)||1}))} /></div>
            <Button onClick={()=>dispenseMedication(detail)} disabled={!medDispense.name} className="mt-5">Dispense</Button>
          </div>
          <div className="text-xs text-slate-500">Guardian: {detail.guardianPhone||'n/a'}</div>
        </div>
        <div className="p-4 border-t flex flex-wrap justify-between gap-2">
          <div className='flex gap-2'>
            {editingVitals? <>
              <Button onClick={cancelVitals}>Cancel</Button>
              <Button variant='primary' onClick={saveVitals}>Save Vitals</Button>
            </>: <Button onClick={startEditVitals}>Edit Vitals</Button>}
          </div>
          <div className='flex gap-2'>
            <Button onClick={()=>toggleParent(detail)}>{detail.parentNotified? 'Parent Notified':'Notify Parent'}</Button>
            <Button onClick={()=>markReferred(detail)}>Refer</Button>
            <Button onClick={()=>markReleased(detail)} variant='danger'>Release</Button>
          </div>
        </div>
      </div>
    </div>}

    {/* New Visit Modal */}
    {newVisitOpen && <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:w-[640px] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between"><h3 className="text-sm font-semibold">Admit New Visit</h3><button onClick={()=>setNewVisitOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button></div>
        <div className="p-4 overflow-y-auto text-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['studentName','class','section','rollNo','age','gender','bed','triage','doctor'].map(f=> <label key={f} className="grid gap-1 text-xs font-medium text-slate-600"><span>{f}</span><Input value={form[f]} onChange={e=>setForm(s=>({...s,[f]:e.target.value}))} /></label>)}
          </div>
          <label className="grid gap-1 text-xs font-medium text-slate-600"><span>Symptoms</span><Textarea value={form.symptoms} onChange={e=>setForm(s=>({...s,symptoms:e.target.value}))} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-600"><span>Notes</span><Textarea value={form.notes} onChange={e=>setForm(s=>({...s,notes:e.target.value}))} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-600"><span>Allergies</span><Input value={form.allergies} onChange={e=>setForm(s=>({...s,allergies:e.target.value}))} /></label>
        </div>
        <div className="p-4 border-t flex justify-end gap-2"><Button onClick={()=>setNewVisitOpen(false)}>Cancel</Button><Button variant='primary' onClick={admitNewVisit}>Admit</Button></div>
      </div>
    </div>}

    {codeDialog && <div className='fixed inset-0 bg-slate-900/50 z-50 flex items-end md:items-center justify-center'>
      <div className='bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:w-[520px] max-h-[90vh] flex flex-col'>
        <div className='p-4 border-b flex items-center justify-between'><h3 className='text-sm font-semibold'>Trigger Emergency Code</h3><button onClick={()=> setCodeDialog(false)} className='text-slate-500 hover:text-slate-700'>✕</button></div>
        <div className='p-4 overflow-y-auto text-sm space-y-4'>
          <div className='grid gap-2'>
            <div className='text-xs font-medium text-slate-600'>Select Code</div>
            <div className='flex flex-wrap gap-2'>
              {emergencyCodes.map(c=> <Button key={c} className={`text-xs ${activeEmergency===c?'ring-2 ring-red-500':''}`} onClick={()=> setActiveEmergency(c)}>{c}</Button>)}
            </div>
          </div>
            <label className='grid gap-1 text-xs font-medium text-slate-600'><span>Description / Location</span><Textarea value={codeDesc} onChange={e=> setCodeDesc(e.target.value)} /></label>
            <div className='text-xs text-slate-500'>Code will appear as active banner until resolved.</div>
        </div>
        <div className='p-4 border-t flex justify-end gap-2'><Button onClick={()=> setCodeDialog(false)}>Cancel</Button><Button variant='danger' disabled={!activeEmergency} onClick={()=> triggerEmergency(activeEmergency)}>Trigger</Button></div>
      </div>
    </div>}

    {/* Report Modal */}
    {reportOpen && <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:w-[520px] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between"><h3 className="text-sm font-semibold">Infirmary Report</h3><button onClick={()=>setReportOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button></div>
        <div className="p-4 overflow-y-auto text-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3"><div className="text-[11px] uppercase text-slate-500">Total Visits</div><div className="text-xl font-semibold">{visits.length}</div></div>
            <div className="rounded-lg border p-3"><div className="text-[11px] uppercase text-slate-500">Released</div><div className="text-xl font-semibold">{visits.filter(v=>v.status==='Released').length}</div></div>
            <div className="rounded-lg border p-3"><div className="text-[11px] uppercase text-slate-500">Referred</div><div className="text-xl font-semibold">{visits.filter(v=>v.status==='Referred').length}</div></div>
            <div className="rounded-lg border p-3"><div className="text-[11px] uppercase text-slate-500">Parent Notified</div><div className="text-xl font-semibold">{visits.filter(v=>v.parentNotified).length}</div></div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Top Medications Dispensed</div>
            <ul className="list-disc ml-5 space-y-1">
              {Object.entries(visits.reduce((acc,v)=>{v.medicationsGiven.forEach(m=>{const key=m.split(' x')[0]; acc[key]=(acc[key]||0)+1;}); return acc;},{}) ).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([k,v])=> <li key={k}>{k} <span className="text-xs text-slate-500">({v})</span></li>)}
            </ul>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end"><Button onClick={()=>setReportOpen(false)}>Close</Button></div>
      </div>
    </div>}
  </div>;
}
