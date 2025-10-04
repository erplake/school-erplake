import React, { useState, useMemo } from 'react';
import { exportObjectsAsCSV } from '../../utils/csv';

// Expanded Lab Management: Bookings, Equipment, Labs, Chemicals, Incidents, Vendors, Purchases, Templates, Analytics

const LABS = [
  { id:'chem', name:'Chemistry' },
  { id:'phys', name:'Physics' },
  { id:'bio', name:'Biology' },
  { id:'comp', name:'Computer/ICT' },
  { id:'robot', name:'Robotics / ATL' },
  { id:'ai', name:'AI/ML' },
];

const seedBookings = [
  { id:1, date:'2025-10-03', period:'P2', lab:'Chemistry', class:'9-B', teacher:'A. Sharma', experiment:'Acid-Base Titration', status:'Confirmed' },
  { id:2, date:'2025-10-03', period:'P2', lab:'Physics', class:'10-A', teacher:'R. Iyer', experiment:'Motion on Inclined Plane', status:'Pending' },
  { id:3, date:'2025-10-04', period:'P5', lab:'Computer/ICT', class:'8-C', teacher:'P. Menon', experiment:'Scratch Game', status:'Confirmed' },
];
const seedEquipment = [
  { id:'eq-01', lab:'Chemistry', name:'pH Meter', qty:2, status:'Available', lastUse:'2025-09-26' },
  { id:'eq-02', lab:'Physics', name:'Oscilloscope', qty:3, status:'In Use', lastUse:'2025-09-29' },
  { id:'eq-03', lab:'Biology', name:'Compound Microscope', qty:10, status:'Under Maintenance', lastUse:'2025-09-22' },
];
const seedChemicals = [
  { id:'c1', lab:'Chemistry', name:'Sodium Chloride', grade:'AR', qty:500, unit:'g', hazard:'Low', expiry:'2027-05', location:'Cabinet A2' },
  { id:'c2', lab:'Chemistry', name:'Sulfuric Acid 1M', grade:'LR', qty:2, unit:'L', hazard:'High', expiry:'2026-11', location:'Acid Locker' },
];
const seedIncidents = [
  { id:'in1', date:'2025-09-20', lab:'Chemistry', type:'Spill', severity:'Minor', reportedBy:'Lab Tech', status:'Closed' },
  { id:'in2', date:'2025-09-28', lab:'Physics', type:'Equipment Fault', severity:'Moderate', reportedBy:'R. Iyer', status:'Open' },
];
const seedVendors = [
  { id:'v1', name:'EduLab Supplies', domain:'General Lab', poc:'S. Das', rating:4.6, items:120 },
  { id:'v2', name:'OptiSci Instruments', domain:'Physics', poc:'N. Kapoor', rating:4.2, items:45 },
];
const seedPurchases = [
  { id:'p1', date:'2025-09-25', item:'Microscope Slides', qty:200, vendor:'EduLab Supplies', cost:1500, status:'Delivered' },
  { id:'p2', date:'2025-09-28', item:'Raspberry Pi 5', qty:5, vendor:'OptiSci Instruments', cost:35000, status:'Pending' },
];
const seedTemplates = [
  { id:'t1', lab:'Chemistry', title:'Titration Report', type:'Report', updated:'2025-09-15' },
  { id:'t2', lab:'Physics', title:'Projectile Motion Lab', type:'Worksheet', updated:'2025-09-21' },
];

