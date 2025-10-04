import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AssignDutyModal({ open, onClose, staff, form, setForm, onSubmit, submitting }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div initial={{scale:.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:.9, opacity:0}} className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Assign Duty</h2>
              <button onClick={()=>!submitting && onClose()} className="text-slate-500 hover:text-slate-700 text-sm">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Exam Duty / Event Coordination" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assign To</label>
                  <select value={form.staffId} onChange={e=>setForm(f=>({...f,staffId: Number(e.target.value)||''}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select Staff</option>
                    {staff.filter(s=>s.status!=='Resigned').map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description / Notes</label>
                <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Any specific instructions..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} disabled={submitting} className="px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
              <button onClick={onSubmit} disabled={submitting || !form.title.trim() || !form.staffId || !form.date} className="px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{submitting? 'Saving…':'Assign'}</button>
            </div>
            <p className="text-[11px] text-slate-400">Placeholder only – wire to backend duty endpoint in future (e.g. POST /staff/duties).</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}