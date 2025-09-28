import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

export function StatCard({ icon:Icon, label, value, delta, positive=true, hover=true }) {
  return (
    <div className={clsx('relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col gap-3 shadow-sm', hover && 'transition-colors hover:border-primary/50')}> 
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted">
        {Icon && <Icon className="w-4 h-4 opacity-70"/>}
        <span>{label}</span>
      </div>
      <div className="text-3xl font-semibold leading-none text-heading">{value}</div>
      {delta && (
        <div className={clsx('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full w-fit', positive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400')}> 
          {positive ? <ArrowTrendingUpIcon className="w-3 h-3"/> : <ArrowTrendingDownIcon className="w-3 h-3"/>}
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
