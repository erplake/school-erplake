import React from 'react';

export function Field({ label, children, hint }) {
  return (
    <label className="text-xs font-medium text-slate-600 flex flex-col gap-1">
      {label && <span>{label}</span>}
      {children}
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}
