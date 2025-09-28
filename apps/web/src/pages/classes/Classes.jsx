import React from 'react';
export default function Classes() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Classes</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="rounded border p-4 text-sm space-y-1">
            <div className="font-medium">Class {i}A</div>
            <div className="text-xs text-muted-foreground">Students: 30</div>
            <button className="text-xs text-primary hover:underline">Open</button>
          </div>
        ))}
      </div>
    </div>
  );
}
