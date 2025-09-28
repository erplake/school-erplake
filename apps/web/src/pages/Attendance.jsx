import React from 'react';
import dayjs from 'dayjs';

function buildDays(){
  const start = dayjs().startOf('month');
  const days = [];
  for (let i=0;i<start.daysInMonth();i++){
    const d = start.add(i,'day');
    days.push({ key: d.format('YYYY-MM-DD'), day: d.date(), weekday: d.format('dd'), status: Math.random()>0.1 ? 'P' : 'A'});
  }
  return days;
}

const calendar = buildDays();

export function Attendance(){
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Attendance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Sample month view (demo data)</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {calendar.map(d => (
          <div key={d.key} className="aspect-square flex flex-col items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800">
            <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{d.weekday}</span>
            <span className="text-sm font-medium">{d.day}</span>
            <span className={d.status==='P' ? 'text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold' : 'text-red-600 dark:text-red-400 text-[10px] font-semibold'}>{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Attendance;
