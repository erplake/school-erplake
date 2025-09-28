import React from 'react';
import { AcademicCapIcon, UserGroupIcon, CurrencyRupeeIcon, ClockIcon, BellAlertIcon, ChartBarIcon, BanknotesIcon, UsersIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/dashboard/StatCard';
import ActivityList from '../components/dashboard/ActivityList';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import QuickActions from '../components/dashboard/QuickActions';

const stats = [
  { icon: UsersIcon, label: 'Total Students', value: '1,247', delta: '+12 this month', positive:true },
  { icon: AcademicCapIcon, label: 'Active Teachers', value: '89', delta: '+3 new hires', positive:true },
  { icon: BanknotesIcon, label: 'Fee Collection', value: '₹24.8L', delta: '+18% vs last month', positive:true },
  { icon: ChartBarIcon, label: 'Attendance Rate', value: '94.2%', delta: '+2.1% this week', positive:true }
];

const activities = [
  { id:1, type:'admission', title:'New admission: Rahul Sharma', meta:'Class 6-A', ts: Date.now() - 2*60*60*1000 },
  { id:2, type:'payment', title:'Fee payment received: Class 10-A', meta:'Invoice #1043 · ₹18,000', ts: Date.now() - 4*60*60*1000 },
  { id:3, type:'meeting', title:'Parent-Teacher meeting scheduled', meta:'Grade 8 · 5 Oct 10:00 AM', ts: Date.now() - 6*60*60*1000 },
  { id:4, type:'exam', title:'Monthly exam results published', meta:'Classes 9–10', ts: Date.now() - 24*60*60*1000 }
];

const alerts = [
  { id:1, title:'15 students absent today', count:15, tone:'warning' },
  { id:2, title:'Fee pending: Class 9-B', count:8, tone:'warning' },
  { id:3, title:'Library books overdue', count:23, tone:'info' }
];

const quickActions = [
  { to:'/students', label:'Manage Students', icon: UsersIcon },
  { to:'/attendance', label:'Attendance', icon: ClockIcon },
  { to:'/billing', label:'Fee Management', icon: CurrencyRupeeIcon },
  { to:'/timetable', label:'Timetable', icon: CalendarDaysIcon }
];

export function Dashboard(){
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Welcome back, Principal Kumar</h1>
  <p className="text-sm text-muted">Here's what's happening at Sunshine Public School today</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wide text-body flex items-center gap-2"><ClockIcon className="w-4 h-4 opacity-60"/> Recent Activities</h2>
            </div>
            <ActivityList items={activities} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-body mb-4 flex items-center gap-2"><ChartBarIcon className="w-4 h-4 opacity-60"/> Quick Actions</h2>
            <QuickActions actions={quickActions} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-body mb-4 flex items-center gap-2"><BellAlertIcon className="w-4 h-4 opacity-60"/> Alerts</h2>
            <AlertsPanel alerts={alerts} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
