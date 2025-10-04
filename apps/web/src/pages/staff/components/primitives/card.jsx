import React from 'react';

export function Card({ title, subtitle, children, className='' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-4 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <div className="font-semibold leading-tight">{title}</div>}
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
