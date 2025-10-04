import React, { useState, useMemo } from 'react';
import { exportObjectsAsCSV } from '../../utils/csv';

// Expanded Workshop Management module with multi-tab NEP/CBSE workflow, modals & CSV export

const Button = ({ as:As='button', className='', ...p }) => <As className={'px-3 py-2 rounded-xl shadow-sm text-sm font-medium hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed '+className} {...p} />
const Card = ({ className='', children, title, subtitle, actions }) => <div className={'bg-white rounded-2xl shadow-sm border border-slate-200 p-4 '+className}>
  {(title||actions) && <div className="flex items-start gap-4"><div className="flex-1"><div className="text-sm font-semibold text-slate-800">{title}</div>{subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}</div>{actions}</div>}
  <div className={title?"mt-3":""}>{children}</div>
</div>
const Input = (p) => <input {...p} className={'w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm '+(p.className||'')} />
const Select = ({ value,onChange, children, className='' }) => <select value={value} onChange={e=>onChange(e.target.value)} className={'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm '+className}>{children}</select>
const Badge = ({ tone='slate', children }) => <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-${tone}-100 text-${tone}-700 border border-${tone}-200`}>{children}</span>
const Pill = ({ active, children, onClick }) => (
  <button onClick={onClick} className={`px-3 py-1.5 rounded-full border text-sm ${active?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}>{children}</button>
);
const Modal = ({ open, title, children, onClose, onSubmit, submitLabel='Save' }) => (
  <div className={`fixed inset-0 z-50 ${open?'':'pointer-events-none'}`}>
    <div className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open?'opacity-100':'opacity-0'}`} onClick={onClose} />
    <div className={`absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[560px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-slate-200 transform transition-all ${open?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
      <form onSubmit={e=>{e.preventDefault(); onSubmit();}} className="flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b flex items-center justify-between"><h3 className="text-sm font-semibold tracking-wide uppercase text-slate-700">{title}</h3><button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button></div>
        <div className="p-5 flex-1 overflow-y-auto text-sm space-y-4">{children}</div>
        <div className="px-5 py-4 border-t bg-slate-50 flex gap-2 justify-end"><button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border">Cancel</button><button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">{submitLabel}</button></div>
      </form>
    </div>
  </div>
);
const Toast = ({ children }) => <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow">{children}</div>;

const seedWorkshops = [
  {id:'w1', title:'AI & Robotics Bootcamp', wing:'Senior', audience:'Students', nepStrand:'Secondary', cbseTags:['Experiential','ATL/Tinkering'], outcomes:['Critical thinking','Problem solving'], assessment:'Project', mandatory:false, parentsInvited:false, date:'2025-10-05', status:'Planned', capacity:40, registered:28, room:'Lab A', facilitator:'Dr. Mehta', vendor:'RoboSpark'},
  {id:'w2', title:'NEP Aligned Lesson Design', wing:'Middle', audience:'Teachers', nepStrand:'Middle', cbseTags:['Experiential','Art-Integrated'], outcomes:['Lesson planning using LO'], assessment:'Reflection', mandatory:true, parentsInvited:false, date:'2025-10-09', status:'Open', capacity:30, registered:30, room:'AV Room', facilitator:'Ms. Rao', vendor:'—'},
  {id:'w3', title:'Parenting in the Digital Age', wing:'All', audience:'Parents', nepStrand:'All', cbseTags:['Safety & Cyber Awareness'], outcomes:['Digital wellbeing'], assessment:'Feedback', mandatory:false, parentsInvited:true, date:'2025-10-12', status:'Draft', capacity:120, registered:0, room:'Auditorium', facilitator:'Counsellor Team', vendor:'—'},
];

export default function WorkshopManagement(){
  const [tab,setTab] = useState('Planner');
  const [q,setQ] = useState('');
  const [wing,setWing] = useState('All');
  const [aud,setAud] = useState('All');
  const [status,setStatus] = useState('All');
  const [items,setItems] = useState(seedWorkshops);
  const [registrations,setRegistrations] = useState([
    { id:1, workshop:'AI & Robotics Bootcamp', student:'Ananya Gupta', grade:'XII', time:'2025-10-05', status:'Confirmed' },
    { id:2, workshop:'AI & Robotics Bootcamp', student:'Rahul Verma', grade:'XII', time:'2025-10-05', status:'Waitlist' },
    { id:3, workshop:'NEP Aligned Lesson Design', student:'Staff - Rao', grade:'Faculty', time:'2025-10-09', status:'Confirmed' },
  ]);
  const [resources,setResources] = useState([
    { id:'r1', title:'Design Thinking Slides', type:'Slide Deck', audience:'Students', updated:'2025-09-26', size:'2.3MB' },
    { id:'r2', title:'NEP Lesson Template', type:'Template', audience:'Teachers', updated:'2025-09-25', size:'120KB' },
  ]);
  const [vendors,setVendors] = useState([
    { id:'v1', name:'RoboSpark', domain:'STEM Labs', poc:'A. Mehta', email:'contact@robospark.io', workshops:4, rating:4.7 },
    { id:'v2', name:'MindWell', domain:'Wellness', poc:'R. Singh', email:'hello@mindwell.in', workshops:2, rating:4.5 },
  ]);
  const [approvals,setApprovals] = useState([
    { id:'ap1', workshop:'AI & Robotics Bootcamp', type:'Budget', requested:'₹25,000', status:'Pending', requestedBy:'Dr. Mehta', date:'2025-09-28' },
    { id:'ap2', workshop:'Parenting in the Digital Age', type:'Scheduling', requested:'Slot 12 Oct', status:'Pending', requestedBy:'Counsellor Team', date:'2025-09-29' },
  ]);
  const [modal,setModal] = useState(null); // {type, payload}
  const [toast,setToast] = useState(null);

  function notify(msg){ setToast(msg); setTimeout(()=>setToast(null),2200); }
  function doExport(rows, filename){
    if(!rows.length) return notify('Nothing to export');
    exportObjectsAsCSV(rows, filename, { bom:true });
  }

  const filtered = useMemo(()=> items.filter(w =>
    (wing==='All'||w.wing===wing||w.wing==='All') &&
    (aud==='All'||w.audience===aud) &&
    (status==='All'||w.status===status) &&
    (q===''||[w.title,w.facilitator,w.vendor,w.room,(w.cbseTags||[]).join(' '),(w.outcomes||[]).join(' ')].join(' ').toLowerCase().includes(q.toLowerCase()))
  ).sort((a,b)=> a.date.localeCompare(b.date)), [items,wing,aud,status,q]);

  const counts = useMemo(()=> ({
    Draft: items.filter(w=>w.status==='Draft').length,
    Planned: items.filter(w=>w.status==='Planned').length,
    Open: items.filter(w=>w.status==='Open').length,
    Full: items.filter(w=>w.status==='Full').length,
    Closed: items.filter(w=>w.status==='Closed').length,
  }),[items]);

  function updateStatus(id,next){ setItems(ws=> ws.map(w=> w.id===id?{...w,status:next}:w)); }

  function openModal(type,payload){ setModal({type,payload}); }
  function closeModal(){ setModal(null); }

  function handleCreate(data){
    switch(data.kind){
      case 'workshop':
        setItems(w=>[...w,{ id:'w'+Date.now(), title:data.title, wing:data.wing, audience:data.audience, date:data.date, status:'Draft', capacity: data.capacity||30, registered:0, nepStrand:data.nepStrand||'All', cbseTags:data.cbseTags?data.cbseTags.split(',').map(s=>s.trim()).filter(Boolean):[], outcomes:[], assessment:'', mandatory:false, parentsInvited:false, room:data.room||'TBD', facilitator:data.facilitator||'TBD', vendor:data.vendor||'—' }]);
        notify('Workshop drafted');
        break;
      case 'resource':
        setResources(r=>[...r,{ id:'r'+Date.now(), title:data.title, type:data.type, audience:data.audience, updated:new Date().toISOString().slice(0,10), size:data.size||'—' }]);
        notify('Resource added');
        break;
      case 'vendor':
        setVendors(v=>[...v,{ id:'v'+Date.now(), name:data.name, domain:data.domain, poc:data.poc, email:data.email, workshops:0, rating:0 }]);
        notify('Vendor added');
        break;
      default: break;
    }
    closeModal();
  }

  function modalContent(){
    if(!modal) return null;
    const common={ className:'w-full px-3 py-2 rounded-lg border text-sm' };
    if(modal.type==='workshop'){ const data={}; return <Modal open title="New Workshop" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'workshop'})}>
      <div className="grid gap-3">
        <input {...common} placeholder="Title" onChange={e=>data.title=e.target.value} required />
        <div className="grid grid-cols-2 gap-3">
          <select {...common} defaultValue="Senior" onChange={e=>data.wing=e.target.value}><option>Junior</option><option>Middle</option><option>Senior</option><option>All</option></select>
          <select {...common} defaultValue="Students" onChange={e=>data.audience=e.target.value}><option>Students</option><option>Teachers</option><option>Parents</option></select>
        </div>
        <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
        <input {...common} placeholder="Room / Venue" onChange={e=>data.room=e.target.value} />
        <input {...common} placeholder="Facilitator" onChange={e=>data.facilitator=e.target.value} />
        <input {...common} placeholder="Vendor (optional)" onChange={e=>data.vendor=e.target.value} />
        <input {...common} placeholder="CBSE Tags (comma separated)" onChange={e=>data.cbseTags=e.target.value} />
        <input type="number" {...common} placeholder="Capacity" onChange={e=>data.capacity=e.target.value} />
      </div>
    </Modal>; }
    if(modal.type==='resource'){ const data={}; return <Modal open title="Add Resource" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'resource'})}>
      <div className="grid gap-3">
        <input {...common} placeholder="Title" onChange={e=>data.title=e.target.value} required />
        <select {...common} defaultValue="Slide Deck" onChange={e=>data.type=e.target.value}><option>Slide Deck</option><option>Template</option><option>Worksheet</option><option>Reference</option></select>
        <select {...common} defaultValue="Students" onChange={e=>data.audience=e.target.value}><option>Students</option><option>Teachers</option><option>Parents</option></select>
        <input {...common} placeholder="Approx Size (e.g. 2MB)" onChange={e=>data.size=e.target.value} />
      </div>
    </Modal>; }
    if(modal.type==='vendor'){ const data={}; return <Modal open title="Add Vendor" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'vendor'})}>
      <div className="grid gap-3">
        <input {...common} placeholder="Name" onChange={e=>data.name=e.target.value} required />
        <input {...common} placeholder="Domain / Category" onChange={e=>data.domain=e.target.value} required />
        <input {...common} placeholder="Point of Contact" onChange={e=>data.poc=e.target.value} />
        <input type="email" {...common} placeholder="Email" onChange={e=>data.email=e.target.value} />
      </div>
    </Modal>; }
    return null;
  }

  const statCards = [
    {k:'Draft', v:counts.Draft},
    {k:'Planned', v:counts.Planned},
    {k:'Open', v:counts.Open},
    {k:'Full', v:counts.Full},
    {k:'Closed', v:counts.Closed},
  ];

  const plannerColumns = ['Draft','Planned','Open','Full'];

  const registrationsFiltered = registrations.filter(r => q==='' || (r.workshop+r.student).toLowerCase().includes(q.toLowerCase()));
  const resourcesFiltered = resources.filter(r => q==='' || r.title.toLowerCase().includes(q.toLowerCase()));
  const vendorsFiltered = vendors.filter(v => q==='' || v.name.toLowerCase().includes(q.toLowerCase()));
  const approvalsFiltered = approvals.filter(a => q==='' || a.workshop.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Workshop Management</h1>
            <p className="text-slate-500 text-sm">NEP/CBSE–aligned planning for students, teachers & parents.</p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-slate-900 text-white" onClick={()=>openModal('workshop')}>New Workshop</Button>
            <Button className="bg-white border border-slate-300" onClick={()=>doExport(filtered,'workshops.csv')}>Export CSV</Button>
          </div>
        </header>

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search title, facilitator, tags…" value={q} onChange={e=>setQ(e.target.value)} className="flex-1 min-w-[200px]" />
            <Select value={wing} onChange={setWing} className="w-36"><option>All</option><option>Junior</option><option>Middle</option><option>Senior</option><option>All</option></Select>
            <Select value={aud} onChange={setAud} className="w-40"><option>All</option><option>Students</option><option>Teachers</option><option>Parents</option></Select>
            <Select value={status} onChange={setStatus} className="w-40"><option>All</option><option>Draft</option><option>Planned</option><option>Open</option><option>Full</option><option>Closed</option></Select>
            <div className="ml-auto flex gap-2 flex-wrap">{statCards.map(s=> <div key={s.k} className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-medium"><span className="text-slate-500">{s.k}</span> <span className="font-semibold ml-1">{s.v}</span></div>)}</div>
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center gap-2 p-2 overflow-x-auto">
            {['Planner','Catalog','Registrations','Resources','Vendors','Approvals','Analytics','Settings'].map(t=> <Pill key={t} active={tab===t} onClick={()=>setTab(t)}>{t}</Pill>)}
          </div>
          <div className="p-4 space-y-6">
            {tab==='Planner' && (
              <div className="grid gap-4 md:grid-cols-4">
                {plannerColumns.map(col => (
                  <div key={col} className="space-y-2">
                    <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase flex items-center justify-between">
                      <span>{col}</span>
                      <span>{filtered.filter(w=>w.status===col).length}</span>
                    </div>
                    {filtered.filter(w=>w.status===col).map(w=> (
                      <div key={w.id} className="rounded-xl border p-3 bg-white shadow-sm space-y-2 group">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-sm leading-snug">{w.title}</div>
                            <div className="text-[11px] text-slate-500">{w.date} • {w.room}</div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                            {w.status!=='Closed' && <button onClick={()=>updateStatus(w.id, w.status==='Draft'?'Planned': w.status==='Planned'?'Open': w.status==='Open'?'Full':'Closed')} className="text-[10px] px-2 py-1 rounded-lg border bg-white hover:bg-slate-50">Next</button>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">{(w.cbseTags||[]).slice(0,3).map(t=> <Badge key={t}>{t}</Badge>)}{(w.cbseTags||[]).length>3 && <span className="text-[10px] text-slate-500">+{(w.cbseTags||[]).length-3}</span>}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500"><span>{w.audience}</span><span>{w.registered}/{w.capacity}</span></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {tab==='Catalog' && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(w=> (
                  <div key={w.id} className="rounded-xl border p-4 bg-white shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{w.title}</div>
                        <div className="text-xs text-slate-500">{w.nepStrand} • {w.audience}</div>
                      </div>
                      <Badge tone={w.status==='Open'?'emerald': w.status==='Draft'?'amber':'slate'}>{w.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">{w.cbseTags.slice(0,5).map(t=> <Badge key={t}>{t}</Badge>)}</div>
                    <div className="text-[11px] text-slate-500">Facilitator: {w.facilitator}</div>
                  </div>
                ))}
              </div>
            )}
            {tab==='Registrations' && (
              <div className="overflow-auto rounded-xl border bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600"><tr>{['Workshop','Student','Grade','Time','Status'].map(h=> <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                  <tbody>{registrationsFiltered.map(r=> <tr key={r.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{r.workshop}</td><td className="px-3 py-2">{r.student}</td><td className="px-3 py-2">{r.grade}</td><td className="px-3 py-2">{r.time}</td><td className="px-3 py-2">{r.status}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {tab==='Resources' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button className="border" onClick={()=>openModal('resource')}>Add Resource</Button>
                  <Button className="border" onClick={()=>doExport(resourcesFiltered,'resources.csv')}>Export</Button>
                  <span className="ml-auto text-xs text-slate-500">{resourcesFiltered.length} shown</span>
                </div>
                <div className="overflow-auto rounded-xl border bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600"><tr>{['Title','Type','Audience','Updated','Size'].map(h=> <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                    <tbody>{resourcesFiltered.map(r=> <tr key={r.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{r.title}</td><td className="px-3 py-2">{r.type}</td><td className="px-3 py-2">{r.audience}</td><td className="px-3 py-2">{r.updated}</td><td className="px-3 py-2">{r.size}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
            {tab==='Vendors' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button className="border" onClick={()=>openModal('vendor')}>Add Vendor</Button>
                  <Button className="border" onClick={()=>doExport(vendorsFiltered,'vendors.csv')}>Export</Button>
                  <span className="ml-auto text-xs text-slate-500">{vendorsFiltered.length} shown</span>
                </div>
                <div className="overflow-auto rounded-xl border bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600"><tr>{['Vendor','Domain','POC','Email','Workshops','Rating'].map(h=> <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                    <tbody>{vendorsFiltered.map(v=> <tr key={v.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{v.name}</td><td className="px-3 py-2">{v.domain}</td><td className="px-3 py-2">{v.poc}</td><td className="px-3 py-2">{v.email}</td><td className="px-3 py-2">{v.workshops}</td><td className="px-3 py-2">{v.rating}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
            {tab==='Approvals' && (
              <div className="overflow-auto rounded-xl border bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600"><tr>{['Workshop','Type','Requested','Status','By','Date'].map(h=> <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                  <tbody>{approvalsFiltered.map(a=> <tr key={a.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{a.workshop}</td><td className="px-3 py-2">{a.type}</td><td className="px-3 py-2">{a.requested}</td><td className="px-3 py-2">{a.status}</td><td className="px-3 py-2">{a.requestedBy}</td><td className="px-3 py-2">{a.date}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {tab==='Analytics' && (
              <div className="grid md:grid-cols-3 gap-4">
                <Card title="Status Breakdown" subtitle="Current workshops">
                  <div className="mt-2 space-y-1 text-xs">
                    {Object.entries(counts).map(([k,v])=> k!=='Closed' || v? <div key={k} className="flex items-center gap-2"><span className="w-16 text-slate-600">{k}</span><div className="flex-1 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-sky-500 rounded-full" style={{width: (items.length? (v/items.length*100):0)+'%'}} /></div><span className="w-8 text-right">{v}</span></div>:null)}
                  </div>
                </Card>
                <Card title="Audience Mix" subtitle="By open/planned">
                  <div className="text-xs mt-2 space-y-1">
                    {['Students','Teachers','Parents'].map(audType=> {
                      const v = items.filter(w=>['Open','Planned'].includes(w.status) && w.audience===audType).length;
                      return <div key={audType} className="flex items-center gap-2"><span className="w-16 text-slate-600">{audType}</span><div className="flex-1 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-emerald-500 rounded-full" style={{width:(v? (v/items.length*100):0)+'%'}} /></div><span className="w-8 text-right">{v}</span></div>;
                    })}
                  </div>
                </Card>
                <Card title="Fill Rate" subtitle="Registered / Capacity">
                  <div className="mt-2 text-xs space-y-2">
                    {items.slice(0,6).map(w=> <div key={w.id} className="flex items-center gap-2"><span className="flex-1 truncate" title={w.title}>{w.title}</span><div className="w-32 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-indigo-500 rounded-full" style={{width:Math.min(100,Math.round((w.registered/w.capacity)*100))+'%'}} /></div><span className="w-10 text-right">{w.registered}/{w.capacity}</span></div>)}
                  </div>
                </Card>
              </div>
            )}
            {tab==='Settings' && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card title="NEP Strands" subtitle="Reference only">
                  <ul className="text-xs space-y-1 text-slate-600"><li>Foundational</li><li>Preparatory</li><li>Middle</li><li>Secondary</li></ul>
                </Card>
                <Card title="CBSE Tag Legend" subtitle="Common taxonomy">
                  <div className="flex flex-wrap gap-1 mt-1 text-[11px]">{['Experiential','Art-Integrated','ATL/Tinkering','Safety & Cyber Awareness','Project Based','Skill Module'].map(t=> <Badge key={t}>{t}</Badge>)}</div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
      {toast && <Toast>{toast}</Toast>}
      {modalContent()}
    </div>
  );
}
