import React from 'react';
import { Card } from './primitives';

export function GradeCoverageCard({ gradeCounts }) {
  return (
    <Card title="Teachers by Grade" subtitle="Coverage snapshot">
      <div className="max-h-56 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500"><th className="px-3 py-1 text-left text-xs font-medium">Grade</th><th className="px-3 py-1 text-right text-xs font-medium">Teachers</th></tr>
          </thead>
          <tbody>
            {gradeCounts.length===0 && <tr><td className="px-3 py-3 text-slate-500" colSpan={2}>No teacher-grade mapping yet.</td></tr>}
            {gradeCounts.map(([g,c]) => (
              <tr key={g} className="border-t border-slate-100">
                <td className="px-3 py-2">{g}</td>
                <td className="px-3 py-2 text-right font-medium">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
