import React from 'react';
export default function Library() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Library Catalog</h1>
      <div className="flex gap-2">
        <input placeholder="Search books" className="border rounded px-2 py-1 text-sm w-64" />
        <button className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground">Add Book</button>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Author</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map(i => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">Sample Book {i}</td>
                <td className="px-3 py-1.5">Author {i}</td>
                <td className="px-3 py-1.5"><span className="inline-block rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">Available</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
