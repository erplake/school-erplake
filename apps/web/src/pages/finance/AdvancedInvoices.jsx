import React, { useState, useMemo, useEffect } from 'react';

// Utility helpers
const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n || 0));
const cn = (...a) => a.filter(Boolean).join(' ');
const statusStyles = { Paid:"bg-green-100 text-green-800 ring-1 ring-green-200", Unpaid:"bg-gray-100 text-gray-800 ring-1 ring-gray-200", Partial:"bg-amber-100 text-amber-800 ring-1 ring-amber-200", Overdue:"bg-red-100 text-red-800 ring-1 ring-red-200", Refunded:"bg-purple-100 text-purple-800 ring-1 ring-purple-200" };
const freqPalette = { Monthly:"bg-blue-50 text-blue-700", Quarterly:"bg-cyan-50 text-cyan-700", Yearly:"bg-indigo-50 text-indigo-700", 'Ad hoc':"bg-fuchsia-50 text-fuchsia-700" };
const todayISO = () => new Date().toISOString().slice(0, 10);

// Demo core data (trimmed for brevity)
const demoStudents = [
  { id:'S001', name:'Aarav Sharma', klass:'IV', section:'A', admissionNo:'ADM/24/0001', classTeacher:'Ms. N. Kapoor', teacherEmail:'n.kapoor@school.example', address:{ line1:'H-24, Green Park', city:'New Delhi', pin:'110016' } },
  { id:'S006', name:'Zara Khan', klass:'I', section:'B', admissionNo:'ADM/24/0142', classTeacher:'Mr. R. Iyer', teacherEmail:'r.iyer@school.example', address:{ line1:'12, Rose Avenue', city:'New Delhi', pin:'110049' } },
];

// Minimal invoice generator
const invoiceSeed = (()=>{
  const rows=[]; let idx=1; const statuses=['Paid','Unpaid','Partial','Overdue'];
  for(let m=4; m<=9; m++){
    for(const s of demoStudents){
      const status = statuses[(idx + m) % statuses.length];
      const amount = 12000 + (m%3)*500;
      rows.push({ id:`INV-${idx.toString().padStart(4,'0')}`, studentId:s.id, klass:s.klass, section:s.section, month:m, due:`2025-${String(m).padStart(2,'0')}-10`, status, freq:'Monthly', heads:[{ head:'Tuition', amount }], payments: status==='Paid'?[{ amount, date:`2025-${String(m).padStart(2,'0')}-05` }]: status==='Partial'?[{ amount: amount*0.5, date:`2025-${String(m).padStart(2,'0')}-06` }]:[] });
      idx++;
    }
  }
  return rows.reverse();
})();

const adhocCharges = [
  { id:'AH-0001', title:'Science Museum Field Trip', category:'Field Trip', amount:800, dueDate:'2025-10-05', audience:{ klass:'IV', section:'A' }, description:'Day trip to National Science Centre.' },
  { id:'AH-0004', title:'Robotics Club Kit', category:'Extra-curricular', amount:1200, dueDate:'2025-10-18', audience:'ALL', description:'Starter kit (optional).' },
];

const demoDM = {
  S001:[ { from:'teacher', name:'Ms. N. Kapoor', time:'2025-09-27T09:30:00', text:'Aarav presented his science project well!' }, { from:'parent', name:'You', time:'2025-09-27T10:05:00', text:'Thank you.' } ],
  S006:[ { from:'teacher', name:'Mr. R. Iyer', time:'2025-09-26T12:45:00', text:'Zara is settling in well.' } ],
};

