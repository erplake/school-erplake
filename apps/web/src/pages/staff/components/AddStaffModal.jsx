import React from 'react';
import { Modal, Field, Select } from './primitives';
import { Plus } from 'lucide-react';

const GRADES = Array.from({length:12}).map((_,i)=>`Grade ${i+1}`);

export function AddStaffModal({ open, onClose, form, setForm, roles, departments, onCreate }) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="mb-3">
        <div className="text-lg font-semibold">Add Staff</div>
        <div className="text-xs text-slate-500">Create a new staff profile. You can edit later.</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Full Name"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></Field>
        <Field label="Role"><select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>{roles.filter(r=>r!=='All').map(r=> <option key={r}>{r}</option>)}</select></Field>
        <Field label="Department"><select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.department} onChange={e=>setForm({...form, department:e.target.value})}>{departments.filter(d=>d!=='All').map(d=> <option key={d}>{d}</option>)}</select></Field>
        {form.role==='Teacher' && <Field label="Grade"><select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}>{GRADES.map(g=> <option key={g}>{g}</option>)}</select></Field>}
        <Field label="Email"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></Field>
        <Field label="Phone"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></Field>
        <Field label="Date of Joining"><input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.doj} onChange={e=>setForm({...form, doj:e.target.value})} /></Field>
        <Field label="Reports To"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={form.reportsTo} onChange={e=>setForm({...form, reportsTo:e.target.value})} /></Field>
      </div>
      <div className="mt-4 flex justify-end gap-2 text-sm">
        <button onClick={onClose} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50">Cancel</button>
        <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"><Plus size={16}/>Create</button>
      </div>
    </Modal>
  );
}
