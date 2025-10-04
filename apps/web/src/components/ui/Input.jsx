import React from 'react';
import clsx from 'clsx';

export function Input({ className, ...props }) {
  return <input className={clsx('flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50', className)} {...props} />;
}

export default Input;