function Stat({ label, value, sub }){
  return (
    <div className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function Badge({ children, className }){ return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', className)}>{children}</span>; }

export default function AdvancedInvoices(){
  const [role,setRole]=useState('Parent');
  const parentWardIds=['S001','S006'];
  const wards=demoStudents.filter(s=>parentWardIds.includes(s.id));
  const [activeWardId,setActiveWardId]=useState(parentWardIds[0]);
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('All');
  const [page,setPage]=useState(1); const pageSize=8;
  const invoices=useMemo(()=>invoiceSeed,[ ]);
  const activeWard = wards.find(w=>w.id===activeWardId);

  const wardInvoices = id => invoices.filter(i=>i.studentId===id);
  const filtered = useMemo(()=>{
    let rows = role==='Parent'? wardInvoices(activeWardId): invoices;
    if(status!=='All') rows = rows.filter(r=>r.status===status);
    if(query) rows = rows.filter(r=> r.id.toLowerCase().includes(query.toLowerCase()));
    return rows;
  },[invoices, role, activeWardId, status, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(()=> setPage(1), [role, activeWardId, status, query]);
  const pageRows = filtered.slice((page-1)*pageSize, page*pageSize);

  const wardTotals = (id) => {
    const rows = wardInvoices(id);
    let paid=0,due=0,partial=0,overdue=0; for(const r of rows){ const total=r.heads.reduce((a,h)=>a+h.amount,0); if(r.status==='Paid') paid+=total; else if(r.status==='Unpaid') due+=total; else if(r.status==='Partial') partial+=total; else if(r.status==='Overdue') overdue+=total; }
    return { paid, due, partial, overdue };
  };
  const wt=wardTotals(activeWardId);

  const activeThread = demoDM[activeWardId]||[];
  const [dmDraft,setDmDraft]=useState('');
  function sendDM(){ if(!dmDraft.trim()) return; activeThread.push({ from:'parent', name:'You', time:new Date().toISOString(), text:dmDraft.trim() }); setDmDraft(''); }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices (Preview)</h1>
          <p className="text-sm text-gray-500">Parent-first invoices & class communication (demo).</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Role:</span>
          <button onClick={()=>setRole('Parent')} className={cn('px-3 py-1.5 rounded-md border text-xs', role==='Parent'?'bg-gray-900 text-white':'bg-white hover:bg-gray-50')}>Parent</button>
          <button onClick={()=>setRole('Admin')} className={cn('px-3 py-1.5 rounded-md border text-xs', role==='Admin'?'bg-gray-900 text-white':'bg-white hover:bg-gray-50')}>Admin</button>
        </div>
      </header>

      {role==='Parent' && (
        <div className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {wards.map(w => (
              <button key={w.id} onClick={()=>setActiveWardId(w.id)} className={cn('px-3 py-1.5 rounded-full text-xs border', activeWardId===w.id?'bg-gray-900 text-white border-gray-900':'bg-white hover:bg-gray-50')}>{w.name}</button>
            ))}
            <div className="ml-auto flex gap-2 text-xs">
              <select value={status} onChange={e=>setStatus(e.target.value)} className="h-8 rounded-md border px-2">
                {['All','Paid','Unpaid','Partial','Overdue','Refunded'].map(s=> <option key={s}>{s}</option>)}
              </select>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ID" className="h-8 rounded-md border px-2 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Paid" value={formatINR(wt.paid)} />
            <Stat label="Due" value={formatINR(wt.due)} />
            <Stat label="Partial" value={formatINR(wt.partial)} />
            <Stat label="Overdue" value={formatINR(wt.overdue)} />
          </div>
          <div className="space-y-3">
            {pageRows.map(inv => { const total=inv.heads.reduce((a,h)=>a+h.amount,0); const paid=inv.payments.reduce((a,p)=>a+p.amount,0); const bal=total-paid; return (
              <div key={inv.id} className="rounded-xl border p-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{inv.id}</span>
                    <Badge className={cn('text-[10px] px-2 py-0.5', statusStyles[inv.status])}>{inv.status}</Badge>
                    <Badge className={cn('text-[10px] px-2 py-0.5', freqPalette[inv.freq])}>{inv.freq}</Badge>
                    <span className="text-[11px] text-gray-500">Due {inv.due}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                    {inv.heads.map(h=> <span key={h.head}>{h.head}: {formatINR(h.amount)}</span>)}
                  </div>
                </div>
                <div className="text-xs grid grid-cols-3 gap-2 md:w-56">
                  <div><div className="text-[10px] text-gray-500">Total</div><div className="font-medium">{formatINR(total)}</div></div>
                  <div><div className="text-[10px] text-gray-500">Paid</div><div className="font-medium">{formatINR(paid)}</div></div>
                  <div><div className="text-[10px] text-gray-500">Balance</div><div className="font-medium">{formatINR(bal)}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50">Pay</button>
                  <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50">Receipt</button>
                </div>
              </div>
            ); })}
            {pageRows.length===0 && <div className="text-xs text-gray-500">No invoices.</div>}
          </div>
          <div className="flex items-center justify-between pt-2 border-t mt-2">
            <div className="text-[11px] text-gray-500">Page {page} / {pageCount}</div>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="text-xs rounded-md border px-2 py-1 disabled:opacity-40">Prev</button>
              <button disabled={page===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))} className="text-xs rounded-md border px-2 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}

      {role==='Parent' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold">Optional / Ad hoc Charges</h3>
            {adhocCharges.map(ch => (
              <div key={ch.id} className="rounded-xl border p-3 text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{ch.title}</span>
                  <span className="text-[11px] text-gray-500">Due {ch.dueDate}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                  <span>{formatINR(ch.amount)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px]">{ch.category}</span>
                </div>
                <p className="text-[11px] text-gray-500">{ch.description}</p>
                <div className="flex gap-2">
                  <button className="text-[11px] rounded-md border px-2 py-1 hover:bg-gray-50">Add</button>
                  <button className="text-[11px] rounded-md border px-2 py-1 hover:bg-gray-50">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-white p-4 flex flex-col">
            <h3 className="text-sm font-semibold mb-2">Teacher Messages</h3>
            <div className="flex-1 overflow-auto space-y-2 text-xs pr-1 max-h-64">
              {activeThread.map((m,i)=>(
                <div key={i} className={cn('rounded-md p-2 max-w-[80%]', m.from==='teacher'?'bg-gray-100 self-start':'bg-blue-50 self-end ml-auto')}>
                  <div className="text-[10px] font-medium mb-0.5 text-gray-500">{m.name}</div>
                  <div>{m.text}</div>
                  <div className="text-[9px] text-gray-400 mt-1">{new Date(m.time).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <form onSubmit={e=>{ e.preventDefault(); sendDM(); }} className="mt-2 flex gap-2">
              <input value={dmDraft} onChange={e=>setDmDraft(e.target.value)} placeholder="Type message" className="flex-1 rounded-md border px-2 h-8 text-xs" />
              <button className="text-xs rounded-md border px-3 h-8 hover:bg-gray-50">Send</button>
            </form>
          </div>
        </div>
      )}

      {role==='Admin' && (
        <div className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-sm font-semibold">Admin Snapshot (demo)</h2>
          <p className="text-xs text-gray-500">This preview focuses on parent view. Extend to include aging, reconciliation, GST breakup, exports.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Paid','Unpaid','Partial','Overdue'].map(s=>{ const rows=invoices.filter(r=>r.status===s); const total=rows.reduce((a,r)=>a+r.heads.reduce((x,h)=>x+h.amount,0),0); return <Stat key={s} label={s} value={formatINR(total)} />; })}
          </div>
        </div>
      )}
    </div>
  );
}
