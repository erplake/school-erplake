import React from 'react';

export function Info({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1">{icon}{label}</div>
      <div className="mt-1 font-medium break-words text-sm">{value ?? '—'}</div>
    </div>
  );
}
