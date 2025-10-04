import React, { useState, useMemo } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';

// Lightweight primitives (kept local; could be abstracted later)
const Button = ({ as:Cmp='button', className='', variant='default', ...props }) => {
  const variants = {
    default: 'border-slate-200 bg-white hover:bg-slate-50',
    primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800',
    subtle: 'border-transparent bg-slate-100 hover:bg-slate-200',
    danger: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-500'
  };
  return <Cmp className={'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium shadow-sm border transition '+variants[variant]+" "+className} {...props} />;
};
const badgePalette = {
  slate:'bg-slate-100 text-slate-700 border-slate-200',
  blue:'bg-blue-100 text-blue-700 border-blue-200',
  emerald:'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber:'bg-amber-100 text-amber-700 border-amber-200',
  rose:'bg-rose-100 text-rose-700 border-rose-200',
  violet:'bg-violet-100 text-violet-700 border-violet-200'
};
const Badge = ({ children, tone='slate', className='' }) => <span className={'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border '+(badgePalette[tone]||badgePalette.slate)+' '+className}>{children}</span>;
const Card = ({ title, actions, children, className='' }) => <div className={'rounded-2xl border border-slate-200 bg-white shadow-sm '+className}>{(title||actions)&&<div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h3 className="text-sm font-semibold text-slate-800">{title}</h3><div className="flex flex-wrap gap-2">{actions}</div></div>}<div className="p-4 space-y-4">{children}</div></div>;
const Modal = ({ open, onClose, title, children, footer, size='lg' }) => { if(!open) return null; const maxW = size==='sm'?'max-w-sm': size==='md'?'max-w-xl':'max-w-2xl'; return <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}><div className={"w-full "+maxW+" rounded-2xl border border-slate-200 bg-white shadow-xl"} onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">{title}</h4><button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button></div><div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>{footer && <div className="border-t px-4 py-3">{footer}</div>}</div></div>; };

// Sample Data based on spec
const days = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const nepTags = [ 'Experiential','Inquiry','Integrated','Assessment for Learning','Art-Integrated','Skills'];
const substituteTeachers = [ 'R. Gupta (Math)','S. Iyer (Science)','P. Kaur (English)','V. Menon (Social Sci)','A. Khan (Computer)' ];
let planAutoId = 3;
const initialWeekly = {
  weekOf: new Date(),
  items:[
    { id:1, day:'Mon', time:'08:30', subject:'Math', topic:'Fractions – intro', method:'Activity + board work', assessment:'Exit ticket', nep:['Experiential'], status:'Draft', attachments:[], substitute:'', approvals:{ submitted:false, sl:false, hm:false } },
    { id:2, day:'Tue', time:'10:15', subject:'Science', topic:'Plant parts', method:'Lab observation', assessment:'Worksheet', nep:['Inquiry'], status:'Draft', attachments:[], substitute:'', approvals:{ submitted:false, sl:false, hm:false } }
  ]
};
const samplePayslips = [ { id:'2025-06', month:'Jun 2025', gross:78000, net:65500, status:'Paid', url:'#' }, { id:'2025-05', month:'May 2025', gross:78000, net:65320, status:'Paid', url:'#' } ];
const sampleAttendance = [ { date:'2025-09-01', mark:'P' },{ date:'2025-09-02', mark:'P' },{ date:'2025-09-03', mark:'A' },{ date:'2025-09-04', mark:'P' },{ date:'2025-09-05', mark:'P' } ];
const sampleQualifications = [ { id:1, name:'B.Ed.', year:2018, institute:'DU', verified:true }, { id:2, name:'M.Sc. Mathematics', year:2016, institute:'IITD', verified:true } ];
const sampleWorkshops = { attended:[ { id:1, title:'NEP 2020 Classroom Practices', date:'2025-07-10', hours:6, org:'CBSE' } ], hosted:[{ id:2, title:'Peer Learning in Math', date:'2025-08-22', hours:3, org:'School'}] };
const sampleDuties = [ { id:1, label:'Morning assembly (Sep Week 2)', due:'2025-09-10', status:'Assigned' }, { id:2, label:'Sports Day house mentor', due:'2025-11-03', status:'Accepted' } ];

