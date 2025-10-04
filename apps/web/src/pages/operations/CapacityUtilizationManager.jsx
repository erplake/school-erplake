import React, { useState, useMemo } from 'react';
import { exportObjectsAsCSV } from '../../utils/csv';

const pct = (num, den) => (den === 0 ? 0 : Math.round((num / den) * 100));
function StatusBadge({ status }) {
  const map = { OK: 'bg-emerald-50 text-emerald-700 border-emerald-200', Overloaded: 'bg-red-50 text-red-700 border-red-200', Underutilized: 'bg-amber-50 text-amber-700 border-amber-200' };
  return <span className={`px-2 py-1 text-xs rounded-full border ${map[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>{status}</span>;
}
const SUBJECTS = ['Mathematics','Science','English','Computer Science','Hindi','Social Studies','Art','Physical Education'];
const WINGS = ['Junior','Middle','Senior'];
const seedTeachers = [
  { id: 1, name: 'A. Sharma', subject: 'Mathematics', wing: 'Senior', maxLoad: 30, assigned: 28 },
  { id: 2, name: 'B. Singh', subject: 'Science', wing: 'Senior', maxLoad: 30, assigned: 33 },
  { id: 3, name: 'C. Verma', subject: 'English', wing: 'Middle', maxLoad: 26, assigned: 18 },
  { id: 4, name: 'D. Khan', subject: 'Computer Science', wing: 'Senior', maxLoad: 24, assigned: 24 },
  { id: 5, name: 'E. Iyer', subject: 'Hindi', wing: 'Middle', maxLoad: 26, assigned: 25 },
  { id: 6, name: 'F. Patel', subject: 'Social Studies', wing: 'Junior', maxLoad: 24, assigned: 17 },
  { id: 7, name: 'G. Bose', subject: 'Mathematics', wing: 'Middle', maxLoad: 28, assigned: 29 },
  { id: 8, name: 'H. Rao', subject: 'Science', wing: 'Junior', maxLoad: 24, assigned: 22 },
  { id: 9, name: 'I. Gupta', subject: 'English', wing: 'Senior', maxLoad: 30, assigned: 31 },
  { id: 10, name: 'J. Nair', subject: 'Art', wing: 'Junior', maxLoad: 20, assigned: 12 },
  { id: 11, name: 'K. Das', subject: 'Physical Education', wing: 'Senior', maxLoad: 26, assigned: 20 },
  { id: 12, name: 'L. Mehta', subject: 'Mathematics', wing: 'Junior', maxLoad: 24, assigned: 24 },
];
const seedStaff = [
  { id: 101, name: 'M. Roy', role: 'Lab Assistant', wing: 'Senior', hours: 36, contracted: 40, shift: 'Day' },
  { id: 102, name: 'N. Thomas', role: 'Security', wing: 'Campus', hours: 44, contracted: 48, shift: 'Night' },
  { id: 103, name: 'O. Banerjee', role: 'Admin', wing: 'Office', hours: 32, contracted: 40, shift: 'Day' },
  { id: 104, name: 'P. Yadav', role: 'Housekeeping', wing: 'Campus', hours: 40, contracted: 40, shift: 'Day' },
  { id: 105, name: 'Q. Pillai', role: 'Transport', wing: 'Campus', hours: 28, contracted: 36, shift: 'Split' },
  { id: 106, name: 'R. Kapoor', role: 'Infirmary', wing: 'Junior', hours: 34, contracted: 40, shift: 'Day' },
];

export default function CapacityUtilizationManager(){
  const [teachers,setTeachers] = useState(seedTeachers);
  const [staff,setStaff] = useState(seedStaff);
  const [classes,setClasses] = useState(30);
  const [periodsPerClass,setPeriodsPerClass] = useState(15);
  const [stdPeriodsPerFTE,setStdPeriodsPerFTE] = useState(28);
  const [utilTarget,setUtilTarget] = useState(80);
  const [q,setQ] = useState('');
  const [wing,setWing] = useState('All');
  const [subject,setSubject] = useState('All');

  const requiredPeriods = useMemo(()=> classes * periodsPerClass, [classes,periodsPerClass]);
  const totalAssigned = useMemo(()=> teachers.reduce((s,t)=>s+t.assigned,0),[teachers]);
  const coveragePct = useMemo(()=> pct(totalAssigned, requiredPeriods),[totalAssigned, requiredPeriods]);
  const uncovered = Math.max(0, requiredPeriods - totalAssigned);
  const avgUtil = useMemo(()=>{
    if(!teachers.length) return 0; return Math.round( teachers.reduce((s,t)=> s + pct(t.assigned, t.maxLoad),0) / teachers.length );
  },[teachers]);
  const overloadedCount = useMemo(()=> teachers.filter(t=> t.assigned > t.maxLoad || pct(t.assigned, t.maxLoad) > 100).length, [teachers]);
  const suggestedFTEHire = Math.max(0, Math.ceil(uncovered / stdPeriodsPerFTE));
  const filteredTeachers = useMemo(()=> teachers.filter(t=> (q==='' || t.name.toLowerCase().includes(q.toLowerCase())) && (wing==='All'||t.wing===wing) && (subject==='All'||t.subject===subject) ), [teachers,q,wing,subject]);
  function teacherStatus(t){ const p = pct(t.assigned,t.maxLoad); if(p > 105) return 'Overloaded'; if(p < 60) return 'Underutilized'; return 'OK'; }
  function addTeacher(payload){ const id = Math.max(0,...teachers.map(t=>t.id))+1; setTeachers(ts=>[...ts, { id, name:payload.name||'New Teacher', subject:payload.subject||SUBJECTS[0], wing:payload.wing||WINGS[0], maxLoad:payload.maxLoad||24, assigned:payload.assigned||0 }]); }
  function updateTeacherLoad(id, newAssigned){ setTeachers(ts=> ts.map(t=> t.id===id ? { ...t, assigned:newAssigned } : t)); }
  function exportTeachersCSV(){ const rows = teachers.map(t=> ({id:t.id,name:t.name,subject:t.subject,wing:t.wing,maxLoad:t.maxLoad,assigned:t.assigned,util:pct(t.assigned,t.maxLoad)})); if(!rows.length) return; exportObjectsAsCSV(rows,'teachers.csv',{ bom:true }); }
  function exportStaffCSV(){ const rows = staff.map(s=> ({id:s.id,name:s.name,role:s.role,wing:s.wing,hours:s.hours,contracted:s.contracted,shift:s.shift,util:pct(s.hours,s.contracted)})); if(!rows.length) return; exportObjectsAsCSV(rows,'staff.csv',{ bom:true }); }

  const STAFF_TYPES=['Lab Assistant','Security','Admin','Transport','Infirmary','Housekeeping'];
  const requiredByType = { 'Lab Assistant':3, Security:6, Admin:4, Transport:5, Infirmary:2, Housekeeping:8 };
  const scheduledByType = STAFF_TYPES.reduce((acc,type)=>{ acc[type] = staff.filter(s=>s.role===type).length; return acc; },{});
  const staffGaps = STAFF_TYPES.map(type=> ({ type, required: requiredByType[type]||0, scheduled: scheduledByType[type]||0, gap: Math.max(0,(requiredByType[type]||0)-(scheduledByType[type]||0)) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Capacity & Utilization Manager</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportTeachersCSV} className="h-9 px-3 rounded-md bg-primary text-white text-sm">Export Teachers</button>
          <button onClick={exportStaffCSV} className="h-9 px-3 rounded-md bg-primary text-white text-sm">Export Staff</button>
        </div>
      </div>
      <div className="grid md:grid-cols-5 gap-3">
        <input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
        <select value={wing} onChange={e=>setWing(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2 text-sm"><option>All</option>{WINGS.map(w=> <option key={w}>{w}</option>)}</select>
        <select value={subject} onChange={e=>setSubject(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2 text-sm"><option>All</option>{SUBJECTS.map(s=> <option key={s}>{s}</option>)}</select>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex flex-col flex-1">Classes <input type="number" value={classes} onChange={e=>setClasses(+e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm" /></label>
          <label className="flex flex-col flex-1">Periods/Class <input type="number" value={periodsPerClass} onChange={e=>setPeriodsPerClass(+e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm" /></label>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex flex-col flex-1">Std/FTE <input type="number" value={stdPeriodsPerFTE} onChange={e=>setStdPeriodsPerFTE(+e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm" /></label>
          <label className="flex flex-col flex-1">Target % <input type="number" value={utilTarget} onChange={e=>setUtilTarget(+e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm" /></label>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 text-sm">
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Required Periods</div><div className="text-lg font-semibold">{requiredPeriods}</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Coverage</div><div className="text-lg font-semibold">{coveragePct}%</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Avg Utilization</div><div className="text-lg font-semibold">{avgUtil}%</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Suggested FTE Hire</div><div className="text-lg font-semibold">{suggestedFTEHire}</div></div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Teachers</h2>
        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-2 font-medium">Name</th><th className="p-2 font-medium">Subject</th><th className="p-2 font-medium">Wing</th><th className="p-2 font-medium">Max Load</th><th className="p-2 font-medium">Assigned</th><th className="p-2 font-medium">Util%</th><th className="p-2 font-medium">Status</th><th className="p-2 font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(t=>{
                const util = pct(t.assigned,t.maxLoad);
                return <tr key={t.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{t.name}</td>
                  <td className="p-2">{t.subject}</td>
                  <td className="p-2">{t.wing}</td>
                  <td className="p-2">{t.maxLoad}</td>
                  <td className="p-2">{t.assigned}</td>
                  <td className="p-2">{util}%</td>
                  <td className="p-2"><StatusBadge status={teacherStatus(t)} /></td>
                  <td className="p-2"><input type="number" value={t.assigned} onChange={e=>updateTeacherLoad(t.id, +e.target.value)} className="h-8 w-20 rounded border border-slate-300 px-2 text-sm" /></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Support Staff Summary</h2>
        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="p-2 text-left">Type</th><th className="p-2 text-left">Required</th><th className="p-2 text-left">Scheduled</th><th className="p-2 text-left">Gap</th></tr></thead>
            <tbody>
              {staffGaps.map(g=> <tr key={g.type} className="border-t"><td className="p-2">{g.type}</td><td className="p-2">{g.required}</td><td className="p-2">{g.scheduled}</td><td className={`p-2 ${g.gap>0?'text-rose-600 font-semibold':''}`}>{g.gap}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
