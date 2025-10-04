import React from 'react';
import { KPI } from './primitives';
import { Users, GraduationCap, Briefcase, CalendarDays, ClipboardList, TrendingUp } from 'lucide-react';

export function MetricsBar({ metrics }) {
  // metrics: { total, teachers, nonTeaching, onLeaveToday, pending, avgAttendance }
  if(!metrics) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPI icon={<Users className="text-indigo-600"/>} label="Active Staff" value={metrics.total} />
      <KPI icon={<GraduationCap className="text-emerald-600"/>} label="Teachers" value={metrics.teachers} />
      <KPI icon={<Briefcase className="text-purple-600"/>} label="Non‑Teaching" value={metrics.nonTeaching} />
      <KPI icon={<CalendarDays className="text-rose-600"/>} label="On Leave Today" value={metrics.onLeaveToday} />
      <KPI icon={<ClipboardList className="text-amber-600"/>} label="Pending Leave" value={metrics.pending} />
      <KPI icon={<TrendingUp className="text-blue-600"/>} label="Avg Attendance (30d)" value={metrics.avgAttendance + '%'} />
    </div>
  );
}
