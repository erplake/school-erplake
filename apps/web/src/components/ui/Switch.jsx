import React from 'react';

export function Switch({ checked, onCheckedChange, className }){
  return (
    <button
      type="button"
      onClick={()=>onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} ${className||''}`}
      aria-pressed={checked}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}
export default Switch;
