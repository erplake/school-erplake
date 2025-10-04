import React from 'react';
import { exportRowsAsCSV } from '../../utils/csv';

// Expanded Career Counselling module with Scholarships / Exams / Mentors / Tasks / Analytics
// Includes modals & student detail drawer. All data is client-side mock for now.

export default function CareerCounsellingPage(){
  const roles = ["Student", "Counselor", "Principal", "Parent"];
  const [role, setRole] = React.useState("Principal");
  const [tab, setTab] = React.useState("Overview");
  const [search, setSearch] = React.useState("");
  const [grade, setGrade] = React.useState("All");
  const [modal, setModal] = React.useState(null); // {type, payload}
  const [toast, setToast] = React.useState(null);
  const [detail, setDetail] = React.useState(null); // selected student
  const [mentorFilter, setMentorFilter] = React.useState('All');
  const [scholarshipFilter, setScholarshipFilter] = React.useState('All');
  const [examsFilter, setExamsFilter] = React.useState('All');
  const [tasksFilter, setTasksFilter] = React.useState('All');

  const grades = ["All", "IX", "X", "XI", "XII"]; 

  const students = React.useMemo(()=>[
    { id: "S-101", name: "Ananya Gupta", grade: "XII", cluster: "Investigative · Artistic", interests: ["Biotech","Design Thinking"], dream:["Biomedical Engineer"], counselor: "Ms. Rao", nextStep: "Finalize college list", assessment:{aptitude:82,interest:90,personality:76}, deadlines:3, progress:68 },
    { id: "S-102", name: "Irfan Khan", grade: "XI", cluster: "Realistic · Conventional", interests: ["Aviation","Automotive"], dream:["Aeronautical Technician"], counselor: "Mr. Dutta", nextStep: "Book 1:1 slot", assessment:{aptitude:74,interest:71,personality:80}, deadlines:1, progress:35 },
    { id: "S-103", name: "Meera Nair", grade: "X", cluster: "Social · Enterprising", interests: ["Psychology","Public Speaking"], dream:["Clinical Psychologist"], counselor: "Ms. Rao", nextStep: "Attempt interest test", assessment:{aptitude:61,interest:0,personality:0}, deadlines:0, progress:10 },
    { id: "S-104", name: "Rahul Verma", grade: "XII", cluster: "Investigative · Realistic", interests: ["CS/AI","Robotics"], dream:["AI Engineer"], counselor: "Mr. Dutta", nextStep: "Draft SOP v1", assessment:{aptitude:88,interest:92,personality:70}, deadlines:5, progress:74 },
  ],[]);

  const pathways = [
    { id:"eng", title:"Engineering (B.Tech)", tracks:["CS/AI","Mechanical","ECE"], prereqs:"PCM in XII, JEE Mains/Adv", colleges:["IIT Delhi","NIT Trichy","IIIT Hyderabad"] },
    { id:"med", title:"Medicine (MBBS)", tracks:["General","Pediatrics","Orthopedics"], prereqs:"PCB in XII, NEET-UG", colleges:["AIIMS Delhi","CMC Vellore","JIPMER"] },
    { id:"law", title:"Law (BA/LLB)", tracks:["Corporate","IPR","Criminal"], prereqs:"Any stream, CLAT/AILET", colleges:["NLSIU Bengaluru","NALSAR","NLU Delhi"] },
    { id:"design", title:"Design (B.Des)", tracks:["UX","Product","Communication"], prereqs:"Any stream, NID/UCEED", colleges:["NID Ahmedabad","IIT Bombay (IDC)","MIT Pune"] },
    { id:"commerce", title:"Commerce/Management", tracks:["B.Com","BBA","FinTech"], prereqs:"Accountancy preferred, CUET/IPMAT", colleges:["SRCC","NMIMS","Christ University"] },
  ];

  const [scholarships, setScholarships] = React.useState([
    { id:1, name: "INSPIRE Scholarship", type: "Merit", deadline: "2025-11-30", grade: "XII", amount:'80k/yr', status:'Open' },
    { id:2, name: "Saksham (AICTE)", type: "Need-based", deadline: "2025-12-15", grade: "XI–XII", amount:'60k/yr', status:'Open' },
    { id:3, name: "KVPY Fellowship", type: "Research", deadline: "2025-10-20", grade: "XI–XII", amount:'Variable', status:'Closing Soon' },
  ]);

  const [exams, setExams] = React.useState([
    { id:11, name: "JEE Main (Session 1)", date: "2026-01-24", target: "XII", regBy:'2025-11-02', type:'Entrance' },
    { id:12, name: "NEET-UG", date: "2026-05-03", target: "XII", regBy:'2026-01-10', type:'Entrance' },
    { id:13, name: "CLAT", date: "2025-12-07", target: "XI–XII", regBy:'2025-11-03', type:'Entrance' },
  ]);

  const [mentors, setMentors] = React.useState([
    { id:101, name:'Alumni - Riya S', domain:'Design', availability:'Wed 4–6pm', sessions:8, students:5 },
    { id:102, name:'Industry - Rahul K', domain:'Data Science', availability:'Sat 11–1pm', sessions:5, students:3 },
    { id:103, name:'Alumni - Mehul T', domain:'Biomedical', availability:'Fri 5–6pm', sessions:6, students:4 },
  ]);

  const [tasks, setTasks] = React.useState([
    { id:201, student:'Ananya Gupta', title:'Upload draft SOP', due:'2025-10-04', status:'Pending' },
    { id:202, student:'Rahul Verma', title:'Shortlist 8 colleges', due:'2025-10-02', status:'In Progress' },
    { id:203, student:'Irfan Khan', title:'Book aptitude test slot', due:'2025-10-06', status:'Pending' },
  ]);

  const mentorDomains = React.useMemo(()=>['All', ...new Set(mentors.map(m=>m.domain))],[mentors]);

  const filteredStudents = students.filter(s => (grade==='All'||s.grade===grade) && (search==='' || [s.name,s.cluster,...s.interests,...s.dream].join(' ').toLowerCase().includes(search.toLowerCase())));
  const filteredScholarships = scholarships.filter(s => (scholarshipFilter==='All'|| s.grade.includes(scholarshipFilter)) && (search===''|| s.name.toLowerCase().includes(search.toLowerCase())) );
  const filteredExams = exams.filter(e => (examsFilter==='All'|| e.target.includes(examsFilter)) && (search===''|| e.name.toLowerCase().includes(search.toLowerCase())) );
  const filteredMentors = mentors.filter(m => (mentorFilter==='All'|| m.domain===mentorFilter) && (search==='' || m.name.toLowerCase().includes(search.toLowerCase()) || m.domain.toLowerCase().includes(search.toLowerCase())) );
  const filteredTasks = tasks.filter(t => (tasksFilter==='All'|| t.status===tasksFilter));

  const kpis = [
    { label: "Students Engaged", value: 312, sub: "+18 this week" },
    { label: "1:1 Bookings (Oct)", value: 47, sub: "12 pending confirmation" },
    { label: "Upcoming Deadlines", value: filteredExams.length + filteredScholarships.length, sub: "exams + scholarships" },
    { label: "Open Scholarships", value: filteredScholarships.length, sub: "filter by grade" },
  ];

  function notify(msg){ setToast(msg); setTimeout(()=> setToast(null), 2500); }
  function exportCSV(rows, filename='export.csv'){
    if(!rows.length) return notify('Nothing to export');
    const headers = Object.keys(rows[0]);
    const dataRows = rows.map(r=> headers.map(h=> r[h] ?? ''));
    exportRowsAsCSV(headers, dataRows, { filename, bom:true });
  }
  function progressBar(pct){ return <div className="flex-1 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-sky-500" style={{width:`${pct}%`}} /></div>; }

  function openModal(type,payload){ setModal({type,payload}); }
  function closeModal(){ setModal(null); }
  function handleCreate(data){
    switch(data.kind){
      case 'scholarship':
        setScholarships(s=>[...s,{ id:Date.now(), name:data.name, type:data.type, deadline:data.deadline, grade:data.grade, amount:data.amount||'—', status:'Open' }]);
        notify('Scholarship added'); break;
      case 'exam':
        setExams(e=>[...e,{ id:Date.now(), name:data.name, date:data.date, target:data.target, regBy:data.regBy||data.date, type:data.type||'Entrance' }]);
        notify('Exam scheduled'); break;
      case 'mentorSession':
        notify('Session booked'); break;
      case 'task':
        setTasks(t=>[...t,{ id:Date.now(), student:data.student, title:data.title, due:data.due, status:'Pending' }]);
        notify('Task assigned'); break;
      default: break;
    }
    closeModal();
  }

  // Shell & shared UI
  const Shell = ({children}) => (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/75 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl font-semibold tracking-tight">Career Counselling</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-sky-100 text-sky-700 border border-sky-200">Single-tenant · School</span>
          <div className="ml-auto flex items-center gap-2">
            <FilterSelect value={role} onChange={e=>setRole(e.target.value)} label="Role" options={roles} />
            <FilterSelect value={grade} onChange={e=>setGrade(e.target.value)} label="Grade" options={grades} />
            <SearchBox value={search} onChange={setSearch} placeholder="Search students, careers, exams..." />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="max-w-7xl mx-auto px-4 pb-10 text-xs text-slate-500">© Your School · Counselling Desk</footer>
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
  const Card = ({ title, subtitle, right, children }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          {title && <div className="text-sm font-medium text-slate-900">{title}</div>}
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
  const Tabs = ({ items }) => (
    <div className="flex flex-wrap gap-2 mb-3">{items.map(t=> <button key={t} onClick={()=>setTab(t)} className={"px-3 py-1.5 rounded-full border text-sm "+(tab===t?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-700 border-slate-200 hover:bg-slate-100")}>{t}</button>)}</div>
  );
  const FilterSelect = ({ value,onChange,label,options }) => (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <select value={value} onChange={onChange} className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
        {options.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
  const SearchBox = ({ value,onChange,placeholder }) => <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-72 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />;
  const TinyTag = ({ children, tone='slate' }) => <span className={`px-2 py-0.5 rounded-full text-[11px] bg-${tone}-100 text-${tone}-700 border border-${tone}-200`}>{children}</span>;
  const Toast = ({ children }) => <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">{children}</div>;
  const Drawer = ({ open, onClose, children, title }) => (
    <div className={"fixed inset-0 z-40 "+(open?'' :'pointer-events-none')}>
      <div className={"absolute inset-0 bg-slate-900/40 transition-opacity "+(open?'opacity-100':'opacity-0')} onClick={onClose} />
      <div className={"absolute top-0 right-0 h-full w-[380px] bg-white shadow-xl border-l border-slate-200 flex flex-col transform transition-transform "+(open?'translate-x-0':'translate-x-full')}>
        <div className="px-4 py-3 border-b flex items-center justify-between"><h2 className="font-medium text-sm">{title}</h2><button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">Close</button></div>
        <div className="p-4 overflow-y-auto text-sm flex-1">{children}</div>
      </div>
    </div>
  );
  const Modal = ({ open, title, children, onClose, onSubmit, submitLabel='Save' }) => (
    <div className={"fixed inset-0 z-50 flex items-end md:items-center justify-center "+(open?'':'pointer-events-none')}>
      <div className={"absolute inset-0 bg-slate-900/40 transition-opacity "+(open?'opacity-100':'opacity-0')} onClick={onClose} />
      <div className={"relative w-full md:w-[480px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-slate-200 transform transition-all "+(open?'translate-y-0 opacity-100':'translate-y-6 opacity-0')}>
        <form onSubmit={e=>{e.preventDefault(); onSubmit();}} className="flex flex-col max-h-[85vh]">
          <div className="px-5 py-4 border-b flex items-center justify-between"><h3 className="font-medium text-sm tracking-wide text-slate-700 uppercase">{title}</h3><button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button></div>
          <div className="p-5 overflow-y-auto text-sm space-y-4">{children}</div>
          <div className="px-5 py-4 border-t bg-slate-50 flex gap-2 justify-end"><button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border">Cancel</button><button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">{submitLabel}</button></div>
        </form>
      </div>
    </div>
  );

  // Tabs
  const Overview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {kpis.map(k=> <Card key={k.label} title={k.label} subtitle={k.sub} right={<span className="text-2xl font-bold">{k.value}</span>} />)}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Roadmap by Grade" subtitle="Recommended flow for the year">
          <ol className="text-sm grid gap-2">
            <li><b>IX</b> · Explore careers · Shadow interviews · Club activities</li>
            <li><b>X</b> · Aptitude & interest tests · Stream selection support</li>
            <li><b>XI</b> · Deep-dive pathways · Build portfolio · Mentorship</li>
            <li><b>XII</b> · Applications · SOP/LORs · Exams · Scholarships</li>
          </ol>
        </Card>
        <Card title="This Month" subtitle="Sessions · Workshops · Exams">
          <ul className="text-sm grid gap-2">
            <li>Workshop: "Intro to Design Careers" · Fri 4pm</li>
            <li>Parent Q&A: Entrance exams landscape · Sat 11am</li>
            <li>Mock interview clinic · Rolling slots</li>
          </ul>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-sky-600 text-white" onClick={()=>openModal('mentorSession')}>Book 1:1</button>
            <button className="px-3 py-1.5 rounded-lg border" onClick={()=>notify('Added to calendar')}>Add to Calendar</button>
          </div>
        </Card>
      </div>
      <Card title="Announcements" subtitle="Broadcast to selected grades/parents">
        <div className="flex gap-2">
          <input className="flex-1 border rounded-xl px-3 py-2 text-sm" placeholder="Type a short announcement…" />
          <button className="px-3 py-2 rounded-xl bg-slate-900 text-white" onClick={()=>notify("Announcement sent")}>Send</button>
        </div>
      </Card>
      <Card title="Upcoming Deadlines" subtitle="Exams & applications (next 60 days)">
        <ul className="text-sm grid gap-2">
          {filteredExams.map(e=> <li key={e.id} className="flex items-center justify-between"><span>{e.name} · <span className="text-slate-500">{e.target}</span></span><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700 border border-sky-200">{e.date}</span></li> )}
        </ul>
      </Card>
    </div>
  );

  const StudentsTab = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>openModal('task')}>Assign to Selected</button>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>exportCSV(filteredStudents,'students.csv')}>Export CSV</button>
        <span className="text-sm text-slate-500 ml-auto">{filteredStudents.length} shown</span>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr>{['Student','Grade','Cluster','Interests','Dream','Counselor','Next Step','Progress', role!== 'Parent' ? 'Actions': null].filter(Boolean).map(h=> <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {filteredStudents.map(s=> (
              <tr key={s.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={()=>setDetail(s)}>
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2">{s.grade}</td>
                <td className="px-3 py-2 text-slate-600">{s.cluster}</td>
                <td className="px-3 py-2 flex flex-wrap gap-1">{s.interests.map(i=> <TinyTag key={i}>{i}</TinyTag>)}</td>
                <td className="px-3 py-2 flex flex-wrap gap-1">{s.dream.map(d=> <TinyTag key={d} tone="sky">{d}</TinyTag>)}</td>
                <td className="px-3 py-2">{s.counselor}</td>
                <td className="px-3 py-2 text-slate-700">{s.nextStep}</td>
                <td className="px-3 py-2 w-48"><div className="flex items-center gap-2">{progressBar(s.progress)}<span className="text-xs text-slate-600 w-8 text-right">{s.progress}%</span></div></td>
                {role !== 'Parent' && <td className="px-3 py-2"><div className="flex gap-2"><button className="px-2 py-1 text-xs border rounded-lg" onClick={(e)=>{e.stopPropagation(); openModal('task',{student:s.name});}}>Task</button><button className="px-2 py-1 text-xs border rounded-lg" onClick={(e)=>{e.stopPropagation(); notify('Note (stub)')}}>Note</button></div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PathwaysTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {pathways.map(p=> (
        <Card key={p.id} title={p.title} subtitle={p.tracks.join(' · ')} right={<button className="px-2 py-1 text-xs rounded-lg border" onClick={()=>notify('Added to plan')}>Add</button>}>
          <div className="text-sm">
            <div className="text-slate-600">Prerequisites: {p.prereqs}</div>
            <div className="mt-2">
              <div className="text-slate-600 mb-1">Top Colleges</div>
              <div className="flex flex-wrap gap-1">{p.colleges.map(c=> <TinyTag key={c} tone="emerald">{c}</TinyTag>)}</div>
            </div>
            <div className="mt-3 text-xs text-slate-500">Resources: syllabus, sample papers, alumni stories</div>
          </div>
        </Card>
      ))}
    </div>
  );

  const ScholarshipsTab = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={scholarshipFilter} onChange={e=>setScholarshipFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm">{['All','IX','X','XI','XII'].map(g=> <option key={g}>{g}</option>)}</select>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>openModal('scholarship')}>Add Scholarship</button>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>exportCSV(filteredScholarships,'scholarships.csv')}>Export CSV</button>
        <span className="text-sm text-slate-500 ml-auto">{filteredScholarships.length} shown</span>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Name','Type','Grade','Deadline','Amount','Status'].map(h=> <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{filteredScholarships.map(s=> <tr key={s.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{s.name}</td><td className="px-3 py-2">{s.type}</td><td className="px-3 py-2">{s.grade}</td><td className="px-3 py-2">{s.deadline}</td><td className="px-3 py-2">{s.amount}</td><td className="px-3 py-2">{s.status}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );

  const ExamsTab = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={examsFilter} onChange={e=>setExamsFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm">{['All','XI','XII'].map(g=> <option key={g}>{g}</option>)}</select>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>openModal('exam')}>Schedule Exam</button>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>exportCSV(filteredExams,'exams.csv')}>Export CSV</button>
        <span className="text-sm text-slate-500 ml-auto">{filteredExams.length} shown</span>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Name','Target','Exam Date','Reg By','Type'].map(h=> <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{filteredExams.map(e=> <tr key={e.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{e.name}</td><td className="px-3 py-2">{e.target}</td><td className="px-3 py-2">{e.date}</td><td className="px-3 py-2">{e.regBy}</td><td className="px-3 py-2">{e.type}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );

  const MentorsTab = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={mentorFilter} onChange={e=>setMentorFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm">{mentorDomains.map(d=> <option key={d}>{d}</option>)}</select>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>openModal('mentorSession')}>Book Session</button>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>exportCSV(filteredMentors,'mentors.csv')}>Export CSV</button>
        <span className="text-sm text-slate-500 ml-auto">{filteredMentors.length} shown</span>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Mentor','Domain','Availability','Sessions','Students'].map(h=> <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{filteredMentors.map(m=> <tr key={m.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{m.name}</td><td className="px-3 py-2">{m.domain}</td><td className="px-3 py-2">{m.availability}</td><td className="px-3 py-2">{m.sessions}</td><td className="px-3 py-2">{m.students}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );

  const TasksTab = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={tasksFilter} onChange={e=>setTasksFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm">{['All','Pending','In Progress','Done'].map(s=> <option key={s}>{s}</option>)}</select>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>openModal('task')}>Assign Task</button>
        <button className="px-3 py-1.5 rounded-lg border" onClick={()=>exportCSV(filteredTasks,'tasks.csv')}>Export CSV</button>
        <span className="text-sm text-slate-500 ml-auto">{filteredTasks.length} shown</span>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Student','Task','Due','Status'].map(h=> <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{filteredTasks.map(t=> <tr key={t.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{t.student}</td><td className="px-3 py-2">{t.title}</td><td className="px-3 py-2">{t.due}</td><td className="px-3 py-2">{t.status}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="grid md:grid-cols-3 gap-4">
      <Card title="Assessment Completion" subtitle="% of students by assessment type">
        <div className="space-y-2 text-xs mt-2">
          {[['Aptitude',82],['Interest',64],['Personality',51]].map(r=> (
            <div key={r[0]} className="flex items-center gap-2"><span className="w-20 text-slate-600">{r[0]}</span><div className="flex-1 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-emerald-500 rounded-full" style={{width:r[1]+'%'}} /></div><span className="w-8 text-right text-slate-500">{r[1]}%</span></div>
          ))}
        </div>
      </Card>
      <Card title="Popular Pathways" subtitle="Top adds in last 30d">
        <ol className="text-sm mt-2 space-y-1 list-decimal list-inside">
          <li>Engineering (B.Tech)</li>
          <li>Design (B.Des)</li>
          <li>Medicine (MBBS)</li>
          <li>Law (BA LLB)</li>
        </ol>
      </Card>
      <Card title="Upcoming Volume" subtitle="Deadlines next 30 days">
        <div className="mt-3 grid gap-2 text-xs">
          <div className="flex items-center justify-between"><span className="text-slate-600">Scholarships</span><span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">{filteredScholarships.length}</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-600">Exams</span><span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">{filteredExams.length}</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-600">Tasks Due</span><span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">{filteredTasks.filter(t=>t.status!=='Done').length}</span></div>
        </div>
      </Card>
    </div>
  );

  // Modal builders
  function modalContent(){
    if(!modal) return null;
    const common = { className:'w-full px-3 py-2 rounded-lg border text-sm' };
    switch(modal.type){
      case 'scholarship': { const data={}; return <Modal open title="Add Scholarship" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'scholarship'})}>
          <div className="grid gap-3">
            <input {...common} placeholder="Name" onChange={e=>data.name=e.target.value} required />
            <div className="grid grid-cols-2 gap-3">
              <select {...common} defaultValue="Merit" onChange={e=>data.type=e.target.value}><option>Merit</option><option>Need-based</option><option>Research</option></select>
              <select {...common} defaultValue="XII" onChange={e=>data.grade=e.target.value}><option>IX</option><option>X</option><option>XI</option><option>XII</option></select>
            </div>
            <input type="date" {...common} onChange={e=>data.deadline=e.target.value} required />
            <input {...common} placeholder="Amount / Benefit" onChange={e=>data.amount=e.target.value} />
          </div>
        </Modal>; }
      case 'exam': { const data={}; return <Modal open title="Schedule Exam" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'exam'})}>
          <div className="grid gap-3">
            <input {...common} placeholder="Exam Name" onChange={e=>data.name=e.target.value} required />
            <div className="grid grid-cols-2 gap-3">
              <select {...common} defaultValue="XII" onChange={e=>data.target=e.target.value}><option>XI</option><option>XII</option><option>XI–XII</option></select>
              <select {...common} defaultValue="Entrance" onChange={e=>data.type=e.target.value}><option>Entrance</option><option>Olympiad</option><option>Scholarship</option></select>
            </div>
            <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
            <input type="date" {...common} onChange={e=>data.regBy=e.target.value} />
          </div>
        </Modal>; }
      case 'mentorSession': { const data={}; return <Modal open title="Book Mentor Session" submitLabel="Book" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'mentorSession'})}>
          <div className="grid gap-3">
            <select {...common} defaultValue={mentors[0]?.id} onChange={e=>data.mentorId=e.target.value}>{mentors.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
            <input type="time" {...common} onChange={e=>data.time=e.target.value} required />
            <input {...common} placeholder="Student Name" onChange={e=>data.student=e.target.value} required />
          </div>
        </Modal>; }
      case 'task': { const data={ student: modal.payload?.student || ''}; return <Modal open title="Assign Task" submitLabel="Assign" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'task'})}>
          <div className="grid gap-3">
            <input {...common} defaultValue={data.student} placeholder="Student" onChange={e=>data.student=e.target.value} required />
            <input {...common} placeholder="Task Title" onChange={e=>data.title=e.target.value} required />
            <input type="date" {...common} onChange={e=>data.due=e.target.value} required />
          </div>
        </Modal>; }
      default: return null;
    }
  }

  function studentDetailDrawer(){
    if(!detail) return null;
    const s = detail;
    return <Drawer open={!!detail} onClose={()=>setDetail(null)} title={s.name}>
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Profile</div>
          <div className="mt-1 text-sm text-slate-600">Grade {s.grade} • Counselor {s.counselor}</div>
          <div className="mt-2 flex flex-wrap gap-1">{s.interests.map(i=> <TinyTag key={i}>{i}</TinyTag>)}{s.dream.map(d=> <TinyTag key={d} tone="sky">{d}</TinyTag>)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Assessments</div>
          <div className="mt-2 space-y-1 text-xs">{Object.entries(s.assessment).map(([k,v])=> <div key={k} className="flex items-center gap-2"><span className="w-20 capitalize text-slate-600">{k}</span><div className="flex-1 h-2 bg-slate-200 rounded-full"><div className="h-2 bg-emerald-500 rounded-full" style={{width:v+'%'}} /></div><span className="w-8 text-right text-slate-500">{v}%</span></div>)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Next Step</div>
          <div className="mt-1 text-sm">{s.nextStep}</div>
          <div className="mt-3 flex gap-2"><button onClick={()=>openModal('task',{student:s.name})} className="px-3 py-1.5 rounded-lg border text-xs">Assign Task</button><button onClick={()=>openModal('mentorSession')} className="px-3 py-1.5 rounded-lg border text-xs">Book 1:1</button></div>
        </div>
      </div>
    </Drawer>;
  }

  return (
    <Shell>
      <Tabs items={["Overview","Students","Pathways","Scholarships","Exams","Mentors","Tasks","Analytics"]} />
      {tab==='Overview' && <Overview />}
      {tab==='Students' && <StudentsTab />}
      {tab==='Pathways' && <PathwaysTab />}
      {tab==='Scholarships' && <ScholarshipsTab />}
      {tab==='Exams' && <ExamsTab />}
      {tab==='Mentors' && <MentorsTab />}
      {tab==='Tasks' && <TasksTab />}
      {tab==='Analytics' && <AnalyticsTab />}
      {studentDetailDrawer()}
      {modalContent()}
    </Shell>
  );
}
