import React from 'react';
import { useToast } from '../../../components/ToastProvider.jsx';

export function PlanSubstitutionsModal({ onClose, onSaved, teachers }) {
  const toast = useToast();
  const teacherOpts = (teachers||[]).filter(t=> (t.role||'').toLowerCase()==='teacher');
  const [form, setForm] = React.useState({ absentTeacherId:'', coveringTeacherId:'', start:new Date().toISOString().slice(0,10), end:new Date().toISOString().slice(0,10), notes:'' });
  const change=(k,v)=> setForm(f=>({...f,[k]:v}));
  const submit=()=>{
    if(!form.absentTeacherId){ toast.error('Absent teacher required'); return; }
    if(!form.coveringTeacherId){ toast.error('Covering teacher required'); return; }
    onSaved?.(form);
    onClose();
  };
  return (
    <div>
      <div className="mb-3"><div className="text-lg font-semibold">Plan Substitution</div><div className="text-xs text-slate-500">Assign a covering teacher for an absence.</div></div>
      <div className="space-y-3 text-sm">
        <label className="block"><span className="text-xs text-slate-500">Absent Teacher</span>
          <select className="mt-1 w-full border rounded-lg px-3 py-2" value={form.absentTeacherId} onChange={e=>change('absentTeacherId', e.target.value)}>
            <option value="">— Select —</option>
            {teacherOpts.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-xs text-slate-500">Covering Teacher</span>
          <select className="mt-1 w-full border rounded-lg px-3 py-2" value={form.coveringTeacherId} onChange={e=>change('coveringTeacherId', e.target.value)}>
            <option value="">— Select —</option>
            {teacherOpts.filter(t=> String(t.id)!==String(form.absentTeacherId)).map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs text-slate-500">From</span><input type="date" className="mt-1 w-full border rounded-lg px-3 py-2" value={form.start} onChange={e=>change('start',e.target.value)} /></label>
          <label className="block"><span className="text-xs text-slate-500">To</span><input type="date" className="mt-1 w-full border rounded-lg px-3 py-2" value={form.end} onChange={e=>change('end',e.target.value)} /></label>
        </div>
        <label className="block"><span className="text-xs text-slate-500">Notes</span><textarea rows={3} className="mt-1 w-full border rounded-lg px-3 py-2" value={form.notes} onChange={e=>change('notes',e.target.value)} placeholder="Optional notes" /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50 text-sm">Cancel</button><button onClick={submit} className="rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-sm">Save</button></div>
    </div>
  );
}
