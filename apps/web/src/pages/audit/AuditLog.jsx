import React from 'react';
export default function AuditLog() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Audit Log</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Actor</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Resource</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map(i => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">Now</td>
                <td className="px-3 py-1.5">admin</td>
                <td className="px-3 py-1.5">UPDATE</td>
                <td className="px-3 py-1.5">student:{i}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
