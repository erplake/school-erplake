import React, { useState, useMemo } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';

const StatusPill = ({ status }) => {
  const map = { Active:'bg-emerald-50 text-emerald-700 border-emerald-200', Trial:'bg-blue-50 text-blue-700 border-blue-200', Suspended:'bg-amber-50 text-amber-700 border-amber-200', Closed:'bg-rose-50 text-rose-700 border-rose-200' };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[status]||'bg-slate-50 text-slate-700 border-slate-200'}`}>{status}</span>;
};
const Star = (p)=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2"/></svg>;
const CategoryIcon = ({ category, className='h-4 w-4' }) => { const iconProps={className}; switch(category){ case 'Food': return <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3h16"/><path d="M7 3v13a5 5 0 0 0 10 0V3"/></svg>; case 'Books': return <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>; case 'Uniform': return <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v6h-5z"/><path d="M3 3h5v6H3z"/><path d="M8 3h8v6H8z"/><path d="M3 9h18v12H3z"/></svg>; case 'Events': return <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>; default: return <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>; } };
const RatingStars = ({ value=0 }) => { const stars = Array.from({length:5}).map((_,i)=><Star key={i} className={`h-4 w-4 ${i < Math.round(value)?'fill-current text-yellow-500':'text-slate-300'}`} />); return <div className="flex items-center gap-0.5">{stars}</div>; };

const seedVendors = [
  { id:'v1', name:'TastyBite Caterers', category:'Food', contactName:'Arun Mehta', phone:'+91 98765 12345', email:'arun@tastybite.example', status:'Active', rating:4.5, slaOnTime:97, contractEnd:'2025-12-15', issues:0, compliance:{ gst:true,fssai:true,police:false }, address:'Phase 2, Okhla, New Delhi' },
  { id:'v2', name:'Scholars Book Depot', category:'Books', contactName:'P. Sharma', phone:'+91 99880 22331', email:'sales@scholarsbooks.example', status:'Trial', rating:3.8, slaOnTime:92, contractEnd:'2026-03-01', issues:1, compliance:{ gst:true,fssai:false,police:false }, address:'Chandni Chowk, Delhi' },
  { id:'v3', name:'Campus Uniforms Co.', category:'Uniform', contactName:'N. Kaur', phone:'+91 98111 76543', email:'ops@campusuniforms.example', status:'Active', rating:4.2, slaOnTime:95, contractEnd:'2025-11-10', issues:0, compliance:{ gst:true,fssai:false,police:true }, address:'Sector 62, Noida' },
  { id:'v4', name:'Eventify Schools', category:'Events', contactName:'V. Iyer', phone:'+91 90000 44422', email:'hello@eventify.example', status:'Suspended', rating:2.9, slaOnTime:78, contractEnd:'2025-10-30', issues:3, compliance:{ gst:true,fssai:false,police:false }, address:'Galleria, Gurugram' },
];
function daysUntil(dateStr){ const now = new Date(); const d=new Date(dateStr); return Math.ceil((d.getTime() - now.getTime())/86400000); }
// CSV handled by shared utility

export default function VendorManagementPage(){
  const [vendors,setVendors] = useState(seedVendors);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All');
  const [status,setStatus] = useState('All');
  const [minRating,setMinRating] = useState('0');
  const [selected,setSelected] = useState({});
  const [showAdd,setShowAdd] = useState(false);
  const [showIssue,setShowIssue] = useState(false);
  const [showPayment,setShowPayment] = useState(false);
  const [active,setActive] = useState(null);
  const [showDetail,setShowDetail] = useState(false);

  const categories = ['All','Food','Books','Uniform','Events','Transport','Other'];
  const statuses = ['All','Active','Trial','Suspended','Closed'];
  const filtered = useMemo(()=> vendors.filter(v=> (query==='' || v.name.toLowerCase().includes(query.toLowerCase())) && (category==='All'||v.category===category) && (status==='All'||v.status===status) && (+minRating===0 || v.rating>=+minRating)), [vendors,query,category,status,minRating]);
  const stats = useMemo(()=>({ total: vendors.length, active: vendors.filter(v=>v.status==='Active').length, avgRating: vendors.length ? (vendors.reduce((s,v)=> s+v.rating,0)/vendors.length).toFixed(1):0, issues: vendors.reduce((s,v)=> s+v.issues,0) }), [vendors]);
  const toggleSelectAll = (checked)=> { if(checked){ setSelected(Object.fromEntries(filtered.map(v=>[v.id,true])));} else { setSelected({}); } };
  const bulkUpdateStatus = (newStatus)=> { setVendors(vs=> vs.map(v=> selected[v.id]? {...v,status:newStatus}: v)); setSelected({}); };
  const exportCSV = ()=> {
    const headers = ['ID','Name','Category','Status','Rating','SLA On-Time','ContractEnd','Issues'];
    const rows = filtered.map(v=> [v.id,v.name,v.category,v.status,v.rating,v.slaOnTime,v.contractEnd,v.issues]);
    exportRowsAsCSV(headers, rows, { filename:'vendors.csv', bom:true });
  };
  const startIssue = (v)=> { setActive(v); setShowIssue(true); };
  const startPayment = (v)=> { setActive(v); setShowPayment(true); };
  const openDetail = (v)=> { setActive(v); setShowDetail(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Vendor Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowAdd(true)} className="h-9 px-3 rounded-md bg-primary text-white text-sm">Add Vendor</button>
          <button onClick={exportCSV} className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm">Export CSV</button>
        </div>
      </div>
      <div className="grid md:grid-cols-6 gap-3 text-sm">
        <input placeholder="Search" value={query} onChange={e=>setQuery(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3" />
        <select value={category} onChange={e=>setCategory(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2"><option>All</option>{categories.slice(1).map(c=> <option key={c}>{c}</option>)}</select>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2"><option>All</option>{statuses.slice(1).map(s=> <option key={s}>{s}</option>)}</select>
        <select value={minRating} onChange={e=>setMinRating(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2"><option value="0">Min Rating</option><option value="3">3+</option><option value="4">4+</option></select>
        <div className="flex items-center gap-2"><input type="checkbox" checked={Object.keys(selected).length===filtered.length && filtered.length>0} onChange={e=>toggleSelectAll(e.target.checked)} /> <span>Select All</span></div>
        <div className="flex items-center gap-2">{Object.keys(selected).length>0 && (<><select onChange={e=> bulkUpdateStatus(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2"><option>Bulk Status</option>{statuses.slice(1).map(s=> <option key={s}>{s}</option>)}</select></>)}</div>
      </div>
      <div className="grid md:grid-cols-4 gap-4 text-sm">
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Total Vendors</div><div className="text-lg font-semibold">{stats.total}</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Active</div><div className="text-lg font-semibold">{stats.active}</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Avg Rating</div><div className="text-lg font-semibold">{stats.avgRating}</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Open Issues</div><div className="text-lg font-semibold">{stats.issues}</div></div>
      </div>
      <div className="overflow-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-left"><th className="p-2">Sel</th><th className="p-2">Vendor</th><th className="p-2">Category</th><th className="p-2">Contact</th><th className="p-2">Status</th><th className="p-2">Rating</th><th className="p-2">On-Time%</th><th className="p-2">Contract</th><th className="p-2">Issues</th><th className="p-2">Compliance</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {filtered.map(v=> <tr key={v.id} className="border-t hover:bg-slate-50">
              <td className="p-2"><input type="checkbox" checked={!!selected[v.id]} onChange={e=> setSelected(sel=> ({...sel,[v.id]:e.target.checked}))} /></td>
              <td className="p-2 font-medium flex items-center gap-1"><CategoryIcon category={v.category} /> {v.name}</td>
              <td className="p-2">{v.category}</td>
              <td className="p-2 text-xs">{v.contactName}<br/>{v.phone}</td>
              <td className="p-2"><StatusPill status={v.status} /></td>
              <td className="p-2"><RatingStars value={v.rating} /></td>
              <td className="p-2">{v.slaOnTime}%</td>
              <td className="p-2 text-xs">{daysUntil(v.contractEnd)}d</td>
              <td className="p-2">{v.issues}</td>
              <td className="p-2 text-xs">GST:{v.compliance.gst?'Y':'N'} FSSAI:{v.compliance.fssai?'Y':'N'} POL:{v.compliance.police?'Y':'N'}</td>
              <td className="p-2 flex flex-wrap gap-1">
                <button onClick={()=>openDetail(v)} className="px-2 py-1 border rounded text-xs">Detail</button>
                <button onClick={()=>startIssue(v)} className="px-2 py-1 border rounded text-xs">Issue</button>
                <button onClick={()=>startPayment(v)} className="px-2 py-1 border rounded text-xs">Payment</button>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {showDetail && active && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border w-full max-w-xl p-4 space-y-4"><div className="flex items-center justify-between"><h2 className="font-medium">Vendor Detail</h2><button onClick={()=>setShowDetail(false)} className="p-1 rounded hover:bg-slate-100">✕</button></div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Name:</span> {active.name}</div>
              <div><span className="text-slate-500">Category:</span> {active.category}</div>
              <div><span className="text-slate-500">Contact:</span> {active.contactName}</div>
              <div><span className="text-slate-500">Phone:</span> {active.phone}</div>
              <div><span className="text-slate-500">Email:</span> {active.email}</div>
              <div><span className="text-slate-500">Status:</span> {active.status}</div>
            </div>
            <div className="text-xs text-slate-600">Address: {active.address}</div>
          </div>
        </div>
      )}
    </div>
  );
}
