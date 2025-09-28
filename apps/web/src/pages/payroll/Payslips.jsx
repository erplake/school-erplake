import React from 'react';
export default function Payslips() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Payslips</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Employee</th>
              <th className="px-3 py-2 text-left">Month</th>
              <th className="px-3 py-2 text-left">Net</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map(i => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">Employee {i}</td>
                <td className="px-3 py-1.5">Aug 2025</td>
                <td className="px-3 py-1.5">$1000</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
