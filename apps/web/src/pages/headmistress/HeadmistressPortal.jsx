import React, { useMemo, useState } from 'react';
// Adapting provided Headmistress Wing Console preview to existing local UI kit naming
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import Select from '../../components/ui/Select';
import Dialog from '../../components/ui/Dialog';
import Tabs from '../../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Separator from '../../components/ui/Separator';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
// NOTE: The design used shadcn components + recharts – we keep recharts for charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, GraduationCap, ClipboardList, Send, MessageSquare, Filter, Plus, Sparkles, ShieldCheck,
  BookOpen, Sliders, Calendar, Download, Wifi, WifiOff
} from 'lucide-react';

// Static auth/role stub (future: integrate with real auth context)
const AUTH = { role: 'Headmistress', wing: 'Junior', canSwitchWing: true };
const WINGS = ['Primary','Junior','Middle','Senior'];
const TEACHERS = [
  { id: 't1', name: 'Anita Sharma', wing: 'Primary', classes: ['1A','1B'] },
  { id: 't2', name: 'Rahul Verma', wing: 'Junior', classes: ['4A'] },
  { id: 't3', name: 'Meera Iyer', wing: 'Middle', classes: ['7A','7B'] },
  { id: 't4', name: 'Joseph Mathew', wing: 'Senior', classes: ['11 Sci','12 Sci'] },
  { id: 't5', name: 'Farah Khan', wing: 'Junior', classes: ['5A','5B'] },
];
const CLASSES = [
  { id: 'c1', name: '1A', wing: 'Primary', grade: 1 },
  { id: 'c2', name: '1B', wing: 'Primary', grade: 1 },
  { id: 'c3', name: '4A', wing: 'Junior', grade: 4 },
  { id: 'c4', name: '5A', wing: 'Junior', grade: 5 },
  { id: 'c5', name: '7A', wing: 'Middle', grade: 7 },
  { id: 'c6', name: '7B', wing: 'Middle', grade: 7 },
  { id: 'c7', name: '11 Sci', wing: 'Senior', grade: 11 },
  { id: 'c8', name: '12 Sci', wing: 'Senior', grade: 12 },
];
const INITIAL_TODOS = [
  { id: 'td1', title: 'Collect parent consent forms', priority: 'High', due: '2025-10-03', status: 'Pending', recipients: { teachers: ['t1','t2'], classes: [] } },
  { id: 'td2', title: 'Upload weekly lesson plan', priority: 'Medium', due: '2025-10-01', status: 'In-Progress', recipients: { teachers: ['t3'], classes: ['7A','7B'] } },
  { id: 'td3', title: 'Lab safety brief', priority: 'Low', due: '2025-10-07', status: 'Pending', recipients: { teachers: ['t4'], classes: ['11 Sci','12 Sci'] } },
];
const PLANNER_PROGRESS = [
  { className: '1A', wing: 'Primary', weekly: 80, monthly: 60, daily: 85 },
  { className: '5A', wing: 'Junior', weekly: 65, monthly: 50, daily: 70 },
  { className: '7A', wing: 'Middle', weekly: 55, monthly: 40, daily: 60 },
  { className: '11 Sci', wing: 'Senior', weekly: 40, monthly: 35, daily: 45 },
];
const CURRICULUM = [
  { id: 'cur1', wing: 'Primary', grade: 1, subject: 'Math', completion: 42 },
  { id: 'cur2', wing: 'Primary', grade: 1, subject: 'English', completion: 58 },
  { id: 'cur3', wing: 'Junior', grade: 5, subject: 'Science', completion: 36 },
  { id: 'cur4', wing: 'Middle', grade: 7, subject: 'History', completion: 25 },
  { id: 'cur5', wing: 'Senior', grade: 12, subject: 'Physics', completion: 18 },
];
const INITIAL_STANDARDS = [
  { id: 'std1', title: 'Homework load limits', description: 'Max 30 mins/day (Primary), 45 mins (Junior/Middle)', tags: ['Guideline','Wellbeing'], version: '1.1', effective: '2025-10-01' },
  { id: 'std2', title: 'Lesson plan checklist', description: 'NEP-aligned outcomes, formative assessment, activity-based', tags: ['NEP','CBSE'], version: '2.0', effective: '2025-09-20' },
];
const INITIAL_POLICIES = [
  { id: 'pol1', policy: 'Implement Foundational Literacy & Numeracy (FLN)', source: 'NEP 2020', due: '2025-12-15', status: 'In Review' },
  { id: 'pol2', policy: 'CBSE Board Practical Record Digitization', source: 'CBSE Circular 45/2025', due: '2025-11-20', status: 'Pending' },
  { id: 'pol3', policy: 'AI Ethics in Classrooms', source: 'Govt Advisory', due: '2026-01-10', status: 'Planned' },
];
const MESSAGES = [
  { id: 'm1', from: 'Headmistress (Junior)', to: 'Rahul Verma', role: 'Teacher', body: 'Reminder: Upload monthly planner by Wed.', ts: '2025-09-29 09:40' },
  { id: 'm2', from: 'Headmistress (Senior)', to: 'Headmistress (Middle)', role: 'Headmistress', body: 'Share your lab-safety template?', ts: '2025-09-28 12:15' },
];

