import React, { useState, useMemo, useEffect } from 'react';

// Fallback simple UI primitives (replace with design system if available)
const Button = ({children, variant='default', size='md', className='', ...p}) => <button {...p} className={`inline-flex items-center gap-1 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${variant==='outline'?'bg-white border-slate-300 text-slate-700 hover:bg-slate-50':variant==='secondary'?'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200':variant==='destructive'?'bg-rose-600 border-rose-600 text-white hover:bg-rose-500':'bg-primary border-primary text-white hover:bg-primary/90'} ${size==='sm'?'h-8 px-2':'h-9 px-3'} ${className}`}>{children}</button>;
const Card = ({children,className=''}) => <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
const CardContent = ({children,className=''}) => <div className={`p-4 ${className}`}>{children}</div>;
const Input = (p) => <input {...p} className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
const Textarea = (p) => <textarea {...p} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
const Badge = ({children, tone='slate'}) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border bg-white text-${tone}-700 border-${tone}-200`}>{children}</span>;

// Seeds
const SEED_EMPLOYEES = [
  { id: 'E101', name: 'Anita Sharma', role: 'TGT English', dept: 'Academics', type: 'Full-time', email: 'anita@school.edu', phone: '9876543210', salary: 52000, doj: '2022-06-10', status: 'Active' },
  { id: 'E102', name: 'Rahul Verma', role: 'PGT Physics', dept: 'Academics', type: 'Full-time', email: 'rahul@school.edu', phone: '9898989898', salary: 68000, doj: '2021-04-01', status: 'Active' },
  { id: 'E103', name: 'Kavita Rao', role: 'School Nurse', dept: 'Infirmary', type: 'Part-time', email: 'kavita@school.edu', phone: '9822001122', salary: 32000, doj: '2023-01-15', status: 'Active' },
  { id: 'E104', name: 'Sunil Gupta', role: 'Accounts Exec', dept: 'Admin', type: 'Full-time', email: 'sunil@school.edu', phone: '9811111111', salary: 42000, doj: '2020-10-20', status: 'Active' },
  { id: 'E105', name: 'Meena Iyer', role: 'Security Supervisor', dept: 'Ops', type: 'Contract', email: 'meena@school.edu', phone: '9000000012', salary: 28000, doj: '2024-07-01', status: 'Active' },
];
const SEED_SUPPORT = [
  { id: 'S201', name: 'Ramu Singh', role: 'Security Guard', shift: 'Morning', post: 'Gate-1' },
  { id: 'S202', name: 'Sita Devi', role: 'Security Guard', shift: 'Evening', post: 'Gate-2' },
  { id: 'S203', name: 'Karan Kumar', role: 'Helper', shift: 'Morning', post: 'Junior Wing' },
  { id: 'S204', name: 'Farida', role: 'Helper', shift: 'Night', post: 'Hostel' },
];
const SEED_LEAVES = [
  { id: 'L1', empId: 'E101', name: 'Anita Sharma', type: 'CL', from: '2025-10-05', to: '2025-10-06', days: 2, reason: 'Family function', status: 'Pending' },
  { id: 'L2', empId: 'E103', name: 'Kavita Rao', type: 'SL', from: '2025-10-03', to: '2025-10-03', days: 1, reason: 'Fever', status: 'Pending' },
  { id: 'L3', empId: 'E104', name: 'Sunil Gupta', type: 'EL', from: '2025-10-10', to: '2025-10-12', days: 3, reason: 'Travel', status: 'Approved' },
];
const SEED_OPENINGS = [
  { id: 'O1', title: 'PRT Math', dept: 'Academics', type: 'Full-time', headcount: 1, status: 'Open' },
  { id: 'O2', title: 'Lab Assistant (Physics)', dept: 'Academics', type: 'Contract', headcount: 1, status: 'Open' },
];
const SEED_CANDIDATES = [
  { id: 'C1', name: 'Vikas Nair', role: 'PRT Math', stage: 'Screen', phone: '8888888881', email: 'vikas@mail.com', interview: '' },
  { id: 'C2', name: 'Rhea Kapoor', role: 'Lab Assistant (Physics)', stage: 'Applied', phone: '8888888882', email: 'rhea@mail.com', interview: '' },
  { id: 'C3', name: 'Mohit Saini', role: 'TGT English', stage: 'Interview', phone: '8888888883', email: 'mohit@mail.com', interview: '2025-10-04' },
];
const SEED_DOCS = [
  { id: 'D1', empId: 'E105', name: 'Meena Iyer', doc: 'Police Verification', expiry: '2025-10-12' },
  { id: 'D2', empId: 'E101', name: 'Anita Sharma', doc: 'Contract', expiry: '2025-11-01' },
  { id: 'D3', empId: 'E102', name: 'Rahul Verma', doc: 'ID Card', expiry: '2025-10-18' },
];
const SEED_PERF = [
  { empId: 'E101', name: 'Anita Sharma', goals: 'Improve reading outcomes in Grade 7', lastReview: '2025-09-20', cpdHours: 6 },
  { empId: 'E102', name: 'Rahul Verma', goals: 'Launch Physics Olympiad prep club', lastReview: '2025-08-30', cpdHours: 12 },
  { empId: 'E103', name: 'Kavita Rao', goals: 'Monthly first-aid workshop', lastReview: '2025-09-10', cpdHours: 4 },
];

const fmtDate = (d) => new Date(d).toLocaleDateString();
const daysLeft = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
function exportToCSV(rows, filename='export.csv'){
  if(!rows||!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => '"'+String(v??'').replace(/"/g,'""')+'"';
  const csv = [headers.join(','), ...rows.map(r=> headers.map(h=> escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

export default function HRDeskPage(){
  // Load persisted or seed
  const [employees,setEmployees] = useState(()=>{ try{ const r=localStorage.getItem('hr_employees'); if(r) return JSON.parse(r); }catch{} return SEED_EMPLOYEES; });
  const [leaves,setLeaves] = useState(()=>{ try{ const r=localStorage.getItem('hr_leaves'); if(r) return JSON.parse(r); }catch{} return SEED_LEAVES; });
  const [openings,setOpenings] = useState(()=>{ try{ const r=localStorage.getItem('hr_openings'); if(r) return JSON.parse(r); }catch{} return SEED_OPENINGS; });
  const [candidates,setCandidates] = useState(()=>{ try{ const r=localStorage.getItem('hr_candidates'); if(r) return JSON.parse(r); }catch{} return SEED_CANDIDATES; });
  const [docs,setDocs] = useState(()=>{ try{ const r=localStorage.getItem('hr_docs'); if(r) return JSON.parse(r); }catch{} return SEED_DOCS; });
  const [perf,setPerf] = useState(()=>{ try{ const r=localStorage.getItem('hr_perf'); if(r) return JSON.parse(r); }catch{} return SEED_PERF; });

  const [searchTerm,setSearchTerm] = useState('');
  const [deptFilter,setDeptFilter] = useState('All');
  const [typeFilter,setTypeFilter] = useState('All');
  const [tab,setTab] = useState('employees');

  // Attendance (volatile)
  const initialAtt = useMemo(()=> Object.fromEntries(employees.map(e=> [e.id, Math.random()>0.2])), [employees]);
  const [attendance,setAttendance] = useState(initialAtt);
  const [supportAtt,setSupportAtt] = useState(Object.fromEntries(SEED_SUPPORT.map(s=> [s.id, Math.random()>0.2])));

  // Persistence effects
  useEffect(()=>{ try{ localStorage.setItem('hr_employees', JSON.stringify(employees)); }catch{} },[employees]);
  useEffect(()=>{ try{ localStorage.setItem('hr_leaves', JSON.stringify(leaves)); }catch{} },[leaves]);
  useEffect(()=>{ try{ localStorage.setItem('hr_openings', JSON.stringify(openings)); }catch{} },[openings]);
  useEffect(()=>{ try{ localStorage.setItem('hr_candidates', JSON.stringify(candidates)); }catch{} },[candidates]);
  useEffect(()=>{ try{ localStorage.setItem('hr_docs', JSON.stringify(docs)); }catch{} },[docs]);
  useEffect(()=>{ try{ localStorage.setItem('hr_perf', JSON.stringify(perf)); }catch{} },[perf]);

  const filteredEmployees = employees.filter(e=> (searchTerm==='' || e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.role.toLowerCase().includes(searchTerm.toLowerCase())) && (deptFilter==='All'||e.dept===deptFilter) && (typeFilter==='All'||e.type===typeFilter));

  const [autoReminder,setAutoReminder] = useState(true);
  const [leadDays,setLeadDays] = useState(7);
  const CPD_TARGET = 50; const NPST_SPLIT={ ethics:12, practice:24, growth:14 };

  // Payroll structure keyed by emp id
  const [payroll,setPayroll] = useState(()=> Object.fromEntries(employees.map(e=> [e.id,{ base:e.salary, hraPct:40, daPct:12, ta:2000, special:0, pfPct:12, tdsPct:5, pt:200, other:0 }] )));

  function calcRow(e){ const p = payroll[e.id]; if(!p) return { gross:0, net:0 }; const hra = p.base * p.hraPct/100; const da = p.base * p.daPct/100; const gross = p.base + hra + da + p.ta + p.special; const pf = p.base * p.pfPct/100; const tds = gross * p.tdsPct/100; const deductions = pf + tds + p.pt + p.other; const net = gross - deductions; return { hra, da, gross:Math.round(gross), net:Math.round(net), deductions:Math.round(deductions)}; }
  const payrollTotals = useMemo(()=> filteredEmployees.reduce((agg,e)=> { const r=calcRow(e); agg.gross+=r.gross; agg.net+=r.net; return agg; }, {gross:0, net:0}), [filteredEmployees,payroll]);

  function markAllPresent(){ setAttendance(a=> Object.fromEntries(Object.entries(a).map(([k])=> [k,true]))); }
  function toggleAttendance(id){ setAttendance(a=> ({...a,[id]: !a[id]})); }
  function toggleSupport(id){ setSupportAtt(a=> ({...a,[id]: !a[id]})); }
  function resolveLeave(id,status){ setLeaves(ls=> ls.map(l=> l.id===id? {...l,status}: l)); }
  function moveCandidate(id, stage){ const order=['Applied','Screen','Interview','Offer','Hired']; setCandidates(cs=> cs.map(c=> c.id===id? {...c, stage: order.includes(stage)?stage:c.stage }: c)); }
  function renewDoc(empId){ setDocs(ds=> ds.map(d=> d.empId===empId? {...d, expiry: new Date(Date.now()+1000*3600*24*365).toISOString().slice(0,10)}: d)); }
  function addCPD(empId, hours=1){ setPerf(ps=> ps.map(p=> p.empId===empId? {...p, cpdHours: p.cpdHours + hours }: p)); }

  function addEmployee(form){ const id='E'+(Math.floor(Math.random()*900)+200); const row={ id, ...form, salary:Number(form.salary||0), status:'Active' }; setEmployees(es=> [row,...es]); setPayroll(p=> ({...p,[id]:{ base:row.salary, hraPct:40, daPct:12, ta:2000, special:0, pfPct:12, tdsPct:5, pt:200, other:0 }})); }
  function addOpening(form){ const id='O'+(Math.floor(Math.random()*900)+100); setOpenings(os=> [{ id, status:'Open', ...form }, ...os]); }
  function addCandidate(form){ const id='C'+(Math.floor(Math.random()*900)+100); setCandidates(cs=> [{ id, stage:'Applied', ...form }, ...cs]); }
  function applyPayrollSave(empId, data){ setPayroll(p=> ({...p,[empId]: data})); }

  function exportEmployees(){ exportToCSV(filteredEmployees,'employees.csv'); }
  function exportLeaves(){ exportToCSV(leaves,'leaves.csv'); }
  function exportOpenings(){ exportToCSV(openings,'openings.csv'); }
  function exportCandidates(){ exportToCSV(candidates,'candidates.csv'); }
  function exportDocs(){ exportToCSV(docs,'docs.csv'); }
  function exportPerf(){ exportToCSV(perf,'performance.csv'); }

  const kpis = { headcount: employees.length, openRoles: openings.filter(o=>o.status==='Open').length, pendingLeaves: leaves.filter(l=>l.status==='Pending').length, expiringDocs: docs.filter(d=> daysLeft(d.expiry)<=14).length };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">HR Desk</h1>
        <div className="flex items-center gap-2">
          <Button onClick={()=>setTab('employees')} variant={tab==='employees'?'default':'outline'}>Employees</Button>
          <Button onClick={()=>setTab('attendance')} variant={tab==='attendance'?'default':'outline'}>Attendance</Button>
          <Button onClick={()=>setTab('leaves')} variant={tab==='leaves'?'default':'outline'}>Leaves</Button>
          <Button onClick={()=>setTab('recruitment')} variant={tab==='recruitment'?'default':'outline'}>Recruitment</Button>
          <Button onClick={()=>setTab('compliance')} variant={tab==='compliance'?'default':'outline'}>Compliance</Button>
          <Button onClick={()=>setTab('payroll')} variant={tab==='payroll'?'default':'outline'}>Payroll</Button>
          <Button onClick={()=>setTab('performance')} variant={tab==='performance'?'default':'outline'}>Performance</Button>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Headcount</div><div className="text-lg font-semibold">{kpis.headcount}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Open Roles</div><div className="text-lg font-semibold">{kpis.openRoles}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Pending Leaves</div><div className="text-lg font-semibold">{kpis.pendingLeaves}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Expiring Docs (&lt;14d)</div><div className="text-lg font-semibold">{kpis.expiringDocs}</div></CardContent></Card>
      </div>

      {tab==='employees' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Search name/role" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{maxWidth:200}} />
            <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 text-sm px-2"><option>All</option>{['Academics','Admin','Ops','Infirmary','Sports','IT'].map(d=> <option key={d}>{d}</option>)}</select>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 text-sm px-2"><option>All</option>{['Full-time','Part-time','Contract','Intern'].map(t=> <option key={t}>{t}</option>)}</select>
            <Button onClick={exportEmployees} variant="outline">Export</Button>
            <Button onClick={()=>addEmployee({ name:'New Employee', role:'Role', dept:'Admin', type:'Full-time', email:'new@school.edu', phone:'', salary:30000, doj:new Date().toISOString().slice(0,10) })}>Quick Add</Button>
          </div>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">Dept</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Salary</th><th className="p-2 text-left">DOJ</th></tr></thead>
              <tbody>
                {filteredEmployees.map(e=> <tr key={e.id} className="border-t"><td className="p-2 font-medium">{e.name}</td><td className="p-2">{e.role}</td><td className="p-2">{e.dept}</td><td className="p-2">{e.type}</td><td className="p-2">{e.email}</td><td className="p-2">{e.phone}</td><td className="p-2">₹{e.salary}</td><td className="p-2">{e.doj}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='attendance' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><Button onClick={markAllPresent} variant="outline">Mark All Present</Button><Button onClick={()=>setAttendance(a=> ({}))} variant="outline">Reset</Button></div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card><CardContent className="space-y-2"><h3 className="font-medium text-sm">Teaching & Admin</h3><div className="divide-y border rounded-md">
              {employees.map(e=> <label key={e.id} className="flex items-center justify-between text-xs px-3 py-2"><span>{e.name}</span><input type="checkbox" checked={attendance[e.id]} onChange={()=>toggleAttendance(e.id)} /></label>)}
            </div></CardContent></Card>
            <Card><CardContent className="space-y-2"><h3 className="font-medium text-sm">Support Staff</h3><div className="divide-y border rounded-md">
              {SEED_SUPPORT.map(s=> <label key={s.id} className="flex items-center justify-between text-xs px-3 py-2"><span>{s.name} <span className="text-slate-400">({s.role})</span></span><input type="checkbox" checked={supportAtt[s.id]} onChange={()=>toggleSupport(s.id)} /></label>)}
            </div></CardContent></Card>
          </div>
        </div>
      )}

      {tab==='leaves' && (
        <div className="space-y-4">
          <div className="flex gap-2"><Button onClick={exportLeaves} variant="outline">Export</Button></div>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">From</th><th className="p-2 text-left">To</th><th className="p-2 text-left">Days</th><th className="p-2 text-left">Reason</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>
                {leaves.map(l=> <tr key={l.id} className="border-t"><td className="p-2 font-medium">{l.name}</td><td className="p-2">{l.type}</td><td className="p-2">{l.from}</td><td className="p-2">{l.to}</td><td className="p-2">{l.days}</td><td className="p-2">{l.reason}</td><td className="p-2">{l.status}</td><td className="p-2 flex gap-1"><Button size="sm" variant="outline" disabled={l.status!=='Pending'} onClick={()=>resolveLeave(l.id,'Approved')}>Approve</Button><Button size="sm" variant="outline" disabled={l.status!=='Pending'} onClick={()=>resolveLeave(l.id,'Rejected')}>Reject</Button></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='recruitment' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Openings</h3>
            <div className="flex gap-2"><Button variant="outline" onClick={()=>addOpening({ title:'New Opening', dept:'Academics', type:'Full-time', headcount:1 })}>Quick Opening</Button><Button variant="outline" onClick={exportOpenings}>Export</Button></div>
            <div className="overflow-auto border rounded-md"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-2 text-left">Title</th><th className="p-2 text-left">Dept</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Headcount</th><th className="p-2 text-left">Status</th></tr></thead><tbody>{openings.map(o=> <tr key={o.id} className="border-t"><td className="p-2 font-medium">{o.title}</td><td className="p-2">{o.dept}</td><td className="p-2">{o.type}</td><td className="p-2">{o.headcount}</td><td className="p-2">{o.status}</td></tr>)}</tbody></table></div>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Candidates</h3>
            <div className="flex gap-2"><Button variant="outline" onClick={()=>addCandidate({ name:'New Candidate', role:'Role', phone:'', email:'' })}>Quick Candidate</Button><Button variant="outline" onClick={exportCandidates}>Export</Button></div>
            <div className="overflow-auto border rounded-md"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">Stage</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Actions</th></tr></thead><tbody>{candidates.map(c=> <tr key={c.id} className="border-t"><td className="p-2 font-medium">{c.name}</td><td className="p-2">{c.role}</td><td className="p-2">{c.stage}</td><td className="p-2">{c.phone}</td><td className="p-2">{c.email}</td><td className="p-2 flex gap-1"><Button size="sm" variant="outline" onClick={()=>moveCandidate(c.id,'Screen')}>Screen</Button><Button size="sm" variant="outline" onClick={()=>moveCandidate(c.id,'Interview')}>Interview</Button><Button size="sm" variant="outline" onClick={()=>moveCandidate(c.id,'Offer')}>Offer</Button><Button size="sm" variant="outline" onClick={()=>moveCandidate(c.id,'Hired')}>Hire</Button></td></tr>)}</tbody></table></div>
          </div>
        </div>
      )}

      {tab==='compliance' && (
        <div className="space-y-4">
          <div className="flex gap-2"><Button variant="outline" onClick={exportDocs}>Export Docs</Button></div>
          <div className="overflow-auto border rounded-md"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Document</th><th className="p-2 text-left">Expiry</th><th className="p-2 text-left">Days Left</th><th className="p-2 text-left">Action</th></tr></thead><tbody>{docs.map(d=> { const left=daysLeft(d.expiry); return <tr key={d.id} className="border-t"><td className="p-2 font-medium">{d.name}</td><td className="p-2">{d.doc}</td><td className="p-2">{d.expiry}</td><td className={`p-2 ${left<=14?'text-rose-600 font-medium':''}`}>{left}</td><td className="p-2"><Button size="sm" variant="outline" onClick={()=>renewDoc(d.empId)}>Renew +1y</Button></td></tr>; })}</tbody></table></div>
        </div>
      )}

      {tab==='payroll' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm"><div className="font-medium">Totals:</div><div>Gross ₹{payrollTotals.gross}</div><div>Net ₹{payrollTotals.net}</div><Button variant="outline" onClick={()=>exportToCSV(Object.entries(payroll).map(([id,p])=> ({ id, ...p })), 'payroll_components.csv')}>Export Components</Button></div>
          <div className="overflow-auto border rounded-md"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Base</th><th className="p-2 text-left">HRA%</th><th className="p-2 text-left">DA%</th><th className="p-2 text-left">TA</th><th className="p-2 text-left">PF%</th><th className="p-2 text-left">TDS%</th><th className="p-2 text-left">Gross</th><th className="p-2 text-left">Net</th><th className="p-2 text-left">Edit</th></tr></thead><tbody>{filteredEmployees.map(e=> { const r=calcRow(e); const comp=payroll[e.id]; return <tr key={e.id} className="border-t"><td className="p-2 font-medium">{e.name}</td><td className="p-2">₹{comp.base}</td><td className="p-2">{comp.hraPct}</td><td className="p-2">{comp.daPct}</td><td className="p-2">₹{comp.ta}</td><td className="p-2">{comp.pfPct}</td><td className="p-2">{comp.tdsPct}</td><td className="p-2">₹{r.gross}</td><td className="p-2 font-semibold">₹{r.net}</td><td className="p-2"><Button size="sm" variant="outline" onClick={()=>{ const base = prompt('Base',comp.base); if(base){ const next={...comp, base:Number(base)}; applyPayrollSave(e.id,next);} }}>Edit</Button></td></tr>; })}</tbody></table></div>
        </div>
      )}

      {tab==='performance' && (
        <div className="space-y-4">
          <div className="flex gap-2"><Button variant="outline" onClick={exportPerf}>Export</Button></div>
          <div className="overflow-auto border rounded-md"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Goals</th><th className="p-2 text-left">Last Review</th><th className="p-2 text-left">CPD Hours</th><th className="p-2 text-left">Add</th><th className="p-2 text-left">Progress</th></tr></thead><tbody>{perf.map(p=> { const pct = Math.round((p.cpdHours/CPD_TARGET)*100); return <tr key={p.empId} className="border-t"><td className="p-2 font-medium">{p.name}</td><td className="p-2 truncate max-w-xs">{p.goals}</td><td className="p-2">{p.lastReview}</td><td className="p-2">{p.cpdHours}</td><td className="p-2"><Button size="sm" variant="outline" onClick={()=>addCPD(p.empId,2)}>+2h</Button></td><td className="p-2"><div className="h-2 rounded bg-slate-200"><div className="h-full bg-emerald-500 rounded" style={{width:`${pct}%`}}/></div><div className="text-[10px] text-slate-500 mt-0.5">{pct}% of {CPD_TARGET}</div></td></tr>; })}</tbody></table></div>
        </div>
      )}
    </div>
  );
}
