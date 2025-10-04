import React, { useState, useMemo } from 'react';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

// Canonical Advanced Lesson & Curriculum Planner (replaces earlier MVP)
// Combines curriculum mapping with weekly planning in one simplified page.
// Future roadmap (not implemented): approvals workflow, outcome coverage analytics, blueprint diffing, export/print.

const ACADEMIC_YEARS=['2024-25','2025-26'];
const CLASSES=['Nursery','KG','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const SUBJECTS=['English','Mathematics','Science','Social Science','Hindi','Computer Science','Physical Education','Art','EVS'];

function genChapters(subject){
  return [
    { unit:'1', title:`Intro to ${subject}`, outcomes:[`Understands basics of ${subject}`], competencies:['Thinking'], blooms:'Understand', artIntegrated: subject==='Art', sportsIntegrated: subject==='Physical Education' },
    { unit:'2', title:`Applied ${subject}`, outcomes:['Applies core concepts'], competencies:['Problem solving'], blooms:'Apply', artIntegrated:false, sportsIntegrated:false },
  ];
}
const curriculum = CLASSES.flatMap(c => SUBJECTS.slice(0,3).map(s => ({ class:c, subject:s, book:`NCERT ${s} ${c}`, refBook:`Ref ${s}`, chapters: genChapters(s) })));

export default function LessonPlanner(){
  const [role,setRole]=useState('Headmistress');
  const [year,setYear]=useState(ACADEMIC_YEARS[0]);
  const [klass,setKlass]=useState('VII');
  const [subject,setSubject]=useState('Science');
  const [tab,setTab]=useState('curriculum');
  const [weeklyPlans,setWeeklyPlans]=useState([]);
  const [planOpen,setPlanOpen]=useState(false);
  const [newPlan,setNewPlan]=useState({ weekOf:'', activities:'', assessments:'', resources:'' });
  const course = useMemo(()=> curriculum.find(c=>c.class===klass && c.subject===subject),[klass,subject]);

  function addPlan(){
    if(!newPlan.weekOf) return;
    setWeeklyPlans(p=>[
      { id:Date.now(), weekOf:newPlan.weekOf, activities:newPlan.activities.split(/\n|,/).filter(Boolean), assessments:newPlan.assessments.split(/\n|,/).filter(Boolean), resources:newPlan.resources.split(/\n|,/).filter(Boolean), status:'Draft' },
      ...p,
    ]);
    setPlanOpen(false);
    setNewPlan({ weekOf:'', activities:'', assessments:'', resources:'' });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lesson & Curriculum Planner</h1>
          <p className="text-sm text-slate-500">Advanced unified view (canonical).</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium">Role:</span>
          <Button variant={role==='Headmistress'?'default':'outline'} size="sm" onClick={()=>setRole('Headmistress')}>Headmistress</Button>
          <Button variant={role==='Teacher'?'default':'outline'} size="sm" onClick={()=>setRole('Teacher')}>Teacher</Button>
        </div>
      </header>
      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div><label className="block text-[11px] mb-1 font-medium">Year</label><select value={year} onChange={e=>setYear(e.target.value)} className="w-full h-8 rounded-md border px-2">{ACADEMIC_YEARS.map(y=> <option key={y}>{y}</option>)}</select></div>
          <div><label className="block text-[11px] mb-1 font-medium">Class</label><select value={klass} onChange={e=>setKlass(e.target.value)} className="w-full h-8 rounded-md border px-2">{CLASSES.map(c=> <option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-[11px] mb-1 font-medium">Subject</label><select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full h-8 rounded-md border px-2">{SUBJECTS.map(s=> <option key={s}>{s}</option>)}</select></div>
          <div className="flex items-end gap-2 col-span-2 md:col-span-1">
            <Button size="sm" onClick={()=>setPlanOpen(true)}>New Weekly Plan</Button>
          </div>
          <div className="flex gap-2 text-xs items-end">
            <button className={cnTab(tab==='curriculum')} onClick={()=>setTab('curriculum')}>Curriculum</button>
            <button className={cnTab(tab==='weekly')} onClick={()=>setTab('weekly')}>Weekly Plans</button>
          </div>
        </div>
        {tab==='curriculum' && course && (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b"><th className="py-2 text-left">Unit</th><th className="py-2 text-left">Chapter</th><th className="py-2 text-left">Outcomes</th><th className="py-2 text-left">Competencies</th><th className="py-2 text-left">Blooms</th><th className="py-2 text-left">Integrations</th></tr></thead>
              <tbody>{course.chapters.map(ch => (
                <tr key={ch.unit} className="border-b last:border-none">
                  <td className="py-2 align-top font-medium">{ch.unit}</td>
                  <td className="py-2 align-top">{ch.title}</td>
                  <td className="py-2 align-top space-y-1">{ch.outcomes.map(o=> <div key={o} className="flex items-start gap-1"><span className="h-1.5 w-1.5 mt-1 rounded-full bg-slate-400"/><span>{o}</span></div>)}</td>
                  <td className="py-2 align-top space-y-1 text-[11px]">{ch.competencies.map(c=> <div key={c}>{c}</div>)}</td>
                  <td className="py-2 align-top text-[11px]">{ch.blooms}</td>
                  <td className="py-2 align-top text-[11px] space-x-1">{ch.artIntegrated && <Badge variant="secondary">Art</Badge>}{ch.sportsIntegrated && <Badge variant="outline">Sports</Badge>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {tab==='weekly' && (
          <div className="grid gap-3 md:grid-cols-2">
            {weeklyPlans.map(p => (
              <div key={p.id} className="rounded-xl border p-3 space-y-2 bg-white text-xs">
                <div className="flex items-start justify-between"><div><div className="font-medium">Week of {p.weekOf}</div></div><Badge>{p.status}</Badge></div>
                <div><div className="font-medium mb-0.5">Activities</div><ul className="list-disc ml-4 space-y-0.5">{p.activities.map(a=> <li key={a}>{a}</li>)}</ul></div>
                <div><div className="font-medium mb-0.5">Assessments</div><ul className="list-disc ml-4 space-y-0.5">{p.assessments.map(a=> <li key={a}>{a}</li>)}</ul></div>
                <div><div className="font-medium mb-0.5">Resources</div><ul className="list-disc ml-4 space-y-0.5">{p.resources.map(a=> <li key={a}>{a}</li>)}</ul></div>
              </div>
            ))}
            {weeklyPlans.length===0 && <p className="text-xs text-slate-500">No weekly plans yet.</p>}
          </div>
        )}
      </div>

      <Dialog open={planOpen} onClose={()=>setPlanOpen(false)} title="New Weekly Plan" footer={<><Button variant="ghost" onClick={()=>setPlanOpen(false)}>Cancel</Button><Button onClick={addPlan}>Save</Button></>}>
        <div className="space-y-3 text-xs">
          <div><label className="block text-[11px] mb-1 font-medium">Week Of</label><Input type="date" value={newPlan.weekOf} onChange={e=>setNewPlan(p=>({...p,weekOf:e.target.value}))} /></div>
          <div><label className="block text-[11px] mb-1 font-medium">Activities</label><Textarea rows={3} value={newPlan.activities} onChange={e=>setNewPlan(p=>({...p,activities:e.target.value}))} /></div>
          <div><label className="block text-[11px] mb-1 font-medium">Assessments</label><Textarea rows={3} value={newPlan.assessments} onChange={e=>setNewPlan(p=>({...p,assessments:e.target.value}))} /></div>
          <div><label className="block text-[11px] mb-1 font-medium">Resources</label><Textarea rows={3} value={newPlan.resources} onChange={e=>setNewPlan(p=>({...p,resources:e.target.value}))} /></div>
        </div>
      </Dialog>
      <p className="text-[10px] text-slate-400">This is the advanced canonical planner. Legacy MVP removed.</p>
    </div>
  );
}

function cnTab(active){ return ['px-3 py-1.5 rounded-md border', active?'bg-slate-900 text-white border-slate-900':'bg-white hover:bg-slate-50'].join(' '); }
// (Legacy assessment dialog code removed in advanced canonical version)
