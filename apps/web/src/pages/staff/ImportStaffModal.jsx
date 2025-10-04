import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staffApi } from '../../api/client.js';
import { Download, Upload, XCircle } from 'lucide-react';
import { useToast } from '../../components/ToastProvider.jsx';

export function ImportStaffModal({ onClose }){
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(false);
    if(e.dataTransfer.files && e.dataTransfer.files[0]){
      const f = e.dataTransfer.files[0];
      if(!f.name.endsWith('.csv')){ toast.error('Only .csv files'); return; }
      setFile(f);
    }
  };

  const handleFile = (e) => {
    if(e.target.files && e.target.files[0]){
      const f = e.target.files[0];
      if(!f.name.endsWith('.csv')){ toast.error('Only .csv files'); return; }
      setFile(f);
    }
  };

  async function doImport(){
    if(!file){ toast.error('Select a CSV first'); return; }
    setLoading(true); setSummary(null);
    try {
      const res = await staffApi.importStaffCSV(file);
      setSummary(res);
      toast.success('Import completed');
    } catch(e){ toast.error(e.message||'Import failed'); }
    finally { setLoading(false); }
  }

  async function downloadTemplate(){
    try {
      const text = await staffApi.downloadImportTemplate();
      const blob = new Blob([text], { type:'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='staff_import_template.csv'; a.click(); URL.revokeObjectURL(url);
    } catch(e){ toast.error('Template fetch failed'); }
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={()=>onClose()} />
      <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Import Staff</h2>
            <p className="text-xs text-slate-500">Upload a CSV to create or update staff records. Existing rows matched by employee_id or staff_code are updated.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">Close</button>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div onDragOver={e=>{e.preventDefault(); setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop} className={"border-2 border-dashed rounded-xl p-6 text-center text-sm " + (dragging? 'border-indigo-500 bg-indigo-50':'border-slate-300 bg-slate-50')}>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="import-file" />
              <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={28} className="text-slate-400" />
                {file ? <span className="font-medium text-slate-700">{file.name}</span> : <span><span className="text-indigo-600 font-medium">Click to browse</span> or drop CSV here</span>}
                <span className="text-[11px] text-slate-500">Required header row included in template</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button disabled={loading || !file} onClick={doImport} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-indigo-600 text-white text-sm disabled:opacity-50">{loading? 'Importing…':'Start Import'}</button>
              <button disabled={loading} onClick={()=>{ setFile(null); setSummary(null); }} className="rounded-lg px-4 py-2 border border-slate-200 text-sm bg-white hover:bg-slate-50 disabled:opacity-50">Reset</button>
              <button disabled={loading} onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-sm"><Download size={16}/>Template</button>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>Notes:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><code>employee_id</code> preferred for updates; fallback to <code>staff_code</code>.</li>
                <li>Optional fields can be blank.</li>
                <li>Only changed fields overwrite existing data.</li>
              </ul>
            </div>
          </div>
          <div className="w-full lg:w-72">
            <h3 className="text-sm font-semibold mb-2">Summary</h3>
            {!summary && <div className="text-xs text-slate-500 border border-slate-200 rounded-lg p-3">Run an import to see results here.</div>}
            {summary && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 p-3 text-sm bg-slate-50">
                  <div className="flex justify-between"><span>Created</span><span className="font-medium">{summary.created}</span></div>
                  <div className="flex justify-between"><span>Updated</span><span className="font-medium">{summary.updated}</span></div>
                  <div className="flex justify-between"><span>Errors</span><span className="font-medium">{summary.errors.length}</span></div>
                </div>
                {summary.errors.length>0 && (
                  <div className="max-h-40 overflow-auto border border-rose-200 bg-rose-50 rounded-lg p-2 text-[11px] space-y-1">
                    {summary.errors.map((e,i)=>(<div key={i} className="flex items-start gap-1"><XCircle size={12} className="text-rose-500 mt-0.5"/><span className="text-rose-700">{e}</span></div>))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ImportStaffModal;