import React from 'react';
import clsx from 'clsx';

export function Avatar({ children, className }){
  return <div className={clsx('inline-flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 select-none overflow-hidden', className)}>{children}</div>;
}
export function AvatarFallback({ children, className }){
  return <div className={clsx('w-full h-full flex items-center justify-center text-xs font-medium', className)}>{children}</div>;
}
export default Avatar;
