import React from 'react';
export default function ChatModeration() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Chat Moderation</h1>
      <div className="rounded border p-4 text-sm text-muted-foreground">Moderator view of flagged messages & escalation actions.</div>
      <div className="overflow-x-auto border rounded-lg mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Parent</th>
              <th className="px-3 py-2 text-left">Excerpt</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map(i => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">Now</td>
                <td className="px-3 py-1.5">Parent {i}</td>
                <td className="px-3 py-1.5">Message snippet...</td>
                <td className="px-3 py-1.5"><span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded">Pending</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
