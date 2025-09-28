import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

/* action shape: { to, label, icon: Icon, tone } */
const toneColor = {
  default: 'text-slate-600 dark:text-slate-300',
  primary: 'text-primary',
  green: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-sky-600 dark:text-sky-400'
};

export function QuickActions({ actions=[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map(a => (
        <NavLink key={a.to} to={a.to} className={({isActive})=>clsx('group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col gap-3 transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40', isActive && 'border-primary/60')}>
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted">
            {a.icon && <a.icon className={clsx('w-4 h-4 opacity-70', toneColor[a.tone||'default'])}/>}<span>{a.label}</span>
          </div>
          <div className="text-[11px] text-subtle">Open {a.label}</div>
        </NavLink>
      ))}
    </div>
  );
}

export default QuickActions;
