import React, { useState, useMemo } from 'react';

const SHIFT_LABEL = { M:'Morning', E:'Evening', N:'Night', OFF:'Off' };
const SHIFT_COLORS = { M:'bg-emerald-50 text-emerald-700 border-emerald-200', E:'bg-sky-50 text-sky-700 border-sky-200', N:'bg-indigo-50 text-indigo-700 border-indigo-200', OFF:'bg-zinc-50 text-zinc-600 border-zinc-200' };
const seedStaff = [
  { id:'S001', name:'Amit Kumar', role:'Security', phone:'+91 90000 00001', basePay:18000, shiftAllowance:50, overtimeRate:120, nightAllowance:80, joinDate:'2023-05-10', policeVerifiedUntil:'2026-07-31', uniformIssued:true, active:true },
  { id:'S002', name:'Priya Singh', role:'Helper', phone:'+91 90000 00002', basePay:15000, shiftAllowance:40, overtimeRate:100, nightAllowance:70, joinDate:'2022-11-02', policeVerifiedUntil:'2025-12-31', uniformIssued:true, active:true },
  { id:'S003', name:'Rakesh Sharma', role:'Security', phone:'+91 90000 00003', basePay:18500, shiftAllowance:50, overtimeRate:120, nightAllowance:80, joinDate:'2021-09-19', policeVerifiedUntil:'2026-05-30', uniformIssued:false, active:true },
  { id:'S004', name:'Sunita Devi', role:'Housekeeping', phone:'+91 90000 00004', basePay:14000, shiftAllowance:30, overtimeRate:90, nightAllowance:60, joinDate:'2024-03-01', policeVerifiedUntil:'2025-11-30', uniformIssued:true, active:true },
  { id:'S005', name:'Ravi Verma', role:'Driver', phone:'+91 90000 00005', basePay:20000, shiftAllowance:60, overtimeRate:150, nightAllowance:0, joinDate:'2020-01-12', policeVerifiedUntil:'2026-10-31', uniformIssued:true, active:true },
];
const toISODate = d => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
function getWeek(start){ const s=new Date(start); const day=(s.getDay()+6)%7; s.setDate(s.getDate()-day); return new Array(7).fill(0).map((_,i)=>{ const d=new Date(s); d.setDate(s.getDate()+i); return toISODate(d); }); }
function seedRoster(staff, focusDate){ const week = getWeek(new Date(focusDate)); const roster = {}; week.forEach(d=> roster[d] = Object.fromEntries(staff.map(s=> [s.id, ['M','E','N','OFF'][Math.floor(Math.random()*4)] ]))); return roster; }
function seedAttendance(staff, focusDate){ const week = getWeek(new Date(focusDate)); const att = {}; week.forEach(d=> att[d] = Object.fromEntries(staff.map(s=> [s.id, { in: s.role==='Security'? '06:05':'08:02', out:null, status:'Present' }] ))); return att; }
function buildPayroll(staff, roster, attendance, yyyymm){
  return staff.map(s=> { const days = Object.keys(roster).length; const overtimeHours = 0; const base = s.basePay; const shiftAllowance = days * s.shiftAllowance; const nightShiftCount = Object.values(roster).filter(r=> r[s.id]==='N').length; const nightPay = nightShiftCount * s.nightAllowance; const net = base + shiftAllowance + nightPay; return { staff:s.name, base, shiftAllowance, nightPay, overtime:overtimeHours* s.overtimeRate, net }; });
}
const Icon={ Guard:(p)=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7l8-4 8 4v5c0 5-3.5 9-8 9s-8-4-8-9V7z"/><path d="M12 12v5"/></svg>, Clock:(p)=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>, Rupee:(p)=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 7h10M7 11h10M7 15c4 0 6 2 8 4"/></svg>, Check:(p)=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 13l4 4L19 7"/></svg> };

export default function SecuritySupportStaffPage(){
  const [staff,setStaff] = useState(seedStaff);
  const [roleFilter,setRoleFilter] = useState('All');
  const [focusDate,setFocusDate] = useState(()=> toISODate(new Date()));
  const [tab,setTab] = useState('Roster');
  const [roster,setRoster] = useState(()=> seedRoster(staff, focusDate));
  const [attendance,setAttendance] = useState(()=> seedAttendance(staff, focusDate));
  const [payrollMonth,setPayrollMonth] = useState(()=> toISODate(new Date()).slice(0,7));
  const week = useMemo(()=> getWeek(new Date(focusDate)),[focusDate]);
  const filteredStaff = useMemo(()=> staff.filter(s=> (roleFilter==='All'?true: s.role===roleFilter) && s.active),[staff,roleFilter]);
  const todayKey = toISODate(new Date());
  const onDutyNow = useMemo(()=>{ const todayRoster = roster[todayKey]||{}; return staff.filter(s=> ['M','E','N'].includes(todayRoster[s.id])); },[roster,staff,todayKey]);
  const lateCount = useMemo(()=> { const todayAtt = attendance[todayKey]||{}; return Object.values(todayAtt).filter(a=> a.status==='Late').length; },[attendance,todayKey]);
  const openPosts = useMemo(()=> { const todayRoster = roster[todayKey]||{}; return staff.filter(s=> todayRoster[s.id]==='OFF').length; },[roster,staff,todayKey]);
  function changeShift(dKey,sid,code){ setRoster(r=> ({...r,[dKey]:{...r[dKey],[sid]:code}})); }
  function copyLastWeek(){ const prev = {}; Object.entries(roster).forEach(([d,map])=> prev[d]= { ...map }); setRoster(prev); }
  function autoAssign(){ setRoster(r=> { const next={...r}; Object.keys(next).forEach(d=> { staff.forEach(s=> { next[d][s.id] = ['M','E','N','OFF'][Math.floor(Math.random()*4)]; }); }); return next; }); }
  function markAttendance(dKey,sid,status){ setAttendance(a=> ({...a,[dKey]:{...(a[dKey]||{}), [sid]:{...(a[dKey]?.[sid]||{}), status}}})); }
  const payrollRows = useMemo(()=> buildPayroll(staff, roster, attendance, payrollMonth), [staff,roster,attendance,payrollMonth]);
  const totals = useMemo(()=> payrollRows.reduce((a,r)=> a+r.net,0),[payrollRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Security & Support Staff</h1>
        <div className="flex items-center gap-2 text-sm">
          <select value={tab} onChange={e=>setTab(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2"><option>Roster</option><option>Attendance</option><option>Payroll</option></select>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2"><option>All</option><option>Security</option><option>Housekeeping</option><option>Driver</option><option>Helper</option></select>
          <input type="date" value={focusDate} onChange={e=>setFocusDate(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">On Duty Now</div><div className="text-lg font-semibold">{onDutyNow.length}</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Late Today</div><div className="text-lg font-semibold">{lateCount}</div></div>
        <div className="p-4 border rounded-md bg-white"><div className="text-xs text-slate-500">Open Posts</div><div className="text-lg font-semibold">{openPosts}</div></div>
      </div>

      {tab==='Roster' && (
        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr><th className="p-2 text-left">Staff</th>{week.map(d=> <th key={d} className="p-2 text-left">{d.slice(5)}</th>)}</tr>
            </thead>
            <tbody>
              {filteredStaff.map(s=> <tr key={s.id} className="border-t">
                <td className="p-2 whitespace-nowrap font-medium">{s.name}</td>
                {week.map(d=> <td key={d} className="p-1">
                  <select value={roster[d]?.[s.id]} onChange={e=>changeShift(d,s.id,e.target.value)} className={`h-8 w-full rounded border text-[11px] px-1 ${SHIFT_COLORS[roster[d]?.[s.id]]}`}>{['M','E','N','OFF'].map(c=> <option key={c} value={c}>{c}</option>)}</select>
                </td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      )}

      {tab==='Attendance' && (
        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50"><tr><th className="p-2 text-left">Staff</th>{week.map(d=> <th key={d} className="p-2 text-left">{d.slice(5)}</th>)}</tr></thead>
            <tbody>
              {filteredStaff.map(s=> <tr key={s.id} className="border-t">
                <td className="p-2 font-medium">{s.name}</td>
                {week.map(d=> { const rec = attendance[d]?.[s.id]; return <td key={d} className="p-1">
                  <select value={rec?.status||'Present'} onChange={e=>markAttendance(d,s.id,e.target.value)} className="h-8 w-full rounded border px-1 text-[11px]">
                    <option>Present</option><option>Late</option><option>Absent</option><option>Leave</option>
                  </select>
                </td>; })}
              </tr>)}
            </tbody>
          </table>
        </div>
      )}

      {tab==='Payroll' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">Month: <input type="month" value={payrollMonth} onChange={e=>setPayrollMonth(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2" /></div>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">Staff</th><th className="p-2 text-left">Base</th><th className="p-2 text-left">Shift Allow</th><th className="p-2 text-left">Night</th><th className="p-2 text-left">Overtime</th><th className="p-2 text-left">Net</th></tr></thead>
              <tbody>
                {payrollRows.map((r,i)=> <tr key={i} className="border-t"><td className="p-2">{r.staff}</td><td className="p-2">₹{r.base}</td><td className="p-2">₹{r.shiftAllowance}</td><td className="p-2">₹{r.nightPay}</td><td className="p-2">₹{r.overtime}</td><td className="p-2 font-semibold">₹{r.net}</td></tr>)}
              </tbody>
              <tfoot><tr className="bg-slate-100 font-medium"><td className="p-2" colSpan={5}>Total</td><td className="p-2">₹{totals}</td></tr></tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
