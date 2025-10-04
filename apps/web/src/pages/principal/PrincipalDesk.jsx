import React, { useState, useMemo, useEffect } from 'react';

// Lightweight primitives
const Card = ({children,className=''}) => <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
const CardContent = ({children,className=''}) => <div className={`p-4 ${className}`}>{children}</div>;
const Button = ({children,variant='default',size='md',className='',...p}) => <button {...p} className={`inline-flex items-center gap-1 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${variant==='outline'?'bg-white border-slate-300 text-slate-700 hover:bg-slate-50':variant==='ghost'?'bg-transparent border-transparent text-slate-600 hover:bg-slate-100':variant==='danger'?'bg-rose-600 border-rose-600 text-white hover:bg-rose-500':'bg-primary border-primary text-white hover:bg-primary/90'} ${size==='sm'?'h-8 px-2':'h-9 px-3'} ${className}`}>{children}</button>;
const Badge = ({children,tone='slate'}) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border bg-slate-50 text-${tone}-700 border-${tone}-200`}>{children}</span>;

const sampleApprovals = [
  { id: 1, type: 'Weekly Planner', item: 'Class 7B — Week 41', owner: 'HM Middle Wing', wing: 'Middle', dueDate: '2025-10-03', status: 'Pending', slaHours: 18 },
  { id: 2, type: 'Leave', item: 'Ms. Verma (Math) • 10 Oct', owner: 'Teacher', wing: 'Senior', dueDate: '2025-10-05', status: 'Pending', slaHours: 36 },
  { id: 3, type: 'Purchase', item: 'Science Lab — Glassware Kit', owner: 'Bursar', wing: 'Senior', dueDate: '2025-10-04', status: 'Needs Info', slaHours: 8 },
  { id: 4, type: 'Broadcast', item: 'PTM schedule draft', owner: 'Marketing', wing: 'All', dueDate: '2025-10-02', status: 'Pending', slaHours: 4 },
  { id: 5, type: 'Monthly Planner', item: 'Primary Wing — November', owner: 'HM Primary', wing: 'Primary', dueDate: '2025-10-09', status: 'Pending', slaHours: 72 },
];
const sampleCompliance = [
  { id: 11, title: 'Fire Safety Drill (Q3)', owner: 'Admin', dueDate: '2025-10-07', risk: 'Medium', status: 'Scheduled' },
  { id: 12, title: 'Lab Chemical Register Audit', owner: 'Sci. HoD', dueDate: '2025-10-12', risk: 'High', status: 'Pending' },
  { id: 13, title: 'Elevator AMC Certificate', owner: 'Vendor', dueDate: '2025-10-15', risk: 'Low', status: 'In Progress' },
  { id: 14, title: 'Affiliation Renewal — British Council', owner: 'Principal', dueDate: '2025-11-01', risk: 'Medium', status: 'Draft' },
];
const sampleAdmissions = { pipeline:[{stage:'New Leads',count:84},{stage:'Toured',count:41},{stage:'Applied',count:28},{stage:'Offered',count:17},{stage:'Enrolled',count:12}], hotList:[{id:'A101',name:'Aarav S.',grade:'KG',source:'Website',owner:'Counsellor 1',next:'Call 03 Oct'},{id:'A094',name:'Myra K.',grade:'II',source:'Walk‑in',owner:'Counsellor 2',next:'Tour 05 Oct'},{id:'A076',name:'Advait R.',grade:'VI',source:'Event QR',owner:'Counsellor 1',next:'Docs 04 Oct'}] };
const sampleFinance = [ { cls:'I', target:120, collected:92 },{ cls:'II', target:118, collected:88 },{ cls:'III', target:115, collected:93 },{ cls:'VII', target:110, collected:75 },{ cls:'X', target:98, collected:70 }];
const sampleUtilization = [ { wing:'Primary', utilization:82, openRoles:1 },{ wing:'Middle', utilization:88, openRoles:2 },{ wing:'Senior', utilization:91, openRoles:0 }];
const sampleAnnouncementsTemplates = [ { id:'t1', title:'Weekly Highlights', checklist:['Celebrations & Kudos','Upcoming Events','Reminders','Action Items'] }, { id:'t2', title:'Safety Drill Notice', checklist:['Date/Time','Assembly Points','Wing Order','Teacher Duties'] }, { id:'t3', title:'Exam Window Brief', checklist:['Syllabus Link','Schedules','Stationery','Rules'] }];
const teacherList = ['Ms. Rao','Mr. Iyer','Ms. Verma','Mr. Gupta','Ms. Kapoor'];
const initialTodos = [ { id:'td1', title:'Publish weekly plan', audience:'Teachers', due:'2025-10-04', assignments:[{name:'Ms. Rao',status:'Pending'},{name:'Mr. Iyer',status:'Pending'}] }, { id:'td2', title:'Sports day duty grid', audience:'Heads', due:'2025-10-06', assignments:[{name:'HM Primary',status:'Done'},{name:'HM Middle',status:'Pending'}] } ];

function toCSV(rows, headers){ if(!rows?.length) return ''; const cols = headers || Object.keys(rows[0]); const lines=[cols.join(','), ...rows.map(r=> cols.map(c=> JSON.stringify(r[c]??'')).join(','))]; return lines.join('\n'); }
function download(filename,text){ const blob=new Blob([text],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }
function pct(a,b){ if(!b) return 0; return Math.round((a/b)*100); }
function statusBadge(status){ const map={Pending:'bg-amber-50 text-amber-700 border-amber-200', 'Needs Info':'bg-sky-50 text-sky-700 border-sky-200', Approved:'bg-emerald-50 text-emerald-700 border-emerald-200', Rejected:'bg-rose-50 text-rose-700 border-rose-200'}; return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${map[status]||'bg-slate-50 text-slate-600 border-slate-200'}`}>{status}</span>; }

