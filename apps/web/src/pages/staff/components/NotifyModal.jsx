import React from 'react';
import { motion } from 'framer-motion';
import { LS_KEYS, saveJSON } from '../../../utils/storageKeys.js';
import { useToast } from '../../../components/ToastProvider.jsx';

export function NotifyModal({ onClose, staffCount, initial, onSent }) {
  const toast = useToast();
  const [form, setForm] = React.useState(initial || { subject:'', message:'' });
  const [sending, setSending] = React.useState(false);
  const change = (k,v)=> setForm(f=>({...f,[k]:v}));
  const submit = () => {
    if(!form.subject.trim() || !form.message.trim()){ toast.error('Subject & message required'); return; }
    setSending(true);
    saveJSON(LS_KEYS.STAFF_NOTIFY_LAST, form);
    setTimeout(()=> { toast.success(`Announcement sent to ${staffCount} staff`); setSending(false); onSent?.(form); onClose(); }, 500);
  };
  return (
    <div>
      <div className="mb-3"><div className="text-lg font-semibold">Notify Staff</div><div className="text-xs text-slate-500">Send an announcement to all currently filtered staff.</div></div>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-xs text-slate-500">Subject</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.subject} onChange={e=>change('subject', e.target.value)} placeholder="e.g. Staff Meeting at 4 PM" />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-slate-500">Message</span>
          <textarea rows={5} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.message} onChange={e=>change('message', e.target.value)} placeholder="Details of the announcement..." />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button disabled={sending} onClick={onClose} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50 text-sm disabled:opacity-50">Cancel</button><button disabled={sending} onClick={submit} className="rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-sm disabled:opacity-50">{sending?'Sending…':'Send'}</button></div>
    </div>
  );
}
