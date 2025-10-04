import React from 'react';
import { useRBAC } from '../context/RBACContext';

export function Fees(){
  const { hasCapability } = useRBAC();
  const canView = hasCapability('finance.fees.view');
  const canManage = hasCapability('finance.fees.manage');
  if(!canView){
    return <div className="space-y-4">
      <h2 className="text-lg font-semibold">Fees</h2>
      <div className="text-sm bg-white border rounded-md p-6 text-slate-600">You do not have permission to view fee data.</div>
    </div>;
  }
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-3">Fees Overview {canManage && <span className="text-xs rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">manage</span>}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Summary of fee heads and outstanding balances.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 min-h-[220px]">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Fee Heads</h3>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>Tuition {canManage && <button className="ml-2 text-xs text-primary hover:underline">edit</button>}</li>
            <li>Transport {canManage && <button className="ml-2 text-xs text-primary hover:underline">edit</button>}</li>
            <li>Lab {canManage && <button className="ml-2 text-xs text-primary hover:underline">edit</button>}</li>
          </ul>
          {canManage && <button className="mt-3 text-xs text-primary hover:underline">+ add fee head</button>}
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 min-h-[220px]">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Upcoming Invoices</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming invoices this week.</p>
          {canManage && <button className="mt-3 text-xs text-primary hover:underline">Generate invoice batch</button>}
        </div>
      </div>
    </div>
  );
}
export default Fees;