function statusBadge(s){
  const tone = s === 'Pending' ? 'bg-yellow-100 text-yellow-800' : s === 'In-Progress' ? 'bg-blue-100 text-blue-800' : s === 'Done' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800';
  return <span className={`px-2 py-1 rounded text-xs ${tone}`}>{s}</span>;
}
function priorityBadge(p){
  const tone = p === 'High' ? 'bg-red-100 text-red-700' : p === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700';
  return <span className={`px-2 py-1 rounded text-xs ${tone}`}>{p}</span>;
}
function downloadCSV(filename, rows, headers){
  const csv = [headers.map(h=>`"${h.label}"`).join(',')]
    .concat(rows.map(r=> headers.map(h=>`"${String(r[h.key] ?? '').replace(/"/g,'""')}"`).join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function downloadPDFViaPrint(title, rows, headers){
  const w = window.open(''); if(!w) return;
  const head = `<title>${title}</title><style>body{font-family:ui-sans-serif,system-ui;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f5f5f5;text-align:left}</style>`;
  const thead = `<tr>${headers.map(h=>`<th>${h.label}</th>`).join('')}</tr>`;
  const tbody = rows.map(r=>`<tr>${headers.map(h=>`<td>${r[h.key] ?? ''}</td>`).join('')}</tr>`).join('');
  w.document.write(`<html><head>${head}</head><body><h3>${title}</h3><table>${thead}${tbody}</table></body></html>`);
  w.document.close(); w.focus(); w.print(); w.close();
}
function recipientsText(td){
  const tNames = (td.recipients?.teachers||[]).map(id=>{ const t=TEACHERS.find(x=>x.id===id); return t? t.name:id; });
  const cNames = td.recipients?.classes||[]; return [tNames.join('; '), cNames.join('; ')].filter(Boolean).join(' | ');
}

export default function HeadmistressPortal(){
  const [wing,setWing] = useState(AUTH.wing);
  const teachers = useMemo(()=> TEACHERS.filter(t=>t.wing===wing), [wing]);
  const classes = useMemo(()=> CLASSES.filter(c=>c.wing===wing), [wing]);
  const planners = useMemo(()=> PLANNER_PROGRESS.filter(p=>p.wing===wing), [wing]);
  const curriculum = useMemo(()=> CURRICULUM.filter(c=>c.wing===wing), [wing]);
  const [todos,setTodos] = useState(INITIAL_TODOS);
  const [messages,setMessages] = useState(MESSAGES);
  const [standards,setStandards] = useState(INITIAL_STANDARDS);
  const [policies,setPolicies] = useState(INITIAL_POLICIES);

  // dialogs & form states
  const [openTodo,setOpenTodo] = useState(false);
  const [todoTitle,setTodoTitle] = useState('');
  const [todoPriority,setTodoPriority] = useState('Medium');
  const [todoDue,setTodoDue] = useState('');
  const [selTeachers,setSelTeachers] = useState([]);
  const [selClasses,setSelClasses] = useState([]);

  const [openStd,setOpenStd] = useState(false);
  const [stdTitle,setStdTitle] = useState('');
  const [stdDesc,setStdDesc] = useState('');
  const [stdTags,setStdTags] = useState('NEP,CBSE');

  const [openPol,setOpenPol] = useState(false);
  const [polTitle,setPolTitle] = useState('');
  const [polSource,setPolSource] = useState('NEP 2020');
  const [polDue,setPolDue] = useState('');

  const [msgRole,setMsgRole] = useState('Teacher');
  const [msgRecipient,setMsgRecipient] = useState('');
  const [msgBody,setMsgBody] = useState('');

  const [openBroadcast,setOpenBroadcast] = useState(false);
  const [bTemplate,setBTemplate] = useState('Weekly Planner Reminder');
  const [bScope,setBScope] = useState('All Teachers in Wing');
  const [bClassName,setBClassName] = useState('');
  const [bMessage,setBMessage] = useState('');

  const [publishWindows,setPublishWindows] = useState(()=> Object.fromEntries(CLASSES.map(c=> [c.name,'Open'])));
  const [approvals,setApprovals] = useState(()=> Object.fromEntries(CLASSES.map(c=> [c.name,{ weekly:false, monthly:false, daily:false }])));

  function buildBroadcastPreview(){
    const base = bTemplate === 'Weekly Planner Reminder' ? 'Reminder: Weekly planner for {wing} is due tomorrow. Please submit in the console.'
      : bTemplate === 'Monthly Planner Reminder' ? 'Heads-up: Monthly planner for {wing} is due by 5 PM Friday.'
      : 'Policy nudge: Review latest board circulars and update your plans.';
    const target = bScope === 'Specific Class' && bClassName ? ` Class ${bClassName}.` : '';
    return base.replace('{wing}', wing) + target;
  }
  function sendBroadcast(){
    const body = bMessage || buildBroadcastPreview();
    let recipients = [];
    if(bScope === 'All Teachers in Wing') recipients = teachers.map(t=>t.name);
    if(bScope === 'All Classes in Wing') recipients = classes.map(c=>c.name);
    if(bScope === 'Specific Class' && bClassName) recipients = [bClassName];
    const now = new Date().toISOString().replace('T',' ').slice(0,16);
    const newMsgs = recipients.map((to,i)=> ({ id:`mb${Date.now()}_${i}`, from:`Headmistress (${wing})`, to, role: bScope.includes('Class')?'Class':'Teacher', body, ts: now }));
    setMessages(prev=> [...newMsgs, ...prev]);
    setOpenBroadcast(false); setBMessage('');
  }

  const wingTeachers = teachers; const wingClasses = classes;
  const todoForWing = useMemo(()=> todos.filter(td => td.recipients.teachers.some(id=> wingTeachers.some(t=> t.id===id)) || td.recipients.classes.some(n=> wingClasses.some(c=> c.name===n))), [todos, wingTeachers, wingClasses]);
  const avgWeekly = useMemo(()=> (!planners.length?0: Math.round(planners.reduce((a,b)=> a+b.weekly,0)/planners.length)), [planners]);

  function addTodo(){
    if(!todoTitle || (!selTeachers.length && !selClasses.length)) return;
    const newTodo = { id:`td${Date.now()}`, title: todoTitle, priority: todoPriority, due: todoDue || new Date().toISOString().slice(0,10), status: 'Pending', recipients:{ teachers: selTeachers, classes: selClasses } };
    setTodos([newTodo, ...todos]);
    setTodoTitle(''); setTodoPriority('Medium'); setTodoDue(''); setSelTeachers([]); setSelClasses([]); setOpenTodo(false);
  }
  function sendMessage(){
    if(!msgRecipient || !msgBody) return;
    const newMsg = { id:`m${Date.now()}`, from:`Headmistress (${wing})`, to: msgRecipient, role: msgRole, body: msgBody, ts: new Date().toISOString().replace('T',' ').slice(0,16) };
    setMessages([newMsg, ...messages]); setMsgBody('');
  }
  function addStandard(){
    if(!stdTitle) return;
    const item = { id:`std${Date.now()}`, title: stdTitle, description: stdDesc, tags: stdTags.split(',').map(s=>s.trim()).filter(Boolean), version: '1.0', effective: new Date().toISOString().slice(0,10) };
    setStandards([item, ...standards]); setStdTitle(''); setStdDesc(''); setStdTags('NEP,CBSE'); setOpenStd(false);
  }
  function addPolicy(){
    if(!polTitle) return;
    const item = { id:`pol${Date.now()}`, policy: polTitle, source: polSource, due: polDue || new Date().toISOString().slice(0,10), status: 'Planned' };
    setPolicies([item, ...policies]); setPolTitle(''); setPolSource('NEP 2020'); setPolDue(''); setOpenPol(false);
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-7 w-7" /> Headmistress Portal
          </h1>
          <p className="text-sm text-slate-500">Wing oversight, curriculum alignment & planner governance.</p>
        </div>
        <div className="flex items-center gap-3">
          {AUTH.canSwitchWing && (
            <Select value={wing} onChange={e=> setWing(e.target.value)}>
              {WINGS.map(w=> <option key={w} value={w}>{w}</option>)}
            </Select>
          )}
          <Button variant="outline" onClick={()=> setOpenBroadcast(true)} className="gap-2">
            <MessageSquare className="h-4 w-4" />Broadcast
          </Button>
          <Dialog open={openTodo} onClose={setOpenTodo} title={`Create To-Do (${wing})`}>
            <div className="grid gap-3">
              <Input placeholder="Title" value={todoTitle} onChange={e=> setTodoTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={todoPriority} onChange={e=> setTodoPriority(e.target.value)}>
                  {['High','Medium','Low'].map(p=> <option key={p} value={p}>{p}</option>)}
                </Select>
                <Input type="date" value={todoDue} onChange={e=> setTodoDue(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium mb-2">Teachers in {wing}</div>
                  <div className="space-y-2 max-h-40 overflow-auto pr-1">
                    {teachers.map(t=> (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selTeachers.includes(t.id)} onChange={e=> { const on=e.target.checked; setSelTeachers(prev=> on ? [...prev,t.id]: prev.filter(x=>x!==t.id)); }} />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-2">Classes in {wing}</div>
                  <div className="space-y-2 max-h-40 overflow-auto pr-1">
                    {classes.map(c=> (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selClasses.includes(c.name)} onChange={e=> { const on=e.target.checked; setSelClasses(prev=> on ? [...prev,c.name]: prev.filter(x=>x!==c.name)); }} />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={()=> setOpenTodo(false)}>Cancel</Button>
                <Button onClick={addTodo} className="gap-2"><Send className="h-4 w-4" />Assign</Button>
              </div>
            </div>
          </Dialog>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-6 w-6" /><div><div className="text-2xl font-semibold">{teachers.length}</div><div className="text-xs text-slate-500">Teachers in {wing}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><GraduationCap className="h-6 w-6" /><div><div className="text-2xl font-semibold">{classes.length}</div><div className="text-xs text-slate-500">Classes in {wing}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><ClipboardList className="h-6 w-6" /><div><div className="text-2xl font-semibold">{todos.filter(t=> t.status!=='Done').length}</div><div className="text-xs text-slate-500">Open To-Dos</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Sparkles className="h-6 w-6" /><div><div className="text-2xl font-semibold">{(planners.reduce((a,b)=> a+b.weekly,0) / (planners.length||1)).toFixed(0)}%</div><div className="text-xs text-slate-500">Avg Weekly Planner</div></div></CardContent></Card>
      </div>

      <Tabs
        defaultActive="overview"
        tabs={[
          { value:'overview', label:'Overview', content: () => (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Planner Snapshot ({wing})</div>
                    <div className="text-xs text-slate-500">Weekly / Monthly / Daily</div>
                  </div>
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planners} barCategoryGap={16}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="className" />
                        <YAxis domain={[0,100]} />
                        <Tooltip />
                        <Bar dataKey="weekly" name="Weekly" fill="#2563eb" />
                        <Bar dataKey="monthly" name="Monthly" fill="#7c3aed" />
                        <Bar dataKey="daily" name="Daily" fill="#059669" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Open To-Dos in {wing}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={()=>{
                        const headers=[{key:'title',label:'Title'},{key:'priority',label:'Priority'},{key:'due',label:'Due'},{key:'recipients',label:'Recipients'},{key:'status',label:'Status'}];
                        const rows = todoForWing.map(t=> ({...t, recipients: recipientsText(t)}));
                        downloadCSV(`todos_${wing}.csv`, rows, headers);
                      }}>CSV</Button>
                      <Button variant="outline" size="sm" onClick={()=>{
                        const headers=[{key:'title',label:'Title'},{key:'priority',label:'Priority'},{key:'due',label:'Due'},{key:'recipients',label:'Recipients'},{key:'status',label:'Status'}];
                        const rows = todoForWing.map(t=> ({...t, recipients: recipientsText(t)}));
                        downloadPDFViaPrint('To-Dos', rows, headers, `todos_${wing}.pdf`);
                      }}>PDF</Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={()=> setOpenTodo(true)}><Plus className="h-4 w-4" />Add</Button>
                    </div>
                  </div>
                  <div className="w-full overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="p-2 text-left">Title</th><th className="p-2 text-left">Priority</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Recipients</th><th className="p-2 text-left">Status</th></tr></thead>
                      <tbody>
                        {todoForWing.map(t=> (
                          <tr key={t.id} className="border-b last:border-0 border-slate-200">
                            <td className="p-2 font-medium">{t.title}</td>
                            <td className="p-2">{priorityBadge(t.priority)}</td>
                            <td className="p-2">{t.due}</td>
                            <td className="p-2 text-xs">{recipientsText(t)}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {statusBadge(t.status)}
                                {t.status !== 'Done' && (
                                  <Button size="sm" variant="outline" onClick={()=> setTodos(prev=> prev.map(x=> x.id===t.id? {...x, status:'Done'}:x))}>Mark Done</Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Publish Windows & Approvals ({wing})</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={()=> setPublishWindows(prev=> { const next={...prev}; classes.forEach(c=> next[c.name]='Locked'); return next; })}>Lock All</Button>
                      <Button variant="outline" size="sm" onClick={()=> setPublishWindows(prev=> { const next={...prev}; classes.forEach(c=> next[c.name]='Open'); return next; })}>Unlock All</Button>
                    </div>
                  </div>
                  <div className="w-full overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="p-2 text-left">Class</th><th className="p-2 text-left">Window</th><th className="p-2 text-left">Approvals</th><th className="p-2 text-left">Quick</th></tr></thead>
                      <tbody>
                        {classes.map(c=> (
                          <tr key={c.id} className="border-b last:border-0 border-slate-200">
                            <td className="p-2 font-medium">{c.name}</td>
                            <td className="p-2">
                              <Select value={publishWindows[c.name]} onChange={e=> setPublishWindows(prev=> ({...prev, [c.name]: e.target.value}))} className="h-8 w-[120px]">
                                <option value="Open">Open</option>
                                <option value="Locked">Locked</option>
                              </Select>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                {['weekly','monthly','daily'].map(k=> (
                                  <label key={k} className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={approvals[c.name][k]} onChange={e=> setApprovals(prev=> ({...prev, [c.name]: { ...prev[c.name], [k]: e.target.checked }}))} />
                                    {k.charAt(0).toUpperCase()+k.slice(1)}
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              <Button size="sm" variant="outline" onClick={()=> setApprovals(prev=> ({...prev, [c.name]: { weekly:true, monthly:true, daily:true }}))}>Approve All</Button>
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
          { value:'planners', label:'Planners', content: () => (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Weekly / Monthly / Daily Progress</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'className',label:'Class'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'},{key:'daily',label:'Daily'}];
                      downloadCSV(`planner_progress_${wing}.csv`, planners, headers);
                    }}>CSV</Button>
                    <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" />Filters</Button>
                  </div>
                </div>
                <div className="h-72 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planners} barCategoryGap={18}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="className" />
                      <YAxis domain={[0,100]} />
                      <Tooltip />
                      <Bar dataKey="weekly" name="Weekly" fill="#2563eb" />
                      <Bar dataKey="monthly" name="Monthly" fill="#7c3aed" />
                      <Bar dataKey="daily" name="Daily" fill="#059669" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )},
          { value:'curriculum', label:'Curriculum', content: () => (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" />Curriculum Completion</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'grade',label:'Grade'},{key:'subject',label:'Subject'},{key:'completion',label:'Completion %'}];
                      const rows = curriculum.map(c=> ({ grade: c.grade, subject: c.subject, completion: c.completion }));
                      downloadCSV(`curriculum_${wing}.csv`, rows, headers);
                    }}>CSV</Button>
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'grade',label:'Grade'},{key:'subject',label:'Subject'},{key:'completion',label:'Completion %'}];
                      const rows = curriculum.map(c=> ({ grade: c.grade, subject: c.subject, completion: c.completion }));
                      downloadPDFViaPrint('Curriculum', rows, headers, `curriculum_${wing}.pdf`);
                    }}>PDF</Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {curriculum.map(c=> (
                    <Card key={c.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Grade {c.grade} • {c.subject}</div>
                          <Badge variant={c.completion>60 ? 'secondary':'outline'}>{c.completion}%</Badge>
                        </div>
                        <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{width:`${c.completion}%`}} />
                        </div>
                        <div className="text-xs text-slate-500">Wing: {c.wing}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )},
          { value:'comm', label:'Communication', content: () => (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="font-semibold">Direct Messages</div>
                <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
                  <Select value={msgRole} onChange={e=> setMsgRole(e.target.value)}>
                    {['Teacher','Headmistress','Class'].map(r=> <option key={r} value={r}>{r}</option>)}
                  </Select>
                  <Select value={msgRecipient} onChange={e=> setMsgRecipient(e.target.value)}>
                    <option value="">Select recipient</option>
                    {msgRole==='Teacher' && teachers.map(t=> <option key={t.id} value={t.name}>{t.name}</option>)}
                    {msgRole==='Headmistress' && WINGS.map(w=> <option key={w} value={`Headmistress (${w})`}>Headmistress ({w})</option>)}
                    {msgRole==='Class' && classes.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                  </Select>
                  <div className="flex gap-2">
                    <Input value={msgBody} onChange={e=> setMsgBody(e.target.value)} placeholder="Type message…" />
                    <Button className="gap-2" onClick={sendMessage}><Send className="h-4 w-4" />Send</Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3 max-h-72 overflow-auto pr-1">
                  {messages.map(m=> (
                    <div key={m.id} className="text-sm border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{m.from} → {m.to} <span className="text-xs text-slate-500">({m.role})</span></div>
                        <div className="text-xs text-slate-500">{m.ts}</div>
                      </div>
                      <div className="mt-1">{m.body}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )},
          { value:'standards', label:'Standards', content: () => (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold flex items-center gap-2"><Sliders className="h-4 w-4" />Standards & Guidelines</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'title',label:'Title'},{key:'tags',label:'Tags'},{key:'version',label:'Version'},{key:'effective',label:'Effective'}];
                      const rows = standards.map(s=> ({ title: s.title, tags: s.tags.join(' | '), version: s.version, effective: s.effective }));
                      downloadCSV('standards.csv', rows, headers);
                    }}>CSV</Button>
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'title',label:'Title'},{key:'tags',label:'Tags'},{key:'version',label:'Version'},{key:'effective',label:'Effective'}];
                      const rows = standards.map(s=> ({ title: s.title, tags: s.tags.join(' | '), version: s.version, effective: s.effective }));
                      downloadPDFViaPrint('Standards', rows, headers, 'standards.pdf');
                    }}>PDF</Button>
                    <Button size="sm" className="gap-2" onClick={()=> setOpenStd(true)}><Plus className="h-4 w-4" />New</Button>
                  </div>
                </div>
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="p-2 text-left">Title</th><th className="p-2 text-left">Tags</th><th className="p-2 text-left">Version</th><th className="p-2 text-left">Effective</th></tr></thead>
                    <tbody>
                      {standards.map(s=> (
                        <tr key={s.id} className="border-b last:border-0 border-slate-200">
                          <td className="p-2 font-medium">
                            {s.title}
                            <div className="text-xs text-slate-500">{s.description}</div>
                          </td>
                          <td className="p-2 text-xs"><div className="flex flex-wrap gap-1">{s.tags.map(t=> <Badge key={t} variant="secondary">{t}</Badge>)}</div></td>
                          <td className="p-2">{s.version}</td>
                          <td className="p-2">{s.effective}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )},
          { value:'policies', label:'Policies', content: () => (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" />NEP/CBSE/Board Alignment & Future Work</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'policy',label:'Policy/Task'},{key:'source',label:'Source'},{key:'due',label:'Due'},{key:'status',label:'Status'}];
                      const rows = policies.map(p=> ({ policy: p.policy, source: p.source, due: p.due, status: p.status }));
                      downloadCSV('policies.csv', rows, headers);
                    }}>CSV</Button>
                    <Button variant="outline" size="sm" onClick={()=> {
                      const headers=[{key:'policy',label:'Policy/Task'},{key:'source',label:'Source'},{key:'due',label:'Due'},{key:'status',label:'Status'}];
                      const rows = policies.map(p=> ({ policy: p.policy, source: p.source, due: p.due, status: p.status }));
                      downloadPDFViaPrint('Policies', rows, headers, 'policies.pdf');
                    }}>PDF</Button>
                    <Button size="sm" className="gap-2" onClick={()=> setOpenPol(true)}><Plus className="h-4 w-4" />New Task</Button>
                  </div>
                </div>
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="p-2 text-left">Policy/Task</th><th className="p-2 text-left">Source</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Status</th></tr></thead>
                    <tbody>
                      {policies.map(p=> (
                        <tr key={p.id} className="border-b last:border-0 border-slate-200">
                          <td className="p-2 font-medium">{p.policy}</td>
                          <td className="p-2">{p.source}</td>
                          <td className="p-2">{p.due}</td>
                          <td className="p-2">
                            <Select value={p.status} onChange={e=> setPolicies(prev=> prev.map(x=> x.id===p.id? {...x, status:e.target.value}:x))} className="h-8 w-[150px]">
                              <option value="Planned">Planned</option>
                              <option value="In Review">In Review</option>
                              <option value="Aligned">Aligned</option>
                              <option value="Blocked">Blocked</option>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        ]}
      />

      {/* Broadcast dialog */}
      <Dialog open={openBroadcast} onClose={setOpenBroadcast} title="Broadcast Templates">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Select value={bTemplate} onChange={e=> setBTemplate(e.target.value)}>
              {['Weekly Planner Reminder','Monthly Planner Reminder','Policy Deadline Nudge'].map(x=> <option key={x} value={x}>{x}</option>)}
            </Select>
            <Select value={bScope} onChange={e=> setBScope(e.target.value)}>
              {['All Teachers in Wing','All Classes in Wing','Specific Class'].map(x=> <option key={x} value={x}>{x}</option>)}
            </Select>
          </div>
          {bScope === 'Specific Class' && (
            <Select value={bClassName} onChange={e=> setBClassName(e.target.value)}>
              <option value="">Choose class</option>
              {classes.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
          )}
          <Textarea value={bMessage || buildBroadcastPreview()} onChange={e=> setBMessage(e.target.value)} placeholder="Message preview" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> setOpenBroadcast(false)}>Cancel</Button>
            <Button onClick={sendBroadcast} className="gap-2"><Send className="h-4 w-4" />Send</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
