import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);

let idCounter = 0;

export function ToastProvider({ children, position='top-right', duration=4000, max=5 }){
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, opts={}) => {
    const id = ++idCounter;
    const t = { id, msg, type: opts.type||'info', ts: Date.now(), duration: opts.duration || duration };
    setToasts(prev => [t, ...prev].slice(0, max));
    if(t.duration>0){
      setTimeout(()=> setToasts(prev=> prev.filter(x=> x.id!==id)), t.duration);
    }
    return id;
  }, [duration, max]);

  const remove = useCallback(id => setToasts(prev=> prev.filter(x=> x.id!==id)), []);

  return (
    <ToastCtx.Provider value={{ push, remove }}>
      {children}
      <div className={`fixed z-50 flex flex-col gap-2 p-4 ${position.includes('top')?'top-0':'bottom-0'} ${position.includes('right')?'right-0':'left-0'}`}>
        {toasts.map(t=> <Toast key={t.id} toast={t} onDismiss={()=>remove(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({ toast, onDismiss }){
  const color = toast.type==='error' ? 'bg-rose-600' : toast.type==='success' ? 'bg-emerald-600' : toast.type==='warn' ? 'bg-amber-600' : 'bg-slate-800';
  return (
    <div className={`text-white px-3 py-2 rounded-lg shadow-md text-sm flex items-start gap-2 w-72 animate-fade-in ${color}`}>
      <div className="flex-1 leading-snug whitespace-pre-wrap">{toast.msg}</div>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 text-xs">×</button>
    </div>
  );
}

export function useToast(){
  const ctx = useContext(ToastCtx);
  if(!ctx) throw new Error('useToast must be used within <ToastProvider/>');
  return ctx;
}

// Minimal animation via tailwind (optional). Add this in a global CSS if not present:
// .animate-fade-in { @apply transition-opacity duration-300; animation: fadeIn .25s ease; }
// @keyframes fadeIn { from { opacity:0; transform: translateY(-4px);} to { opacity:1; transform: translateY(0);} }