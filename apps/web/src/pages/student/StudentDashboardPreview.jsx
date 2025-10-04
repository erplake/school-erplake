import React, { useMemo, useState } from 'react';

export default function StudentDashboardPreview(){
  const student={ name:'Aarav Sharma', grade:'VII', section:'B', roll:17, classTeacher:'Mrs. Kapoor' };
  const subjects=['Math','Science','English','Social Studies','Hindi','Computer Science'];
  const [subjectFilter,setSubjectFilter]=useState('All');
  const [assignments,setAssignments]=useState([
    { id:'as1', type:'Assignment', title:'Linear Equations Worksheet', subject:'Math', due:'2025-10-05', status:'Pending' },
    { id:'as2', type:'Assignment', title:'Lab Report: Plant Cells', subject:'Science', due:'2025-10-07', status:'Pending' },
    { id:'as3', type:'Assignment', title:'Essay: My Favorite Book', subject:'English', due:'2025-10-03', status:'Submitted' },
  ]);
  const [homeworks,setHomeworks]=useState([
    { id:'hw1', type:'Homework', title:'Read Chapter 4 & 5', subject:'Social Studies', due:'2025-10-02', status:'Pending' },
    { id:'hw2', type:'Homework', title:'Programming Basics: Variables Quiz Prep', subject:'Computer Science', due:'2025-10-04', status:'Pending' },
    { id:'hw3', type:'Homework', title:'Poem Recitation Practice', subject:'Hindi', due:'2025-10-01', status:'Submitted' },
  ]);
  const [todos,setTodos]=useState([
    { id:'td1', text:'Pack geometry box', due:'2025-10-01', done:false },
    { id:'td2', text:'Finish English essay draft', due:'2025-10-02', done:false },
    { id:'td3', text:'Submit library book', due:'2025-10-06', done:false },
  ]);
  const [messages,setMessages]=useState([
    { id:'m1', from:'teacher', text:'Hi Aarav, any doubts from today’s Math class?', time:'09:05' },
    { id:'m2', from:'me', text:'Yes, problem #4 was tricky.', time:'09:08' },
    { id:'m3', from:'teacher', text:'Try isolating the variable first. Want a hint?', time:'09:10' },
  ]);
  const [chatInput,setChatInput]=useState('');
  const [doubts,setDoubts]=useState([
    { id:'db1', question:'How to find slope from two points?', status:'answered', answer:'Use (y2 - y1) / (x2 - x1).' },
    { id:'db2', question:'Difference between plant & animal cells?', status:'open' },
  ]);
  const [doubtInput,setDoubtInput]=useState('');
  const [teacherShared]=useState([
    { id:'f1', name:'Algebra Reference.pdf', size:'1.2 MB', uploaded:'2025-09-28' },
    { id:'f2', name:'Science Lab Rubric.docx', size:'88 KB', uploaded:'2025-09-27' },
  ]);
  const [myUploads,setMyUploads]=useState([
    { id:'u1', name:'Worksheet-4.jpg', size:'820 KB', uploaded:'2025-09-29' },
  ]);
  const classmates=[
    { id:'c1', name:'Ishaan', date:'02-14' },
    { id:'c2', name:'Meera', date:'10-02' },
    { id:'c3', name:'Vihaan', date:'10-12' },
    { id:'c4', name:'Aanya', date:'11-01' },
  ];
  const [announcements]=useState([
    { id:'an1', title:'PTM slots open for booking', body:'Parents can choose a slot between Oct 10–12 from the portal.', date:'2025-09-30', priority:'Normal' },
    { id:'an2', title:'Science Fair: Team formation', body:'Form teams of 3–4 by Oct 8. Theme: Everyday Physics.', date:'2025-09-29', priority:'High' },
  ]);
  const [teacherNotes]=useState([
    { id:'tn1', note:'Great participation in class discussion. Keep it up!', from:'Mrs. Kapoor', date:'2025-09-28' },
    { id:'tn2', note:'Revise Linear Equations — focus on word problems.', from:'Mr. Iyer', date:'2025-09-27' },
  ]);

  const filteredAssignments = useMemo(()=> subjectFilter==='All'? assignments: assignments.filter(a=>a.subject===subjectFilter),[assignments,subjectFilter]);
  const filteredHomeworks = useMemo(()=> subjectFilter==='All'? homeworks: homeworks.filter(a=>a.subject===subjectFilter),[homeworks,subjectFilter]);
  const pendingCount = assignments.filter(a=>a.status==='Pending').length + homeworks.filter(h=>h.status==='Pending').length;

  function markSubmitted(id,type){ if(type==='Assignment'){ setAssignments(list=> list.map(a=>a.id===id?{...a,status:'Submitted'}:a)); } else { setHomeworks(list=> list.map(h=>h.id===id?{...h,status:'Submitted'}:h)); } }
  function toggleTodo(id){ setTodos(prev=> prev.map(t=>t.id===id?{...t,done:!t.done}:t)); }
  function sendChat(){ const t=chatInput.trim(); if(!t) return; const time=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); setMessages(m=>[...m,{id:`m${m.length+1}`,from:'me',text:t,time}]); setChatInput(''); }
  function submitDoubt(){ const q=doubtInput.trim(); if(!q) return; setDoubts(d=>[{id:`db${d.length+1}`,question:q,status:'open'},...d]); setDoubtInput(''); }
  function resolveDoubt(id){ setDoubts(d=> d.map(x=>x.id===id?{...x,status:'answered',answer:'Marked as resolved.'}:x)); }
  function handleUpload(e){ const files=Array.from(e.target.files||[]); if(!files.length) return; const items=files.slice(0,10).map((f,i)=>({ id:`u${Date.now()}-${i}`, name:f.name, size:`${(f.size/1024).toFixed(0)} KB`, uploaded:new Date().toISOString().slice(0,10) })); setMyUploads(prev=>[...items,...prev]); e.target.value=''; }
  function removeUpload(id){ setMyUploads(prev=>prev.filter(x=>x.id!==id)); }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Welcome, <span className="text-indigo-600">{student.name}</span></h1>
            <p className="text-slate-500 text-sm mt-1">Grade {student.grade} • Section {student.section} • Roll #{student.roll} • Class Teacher: {student.classTeacher}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-slate-500">Subject</label>
              <select value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)} className="h-9 rounded-md border px-3 text-sm bg-white">
                <option>All</option>
                {subjects.map(s=> <option key={s}>{s}</option>)}
              </select>
            </div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-600 ring-1 ring-inset ring-indigo-200">Pending: <strong className="ml-1 text-indigo-700">{pendingCount}</strong></span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Assignments & Homework</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ListPanel title="Assignments" items={filteredAssignments} empty="No assignments." onSubmit={id=>markSubmitted(id,'Assignment')} />
              <ListPanel title="Homework" items={filteredHomeworks} empty="No homework." onSubmit={id=>markSubmitted(id,'Homework')} />
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">To-dos</h2>
            <ul className="divide-y text-sm">
              {todos.map(t=> <li key={t.id} className="py-2 flex items-center justify-between"><div className="flex items-center gap-3"><input type="checkbox" checked={t.done} onChange={()=>toggleTodo(t.id)} className="h-4 w-4"/><div><p className={t.done?'line-through text-slate-500':''}>{t.text}</p><p className="text-[11px] text-slate-500">Due {t.due}</p></div></div><span className={[ 'px-2 py-0.5 rounded-full text-[11px] ring-1', t.done?'bg-emerald-50 text-emerald-700 ring-emerald-200':'bg-amber-50 text-amber-700 ring-amber-200'].join(' ')}>{t.done?'Done':'Pending'}</span></li>)}
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Chat with {student.classTeacher}</h2>
            <div className="h-72 overflow-y-auto rounded-md bg-slate-50 p-3 ring-1 ring-slate-200 text-sm">
              {messages.map(m=> <div key={m.id} className={`mb-3 flex ${m.from==='me'?'justify-end':'justify-start'}`}><div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.from==='me'?'bg-indigo-600 text-white':'bg-white ring-1 ring-slate-200 text-slate-900'}`}><p>{m.text}</p><p className={`mt-1 text-[10px] ${m.from==='me'?'text-indigo-200':'text-slate-500'}`}>{m.time}</p></div></div>)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') sendChat(); }} placeholder="Type a message…" className="flex-1 rounded-md border px-3 py-2 text-sm" />
              <ButtonLike onClick={sendChat}>Send</ButtonLike>
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold">Doubts & Clarifications</h2>
            <div className="flex items-center gap-2">
              <input value={doubtInput} onChange={e=>setDoubtInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') submitDoubt(); }} placeholder="Ask a doubt…" className="flex-1 rounded-md border px-3 py-2 text-sm" />
              <ButtonLike onClick={submitDoubt}>Add</ButtonLike>
            </div>
            <ul className="divide-y">
              {doubts.map(d=> <li key={d.id} className="py-3 text-sm"><div className="flex items-start justify-between gap-3"><div><p>{d.question}</p><p className="mt-1 text-[11px] text-slate-500">{d.status==='answered'? `Answer: ${d.answer}`:'Waiting for response'}</p></div><span className={`px-2 py-0.5 rounded-full text-[11px] ring-1 ${d.status==='answered'?'bg-emerald-50 text-emerald-700 ring-emerald-200':'bg-amber-50 text-amber-700 ring-amber-200'}`}>{d.status==='answered'?'Answered':'Open'}</span></div>{d.status!=='answered' && <div className="mt-2"><button onClick={()=>resolveDoubt(d.id)} className="text-[11px] text-indigo-600">Mark resolved</button></div>}</li>)}
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Shared Drive (Class Files & Your Uploads)</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">From Teacher</h3>
                <ul className="divide-y">{teacherShared.map(f=> <li key={f.id} className="py-2 flex items-center justify-between"><div><p>{f.name}</p><p className="text-[11px] text-slate-500">{f.size} • {f.uploaded}</p></div><a href="#" onClick={e=>e.preventDefault()} className="text-[11px] text-indigo-600">Download</a></li>)}</ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Your Uploads</h3>
                <div className="mb-2 flex items-center gap-2">
                  <input id="upload" type="file" multiple onChange={handleUpload} className="hidden" />
                  <label htmlFor="upload" className="cursor-pointer rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500">Upload files</label>
                  <p className="text-[11px] text-slate-500">up to 10 / upload (demo)</p>
                </div>
                <ul className="divide-y">{myUploads.map(f=> <li key={f.id} className="py-2 flex items-center justify-between"><div><p>{f.name}</p><p className="text-[11px] text-slate-500">{f.size} • {f.uploaded}</p></div><button onClick={()=>removeUpload(f.id)} className="text-[11px] text-rose-600">Remove</button></li>)}</ul>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-4 shadow-sm text-sm">
            <h2 className="text-sm font-semibold mb-2">Storage Policy (Prefixes)</h2>
            <ul className="list-disc ml-5 space-y-1 text-[11px] text-slate-600">
              <li>Teacher → /classes/{student.grade}-{student.section}/teacher/…</li>
              <li>Teacher reads /teacher/… + /students/{'{roll}'}/…</li>
              <li>Student → /classes/{student.grade}-{student.section}/students/{student.roll}/…</li>
              <li>Student reads /teacher/… only</li>
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">Announcements</h2>
            <ul className="divide-y text-sm">{announcements.map(a=> <li key={a.id} className="py-3 flex items-start justify-between gap-3"><div><p className="font-medium">{a.title}</p><p className="text-slate-700 text-sm">{a.body}</p><p className="mt-1 text-[11px] text-slate-500">{a.date}</p></div><span className={`px-2 py-0.5 text-[11px] rounded-full ring-1 ${a.priority==='High'?'bg-rose-50 text-rose-700 ring-rose-200':'bg-sky-50 text-sky-700 ring-sky-200'}`}>{a.priority}</span></li>)}</ul>
          </section>
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">Teacher Notes</h2>
            <ul className="divide-y text-sm">{teacherNotes.map(n=> <li key={n.id} className="py-3"><p>{n.note}</p><p className="mt-1 text-[11px] text-slate-500">— {n.from}, {n.date}</p></li>)}</ul>
          </section>
        </div>

        <BirthdayList classmates={classmates} />
        <footer className="text-center text-[11px] text-slate-500">Student self-service • Demo only.</footer>
      </div>
    </div>
  );
}

function ListPanel({ title, items, empty, onSubmit }){
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-slate-700">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.length===0 && <li className="rounded-md bg-slate-50 p-3 text-slate-500 ring-1 ring-slate-200">{empty}</li>}
        {items.map(it=> <li key={it.id} className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{it.title}</p><p className="text-[11px] text-slate-500">{it.subject} • Due {it.due}</p></div><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full text-[11px] ring-1 ${it.status==='Submitted'?'bg-emerald-50 text-emerald-700 ring-emerald-200':'bg-amber-50 text-amber-700 ring-amber-200'}`}>{it.status}</span>{it.status!=='Submitted' && <button onClick={()=>onSubmit(it.id)} className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-500">Submit</button>}</div></div></li>)}
      </ul>
    </div>
  );
}

