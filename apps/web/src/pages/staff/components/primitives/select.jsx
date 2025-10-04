import React from 'react';

export function Select({ value, onChange, options, label, className='' }) {
  return (
    <label className={`text-xs font-medium text-slate-600 inline-flex flex-col gap-1 ${className}`}>
      {label && <span>{label}</span>}
      <select value={value} onChange={e=>onChange(e.target.value)} className="text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
