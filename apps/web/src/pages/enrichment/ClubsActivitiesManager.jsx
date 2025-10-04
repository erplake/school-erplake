import React, { useState, useMemo } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';

/* Simplified Clubs & Activities Manager based on provided attachment (core overview + creation + points) */

const Badge = ({ children, className='' }) => <span className={'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border bg-white text-slate-600 '+className}>{children}</span>;
const Button = ({ className='', ...p }) => <button className={'px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50 '+className} {...p} />;
const Card = ({ title, actions, children }) => <div className="rounded-xl border bg-white"><div className="flex items-center justify-between border-b px-4 py-2"><h3 className="text-sm font-semibold">{title}</h3><div className="flex gap-2">{actions}</div></div><div className="p-4 space-y-4">{children}</div></div>;

const HOUSES=['Blue','Green','Red','Yellow'];
function offsetDay(delta){ const d=new Date(); d.setDate(d.getDate()+delta); return d.toISOString().slice(0,10);} 
const seedClubs=[{ id:'c1', name:'Robotics Club', category:'STEM', advisor:'Ms. Kapoor', day:'Wed', time:'15:30', capacity:30, membersCount:22, wing:'Senior', house:'Blue', budgetAllocated:50000, budgetSpent:18000, status:'Active' }];
const seedStudents=[{ id:'s1', name:'Aarav Mehta', grade:'VIII', section:'A', house:'Blue' },{ id:'s2', name:'Diya Sharma', grade:'IX', section:'B', house:'Green' }];
const seedActivities=[{ id:'a1', name:'Inter-House Bot Sprint', clubId:'c1', date:offsetDay(2), start:'15:30', end:'17:00', location:'Lab 3', status:'Pending', requiresConsent:false, notes:'Bring laptop', attachments:0, advisor:'Ms. Kapoor', scope:'Inter-house' }];

