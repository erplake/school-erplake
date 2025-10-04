import React, { useState, useMemo } from 'react';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Select } from '../../components/ui/Select.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

// --- demo data (trimmed from attachment) ---
const ACADEMIC_YEARS = ["2024-25", "2025-26"]; 
const TERMS = ["First Term", "Second Term"]; 
const CLASSES = ["Nursery","KG","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"]; 
const CLASS_OPTIONS = ["All", ...CLASSES];
const SUBJECTS = ["English","Mathematics","Science","Social Science","Hindi","Computer Science","Physical Education","Art","EVS","Physics","Chemistry","Biology"]; 
const SUBJECT_OPTIONS = ["All", ...SUBJECTS];

function chaptersFor(subject, cls){
  const cap = s=> s.charAt(0).toUpperCase()+s.slice(1);
  const u1 = { unit: '1', title: `${cap(subject)} Basics`, blooms: 'Remember/Understand', outcomes:[`Identifies core ideas of ${subject.toLowerCase()}`,`Explains simple examples for Class ${cls}`], competencies:['Critical thinking','Communication'], artIntegrated: subject==='English'||subject==='Art', sportsIntegrated: subject==='Physical Education' };
  const u2 = { unit: '2', title: `${cap(subject)} Applications`, blooms: 'Apply/Analyze', outcomes:[`Applies concepts of ${subject.toLowerCase()} in daily life`,`Solves level-appropriate problems`], competencies:['Problem solving','Scientific temper'], artIntegrated: subject==='Mathematics'||subject==='Science', sportsIntegrated: subject==='Physical Education' };
  return [u1,u2];
}

function seedCurriculum(){
  // simplified generator (omitted lines in attachment replaced by representative subset)
  const data=[];
  const pushCourse=(cls,subject)=>{ data.push({ id:`${cls}-${subject}`, class:cls, subject, book:`NCERT ${subject} ${cls}`, refBook:`Ref ${subject} ${cls}`, chapters: chaptersFor(subject, cls) }); };
  const lower=['I','II','III','IV','V']; lower.forEach(c=>['English','Mathematics','EVS'].forEach(s=>pushCourse(c,s)));
  const middle=['VI','VII','VIII']; middle.forEach(c=>['English','Mathematics','Science','Social Science'].forEach(s=>pushCourse(c,s)));
  const secondary=['IX','X']; secondary.forEach(c=>['English','Mathematics','Science'].forEach(s=>pushCourse(c,s)));
  const senior=['XI','XII']; senior.forEach(c=>['English','Mathematics','Physics','Chemistry','Biology'].forEach(s=>pushCourse(c,s)));
  return data;
}
const curriculum = seedCurriculum();

// rubric (trimmed)
const rubric = [
  { key:'mapsLO', label:'Mapped to specific NCERT LO', weight:20 },
  { key:'experiential', label:'Experiential learning task', weight:15 },
  { key:'caseBased', label:'Case/competency-based assessment', weight:20 },
  { key:'artSports', label:'Art/Sports integration', weight:10 },
  { key:'inclusion', label:'Inclusion & differentiation', weight:10 },
  { key:'multilingual', label:'Multilingual/local context', weight:10 },
  { key:'bloomsVariety', label:"Bloom's variety (R/U/A/An/E/C)", weight:10 },
  { key:'docsReady', label:'Blueprint/rubrics/keys documented', weight:5 },
];
function scoreAlignment(a){ if(!a) return 0; return rubric.reduce((acc,r)=>acc+(a[r.key]?r.weight:0),0); }

const Pill = ({ children, tone='neutral' }) => {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium';
  const tones = { neutral:'bg-slate-50 text-slate-600', ok:'bg-emerald-50 text-emerald-700 border-emerald-200', warn:'bg-amber-50 text-amber-700 border-amber-200' };
  return <span className={`${base} ${tones[tone]||tones.neutral}`}>{children}</span>;
};

