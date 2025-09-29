import React, { useEffect } from 'react';
import clsx from 'clsx';

// Simple accessible sheet (side panel) component
// Props: open, onOpenChange, side ('right'|'left'), className, children
export function Sheet({ open, onOpenChange, side='right', className, children }) {
  useEffect(()=>{
    function onKey(e){ if(e.key==='Escape' && open){ onOpenChange?.(false); } }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[open,onOpenChange]);

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={()=>onOpenChange?.(false)} />
      <div
        className={clsx(
          'relative w-full max-w-xl h-full bg-background border-l shadow-xl overflow-y-auto animate-in slide-in-from-right duration-150',
          side==='left' && 'border-l-0 border-r animate-in slide-in-from-left',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ children, className }) {
  return <div className={clsx('p-6 pb-4 border-b flex items-center gap-3', className)}>{children}</div>;
}
export function SheetTitle({ children, className }) {
  return <h2 className={clsx('text-lg font-semibold tracking-tight', className)}>{children}</h2>;
}
export function SheetBody({ children, className }) {
  return <div className={clsx('p-6 space-y-6', className)}>{children}</div>;
}
export function SheetFooter({ children, className }) {
  return <div className={clsx('p-6 pt-0 border-t flex items-center justify-end gap-2', className)}>{children}</div>;
}

export default Sheet;