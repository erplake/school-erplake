import React from 'react';

export function Fees(){
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Fees Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Summary of fee heads and outstanding balances.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 min-h-[220px]">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Fee Heads</h3>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>Tuition</li>
            <li>Transport</li>
            <li>Lab</li>
          </ul>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 min-h-[220px]">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Upcoming Invoices</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming invoices this week.</p>
        </div>
      </div>
    </div>
  );
}
export default Fees;
