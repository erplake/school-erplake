import React from 'react';
export default function StaffDirectory() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Staff Directory</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Department</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map(i => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">Staff Member {i}</td>
                <td className="px-3 py-1.5"><span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs">Teacher</span></td>
                <td className="px-3 py-1.5">Science</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
