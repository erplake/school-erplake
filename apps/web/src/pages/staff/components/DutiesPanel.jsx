import React from 'react';
import { Card } from './primitives';

export function DutiesPanel({ duties, staffIndex }){
  return (
    <Card title="Recent Duties" subtitle="Latest assigned">
      <div className="space-y-2 max-h-56 overflow-auto pr-1">
        {duties.length===0 && <p className="text-xs text-slate-400">No duties yet.</p>}
        {duties.map(d=>{
          const s = staffIndex.get(d.staff_id);
            return (
              <div key={d.id} className="rounded-lg border border-slate-200 p-2 text-xs flex flex-col gap-1 bg-white/50">
                <div className="flex justify-between"><span className="font-medium text-slate-700 line-clamp-1">{d.title}</span><span className="text-slate-400">{d.duty_date}</span></div>
                <div className="text-slate-500 flex justify-between"><span>{s? s.name : 'Staff #'+d.staff_id}</span>{d.notes && <span className="truncate max-w-[120px]" title={d.notes}>{d.notes}</span>}</div>
              </div>
            );
        })}
      </div>
    </Card>
  );
}
