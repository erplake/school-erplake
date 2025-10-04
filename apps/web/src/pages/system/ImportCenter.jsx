import React, { useState, useEffect } from 'react';
import { RequireCapability } from '../../context/RBACContext.jsx';

const STORAGE_KEY = 'import_jobs_v1';

export default function ImportCenter(){
  const [jobs,setJobs] = useState(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }catch{} return []; });
  const [step,setStep] = useState('upload');
  const [fileMeta,setFileMeta] = useState(null);
  const [mapping,setMapping] = useState({});
  const [domain,setDomain] = useState('students');

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs)); }catch{} },[jobs]);

  function onFile(e){ const f = e.target.files?.[0]; if(!f) return; setFileMeta({ name:f.name, size:f.size }); setStep('mapping'); }
  function simulateValidate(){ setStep('review'); }
  function commitImport(){ const id='job_'+Math.random().toString(36).slice(2,7); const now=Date.now(); const newJob={ id, domain, file:fileMeta?.name, rows: Math.floor(Math.random()*200)+20, errors:0, warnings: Math.random()>0.7?2:0, status:'Completed', createdAt:now }; setJobs(js=> [newJob,...js]); setStep('upload'); setFileMeta(null); setMapping({}); }

  const sampleColumns = { students:['firstName','lastName','grade','admissionNo','email'], staff:['firstName','lastName','department','email'], inventory:['itemName','category','qty','location'] };
  const required = sampleColumns[domain]||[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Data Import Center</h1>
        <select value={domain} onChange={e=>{ setDomain(e.target.value); setMapping({}); setStep('upload'); }} className="h-9 border rounded-md px-2 text-sm">
          <option value="students">Students</option>
          <option value="staff">Staff</option>
          <option value="inventory">Inventory</option>
        </select>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {step==='upload' && (
            <div className="p-6 border rounded-lg bg-white space-y-4">
              <div className="text-sm font-medium">1. Upload CSV</div>
              <input type="file" accept=".csv" onChange={onFile} className="text-xs" />
              <div className="text-[11px] text-slate-500">Accepted: UTF-8 CSV. Max 5MB (not enforced client-side yet).</div>
            </div>
          )}
          {step==='mapping' && (
            <div className="p-6 border rounded-lg bg-white space-y-4">
              <div className="text-sm font-medium">2. Map Columns</div>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                {required.map(col=> <label key={col} className="space-y-1"><span className="text-[11px] uppercase text-slate-500">{col}</span><input value={mapping[col]||''} onChange={e=>setMapping(m=>({...m,[col]:e.target.value}))} placeholder="CSV column name" className="h-8 w-full border rounded px-2" /></label>)}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setStep('upload')} className="h-8 px-3 text-xs rounded-md border">Back</button>
                <button onClick={simulateValidate} disabled={required.some(c=>!mapping[c])} className="h-8 px-3 text-xs rounded-md bg-primary text-white disabled:opacity-40">Validate</button>
              </div>
            </div>
          )}
          {step==='review' && (
            <div className="p-6 border rounded-lg bg-white space-y-4">
              <div className="text-sm font-medium">3. Review & Commit</div>
              <ul className="text-xs list-disc pl-5 space-y-1">
                <li>{fileMeta?.name} appears valid.</li>
                <li>Detected rows: ~{Math.floor(Math.random()*200)+50} (simulated).</li>
                <li>No blocking errors (simulation).</li>
              </ul>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setStep('mapping')} className="h-8 px-3 text-xs rounded-md border">Back</button>
                <button onClick={commitImport} className="h-8 px-3 text-xs rounded-md bg-primary text-white">Import</button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-white space-y-2">
            <div className="text-sm font-medium">Recent Jobs</div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {jobs.map(j=> <div key={j.id} className="p-2 border rounded text-xs space-y-1 bg-slate-50">
                <div className="flex justify-between"><span className="font-medium truncate">{j.file}</span><span className="text-[10px] text-slate-500">{j.domain}</span></div>
                <div>{j.rows} rows • {j.errors} errors • {j.warnings} warnings</div>
                <div className="text-[10px] text-slate-500">{new Date(j.createdAt).toLocaleString()}</div>
              </div>)}
              {jobs.length===0 && <div className="text-[11px] text-slate-500">No imports yet.</div>}
            </div>
            <div className="text-[11px] text-slate-500">Future: status polling, error drill-down, retry.</div>
          </div>
          <RequireCapability capability="backup.export" fallback={<div className="p-4 border rounded-lg bg-white text-xs text-slate-500">No backup permission.</div>}>
            <div className="p-4 border rounded-lg bg-white space-y-2">
              <div className="text-sm font-medium">Backup / Export</div>
              <button onClick={()=>alert('Simulated export triggered')} className="h-8 w-full rounded-md bg-primary text-white text-xs">Run Full Export</button>
              <div className="text-[11px] text-slate-500">Generates snapshot (simulation).</div>
            </div>
          </RequireCapability>
        </div>
      </div>
    </div>
  );
}
