import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SubstitutionPlannerModal({ open, onClose, staff, form, setForm, onSubmit, submitting }) {
  // Derive teacher lists (only active teachers for both selects)
  const teachers = staff.filter(s=> s.role==='Teacher' && s.status!=='Resigned');
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div initial={{scale:.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:.9, opacity:0}} className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Plan Substitution</h2>
              <button onClick={()=>!submitting && onClose()} className="text-slate-500 hover:text-slate-700 text-sm">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Absent Teacher</label>
                <select value={form.absentId} onChange={e=>setForm(f=>({...f,absentId:Number(e.target.value)||''}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Select</option>
                  {teachers.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Substitute Teacher</label>
                <select value={form.subId} onChange={e=>setForm(f=>({...f,subId:Number(e.target.value)||''}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Select</option>
                  {teachers.filter(t=> t.id!==form.absentId).map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Periods / Slots</label>
                <input value={form.periods} onChange={e=>setForm(f=>({...f,periods:e.target.value}))} placeholder="e.g. 2,3,5" className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Any special instructions..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} disabled={submitting} className="px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
              <button onClick={onSubmit} disabled={submitting || !form.date || !form.absentId || !form.subId || !form.periods.trim()} className="px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{submitting? 'Saving…':'Plan'}</button>
            </div>
            <p className="text-[11px] text-slate-400">Placeholder – integrate with timetable & substitution backend (e.g. POST /academics/substitutions) later.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}