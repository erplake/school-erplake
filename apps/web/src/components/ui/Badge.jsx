import React from 'react';
import clsx from 'clsx';

const variants = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  outline: 'border text-foreground'
};

export function Badge({ variant='default', className, children }) {
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium select-none', variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}

export default Badge;
