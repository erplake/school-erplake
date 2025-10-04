import React, { useState, useMemo, useEffect } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';
import { RequireCapability, useRBAC } from '../../context/RBACContext.jsx';

// Simple UI helpers
const Button = ({children,variant='default',size='md',className='',...p}) => <button {...p} className={`inline-flex items-center gap-1 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${variant==='outline'?'bg-white border-slate-300 text-slate-700 hover:bg-slate-50':variant==='ghost'?'bg-transparent border-transparent text-slate-600 hover:bg-slate-100':variant==='danger'?'bg-rose-600 border-rose-600 text-white hover:bg-rose-500':'bg-primary border-primary text-white hover:bg-primary/90'} ${size==='sm'?'h-8 px-2':'h-9 px-3'} ${className}`}>{children}</button>;
const Input = p => <input {...p} className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
const Textarea = p => <textarea {...p} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;

const STORAGE_KEY = 'discipline_incidents_v1';
const seedIncidents = [
  { id:'INC1001', date:'2025-10-01', student:'Aarav S (VII)', type:'Disruption', severity:'Low', status:'Open', summary:'Talking repeatedly during lesson', actions:['Warned'], owner:'Ms. Rao' },
  { id:'INC1002', date:'2025-10-01', student:'Myra K (VIII)', type:'Late Arrival', severity:'Low', status:'Closed', summary:'Arrived 25 minutes late', actions:['Recorded'], owner:'Mr. Gupta' },
  { id:'INC1003', date:'2025-10-02', student:'Advait R (IX)', type:'Bullying', severity:'High', status:'Under Review', summary:'Reported intimidation at recess', actions:['Separated','Interview Scheduled'], owner:'Counsellor' },
];

function exportIncidents(rows){
  if(!rows.length) return;
  const headers = Object.keys(rows[0]);
  const dataRows = rows.map(r => headers.map(h => r[h]));
  exportRowsAsCSV(headers, dataRows, { filename:'incidents.csv', bom:true });
}

