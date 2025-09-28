import React from 'react';
import clsx from 'clsx';

export function TableShell({ columns=[], data=[], className }){
  return (
    <div className={clsx('w-full overflow-x-auto rounded-lg border bg-card', className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map(c => <th key={c.key||c.accessor} className="text-left px-3 py-2 font-medium text-muted-foreground">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground text-sm">No data</td></tr>
          )}
          {data.map((row,i) => (
            <tr key={row.id || i} className="border-t hover:bg-accent/50">
              {columns.map(col => (
                <td key={col.key||col.accessor} className="px-3 py-2 align-top">
                  {col.cell ? col.cell(row[col.accessor], row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableShell;
