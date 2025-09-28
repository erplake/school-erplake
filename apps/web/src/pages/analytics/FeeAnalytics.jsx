import React from 'react';
export default function FeeAnalytics() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Fee Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-lg border p-4 text-sm">
            <div className="font-medium">Card {i}</div>
            <div className="h-14 bg-muted/40 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
