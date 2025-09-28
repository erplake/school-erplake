import React from 'react';
export default function LeaveRequests() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Leave Requests</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Dates</th>
              <th className="px-3 py-2 text-left">Reason</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1,2].map(i => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">Student {i}</td>
                <td className="px-3 py-1.5">1-2 Aug</td>
                <td className="px-3 py-1.5">Medical</td>
                <td className="px-3 py-1.5"><span className="inline-block bg-amber-100 text-amber-700 rounded px-2 py-0.5 text-xs">Pending</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
