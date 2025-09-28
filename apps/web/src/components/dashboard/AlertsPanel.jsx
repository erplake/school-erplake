import React from 'react';
import clsx from 'clsx';

/* Alert shape: { id, title, count, tone }
   tone: 'warning' | 'danger' | 'info' */
const toneStyles = {
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300 border-sky-200 dark:border-sky-500/20'
};

export function AlertsPanel({ alerts=[] }) {
  if(!alerts.length){
    return <p className="text-sm text-muted">No alerts right now.</p>;
  }
  return (
    <ul className="space-y-2">
      {alerts.map(a => (
        <li key={a.id} className={clsx('flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium', toneStyles[a.tone] || toneStyles.info)}>
          <span className="truncate pr-3">{a.title}</span>
          {typeof a.count === 'number' && (
            <span className="ml-auto w-6 h-6 rounded-full bg-white/70 dark:bg-slate-900/30 flex items-center justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-200 shadow-inner">
              {a.count}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default AlertsPanel;