export default function DisciplineCenter(){
  const [incidents,setIncidents] = useState(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }catch{} return seedIncidents; });
  const [filter,setFilter] = useState('');
  const [severity,setSeverity] = useState('All');
  const [status,setStatus] = useState('All');
  const [newForm,setNewForm] = useState({ student:'', type:'', severity:'Low', summary:'', owner:'', actions:'' });
  const [showNew,setShowNew] = useState(false);

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents)); }catch{} },[incidents]);

  const filtered = useMemo(()=> incidents.filter(i=>
      (filter==='' || i.student.toLowerCase().includes(filter.toLowerCase()) || i.type.toLowerCase().includes(filter.toLowerCase())) &&
      (severity==='All'||i.severity===severity) && (status==='All'||i.status===status)
    ),[incidents,filter,severity,status]);

  function addIncident(){ if(!newForm.student || !newForm.type) return; const row={ id:'INC'+Math.random().toString(36).slice(2,7), date:new Date().toISOString().slice(0,10), student:newForm.student, type:newForm.type, severity:newForm.severity, status:'Open', summary:newForm.summary, actions:newForm.actions? [newForm.actions]:[], owner:newForm.owner||'Unassigned' }; setIncidents(is=> [row,...is]); setNewForm({ student:'', type:'', severity:'Low', summary:'', owner:'', actions:'' }); setShowNew(false); }
  function updateStatus(id,next){ setIncidents(is=> is.map(i=> i.id===id? {...i,status:next}: i)); }
  function appendAction(id){ const note = prompt('Action / Note'); if(!note) return; setIncidents(is=> is.map(i=> i.id===id? {...i, actions:[...i.actions,note]}: i)); }

  const kpis = useMemo(()=>{ const open=incidents.filter(i=>i.status==='Open').length; const high=incidents.filter(i=>i.severity==='High').length; const review=incidents.filter(i=>i.status==='Under Review').length; return { total:incidents.length, open, high, review }; },[incidents]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Discipline Center</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <Input placeholder="Search" value={filter} onChange={e=>setFilter(e.target.value)} style={{maxWidth:200}} />
          <select value={severity} onChange={e=>setSeverity(e.target.value)} className="h-9 border rounded-md text-sm px-2"><option>All</option><option>Low</option><option>Medium</option><option>High</option></select>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="h-9 border rounded-md text-sm px-2"><option>All</option><option>Open</option><option>Under Review</option><option>Closed</option></select>
          <Button variant="outline" onClick={()=>exportIncidents(filtered)}>Export</Button>
          <RequireCapability capability="discipline.manage" fallback={<span className="text-xs text-slate-400">No manage right</span>}>
            <Button onClick={()=>setShowNew(true)}>New Incident</Button>
          </RequireCapability>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-4">
        <KPI label="Total" value={kpis.total} />
        <KPI label="Open" value={kpis.open} />
        <KPI label="High Severity" value={kpis.high} />
        <KPI label="Under Review" value={kpis.review} />
      </div>

      <div className="overflow-auto border rounded-md">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Student</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Severity</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Summary</th><th className="p-2 text-left">Actions</th></tr></thead>
          <tbody>
            {filtered.map(i=> <tr key={i.id} className="border-t"><td className="p-2">{i.date}</td><td className="p-2 font-medium">{i.student}</td><td className="p-2">{i.type}</td><td className="p-2">{i.severity}</td><td className="p-2">{i.status}</td><td className="p-2 truncate max-w-xs" title={i.summary}>{i.summary}</td><td className="p-2 flex gap-1 flex-wrap">
              <RequireCapability capability="discipline.manage" fallback={<span className="text-[10px] text-slate-400">View Only</span>}>
                <Button size="sm" variant="outline" onClick={()=>appendAction(i.id)}>Add Note</Button>
                {i.status==='Open' && <Button size="sm" variant="outline" onClick={()=>updateStatus(i.id,'Under Review')}>Review</Button>}
                {i.status!=='Closed' && <Button size="sm" variant="outline" onClick={()=>updateStatus(i.id,'Closed')}>Close</Button>}
              </RequireCapability>
            </td></tr>)}
            {filtered.length===0 && <tr><td colSpan={7} className="p-4 text-center text-xs text-slate-500">No incidents found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center py-10 overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-xl p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-medium text-sm">New Incident</h2><button onClick={()=>setShowNew(false)} className="p-1 rounded hover:bg-slate-100">✕</button></div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1 md:col-span-1"><span className="text-[11px] uppercase text-slate-500">Student</span><Input value={newForm.student} onChange={e=>setNewForm(f=>({...f,student:e.target.value}))} placeholder="Name (Class)" /></label>
              <label className="space-y-1 md:col-span-1"><span className="text-[11px] uppercase text-slate-500">Type</span><Input value={newForm.type} onChange={e=>setNewForm(f=>({...f,type:e.target.value}))} placeholder="Incident Type" /></label>
              <label className="space-y-1 md:col-span-1"><span className="text-[11px] uppercase text-slate-500">Severity</span><select value={newForm.severity} onChange={e=>setNewForm(f=>({...f,severity:e.target.value}))} className="h-9 w-full border rounded-md px-2"><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="space-y-1 md:col-span-1"><span className="text-[11px] uppercase text-slate-500">Owner</span><Input value={newForm.owner} onChange={e=>setNewForm(f=>({...f,owner:e.target.value}))} placeholder="Assigned Staff" /></label>
              <label className="space-y-1 md:col-span-2"><span className="text-[11px] uppercase text-slate-500">Summary</span><Textarea rows={4} value={newForm.summary} onChange={e=>setNewForm(f=>({...f,summary:e.target.value}))} placeholder="Short description" /></label>
              <label className="space-y-1 md:col-span-2"><span className="text-[11px] uppercase text-slate-500">Initial Action</span><Input value={newForm.actions} onChange={e=>setNewForm(f=>({...f,actions:e.target.value}))} placeholder="e.g. Warned / Logged" /></label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowNew(false)}>Cancel</Button>
              <Button onClick={addIncident} disabled={!newForm.student || !newForm.type}>Add Incident</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({label,value}){ return <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-1"><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>; }