export default function PrincipalDesk(){
  const [wing,setWing] = useState('All');
  const [year,setYear] = useState('2025-26');
  const [query,setQuery] = useState('');
  const [approvals,setApprovals] = useState(()=>{ try{ const r=localStorage.getItem('pr_approvals'); if(r) return JSON.parse(r); }catch{} return sampleApprovals; });
  const [broadcastOpen,setBroadcastOpen] = useState(false);
  const [compose,setCompose] = useState({ template:'t1', subject:'', body:'', schedule:'' });
  const [ackRequired,setAckRequired] = useState(true);
  const [plannerLock,setPlannerLock] = useState(()=>{ try{ const r=localStorage.getItem('pr_planner_lock'); if(r) return JSON.parse(r); }catch{} return { Primary:false, Middle:false, Senior:false }; });
  const [toDos,setToDos] = useState(()=>{ try{ const r=localStorage.getItem('pr_todos'); if(r) return JSON.parse(r); }catch{} return initialTodos; });
  const [assignDlgOpen,setAssignDlgOpen] = useState(false);
  const [todoDraft,setTodoDraft] = useState({ title:'', audience:'Teachers', due:'', assignees:Object.fromEntries(teacherList.map(t=> [t,false])) });
  const [trackTodoId,setTrackTodoId] = useState(null);

  // persistence
  useEffect(()=>{ try{ localStorage.setItem('pr_approvals', JSON.stringify(approvals)); }catch{} },[approvals]);
  useEffect(()=>{ try{ localStorage.setItem('pr_planner_lock', JSON.stringify(plannerLock)); }catch{} },[plannerLock]);
  useEffect(()=>{ try{ localStorage.setItem('pr_todos', JSON.stringify(toDos)); }catch{} },[toDos]);

  const filteredApprovals = useMemo(()=> approvals.filter(a=> (wing==='All'||a.wing===wing || a.wing==='All') && (query==='' || a.item.toLowerCase().includes(query.toLowerCase()) || a.type.toLowerCase().includes(query.toLowerCase())) ), [approvals,wing,query]);
  const kpis = useMemo(()=>{ const total=approvals.length; const pending=approvals.filter(a=>a.status==='Pending').length; const needs=approvals.filter(a=>a.status==='Needs Info').length; const done=approvals.filter(a=>a.status==='Approved').length; return { total, pending, needs, done }; },[approvals]);
  function isPlannerRow(a){ return a.type.includes('Planner'); }
  function isLockedFor(wingName){ return !!plannerLock[wingName]; }
  function togglePlannerGate(){ if(wing==='All'){ setPlannerLock(l=> ({ Primary:!l.Primary, Middle:!l.Middle, Senior:!l.Senior })); } else { setPlannerLock(l=> ({...l,[wing]: !l[wing]})); } }
  function approve(id){ setApprovals(as=> as.map(a=> a.id===id? {...a,status:'Approved'}: a)); }
  function sendBack(id){ setApprovals(as=> as.map(a=> a.id===id? {...a,status:'Needs Info'}: a)); }
  function exportApprovals(){ download('approvals.csv', toCSV(approvals)); }
  function exportCompliance(){ download('compliance.csv', toCSV(sampleCompliance)); }
  function exportAdmissions(){ const rows=[...sampleAdmissions.pipeline.map(p=> ({ stage:p.stage, count:p.count })), ...sampleAdmissions.hotList.map(h=> ({ stage:'Hot:'+h.id, count:h.next }))]; download('admissions.csv', toCSV(rows)); }
  const financeCols=['cls','target','collected','percent']; const financeRows = sampleFinance.map(f=> ({...f, percent: pct(f.collected,f.target)+'%'}));
  function exportFinance(){ download('finance.csv', toCSV(financeRows, financeCols)); }
  function todoProgress(todo){ if(!todo.assignments?.length) return 0; const done = todo.assignments.filter(a=> a.status==='Done').length; return pct(done, todo.assignments.length); }
  function assignTodo(){ const assignees = Object.entries(todoDraft.assignees).filter(([_,v])=>v).map(([name])=> ({ name, status:'Pending' })); if(!todoDraft.title || !assignees.length) return; const row={ id:'td'+Math.random().toString(36).slice(2,7), title:todoDraft.title, audience:todoDraft.audience, due:todoDraft.due, assignments:assignees }; setToDos(t=> [row,...t]); setTodoDraft({ title:'', audience:'Teachers', due:'', assignees:Object.fromEntries(teacherList.map(t=> [t,false])) }); setAssignDlgOpen(false); }
  function toggleAssignee(todoId,name){ setToDos(ts=> ts.map(t=> t.id===todoId? {...t, assignments:t.assignments.map(a=> a.name===name? {...a, status:a.status==='Done'?'Pending':'Done'}: a)}: t)); }

  const gateLocked = wing==='All'? (plannerLock.Primary && plannerLock.Middle && plannerLock.Senior) : isLockedFor(wing);
  const today = new Date().toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric' });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Principal Desk</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="h-9 rounded-md border border-slate-300 text-sm px-2" value={wing} onChange={e=>setWing(e.target.value)}><option value="All">All Wings</option><option>Primary</option><option>Middle</option><option>Senior</option></select>
          <input className="h-9 rounded-md border border-slate-300 text-sm px-2" placeholder="Search approvals" value={query} onChange={e=>setQuery(e.target.value)} />
          <Button variant="outline" onClick={togglePlannerGate}>{gateLocked? 'Unlock Planners':'Lock Planners'}</Button>
          <Button variant="outline" onClick={exportApprovals}>Export Approvals</Button>
          <Button variant="outline" onClick={exportCompliance}>Export Compliance</Button>
          <Button variant="outline" onClick={exportAdmissions}>Export Admissions</Button>
          <Button variant="outline" onClick={exportFinance}>Export Finance</Button>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Approvals (Total)</div><div className="text-lg font-semibold">{kpis.total}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Pending</div><div className="text-lg font-semibold">{kpis.pending}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Needs Info</div><div className="text-lg font-semibold">{kpis.needs}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Approved</div><div className="text-lg font-semibold">{kpis.done}</div></CardContent></Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Approvals Queue</h2>
        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50"><tr><th className="p-2 text-left">Type</th><th className="p-2 text-left">Item</th><th className="p-2 text-left">Wing</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th></tr></thead>
            <tbody>
              {filteredApprovals.map(a=> <tr key={a.id} className="border-t"><td className="p-2 font-medium">{a.type}</td><td className="p-2">{a.item}</td><td className="p-2">{a.wing}</td><td className="p-2">{a.dueDate}</td><td className="p-2">{statusBadge(a.status)}</td><td className="p-2 flex gap-1">{a.status==='Pending' && <Button size="sm" variant="outline" onClick={()=>approve(a.id)}>Approve</Button>}{a.status!=='Approved' && <Button size="sm" variant="outline" onClick={()=>sendBack(a.id)}>Send Back</Button>}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card className="col-span-2"><CardContent className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-medium">To‑Dos (Assignments)</h3><Button size="sm" variant="outline" onClick={()=>setAssignDlgOpen(true)}>New</Button></div>
          <div className="space-y-2">
            {toDos.map(td=> <div key={td.id} className="border rounded-md p-3 space-y-2 bg-white">
              <div className="flex items-center justify-between text-xs"><span className="font-medium text-slate-700">{td.title}</span><span className="text-slate-500">Due {td.due||'—'} • {todoProgress(td)}%</span></div>
              <div className="flex flex-wrap gap-1">{td.assignments.map(a=> <button key={a.name} onClick={()=>toggleAssignee(td.id,a.name)} className={`px-2 py-0.5 rounded-full text-[11px] border ${a.status==='Done'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-slate-50 border-slate-200 text-slate-600'}`}>{a.name}{a.status==='Done'?' ✓':''}</button>)}</div>
            </div>)}
            {toDos.length===0 && <div className="text-xs text-slate-500">No to‑dos.</div>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="space-y-3">
          <h3 className="text-sm font-medium">Planner Locks</h3>
          <div className="space-y-2 text-xs">
            {['Primary','Middle','Senior'].map(w=> <div key={w} className="flex items-center justify-between"><span>{w}</span><button onClick={()=>setPlannerLock(l=> ({...l,[w]: !l[w]}))} className={`px-2 py-0.5 rounded-md border text-[11px] ${plannerLock[w]?'bg-rose-50 border-rose-200 text-rose-700':'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{plannerLock[w]?'Locked':'Open'}</button></div>)}
          </div>
          <div className="text-[11px] text-slate-500">Global toggle affects all; per-wing overrides allowed.</div>
        </CardContent></Card>
      </section>

      {assignDlgOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center py-10 overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-xl p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-medium text-sm">New To‑Do Assignment</h2><button onClick={()=>setAssignDlgOpen(false)} className="p-1 rounded hover:bg-slate-100">✕</button></div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1 col-span-2"><span className="text-[11px] uppercase text-slate-500">Title</span><InputLike value={todoDraft.title} onChange={e=>setTodoDraft(d=>({...d,title:e.target.value}))} placeholder="Task title" /></label>
              <label className="space-y-1"><span className="text-[11px] uppercase text-slate-500">Audience</span><select className="h-9 w-full rounded-md border border-slate-300 text-sm px-2" value={todoDraft.audience} onChange={e=>setTodoDraft(d=>({...d,audience:e.target.value}))}><option>Teachers</option><option>Heads</option><option>All Staff</option></select></label>
              <label className="space-y-1"><span className="text-[11px] uppercase text-slate-500">Due</span><InputLike type="date" value={todoDraft.due} onChange={e=>setTodoDraft(d=>({...d,due:e.target.value}))} /></label>
              <div className="col-span-2 space-y-1"><span className="text-[11px] uppercase text-slate-500">Assignees</span><div className="flex flex-wrap gap-2">{teacherList.map(t=> <button type="button" key={t} onClick={()=>setTodoDraft(d=> ({...d, assignees:{...d.assignees,[t]: !d.assignees[t]}}))} className={`px-2 py-0.5 rounded-md border text-[11px] ${todoDraft.assignees[t]?'bg-primary text-white border-primary':'bg-slate-50 border-slate-200 text-slate-600'}`}>{t}</button>)}</div></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setAssignDlgOpen(false)}>Cancel</Button><Button onClick={assignTodo}>Add</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

const InputLike = (p) => <input {...p} className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
