import React from 'react';

export function QA({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-left flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-50 grid place-content-center text-slate-600">
        {icon}
      </div>
      <div className="text-sm font-medium">{label}</div>
    </button>
  );
}
