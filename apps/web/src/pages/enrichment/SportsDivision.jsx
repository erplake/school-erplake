import React, { useState, useMemo } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';

// Sports Division extended: Overview, Teams, Students, Planner, Competitions, Feedback, Periods, Fixtures, Equipment, Budget

const Pill = ({active,children,onClick}) => <button onClick={onClick} className={`px-3 py-1.5 rounded-full border text-sm ${active?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>{children}</button>;
const Button = ({className='',...p}) => <button className={'px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50 '+className}{...p}/>;
const Modal = ({open,title,children,onClose,onSubmit,submitLabel='Save'}) => (
  <div className={`fixed inset-0 z-50 ${open?'':'pointer-events-none'}`}>
    <div className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open?'opacity-100':'opacity-0'}`} onClick={onClose}/>
    <div className={`absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[520px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-slate-200 transform transition-all ${open?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
      <form onSubmit={e=>{e.preventDefault(); onSubmit();}} className="flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b flex items-center justify-between"><h3 className="text-sm font-semibold tracking-wide uppercase text-slate-700">{title}</h3><button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button></div>
        <div className="p-5 flex-1 overflow-y-auto text-sm space-y-4">{children}</div>
        <div className="px-5 py-4 border-t bg-slate-50 flex justify-end gap-2"><button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border">Cancel</button><button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">{submitLabel}</button></div>
      </form>
    </div>
  </div>
);
const Toast = ({children}) => <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow">{children}</div>;

export default function SportsDivision(){
  const [wing,setWing] = useState('Senior');
  const [sport,setSport] = useState('Football');
  const [season,setSeason] = useState('AY 2025-26');
  const [search,setSearch] = useState('');
  const [tab,setTab] = useState('Overview');
  const [modal,setModal] = useState(null); // {type,payload}
  const [contextTeam,setContextTeam] = useState(null); // team for roster mgmt
  const [toast,setToast] = useState(null);

  const sports = ['Football','Cricket','Basketball','Badminton','Athletics','Swimming','Table Tennis'];
  const wings = ['Junior','Middle','Senior'];
  const seasons = ['AY 2024-25','AY 2025-26'];

  const [teams,setTeams] = useState([
    { id:1, sport:'Football', teamName:'U17 Boys A', gender:'Boys', level:'U17', coach:'Mr. Arora', captain:'Rahil', roster:18, nextMatch:'2025-10-05', w:5, l:2 },
    { id:2, sport:'Football', teamName:'U14 Girls A', gender:'Girls', level:'U14', coach:'Ms. Menon', captain:'Jiya', roster:16, nextMatch:'2025-10-06', w:4, l:1 },
    { id:3, sport:'Basketball', teamName:'Senior Boys', gender:'Boys', level:'Senior', coach:'Mr. Bose', captain:'Ishaan', roster:12, nextMatch:'2025-10-08', w:6, l:3 },
    { id:4, sport:'Athletics', teamName:'Track Core', gender:'Unified', level:'Senior', coach:'Coach Priya', captain:'N/A', roster:22, nextMatch:'2025-10-12', w:0, l:0 },
  ]);

  // Student pool (all kids of school summary subset mock)
  const [students,setStudents] = useState([
    { id:101, name:'Aarav Sharma', grade:9, section:'A', interests:['Football'], fitness:'Good', assignedTeam:1 },
    { id:102, name:'Vivaan Mehta', grade:9, section:'B', interests:['Football','Athletics'], fitness:'Excellent', assignedTeam:1 },
    { id:103, name:'Riya Patel', grade:8, section:'A', interests:['Basketball'], fitness:'Good', assignedTeam:null },
    { id:104, name:'Ishita Nair', grade:7, section:'C', interests:['Athletics'], fitness:'Average', assignedTeam:4 },
    { id:105, name:'Kabir Khan', grade:10, section:'A', interests:['Basketball','Football'], fitness:'Excellent', assignedTeam:3 },
    { id:106, name:'Neha Gupta', grade:7, section:'B', interests:['Athletics'], fitness:'Good', assignedTeam:4 },
  ]);

  // Weekly planner sessions
  const [sessions,setSessions] = useState([
    { id:1, day:'Mon', time:'07:30', sport:'Football', team:1, coach:'Mr. Arora', focus:'Passing drills' },
    { id:2, day:'Tue', time:'07:30', sport:'Basketball', team:3, coach:'Mr. Bose', focus:'Defense sets' },
    { id:3, day:'Wed', time:'07:30', sport:'Athletics', team:4, coach:'Coach Priya', focus:'Sprint intervals' },
  ]);

  // Competitions (inter/intra school)
  const [competitions,setCompetitions] = useState([
    { id:1, name:'District Football Cup', type:'Inter School', date:'2025-11-10', sport:'Football', level:'U17', status:'Registration', teamsInvolved:[1], venue:'City Stadium' },
    { id:2, name:'Annual Sports Day Heats', type:'Intra School', date:'2025-12-05', sport:'Athletics', level:'All', status:'Planning', teamsInvolved:[4], venue:'School Track' },
  ]);

  // PE feedback
  const [feedback,setFeedback] = useState([
    { id:1, studentId:101, date:'2025-09-25', area:'Endurance', rating:4, comment:'Improved stamina.', coach:'Mr. Arora' },
    { id:2, studentId:103, date:'2025-09-27', area:'Teamwork', rating:5, comment:'Great collaboration.', coach:'Mr. Bose' },
  ]);

  // Sports periods (scheduled curricular periods)
  const [periods,setPeriods] = useState([
    { id:1, grade:9, section:'A', day:'Mon', slot:'09:00-09:45', sport:'Football', facility:'Field', coach:'Mr. Arora' },
    { id:2, grade:8, section:'A', day:'Tue', slot:'10:00-10:45', sport:'Basketball', facility:'Indoor Court', coach:'Mr. Bose' },
  ]);

  const [fixtures,setFixtures] = useState([
    { id:11, date:'2025-10-05', sport:'Football', team:'U17 Boys A', opponent:'DPS RK Puram', venue:'Home', status:'Scheduled', transport:'Bus-03' },
    { id:12, date:'2025-10-06', sport:'Football', team:'U14 Girls A', opponent:'Modern School', venue:'Away', status:'Scheduled', transport:'Bus-02' },
    { id:13, date:'2025-10-08', sport:'Basketball', team:'Senior Boys', opponent:'Bluebells', venue:'Home', status:'Rescheduled', transport:'Van-01' },
    { id:14, date:'2025-10-12', sport:'Athletics', team:'Track Core', opponent:'Inter-School Meet', venue:'Stadium', status:'Registration Open', transport:'Bus-01' },
  ]);

  const [equipment,setEquipment] = useState([
    { id:'eq1', sport:'Football', item:'Match Ball', qty:18, status:'In Use' },
    { id:'eq2', sport:'Basketball', item:'Indoor Ball', qty:12, status:'Available' },
    { id:'eq3', sport:'Athletics', item:'Stopwatches', qty:6, status:'Available' },
  ]);
  const [budget,setBudget] = useState([
    { id:'b1', category:'Equipment', planned:200000, used:125000 },
    { id:'b2', category:'Travel', planned:150000, used:40000 },
    { id:'b3', category:'Coaching', planned:180000, used:120000 },
  ]);
  // Removed: Injuries, Facilities, House Points, Attendance per new spec

  function notify(msg){ setToast(msg); setTimeout(()=>setToast(null),2200); }
  function exportCSV(rows, filename='export.csv'){
    if(!rows.length) return notify('Nothing to export');
    const headers = Object.keys(rows[0]);
    const dataRows = rows.map(r=> headers.map(h=> r[h] ?? ''));
    exportRowsAsCSV(headers, dataRows, { filename, bom:true });
  }

  const filteredTeams = useMemo(()=> teams.filter(t => t.sport===sport && t.teamName.toLowerCase().includes(search.toLowerCase())),[teams,sport,search]);
  const filteredFixtures = useMemo(()=> fixtures.filter(f => f.sport===sport && (search ? (f.team+f.opponent).toLowerCase().includes(search.toLowerCase()) : true)),[fixtures,sport,search]);
  const filteredEquipment = useMemo(()=> equipment.filter(e => e.sport===sport && (search===''|| e.item.toLowerCase().includes(search.toLowerCase()))),[equipment,sport,search]);
  const filteredStudents = useMemo(()=> students.filter(s => (search==='' || s.name.toLowerCase().includes(search.toLowerCase()))),[students,search]);
  const filteredSessions = useMemo(()=> sessions.filter(s => s.sport===sport || sport==='All'),[sessions,sport]);
  const filteredCompetitions = useMemo(()=> competitions.filter(c => (c.sport===sport) && (search===''|| c.name.toLowerCase().includes(search.toLowerCase()))),[competitions,sport,search]);
  const feedbackEntries = useMemo(()=> feedback.filter(f => search===''|| String(f.studentId).includes(search)),[feedback,search]);
  const filteredPeriods = useMemo(()=> periods.filter(p => search===''|| (p.grade+''+p.section+p.day).toLowerCase().includes(search.toLowerCase())),[periods,search]);

  const kpi = [
    { label:'Teams Active', value: teams.length },
    { label:'Fixtures Scheduled', value: fixtures.length },
    { label:'Students (Pool)', value: students.length },
    { label:'Sessions This Week', value: sessions.length },
    { label:'Competitions', value: competitions.length },
  ];

  function openModal(type,payload){ setModal({type,payload}); }
  function closeModal(){ setModal(null); }
  function handleCreate(data){
    switch(data.kind){
      case 'fixture': setFixtures(f=>[...f,{ id:Date.now(), date:data.date, sport, team:data.team, opponent:data.opponent, venue:data.venue, status:'Scheduled', transport:data.transport||'TBD' }]); notify('Fixture added'); break;
      case 'team': setTeams(t=>[...t,{ id:Date.now(), sport, teamName:data.teamName, gender:data.gender, level:data.level, coach:data.coach, captain:data.captain||'', roster:parseInt(data.roster)||0, nextMatch:data.nextMatch||'', w:0, l:0 }]); notify('Team added'); break;
      case 'student': setStudents(s=>[...s,{ id:Date.now(), name:data.name, grade:parseInt(data.grade)||0, section:data.section||'', interests:data.interests?data.interests.split(',').map(v=>v.trim()):[], fitness:data.fitness||'Good', assignedTeam:null }]); notify('Student added'); break;
      case 'session': setSessions(ss=>[...ss,{ id:Date.now(), day:data.day, time:data.time, sport:data.sport||sport, team:data.team?parseInt(data.team):null, coach:data.coach||'', focus:data.focus||'' }]); notify('Session added'); break;
      case 'competition': setCompetitions(c=>[...c,{ id:Date.now(), name:data.name, type:data.type, date:data.date, sport:data.sport||sport, level:data.level, status:'Planning', teamsInvolved:[], venue:data.venue||'' }]); notify('Competition added'); break;
      case 'feedback': setFeedback(f=>[...f,{ id:Date.now(), studentId:parseInt(data.studentId), date:data.date, area:data.area, rating:parseInt(data.rating)||0, comment:data.comment||'', coach:data.coach||'' }]); notify('Feedback saved'); break;
      case 'period': setPeriods(p=>[...p,{ id:Date.now(), grade:parseInt(data.grade)||0, section:data.section||'', day:data.day, slot:data.slot, sport:data.sport||sport, facility:data.facility||'', coach:data.coach||'' }]); notify('Period added'); break;
      case 'roster': {
        // data.selectedIds: array of student ids
        setStudents(prev => prev.map(stu => data.selectedIds.includes(stu.id) ? { ...stu, assignedTeam: contextTeam.id } : stu));
        // update roster count
        setTeams(ts => ts.map(t => t.id===contextTeam.id ? { ...t, roster: students.filter(s=> s.assignedTeam===contextTeam.id || data.selectedIds.includes(s.id)).length } : t));
        notify('Roster updated');
        break;
      }
      case 'equipment': setEquipment(e=>[...e,{ id:'eq'+Date.now(), sport, item:data.item, qty:parseInt(data.qty)||0, status:'Available' }]); notify('Equipment added'); break;
      case 'budget': setBudget(b=>[...b,{ id:'b'+Date.now(), category:data.category, planned:parseFloat(data.planned)||0, used:0 }]); notify('Budget line added'); break;
      default: break;
    }
    closeModal();
  }

  function modalContent(){
    if(!modal) return null; const common={ className:'w-full px-3 py-2 rounded-lg border text-sm' };
    switch(modal.type){
      case 'fixture': { const data={}; return <Modal open title="Add Fixture" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'fixture'})}>
        <div className="grid gap-3">
          <input type="date" {...common} onChange={e=>data.date=e.target.value} required />
          <select {...common} defaultValue={filteredTeams[0]?.teamName} onChange={e=>data.team=e.target.value}>{filteredTeams.map(t=> <option key={t.id}>{t.teamName}</option>)}</select>
          <input {...common} placeholder="Opponent" onChange={e=>data.opponent=e.target.value} required />
          <select {...common} defaultValue="Home" onChange={e=>data.venue=e.target.value}><option>Home</option><option>Away</option><option>Neutral</option></select>
          <input {...common} placeholder="Transport (optional)" onChange={e=>data.transport=e.target.value} />
        </div>
      </Modal>; }
      case 'team': { const data={}; return <Modal open title="Add Team" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'team'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Team Name" onChange={e=>data.teamName=e.target.value} required />
          <div className="grid grid-cols-2 gap-3">
            <input {...common} placeholder="Level (e.g. U17)" onChange={e=>data.level=e.target.value} />
            <select {...common} defaultValue="Boys" onChange={e=>data.gender=e.target.value}><option>Boys</option><option>Girls</option><option>Unified</option></select>
          </div>
            <input {...common} placeholder="Coach" onChange={e=>data.coach=e.target.value} />
            <input {...common} placeholder="Captain (optional)" onChange={e=>data.captain=e.target.value} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" {...common} placeholder="Roster Size" onChange={e=>data.roster=e.target.value} />
            <input type="date" {...common} onChange={e=>data.nextMatch=e.target.value} />
          </div>
        </div>
      </Modal>; }
      case 'equipment': { const data={}; return <Modal open title="Add Equipment" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'equipment'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Item" onChange={e=>data.item=e.target.value} required />
          <input type="number" {...common} placeholder="Qty" onChange={e=>data.qty=e.target.value} />
        </div>
      </Modal>; }
      case 'budget': { const data={}; return <Modal open title="Add Budget Line" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'budget'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Category" onChange={e=>data.category=e.target.value} required />
          <input type="number" {...common} placeholder="Planned Amount" onChange={e=>data.planned=e.target.value} required />
        </div>
      </Modal>; }
      case 'student': { const data={}; return <Modal open title="Add Student" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'student'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Full Name" onChange={e=>data.name=e.target.value} required />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" {...common} placeholder="Grade" onChange={e=>data.grade=e.target.value} />
            <input {...common} placeholder="Section" onChange={e=>data.section=e.target.value} />
            <input {...common} placeholder="Fitness (Good)" onChange={e=>data.fitness=e.target.value} />
          </div>
          <input {...common} placeholder="Interests (comma)" onChange={e=>data.interests=e.target.value} />
        </div>
      </Modal>; }
      case 'session': { const data={}; return <Modal open title="Add Session" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'session'})}>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <select {...common} defaultValue="Mon" onChange={e=>data.day=e.target.value}>{['Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <option key={d}>{d}</option>)}</select>
            <input type="time" {...common} onChange={e=>data.time=e.target.value} />
            <select {...common} defaultValue={sport} onChange={e=>data.sport=e.target.value}>{sports.map(s=> <option key={s}>{s}</option>)}</select>
          </div>
          <select {...common} onChange={e=>data.team=e.target.value} defaultValue=""> <option value="">(Optional Team)</option>{teams.filter(t=>t.sport===sport).map(t=> <option key={t.id} value={t.id}>{t.teamName}</option>)} </select>
          <input {...common} placeholder="Coach" onChange={e=>data.coach=e.target.value} />
          <input {...common} placeholder="Focus" onChange={e=>data.focus=e.target.value} />
        </div>
      </Modal>; }
      case 'competition': { const data={}; return <Modal open title="Add Competition" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'competition'})}>
        <div className="grid gap-3">
          <input {...common} placeholder="Name" onChange={e=>data.name=e.target.value} required />
          <div className="grid grid-cols-2 gap-3">
            <select {...common} defaultValue="Inter School" onChange={e=>data.type=e.target.value}><option>Inter School</option><option>Intra School</option></select>
            <input type="date" {...common} onChange={e=>data.date=e.target.value} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select {...common} defaultValue={sport} onChange={e=>data.sport=e.target.value}>{sports.map(s=> <option key={s}>{s}</option>)}</select>
            <input {...common} placeholder="Level (U17/All)" onChange={e=>data.level=e.target.value} />
          </div>
          <input {...common} placeholder="Venue" onChange={e=>data.venue=e.target.value} />
        </div>
      </Modal>; }
      case 'feedback': { const data={}; return <Modal open title="Add Feedback" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'feedback'})}>
        <div className="grid gap-3">
          <select {...common} defaultValue={students[0]?.id} onChange={e=>data.studentId=e.target.value}>{students.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <div className="grid grid-cols-3 gap-3">
            <input type="date" {...common} onChange={e=>data.date=e.target.value} />
            <input {...common} placeholder="Area" onChange={e=>data.area=e.target.value} />
            <input type="number" min="1" max="5" {...common} placeholder="Rating (1-5)" onChange={e=>data.rating=e.target.value} />
          </div>
          <input {...common} placeholder="Coach" onChange={e=>data.coach=e.target.value} />
          <textarea className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Comment" onChange={e=>data.comment=e.target.value} />
        </div>
      </Modal>; }
      case 'period': { const data={}; return <Modal open title="Add Period" onClose={closeModal} onSubmit={()=>handleCreate({...data,kind:'period'})}>
        <div className="grid gap-3">
          <div className="grid grid-cols-4 gap-3">
            <input type="number" {...common} placeholder="Grade" onChange={e=>data.grade=e.target.value} />
            <input {...common} placeholder="Section" onChange={e=>data.section=e.target.value} />
            <select {...common} defaultValue="Mon" onChange={e=>data.day=e.target.value}>{['Mon','Tue','Wed','Thu','Fri'].map(d=> <option key={d}>{d}</option>)}</select>
            <input {...common} placeholder="Slot (09:00-09:45)" onChange={e=>data.slot=e.target.value} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select {...common} defaultValue={sport} onChange={e=>data.sport=e.target.value}>{sports.map(s=> <option key={s}>{s}</option>)}</select>
            <input {...common} placeholder="Facility" onChange={e=>data.facility=e.target.value} />
            <input {...common} placeholder="Coach" onChange={e=>data.coach=e.target.value} />
          </div>
        </div>
      </Modal>; }
      case 'roster': { // roster management for a team
        const team=contextTeam; if(!team) return null; const data={ selectedIds:[] };
        const avail=students.filter(s=> !s.assignedTeam || s.assignedTeam===team.id);
        return <Modal open title={`Roster: ${team.teamName}`} submitLabel="Save" onClose={()=>{setContextTeam(null); closeModal();}} onSubmit={()=>handleCreate({...data,kind:'roster'})}>
          <div className="space-y-2 text-xs">
            {avail.map(st=> <label key={st.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 border border-slate-200"><input type="checkbox" defaultChecked={st.assignedTeam===team.id} onChange={e=>{ if(e.target.checked){ data.selectedIds=[...data.selectedIds, st.id]; } else { data.selectedIds=data.selectedIds.filter(i=>i!==st.id); } }} /> <span className="flex-1">{st.name} <span className="text-slate-500">(G{st.grade}{st.section})</span></span></label>)}
            {avail.length===0 && <div className="text-slate-500">No available students.</div>}
          </div>
        </Modal>;
      }
      default: return null;
    }
  }

  // Removed derived metrics for attendance and house points

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Sports Division</h1>
            <p className="text-slate-500 text-sm">Teams • Fixtures • Performance • Logistics • Welfare</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={sport} onChange={e=>setSport(e.target.value)} className="px-3 py-2 rounded-xl border bg-white text-sm">{sports.map(s=> <option key={s}>{s}</option>)}</select>
            <select value={wing} onChange={e=>setWing(e.target.value)} className="px-3 py-2 rounded-xl border bg-white text-sm">{wings.map(w=> <option key={w}>{w}</option>)}</select>
            <select value={season} onChange={e=>setSeason(e.target.value)} className="px-3 py-2 rounded-xl border bg-white text-sm">{seasons.map(s=> <option key={s}>{s}</option>)}</select>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" className="px-3 py-2 rounded-xl border bg-white text-sm" />
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {['Overview','Teams','Students','Planner','Competitions','Feedback','Periods','Fixtures','Equipment','Budget'].map(t=> <Pill key={t} active={tab===t} onClick={()=>setTab(t)}>{t}</Pill>)}
        </div>

        {tab==='Overview' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpi.map(k=> <div key={k.label} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">{k.label}</div><div className="mt-1 text-2xl font-semibold">{k.value}</div></div>)}
          </div>
        )}

        {tab==='Teams' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('team')}>Add Team</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredTeams.length} shown</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Team','Coach','Roster','W-L','Next Match','Actions'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredTeams.map(t=> <tr key={t.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{t.teamName}</td><td className="px-3 py-2">{t.coach}</td><td className="px-3 py-2">{students.filter(s=>s.assignedTeam===t.id).length}</td><td className="px-3 py-2">{t.w}-{t.l}</td><td className="px-3 py-2">{t.nextMatch}</td><td className="px-3 py-2"><button className="text-xs px-2 py-1 rounded border" onClick={()=>{setContextTeam(t); openModal('roster');}}>Roster</button></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Students' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('student')}>Add Student</Button>
              <Button onClick={()=>exportCSV(students,'students.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredStudents.length} shown</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Name','Grade','Interests','Team','Fitness'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredStudents.map(s=> <tr key={s.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{s.name}</td><td className="px-3 py-2">G{s.grade}{s.section}</td><td className="px-3 py-2">{s.interests.join(', ')}</td><td className="px-3 py-2">{teams.find(t=>t.id===s.assignedTeam)?.teamName||'-'}</td><td className="px-3 py-2">{s.fitness}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Planner' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('session')}>Add Session</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredSessions.length} sessions</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Day','Time','Sport','Team','Coach','Focus'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredSessions.map(ses=> <tr key={ses.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{ses.day}</td><td className="px-3 py-2">{ses.time}</td><td className="px-3 py-2">{ses.sport}</td><td className="px-3 py-2">{ses.team? teams.find(t=>t.id===ses.team)?.teamName:'-'}</td><td className="px-3 py-2">{ses.coach}</td><td className="px-3 py-2">{ses.focus}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Competitions' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('competition')}>Add Competition</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredCompetitions.length} shown</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Name','Type','Date','Sport','Level','Status','Teams','Venue'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredCompetitions.map(c=> <tr key={c.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{c.name}</td><td className="px-3 py-2">{c.type}</td><td className="px-3 py-2">{c.date}</td><td className="px-3 py-2">{c.sport}</td><td className="px-3 py-2">{c.level}</td><td className="px-3 py-2">{c.status}</td><td className="px-3 py-2">{c.teamsInvolved.map(id=>teams.find(t=>t.id===id)?.teamName).filter(Boolean).join(', ')||'-'}</td><td className="px-3 py-2">{c.venue}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Feedback' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('feedback')}>Add Feedback</Button>
              <span className="ml-auto text-xs text-slate-500">{feedbackEntries.length} entries</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-xs"><thead className="bg-slate-100 text-slate-600 text-[11px]"><tr>{['Date','Student','Area','Rating','Coach','Comment'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{feedbackEntries.map(fb=> { const stu=students.find(s=>s.id===fb.studentId); return <tr key={fb.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{fb.date}</td><td className="px-3 py-2">{stu?stu.name:fb.studentId}</td><td className="px-3 py-2">{fb.area}</td><td className="px-3 py-2">{fb.rating}</td><td className="px-3 py-2">{fb.coach}</td><td className="px-3 py-2 max-w-[240px] truncate" title={fb.comment}>{fb.comment}</td></tr>; })}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Periods' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('period')}>Add Period</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredPeriods.length} scheduled</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Grade','Section','Day','Slot','Sport','Facility','Coach'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredPeriods.map(p=> <tr key={p.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{p.grade}</td><td className="px-3 py-2">{p.section}</td><td className="px-3 py-2">{p.day}</td><td className="px-3 py-2">{p.slot}</td><td className="px-3 py-2">{p.sport}</td><td className="px-3 py-2">{p.facility}</td><td className="px-3 py-2">{p.coach}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Fixtures' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('fixture')}>Add Fixture</Button>
              <Button onClick={()=>exportCSV(filteredFixtures,'fixtures.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredFixtures.length} shown</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Date','Team','Opponent','Venue','Status'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredFixtures.map(f=> <tr key={f.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{f.date}</td><td className="px-3 py-2">{f.team}</td><td className="px-3 py-2">{f.opponent}</td><td className="px-3 py-2">{f.venue}</td><td className="px-3 py-2">{f.status}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Equipment' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('equipment')}>Add Equipment</Button>
              <Button onClick={()=>exportCSV(filteredEquipment,'equipment.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{filteredEquipment.length} shown</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Item','Qty','Status'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{filteredEquipment.map(e=> <tr key={e.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{e.item}</td><td className="px-3 py-2">{e.qty}</td><td className="px-3 py-2">{e.status}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='Budget' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={()=>openModal('budget')}>Add Budget Line</Button>
              <Button onClick={()=>exportCSV(budget,'budget.csv')}>Export</Button>
              <span className="ml-auto text-xs text-slate-500">{budget.length} lines</span>
            </div>
            <div className="rounded-xl border bg-white overflow-auto">
              <table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Category','Planned','Used','Util%'].map(h=> <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{budget.map(b=> <tr key={b.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{b.category}</td><td className="px-3 py-2">₹{b.planned}</td><td className="px-3 py-2">₹{b.used}</td><td className="px-3 py-2">{b.planned? Math.round((b.used/b.planned)*100):0}%</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {/* Removed tabs: Injuries, Facilities, House Points, Attendance */}
      </div>
      {toast && <Toast>{toast}</Toast>}
      {modalContent()}
    </div>
  );
}
