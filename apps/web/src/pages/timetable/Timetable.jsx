import React from 'react';
export default function Timetable() {
  const days = ['Mon','Tue','Wed','Thu','Fri'];
  const periods = [1,2,3,4,5,6,7];
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Weekly Timetable</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Period</th>
              {days.map(d => <th key={d} className="px-3 py-2 text-left">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map(p => (
              <tr key={p} className="border-t">
                <td className="px-3 py-1.5 font-medium">{p}</td>
                {days.map(d => (
                  <td key={d} className="px-3 py-1.5">
                    <div className="h-10 rounded bg-muted/40" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
