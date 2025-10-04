import React from 'react';
import clsx from 'clsx';

const variants = {
  default: 'bg-indigo-600 text-white',
  outline: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
  secondary: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
};

export function Badge({ variant='default', className, children }) {
  return <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', variants[variant] || variants.default, className)}>{children}</span>;
}

export default Badge;