export default function TeacherPlannerPage(){
  const [tab,setTab] = useState('planner');
  const [weekly,setWeekly] = useState(initialWeekly);
  const [lastWeekItems,setLastWeekItems] = useState(initialWeekly.items);
  const [plannerModal,setPlannerModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const emptyForm = { day:'Mon', time:'08:30', subject:'', topic:'', method:'', assessment:'', nep:[], substitute:'', attachments:[] };
  const [form,setForm] = useState(emptyForm);
  const [attachQueue,setAttachQueue] = useState([]); // FileList simulation names
  const [showSubModal,setShowSubModal] = useState(false);
  const [templates] = useState([
    { id:'tpl-explore', name:'Explore → Explain → Evaluate', topic:'Concept exploration', method:'Hands-on + guided discussion', assessment:'Exit ticket + reflection', nep:['Experiential','Assessment for Learning'] },
    { id:'tpl-lab', name:'Lab-first (Science)', topic:'Observation & inference', method:'Lab demo → small groups', assessment:'Worksheet + viva', nep:['Inquiry','Skills'] },
    { id:'tpl-math', name:'Concept → Examples → Practice', topic:'Worked examples & practice sets', method:'Board + pair work', assessment:'Quick quiz', nep:['Integrated','Assessment for Learning'] }
  ]);
  const [selectedTemplate,setSelectedTemplate] = useState('');

  // Personal Info
  const [pi,setPi] = useState({ name:'Ananya Sharma', empId:'T-1024', wing:'Middle', subjects:['Math','Science'], phone:'+91 98XXXXXX21', email:'ananya@greensprings.edu', address:'Noida, UP'});
  const [piEdit,setPiEdit] = useState(false);

  // Payslips
  const [payslips] = useState(samplePayslips);
  const [openPayslip,setOpenPayslip] = useState(null);

  // Attendance
  const [attendance] = useState(sampleAttendance);

  // Leave
  const [leave,setLeave] = useState({ balance:{ CL:6, SL:4, EL:12 }, requests:[ { id:1, type:'CL', from:'2025-09-15', to:'2025-09-16', reason:'Family errand', status:'Pending' } ] });
  const [leaveModal,setLeaveModal] = useState(false);
  const [leaveForm,setLeaveForm] = useState({ type:'CL', from:'', to:'', reason:'' });

  // Qualifications
  const [qualifications,setQualifications] = useState(sampleQualifications);
  const [qualModal,setQualModal] = useState(false);
  const [qualForm,setQualForm] = useState({ name:'', year:'', institute:'' });

  // Workshops
  const [workshops,setWorkshops] = useState(sampleWorkshops);
  const [workshopModal,setWorkshopModal] = useState(false);
  const [workshopKind,setWorkshopKind] = useState('attended');
  const [workshopForm,setWorkshopForm] = useState({ title:'', date:'', hours:1, org:'' });

  // Duties
  const [duties,setDuties] = useState(sampleDuties);

  // Approvals (aggregate view) derived
  const approvalSummary = useMemo(()=>{
    const total = weekly.items.length;
    const submitted = weekly.items.filter(i=> i.approvals.submitted).length;
    const sl = weekly.items.filter(i=> i.approvals.sl).length;
    const hm = weekly.items.filter(i=> i.approvals.hm).length;
    return { total, submitted, sl, hm };
  },[weekly.items]);

  const plannedByDay = useMemo(()=>{ const map={}; days.forEach(d=> map[d]=[]); weekly.items.forEach(i=> map[i.day].push(i)); return map; },[weekly]);

  function openNew(){ setEditing(null); setForm(emptyForm); setAttachQueue([]); setSelectedTemplate(''); setPlannerModal(true); }
  function applyTemplate(){ if(!selectedTemplate) return; const tpl = templates.find(t=> t.id===selectedTemplate); if(!tpl) return; setForm(f=> ({...f, topic:tpl.topic, method:tpl.method, assessment:tpl.assessment, nep:tpl.nep.slice()})); }
  function savePlan(){ if(editing){ setWeekly(w=> ({...w, items:w.items.map(i=> i.id===editing.id? { ...i, ...form, attachments:[...form.attachments, ...attachQueue] }:i)})); } else { const id = ++planAutoId; setWeekly(w=> ({ ...w, items:[...w.items, { id, status:'Draft', approvals:{ submitted:false, sl:false, hm:false }, ...form, attachments:[...attachQueue] } ] })); }
    setPlannerModal(false); }
  function editPlan(item){ setEditing(item); setForm({ ...item }); setAttachQueue([]); setSelectedTemplate(''); setPlannerModal(true); }
  function deletePlan(id){ setWeekly(w=> ({...w, items:w.items.filter(i=> i.id!==id)})); }
  function addAttachment(e){ const files = Array.from(e.target.files||[]).map(f=> f.name); setAttachQueue(q=> [...q, ...files]); }
  function removeAttachment(name){ setAttachQueue(q=> q.filter(f=> f!==name)); }
  function chooseSubstitute(name){ setForm(f=> ({...f, substitute:name })); setShowSubModal(false); }
  function copyLastWeek(){ if(lastWeekItems.length){ const cloned = lastWeekItems.map(i=> ({...i, id: ++planAutoId, approvals:{ submitted:false, sl:false, hm:false }})); setWeekly(w=> ({...w, items:[...w.items, ...cloned]})); } }
  function exportCsv(){
    const headers = [ 'Day','Time','Subject','Topic','Method','Assessment','NEP Tags','Status','Substitute','Submitted','SL Approved','HM Approved' ];
    const rows = weekly.items.map(i=> [ i.day,i.time,i.subject,i.topic,i.method,i.assessment,i.nep.join('|'),i.status,i.substitute,i.approvals.submitted?'Y':'N',i.approvals.sl?'Y':'N',i.approvals.hm?'Y':'N' ]);
    exportRowsAsCSV(headers, rows, { filename:'weekly-planner.csv', bom:true });
  }
  function submitWeekly(){ setWeekly(w=> ({...w, items:w.items.map(i=> ({...i, approvals:{ ...i.approvals, submitted:true }}))})); }
  function approveAsSL(id){ setWeekly(w=> ({...w, items:w.items.map(i=> i.id===id? {...i, approvals:{ ...i.approvals, sl:true }}:i)})); }
  function approveAsHM(id){ setWeekly(w=> ({...w, items:w.items.map(i=> i.id===id? {...i, approvals:{ ...i.approvals, hm:true }}:i)})); }

  // PI edit save
  function savePi(){ setPiEdit(false); }

  // Leave handling
  function requestLeave(){ const id = Math.max(0,...leave.requests.map(r=> r.id))+1; setLeave(l=> ({ ...l, requests:[...l.requests, { id, ...leaveForm, status:'Pending' }]})); setLeaveModal(false); setLeaveForm({ type:'CL', from:'', to:'', reason:'' }); }
  function cancelLeave(id){ setLeave(l=> ({...l, requests:l.requests.map(r=> r.id===id? {...r, status:'Cancelled'}:r)})); }

  // Qualifications
  function addQualification(){ const id = Math.max(0,...qualifications.map(q=> q.id))+1; setQualifications(q=> [...q, { id, ...qualForm, year:Number(qualForm.year)||new Date().getFullYear(), verified:false }]); setQualModal(false); setQualForm({ name:'', year:'', institute:'' }); }
  function verifyQualification(id){ setQualifications(q=> q.map(x=> x.id===id? {...x, verified:true}:x)); }

  // Workshops
  function addWorkshop(){ const id = Date.now(); setWorkshops(w=> ({ ...w, [workshopKind]:[...w[workshopKind], { id, ...workshopForm, hours:Number(workshopForm.hours)||1 }] })); setWorkshopModal(false); setWorkshopForm({ title:'', date:'', hours:1, org:'' }); }

  // Duties
  function toggleDuty(id){ setDuties(d=> d.map(x=> x.id===id? {...x, status: x.status==='Assigned'?'Accepted': x.status==='Accepted'?'Completed':'Assigned'}:x)); }

  // Derived stats
  const attendanceSummary = useMemo(()=> { const total = attendance.length; const present = attendance.filter(a=> a.mark==='P').length; return { total, present, percent: total? Math.round((present/total)*100):0 }; },[attendance]);

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Teacher Planner</h1>
        <p className="text-sm text-slate-500">Weekly plans • Approvals • Records</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={openNew}>New Plan</Button>
        <Button onClick={copyLastWeek} variant="subtle">Copy Last Week</Button>
        <Button onClick={submitWeekly} variant="primary">Submit Weekly</Button>
        <Button onClick={exportCsv}>Export CSV</Button>
      </div>
    </header>

    <div className="flex gap-2 flex-wrap">
      {['planner','approvals','profile','payslips','attendance','leave','qualifications','workshops','duties'].map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full border text-sm ${tab===t? 'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>{t}</button>)}
    </div>

    {tab==='planner' && <Card title="Weekly Planner" actions={<div className="flex gap-2"><select value={selectedTemplate} onChange={e=> setSelectedTemplate(e.target.value)} className="px-2 py-1.5 text-sm rounded-lg border"><option value="">Template</option>{templates.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}</select><Button onClick={applyTemplate} disabled={!selectedTemplate} className="text-xs">Apply</Button></div>}>
      <div className="grid md:grid-cols-3 gap-4">
        {days.map(d=> <div key={d} className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wide text-slate-500">{d}</h4>
          <div className="space-y-2">
            {plannedByDay[d].map(item=> <div key={item.id} className="rounded-xl border p-2 space-y-2 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-500">{item.time}</div>
                  <div className="text-sm font-medium">{item.subject||'—'}</div>
                  <div className="text-xs text-slate-500 line-clamp-2" title={item.topic}>{item.topic}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button className="text-xs px-2 py-1" onClick={()=>editPlan(item)}>Edit</Button>
                  <Button className="text-xs px-2 py-1" variant="danger" onClick={()=>deletePlan(item.id)}>Del</Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">{item.nep.map(t=> <Badge key={t} tone="blue">{t}</Badge>)}</div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                {item.substitute && <span>Sub: {item.substitute}</span>}
                {item.attachments?.length>0 && <span>{item.attachments.length} file(s)</span>}
                <span>{item.approvals.submitted? 'Submitted':''}</span>
              </div>
              <div className="flex gap-2">
                {!item.approvals.sl && item.approvals.submitted && <Button className="text-xs" onClick={()=>approveAsSL(item.id)}>SL Approve</Button>}
                {!item.approvals.hm && item.approvals.sl && <Button className="text-xs" onClick={()=>approveAsHM(item.id)}>HM Approve</Button>}
              </div>
            </div>)}
          </div>
        </div>)}
      </div>
    </Card>}

    {tab==='approvals' && <Card title="Approvals Lane" actions={<Badge tone={approvalSummary.hm===approvalSummary.total?'emerald':'amber'}>{approvalSummary.hm}/{approvalSummary.total} HM Approved</Badge>}>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="rounded-xl border p-4 w-40"><div className="text-xs text-slate-500 mb-1">Submitted</div><div className="text-2xl font-semibold">{approvalSummary.submitted}</div></div>
        <div className="rounded-xl border p-4 w-40"><div className="text-xs text-slate-500 mb-1">SL Approved</div><div className="text-2xl font-semibold">{approvalSummary.sl}</div></div>
        <div className="rounded-xl border p-4 w-40"><div className="text-xs text-slate-500 mb-1">HM Approved</div><div className="text-2xl font-semibold">{approvalSummary.hm}</div></div>
      </div>
      <div className="pt-4 text-xs text-slate-500">Plans move automatically when approvals are given.</div>
    </Card>}

    {tab==='profile' && <Card title="Personal Info" actions={<Button onClick={()=> piEdit? savePi(): setPiEdit(true)}>{piEdit? 'Save':'Edit'}</Button>}>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        {Object.entries(pi).map(([k,v])=> k==='subjects'? <div key={k}><div className="text-xs font-medium text-slate-500 uppercase">{k}</div>{piEdit? <input className="mt-1 w-full rounded-lg border px-2 py-1" value={v.join(', ')} onChange={e=> setPi(p=> ({...p, subjects: e.target.value.split(',').map(s=> s.trim()).filter(Boolean)}))} />: <div className="mt-1">{v.join(', ')}</div>}</div>: <div key={k}><div className="text-xs font-medium text-slate-500 uppercase">{k}</div>{piEdit? <input className="mt-1 w-full rounded-lg border px-2 py-1" value={v} onChange={e=> setPi(p=> ({...p, [k]:e.target.value}))} />: <div className="mt-1 break-words">{v}</div>}</div>) }
      </div>
    </Card>}

    {tab==='payslips' && <Card title="Payslips"><div className="overflow-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Month</th><th className="px-3 py-2 text-left">Gross</th><th className="px-3 py-2 text-left">Net</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Actions</th></tr></thead><tbody>{payslips.map(p=> <tr key={p.id} className="border-t"><td className="px-3 py-2 font-medium">{p.month}</td><td className="px-3 py-2">{p.gross}</td><td className="px-3 py-2">{p.net}</td><td className="px-3 py-2">{p.status}</td><td className="px-3 py-2"><Button className="text-xs" onClick={()=>setOpenPayslip(p)}>View</Button></td></tr>)}</tbody></table></div></Card>}

    {tab==='attendance' && <Card title="Attendance"><div className="flex flex-wrap gap-4 text-sm"><div className="rounded-xl border p-4 w-40"><div className="text-xs text-slate-500 mb-1">Days</div><div className="text-2xl font-semibold">{attendanceSummary.total}</div></div><div className="rounded-xl border p-4 w-40"><div className="text-xs text-slate-500 mb-1">Present</div><div className="text-2xl font-semibold">{attendanceSummary.present}</div></div><div className="rounded-xl border p-4 w-40"><div className="text-xs text-slate-500 mb-1">% Present</div><div className="text-2xl font-semibold">{attendanceSummary.percent}%</div></div></div><div className="overflow-auto mt-4"><table className="text-sm min-w-[320px]"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-1.5 text-left">Date</th><th className="px-3 py-1.5 text-left">Mark</th></tr></thead><tbody>{attendance.map(a=> <tr key={a.date} className="border-t"><td className="px-3 py-1.5">{a.date}</td><td className="px-3 py-1.5">{a.mark}</td></tr>)}</tbody></table></div></Card>}

    {tab==='leave' && <Card title="Leave" actions={<Button onClick={()=>setLeaveModal(true)}>Request Leave</Button>}><div className="flex gap-4 flex-wrap text-sm">{Object.entries(leave.balance).map(([k,v])=> <div key={k} className="rounded-xl border p-3 w-32"><div className="text-xs text-slate-500 mb-1">{k}</div><div className="text-xl font-semibold">{v}</div></div>)}</div><div className="overflow-auto mt-4"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">From</th><th className="px-3 py-2 text-left">To</th><th className="px-3 py-2 text-left">Reason</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Actions</th></tr></thead><tbody>{leave.requests.map(r=> <tr key={r.id} className="border-t"><td className="px-3 py-2 font-medium">{r.type}</td><td className="px-3 py-2">{r.from}</td><td className="px-3 py-2">{r.to}</td><td className="px-3 py-2 max-w-[200px] truncate" title={r.reason}>{r.reason}</td><td className="px-3 py-2">{r.status}</td><td className="px-3 py-2">{r.status==='Pending' && <Button className="text-xs" onClick={()=>cancelLeave(r.id)}>Cancel</Button>}</td></tr>)}</tbody></table></div></Card>}

    {tab==='qualifications' && <Card title="Qualifications" actions={<Button onClick={()=>setQualModal(true)}>Add</Button>}><div className="overflow-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Year</th><th className="px-3 py-2 text-left">Institute</th><th className="px-3 py-2 text-left">Verified</th><th className="px-3 py-2 text-left">Actions</th></tr></thead><tbody>{qualifications.map(q=> <tr key={q.id} className="border-t"><td className="px-3 py-2 font-medium">{q.name}</td><td className="px-3 py-2">{q.year}</td><td className="px-3 py-2">{q.institute}</td><td className="px-3 py-2">{q.verified? 'Yes':'No'}</td><td className="px-3 py-2">{!q.verified && <Button className="text-xs" onClick={()=>verifyQualification(q.id)}>Verify</Button>}</td></tr>)}</tbody></table></div></Card>}

    {tab==='workshops' && <Card title="Workshops" actions={<div className="flex gap-2"><select value={workshopKind} onChange={e=>setWorkshopKind(e.target.value)} className="px-2 py-1.5 text-sm rounded-lg border"><option value="attended">Attended</option><option value="hosted">Hosted</option></select><Button onClick={()=>setWorkshopModal(true)}>Add</Button></div>}>
      <div className="grid md:grid-cols-2 gap-4">
        {['attended','hosted'].map(kind=> (
          <div key={kind} className="rounded-xl border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kind}</div>
              <Badge tone="slate">{workshops[kind].length}</Badge>
            </div>
            <div className="space-y-2">
              {workshops[kind].map(w=> (
                <div key={w.id} className="rounded-lg border p-2 text-xs space-y-1">
                  <div className="font-medium text-slate-700">{w.title}</div>
                  <div className="text-slate-500 flex flex-wrap gap-2"><span>{w.date}</span><span>{w.hours}h</span><span>{w.org}</span></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>}

    {tab==='duties' && <Card title="Duties"><div className="space-y-2">{duties.map(d=> <div key={d.id} className="rounded-xl border p-3 flex items-center justify-between gap-4"><div><div className="text-sm font-medium">{d.label}</div><div className="text-xs text-slate-500">Due {d.due}</div></div><div className="flex items-center gap-2"><Badge tone={d.status==='Completed'?'emerald': d.status==='Accepted'?'blue':'amber'}>{d.status}</Badge><Button className="text-xs" onClick={()=>toggleDuty(d.id)}>Advance</Button></div></div>)}</div></Card>}

    {/* Plan Modal */}
    <Modal open={plannerModal} onClose={()=>setPlannerModal(false)} title={editing? 'Edit Plan':'New Plan'} footer={<div className="flex justify-end gap-2"><Button onClick={()=>setPlannerModal(false)}>Cancel</Button><Button variant="primary" onClick={savePlan}>Save</Button></div>}>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {['day','time','subject','topic','method','assessment'].map(f=> <label key={f} className="grid gap-1"><span className="text-xs font-medium text-slate-600 capitalize">{f}</span><input value={form[f]} onChange={e=>setForm(s=>({...s,[f]:e.target.value}))} className="rounded-lg border px-2 py-1.5" /></label>)}
        <label className="grid gap-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">NEP Tags</span><div className="flex flex-wrap gap-2">{nepTags.map(tag=> <button type="button" key={tag} onClick={()=> setForm(f=> f.nep.includes(tag)? {...f, nep:f.nep.filter(x=> x!==tag)}: {...f, nep:[...f.nep, tag]})} className={`px-2 py-1 rounded-full text-xs border ${form.nep.includes(tag)?'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>{tag}</button>)}</div></label>
        <div className="md:col-span-2 flex flex-wrap gap-2 items-center"><Button className="text-xs" onClick={()=> setShowSubModal(true)}>Set Substitute</Button><label className="text-xs font-medium flex items-center gap-2">Attachments<input type="file" multiple onChange={addAttachment} className="hidden" /></label></div>
        {attachQueue.length>0 && <div className="md:col-span-2"><div className="flex flex-wrap gap-2">{attachQueue.map(a=> <div key={a} className="px-2 py-1 rounded-md border text-xs flex items-center gap-1">{a}<button onClick={()=>removeAttachment(a)} className="text-slate-400 hover:text-slate-600">✕</button></div>)}</div></div>}
        {form.substitute && <div className="md:col-span-2 text-xs text-slate-500">Substitute: {form.substitute}</div>}
      </div>
    </Modal>

    {/* Substitute modal */}
    <Modal open={showSubModal} onClose={()=>setShowSubModal(false)} title="Select Substitute" size="sm" footer={<div className="flex justify-end"><Button onClick={()=>setShowSubModal(false)}>Close</Button></div>}>
      <div className="space-y-2 text-sm">{substituteTeachers.map(s=> <button key={s} onClick={()=>chooseSubstitute(s)} className="w-full text-left px-3 py-2 rounded-lg border hover:bg-slate-50">{s}</button>)}</div>
    </Modal>

    {/* Payslip modal */}
    <Modal open={!!openPayslip} onClose={()=>setOpenPayslip(null)} title={openPayslip? 'Payslip '+openPayslip.month:''} size="md" footer={<div className="flex justify-end gap-2"><Button onClick={()=>setOpenPayslip(null)}>Close</Button><Button variant="primary">Download</Button></div>}>
      {openPayslip && <div className="text-sm space-y-2"><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border p-2"><div className="text-[10px] uppercase text-slate-500">Gross</div><div className="font-medium">{openPayslip.gross}</div></div><div className="rounded-lg border p-2"><div className="text-[10px] uppercase text-slate-500">Net</div><div className="font-medium">{openPayslip.net}</div></div></div><div className="text-xs text-slate-500">Status: {openPayslip.status}</div></div>}
    </Modal>

    {/* Leave modal */}
    <Modal open={leaveModal} onClose={()=>setLeaveModal(false)} title="Request Leave" size="md" footer={<div className="flex justify-end gap-2"><Button onClick={()=>setLeaveModal(false)}>Cancel</Button><Button variant="primary" onClick={requestLeave}>Submit</Button></div>}>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {['type','from','to','reason'].map(f=> <label key={f} className="grid gap-1"><span className="text-xs font-medium text-slate-600 capitalize">{f}</span><input value={leaveForm[f]} onChange={e=> setLeaveForm(s=> ({...s, [f]:e.target.value}))} className="rounded-lg border px-2 py-1.5" /></label>)}
      </div>
    </Modal>

    {/* Qualification modal */}
    <Modal open={qualModal} onClose={()=>setQualModal(false)} title="Add Qualification" size="md" footer={<div className="flex justify-end gap-2"><Button onClick={()=>setQualModal(false)}>Cancel</Button><Button variant="primary" onClick={addQualification}>Add</Button></div>}>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <label className="grid gap-1"><span className="text-xs font-medium text-slate-600">Name</span><input value={qualForm.name} onChange={e=> setQualForm(f=> ({...f, name:e.target.value}))} className="rounded-lg border px-2 py-1.5" /></label>
        <label className="grid gap-1"><span className="text-xs font-medium text-slate-600">Year</span><input value={qualForm.year} onChange={e=> setQualForm(f=> ({...f, year:e.target.value}))} className="rounded-lg border px-2 py-1.5" /></label>
        <label className="grid gap-1"><span className="text-xs font-medium text-slate-600">Institute</span><input value={qualForm.institute} onChange={e=> setQualForm(f=> ({...f, institute:e.target.value}))} className="rounded-lg border px-2 py-1.5" /></label>
      </div>
    </Modal>

    {/* Workshop modal */}
    <Modal open={workshopModal} onClose={()=>setWorkshopModal(false)} title={`Add ${workshopKind==='attended'?'Attended':'Hosted'} Workshop`} size="md" footer={<div className="flex justify-end gap-2"><Button onClick={()=>setWorkshopModal(false)}>Cancel</Button><Button variant="primary" onClick={addWorkshop}>Add</Button></div>}>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {['title','date','hours','org'].map(f=> <label key={f} className="grid gap-1"><span className="text-xs font-medium text-slate-600 capitalize">{f}</span><input value={workshopForm[f]} onChange={e=> setWorkshopForm(s=> ({...s, [f]:e.target.value}))} className="rounded-lg border px-2 py-1.5" /></label>)}
      </div>
    </Modal>

  </div>;
}
