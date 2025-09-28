import React from 'react';
export default function SocialAnalytics() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Social Analytics</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3].map(i => (
          <div key={i} className="rounded border p-4 text-sm">
            <div className="font-medium">Metric {i}</div>
            <div className="h-16 bg-muted/40 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
