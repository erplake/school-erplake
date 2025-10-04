import React, { useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Separator } from '../../components/ui/Separator.jsx';

// Lightweight shims for table and tabs using simple markup (since original referenced shadcn variants not in repo)
function Table({ children }){ return <table className="w-full text-sm border-collapse">{children}</table>; }
function THead({ children }){ return <thead className="bg-slate-50 text-xs text-slate-600">{children}</thead>; }
function TBody({ children }){ return <tbody className="divide-y">{children}</tbody>; }
function TR({ children }){ return <tr className="border-b last:border-0">{children}</tr>; }
function TH({ children }){ return <th className="px-2 py-2 text-left font-medium">{children}</th>; }
function TD({ children }){ return <td className="px-2 py-2 align-top">{children}</td>; }

function Tabs({ value, onChange, tabs }){
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => <button key={t.value} onClick={()=>onChange(t.value)} className={[ 'px-3 py-1.5 rounded-md border text-xs', value===t.value? 'bg-slate-900 text-white border-slate-900':'bg-white hover:bg-slate-50'].join(' ')}>{t.label}</button>)}
      </div>
      <div>{tabs.find(t=>t.value===value)?.children}</div>
    </div>
  );
}

const WINGS = ['Primary','Junior','Middle','Senior'];
const TEACHERS = [
  { id:'t1', name:'Anita Sharma', wing:'Primary', classes:['1A','1B'] },
  { id:'t2', name:'Rahul Verma', wing:'Junior', classes:['4A'] },
  { id:'t3', name:'Meera Iyer', wing:'Middle', classes:['7A','7B'] },
  { id:'t4', name:'Joseph Mathew', wing:'Senior', classes:['11 Sci','12 Sci'] },
  { id:'t5', name:'Farah Khan', wing:'Junior', classes:['5A','5B'] },
];
const CLASSES = [
  { id:'c1', name:'1A', wing:'Primary', grade:1 },
  { id:'c2', name:'1B', wing:'Primary', grade:1 },
  { id:'c3', name:'4A', wing:'Junior', grade:4 },
  { id:'c4', name:'5A', wing:'Junior', grade:5 },
  { id:'c5', name:'7A', wing:'Middle', grade:7 },
  { id:'c6', name:'7B', wing:'Middle', grade:7 },
  { id:'c7', name:'11 Sci', wing:'Senior', grade:11 },
  { id:'c8', name:'12 Sci', wing:'Senior', grade:12 },
];
const INITIAL_TODOS=[
  { id:'td1', title:'Collect parent consent forms', priority:'High', due:'2025-10-03', status:'Pending', recipients:{ teachers:['t1','t2'], classes:[] } },
  { id:'td2', title:'Upload weekly lesson plan', priority:'Medium', due:'2025-10-01', status:'In-Progress', recipients:{ teachers:['t3'], classes:['7A','7B'] } },
  { id:'td3', title:'Lab safety brief', priority:'Low', due:'2025-10-07', status:'Pending', recipients:{ teachers:['t4'], classes:['11 Sci','12 Sci'] } },
];
const PLANNER_PROGRESS=[
  { className:'1A', wing:'Primary', weekly:80, monthly:60, daily:85 },
  { className:'5A', wing:'Junior', weekly:65, monthly:50, daily:70 },
  { className:'7A', wing:'Middle', weekly:55, monthly:40, daily:60 },
  { className:'11 Sci', wing:'Senior', weekly:40, monthly:35, daily:45 },
];
const CURRICULUM=[
  { id:'cur1', wing:'Primary', grade:1, subject:'Math', completion:42 },
  { id:'cur2', wing:'Primary', grade:1, subject:'English', completion:58 },
  { id:'cur3', wing:'Junior', grade:5, subject:'Science', completion:36 },
  { id:'cur4', wing:'Middle', grade:7, subject:'History', completion:25 },
  { id:'cur5', wing:'Senior', grade:12, subject:'Physics', completion:18 },
];
const INITIAL_STANDARDS=[
  { id:'std1', title:'Homework load limits', description:'Max 30 mins/day (Primary), 45 mins (Junior/Middle)', tags:['Guideline','Wellbeing'], version:'1.1', effective:'2025-10-01' },
  { id:'std2', title:'Lesson plan checklist', description:'NEP-aligned outcomes, formative assessment, activity-based', tags:['NEP','CBSE'], version:'2.0', effective:'2025-09-20' },
];
const INITIAL_POLICIES=[
  { id:'pol1', policy:'Implement Foundational Literacy & Numeracy (FLN)', source:'NEP 2020', due:'2025-12-15', status:'In Review' },
  { id:'pol2', policy:'CBSE Board Practical Record Digitization', source:'CBSE Circular 45/2025', due:'2025-11-20', status:'Pending' },
  { id:'pol3', policy:'AI Ethics in Classrooms', source:'Govt Advisory', due:'2026-01-10', status:'Planned' },
];
const MESSAGES=[
  { id:'m1', from:'Headmistress (Junior)', to:'Rahul Verma', role:'Teacher', body:'Reminder: Upload monthly planner by Wed.', ts:'2025-09-29 09:40' },
  { id:'m2', from:'Headmistress (Senior)', to:'Headmistress (Middle)', role:'Headmistress', body:'Share your lab-safety template?', ts:'2025-09-28 12:15' },
];

