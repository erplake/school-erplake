import React from 'react';
import clsx from 'clsx';

export function Checkbox({ className, ...props }){
  return <input type="checkbox" className={clsx('h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500', className)} {...props} />;
}
export default Checkbox;
