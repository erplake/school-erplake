import React from 'react';
import { Card } from './primitives';

export function ResignationsCard({ resignations, onReinstate }) {
  return (
    <Card title="Resignations" subtitle="Recently marked">
      {resignations.length===0 ? (
        <div className="text-sm text-slate-500">No resignations recorded.</div>
      ) : (
        <ul className="space-y-2">
          {resignations.map(s => (
            <li key={s.id} className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{s.name} <span className="text-xs text-slate-500">({s.role})</span></div>
                <div className="text-xs text-slate-500">Last day: {s.resignationDate||'—'} · {s.resignationReason||'—'}</div>
              </div>
              <button onClick={()=>onReinstate(s.id)} className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">Reinstate</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