const Button = ({ className='', ...p }) => <button className={'px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50 disabled:opacity-50 '+className} {...p} />
const Pill = ({ active, children, onClick }) => <button onClick={onClick} className={`px-3 py-1.5 rounded-full border text-sm ${active?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>{children}</button>
const Badge = ({ tone='slate', children }) => <span className={`px-2 py-0.5 rounded-full text-[11px] bg-${tone}-100 text-${tone}-700 border border-${tone}-200`}>{children}</span>
const Modal = ({ open, title, children, onClose, onSubmit, submitLabel='Save' }) => (
  <div className={`fixed inset-0 z-50 ${open?'':'pointer-events-none'}`}>
    <div className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open?'opacity-100':'opacity-0'}`} onClick={onClose} />
    <div className={`absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[520px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-slate-200 transform transition-all ${open?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
      <form onSubmit={e=>{e.preventDefault(); onSubmit();}} className="flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h3><button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button></div>
        <div className="p-5 flex-1 overflow-y-auto text-sm space-y-4">{children}</div>
        <div className="px-5 py-4 border-t bg-slate-50 flex justify-end gap-2"><button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border">Cancel</button><button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">{submitLabel}</button></div>
      </form>
    </div>
  </div>
);
const Toast = ({ children }) => <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow">{children}</div>;

export default function LabManagement(){
  const [tab,setTab] = useState('Bookings');
  const [lab,setLab] = useState('All');
  const [q,setQ] = useState('');
  const [bookings,setBookings] = useState(seedBookings);
  const [equipment,setEquipment] = useState(seedEquipment);
  const [chemicals,setChemicals] = useState(seedChemicals);
  const [incidents,setIncidents] = useState(seedIncidents);
  const [vendors,setVendors] = useState(seedVendors);
  const [purchases,setPurchases] = useState(seedPurchases);
  const [templates,setTemplates] = useState(seedTemplates);
  const [modal,setModal] = useState(null); // {type,payload}
  const [toast,setToast] = useState(null);

  function notify(msg){ setToast(msg); setTimeout(()=>setToast(null),2200); }
  function doExport(rows, filename){
    if(!rows.length) return notify('Nothing to export');
    exportObjectsAsCSV(rows, filename, { bom:true });
  }

  const bookingsFiltered = useMemo(()=> bookings.filter(b => (lab==='All'||b.lab===lab) && (q===''|| b.experiment.toLowerCase().includes(q.toLowerCase())) ),[bookings,lab,q]);
  const equipmentFiltered = useMemo(()=> equipment.filter(e => (lab==='All'||e.lab===lab) && (q===''|| e.name.toLowerCase().includes(q.toLowerCase())) ),[equipment,lab,q]);
  const chemicalsFiltered = useMemo(()=> chemicals.filter(c => (lab==='All'||c.lab===lab) && (q===''|| c.name.toLowerCase().includes(q.toLowerCase())) ),[chemicals,lab,q]);
  const incidentsFiltered = useMemo(()=> incidents.filter(i => (lab==='All'||i.lab===lab) && (q===''|| i.type.toLowerCase().includes(q.toLowerCase())) ),[incidents,lab,q]);
  const vendorsFiltered = useMemo(()=> vendors.filter(v => q===''|| v.name.toLowerCase().includes(q.toLowerCase())),[vendors,q]);
  const purchasesFiltered = useMemo(()=> purchases.filter(p => q===''|| p.item.toLowerCase().includes(q.toLowerCase())),[purchases,q]);
  const templatesFiltered = useMemo(()=> templates.filter(t => (lab==='All'||t.lab===lab) && (q===''|| t.title.toLowerCase().includes(q.toLowerCase())) ),[templates,lab,q]);

  function openModal(type,payload){ setModal({type,payload}); }
  function closeModal(){ setModal(null); }
  function handleCreate(data){
    switch(data.kind){
      case 'booking': setBookings(b=>[...b,{ id:Date.now(), date:data.date, period:data.period, lab:data.lab, class:data.className, teacher:data.teacher, experiment:data.experiment, status:'Pending'}]); notify('Booking requested'); break;
      case 'chemical': setChemicals(c=>[...c,{ id:'c'+Date.now(), lab:data.lab, name:data.name, grade:data.grade, qty:parseFloat(data.qty)||0, unit:data.unit, hazard:data.hazard, expiry:data.expiry, location:data.location }]); notify('Chemical added'); break;
      case 'incident': setIncidents(i=>[...i,{ id:'in'+Date.now(), date:data.date, lab:data.lab, type:data.type, severity:data.severity, reportedBy:data.reportedBy||'—', status:'Open' }]); notify('Incident logged'); break;
      case 'vendor': setVendors(v=>[...v,{ id:'v'+Date.now(), name:data.name, domain:data.domain, poc:data.poc||'—', rating:0, items:0 }]); notify('Vendor added'); break;
      case 'purchase': setPurchases(pu=>[...pu,{ id:'p'+Date.now(), date:data.date, item:data.item, qty:parseInt(data.qty)||0, vendor:data.vendor, cost:parseFloat(data.cost)||0, status:'Pending' }]); notify('Purchase recorded'); break;
      case 'template': setTemplates(t=>[...t,{ id:'t'+Date.now(), lab:data.lab, title:data.title, type:data.type, updated:new Date().toISOString().slice(0,10) }]); notify('Template added'); break;
      default: break;
    }
    closeModal();
  }

  function modalContent(){
    if(!modal) return null; const common={ className:'w-full px-3 py-2 rounded-lg border text-sm' };
    switch(modal.type){
      case 'booking': { const data={}; return <Modal open title="New Booking" onClose={closeModal} submitLabel="Request" onSubmit={()=>handleCreate({...data,kind:'booking'})}>
        <div className="grid gap-3">
          <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
          <div className="grid grid-cols-2 gap-3">
            <input {...common} placeholder="Period (e.g. P2)" onChange={e=>data.period=e.target.value} required />
            <select {...common} defaultValue={LABS[0].name} onChange={e=>data.lab=e.target.value}>{LABS.map(l=> <option key={l.id}>{l.name}</option>)}</select>
          </div>
            <input {...common} placeholder="Class (e.g. 9-B)" onChange={e=>data.className=e.target.value} required />
            <input {...common} placeholder="Teacher" onChange={e=>data.teacher=e.target.value} required />
            <input {...common} placeholder="Experiment" onChange={e=>data.experiment=e.target.value} required />
        </div>
      </Modal>; }
      case 'chemical': { const data={}; return <Modal open title="Add Chemical" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'chemical'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Name" onChange={e=>data.name=e.target.value} required />
          <div className="grid grid-cols-2 gap-3">
            <select {...common} defaultValue='Chemistry' onChange={e=>data.lab=e.target.value}>{LABS.map(l=> <option key={l.id}>{l.name}</option>)}</select>
            <select {...common} defaultValue="AR" onChange={e=>data.grade=e.target.value}><option>AR</option><option>LR</option><option>CP</option></select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" step="0.01" {...common} placeholder="Qty" onChange={e=>data.qty=e.target.value} />
            <select {...common} defaultValue="g" onChange={e=>data.unit=e.target.value}><option>g</option><option>kg</option><option>mL</option><option>L</option></select>
            <select {...common} defaultValue="Low" onChange={e=>data.hazard=e.target.value}><option>Low</option><option>Medium</option><option>High</option></select>
          </div>
          <input type="month" {...common} onChange={e=>data.expiry=e.target.value} />
          <input {...common} placeholder="Location" onChange={e=>data.location=e.target.value} />
        </div>
      </Modal>; }
      case 'incident': { const data={}; return <Modal open title="Log Incident" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'incident'})}>
        <div className="grid gap-3">
          <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
          <select {...common} defaultValue="Chemistry" onChange={e=>data.lab=e.target.value}>{LABS.map(l=> <option key={l.id}>{l.name}</option>)}</select>
          <input {...common} placeholder="Type (Spill, Fault...)" onChange={e=>data.type=e.target.value} required />
          <select {...common} defaultValue="Minor" onChange={e=>data.severity=e.target.value}><option>Minor</option><option>Moderate</option><option>Major</option></select>
          <input {...common} placeholder="Reported By" onChange={e=>data.reportedBy=e.target.value} />
        </div>
      </Modal>; }
      case 'vendor': { const data={}; return <Modal open title="Add Vendor" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'vendor'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Name" onChange={e=>data.name=e.target.value} required />
          <input {...common} placeholder="Domain" onChange={e=>data.domain=e.target.value} />
          <input {...common} placeholder="POC" onChange={e=>data.poc=e.target.value} />
        </div>
      </Modal>; }
      case 'purchase': { const data={}; return <Modal open title="Record Purchase" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'purchase'})}>
        <div className="grid gap-3">
          <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
          <input {...common} placeholder="Item" onChange={e=>data.item=e.target.value} required />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" {...common} placeholder="Qty" onChange={e=>data.qty=e.target.value} />
            <input {...common} placeholder="Vendor" onChange={e=>data.vendor=e.target.value} />
            <input type="number" {...common} placeholder="Cost" onChange={e=>data.cost=e.target.value} />
          </div>
        </div>
      </Modal>; }
      case 'template': { const data={}; return <Modal open title="Add Template" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'template'})}>
        <div className="grid gap-3">
          <select {...common} defaultValue="Chemistry" onChange={e=>data.lab=e.target.value}>{LABS.map(l=> <option key={l.id}>{l.name}</option>)}</select>
          <input {...common} placeholder="Title" onChange={e=>data.title=e.target.value} required />
          <select {...common} defaultValue="Report" onChange={e=>data.type=e.target.value}><option>Report</option><option>Worksheet</option><option>Checklist</option></select>
        </div>
      </Modal>; }
      default: return null;
    }
  }

  const analytics = {
    bookingUsage: LABS.map(l => ({ lab:l.name, count: bookings.filter(b=>b.lab===l.name).length })),
    equipmentAvailability: equipment.map(e=> ({ item:e.name, pct: e.status==='Available'?100: e.status==='Under Maintenance'?20:60 }))
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Lab Management</h1>
            <p className="text-sm text-slate-500">Safety · Inventory · Experiments · Bookings</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select value={lab} onChange={e=>setLab(e.target.value)} className="px-3 py-2 rounded-xl border text-sm bg-white">
              <option value="All">All Labs</option>
              {LABS.map(l=> <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="px-3 py-2 rounded-xl border text-sm bg-white" />
            <Button onClick={()=>openModal('booking')}>New Booking</Button>
            <Button onClick={()=>openModal('chemical')}>Add Chemical</Button>
            <Button onClick={()=>doExport(bookingsFiltered,'bookings.csv')}>Export</Button>
          </div>
        </header>

        <div className="flex gap-2 flex-wrap">
          {['Bookings','Equipment','Chemicals','Incidents','Vendors','Purchases','Templates','Labs','Analytics'].map(t=> <Pill key={t} onClick={()=>setTab(t)} active={tab===t}>{t}</Pill>)}
        </div>

        {tab==='Bookings' && (
          <div className="overflow-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-600"><tr>{['Date','Period','Lab','Class','Teacher','Experiment','Status'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
              <tbody>{bookingsFiltered.map(b=> <tr key={b.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{b.date}</td><td className="px-3 py-2">{b.period}</td><td className="px-3 py-2">{b.lab}</td><td className="px-3 py-2">{b.class}</td><td className="px-3 py-2">{b.teacher}</td><td className="px-3 py-2">{b.experiment}</td><td className="px-3 py-2">{b.status}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {tab==='Equipment' && (
          <div className="overflow-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Lab','Equipment','Qty','Status','Last Use'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
              <tbody>{equipmentFiltered.map(e=> <tr key={e.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{e.lab}</td><td className="px-3 py-2">{e.name}</td><td className="px-3 py-2">{e.qty}</td><td className="px-3 py-2">{e.status}</td><td className="px-3 py-2">{e.lastUse}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {tab==='Chemicals' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('chemical')}>Add</Button>
              <Button onClick={()=>doExport(chemicalsFiltered,'chemicals.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{chemicalsFiltered.length} shown</span>
            </div>
            <div className="overflow-auto rounded-xl border bg-white">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Lab','Name','Grade','Qty','Hazard','Expiry','Location'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{chemicalsFiltered.map(c=> <tr key={c.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{c.lab}</td><td className="px-3 py-2">{c.name}</td><td className="px-3 py-2">{c.grade}</td><td className="px-3 py-2">{c.qty}{c.unit}</td><td className="px-3 py-2">{c.hazard}</td><td className="px-3 py-2">{c.expiry}</td><td className="px-3 py-2">{c.location}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Incidents' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('incident')}>Log Incident</Button>
              <Button onClick={()=>doExport(incidentsFiltered,'incidents.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{incidentsFiltered.length} shown</span>
            </div>
            <div className="overflow-auto rounded-xl border bg-white">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Date','Lab','Type','Severity','Reported By','Status'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{incidentsFiltered.map(i=> <tr key={i.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{i.date}</td><td className="px-3 py-2">{i.lab}</td><td className="px-3 py-2">{i.type}</td><td className="px-3 py-2">{i.severity}</td><td className="px-3 py-2">{i.reportedBy}</td><td className="px-3 py-2">{i.status}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Vendors' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('vendor')}>Add Vendor</Button>
              <Button onClick={()=>doExport(vendorsFiltered,'vendors.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{vendorsFiltered.length} shown</span>
            </div>
            <div className="overflow-auto rounded-xl border bg-white">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Name','Domain','POC','Rating','Items'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{vendorsFiltered.map(v=> <tr key={v.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{v.name}</td><td className="px-3 py-2">{v.domain}</td><td className="px-3 py-2">{v.poc}</td><td className="px-3 py-2">{v.rating}</td><td className="px-3 py-2">{v.items}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Purchases' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('purchase')}>Record Purchase</Button>
              <Button onClick={()=>doExport(purchasesFiltered,'purchases.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{purchasesFiltered.length} shown</span>
            </div>
            <div className="overflow-auto rounded-xl border bg-white">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Date','Item','Qty','Vendor','Cost','Status'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{purchasesFiltered.map(p=> <tr key={p.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{p.date}</td><td className="px-3 py-2">{p.item}</td><td className="px-3 py-2">{p.qty}</td><td className="px-3 py-2">{p.vendor}</td><td className="px-3 py-2">₹{p.cost}</td><td className="px-3 py-2">{p.status}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Templates' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('template')}>Add Template</Button>
              <Button onClick={()=>doExport(templatesFiltered,'templates.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{templatesFiltered.length} shown</span>
            </div>
            <div className="overflow-auto rounded-xl border bg-white">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Lab','Title','Type','Updated'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{templatesFiltered.map(t=> <tr key={t.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{t.lab}</td><td className="px-3 py-2">{t.title}</td><td className="px-3 py-2">{t.type}</td><td className="px-3 py-2">{t.updated}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Labs' && (
          <div className="grid md:grid-cols-3 gap-4">
            {LABS.map(l=> (
              <div key={l.id} className="rounded-xl border p-4 bg-white shadow-sm">
                <div className="font-medium text-sm">{l.name}</div>
                <div className="text-xs text-slate-500 mt-1">Bookings: {bookings.filter(b=>b.lab===l.name).length} · Equipment: {equipment.filter(e=>e.lab===l.name).length}</div>
              </div>
            ))}
          </div>
        )}

        {tab==='Analytics' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 bg-white shadow-sm">
              <div className="text-sm font-medium">Bookings by Lab</div>
              <div className="mt-3 space-y-2 text-xs">
                {analytics.bookingUsage.map(r=> <div key={r.lab} className="flex items-center gap-2"><span className="w-28 text-slate-600">{r.lab}</span><div className="flex-1 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-sky-500 rounded-full" style={{width: (r.count? (Math.min(100,r.count*25)) : 4)+'%'}} /></div><span className="w-8 text-right">{r.count}</span></div>)}
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-white shadow-sm">
              <div className="text-sm font-medium">Equipment Availability</div>
              <div className="mt-3 space-y-2 text-xs">
                {analytics.equipmentAvailability.map(e=> <div key={e.item} className="flex items-center gap-2"><span className="w-36 truncate text-slate-600" title={e.item}>{e.item}</span><div className="flex-1 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-emerald-500 rounded-full" style={{width:e.pct+'%'}} /></div><span className="w-10 text-right">{e.pct}%</span></div>)}
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast>{toast}</Toast>}
      {modalContent()}
    </div>
  );
}
