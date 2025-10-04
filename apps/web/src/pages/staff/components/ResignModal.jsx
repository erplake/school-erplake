import React from 'react';
import { Modal, Field } from './primitives';
import { UserX } from 'lucide-react';

export function ResignModal({ open, onClose, staff, resign, setResign, onConfirm }) {
  if(!staff) return null;
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="mb-3">
        <div className="text-lg font-semibold">Mark Resignation</div>
        <div className="text-xs text-slate-500">{staff.name} · {staff.role}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Last Working Day"><input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={resign.date} onChange={e=>setResign({...resign, date:e.target.value})} /></Field>
        <Field label="Reason"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="e.g., Relocation, Higher studies" value={resign.reason} onChange={e=>setResign({...resign, reason:e.target.value})} /></Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-rose-600 text-white hover:bg-rose-700"><UserX size={16}/>Mark Resigned</button>
      </div>
    </Modal>
  );
}
