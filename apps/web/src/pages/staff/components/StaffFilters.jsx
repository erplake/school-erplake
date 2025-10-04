import React from 'react';
import { Select } from './primitives';
import { Search, Filter } from 'lucide-react';

export function StaffFilters({
  search, setSearch,
  dept, setDept,
  role, setRole,
  minAttendance, setMinAttendance,
  showOnLeaveOnly, setShowOnLeaveOnly,
  includeResigned, setIncludeResigned,
  departments, roles
}) {
  return (
    <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Search name, email, phone, department, grade…"
          className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Select value={dept} onChange={setDept} options={departments} label="Department" />
        <Select value={role} onChange={setRole} options={roles} label="Role" />
        <label className="inline-flex items-center gap-2 text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white">
          <Filter size={14} className="text-slate-500" />
          <span>Min Attendance</span>
          <input type="number" min={0} max={100} value={minAttendance} onChange={e=>setMinAttendance(Number(e.target.value)||0)} className="w-16 px-1 py-0.5 rounded border border-slate-200 text-xs" />
        </label>
        <label className="inline-flex items-center gap-1 text-xs font-medium">
          <input type="checkbox" checked={showOnLeaveOnly} onChange={e=>setShowOnLeaveOnly(e.target.checked)} />
          <span>On‑leave only</span>
        </label>
        <label className="inline-flex items-center gap-1 text-xs font-medium">
          <input type="checkbox" checked={includeResigned} onChange={e=>setIncludeResigned(e.target.checked)} />
          <span>Include resigned</span>
        </label>
      </div>
    </div>
  );
}
