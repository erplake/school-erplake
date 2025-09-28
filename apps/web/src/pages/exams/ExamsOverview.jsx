import React from 'react';
export default function ExamsOverview() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Exams Overview</h1>
      <p className="text-sm text-muted-foreground">Summary of upcoming and ongoing examinations.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {["Upcoming", "Ongoing", "Completed"].map(s => (
          <div key={s} className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="font-medium">{s} Exams</h2>
            <p className="mt-2 text-xs text-muted-foreground">Placeholder metric</p>
          </div>
        ))}
      </div>
    </div>
  );
}
