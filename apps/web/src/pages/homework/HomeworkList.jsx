import React from 'react';
export default function HomeworkList() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Homework</h1>
      <div className="flex gap-2">
        <button className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">Assign</button>
        <button className="text-sm border rounded px-3 py-1">Filter</button>
      </div>
      <ul className="space-y-2 text-sm">
        {[1,2,3].map(i => (
          <li key={i} className="rounded border p-3">
            <div className="font-medium">Homework #{i}</div>
            <div className="text-xs text-muted-foreground">Due tomorrow - Class 5A</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
