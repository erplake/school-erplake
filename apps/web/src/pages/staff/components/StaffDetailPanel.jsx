import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Mail, Phone, Briefcase, CalendarDays, GraduationCap, UserX } from 'lucide-react';
import { Info } from './primitives';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PIE_COLORS = ['#2563eb','#22c55e','#f59e0b'];

function colorByDept(d){ switch(d){ case 'Mathematics': return 'bg-indigo-600'; case 'Science': return 'bg-emerald-600'; case 'English': return 'bg-rose-600'; case 'Social Studies': return 'bg-amber-600'; case 'Computer Science': return 'bg-purple-600'; case 'Administration': return 'bg-slate-600'; case 'Sports': return 'bg-orange-600'; case 'Arts': return 'bg-pink-600'; default: return 'bg-blue-600'; } }

function initials(name=''){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join(''); }

export function StaffDetailPanel({ staff, onClose, onOpenResign }) {
  return (
    <AnimatePresence>
      {staff && (
        <motion.aside initial={{x:400, opacity:0}} animate={{x:0, opacity:1}} exit={{x:400, opacity:0}} transition={{type:'spring', stiffness:260, damping:24}} className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={clsx('h-9 w-9 rounded-full grid place-content-center text-white font-semibold', colorByDept(staff?.department))}>{initials(staff?.name || '')}</div>
              <div>
                <div className="font-semibold leading-tight">{staff?.name || '—'}</div>
                <div className="text-xs text-slate-500">{staff?.role || '—'} · {staff?.department || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {staff?.status!=='Resigned' && <button onClick={()=>onOpenResign && onOpenResign(staff)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs"><UserX size={14}/>Resign</button>}
              <button onClick={onClose} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50 text-xs">Close</button>
            </div>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-4rem)] text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Email" value={staff?.email || '—'} icon={<Mail size={14}/>}/>
              <Info label="Phone" value={staff?.phone || '—'} icon={<Phone size={14}/>}/>
              <Info label="Reports To" value={staff?.reportsTo || '—'} icon={<Briefcase size={14}/>}/>
              <Info label="DOJ" value={staff?.doj || '—'} icon={<CalendarDays size={14}/>}/>
              {staff?.role==='Teacher' && <Info label="Grade" value={staff?.grade || '—'} icon={<GraduationCap size={14}/>}/>}
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-medium mb-1">Leave Ledger</div>
              <div className="grid grid-cols-3 text-center">
                <div><div className="text-xs text-slate-500">Taken (YTD)</div><div className="font-semibold">{staff?.leavesTakenYTD ?? '—'}</div></div>
                <div><div className="text-xs text-slate-500">Balance</div><div className="font-semibold">{staff?.leaveBalance ?? '—'}</div></div>
                <div><div className="text-xs text-slate-500">Next Appraisal</div><div className="font-semibold">{staff?.nextAppraisal || '—'}</div></div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-medium mb-2">Workload Split (Demo)</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={[{name:'Teaching', value:60},{name:'Clubs', value:15},{name:'Duties', value:25}]} innerRadius={30} outerRadius={60}> 
                      {PIE_COLORS.map((c,i)=><Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={!staff?.email} className={clsx('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs', staff?.email ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}><Mail size={16}/>Email</button>
              <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs"><CalendarDays size={16}/>Schedule 1:1</button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
