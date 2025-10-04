import React from 'react';
import clsx from 'clsx';
import { Mail, Phone } from 'lucide-react';
import { AttendanceBar } from './primitives';

function Th({ children, className }) { return <th className={clsx('px-4 py-2 text-left text-xs font-medium', className)}>{children}</th>; }
function Td({ children, className }) { return <td className={clsx('px-4 py-3 align-middle', className)}>{children}</td>; }

function StatusBadge({ staff }) {
  if(staff.status === 'Resigned') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">Resigned</span>;
  if(staff.onLeaveToday) return <span className="text-rose-600 text-xs font-medium">On Leave Today</span>;
  return <span className="text-emerald-600 text-xs font-medium">Active</span>;
}

function initials(name=''){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join(''); }

function colorByDept(d){ switch(d){ case 'Mathematics': return 'bg-indigo-600'; case 'Science': return 'bg-emerald-600'; case 'English': return 'bg-rose-600'; case 'Social Studies': return 'bg-amber-600'; case 'Computer Science': return 'bg-purple-600'; case 'Administration': return 'bg-slate-600'; case 'Sports': return 'bg-orange-600'; case 'Arts': return 'bg-pink-600'; default: return 'bg-blue-600'; } }

export function StaffTable({ rows = [], onSelect }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold">Staff Directory ({rows?.length || 0})</h2>
        <span className="text-xs text-slate-500">Click a row to open details</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Name</Th><Th>Role</Th><Th>Dept</Th><Th>Grade</Th><Th className="text-center">Attendance</Th><Th>Next Appraisal</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows?.length ? rows.map(s => (
              <tr key={s?.id || s?.staff_code || Math.random()} className="hover:bg-slate-50 cursor-pointer" onClick={()=> onSelect && s && onSelect(s)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className={clsx('h-9 w-9 rounded-full grid place-content-center text-white font-semibold text-xs', colorByDept(s?.department))}>{initials(s?.name || '')}</div>
                    <div>
                      <div className="font-medium leading-tight">{s?.name || '—'}</div>
                      <div className="text-[11px] text-slate-500 flex gap-3">
                        <span className="inline-flex items-center gap-1"><Mail size={11}/>{s?.email || '—'}</span>
                        <span className="inline-flex items-center gap-1"><Phone size={11}/>{s?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                </Td>
                <Td>{s?.role || '—'}</Td>
                <Td>{s?.department || '—'}</Td>
                <Td>{s?.role === 'Teacher' ? (s?.grade || <span className='text-slate-400'>—</span>) : <span className='text-slate-400'>—</span>}</Td>
                <Td className="text-center"><AttendanceBar value={s?.attendance30 ?? 0} /></Td>
                <Td>{s?.nextAppraisal || '—'}</Td>
                <Td><StatusBadge staff={s} /></Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No staff found matching current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