export default function CurriculumPlanner(){
  const [role,setRole]=useState('Headmistress');
  const [year,setYear]=useState(ACADEMIC_YEARS[1]);
  const [term,setTerm]=useState(TERMS[0]);
  const [klass,setKlass]=useState('All');
  const [subject,setSubject]=useState('All');
  const [query,setQuery]=useState('');
  const [selectedUnit,setSelectedUnit]=useState('1');
  const [align,setAlign]=useState({ mapsLO:true, experiential:true, caseBased:true, artSports:false, inclusion:true, multilingual:false, bloomsVariety:true, docsReady:false, skills21C:['Critical thinking','Problem solving'] });
  const alignScore = useMemo(()=>scoreAlignment(align),[align]);

  const selectedCourses = useMemo(()=>{
    const filtered = curriculum.filter(c => (klass==='All'||c.class===klass) && (subject==='All'||c.subject===subject));
    return filtered;
  },[klass,subject]);
  const currentCourse = selectedCourses[0];
  const currentChapter = useMemo(()=> currentCourse?.chapters.find(ch=>ch.unit===selectedUnit),[currentCourse, selectedUnit]);

  const coveragePercent = useMemo(()=>{
    if(!selectedCourses.length) return 0; // placeholder for omitted calculation
    return Math.round((selectedCourses.length / curriculum.length) * 100);
  },[selectedCourses]);

  const filterChapters = (chs) => chs.filter(ch => !query || ch.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Curriculum Planner</h1>
          <p className="text-sm text-slate-500">Role-aware curriculum mapping & NEP/CBE alignment.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Role:</span>
          <Button variant={role==='Headmistress'?'primary':'ghost'} onClick={()=>setRole('Headmistress')}>Headmistress</Button>
          <Button variant={role==='Teacher'?'primary':'ghost'} onClick={()=>setRole('Teacher')}>Teacher</Button>
        </div>
      </header>

      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <div>
            <label className="block text-[11px] font-medium mb-1">Academic Year</label>
            <select className="w-full border rounded-md h-9 px-2" value={year} onChange={e=>setYear(e.target.value)}>{ACADEMIC_YEARS.map(y=> <option key={y}>{y}</option>)}</select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1">Term</label>
            <select className="w-full border rounded-md h-9 px-2" value={term} onChange={e=>setTerm(e.target.value)}>{TERMS.map(t=> <option key={t}>{t}</option>)}</select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1">Class</label>
            <select className="w-full border rounded-md h-9 px-2" value={klass} onChange={e=>setKlass(e.target.value)}>{CLASS_OPTIONS.map(c=> <option key={c}>{c}</option>)}</select>
          </div>
            <div>
            <label className="block text-[11px] font-medium mb-1">Subject</label>
            <select className="w-full border rounded-md h-9 px-2" value={subject} onChange={e=>setSubject(e.target.value)}>{SUBJECT_OPTIONS.map(s=> <option key={s}>{s}</option>)}</select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium mb-1">Search Chapters</label>
            <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter..." />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="rounded-xl border p-3 flex flex-col">
            <span className="text-[11px] text-slate-500">Selected Courses</span>
            <span className="text-lg font-semibold">{selectedCourses.length}</span>
          </div>
          <div className="rounded-xl border p-3 flex flex-col">
            <span className="text-[11px] text-slate-500">Coverage (demo)</span>
            <span className="text-lg font-semibold">{coveragePercent}%</span>
          </div>
          <div className="rounded-xl border p-3 flex flex-col">
            <span className="text-[11px] text-slate-500">Alignment Score</span>
            <span className="text-lg font-semibold">{alignScore}</span>
          </div>
        </div>
      </div>

      {/* Course / chapter detail */}
      {currentCourse && (
        <div className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">{currentCourse.class} – {currentCourse.subject}</h2>
              <p className="text-xs text-slate-500">Book: {currentCourse.book} | Ref: {currentCourse.refBook}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">Select Unit:</span>
              <select className="border rounded-md h-8 px-2" value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)}>
                {currentCourse.chapters.map(ch=> <option key={ch.unit} value={ch.unit}>{ch.unit}</option>)}
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Unit</th>
                <th className="py-2 text-left font-medium">Chapter</th>
                <th className="py-2 text-left font-medium">Outcomes</th>
                <th className="py-2 text-left font-medium">Competencies</th>
                <th className="py-2 text-left font-medium">Blooms</th>
                <th className="py-2 text-left font-medium">Integrations</th>
              </tr>
            </thead>
            <tbody>
              {filterChapters(currentCourse.chapters).map(ch => (
                <tr key={ch.unit} className="border-b last:border-none">
                  <td className="py-2 align-top font-medium">{ch.unit}</td>
                  <td className="py-2 align-top">{ch.title}</td>
                  <td className="py-2 align-top space-y-1 text-xs">{ch.outcomes.map(o=> <div key={o} className="flex items-start gap-1"><span className="h-1.5 w-1.5 mt-1 rounded-full bg-slate-400"/> <span>{o}</span></div>)}</td>
                  <td className="py-2 align-top space-y-1 text-[11px]">{ch.competencies.map(c=> <div key={c}>{c}</div>)}</td>
                  <td className="py-2 align-top text-[11px]">{ch.blooms}</td>
                  <td className="py-2 align-top text-[11px] space-x-1">
                    {ch.artIntegrated && <Pill tone="ok">Art</Pill>}
                    {ch.sportsIntegrated && <Pill tone="warn">Sports</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-slate-500">Future: approval workflow, version history, per-school template library, competency dashboards.</p>
    </div>
  );
}
