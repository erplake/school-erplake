import React, { useState, useMemo } from 'react';
import { useRBAC, RequireCapability } from '../../context/RBACContext';
// Minimal local UI primitives (replace with shadcn/ui if present)
const Button = ({ children, className='', variant='default', size='md', ...p }) => (
  <button {...p} className={`inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap ${
    variant==='outline' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : variant==='ghost' ? 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100' : 'bg-primary border-primary text-white hover:bg-primary/90'
  } ${size==='sm'?'h-8 px-2':'h-9 px-3'} ${className}`}>{children}</button>
);
const Badge = ({ children, variant='secondary', className='' }) => (
  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${variant==='outline'?'bg-white border-slate-300 text-slate-600': variant==='danger'?'bg-rose-50 border-rose-200 text-rose-700': variant==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-slate-100 border-slate-200 text-slate-700'} ${className}`}>{children}</span>
);
const Card = ({ children, className='' }) => <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
const CardContent = ({ children, className='' }) => <div className={`p-4 ${className}`}>{children}</div>;
const Input = (p) => <input {...p} className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
const Textarea = (p) => <textarea {...p} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
const Progress = ({ value=0 }) => <div className="h-1.5 rounded bg-slate-200 overflow-hidden"><div className="h-full bg-primary" style={{width:`${Math.min(100,Math.max(0,value))}%`}} /></div>;

// Icons (lucide-lite subset)
const Clock = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const ArrowRight = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>;
const X = (p) => <svg {...p} viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const Check = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const Copy = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const ExternalLink = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>;
const Filter = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>;
const FileCheck = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>;

const STAGES = [
  { id: 'inquiry', label: 'Inquiry', role: 'Counselor', slaHours: 24 },
  { id: 'screening', label: 'Screening', role: 'Admissions', slaHours: 48 },
  { id: 'tour', label: 'Campus Tour', role: 'Counselor', slaHours: 72 },
  { id: 'application', label: 'Application', role: 'Parent', slaHours: 96 },
  { id: 'assessment', label: 'Assessment', role: 'Academic', slaHours: 120 },
  { id: 'offer', label: 'Offer', role: 'Principal', slaHours: 48 },
  { id: 'fees', label: 'Fee Payment', role: 'Accounts', slaHours: 72 },
  { id: 'enrolled', label: 'Enrolled', role: '—', slaHours: 0 },
  { id: 'waitlisted', label: 'Waitlisted', role: 'Admissions', slaHours: 0 },
  { id: 'rejected', label: 'Rejected', role: 'Admissions', slaHours: 0 },
];
const WINGS = ['Pre-Primary','Primary','Middle','Senior'];
const GRADES = ['Nur','KG','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const SOURCES = ['Walk-in','Website','WhatsApp','Referral','Event','Social','Fair','Agent'];
const OWNERS = ['Aditi','Rahul','Neeraj','Sana','Priya','Aman'];
const DOC_KEYS = ['birth','id','photo','mark'];

function now(){ return new Date().toISOString(); }
function addHours(ts, h){ return new Date(new Date(ts).getTime()+h*3600_000).toISOString(); }
function nextStep(stage){
  switch(stage){
    case 'inquiry': return 'Screening call';
    case 'screening': return 'Schedule campus tour';
    case 'tour': return 'Share application link';
    case 'application': return 'Academic assessment';
    case 'assessment': return 'Prepare offer';
    case 'offer': return 'Fee payment';
    case 'fees': return 'Welcome & onboarding';
    case 'enrolled': return 'Onboarding';
    default: return '—';
  }
}
function daysBetween(aIso,bIso){ const a=new Date(aIso).getTime(); const b=new Date(bIso).getTime(); return Math.round((b-a)/86400000); }

function SLA({ dueAt }){
  const due = new Date(dueAt).getTime();
  const deltaHrs = Math.round((due - Date.now())/3600000);
  let variant='outline';
  let Icon=Clock;
  if(deltaHrs < 0){ variant='danger'; }
  else if(deltaHrs < 12){ variant='secondary'; }
  return <Badge variant={variant} className="gap-1"><Icon className="h-3 w-3" /> {deltaHrs<0?`${Math.abs(deltaHrs)}h overdue`:`${deltaHrs}h`}</Badge>;
}
function Engagement({ score }){
  return <div className="space-y-1"><div className="flex items-center justify-between text-xs text-slate-500"><span>Engagement</span><span>{score}%</span></div><Progress value={score} /></div>;
}

const seedApplicants = [
  { id:'A-101', child:'Aarav Sharma', parent:'Rohit', phone:'+91-98xxx', email:'rohit@example.com', grade:'I', wing:'Primary', source:'Website', owner:'Aditi', stage:'inquiry', lastTouch:now(), dueAt:addHours(now(),18), engagement:62, docs:{birth:false,id:false,photo:false,mark:false}, notes:'Asked about transport and meals.', tasks:[{ id:'t1', title:'Call back @6pm', responsible:'Aditi', due:now(), done:false }], timeline:[{ t:now(), who:'Aditi', what:'Inquiry form submitted' },{ t:now(), who:'System', what:'Welcome WhatsApp sent' }] },
  { id:'A-102', child:'Sara Khan', parent:'Imran', phone:'+91-99xxx', email:'imran@example.com', grade:'VI', wing:'Middle', source:'Referral', owner:'Rahul', stage:'tour', lastTouch:now(), dueAt:addHours(now(),40), engagement:78, docs:{birth:true,id:true,photo:false,mark:false}, notes:'Allergic to peanuts; prefers bus route B.', tasks:[{ id:'t2', title:'Confirm tour slot', responsible:'Rahul', due:now(), done:false }], timeline:[{ t:now(), who:'Rahul', what:'Screening call done' }] },
  { id:'A-103', child:'Vihaan Gupta', parent:'Sneha', phone:'+91-97xxx', email:'sneha@example.com', grade:'XI', wing:'Senior', source:'Social', owner:'Sana', stage:'application', lastTouch:now(), dueAt:addHours(now(),10), engagement:44, docs:{birth:true,id:true,photo:true,mark:false}, notes:'Needs scholarship info.', tasks:[{ id:'t3', title:'Email scholarship brochure', responsible:'Sana', due:now(), done:true }], timeline:[{ t:now(), who:'System', what:'Application link shared' }] },
  { id:'A-104', child:'Advika Mehta', parent:'Puneet', phone:'+91-95xxx', email:'puneet@example.com', grade:'KG', wing:'Pre-Primary', source:'Walk-in', owner:'Priya', stage:'assessment', lastTouch:now(), dueAt:addHours(now(),-5), engagement:55, docs:{birth:true,id:false,photo:false,mark:false}, notes:'Sibling in Grade III.', tasks:[{ id:'t4', title:'Schedule play-date assessment', responsible:'Priya', due:now(), done:false }], timeline:[{ t:now(), who:'Priya', what:'Tour completed' }] },
];

function useKpi(applicants){
  return useMemo(()=>{
    const total = applicants.length;
    const byStage = Object.fromEntries(STAGES.map(s=>[s.id, applicants.filter(a=>a.stage===s.id).length]));
    const conv = {};
    STAGES.forEach((s,i)=>{ if(i>0){ const prev=STAGES[i-1].id; const prevCount = applicants.filter(a=>a.stage===prev).length||1; conv[s.id]= +( (byStage[s.id]/prevCount)*100 ).toFixed(1); } });
    const overdue = applicants.filter(a=> new Date(a.dueAt).getTime() < Date.now()).length;
    return { total, byStage, conv, overdue };
  },[applicants]);
}

function StageColumn({ stage, cards, onOpen }){
  return <div className="min-w-[300px] max-w-[360px] flex-1">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">{stage.role}</Badge>
        <h3 className="text-sm font-semibold text-slate-800">{stage.label}</h3>
      </div>
      <Badge variant="outline" className="border-slate-200">SLA {stage.slaHours}h</Badge>
    </div>
    <div className="space-y-2">
      {cards.map(a=> <Card key={a.id} className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium leading-5 text-slate-800">{a.child} <span className="text-xs text-slate-500">({a.grade})</span></div>
              <div className="text-xs text-slate-500">{a.parent} • {a.phone}</div>
            </div>
            <SLA dueAt={a.dueAt} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Badge variant="outline" className="truncate border-slate-200">{a.source}</Badge>
            <Badge variant="secondary" className="truncate bg-slate-100 text-slate-700 border-slate-200">SPOC: {a.owner}</Badge>
            <Badge variant="outline" className="truncate border-slate-200">Wing: {a.wing}</Badge>
          </div>
          <div className="text-[11px] text-slate-600">Next: {nextStep(a.stage)}</div>
          <Engagement score={a.engagement} />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Last touch {new Date(a.lastTouch).toLocaleDateString()}</div>
            <Button size="sm" variant="outline" onClick={()=>onOpen(a)} className="h-8 px-2">Open</Button>
          </div>
        </CardContent>
      </Card>)}
      {cards.length===0 && <div className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-6 text-center bg-white">No items</div>}
    </div>
  </div>;
}

export default function AdmissionsManagement(){
  const { hasCapability } = useRBAC();
  const canView = hasCapability('admissions.view');
  const canManage = hasCapability('admissions.manage');
  if(!canView){
    return <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Admissions Management</h1>
      <div className="text-sm text-slate-600 border rounded-md p-6 bg-white">You don't have access to view Admissions. Please contact an administrator.</div>
    </div>;
  }
  const [applicants,setApplicants] = useState(()=>{
    try{ const raw = localStorage.getItem('adm_applicants'); if(raw){ return JSON.parse(raw); } }catch(e){}
    return seedApplicants;
  });
  const [q,setQ] = useState('');
  const [wing,setWing] = useState('All');
  const [grade,setGrade] = useState('All');
  const [source,setSource] = useState('All');
  const [owner,setOwner] = useState('All');
  const [tab,setTab] = useState('pipeline');
  const [open,setOpen] = useState(false);
  const [selected,setSelected] = useState(null);
  const [showChecklist,setShowChecklist] = useState(false);
  const [portalOpen,setPortalOpen] = useState(false);
  const [captureOpen,setCaptureOpen] = useState(false);
  const [lockOwnerAfter,setLockOwnerAfter] = useState('screening');
  const [autoRoute,setAutoRoute] = useState(true);
  const [escalateHours,setEscalateHours] = useState(36);
  const [publicFormBase,setPublicFormBase] = useState('https://admissions.example.com/apply');
  const [utmSource,setUtmSource] = useState('Website');
  const [templates,setTemplates] = useState({
    whatsapp:'Hi {parent}, thanks for your interest in {school}. Your next step: {next_step}.',
    email:'Dear {parent},\n\nPlease find the application link: {link}.\n\nRegards, Admissions',
    reminder:'Friendly reminder: action pending for {child} — {next_step}',
  });
  const [slaMap,setSlaMap] = useState(Object.fromEntries(STAGES.map(s=>[s.id,s.slaHours])));
  const [autoReminders,setAutoReminders] = useState(true);
  const [enforceWindows,setEnforceWindows] = useState(true);

  // persistence
  React.useEffect(()=>{ try{ localStorage.setItem('adm_applicants', JSON.stringify(applicants)); }catch(e){} },[applicants]);

  const filtered = useMemo(()=>{
    return applicants.filter(a=> (wing==='All'||a.wing===wing) && (grade==='All'||a.grade===grade) && (source==='All'||a.source===source) && (owner==='All'||a.owner===owner) && (q==='' || a.child.toLowerCase().includes(q.toLowerCase()) || a.parent.toLowerCase().includes(q.toLowerCase()) ));
  },[applicants,wing,grade,source,owner,q]);

  const k = useKpi(applicants);

  function openApplicant(a){ setSelected(a); setOpen(true); }

  function moveStage(a, direction){
    const idx = STAGES.findIndex(s=>s.id===a.stage);
    if(idx===-1) return;
    let targetIdx = direction==='forward'? idx+1: idx-1;
    if(targetIdx<0 || targetIdx>=STAGES.length) return;
    const nextStage = STAGES[targetIdx].id;
    setApplicants(prev=> prev.map(x=> x.id===a.id ? { ...x, stage: nextStage, dueAt: addHours(now(), slaMap[nextStage]||24), timeline:[...x.timeline, { t:now(), who:'You', what:`Moved to ${nextStage}` }]}: x));
  }

  function addInteraction(a, what, who='You'){
    setApplicants(prev=> prev.map(x=> x.id===a.id ? { ...x, lastTouch: now(), timeline:[...x.timeline, { t:now(), who, what }]}: x));
  }
  function toggleDoc(a,key){
    setApplicants(prev=> prev.map(x=> x.id===a.id ? { ...x, docs:{...x.docs,[key]: !x.docs[key]}, timeline:[...x.timeline,{ t:now(), who:'You', what:`Doc ${key} ${x.docs[key]?'removed':'received'}` }]}: x));
  }

  const stageBuckets = useMemo(()=>{
    return STAGES.map(s=> ({ stage:s, cards: filtered.filter(a=>a.stage===s.id) }));
  },[filtered]);

  const tasks = useMemo(()=> applicants.flatMap(a=> a.tasks.map(t=> ({...t, applicantId:a.id, applicant:a.child }))) , [applicants]);

  function toggleTaskDone(taskId){
    setApplicants(prev=> prev.map(a=> ({...a, tasks:a.tasks.map(t=> t.id===taskId? {...t, done:!t.done}: t)})));
  }

  function addApplicantQuick(sourceLabel=SOURCES[0]){
    const id = 'A-'+ (100 + applicants.length + 1);
    const base = { id, child:'New Child', parent:'Parent', phone:'+91-', email:'', grade:'I', wing:'Primary', source:sourceLabel, owner:OWNERS[0], stage:'inquiry', lastTouch:now(), dueAt:addHours(now(), slaMap['inquiry']), engagement:10, docs:{birth:false,id:false,photo:false,mark:false}, notes:'', tasks:[], timeline:[{ t:now(), who:'You', what:'Quick added' }] };
    setApplicants(p=>[base,...p]);
  }

  function urlWithSource(base, src){ const u = new URL(base); u.searchParams.set('utm_source', src); return u.toString(); }
  function copy(text){ navigator.clipboard?.writeText(text); }

  function exportCSV(){
    const rows = applicants.map(a=> ({ id:a.id, child:a.child, stage:a.stage, owner:a.owner, source:a.source, wing:a.wing, grade:a.grade, dueAt:a.dueAt, engagement:a.engagement, lastTouch:a.lastTouch }));
    if(!rows.length) return;
    // Lazy import to avoid circulars if any
    import('../../utils/csv').then(mod=> {
      mod.exportObjectsAsCSV(rows, 'admissions.csv', { bom:true });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Admissions Management</h1>
        <div className="flex items-center gap-2">
          {canManage && <Button onClick={()=>addApplicantQuick()}>Quick Add</Button>}
          {canManage && <Button variant="outline" onClick={exportCSV}>Export CSV</Button>}
          {canManage && <Button variant="outline" onClick={()=>setPortalOpen(true)}>Public Form</Button>}
          {canManage && <Button variant="outline" onClick={()=>setTab(t=> t==='pipeline'?'settings':'pipeline')}>{tab==='pipeline'?'Settings':'Back to Pipeline'}</Button>}
        </div>
      </div>

      {tab==='pipeline' && (
        <>
          <div className="grid md:grid-cols-5 gap-3">
            <Input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
            <select className="h-9 rounded-md border border-slate-300 text-sm px-2" value={wing} onChange={e=>setWing(e.target.value)}><option>All</option>{WINGS.map(w=> <option key={w}>{w}</option>)}</select>
            <select className="h-9 rounded-md border border-slate-300 text-sm px-2" value={grade} onChange={e=>setGrade(e.target.value)}><option>All</option>{GRADES.map(g=> <option key={g}>{g}</option>)}</select>
            <select className="h-9 rounded-md border border-slate-300 text-sm px-2" value={source} onChange={e=>setSource(e.target.value)}><option>All</option>{SOURCES.map(s=> <option key={s}>{s}</option>)}</select>
            <select className="h-9 rounded-md border border-slate-300 text-sm px-2" value={owner} onChange={e=>setOwner(e.target.value)}><option>All</option>{OWNERS.map(o=> <option key={o}>{o}</option>)}</select>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageBuckets.map(b=> <StageColumn key={b.stage.id} stage={b.stage} cards={b.cards} onOpen={openApplicant} />)}
          </div>
        </>
      )}

      {tab==='settings' && canManage && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-medium">SLA Configuration</h2>
              {STAGES.map(s=> (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="w-28 text-slate-600">{s.label}</span>
                  <Input type="number" value={slaMap[s.id]} onChange={e=> setSlaMap(m=>({...m,[s.id]:+e.target.value}))} />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoReminders} onChange={e=>setAutoReminders(e.target.checked)} /> <span>Auto reminders</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enforceWindows} onChange={e=>setEnforceWindows(e.target.checked)} /> <span>Enforce stage windows</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-medium">Public Form</h2>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Base URL</label>
                <Input value={publicFormBase} onChange={e=>setPublicFormBase(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Default UTM Source</label>
                <select className="h-9 rounded-md border border-slate-300 text-sm px-2" value={utmSource} onChange={e=>setUtmSource(e.target.value)}>{SOURCES.map(s=> <option key={s}>{s}</option>)}</select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Quick Links</label>
                <div className="space-y-2 text-xs">
                  {SOURCES.map(s=>{
                    const link = urlWithSource(publicFormBase,s);
                    return <div key={s} className="flex items-center gap-2">
                      <Input readOnly value={link} />
                      <Button variant="outline" size="sm" onClick={()=>copy(link)}><Copy className="h-4 w-4" /></Button>
                    </div>;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-medium">Message Templates</h2>
              {Object.entries(templates).map(([k,v])=> (
                <div key={k} className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-slate-500">{k}</label>
                  <Textarea rows={k==='email'?5:3} value={v} onChange={e=> setTemplates(t=>({...t,[k]:e.target.value}))} />
                </div>
              ))}
              <p className="text-[11px] text-slate-500">Variables: {'{parent} {child} {next_step} {link} {school}'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {open && selected && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-10">
          <div className="bg-white w-full max-w-3xl rounded-lg border border-slate-200 shadow-lg flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-medium">{selected.child} <span className="text-sm text-slate-500">({selected.stage})</span></h2>
              <div className="flex items-center gap-2">
                {canManage && <Button variant="outline" size="sm" onClick={()=>moveStage(selected,'back')}>Back</Button>}
                {canManage && <Button size="sm" onClick={()=>moveStage(selected,'forward')}>Advance <ArrowRight className="h-4 w-4 ml-1" /></Button>}
                <button onClick={()=>setOpen(false)} className="p-1 rounded hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">Parent: </span>{selected.parent}</div>
                    <div><span className="text-slate-500">Phone: </span>{selected.phone}</div>
                    <div><span className="text-slate-500">Email: </span>{selected.email || '—'}</div>
                    <div><span className="text-slate-500">Owner: </span>{selected.owner}</div>
                    <div><span className="text-slate-500">Wing: </span>{selected.wing}</div>
                    <div><span className="text-slate-500">Grade: </span>{selected.grade}</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Documents</h3>
                    <div className="flex flex-wrap gap-2">
                      {DOC_KEYS.map(k=> <button key={k} onClick={()=>toggleDoc(selected,k)} className={`px-2 py-1 rounded-md border text-xs ${selected.docs[k]?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-slate-50 border-slate-200 text-slate-600'}`}>{k}{selected.docs[k] && <Check className="h-3 w-3 inline ml-1" />}</button>)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Interactions</h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2 bg-slate-50/50">
                      {selected.timeline.map((l,i)=>(<div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                        <div className="truncate"><span className="text-slate-500 mr-1">{new Date(l.t).toLocaleString()}:</span>{l.what}</div>
                        <span className="text-slate-400 ml-2 shrink-0">— {l.who}</span>
                      </div>))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Add note" value={''} onChange={()=>{}} onKeyDown={(e)=>{ if(e.key==='Enter'){ addInteraction(selected, e.currentTarget.value); e.currentTarget.value=''; } }} />
                      <Button size="sm" onClick={()=>{ const inp = prompt('Interaction note'); if(inp) addInteraction(selected, inp); }}>Add</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Tasks</h3>
                    <div className="space-y-1">
                      {selected.tasks.map(t=> <label key={t.id} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-slate-50 border border-transparent">
                        <input type="checkbox" checked={t.done} onChange={()=>toggleTaskDone(t.id)} />
                        <span className={t.done?'line-through text-slate-400':''}>{t.title}</span>
                        <span className="ml-auto text-slate-400">{t.responsible}</span>
                      </label>)}
                      {canManage && <Button size="sm" variant="outline" onClick={()=>{ const title = prompt('Task title'); if(title){ setApplicants(prev=> prev.map(a=> a.id===selected.id ? { ...a, tasks:[...a.tasks,{ id: 't'+Math.random().toString(36).slice(2,7), title, responsible:'You', due: now(), done:false }]} : a)); } }}>Add Task</Button>}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Progress</h3>
                    <Engagement score={selected.engagement} />
                    <div className="text-[11px] text-slate-500">Due <SLA dueAt={selected.dueAt} /></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Stage Info</h3>
                    <div className="text-xs text-slate-600">Next step: {nextStep(selected.stage)}</div>
                    <div className="text-xs text-slate-600">In pipeline: {daysBetween(selected.timeline[0]?.t, now())} days</div>
                  </div>
                  {canManage && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Notes</h3>
                      <Textarea rows={5} value={selected.notes} onChange={e=> setApplicants(prev=> prev.map(a=> a.id===selected.id ? { ...a, notes:e.target.value }: a))} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
