import React from 'react';
import clsx from 'clsx';
export function Separator({ orientation='horizontal', className }){
  if (orientation==='vertical') return <div className={clsx('w-px h-full bg-slate-200 dark:bg-slate-700', className)} />;
  return <div className={clsx('h-px w-full bg-slate-200 dark:bg-slate-700', className)} />;
}
export default Separator;
