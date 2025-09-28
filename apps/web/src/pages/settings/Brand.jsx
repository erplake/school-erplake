import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';

export default function BrandSettings(){
  const [data,setData] = useState(null);
  const [form, setForm] = useState({});
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState(null);
  const [saved,setSaved] = useState(false);

  useEffect(()=>{
    let ignore=false;
    async function load(){
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/settings/brand`);
        if(!res.ok) throw new Error('Failed to load');
        const j = await res.json();
        if(!ignore){ setData(j); setForm(j);} 
      } catch(e){ if(!ignore) setError(e.message); }
    }
    load();
    return ()=>{ignore=true};
  },[]);

  async function submit(e){
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/settings/brand`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json', ...(import.meta.env.VITE_DEV_ACCESS_TOKEN? {Authorization:`Bearer ${import.meta.env.VITE_DEV_ACCESS_TOKEN}`} : {})},
        body: JSON.stringify(form)
      });
      if(!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setData(j); setForm(j); setSaved(true);
    } catch(e){ setError(e.message);} finally { setSaving(false);}  
  }

  function update(k,v){
    setForm(f=>({...f,[k]:v}));
  }

  const fields = [
    ['school_name','School Name'],
    ['principal_name','Principal Name'],
    ['phone_primary','Primary Phone'],
    ['phone_transport','Transport Phone'],
    ['email_contact','Contact Email'],
    ['location_address','Location / Address'],
    ['logo_url','Logo URL'],
    ['website_url','Website URL']
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Brand / School Profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Global settings used across invoices, notifications, and public portals.</p>
      </div>
      {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        {fields.map(([k,label])=> (
          <div key={k} className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">{label}</label>
            <input
              value={form[k]||''}
              onChange={e=>update(k,e.target.value)}
              className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>{saving? 'Saving...':'Save Changes'}</Button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
