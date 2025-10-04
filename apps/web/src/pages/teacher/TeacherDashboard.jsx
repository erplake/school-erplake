// Replacement with provided full one-page preview (adapted imports to local UI kit)
import React, { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import Switch from '../../components/ui/Switch';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Dialog from '../../components/ui/Dialog';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import Separator from '../../components/ui/Separator';
import {
  Calendar, Send, Users, BookOpen, ClipboardList, FileText, MessageSquare, CheckCircle2, XCircle, GraduationCap,
  Upload, Wifi, WifiOff, BarChart3, NotebookPen, Bell, Play, Pause, RotateCcw, Video, Download, Star, Crown, Flag
} from 'lucide-react';

// Mock data (unchanged from provided design)
const STUDENTS = [
  { id: 1, name: 'Aarav Sharma', roll: 1, gender: 'M', age: 13, allergies: ['Peanuts'], status: 'present', guardian: 'Mr. Sharma', phone: '+91-900000001', address: 'Dwarka, New Delhi', blood: 'B+', transport: { mode: 'Bus', route: 'R12', stop: 'North Gate' } },
  { id: 2, name: 'Diya Patel', roll: 2, gender: 'F', age: 12, allergies: [], status: 'present', guardian: 'Mrs. Patel', phone: '+91-900000002', address: 'Vastrapur, Ahmedabad', blood: 'O+', transport: { mode: 'Pickup', route: '—', stop: 'Guardian' } },
  { id: 3, name: 'Ishaan Gupta', roll: 3, gender: 'M', age: 12, allergies: ['Dust'], status: 'present', guardian: 'Mr. Gupta', phone: '+91-900000003', address: 'Kothrud, Pune', blood: 'A-', transport: { mode: 'Walk', route: '—', stop: 'Main Gate' } },
  { id: 4, name: 'Meera Nair', roll: 4, gender: 'F', age: 13, allergies: [], status: 'present', guardian: 'Mrs. Nair', phone: '+91-900000004', address: 'Kakkanad, Kochi', blood: 'AB+', transport: { mode: 'Bus', route: 'R05', stop: 'East Gate' } },
  { id: 5, name: 'Kabir Khan', roll: 5, gender: 'M', age: 12, allergies: ['Lactose'], status: 'present', guardian: 'Mr. Khan', phone: '+91-900000005', address: 'Banjara Hills, Hyderabad', blood: 'B-', transport: { mode: 'Pickup', route: '—', stop: 'Father' } },
  { id: 6, name: 'Zara Ahmed', roll: 6, gender: 'F', age: 13, allergies: [], status: 'present', guardian: 'Mrs. Ahmed', phone: '+91-900000006', address: 'Indiranagar, Bengaluru', blood: 'O-', transport: { mode: 'Bus', route: 'R07', stop: 'South Gate' } },
  { id: 7, name: 'Rohan Das', roll: 7, gender: 'M', age: 12, allergies: [], status: 'present', guardian: 'Mr. Das', phone: '+91-900000007', address: 'Salt Lake, Kolkata', blood: 'A+', transport: { mode: 'Walk', route: '—', stop: 'Main Gate' } },
  { id: 8, name: 'Ananya Roy', roll: 8, gender: 'F', age: 12, allergies: ['Penicillin'], status: 'present', guardian: 'Mrs. Roy', phone: '+91-900000008', address: 'Garia, Kolkata', blood: 'B+', transport: { mode: 'Bus', route: 'R12', stop: 'North Gate' } }
];

const TESTS = [
  { id: 't1', title: 'Unit Test — Algebra', date: '2025-10-05', max: 20, syllabus: 'Linear equations, factorization', status: 'scheduled' },
  { id: 't2', title: 'Science Quiz #2', date: '2025-10-08', max: 10, syllabus: 'Cells & Tissues', status: 'draft' }
];
const CLASSWORK = [
  { id: 'c1', title: 'Algebra: Solving for x', subject: 'Mathematics', covered: ['One-variable equations', 'Check by substitution'], shareable: true },
  { id: 'c2', title: 'Plant vs Animal Cells', subject: 'Science', covered: ['Organelles', 'Microscope basics'], shareable: true }
];
const LESSON_PLAN = [
  { id: 'l1', date: '2025-09-25', topic: 'Integers — Add/Subtract', status: 'done' },
  { id: 'l2', date: '2025-09-27', topic: 'Algebra — Variables', status: 'done' },
  { id: 'l3', date: '2025-10-01', topic: 'Algebra — Solving for x', status: 'planned' }
];
const UPCOMING = [
  { id: 'u1', date: '2025-10-03', note: 'Math Lab activity — Linear equations' },
  { id: 'u2', date: '2025-10-05', note: 'Unit Test — Algebra (Max 20)' }
];
const PARENT_CHAT = [
  { id: 'm1', from: 'Parent (Diya)', role: 'Parent', msg: 'Diya will be leaving early tomorrow.', time: '09:20', unread: true },
  { id: 'm2', from: 'Class Teacher', role: 'Teacher', msg: 'Homework uploaded in portal. Due Thu.', time: '08:05', unread: false },
  { id: 'm3', from: 'Parent (Kabir)', role: 'Parent', msg: 'Kabir has a mild lactose allergy noted.', time: 'Yesterday', unread: true },
  { id: 'm4', from: 'Parent (Aarav)', role: 'Parent', msg: 'Can we get extra practice links?', time: 'Yesterday', unread: false },
  { id: 'm5', from: 'Parent (Meera)', role: 'Parent', msg: 'Meera will miss games period.', time: '2d ago', unread: false },
  { id: 'm6', from: 'Parent (Zara)', role: 'Parent', msg: 'Thanks for the update!', time: '3d ago', unread: false }
];
const PREVIOUS_REPORTS = [
  { id: 'r1', term: 'Term 1', year: 2025, generatedOn: '2025-09-20' },
  { id: 'r2', term: 'Unit Test 1', year: 2025, generatedOn: '2025-08-10' }
];
const WINGS = ['Kindergarten','Junior','Senior'];
const CLASS_OPTIONS = ['Pre‑Nursery','Nursery','LKG','UKG', ...Array.from({length:12},(_,i)=>String(i+1))];
const HOUSES = ['Red','Blue','Green','Yellow'];
const CLUBS = ['Science','Arts','Sports','Music','Drama'];

function initials(name){ const parts = name.split(' '); return (parts[0][0] + (parts[1]?.[0]||'')).toUpperCase(); }
function formatStopwatch(totalSeconds){ const m = String(Math.floor(totalSeconds/60)).padStart(2,'0'); const s = String(totalSeconds%60).padStart(2,'0'); return `${m}:${s}`; }

export default function TeacherDashboard(){
  const [wing,setWing] = useState('Junior');
  const [klass,setKlass] = useState('8');
  const [section,setSection] = useState('A');
  const [subject,setSubject] = useState('Mathematics');
  const [online,setOnline] = useState(false);
  const [meetURL,setMeetURL] = useState('');
  const [nowStr,setNowStr] = useState('');

  const [chatDraft,setChatDraft] = useState('');
  const [recipientsMode,setRecipientsMode] = useState('all');
  const [selectedRecipients,setSelectedRecipients] = useState(()=> new Set());

  const [elapsed,setElapsed] = useState(0);
  const [running,setRunning] = useState(false);
  useEffect(()=>{ const t=setInterval(()=>{ const now=new Date(); setNowStr(now.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'medium'})); if(running) setElapsed(e=>e+1); },1000); return ()=>clearInterval(t); },[running]);

  const [attendance,setAttendance] = useState(()=>{ const map={}; STUDENTS.forEach(s=>map[s.id]='present'); return map; });
  const [dispersal,setDispersal] = useState(()=>{ const map={}; STUDENTS.forEach(s=>map[s.id]=s.transport.mode); return map; });
  const [classMonitorId,setClassMonitorId] = useState(1);
  const [prefectId,setPrefectId] = useState(2);
  const [houseById,setHouseById] = useState(()=>{ const m={}; STUDENTS.forEach((s,i)=>m[s.id]=HOUSES[i%HOUSES.length]); return m; });
  const [clubsById,setClubsById] = useState(()=>{ const m={}; STUDENTS.forEach(s=>m[s.id]=new Set()); return m; });
  const [hwForStudent,setHwForStudent] = useState(null);

  const filteredStudents = STUDENTS; // placeholder for search
  const presentCount = useMemo(()=> Object.values(attendance).filter(v=>v==='present').length, [attendance]);
  const absentCount = STUDENTS.length - presentCount;
  function markAllPresent(){ const map={}; STUDENTS.forEach(s=>map[s.id]='present'); setAttendance(map); }
  function handleSendChat(){ if(!chatDraft.trim()) return; const mode = recipientsMode==='all' ? 'All parents' : `${selectedRecipients.size} selected`; alert(`Sent to ${mode}: ${chatDraft}`); setChatDraft(''); setSelectedRecipients(new Set()); }
  const unreadCount = useMemo(()=> PARENT_CHAT.filter(m=>m.unread).length, []);
  const recentFive = useMemo(()=> PARENT_CHAT.slice(0,5), []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[1600px] grid grid-cols-2 md:grid-cols-3 items-center px-3 md:px-6 py-3 gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">Teachers Portal</h1>
              <p className="text-xs text-slate-500">Unified tools for classroom & communication.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-sm text-slate-600">{nowStr}</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="tabular-nums font-mono">{formatStopwatch(elapsed)}</span>
              <Button variant="outline" size="sm" onClick={()=>setRunning(r=>!r)} aria-label="Start/Pause">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
              <Button variant="outline" size="sm" onClick={()=>setElapsed(0)} aria-label="Reset"><RotateCcw className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Badge variant={online ? 'primary':'secondary'} className="gap-1">{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{online ? 'Online':'Offline'}</Badge>
            <Switch checked={online} onCheckedChange={setOnline} />
            {online && (
              <div className="flex items-center gap-2">
                <Input value={meetURL} onChange={e=>setMeetURL(e.target.value)} placeholder="Google Meet link" className="w-44" />
                <a href={meetURL || '#'} target="_blank" rel="noreferrer"><Button size="sm" className="gap-2" variant="primary"><Video className="h-4 w-4" /> Join</Button></a>
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-2"><Bell className="h-4 w-4" /> Alerts</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1600px] px-3 md:px-6 py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <Card className="col-span-12">
            <CardContent className="flex flex-col gap-4 py-4 xl:flex-row xl:items-end">
              <div className="grid flex-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Wing</label>
                  <Select value={wing} onChange={e=>setWing(e.target.value)}>{WINGS.map(w=> <option key={w} value={w}>{w}</option>)}</Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Class</label>
                  <Select value={klass} onChange={e=>setKlass(e.target.value)}>{CLASS_OPTIONS.map(c=> <option key={c} value={c}>{c}</option>)}</Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Section</label>
                  <Select value={section} onChange={e=>setSection(e.target.value)}>{'ABCDEFG'.split('').map(s=> <option key={s} value={s}>{s}</option>)}</Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Subject</label>
                  <Select value={subject} onChange={e=>setSubject(e.target.value)}>{['Mathematics','Science','English','Hindi','SST'].map(s=> <option key={s} value={s}>{s}</option>)}</Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Date</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Today</Button>
                    <Button variant="outline" size="sm" aria-label="Pick date"><Calendar className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end gap-2 md:justify-start xl:justify-end">
                <Button className="gap-2" onClick={()=> setHwForStudent({ id:0, name:'Homework Share' })}><Upload className="h-4 w-4" /> Share Homework</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1600px] px-3 md:px-6 pb-14">
        <Tabs
          defaultValue="dashboard"
          tabs={[
            { value:'dashboard', label:'Dashboard', content: () => (
              <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard icon={<Users className="h-4 w-4" />} label="Students" value={`${STUDENTS.length}`} hint="in class" />
              <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Present" value={`${presentCount}`} hint="today" />
              <StatCard icon={<XCircle className="h-4 w-4" />} label="Absent" value={`${absentCount}`} hint="today" />
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Students</CardTitle>
                    <CardDescription>Profiles, guardians, transport, attendance, and actions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={markAllPresent}>Mark all Present</Button>
                    <Button>Save Attendance</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-xs text-slate-600">
                      <tr>
                        <th className="p-2 text-left w-10">#</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Guardian</th>
                        <th className="p-2 text-left">Contact</th>
                        <th className="p-2 text-left">Address</th>
                        <th className="p-2 text-left">Blood</th>
                        <th className="p-2 text-left">Gender</th>
                        <th className="p-2 text-left">Transport</th>
                        <th className="p-2 text-left">Dispersal</th>
                        <th className="p-2 text-left">Attendance</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s=> (
                        <tr key={s.id} className="border-b last:border-0 border-slate-200 hover:bg-slate-50">
                          <td className="p-2">{s.roll}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8"><AvatarFallback>{initials(s.name)}</AvatarFallback></Avatar>
                              <div>
                                <div className="font-medium leading-none">{s.name}</div>
                                <div className="text-xs text-slate-500">Age {s.age}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">{s.guardian}</td>
                          <td className="p-2">{s.phone}</td>
                          <td className="p-2 min-w-[180px]">{s.address}</td>
                          <td className="p-2">{s.blood}</td>
                          <td className="p-2">{s.gender === 'M' ? 'Male':'Female'}</td>
                          <td className="p-2"><div className="text-xs text-slate-600"><div className="font-medium">{s.transport.mode}</div><div className="opacity-80">{s.transport.route} • {s.transport.stop}</div></div></td>
                          <td className="p-2">
                            <Select value={dispersal[s.id]} onChange={e=> setDispersal(m=>({...m,[s.id]:e.target.value}))} className="h-8 w-[128px]">
                              <option value="Bus">Bus</option>
                              <option value="Pickup">Pickup</option>
                              <option value="Walk">Walk</option>
                            </Select>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={attendance[s.id]==='absent'} onChange={e=> setAttendance(m=>({...m,[s.id]: e.target.checked ? 'absent':'present'}))} />
                              <span className="text-sm">Absent</span>
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={()=>setHwForStudent(s)}>Review HW</Button>
                              <Button size="sm" variant="secondary">Message Parent</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
              </div>
            )},
            { value:'work', label:'Classwork & Homework', content: () => (
              <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard icon={<Users className="h-4 w-4" />} label="Students" value={`${STUDENTS.length}`} hint="in class" />
              <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Present" value={`${presentCount}`} hint="today" />
              <StatCard icon={<XCircle className="h-4 w-4" />} label="Absent" value={`${absentCount}`} hint="today" />
            </div>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Classwork & Homework</CardTitle>
                        <CardDescription>Share what was covered and assign follow‑ups</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {CLASSWORK.map(cw=> (
                      <div key={cw.id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 font-medium"><ClipboardList className="h-4 w-4" /> {cw.title}<Badge variant="secondary">{cw.subject}</Badge></div>
                            <ul className="mt-1 list-inside list-disc text-sm text-slate-600">{cw.covered.map((t,i)=> <li key={i}>{t}</li>)}</ul>
                          </div>
                          <Button size="sm" variant="outline" className="gap-2"><Send className="h-4 w-4" /> Share to Parents</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Lesson Planner</CardTitle><CardDescription>Recent & upcoming lessons</CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    {LESSON_PLAN.map(l=> (
                      <div key={l.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                        <div><div className="font-medium">{l.topic}</div><div className="text-xs text-slate-500">{l.date}</div></div>
                        <Badge variant={l.status==='done' ? 'secondary':'primary'}>{l.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Upcoming & Tests</CardTitle><CardDescription>Activities & assessments on the horizon</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {UPCOMING.map(u=> (
                      <div key={u.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div>{u.note}</div><div className="text-xs text-slate-500">{u.date}</div></div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
              </div>
            )},
            { value:'roles', label:'Roles & Houses', content: () => (
              <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flag className="h-4 w-4" /> Student Roles & Houses</CardTitle><CardDescription>Assign class leadership, house, clubs, and track engagement</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div><label className="mb-1 block text-xs text-slate-500">Class Monitor</label><Select value={String(classMonitorId)} onChange={e=>setClassMonitorId(Number(e.target.value))}>{STUDENTS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                  <div><label className="mb-1 block text-xs text-slate-500">Prefect</label><Select value={String(prefectId)} onChange={e=>setPrefectId(Number(e.target.value))}>{STUDENTS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Assign House (quick)</label>
                    <div className="flex gap-2">
                      <Select onChange={e=> setHouseById(m=>({...m,[Number(e.target.value)]: m[Number(e.target.value)] || HOUSES[0]}))} className="w-40"><option value="">Pick student</option>{STUDENTS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                      <Select onChange={()=>{}} className="w-32"><option value="">House</option>{HOUSES.map(h=> <option key={h} value={h}>{h}</option>)}</Select>
                    </div>
                  </div>
                </div>
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">House</th><th className="p-2 text-left">Clubs</th><th className="p-2 text-left">Engagement</th></tr></thead>
                    <tbody>
                      {STUDENTS.map(s=> (
                        <tr key={s.id} className="border-b last:border-0 border-slate-200">
                          <td className="p-2 min-w-[180px]">{s.name}</td>
                          <td className="p-2">{s.id===classMonitorId ? <span className="inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5" /> Class Monitor</span> : s.id===prefectId ? <span className="inline-flex items-center gap-1 text-sm"><Crown className="h-3.5 w-3.5" /> Prefect</span> : <span className="text-xs text-slate-500">—</span>}</td>
                          <td className="p-2">{houseById[s.id]}</td>
                          <td className="p-2"><div className="flex flex-wrap gap-1">{[...(clubsById[s.id]||new Set())].map(c=> <Badge key={c} variant="secondary">{c}</Badge>)}</div></td>
                          <td className="p-2"><Badge variant="outline">{Math.floor(Math.random()*20)+5} pts</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
              </div>
            )},
            { value:'comms', label:'Parent Communication', content: () => (
              <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><div><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Parent Communication</CardTitle><CardDescription>Announcements & queries</CardDescription></div><div className="flex items-center gap-3 text-sm"><Badge variant="secondary">Recent: 5</Badge><Badge>Unread: {unreadCount}</Badge></div></div></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm"><span>Send to</span><Select value={recipientsMode} onChange={e=>setRecipientsMode(e.target.value)} className="sm:w-40"><option value="all">All parents</option><option value="selected">Selected</option></Select></div>
                  {recipientsMode==='selected' && (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">{STUDENTS.map(s=> <label key={s.id} className="flex items-center gap-2 text-sm"><Checkbox checked={selectedRecipients.has(s.id)} onChange={e=> { setSelectedRecipients(prev=>{ const next=new Set(prev); e.target.checked? next.add(s.id):next.delete(s.id); return next;}); }} /> {s.name}</label>)}</div>
                  )}
                  <div className="max-h-[420px] space-y-3 overflow-auto pr-1">{recentFive.map(m=> (
                    <div key={m.id} className="rounded-lg border p-2 text-sm"><div className="flex items-center justify-between"><div className="font-medium">{m.from}</div><span className="text-xs text-slate-500">{m.time}</span></div><div className="mt-1 text-slate-700">{m.msg}</div>{m.unread && <Badge className="mt-2" variant="primary">new</Badge>}</div>
                  ))}</div>
                  <Separator />
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center"><Input value={chatDraft} onChange={e=>setChatDraft(e.target.value)} placeholder="Message parents…" className="flex-1" /><Button onClick={handleSendChat} className="gap-2 w-full sm:w-auto"><Send className="h-4 w-4" /> Send</Button></div>
                </div>
              </CardContent>
            </Card>
              </div>
            )},
            { value:'report-cards', label:'Report Cards', content: () => (
              <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><NotebookPen className="h-4 w-4" /> Report Cards</CardTitle><CardDescription>Window & template defined by leadership.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-3">
                  <div className="mb-2 font-medium">Previous Reports</div>
                  <div className="space-y-2">{PREVIOUS_REPORTS.map(r=> (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border p-2 text-sm"><div>{r.term} — {r.year} <span className="text-xs text-slate-500">(generated {r.generatedOn})</span></div><Button size="sm" variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download</Button></div>
                  ))}</div>
                </div>
                <div className="space-y-2">{STUDENTS.map(s=> (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-2"><div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback>{initials(s.name)}</AvatarFallback></Avatar><div className="text-sm">{s.name}</div></div><div className="flex items-center gap-2"><Badge variant="secondary">draft</Badge><Button size="sm" variant="outline">Open</Button></div></div>
                ))}</div>
              </CardContent>
            </Card>
              </div>
            )}
          ]}
          className="w-full"
        />
      </main>

      <Dialog open={!!hwForStudent} onClose={()=> setHwForStudent(null)} title={`Homework Review — ${hwForStudent?.name || ''}`}>
        <div className="space-y-3">{TESTS.map(a=> { const status=Math.random()>0.5?'submitted':'pending'; return (
          <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><div className="font-medium">{a.title}</div><div className="text-xs text-slate-500">Due {a.date}</div></div><div className="flex items-center gap-2"><Badge variant={status==='submitted'?'primary':'secondary'}>{status}</Badge><Button size="sm" variant="outline">Open</Button><Button size="sm" variant="secondary">Approve</Button><Button size="sm" variant="outline">Return</Button></div></div>
        ); })}</div>
      </Dialog>

  <footer className="mx-auto w-full max-w-[1600px] px-3 md:px-6 pb-10 text-center text-xs text-slate-500">Built for focus and speed. Swap in real data & auth later.</footer>
    </div>
  );
}

function StatCard({ icon, label, value, hint }){
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">{icon}</div>
        <div className="text-right">
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          <div className="text-xs text-slate-500">{label} • {hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}
