import React from 'react';
import clsx from 'clsx';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

function Th({ children, className }){ return <th className={clsx('px-4 py-2 text-left text-xs font-medium', className)}>{children}</th>; }
function Td({ children, className }){ return <td className={clsx('px-4 py-3 align-middle', className)}>{children}</td>; }

function StatusPill({ status }){
  return (
    <span className={clsx(
      'px-2 py-1 rounded-full text-xs font-medium border',
      status==='Pending' && 'bg-amber-50 text-amber-700 border-amber-200',
      status==='Approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status==='Rejected' && 'bg-rose-50 text-rose-700 border-rose-200'
    )}>{status}</span>
  );
}

export function LeaveRequestsPanel({ requests = [], onAction }){
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold">Leave Requests</h2>
        <span className="text-xs text-slate-500">Approve or reject pending requests</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Request ID</Th><Th>Name</Th><Th>Role</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th className="text-center">Days</Th><Th>Reason</Th><Th>Status</Th><Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {requests.length ? requests.map(r => (
              <tr key={r.id || Math.random()} className="hover:bg-slate-50">
                <Td>{r.id || '—'}</Td>
                <Td>{r.name || '—'}</Td>
                <Td>{r.role || '—'}</Td>
                <Td>{r.type || '—'}</Td>
                <Td>{r.from || '—'}</Td>
                <Td>{r.to || '—'}</Td>
                <Td className="text-center">{r.days ?? '—'}</Td>
                <Td className="max-w-[200px] truncate" title={r.reason || ''}>{r.reason || '—'}</Td>
                <Td><StatusPill status={r.status || 'Pending'} /></Td>
                <Td>{r.status==='Pending' ? (
                  <div className="flex gap-2">
                    <button onClick={()=>onAction && onAction(r.id,'approve')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700"><ThumbsUp size={14}/>Approve</button>
                    <button onClick={()=>onAction && onAction(r.id,'reject')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-rose-600 text-white hover:bg-rose-700"><ThumbsDown size={14}/>Reject</button>
                  </div>
                ) : <span className="text-slate-400 text-xs">—</span>}</Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">No leave requests.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
