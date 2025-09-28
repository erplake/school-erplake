import React from 'react';
export default function MarksEntry() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Marks Entry</h1>
      <p className="text-sm text-muted-foreground">Input and manage student marks.</p>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Student</th>
              <th className="px-3 py-2 text-left font-medium">Subject</th>
              <th className="px-3 py-2 text-left font-medium">Score</th>
              <th className="px-3 py-2 text-left font-medium">Grade</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map(r => (
              <tr key={r} className="border-t">
                <td className="px-3 py-1.5">Student {r}</td>
                <td className="px-3 py-1.5">Math</td>
                <td className="px-3 py-1.5">--</td>
                <td className="px-3 py-1.5">--</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