function badgeStatus(s){ const map={Pending:'bg-amber-100 text-amber-700', 'In-Progress':'bg-blue-100 text-blue-700', Done:'bg-emerald-100 text-emerald-700'}; return <span className={`px-2 py-1 rounded text-[11px] ${map[s]||'bg-slate-100 text-slate-700'}`}>{s}</span>; }
function badgePriority(p){ const map={High:'bg-red-100 text-red-700', Medium:'bg-amber-100 text-amber-800', Low:'bg-emerald-100 text-emerald-700'}; return <span className={`px-2 py-1 rounded text-[11px] ${map[p]}`}>{p}</span>; }

export default function WingConsole(){
  const [wing,setWing]=useState('Junior');
  const teachers=useMemo(()=>TEACHERS.filter(t=>t.wing===wing),[wing]);
  const wingClasses=useMemo(()=>CLASSES.filter(c=>c.wing===wing),[wing]);
  const planners=useMemo(()=>PLANNER_PROGRESS.filter(p=>p.wing===wing),[wing]);
  const curriculum=useMemo(()=>CURRICULUM.filter(c=>c.wing===wing),[wing]);

  const [todos,setTodos]=useState(INITIAL_TODOS);
  const [messages,setMessages]=useState(MESSAGES);
  const [standards,setStandards]=useState(INITIAL_STANDARDS);
  const [policies,setPolicies]=useState(INITIAL_POLICIES);

  const [todoModal,setTodoModal]=useState(false);
  const [todoTitle,setTodoTitle]=useState('');
  const [todoPriority,setTodoPriority]=useState('Medium');
  const [todoDue,setTodoDue]=useState('');
  const [selTeachers,setSelTeachers]=useState([]);
  const [selClasses,setSelClasses]=useState([]);

  const todoForWing = useMemo(()=> todos.filter(td => td.recipients.teachers.some(id=>teachers.some(t=>t.id===id)) || td.recipients.classes.some(n=>wingClasses.some(c=>c.name===n))), [todos,teachers,wingClasses]);
  const avgWeekly = useMemo(()=> planners.length? Math.round(planners.reduce((a,b)=>a+b.weekly,0)/planners.length):0,[planners]);
  const pendingTodos = useMemo(()=> todoForWing.filter(t=>t.status!=='Done').length,[todoForWing]);

  function addTodo(){ if(!todoTitle || (!selTeachers.length && !selClasses.length)) return; const newTodo={ id:`td${Date.now()}`, title:todoTitle, priority:todoPriority, due: todoDue || new Date().toISOString().slice(0,10), status:'Pending', recipients:{ teachers:selTeachers, classes:selClasses } }; setTodos(p=>[newTodo,...p]); setTodoTitle(''); setTodoPriority('Medium'); setTodoDue(''); setSelTeachers([]); setSelClasses([]); setTodoModal(false); }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">Headmistress Wing Console</h1>
          <p className="text-sm text-slate-500">Assign to-dos, track planners & curriculum, set standards, coordinate within a wing.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={wing} onChange={e=>setWing(e.target.value)} className="h-9 rounded-md border px-2 text-sm bg-white">
            {WINGS.map(w=> <option key={w}>{w}</option>)}
          </select>
          <Button size="sm" onClick={()=>setTodoModal(true)}>New To-Do</Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3"><div className="text-2xl font-semibold">{teachers.length}</div><div className="text-xs text-slate-500">Teachers in {wing}</div></div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3"><div className="text-2xl font-semibold">{wingClasses.length}</div><div className="text-xs text-slate-500">Classes in {wing}</div></div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3"><div className="text-2xl font-semibold">{pendingTodos}</div><div className="text-xs text-slate-500">Open To-Dos</div></div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3"><div className="text-2xl font-semibold">{avgWeekly}%</div><div className="text-xs text-slate-500">Avg Weekly Planner</div></div>
      </div>

      <Tabs value={/* default */'overview'} onChange={()=>{}} tabs={[]} />
      {/* Simplified: show overview + todos inline (skip multi-tab for now) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="font-semibold mb-2">Planner Snapshot ({wing})</div>
            <Table>
              <THead><TR><TH>Class</TH><TH>Weekly</TH><TH>Monthly</TH><TH>Daily</TH></TR></THead>
              <TBody>{planners.map(p=> <TR key={p.className}><TD>{p.className}</TD><TD>{p.weekly}%</TD><TD>{p.monthly}%</TD><TD>{p.daily}%</TD></TR>)}</TBody>
            </Table>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="font-semibold mb-3 flex items-center justify-between">Curriculum Completion <span className="text-xs text-slate-500">Wing {wing}</span></div>
            <div className="grid sm:grid-cols-2 gap-3">
              {curriculum.map(c=> <div key={c.id} className="rounded-lg border p-3 text-xs space-y-2"><div className="flex items-center justify-between"><span className="font-medium">Grade {c.grade} • {c.subject}</span><Badge variant={c.completion>60?'default':'secondary'}>{c.completion}%</Badge></div><div className="h-2 w-full rounded bg-slate-100 overflow-hidden"><div className="h-full bg-slate-900" style={{width:`${c.completion}%`}}/></div></div>)}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between mb-3"><div className="font-semibold">Open To-Dos in {wing}</div><Button size="sm" variant="outline" onClick={()=>setTodoModal(true)}>Add</Button></div>
            <Table>
              <THead><TR><TH>Title</TH><TH>Priority</TH><TH>Due</TH><TH>Recipients</TH><TH>Status</TH></TR></THead>
              <TBody>{todoForWing.map(t=> <TR key={t.id}><TD className="font-medium">{t.title}</TD><TD>{badgePriority(t.priority)}</TD><TD>{t.due}</TD><TD className="text-[11px]"><div className="flex flex-wrap gap-1">{t.recipients.teachers.map(id=>{ const tch=TEACHERS.find(x=>x.id===id); return tch? <Badge key={id} variant="secondary">{tch.name}</Badge>:null; })}{t.recipients.classes.map(n=> <Badge key={n}>{n}</Badge>)}</div></TD><TD><div className="flex items-center gap-2">{badgeStatus(t.status)}{t.status!=='Done' && <Button size="xs" variant="ghost" onClick={()=>setTodos(prev=>prev.map(x=>x.id===t.id?{...x,status:'Done'}:x))}>Done</Button>}</div></TD></TR>)}</TBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={todoModal} onClose={()=>setTodoModal(false)} title="New To-Do" footer={<><Button variant="ghost" onClick={()=>setTodoModal(false)}>Cancel</Button><Button onClick={addTodo}>Assign</Button></>}>
        <div className="space-y-3 text-xs">
          <Input placeholder="Title" value={todoTitle} onChange={e=>setTodoTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select value={todoPriority} onChange={e=>setTodoPriority(e.target.value)} className="h-8 rounded-md border px-2 text-xs">{['High','Medium','Low'].map(p=> <option key={p}>{p}</option>)}</select>
            <Input type="date" value={todoDue} onChange={e=>setTodoDue(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-[11px] font-medium">Teachers in {wing}</div>
              <div className="max-h-40 overflow-auto space-y-1 pr-1">
                {teachers.map(t=> <label key={t.id} className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={selTeachers.includes(t.id)} onChange={e=>{const on=e.target.checked; setSelTeachers(prev=> on?[...prev,t.id]:prev.filter(x=>x!==t.id));}} />{t.name}</label>)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[11px] font-medium">Classes in {wing}</div>
              <div className="max-h-40 overflow-auto space-y-1 pr-1">
                {wingClasses.map(c=> <label key={c.id} className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={selClasses.includes(c.name)} onChange={e=>{const on=e.target.checked; setSelClasses(prev=> on?[...prev,c.name]:prev.filter(x=>x!==c.name));}} />{c.name}</label>)}
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <p className="text-[11px] text-slate-400">Preview: Wing Console (compressed vs original attachment). Future: charts, messaging, standards & policy tabs.</p>
    </div>
  );
}
