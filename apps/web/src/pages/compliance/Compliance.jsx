import React, { useMemo, useState } from 'react';

// helpers
const cx = (...classes) => classes.filter(Boolean).join(' ');
const fmt = (d) => new Date(d).toLocaleDateString();
const daysUntil = (dateStr) => { const today = new Date(); today.setHours(0,0,0,0); const d=new Date(dateStr); d.setHours(0,0,0,0); return Math.round((d-today)/(1000*60*60*24)); };
const statusFromDue = (dateStr) => { const n = daysUntil(dateStr); if(n < 0) return { label:'Overdue', tone:'bg-red-100 text-red-700 border-red-200' }; if(n <= 14) return { label:`Due in ${n}d`, tone:'bg-amber-100 text-amber-700 border-amber-200' }; return { label:'Compliant', tone:'bg-emerald-100 text-emerald-700 border-emerald-200' }; };

// atoms
const Pill = ({ children, tone='bg-slate-100 text-slate-700 border-slate-200' }) => <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', tone)}>{children}</span>;
const Card = ({ title, subtitle, right, children, className='' }) => (
  <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
    <div className='flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3'>
      <div>
        <h3 className='text-sm font-semibold text-slate-900'>{title}</h3>
        {subtitle && <p className='mt-0.5 text-xs text-slate-500'>{subtitle}</p>}
      </div>
      <div className='flex items-center gap-2'>{right}</div>
    </div>
    <div className='p-4 sm:p-6'>{children}</div>
  </div>
);
const Button = ({ children, onClick, variant='primary', className='', type='button'}) => { const variants = { primary:'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900', soft:'bg-slate-100 text-slate-900 hover:bg-slate-200', ghost:'hover:bg-slate-100 text-slate-700', danger:'bg-red-600 text-white hover:bg-red-500' }; return <button type={type} onClick={onClick} className={cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition', variants[variant], className)}>{children}</button>; };
const TextInput = ({ value, onChange, placeholder, className='' }) => <input value={value} onChange={onChange} placeholder={placeholder} className={cx('w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300', className)} />;
const Select = ({ value, onChange, children, className='' }) => <select value={value} onChange={onChange} className={cx('w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300', className)}>{children}</select>;
const Checkbox = ({ checked, onChange }) => <input type='checkbox' checked={checked} onChange={onChange} className='h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300' />;
const Modal = ({ open, onClose, title, children, footer }) => { if(!open) return null; return <div className='fixed inset-0 z-50 flex items-center justify-center'><div className='absolute inset-0 bg-black/30' onClick={onClose} /><div className='relative z-10 w-[95vw] max-w-2xl rounded-2xl bg-white shadow-2xl'><div className='flex items-center justify-between border-b border-slate-100 px-5 py-3'><h3 className='text-sm font-semibold text-slate-900'>{title}</h3><button onClick={onClose} className='rounded-lg p-1 hover:bg-slate-100' aria-label='Close'><svg width='18' height='18' viewBox='0 0 24 24' fill='none'><path d='M6 6l12 12M6 18L18 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></svg></button></div><div className='p-5'>{children}</div><div className='flex justify-end gap-2 border-t border-slate-100 px-5 py-3'>{footer}</div></div></div>; };

// seeds
const seedCompliance = [
  { id:'F-EXT-001', category:'Fire Safety', title:'Fire Extinguishers – Hydrostatic Test', owner:'Ops / Premises', dueDate:'2025-10-15', frequency:'Annual', docs:['/docs/fire/pressure-test.pdf'], tags:['Fire'], site:'Main Campus' },
  { id:'F-DRILL-SEP', category:'Fire Safety', title:'Quarterly Fire Drill', owner:'Safety Officer', dueDate:'2025-10-05', frequency:'Quarterly', docs:[], tags:['Drill'], site:'All Blocks' },
  { id:'ELEC-INS-01', category:'Electrical', title:'Electrical Earth/Insulation Test', owner:'Facilities', dueDate:'2025-11-20', frequency:'Annual', docs:[], tags:['Compliance'], site:'Block A' },
  { id:'AFF-CBSE-24', category:'Affiliation', title:'CBSE Affiliation Renewal', owner:'Principal', dueDate:'2026-03-31', frequency:'Multi-year', docs:['/docs/affiliation/cbse.pdf'], tags:['Board'], site:'Institution' },
  { id:'STAFF-PV-07', category:'Staff Vetting', title:'Police Verification – Teaching Staff Batch 07', owner:'HR', dueDate:'2025-10-20', frequency:'2 Years', docs:['/docs/hr/pv-batch07.csv'], tags:['HR'], site:'All' },
  { id:'BUS-PERMIT-12', category:'Transport', title:'Bus Permit – DL1PC1234', owner:'Transport Head', dueDate:'2025-10-01', frequency:'Annual', docs:['/docs/transport/permit-1234.pdf'], tags:['RTO'], site:'Transport' },
];
const seedVetting = [ { name:'Anita Sharma', role:'Teacher – Math', pvDate:'2023-11-12', expiry:'2025-11-11', doc:'/docs/hr/pv-anita.pdf', status:'Verified' }, { name:'Rohit Verma', role:'Coach – Football', pvDate:'2022-09-15', expiry:'2024-09-14', doc:'/docs/hr/pv-rohit.pdf', status:'Expired' } ];
const seedAffiliations = [ { board:'CBSE', code:'2730XXXX', validTill:'2026-03-31', doc:'/docs/affiliation/cbse.pdf' }, { board:'Cambridge (CAIE)', code:'IN123', validTill:'2025-12-31', doc:'/docs/affiliation/caie.pdf' } ];
const seedTransport = [ { vehicle:'DL1PC1234', permitExpiry:'2025-10-01', fitnessExpiry:'2026-02-15', driverPV:'2026-01-20' }, { vehicle:'DL1PC5678', permitExpiry:'2026-01-12', fitnessExpiry:'2025-11-22', driverPV:'2025-12-10' } ];

export default function CompliancePage(){
  const [tab,setTab] = useState('overview');
  const [query,setQuery] = useState('');
  const [items,setItems] = useState(seedCompliance);
  const [showAdd,setShowAdd] = useState(false);
  const [newItem,setNewItem] = useState({ category:'Fire Safety', title:'', owner:'', dueDate:'', frequency:'One-off', site:'Main Campus', tags:'' });
  const [showCalendarOnlyDueSoon, setShowCalendarOnlyDueSoon] = useState(true);

  const filtered = useMemo(()=> { const q=query.trim().toLowerCase(); return items.filter(it => [it.id,it.category,it.title,it.owner,it.site,...(it.tags||[])].join(' ').toLowerCase().includes(q)); }, [items,query]);
  const stats = useMemo(()=> { const total=items.length; const overdue=items.filter(i=> daysUntil(i.dueDate)<0).length; const soon=items.filter(i=> { const n=daysUntil(i.dueDate); return n>=0 && n<=14; }).length; const compliant= total - overdue - soon; return { total, overdue, soon, compliant }; }, [items]);
  const calendar = useMemo(()=> { let data=[...items].map(i=> ({ date:i.dueDate, title:i.title, category:i.category })).sort((a,b)=> new Date(a.date)-new Date(b.date)); if(showCalendarOnlyDueSoon) data=data.filter(d=> daysUntil(d.date)<=30); return data.slice(0,12); }, [items, showCalendarOnlyDueSoon]);

  const addItem = () => { if(!newItem.title || !newItem.dueDate) return; const id = `${newItem.category.substring(0,3).toUpperCase()}-${Math.random().toString(36).slice(2,6)}`; const tags = newItem.tags ? newItem.tags.split(',').map(t=>t.trim()) : []; setItems(prev => [{ id, title:newItem.title, owner:newItem.owner||'Unassigned', dueDate:newItem.dueDate, frequency:newItem.frequency, category:newItem.category, site:newItem.site, tags, docs:[] }, ...prev]); setShowAdd(false); setNewItem({ category:newItem.category, title:'', owner:'', dueDate:'', frequency:'One-off', site:newItem.site, tags:'' }); };

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900'>
      <header className='sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white'>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none'><path d='M12 3l7 3v6a9 9 0 01-7 8 9 9 0 01-7-8V6l7-3z' stroke='currentColor' strokeWidth='2'/><path d='M9 12l2 2 4-4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>
              </span>
              <div>
                <h1 className='text-base font-semibold'>Compliance Management</h1>
                <p className='text-xs text-slate-600'>Fire & safety drills, inspections, licenses, affiliations, staff vetting, transport & more.</p>
              </div>
            </div>
            <div className='hidden md:flex items-center gap-2'>
              <Button variant='soft' onClick={()=> setShowAdd(true)}>Add Item</Button>
              <Button variant='ghost' onClick={()=> setTab('settings')}>Settings</Button>
            </div>
          </div>
        </div>
      </header>
      <main className='mx-auto max-w-7xl px-4 sm:px-6 py-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div className='relative w-[72vw] max-w-md'>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder='Search: fire, permit, CBSE, PV, owner…' className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pl-9 text-sm outline-none focus:ring-2 focus:ring-slate-300'/>
              <span className='pointer-events-none absolute left-3 top-2.5 text-slate-400'><svg width='16' height='16' viewBox='0 0 24 24' fill='none'><circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='2'/><path d='M20 20l-3-3' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></svg></span>
            </div>
            <Button variant='soft' onClick={()=> setShowAdd(true)} className='sm:hidden'>Add</Button>
          </div>
          <nav className='overflow-x-auto'>
            <div className='inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1'>
              {[
                ['overview','Overview'],['registers','Registers'],['inspections','Inspections'],['licenses','Licenses & Permits'],['affiliations','Affiliations'],['vetting','Staff Vetting'],['transport','Transport'],['drills','Safety Drills'],['documents','Documents & Policies'],['calendar','Calendar'],['settings','Settings']
              ].map(([k,l]) => <button key={k} onClick={()=> setTab(k)} className={cx('whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium', tab===k ? 'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-100')}>{l}</button>)}
            </div>
          </nav>
        </div>
        {tab==='overview' && (
          <section className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
            <div className='lg:col-span-8 space-y-4'>
              <Card title='At a glance' subtitle='Live compliance posture'>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                  <KPI label='Total' value={stats.total}/>
                  <KPI label='Compliant' value={stats.compliant} tone='text-emerald-700 bg-emerald-50'/>
                  <KPI label='Due ≤14d' value={stats.soon} tone='text-amber-700 bg-amber-50'/>
                  <KPI label='Overdue' value={stats.overdue} tone='text-red-700 bg-red-50'/>
                </div>
              </Card>
              <Card title='Due next' subtitle='Next 30 days' right={<label className='flex items-center gap-2 text-xs text-slate-600'><Checkbox checked={showCalendarOnlyDueSoon} onChange={e=> setShowCalendarOnlyDueSoon(e.target.checked)}/>Show only ≤30d</label>}>
                <ul className='divide-y divide-slate-100'>
                  {calendar.length===0 && <li className='py-3 text-sm text-slate-500'>Nothing due. Nice.</li>}
                  {calendar.map((c,i)=>(
                    <li key={i} className='flex items-center justify-between py-3'>
                      <div><div className='text-sm font-medium'>{c.title}</div><div className='text-xs text-slate-500'>{c.category}</div></div>
                      <div className='flex items-center gap-3'><Pill tone={statusFromDue(c.date).tone}>{statusFromDue(c.date).label}</Pill><div className='text-xs text-slate-500'>{fmt(c.date)}</div></div>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title='Fire & Life Safety quick actions' subtitle='Operate drills & registers' right={<Button variant='soft'>Export CSV</Button>}>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <QuickAction label='Schedule Fire Drill' subtitle='Auto‑notify staff & parents'/>
                  <QuickAction label='Log Extinguisher Refill' subtitle='Add vendor & invoice'/>
                  <QuickAction label='Record Evacuation Time' subtitle='Attach drill sheet'/>
                </div>
              </Card>
            </div>
            <div className='lg:col-span-4 space-y-4'>
              <Card title='Risk radar' subtitle='What needs attention'>
                <ul className='space-y-2'>
                  {items.filter(i=> daysUntil(i.dueDate)<0 || daysUntil(i.dueDate)<=14).slice(0,6).map(i=> (
                    <li key={i.id} className='flex items-center justify-between rounded-xl border border-slate-200 p-3'>
                      <div><div className='text-sm font-medium'>{i.title}</div><div className='text-xs text-slate-500'>{i.category} • {i.owner}</div></div>
                      <Pill tone={statusFromDue(i.dueDate).tone}>{statusFromDue(i.dueDate).label}</Pill>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title='Affiliations & Certifications' subtitle='Board & program validity'>
                <ul className='space-y-2'>
                  {seedAffiliations.map((a,i)=>(
                    <li key={i} className='flex items-center justify-between rounded-xl border border-slate-200 p-3'>
                      <div><div className='text-sm font-medium'>{a.board}</div><div className='text-xs text-slate-500'>Code {a.code}</div></div>
                      <Pill tone={statusFromDue(a.validTill).tone}>{statusFromDue(a.validTill).label}</Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>
        )}
        {tab==='registers' && (
          <Card title='Compliance register' subtitle='All tracked items (filterable)' right={<Button variant='soft'>Bulk Import</Button>}>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='text-xs text-slate-600'>
                  <tr>{['ID','Category','Title','Owner','Site','Due','Status','Frequency','Tags','Docs'].map(h=> <th key={h} className='px-3 py-2 font-semibold'>{h}</th>)}</tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {filtered.map(i=> (
                    <tr key={i.id} className='hover:bg-slate-50'>
                      <td className='px-3 py-2 whitespace-nowrap text-xs text-slate-500'>{i.id}</td>
                      <td className='px-3 py-2 whitespace-nowrap'>{i.category}</td>
                      <td className='px-3 py-2'>{i.title}</td>
                      <td className='px-3 py-2 whitespace-nowrap'>{i.owner}</td>
                      <td className='px-3 py-2 whitespace-nowrap'>{i.site}</td>
                      <td className='px-3 py-2 whitespace-nowrap'>{fmt(i.dueDate)}</td>
                      <td className='px-3 py-2 whitespace-nowrap'><Pill tone={statusFromDue(i.dueDate).tone}>{statusFromDue(i.dueDate).label}</Pill></td>
                      <td className='px-3 py-2 whitespace-nowrap text-xs text-slate-600'>{i.frequency}</td>
                      <td className='px-3 py-2 whitespace-nowrap text-xs'>{(i.tags||[]).join(', ')}</td>
                      <td className='px-3 py-2 whitespace-nowrap text-xs text-slate-600'>{i.docs?.length||0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {tab==='inspections' && (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <Card title='Fire & Electrical' subtitle='Extinguishers, drills, wiring, insulation'><ListByCategory items={filtered} categories={['Fire Safety','Electrical']}/></Card>
            <Card title='Health, Labs & Kitchen' subtitle='Water, lab chemicals, food safety'><ListByCategory items={filtered} categories={['Health & Hygiene','Science Lab','Canteen']}/></Card>
          </div>
        )}
        {tab==='licenses' && (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <Card title='Licenses & Permits' subtitle='Boarding, canteen, lifts, occupancy'>
              <ul className='divide-y divide-slate-100'>
                {filtered.filter(i=> ['Affiliation','Canteen','Security','Electrical','Building'].includes(i.category)).map(i=> (
                  <li key={i.id} className='flex items-center justify-between py-3'>
                    <div><div className='text-sm font-medium'>{i.title}</div><div className='text-xs text-slate-500'>{i.category} • {i.owner}</div></div>
                    <div className='text-right'><Pill tone={statusFromDue(i.dueDate).tone}>{statusFromDue(i.dueDate).label}</Pill><div className='mt-1 text-xs text-slate-500'>{fmt(i.dueDate)}</div></div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title='Affiliations' subtitle='Board codes & validity' right={<Button variant='soft'>Download list</Button>}>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-left text-sm'>
                  <thead className='text-xs text-slate-600'><tr><th className='px-3 py-2 font-semibold'>Board</th><th className='px-3 py-2 font-semibold'>Code</th><th className='px-3 py-2 font-semibold'>Valid Till</th><th className='px-3 py-2 font-semibold'>Status</th></tr></thead>
                  <tbody className='divide-y divide-slate-100'>
                    {seedAffiliations.map((a,i)=>(<tr key={i}><td className='px-3 py-2'>{a.board}</td><td className='px-3 py-2'>{a.code}</td><td className='px-3 py-2 whitespace-nowrap'>{fmt(a.validTill)}</td><td className='px-3 py-2 whitespace-nowrap'><Pill tone={statusFromDue(a.validTill).tone}>{statusFromDue(a.validTill).label}</Pill></td></tr>))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        {tab==='vetting' && (
          <Card title='Teacher & Staff Background Checks' subtitle='Police verification & validity' right={<Button variant='soft'>Import CSV</Button>}>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='text-xs text-slate-600'><tr><th className='px-3 py-2 font-semibold'>Name</th><th className='px-3 py-2 font-semibold'>Role</th><th className='px-3 py-2 font-semibold'>PV Date</th><th className='px-3 py-2 font-semibold'>Expiry</th><th className='px-3 py-2 font-semibold'>Status</th><th className='px-3 py-2 font-semibold'>Doc</th></tr></thead>
                <tbody className='divide-y divide-slate-100'>
                  {seedVetting.map((v,i)=>(<tr key={i} className='hover:bg-slate-50'><td className='px-3 py-2'>{v.name}</td><td className='px-3 py-2'>{v.role}</td><td className='px-3 py-2 whitespace-nowrap'>{fmt(v.pvDate)}</td><td className='px-3 py-2 whitespace-nowrap'>{fmt(v.expiry)}</td><td className='px-3 py-2 whitespace-nowrap'><Pill tone={v.status==='Verified' ? 'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-red-100 text-red-700 border-red-200'}>{v.status}</Pill></td><td className='px-3 py-2 text-xs text-slate-600 underline'>View</td></tr>))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {tab==='transport' && (
          <Card title='Transport Compliance' subtitle='Permits, fitness & driver vetting'>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='text-xs text-slate-600'><tr><th className='px-3 py-2 font-semibold'>Vehicle</th><th className='px-3 py-2 font-semibold'>Permit Expiry</th><th className='px-3 py-2 font-semibold'>Fitness Expiry</th><th className='px-3 py-2 font-semibold'>Driver PV</th><th className='px-3 py-2 font-semibold'>Status</th></tr></thead>
                <tbody className='divide-y divide-slate-100'>
                  {seedTransport.map((t,i)=>{ const worst=[t.permitExpiry,t.fitnessExpiry,t.driverPV].reduce((acc,d)=>{ const score=daysUntil(d); return score<acc?score:acc; },9999); const tone= worst<0? 'bg-red-100 text-red-700 border-red-200' : worst<=30 ? 'bg-amber-100 text-amber-700 border-amber-200':'bg-emerald-100 text-emerald-700 border-emerald-200'; const label= worst<0? 'Overdue' : worst<=30 ? `Due in ${worst}d` : 'Compliant'; return (<tr key={i}><td className='px-3 py-2'>{t.vehicle}</td><td className='px-3 py-2 whitespace-nowrap'>{fmt(t.permitExpiry)}</td><td className='px-3 py-2 whitespace-nowrap'>{fmt(t.fitnessExpiry)}</td><td className='px-3 py-2 whitespace-nowrap'>{fmt(t.driverPV)}</td><td className='px-3 py-2 whitespace-nowrap'><Pill tone={tone}>{label}</Pill></td></tr>); })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {tab==='drills' && (
          <Card title='Safety Drills' subtitle='Fire, evacuation, earthquake'>
            <ul className='divide-y divide-slate-100'>
              {items.filter(i=> i.category==='Fire Safety' && i.title.toLowerCase().includes('drill')).map(i=> (
                <li key={i.id} className='flex items-center justify-between py-3'>
                  <div><div className='text-sm font-medium'>{i.title}</div><div className='text-xs text-slate-500'>{i.site} • Owner: {i.owner}</div></div>
                  <div className='flex items-center gap-2'><Pill tone={statusFromDue(i.dueDate).tone}>{statusFromDue(i.dueDate).label}</Pill><Button variant='soft'>Log Result</Button></div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {tab==='documents' && (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <Card title='Policies register' subtitle='Child protection, POSH, ICT, DPDP, lab safety'>
              <ul className='space-y-2'>
                {[
                  { name:'Child Protection Policy', version:'v2.1 (2025)', owner:'Principal' },
                  { name:'POSH Policy', version:'v1.4 (2025)', owner:'HR' },
                  { name:'Data Protection (DPDP) SOP', version:'v1.0 (2025)', owner:'IT & Legal' },
                  { name:'ICT Acceptable Use Policy', version:'v2.0 (2025)', owner:'IT' },
                ].map((p,i)=>(
                  <li key={i} className='flex items-center justify-between rounded-xl border border-slate-200 p-3'>
                    <div><div className='text-sm font-medium'>{p.name}</div><div className='text-xs text-slate-500'>{p.version} • {p.owner}</div></div>
                    <div className='flex items-center gap-2'><Button variant='ghost'>View</Button><Button variant='soft'>Attach</Button></div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title='Certificates & proofs' subtitle='Upload & map to compliance items' right={<Button variant='soft'>Upload</Button>}>
              <div className='text-sm text-slate-600'>0 certificates added in this demo. Use “Upload” to attach PDFs and map them to items.</div>
            </Card>
          </div>
        )}
        {tab==='calendar' && (
          <Card title='Compliance calendar' subtitle='Key dates & renewals'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {calendar.map((c,i)=>(
                <div key={i} className='rounded-2xl border border-slate-200 p-4'>
                  <div className='text-xs text-slate-500'>{new Date(c.date).toLocaleString(undefined,{ month:'long', day:'numeric', year:'numeric' })}</div>
                  <div className='mt-1 text-sm font-medium'>{c.title}</div>
                  <div className='mt-1 text-xs text-slate-500'>{c.category}</div>
                  <div className='mt-2'><Pill tone={statusFromDue(c.date).tone}>{statusFromDue(c.date).label}</Pill></div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {tab==='settings' && (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <Card title='Categories & frequencies' subtitle='Tune what you track'>
              <div className='space-y-3 text-sm'>
                <p className='text-slate-600'>Suggested categories include Fire Safety, Electrical, Health & Hygiene, Science Lab, Canteen, Security, Affiliation, Staff Vetting, Transport, Building, Policy & Training.</p>
                <p className='text-slate-600'>Frequencies: One‑off, Quarterly, Semi‑annual, Annual, Bi‑annual, Multi‑year. You can add your own.</p>
                <div className='rounded-xl bg-slate-50 p-3 text-xs text-slate-600'>Pro tip: create a template per school and clone it for each academic year.</div>
              </div>
            </Card>
            <Card title='Notifications & ownership' subtitle='Who gets nudged when'>
              <div className='space-y-3 text-sm'>
                <label className='flex items-center justify-between rounded-xl border border-slate-200 p-3'><span>Remind owners 30/14/7/1 days before due</span><Checkbox checked onChange={()=>{}}/></label>
                <label className='flex items-center justify-between rounded-xl border border-slate-200 p-3'><span>Escalate overdue to Principal & Admin</span><Checkbox checked onChange={()=>{}}/></label>
                <label className='flex items-center justify-between rounded-xl border border-slate-200 p-3'><span>Attach renewal checklist to reminder</span><Checkbox checked onChange={()=>{}}/></label>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Modal open={showAdd} onClose={()=> setShowAdd(false)} title='Add compliance item' footer={<><Button variant='ghost' onClick={()=> setShowAdd(false)}>Cancel</Button><Button onClick={addItem}>Add</Button></>}>
        <form className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <label className='text-sm'><div className='mb-1 text-slate-600'>Category</div><Select value={newItem.category} onChange={e=> setNewItem({ ...newItem, category:e.target.value })}>{['Fire Safety','Electrical','Health & Hygiene','Science Lab','Canteen','Security','Affiliation','Staff Vetting','Transport','Building','Policy & Training'].map(c=> <option key={c} value={c}>{c}</option>)}</Select></label>
          <label className='text-sm'><div className='mb-1 text-slate-600'>Title</div><TextInput value={newItem.title} onChange={e=> setNewItem({ ...newItem, title:e.target.value })} placeholder='e.g., Fire Drill – Q4'/></label>
          <label className='text-sm'><div className='mb-1 text-slate-600'>Owner</div><TextInput value={newItem.owner} onChange={e=> setNewItem({ ...newItem, owner:e.target.value })} placeholder='e.g., Safety Officer'/></label>
            <label className='text-sm'><div className='mb-1 text-slate-600'>Due date</div><input type='date' value={newItem.dueDate} onChange={e=> setNewItem({ ...newItem, dueDate:e.target.value })} className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300'/></label>
          <label className='text-sm'><div className='mb-1 text-slate-600'>Frequency</div><Select value={newItem.frequency} onChange={e=> setNewItem({ ...newItem, frequency:e.target.value })}>{['One-off','Quarterly','Semi-annual','Annual','Bi-annual','Multi-year'].map(f=> <option key={f} value={f}>{f}</option>)}</Select></label>
          <label className='text-sm'><div className='mb-1 text-slate-600'>Site / Block</div><TextInput value={newItem.site} onChange={e=> setNewItem({ ...newItem, site:e.target.value })} placeholder='e.g., Block A'/></label>
          <label className='text-sm sm:col-span-2'><div className='mb-1 text-slate-600'>Tags</div><TextInput value={newItem.tags} onChange={e=> setNewItem({ ...newItem, tags:e.target.value })} placeholder='comma separated'/></label>
        </form>
      </Modal>
      <footer className='mx-auto max-w-7xl px-4 sm:px-6 py-10 text-center text-xs text-slate-500'>Built for school compliance: fire/electrical, hygiene, labs, canteen, security, affiliations, staff vetting, transport, policies & drills.</footer>
    </div>
  );
}

function KPI({ label, value, tone='text-slate-700 bg-slate-50' }){ return <div className={cx('rounded-2xl border border-slate-200 p-4', tone)}><div className='text-xs text-slate-600'>{label}</div><div className='mt-1 text-2xl font-semibold'>{value}</div></div>; }
function QuickAction({ label, subtitle }){ return <button className='rounded-2xl border border-slate-200 p-4 text-left transition hover:shadow-sm'><div className='text-sm font-medium'>{label}</div><div className='text-xs text-slate-500'>{subtitle}</div></button>; }
function ListByCategory({ items, categories }){ const list= items.filter(i=> categories.includes(i.category)); if(list.length===0) return <div className='text-sm text-slate-500'>No items match.</div>; return <ul className='divide-y divide-slate-100'>{list.map(i=> (<li key={i.id} className='flex items-center justify-between py-3'><div><div className='text-sm font-medium'>{i.title}</div><div className='text-xs text-slate-500'>{i.category} • {i.owner} • {i.site}</div></div><div className='text-right'><Pill tone={statusFromDue(i.dueDate).tone}>{statusFromDue(i.dueDate).label}</Pill><div className='mt-1 text-xs text-slate-500'>{fmt(i.dueDate)}</div></div></li>))}</ul>; }
