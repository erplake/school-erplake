import React from 'react';
export default function EventCreate() {
  return (
    <div className="p-4 space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Create Event</h1>
      <form className="space-y-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium">Title</label>
          <input className="w-full border rounded px-2 py-1.5" placeholder="Sports Day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Start Date</label>
            <input type="date" className="w-full border rounded px-2 py-1.5" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">End Date</label>
            <input type="date" className="w-full border rounded px-2 py-1.5" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Description</label>
          <textarea rows={4} className="w-full border rounded px-2 py-1.5" placeholder="Event details..." />
        </div>
        <button type="button" className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium">Save</button>
      </form>
    </div>
  );
}