function BirthdayList({ classmates }){
  const upcoming = useMemo(()=> {
    function next(mmdd){ const [mm,dd]=mmdd.split('-').map(n=>parseInt(n,10)); const now=new Date(); let cand=new Date(now.getFullYear(),mm-1,dd); if(cand < new Date(now.getFullYear(), now.getMonth(), now.getDate())) cand.setFullYear(now.getFullYear()+1); return cand; }
    function daysUntil(date){ const now=new Date(); const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()); const end=new Date(date.getFullYear(),date.getMonth(),date.getDate()); return Math.round((end-start)/(1000*60*60*24)); }
    return classmates.map(c=> ({...c, next: next(c.date)})).sort((a,b)=>a.next-b.next).slice(0,4).map(c=> ({...c, days: daysUntil(c.next)}));
  },[classmates]);
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm mt-6">
      <h2 className="text-sm font-semibold mb-3">Upcoming Class Birthdays</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {upcoming.map(c=> <div key={c.id} className="rounded-xl border bg-white p-3 text-xs"><p className="font-medium">{c.name}</p><p className="text-slate-500">{c.date}</p><p className="mt-1 text-indigo-600">in {c.days} day(s)</p></div>)}
      </div>
    </section>
  );
}

function ButtonLike({ children, onClick }){ return <button onClick={onClick} className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500">{children}</button>; }
