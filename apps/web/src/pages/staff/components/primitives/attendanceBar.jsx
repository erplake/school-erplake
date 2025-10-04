import React from 'react';

export function AttendanceBar({ value, className='' }) {
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="w-28 bg-slate-200 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full bg-indigo-600" style={{ width: pct + '%' }} />
      </div>
      <span className="tabular-nums text-xs font-medium">{pct}%</span>
    </div>
  );
}
