import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import clsx from 'clsx';

dayjs.extend(relativeTime);

/**
 * Activity item shape: { id, type, title, meta, ts }
 */
const typeColor = {
  admission: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  payment: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  meeting: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  exam: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'
};

export function ActivityList({ items=[] }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
      {items.map(item => (
  <li key={item.id} className="py-3 flex items-start gap-3 text-sm text-body">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/70"></span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-heading font-medium truncate text-sm">{item.title}</p>
              <span className={clsx('text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide', typeColor[item.type] || typeColor.default)}>{item.type}</span>
            </div>
            <p className="text-xs text-muted mt-1">{item.meta}</p>
          </div>
          <time className="text-[11px] text-subtle whitespace-nowrap">{dayjs(item.ts).fromNow()}</time>
        </li>
      ))}
    </ul>
  );
}

export default ActivityList;
