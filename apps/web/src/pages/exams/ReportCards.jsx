import React from 'react';
export default function ReportCards() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Report Cards</h1>
      <p className="text-sm text-muted-foreground">Generate and review student performance reports.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-lg border p-4 text-sm space-y-2">
            <div className="font-medium">Class {i}</div>
            <div className="h-24 bg-muted/40 rounded" />
            <button className="text-xs text-primary hover:underline">Open reports</button>
          </div>
        ))}
      </div>
    </div>
  );
}
