import React from 'react';
import clsx from 'clsx';

export function Textarea({ className, ...props }){
  return <textarea className={clsx('w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500', className)} {...props} />;
}
export default Textarea;
