import React from 'react';
export default function Transport() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Transport Routes</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3,4,5].map(r => (
          <div key={r} className="rounded-lg border p-4 space-y-1 text-sm">
            <div className="font-medium">Route {r}</div>
            <div className="text-muted-foreground text-xs">Stops: 10 | Bus: B{r}</div>
            <button className="text-xs text-primary hover:underline">View details</button>
          </div>
        ))}
      </div>
    </div>
  );
}
