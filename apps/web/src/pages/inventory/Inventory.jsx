import React, { useMemo, useState } from 'react';
import { 
  Search, Plus, Download, Printer, RefreshCw, Wrench, CheckCircle2, AlertTriangle, XCircle, 
  Phone, MessageSquare, MapPin, ClipboardList, Truck, Stethoscope, Projector, Volleyball, 
  FlaskConical, LibraryBig, ClipboardCheck, Shirt, PartyPopper, UtensilsCrossed,
  Trash2, Edit3, Save, PlusCircle
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import Select from '../../components/ui/Select.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import Sheet from '../../components/ui/Sheet.jsx';
import { SheetHeader, SheetTitle, SheetBody, SheetFooter } from '../../components/ui/Sheet.jsx';

// NOTE: The original shadcn-style components (Table, Tooltip, DialogContent, etc.) are simplified here to fit existing UI primitives.
// Minimal inline table structure used instead of shadcn Table primitives.

// Types (JSDoc for JS environment)
/** @typedef {{id:string,name:string,role:string,phone:string,email?:string}} Manager */
/** @typedef {'Projector'|'Stethoscope'|'Volleyball'|'FlaskConical'|'LibraryBig'|'ClipboardCheck'|'Truck'|'Wrench'|'UtensilsCrossed'|'Shirt'|'PartyPopper'} IconKey */
/** @typedef {{id:string,name:string,iconKey:IconKey}} Category */
/** @typedef {{type:'Teacher'|'Student'|'Room',name:string}} Assignment */
/** @typedef {{id:string,name:string,categoryId:string,sku?:string,tag?:string,location:string,managerId:string,backupManagerId?:string,qtyTotal:number,qtyAvailable:number,status:'OK'|'Needs Service'|'Under Repair'|'Lost'|'Scrapped',nextService?:string,warrantyEnd?:string,vendor?:string,minThreshold?:number,assignments?:Assignment[],lastAudit?:string}} InventoryItem */

const MANAGERS = [
  { id: 'm-anuj', name: 'Anuj Sharma', role: 'IT & AV In‑charge', phone: '+91 98765 00011', email: 'anuj@school.edu' },
  { id: 'm-ria', name: 'Ria Mehta', role: 'Librarian', phone: '+91 98765 00022', email: 'ria@school.edu' },
  { id: 'm-sanjana', name: 'Sanjana Rao', role: 'Sports Coordinator', phone: '+91 98765 00033', email: 'sanjana@school.edu' },
  { id: 'm-drkhan', name: 'Dr. A. Khan', role: 'Infirmary Nurse', phone: '+91 98765 00044', email: 'dr.khan@school.edu' },
  { id: 'm-rahul', name: 'Rahul Verma', role: 'Lab Assistant (Science)', phone: '+91 98765 00055', email: 'rahul@school.edu' },
  { id: 'm-anjali', name: 'Anjali Gupta', role: 'Transport Store', phone: '+91 98765 00066', email: 'anjali@school.edu' },
  { id: 'm-neeraj', name: 'Neeraj Singh', role: 'Maintenance & Housekeeping', phone: '+91 98765 00077', email: 'neeraj@school.edu' },
  { id: 'm-pawan', name: 'Pawan Joshi', role: 'Canteen & Kitchen', phone: '+91 98765 00088', email: 'pawan@school.edu' },
  { id: 'm-mehul', name: 'Mehul Shah', role: 'Uniforms & Merchandise', phone: '+91 98765 00099', email: 'mehul@school.edu' },
  { id: 'm-ritu', name: 'Ritu Nair', role: 'Events & Stage', phone: '+91 98765 00123', email: 'ritu@school.edu' },
];

const ICON_OPTIONS = [ 'Projector','Stethoscope','Volleyball','FlaskConical','LibraryBig','ClipboardCheck','Truck','Wrench','UtensilsCrossed','Shirt','PartyPopper' ];

function renderIcon(key, cls='h-5 w-5'){
  const map = {
    Projector: <Projector className={cls} />, Stethoscope: <Stethoscope className={cls} />, Volleyball: <Volleyball className={cls} />, FlaskConical: <FlaskConical className={cls} />, LibraryBig: <LibraryBig className={cls} />, ClipboardCheck: <ClipboardCheck className={cls} />, Truck: <Truck className={cls} />, Wrench: <Wrench className={cls} />, UtensilsCrossed: <UtensilsCrossed className={cls} />, Shirt: <Shirt className={cls} />, PartyPopper: <PartyPopper className={cls} />
  }; return map[key];
}

const CATEGORIES_SEED = [
  { id: 'it', name: 'IT & AV', iconKey: 'Projector' },
  { id: 'infirmary', name: 'Infirmary / Medical', iconKey: 'Stethoscope' },
  { id: 'sports', name: 'Sports & Grounds', iconKey: 'Volleyball' },
  { id: 'labs', name: 'Science Labs', iconKey: 'FlaskConical' },
  { id: 'library', name: 'Library Assets', iconKey: 'LibraryBig' },
  { id: 'office', name: 'Office & Exams', iconKey: 'ClipboardCheck' },
  { id: 'transport', name: 'Transport Spares', iconKey: 'Truck' },
  { id: 'maintenance', name: 'Maintenance & Tools', iconKey: 'Wrench' },
  { id: 'canteen', name: 'Canteen & Kitchen', iconKey: 'UtensilsCrossed' },
  { id: 'uniforms', name: 'Uniforms & Merchandise', iconKey: 'Shirt' },
  { id: 'events', name: 'Event & Stage', iconKey: 'PartyPopper' },
];

const ITEMS_SEED = [
  { id:'INV-IT-001', name:'Epson Short‑Throw Projector', categoryId:'it', sku:'EP‑ST‑X120', tag:'QR‑A104', location:'Block A · Room 104', managerId:'m-anuj', backupManagerId:'m-ria', qtyTotal:12, qtyAvailable:10, status:'OK', nextService:'2025-12-15', warrantyEnd:'2026-03-30', vendor:'Vision AV Pvt Ltd', minThreshold:4, assignments:[{type:'Room',name:'A104'},{type:'Room',name:'A106'}], lastAudit:'2025-08-20' },
  { id:'INV-IT-011', name:'Interactive Smart Board', categoryId:'it', sku:'SB‑Pro‑75', tag:'QR‑A201', location:'Block A · Room 201', managerId:'m-anuj', qtyTotal:5, qtyAvailable:4, status:'Needs Service', nextService:'2025-10-22', vendor:'TeachTech India', minThreshold:1, assignments:[{ type:'Room', name:'A201'}], lastAudit:'2025-09-12' },
]; // truncated for brevity - add more if needed

function getManager(id){ return MANAGERS.find(m=>m.id===id); }
function statusBadge(s){
  const base = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium gap-1';
  switch(s){
    case 'OK': return <span className={base+' bg-emerald-100 text-emerald-700 border-emerald-200'}><CheckCircle2 className='h-3 w-3'/>OK</span>;
    case 'Needs Service': return <span className={base+' bg-amber-100 text-amber-800 border-amber-200'}><Wrench className='h-3 w-3'/>Needs Service</span>;
    case 'Under Repair': return <span className={base+' bg-blue-100 text-blue-800 border-blue-200'}><RefreshCw className='h-3 w-3'/>Under Repair</span>;
    case 'Lost': return <span className={base+' bg-rose-100 text-rose-800 border-rose-200'}><XCircle className='h-3 w-3'/>Lost</span>;
    case 'Scrapped': return <span className={base+' bg-slate-200 text-slate-800 border-slate-300'}><AlertTriangle className='h-3 w-3'/>Scrapped</span>;
  }
}
function formatDate(iso){ if(!iso) return '—'; try { return new Date(iso).toLocaleDateString(); } catch { return iso; } }
function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function genItemId(categoryId){ const pre = categoryId.slice(0,3).toUpperCase(); return `INV-${pre}-${Math.floor(100+Math.random()*900)}`; }

export default function InventoryPage(){
  const [categories, setCategories] = useState(CATEGORIES_SEED);
  const [items, setItems] = useState(ITEMS_SEED);
  const [query,setQuery] = useState('');
  const [cat,setCat] = useState('all');
  const [status,setStatus] = useState('all');
  const [manager,setManager] = useState('all');
  const [selected, setSelected] = useState({});
  const [showNewItem,setShowNewItem] = useState(false);
  const [activeItemId,setActiveItemId] = useState(null);
  const activeItem = items.find(i=>i.id===activeItemId) || null;

  const filtered = useMemo(()=> items.filter(it => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || [it.name,it.id,it.sku,it.tag,it.location,(getManager(it.managerId)?.name||'')].some(v=>v?.toLowerCase().includes(q));
    const matchCat = cat==='all' || it.categoryId===cat;
    const matchStatus = status==='all' || it.status===status;
    const matchMgr = manager==='all' || it.managerId===manager;
    return matchQ && matchCat && matchStatus && matchMgr;
  }), [items,query,cat,status,manager]);

  const totals = useMemo(()=>{
    const byCat = {};
    categories.forEach(c=> byCat[c.id] = { total:0, available:0, serviceDue:0 });
    items.forEach(it=> { if(!byCat[it.categoryId]) byCat[it.categoryId]={ total:0,available:0,serviceDue:0}; byCat[it.categoryId].total+=it.qtyTotal; byCat[it.categoryId].available+=it.qtyAvailable; if(['Needs Service','Under Repair'].includes(it.status)) byCat[it.categoryId].serviceDue+=1; });
    return byCat;
  }, [categories,items]);

  const categoriesWithCounts = useMemo(()=> categories.map(c=> ({ ...c, count: items.filter(i=>i.categoryId===c.id).length, stat: totals[c.id] || { total:0, available:0, serviceDue:0 } })), [categories, items, totals]);

  function addCategory(name, iconKey){
    const base = slugify(name); let id = base || `cat-${Date.now()}`; let i=1; while(categories.some(c=>c.id===id)){ id=`${base}-${i++}`; }
    setCategories(prev=> [...prev, { id, name: name.trim(), iconKey }]);
  }
  function removeCategory(id){ if(items.some(it=>it.categoryId===id)){ alert('Category has items. Move/delete items first.'); return; } setCategories(prev=> prev.filter(c=>c.id!==id)); if(cat===id) setCat('all'); }
  function upsertItem(next){ setItems(prev=> { const idx=prev.findIndex(p=>p.id===next.id); if(idx===-1) return [next,...prev]; const copy=[...prev]; copy[idx]=next; return copy; }); }

  const [form,setForm] = useState({ status:'OK', qtyTotal:1, qtyAvailable:1 });
  function resetForm(){ setForm({ status:'OK', qtyTotal:1, qtyAvailable:1 }); }
  function saveNewItem(){ if(!form.name || !form.categoryId || !form.location || !form.managerId || !form.qtyTotal || form.qtyAvailable==null){ alert('Fill required fields.'); return; }
    const id = genItemId(form.categoryId); const next = { id, name:form.name, categoryId:form.categoryId, sku:form.sku||undefined, tag:form.tag||undefined, location:form.location, managerId:form.managerId, backupManagerId:form.backupManagerId||undefined, qtyTotal:Math.max(0,Number(form.qtyTotal)), qtyAvailable:Math.min(Number(form.qtyAvailable), Number(form.qtyTotal)), status: form.status||'OK', nextService:form.nextService||undefined, warrantyEnd:form.warrantyEnd||undefined, vendor:form.vendor||undefined, minThreshold: form.minThreshold!=null? Number(form.minThreshold):undefined, assignments:[], lastAudit:new Date().toISOString().slice(0,10) }; upsertItem(next); setShowNewItem(false); resetForm(); setCat(next.categoryId); }

  // issue flow (simplified)
  const [issueTo,setIssueTo] = useState({ type:'Teacher', name:'' });
  const [issueQty,setIssueQty] = useState(1);
  function openItem(id){ setActiveItemId(id); }
  function commitStatusChange(id,newStatus){ const it=items.find(x=>x.id===id); if(!it) return; upsertItem({ ...it, status:newStatus }); }
  function commitIssue(id){ const it=items.find(x=>x.id===id); if(!it) return; if(!issueTo.name){ alert('Choose who to issue to.'); return; } if(issueQty<1 || issueQty>it.qtyAvailable){ alert('Invalid quantity.'); return; } upsertItem({ ...it, qtyAvailable: it.qtyAvailable-issueQty, assignments:[...(it.assignments||[]), issueTo] }); }

  const selectedRows = Object.entries(selected).filter(([_,v])=>v).map(([k])=>k);

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='sticky top-0 z-30 border-b bg-white/80 backdrop-blur'>
        <div className='mx-auto max-w-7xl px-4 py-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>School Inventory Management</h1>
              <p className='text-sm text-slate-500'>Assets, ownership, status and service readiness.</p>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' className='gap-2' onClick={()=>{/* TODO export CSV later */}}><Download className='h-4 w-4'/>Export</Button>
              <Button className='gap-2' onClick={()=> setShowNewItem(true)}><Plus className='h-4 w-4'/>New Item</Button>
            </div>
          </div>
          <div className='mt-3 grid grid-cols-1 gap-2 md:grid-cols-12'>
            <div className='md:col-span-5'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'/>
                <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder='Search by name, ID, room, manager…' className='pl-9'/>
              </div>
            </div>
            <div className='md:col-span-2'>
              <Select value={cat} onChange={e=>setCat(e.target.value)}>
                <option value='all'>All Categories</option>
                {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className='md:col-span-2'>
              <Select value={status} onChange={e=>setStatus(e.target.value)}>
                {['all','OK','Needs Service','Under Repair','Lost','Scrapped'].map(s=> <option key={s} value={s}>{s==='all'?'All Status':s}</option>)}
              </Select>
            </div>
            <div className='md:col-span-3'>
              <Select value={manager} onChange={e=>setManager(e.target.value)}>
                <option value='all'>All Custodians</option>
                {MANAGERS.map(m=> <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-4 py-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
          <div className='space-y-4 lg:col-span-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='text-base'>Categories Overview</CardTitle>
                <Button variant='outline' size='sm' className='gap-2' onClick={()=>{/* manage categories UI future */}}><Edit3 className='h-4 w-4'/>Manage</Button>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                {categoriesWithCounts.map(c=> (
                  <button key={c.id} onClick={()=>setCat(c.id)} className={`rounded-xl border p-3 text-left transition hover:shadow-sm ${cat===c.id?'border-slate-900':''}`}>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-2 text-slate-700'>
                        {renderIcon(c.iconKey)}
                        <span className='font-medium'>{c.name}</span>
                      </div>
                      <span className='inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs'>{c.count}</span>
                    </div>
                    <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
                      <span>Total: {c.stat.total}</span>
                      <span>Avail: {c.stat.available}</span>
                      <span>Svc: {c.stat.serviceDue}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className='text-base'>Custodians Directory</CardTitle></CardHeader>
              <CardContent className='space-y-3'>
                {MANAGERS.map(m=> (
                  <div key={m.id} className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8 bg-slate-200 text-xs flex items-center justify-center font-medium'>{m.name.split(' ').map(n=>n[0]).join('')}</Avatar>
                      <div>
                        <div className='text-sm font-medium'>{m.name}</div>
                        <div className='text-xs text-slate-500'>{m.role}</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <a href={`tel:${m.phone.replace(/\s/g,'')}`} className='rounded-md border px-2 py-1 text-xs hover:bg-slate-50'><Phone className='mr-1 inline h-3 w-3'/> {m.phone}</a>
                      <Button size='sm' variant='secondary' className='h-8' onClick={()=>setManager(m.id)}>Filter</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className='lg:col-span-8'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>Inventory Items</CardTitle>
                  <div className='flex items-center gap-2 text-sm'>
                    <Button variant='outline' size='sm' className='gap-2' disabled={selectedRows.length!==1}><ClipboardList className='h-4 w-4'/>Issue</Button>
                    <Button variant='outline' size='sm' className='gap-2'><RefreshCw className='h-4 w-4'/>Return</Button>
                    <Button variant='outline' size='sm' className='gap-2'><Truck className='h-4 w-4'/>Transfer</Button>
                    <Button variant='outline' size='sm' className='gap-2'><Printer className='h-4 w-4'/>Audit Sheet</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='overflow-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-slate-100 text-xs'>
                      <tr>
                        <th className='w-8 px-2 py-2 text-left'>
                          <input type='checkbox' checked={filtered.length>0 && filtered.every(f=>selected[f.id])} onChange={(e)=>{ const v=e.target.checked; const next={}; if(v) filtered.forEach(f=> next[f.id]=true); setSelected(v?next:{}); }} />
                        </th>
                        {['ID','Item','Category','Location','Qty','Custodian','Status','Next Service','Vendor','Contact'].map(h=> <th key={h} className='px-3 py-2 text-left font-medium text-slate-600'>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(it=>{ const catName = categories.find(c=>c.id===it.categoryId)?.name||'—'; const mgr=getManager(it.managerId); const backup=getManager(it.backupManagerId); return (
                        <tr key={it.id} className='border-t hover:bg-slate-50 cursor-pointer align-top' onClick={()=>openItem(it.id)}>
                          <td className='px-2 py-2' onClick={e=>e.stopPropagation()}><input type='checkbox' checked={!!selected[it.id]} onChange={e=> setSelected(s=> ({...s, [it.id]: e.target.checked}))}/></td>
                          <td className='px-3 py-2 font-mono text-xs text-slate-500'>{it.id}</td>
                          <td className='px-3 py-2'>
                            <div className='font-medium'>{it.name}</div>
                            <div className='text-xs text-slate-500'>Tag {it.tag||'—'} · SKU {it.sku||'—'}</div>
                          </td>
                          <td className='px-3 py-2'>{catName}</td>
                          <td className='px-3 py-2'>
                            <div className='flex items-center gap-1 text-sm'><MapPin className='h-4 w-4 text-slate-400'/> {it.location}</div>
                            <div className='text-xs text-slate-500'>Audit: {formatDate(it.lastAudit)}</div>
                          </td>
                          <td className='px-3 py-2'>
                            <div className='text-sm'>{it.qtyAvailable} / {it.qtyTotal}</div>
                            {typeof it.minThreshold==='number' && it.qtyAvailable <= it.minThreshold && <div className='text-xs text-rose-600'>Below min ({it.minThreshold})</div>}
                          </td>
                          <td className='px-3 py-2'>
                            <div className='text-sm font-medium'>{mgr?.name||'—'}</div>
                            <div className='text-xs text-slate-500'>{mgr?.role}</div>
                            {backup && <div className='mt-1 text-xs text-slate-500'>Backup: {backup.name}</div>}
                          </td>
                          <td className='px-3 py-2'>{statusBadge(it.status)}</td>
                          <td className='px-3 py-2'>
                            <div className='text-sm'>{formatDate(it.nextService)}</div>
                            <div className='text-xs text-slate-500'>Warranty: {formatDate(it.warrantyEnd)}</div>
                          </td>
                          <td className='px-3 py-2 text-sm'>{it.vendor||'—'}</td>
                          <td className='px-3 py-2' onClick={e=>e.stopPropagation()}>
                            {mgr?.phone ? (
                              <div className='flex flex-col gap-1'>
                                <a href={`tel:${mgr.phone.replace(/\s/g,'')}`} className='inline-flex items-center gap-1 text-sm text-slate-700 hover:underline'><Phone className='h-4 w-4'/>{mgr.phone}</a>
                                {mgr.email && <a href={`mailto:${mgr.email}`} className='inline-flex items-center gap-1 text-xs text-slate-500 hover:underline'><MessageSquare className='h-3 w-3'/>{mgr.email}</a>}
                              </div>
                            ) : <span className='text-xs text-slate-500'>—</span>}
                          </td>
                        </tr>
                      ); })}
                      {filtered.length===0 && <tr><td colSpan={11} className='py-10 text-center text-sm text-slate-500'>No items.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className='mt-6 text-xs text-slate-500'>Demo inventory page (static). Hook up backend endpoints for persistence.</div>
      </div>

      <Dialog open={showNewItem} onClose={()=> { setShowNewItem(false); resetForm(); }} title='Add New Item' footer={<>
        <Button variant='outline' onClick={()=> { setShowNewItem(false); resetForm(); }}>Cancel</Button>
        <Button className='gap-2' onClick={saveNewItem}><Save className='h-4 w-4'/>Save Item</Button>
      </>}>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div><label className='text-xs text-slate-500'>Name</label><Input value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})} placeholder='Canon LCD Projector'/></div>
          <div><label className='text-xs text-slate-500'>Category</label><Select value={form.categoryId||''} onChange={e=>setForm({...form, categoryId:e.target.value})}>{categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><label className='text-xs text-slate-500'>Status</label><Select value={form.status||'OK'} onChange={e=>setForm({...form, status:e.target.value})}>{['OK','Needs Service','Under Repair','Lost','Scrapped'].map(s=> <option key={s} value={s}>{s}</option>)}</Select></div>
          <div><label className='text-xs text-slate-500'>Location</label><Input value={form.location||''} onChange={e=>setForm({...form, location:e.target.value})} placeholder='Block A · Room 104'/></div>
          <div><label className='text-xs text-slate-500'>Custodian</label><Select value={form.managerId||''} onChange={e=>setForm({...form, managerId:e.target.value})}>{MANAGERS.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}</Select></div>
          <div><label className='text-xs text-slate-500'>Backup Custodian</label><Select value={form.backupManagerId||''} onChange={e=>setForm({...form, backupManagerId:e.target.value})}><option value=''>None</option>{MANAGERS.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}</Select></div>
          <div><label className='text-xs text-slate-500'>Total Qty</label><Input type='number' min={0} value={form.qtyTotal} onChange={e=>setForm({...form, qtyTotal:Number(e.target.value)})}/></div>
          <div><label className='text-xs text-slate-500'>Available Qty</label><Input type='number' min={0} value={form.qtyAvailable} onChange={e=>setForm({...form, qtyAvailable:Number(e.target.value)})}/></div>
          <div><label className='text-xs text-slate-500'>Min Threshold</label><Input type='number' min={0} value={form.minThreshold||''} onChange={e=>setForm({...form, minThreshold: e.target.value===''? undefined: Number(e.target.value)})}/></div>
          <div><label className='text-xs text-slate-500'>SKU</label><Input value={form.sku||''} onChange={e=>setForm({...form, sku:e.target.value})}/></div>
          <div><label className='text-xs text-slate-500'>Asset Tag</label><Input value={form.tag||''} onChange={e=>setForm({...form, tag:e.target.value})}/></div>
          <div><label className='text-xs text-slate-500'>Vendor</label><Input value={form.vendor||''} onChange={e=>setForm({...form, vendor:e.target.value})}/></div>
          <div><label className='text-xs text-slate-500'>Next Service</label><Input value={form.nextService||''} onChange={e=>setForm({...form, nextService:e.target.value})}/></div>
          <div><label className='text-xs text-slate-500'>Warranty End</label><Input value={form.warrantyEnd||''} onChange={e=>setForm({...form, warrantyEnd:e.target.value})}/></div>
        </div>
      </Dialog>

      <Sheet open={!!activeItem} onOpenChange={v=> !v && setActiveItemId(null)}>
        <SheetHeader>
          <SheetTitle>{activeItem?.name}</SheetTitle>
          <div className='text-xs text-slate-500'>{activeItem?.id} • {categories.find(c=>c.id===activeItem?.categoryId)?.name}</div>
        </SheetHeader>
        <SheetBody>
          {activeItem && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs text-slate-500'>Status</label>
                  <Select value={activeItem.status} onChange={e=>commitStatusChange(activeItem.id, e.target.value)}>{['OK','Needs Service','Under Repair','Lost','Scrapped'].map(s=> <option key={s} value={s}>{s}</option>)}</Select>
                </div>
                <div>
                  <label className='text-xs text-slate-500'>Custodian</label>
                  <Select value={activeItem.managerId} onChange={e=> upsertItem({ ...activeItem, managerId:e.target.value })}>{MANAGERS.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}</Select>
                </div>
                <div>
                  <label className='text-xs text-slate-500'>Location</label>
                  <Input value={activeItem.location} onChange={e=> upsertItem({ ...activeItem, location:e.target.value })}/>
                </div>
                <div>
                  <label className='text-xs text-slate-500'>Vendor</label>
                  <Input value={activeItem.vendor||''} onChange={e=> upsertItem({ ...activeItem, vendor:e.target.value })}/>
                </div>
              </div>
              <div className='rounded-lg border p-3'>
                <div className='mb-2 flex items-center justify-between'>
                  <div className='text-sm font-medium'>Issue Item</div>
                  <div className='text-xs text-slate-500'>Available: {activeItem.qtyAvailable}</div>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='text-xs text-slate-500'>Assign To</label>
                    <Select value={issueTo.type} onChange={e=> setIssueTo({ ...issueTo, type:e.target.value })}>{['Teacher','Student','Room'].map(t=> <option key={t} value={t}>{t}</option>)}</Select>
                  </div>
                  <div>
                    <label className='text-xs text-slate-500'>Name / Room</label>
                    <Input value={issueTo.name} onChange={e=> setIssueTo({ ...issueTo, name:e.target.value })} placeholder='Ms. Gupta / A104'/>
                  </div>
                  <div>
                    <label className='text-xs text-slate-500'>Quantity</label>
                    <Input type='number' min={1} value={issueQty} onChange={e=> setIssueQty(Number(e.target.value))}/>
                  </div>
                  <div className='flex items-end justify-end'>
                    <Button size='sm' className='gap-2' onClick={()=>commitIssue(activeItem.id)}><ClipboardList className='h-4 w-4'/>Issue</Button>
                  </div>
                </div>
                {activeItem.assignments?.length>0 && (
                  <div className='mt-3 text-xs text-slate-600'>
                    <div className='mb-1 font-medium'>Current Assignments</div>
                    <ul className='list-inside list-disc'>{activeItem.assignments.map((a,i)=> <li key={i}>{a.type}: {a.name}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetBody>
        <SheetFooter>
          <Button variant='outline' onClick={()=> setActiveItemId(null)}>Close</Button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}
