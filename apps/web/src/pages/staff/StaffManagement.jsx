import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  GraduationCap,
  Briefcase,
  CalendarDays,
  Search,
  Filter,
  Download,
  Plus,
  Megaphone,
  ThumbsUp,
  ThumbsDown,
  Mail,
  Phone,
  Cake,
  TrendingUp,
  ClipboardList,
  UserCog,
  UserX,
} from "lucide-react";
import {
  LineChart,
  Line,  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Utilities
const fmt = (n) => new Intl.NumberFormat().format(n);
const parseISO = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const daysUntil = (dateStr) => { const d = parseISO(dateStr); const ms = d.setHours(0,0,0,0) - new Date().setHours(0,0,0,0); return Math.ceil(ms / 86400000); };
const classNames = (...c) => c.filter(Boolean).join(" ");

// Mock Data (replace with API later)
const DEPARTMENTS = ["All","Mathematics","Science","English","Social Studies","Computer Science","Administration","Sports","Arts"];
const ROLES = ["All","Teacher","Principal","Vice Principal","Admin","Accountant","Librarian","Counselor","Support Staff"];
const STAFF_INITIAL = [
  { id: "T001", name: "Asha Verma", role: "Teacher", department: "Mathematics", grade: "Grade 9", email: "asha.verma@school.edu", phone: "+91 98xxxxxx10", doj: "2019-07-10", attendance30: 96, leavesTakenYTD: 4, leaveBalance: 12, birthday: "1990-09-30", onLeaveToday: false, lastAppraisal: "2025-03-10", nextAppraisal: "2026-03-10", reportsTo: "Meera K. (VP Academics)", status: "Active" },
  { id: "T002", name: "Rohit Singh", role: "Teacher", department: "Science", grade: "Grade 10", email: "rohit.singh@school.edu", phone: "+91 98xxxxxx22", doj: "2018-06-20", attendance30: 92, leavesTakenYTD: 6, leaveBalance: 10, birthday: "1987-10-05", onLeaveToday: true, lastAppraisal: "2025-01-15", nextAppraisal: "2026-01-15", reportsTo: "Meera K. (VP Academics)", status: "Active" },
  { id: "NT003", name: "Priya Sharma", role: "Accountant", department: "Administration", email: "priya.sharma@school.edu", phone: "+91 98xxxxxx33", doj: "2020-02-11", attendance30: 97, leavesTakenYTD: 2, leaveBalance: 15, birthday: "1992-10-12", onLeaveToday: false, lastAppraisal: "2025-02-25", nextAppraisal: "2026-02-25", reportsTo: "Arun N. (Principal)", status: "Active" },
  { id: "NT004", name: "Saira Khan", role: "Librarian", department: "Administration", email: "saira.khan@school.edu", phone: "+91 98xxxxxx44", doj: "2021-08-02", attendance30: 94, leavesTakenYTD: 5, leaveBalance: 10, birthday: "1994-10-01", onLeaveToday: false, lastAppraisal: "2025-04-01", nextAppraisal: "2026-04-01", reportsTo: "Arun N. (Principal)", status: "Active" },
  { id: "T005", name: "Neha Gupta", role: "Teacher", department: "English", grade: "Grade 8", email: "neha.gupta@school.edu", phone: "+91 98xxxxxx55", doj: "2017-05-19", attendance30: 90, leavesTakenYTD: 8, leaveBalance: 8, birthday: "1989-09-29", onLeaveToday: false, lastAppraisal: "2025-03-05", nextAppraisal: "2026-03-05", reportsTo: "Meera K. (VP Academics)", status: "Active" },
  { id: "NT006", name: "Vikram Rao", role: "Support Staff", department: "Administration", email: "vikram.rao@school.edu", phone: "+91 98xxxxxx66", doj: "2022-01-10", attendance30: 93, leavesTakenYTD: 3, leaveBalance: 14, birthday: "1995-10-15", onLeaveToday: true, lastAppraisal: "2025-06-10", nextAppraisal: "2026-06-10", reportsTo: "Facilities Lead", status: "Active" },
];
const LEAVE_REQUESTS_INITIAL = [
  { id: "LR-1001", staffId: "T002", name: "Rohit Singh", role: "Teacher", department: "Science", type: "Sick Leave", from: "2025-09-29", to: "2025-09-30", days: 2, reason: "Fever", status: "Pending" },
  { id: "LR-1002", staffId: "NT006", name: "Vikram Rao", role: "Support Staff", department: "Administration", type: "Casual Leave", from: "2025-10-03", to: "2025-10-04", days: 2, reason: "Travel", status: "Pending" },
];
const ATTENDANCE_TREND = Array.from({ length: 12 }).map((_, i) => ({ wk: `W${i + 1}`, percent: 88 + Math.round(Math.sin(i / 2) * 6 + (i % 3)) }));
const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function StaffManagementPage(){
  const [staff, setStaff] = useState(STAFF_INITIAL);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [role, setRole] = useState("All");
  const [showOnLeaveOnly, setShowOnLeaveOnly] = useState(false);
  const [includeResigned, setIncludeResigned] = useState(false);
  const [minAttendance, setMinAttendance] = useState(0);
  const [requests, setRequests] = useState(LEAVE_REQUESTS_INITIAL);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", role: "Teacher", department: "Mathematics", grade: "Grade 1", email: "", phone: "", doj: new Date().toISOString().slice(0,10), reportsTo: "" });
  const [showResign, setShowResign] = useState(false);
  const [resign, setResign] = useState({ date: new Date().toISOString().slice(0,10), reason: "" });

  const filtered = useMemo(()=> staff.filter(s => {
    if (!includeResigned && s.status === 'Resigned') return false;
    const text = `${s.name} ${s.email} ${s.phone} ${s.department} ${s.role} ${s.grade||''}`.toLowerCase();
    const matchesText = text.includes(search.toLowerCase());
    const matchesDept = dept === 'All' || s.department === dept;
    const matchesRole = role === 'All' || s.role === role;
    const matchesLeave = !showOnLeaveOnly || s.onLeaveToday;
    const matchesAttendance = s.attendance30 >= minAttendance;
    return matchesText && matchesDept && matchesRole && matchesLeave && matchesAttendance;
  }), [staff, search, dept, role, showOnLeaveOnly, includeResigned, minAttendance]);

  const metrics = useMemo(()=>{
    const active = staff.filter(s=> s.status !== 'Resigned');
    const total = active.length;
    const teachers = active.filter(s=> s.role==='Teacher').length;
    const nonTeaching = total - teachers;
    const onLeaveToday = active.filter(s=> s.onLeaveToday).length;
    const pending = requests.filter(r=> r.status==='Pending').length;
    const avgAttendance = total ? Math.round(active.reduce((a,s)=>a+s.attendance30,0)/total) : 0;
    return { total, teachers, nonTeaching, onLeaveToday, pending, avgAttendance };
  }, [staff, requests]);

  const gradeCounts = useMemo(()=>{
    const map={};
    staff.forEach(s=> { if (s.role==='Teacher' && s.grade) map[s.grade]=(map[s.grade]||0)+1; });
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [staff]);

  const resignations = useMemo(()=> staff.filter(s=> s.status==='Resigned'), [staff]);

  const handleRequest = (id, action) => setRequests(prev => prev.map(r => r.id===id ? { ...r, status: action==='approve' ? 'Approved':'Rejected'} : r));
  const exportCSV = () => {
    const headers=["ID","Name","Role","Department","Grade","Email","Phone","Attendance30","LeavesTakenYTD","LeaveBalance","Birthday","OnLeaveToday","NextAppraisal","Status"];
    const rows = filtered.map(s=> [s.id,s.name,s.role,s.department,s.grade||'',s.email,s.phone,s.attendance30,s.leavesTakenYTD,s.leaveBalance,s.birthday,s.onLeaveToday?'Yes':'No',s.nextAppraisal,s.status]);
    const csv=[headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`staff_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const sendAnnouncement = () => { const msg = prompt('Announcement to staff (simulate send):'); if (msg) alert('Announcement queued to '+staff.length+' staff: '+msg); };
  const createStaff = () => { const nextNum = staff.length+1; const idPrefix = addForm.role==='Teacher' ? 'T':'NT'; const newStaff = { id: `${idPrefix}${String(nextNum).padStart(3,'0')}`, name: addForm.name.trim()||'New Staff', role: addForm.role, department: addForm.department, grade: addForm.role==='Teacher'?addForm.grade:undefined, email:addForm.email, phone:addForm.phone, doj:addForm.doj, attendance30:95, leavesTakenYTD:0, leaveBalance:15, birthday:'1990-01-01', onLeaveToday:false, lastAppraisal:new Date().toISOString().slice(0,10), nextAppraisal:new Date(Date.now()+31536000000).toISOString().slice(0,10), reportsTo:addForm.reportsTo, status:'Active' }; setStaff(p=>[...p,newStaff]); setShowAdd(false); };
  const openResign = (s) => { setSelected(s); setResign({ date:new Date().toISOString().slice(0,10), reason:'' }); setShowResign(true); };
  const confirmResign = () => { if(!selected) return; setStaff(prev=> prev.map(x=> x.id===selected.id ? { ...x, status:'Resigned', resignationDate: resign.date, resignationReason: resign.reason }: x)); setShowResign(false); setSelected(null); };
  const reinstate = (id) => setStaff(prev=> prev.map(x=> x.id===id ? { ...x, status:'Active', resignationDate: undefined, resignationReason: undefined }: x));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-content-center shadow-sm"><ClipboardList size={18} /></div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Staff Management</h1>
              <p className="text-xs text-slate-500">Admin/Principal console · leave · birthdays · grade coverage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sendAnnouncement} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"><Megaphone size={16}/>Announcement</button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"><Download size={16}/>Export</button>
            <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"><Plus size={16}/>Add Staff</button>
          </div>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPI icon={<Users className="text-indigo-600"/>} label="Active Staff" value={fmt(metrics.total)} />
          <KPI icon={<GraduationCap className="text-emerald-600"/>} label="Teachers" value={fmt(metrics.teachers)} />
          <KPI icon={<Briefcase className="text-purple-600"/>} label="Non‑Teaching" value={fmt(metrics.nonTeaching)} />
          <KPI icon={<CalendarDays className="text-rose-600"/>} label="On Leave Today" value={fmt(metrics.onLeaveToday)} />
          <KPI icon={<ClipboardList className="text-amber-600"/>} label="Pending Leave" value={fmt(metrics.pending)} />
          <KPI icon={<TrendingUp className="text-blue-600"/>} label="Avg Attendance (30d)" value={`${metrics.avgAttendance}%`} />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone, department, grade…" className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-2">
                  <Select value={dept} onChange={setDept} options={DEPARTMENTS} label="Department" />
                  <Select value={role} onChange={setRole} options={ROLES} label="Role" />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-500"/>
                  <label className="text-sm">Min Attendance</label>
                  <input type="number" min={0} max={100} value={minAttendance} onChange={e=>setMinAttendance(Number(e.target.value)||0)} className="w-20 px-2 py-1 rounded-lg border border-slate-200" />
                </div>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showOnLeaveOnly} onChange={e=>setShowOnLeaveOnly(e.target.checked)} /> <span>On‑leave only</span></label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={includeResigned} onChange={e=>setIncludeResigned(e.target.checked)} /> <span>Include resigned</span></label>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><h2 className="font-semibold">Staff Directory ({filtered.length})</h2><span className="text-xs text-slate-500">Click a row to open details</span></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr><Th>Name</Th><Th>Role</Th><Th>Dept</Th><Th>Grade</Th><Th className="text-center">Attendance (30d)</Th><Th>Next Appraisal</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={()=>setSelected(s)}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className={classNames('h-9 w-9 rounded-full grid place-content-center text-white font-semibold', colorByDept(s.department))}>{s.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                            <div>
                              <div className="font-medium">{s.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-3"><span className="inline-flex items-center gap-1"><Mail size={12}/>{s.email}</span><span className="inline-flex items-center gap-1"><Phone size={12}/>{s.phone}</span></div>
                            </div>
                          </div>
                        </Td>
                        <Td>{s.role}</Td>
                        <Td>{s.department}</Td>
                        <Td>{s.role==='Teacher' ? (s.grade || <span className='text-slate-400'>—</span>) : <span className='text-slate-400'>—</span>}</Td>
                        <Td className="text-center"><span className="inline-flex items-center gap-2"><div className="w-28 bg-slate-200 rounded-full h-2"><div className="h-2 rounded-full bg-indigo-600" style={{width:`${s.attendance30}%`}}></div></div><span className="tabular-nums">{s.attendance30}%</span></span></Td>
                        <Td>{s.nextAppraisal}</Td>
                        <Td>{s.status==='Resigned' ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">Resigned</span> : s.onLeaveToday ? <span className="text-rose-600 text-xs font-medium">On Leave Today</span> : <span className="text-emerald-600 text-xs font-medium">Active</span>}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><h2 className="font-semibold">Leave Requests</h2><span className="text-xs text-slate-500">Approve or reject pending requests</span></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr><Th>Request ID</Th><Th>Name</Th><Th>Role</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th className="text-center">Days</Th><Th>Reason</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <Td>{r.id}</Td><Td>{r.name}</Td><Td>{r.role}</Td><Td>{r.type}</Td><Td>{r.from}</Td><Td>{r.to}</Td><Td className="text-center">{r.days}</Td><Td className="max-w-[200px] truncate" title={r.reason}>{r.reason}</Td><Td><span className={classNames('px-2 py-1 rounded-full text-xs font-medium', r.status==='Pending' && 'bg-amber-50 text-amber-700 border border-amber-200', r.status==='Approved' && 'bg-emerald-50 text-emerald-700 border border-emerald-200', r.status==='Rejected' && 'bg-rose-50 text-rose-700 border border-rose-200')}>{r.status}</span></Td>
                        <Td>{r.status==='Pending' ? <div className="flex gap-2"><button onClick={()=>handleRequest(r.id,'approve')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700"><ThumbsUp size={14}/>Approve</button><button onClick={()=>handleRequest(r.id,'reject')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-rose-600 text-white hover:bg-rose-700"><ThumbsDown size={14}/>Reject</button></div> : <span className="text-slate-400 text-xs">—</span>}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Card title="Attendance Trend (12 weeks)" subtitle="Overall staff presence">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ATTENDANCE_TREND} margin={{left:0,right:0,top:5,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="wk" hide={false} />
                    <YAxis hide domain={[80,100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="percent" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Teachers by Grade" subtitle="Coverage snapshot">
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-500"><Th>Grade</Th><Th className="text-right">Teachers</Th></tr></thead>
                  <tbody>
                    {gradeCounts.length===0 && <tr><Td className="py-3 text-slate-500">No teacher-grade mapping yet.</Td></tr>}
                    {gradeCounts.map(([g,c]) => <tr key={g} className="border-t border-slate-100"><Td>{g}</Td><Td className="text-right font-medium">{c}</Td></tr>)}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="Resignations" subtitle="Recently marked">
              {resignations.length===0 ? <div className="text-sm text-slate-500">No resignations recorded.</div> : (
                <ul className="space-y-2">{resignations.map(s => (
                  <li key={s.id} className="flex items-center justify-between">
                    <div className="text-sm"><div className="font-medium">{s.name} <span className="text-xs text-slate-500">({s.role})</span></div><div className="text-xs text-slate-500">Last day: {s.resignationDate||'—'} · {s.resignationReason||'—'}</div></div>
                    <button onClick={()=>reinstate(s.id)} className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">Reinstate</button>
                  </li>))}</ul>
              )}
            </Card>
            <Card title="Quick Actions" subtitle="Do more in one click">
              <div className="grid grid-cols-2 gap-2">
                <QA icon={<UserCog size={16}/>} label="Assign Duty" onClick={()=>alert('Assign duty flow…')}/>
                <QA icon={<CalendarDays size={16}/>} label="Plan Substitutions" onClick={()=>alert('Open substitution planner…')}/>
                <QA icon={<Megaphone size={16}/>} label="Notify Staff" onClick={sendAnnouncement}/>
                <QA icon={<Download size={16}/>} label="Export CSV" onClick={exportCSV}/>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.aside initial={{x:400, opacity:0}} animate={{x:0, opacity:1}} exit={{x:400, opacity:0}} transition={{type:'spring', stiffness:260, damping:24}} className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white border-l border-slate-200 shadow-2xl z-40">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={classNames('h-9 w-9 rounded-full grid place-content-center text-white font-semibold', colorByDept(selected.department))}>{selected.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                <div><div className="font-semibold">{selected.name}</div><div className="text-xs text-slate-500">{selected.role} · {selected.department}</div></div>
              </div>
              <div className="flex items-center gap-2">
                {selected.status!=='Resigned' && <button onClick={()=>openResign(selected)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50"><UserX size={16}/>Mark Resignation</button>}
                <button onClick={()=>setSelected(null)} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50">Close</button>
              </div>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-4rem)]">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Email" value={selected.email} icon={<Mail size={14}/>}/>
                <Info label="Phone" value={selected.phone} icon={<Phone size={14}/>}/>
                <Info label="Reports To" value={selected.reportsTo} icon={<Briefcase size={14}/>}/>
                <Info label="DOJ" value={selected.doj} icon={<CalendarDays size={14}/>}/>
                {selected.role==='Teacher' && <Info label="Grade" value={selected.grade||'—'} icon={<GraduationCap size={14}/>}/>}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="font-medium mb-1">Leave Ledger</div>
                <div className="grid grid-cols-3 text-center">
                  <div><div className="text-xs text-slate-500">Taken (YTD)</div><div className="font-semibold">{selected.leavesTakenYTD}</div></div>
                  <div><div className="text-xs text-slate-500">Balance</div><div className="font-semibold">{selected.leaveBalance}</div></div>
                  <div><div className="text-xs text-slate-500">Next Appraisal</div><div className="font-semibold">{selected.nextAppraisal}</div></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm font-medium mb-2">Workload Split (Demo)</div>
                <div className="h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie dataKey="value" data={[{name:'Teaching', value:60},{name:'Clubs', value:15},{name:'Duties', value:25}]} innerRadius={30} outerRadius={60}>{COLORS.map((c,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
              </div>
              <div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"><Mail size={16}/>Email</button><button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50"><CalendarDays size={16}/>Schedule 1:1</button></div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>{showAdd && (
        <Modal onClose={()=>setShowAdd(false)}>
          <div className="mb-3"><div className="text-lg font-semibold">Add Staff</div><div className="text-xs text-slate-500">Create a new staff profile. You can edit later.</div></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.name} onChange={e=>setAddForm({...addForm, name:e.target.value})} /></Field>
            <Field label="Role"><select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.role} onChange={e=>setAddForm({...addForm, role:e.target.value})}>{ROLES.filter(r=>r!=="All").map(r=> <option key={r} value={r}>{r}</option>)}</select></Field>
            <Field label="Department"><select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.department} onChange={e=>setAddForm({...addForm, department:e.target.value})}>{DEPARTMENTS.filter(d=>d!=="All").map(d=> <option key={d} value={d}>{d}</option>)}</select></Field>
            {addForm.role==='Teacher' && <Field label="Grade"><select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.grade} onChange={e=>setAddForm({...addForm, grade:e.target.value})}>{Array.from({length:12}).map((_,i)=>`Grade ${i+1}`).map(g=> <option key={g} value={g}>{g}</option>)}</select></Field>}
            <Field label="Email"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.email} onChange={e=>setAddForm({...addForm, email:e.target.value})} /></Field>
            <Field label="Phone"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.phone} onChange={e=>setAddForm({...addForm, phone:e.target.value})} /></Field>
            <Field label="Date of Joining"><input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.doj} onChange={e=>setAddForm({...addForm, doj:e.target.value})} /></Field>
            <Field label="Reports To"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={addForm.reportsTo} onChange={e=>setAddForm({...addForm, reportsTo:e.target.value})} /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2"><button onClick={()=>setShowAdd(false)} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50">Cancel</button><button onClick={createStaff} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"><Plus size={16}/>Create</button></div>
        </Modal> )}</AnimatePresence>

      <AnimatePresence>{showResign && selected && (
        <Modal onClose={()=>setShowResign(false)}>
          <div className="mb-3"><div className="text-lg font-semibold">Mark Resignation</div><div className="text-xs text-slate-500">{selected.name} · {selected.role}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last Working Day"><input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={resign.date} onChange={e=>setResign({...resign, date:e.target.value})} /></Field>
            <Field label="Reason"><input className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="e.g., Relocation, Higher studies" value={resign.reason} onChange={e=>setResign({...resign, reason:e.target.value})} /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2"><button onClick={()=>setShowResign(false)} className="rounded-lg px-3 py-2 border border-slate-200 hover:bg-slate-50">Cancel</button><button onClick={confirmResign} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-rose-600 text-white hover:bg-rose-700"><UserX size={16}/>Mark Resigned</button></div>
        </Modal> )}</AnimatePresence>

      <footer className="py-6 text-center text-xs text-slate-400">Demo UI · Replace mock data with API · © {new Date().getFullYear()}</footer>
    </div>
  );
}

// UI primitives
function KPI({ icon, label, value }) { return <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-slate-50 grid place-content-center">{icon}</div><div><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-semibold tabular-nums">{value}</div></div></div></motion.div>; }
function Card({ title, subtitle, children }) { return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"><div className="mb-2"><div className="font-semibold">{title}</div>{subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}</div>{children}</div>; }
function QA({ icon, label, onClick }) { return <button onClick={onClick} className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-left flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-slate-50 grid place-content-center">{icon}</div><div className="text-sm font-medium">{label}</div></button>; }
function Select({ value, onChange, options, label }) { return <div className="relative"><select value={value} onChange={e=>onChange(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm">{options.map(o=> <option key={o} value={o}>{o}</option>)}</select><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>{label && <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-400">{label}</span>}</div>; }
function Th({ children, className }) { return <th className={classNames('px-4 py-2 text-left text-xs font-medium', className)}>{children}</th>; }
function Td({ children, className }) { return <td className={classNames('px-4 py-3 align-middle', className)}>{children}</td>; }
function Field({ label, children }) { return <label className="text-sm"><div className="text-xs text-slate-500 mb-1">{label}</div>{children}</label>; }
function Modal({ children, onClose }) { return <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={onClose} /><motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">{children}</motion.div></motion.div>; }
function Info({ label, value, icon }) { return <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs text-slate-500 flex items-center gap-2">{icon}{label}</div><div className="font-medium mt-1 break-words">{value}</div></div>; }
function colorByDept(dept){ switch(dept){ case 'Mathematics': return 'bg-indigo-600'; case 'Science': return 'bg-emerald-600'; case 'English': return 'bg-rose-600'; case 'Social Studies': return 'bg-amber-600'; case 'Computer Science': return 'bg-purple-600'; case 'Administration': return 'bg-slate-600'; case 'Sports': return 'bg-orange-600'; case 'Arts': return 'bg-pink-600'; default: return 'bg-blue-600'; }}

