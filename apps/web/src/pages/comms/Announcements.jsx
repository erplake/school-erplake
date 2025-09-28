import React from 'react';
export default function Announcements() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Announcements</h1>
      <div className="space-y-2">
        {[1,2].map(i => (
          <div key={i} className="rounded border p-3 text-sm">
            <div className="font-medium">Announcement {i}</div>
            <div className="text-xs text-muted-foreground">Body text placeholder for announcement content.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
