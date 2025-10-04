import React from 'react';
import { Card } from './primitives';

export function SubstitutionsPanel({ subs, staffIndex }){
  return (
    <Card title="Recent Substitutions" subtitle="Latest planned">
      <div className="space-y-2 max-h-56 overflow-auto pr-1">
        {subs.length===0 && <p className="text-xs text-slate-400">None planned.</p>}
        {subs.map(r=> {
          const absent = staffIndex.get(r.absent_staff_id);
          const sub = staffIndex.get(r.substitute_staff_id);
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 p-2 text-xs flex flex-col gap-1 bg-white/50">
              <div className="flex justify-between"><span className="font-medium text-slate-700">{r.date}</span><span className="text-slate-400">{r.periods}</span></div>
              <div className="text-slate-500 flex flex-col gap-0.5">
                <span>Absent: {absent? absent.name : '#'+r.absent_staff_id}</span>
                <span>Sub: {sub? sub.name : '#'+r.substitute_staff_id}</span>
                {r.notes && <span className="truncate" title={r.notes}>{r.notes}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}