export default function ClubsActivitiesManager(){
  const [tab,setTab]=useState('overview');
  const [clubs,setClubs]=useState(seedClubs);
  const [activities,setActivities]=useState(seedActivities);
  const [housePoints,setHousePoints]=useState({ Blue:120, Green:95, Red:110, Yellow:80 });
  const [pointsLog,setPointsLog]=useState([{ id:'p1', date:offsetDay(-1), house:'Blue', points:10, reason:'Bot sprint heat winners', activityId:'a1' }]);
  const [clubForm,setClubForm]=useState({ name:'', category:'STEM', advisor:'', day:'Fri', time:'15:00', capacity:30, wing:'Middle', house:'Blue' });
  const [activityForm,setActivityForm]=useState({ clubId:'c1', name:'', date:offsetDay(7), start:'15:00', end:'16:00', location:'', requiresConsent:false, notes:'', scope:'Intra-school' });
  const [modal,setModal]=useState(null); // 'club' | 'activity' | 'points'
  const [pointsForm,setPointsForm]=useState({ house:'Blue', points:5, reason:'Achievement', activityId:'a1' });

  const upcoming = useMemo(()=> activities.slice().sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)),[activities]);
  const leaderboard = useMemo(()=> HOUSES.map(h=> ({ house:h, points:housePoints[h]||0 })).sort((a,b)=> b.points-a.points),[housePoints]);

  function addClub(){ const id='c'+(clubs.length+1); setClubs(c=>[...c,{ id, membersCount:0, budgetAllocated:0, budgetSpent:0, status:'Draft', ...clubForm }]); setModal(null); }
  function addActivity(){ const id='a'+(activities.length+1); setActivities(a=>[...a,{ id, attachments:0, advisor:'', ...activityForm }]); setModal(null); }
  function awardPoints(){ setHousePoints(h=> ({...h, [pointsForm.house]:(h[pointsForm.house]||0)+Number(pointsForm.points)})); setPointsLog(l=>[...l,{ id:'p'+(l.length+1), date:new Date().toISOString().slice(0,10), ...pointsForm }]); setModal(null); }
  function exportCsv(){
    const rows = clubs.map(c=> ({ Name:c.name, Category:c.category, Advisor:c.advisor, Day:c.day, Time:c.time, Members:`${c.membersCount}/${c.capacity}`, Wing:c.wing, House:c.house, Status:c.status }));
    if(!rows.length) return;
    exportRowsAsCSV(Object.keys(rows[0]), rows.map(r=> Object.values(r)), { filename:'clubs.csv', bom:true });
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Clubs & Activities</h1><p className="text-sm text-slate-500">Houses • Activities • Consents</p></div><div className="flex gap-2"><Button onClick={()=>setModal('club')}>New Club</Button><Button onClick={()=>setModal('activity')}>New Activity</Button><Button onClick={exportCsv}>Export CSV</Button></div></header>
    <div className="flex flex-wrap gap-2">{['overview','clubs','activities','houses','points'].map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full border text-sm ${tab===t?'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>{t}</button>)}</div>
    {tab==='overview' && <Card title="Overview"><div className="grid md:grid-cols-4 gap-4">{leaderboard.map(l=> <div key={l.house} className="rounded-xl border p-3"><div className="text-xs text-slate-500">{l.house}</div><div className="text-2xl font-semibold">{l.points}</div></div>)}</div></Card>}
    {tab==='clubs' && <Card title="Clubs" actions={<Button onClick={()=>setModal('club')}>Add</Button>}><div className="overflow-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-left">Advisor</th><th className="px-3 py-2 text-left">Day</th><th className="px-3 py-2 text-left">Members</th><th className="px-3 py-2 text-left">House</th><th className="px-3 py-2 text-left">Status</th></tr></thead><tbody>{clubs.map(c=> <tr key={c.id} className="border-t"><td className="px-3 py-2 font-medium">{c.name}</td><td className="px-3 py-2">{c.category}</td><td className="px-3 py-2">{c.advisor}</td><td className="px-3 py-2">{c.day} {c.time}</td><td className="px-3 py-2">{c.membersCount}/{c.capacity}</td><td className="px-3 py-2">{c.house}</td><td className="px-3 py-2">{c.status}</td></tr>)}</tbody></table></div></Card>}
    {tab==='activities' && <Card title="Activities" actions={<Button onClick={()=>setModal('activity')}>Add</Button>}><div className="overflow-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Club</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Time</th><th className="px-3 py-2 text-left">Location</th><th className="px-3 py-2 text-left">Status</th></tr></thead><tbody>{activities.map(a=> <tr key={a.id} className="border-t"><td className="px-3 py-2 font-medium">{a.name}</td><td className="px-3 py-2">{a.clubId}</td><td className="px-3 py-2">{a.date}</td><td className="px-3 py-2">{a.start}-{a.end}</td><td className="px-3 py-2">{a.location}</td><td className="px-3 py-2">{a.status}</td></tr>)}</tbody></table></div></Card>}
    {tab==='houses' && <Card title="House Leaderboard"><div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">{leaderboard.map(l=> <div key={l.house} className="rounded-xl border p-3"><div className="text-xs text-slate-500">{l.house}</div><div className="text-2xl font-semibold">{l.points}</div></div>)}</div></Card>}
    {tab==='points' && <Card title="Points Log" actions={<Button onClick={()=>setModal('points')}>Award</Button>}><div className="overflow-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">House</th><th className="px-3 py-2 text-left">Points</th><th className="px-3 py-2 text-left">Reason</th></tr></thead><tbody>{pointsLog.map(p=> <tr key={p.id} className="border-t"><td className="px-3 py-2">{p.date}</td><td className="px-3 py-2">{p.house}</td><td className="px-3 py-2">{p.points}</td><td className="px-3 py-2">{p.reason}</td></tr>)}</tbody></table></div></Card>}

    {/* Modals */}
    {modal==='club' && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setModal(null)}><div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl border w-full max-w-lg p-4 space-y-4"><h4 className="text-sm font-semibold">New Club</h4><div className="grid grid-cols-2 gap-3">{['name','advisor','day','time','category','wing','house','capacity'].map(f=> <label key={f} className="text-xs font-medium grid gap-1"><span className="text-slate-600">{f}</span><input value={clubForm[f]} onChange={e=>setClubForm(s=>({...s,[f]: e.target.value}))} className="rounded-lg border px-2 py-1.5 text-sm" /></label>)}</div><div className="flex justify-end gap-2"><Button onClick={()=>setModal(null)}>Cancel</Button><Button onClick={addClub}>Create</Button></div></div></div>}
    {modal==='activity' && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setModal(null)}><div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl border w-full max-w-lg p-4 space-y-4"><h4 className="text-sm font-semibold">New Activity</h4><div className="grid grid-cols-2 gap-3">{['name','date','start','end','location','scope'].map(f=> <label key={f} className="text-xs font-medium grid gap-1"><span className="text-slate-600">{f}</span><input value={activityForm[f]} onChange={e=>setActivityForm(s=>({...s,[f]: e.target.value}))} className="rounded-lg border px-2 py-1.5 text-sm" /></label>)}<label className="text-xs font-medium grid gap-1 col-span-2"><span className="text-slate-600">Notes</span><textarea value={activityForm.notes} onChange={e=>setActivityForm(s=>({...s, notes:e.target.value}))} className="rounded-lg border px-2 py-1.5 text-sm" /></label></div><div className="flex justify-end gap-2"><Button onClick={()=>setModal(null)}>Cancel</Button><Button onClick={addActivity}>Create</Button></div></div></div>}
    {modal==='points' && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setModal(null)}><div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl border w-full max-w-sm p-4 space-y-4"><h4 className="text-sm font-semibold">Award Points</h4><div className="grid gap-3">{['house','points','reason','activityId'].map(f=> <label key={f} className="text-xs font-medium grid gap-1"><span className="text-slate-600">{f}</span><input value={pointsForm[f]} onChange={e=>setPointsForm(s=>({...s,[f]: e.target.value}))} className="rounded-lg border px-2 py-1.5 text-sm" /> </label>)} </div><div className="flex justify-end gap-2"><Button onClick={()=>setModal(null)}>Cancel</Button><Button onClick={awardPoints}>Save</Button></div></div></div>}
  </div>;
}
