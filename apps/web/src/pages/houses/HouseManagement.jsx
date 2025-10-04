import React, { useState, useMemo } from 'react';

// Simplified integration of provided HouseManagementPage snippet (seed data + ledger + students + staff + competitions)

const Card = ({children,className=''}) => <div className={`rounded-xl border bg-white ${className}`}>{children}</div>;
const CardHeader = ({children,className=''}) => <div className={`p-4 border-b ${className}`}>{children}</div>;
const CardTitle = ({children,className=''}) => <h3 className={`font-semibold ${className}`}>{children}</h3>;
const CardContent = ({children,className=''}) => <div className={`p-4 space-y-4 ${className}`}>{children}</div>;
const Button = ({children,className='',...p}) => <button className={`px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50 ${className}`} {...p}>{children}</button>;
const Badge = ({children,className=''}) => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 ${className}`}>{children}</span>;
const Input = (p) => <input {...p} className={`px-2 py-1.5 rounded-lg border text-sm w-full ${p.className||''}`} />;

const SEED_HOUSES = [
  { id: 'red', name: 'Ruby House', crest: '🟥' },
  { id: 'blue', name: 'Sapphire House', crest: '🟦' },
  { id: 'green', name: 'Emerald House', crest: '🟩' },
  { id: 'yellow', name: 'Topaz House', crest: '🟨' },
];
const SEED_STUDENTS = [
  { id:1, name:'Aarav Sharma', class:'VI', section:'A', roll:12, houseId:'red' },
  { id:2, name:'Anaya Rao', class:'VIII', section:'B', roll:9, houseId:'blue' },
  { id:3, name:'Vivaan Gupta', class:'X', section:'A', roll:18, houseId:'green' },
  { id:4, name:'Ishita Mehta', class:'VII', section:'C', roll:4, houseId:'yellow' },
  { id:5, name:'Kabir Singh', class:'IX', section:'A', roll:2, houseId:'red' },
];
let ledgerAutoId = 1000;
const SEED_LEDGER = [
  { id: ledgerAutoId++, date: new Date().toISOString().slice(0,10), houseId:'red', type:'Merit', points:25, reason:'Spell Bee Winners', by:'Mrs. Sen', status:'Approved' },
  { id: ledgerAutoId++, date: new Date().toISOString().slice(0,10), houseId:'blue', type:'Merit', points:15, reason:'Cleanliness Drive', by:'Mr. Iqbal', status:'Approved' },
  { id: ledgerAutoId++, date: new Date().toISOString().slice(0,10), houseId:'green', type:'Demerit', points:-5, reason:'Late Assembly', by:'Ms. Roy', status:'Pending' },
];

export default function HouseManagement(){
  const [activeHouse,setActiveHouse] = useState('all');
  const [ledger,setLedger] = useState(SEED_LEDGER);
  const [students,setStudents] = useState(SEED_STUDENTS);
  const [fltText,setFltText] = useState('');
  // Local tab state (ledger | students)
  const [tab,setTab] = useState('ledger');
  const totals = useMemo(()=>{
    const t={red:0,blue:0,green:0,yellow:0};
    ledger.filter(e=>e.status==='Approved').forEach(e=>{ t[e.houseId]+=e.points; });
    return t;
  },[ledger]);
  const filteredLedger = ledger.filter(l=> (activeHouse==='all'|| l.houseId===activeHouse) && (fltText==='' || (l.reason+l.by).toLowerCase().includes(fltText.toLowerCase())) );

  function addPoints(){
    const reason=prompt('Reason?'); if(!reason) return;
    const house=prompt('House id (red/blue/green/yellow)?','red'); if(!house) return;
    const pts=parseInt(prompt('Points?','10')||'0',10);
    setLedger(prev=>[...prev,{ id:ledgerAutoId++, date:new Date().toISOString().slice(0,10), houseId:house, type: pts>=0?'Merit':'Demerit', points:pts, reason, by:'System', status:'Approved' }]);
  }
  function approve(id){ setLedger(prev=> prev.map(e=> e.id===id? { ...e, status:'Approved'}:e)); }
  function moveStudent(id,newHouse){ setStudents(prev=> prev.map(s=> s.id===id? { ...s, houseId:newHouse }:s)); }

  return <div className="p-6 space-y-6 max-w-7xl mx-auto">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">House Management</h1>
        <p className="text-sm text-slate-500">Points • Students • Competitions</p>
      </div>
      <div className="flex items-center gap-2">
        <select value={activeHouse} onChange={e=>setActiveHouse(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm bg-white">
          <option value="all">All Houses</option>
          {SEED_HOUSES.map(h=> <option key={h.id} value={h.id}>{h.crest} {h.name}</option>)}
        </select>
        <Input placeholder="Search ledger" value={fltText} onChange={e=>setFltText(e.target.value)} />
        <Button onClick={addPoints}>Add Points</Button>
      </div>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SEED_HOUSES.map(h=> <Card key={h.id}><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><span className="text-lg">{h.crest}</span>{h.name}</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-semibold">{totals[h.id]||0}</div><div className="text-xs text-slate-500">Approved points</div></CardContent></Card>)}
    </div>

    <div className="flex flex-wrap gap-2">
      {['ledger','students'].map(t=> (
        <button
          key={t}
          onClick={()=>setTab(t)}
          className={`px-3 py-1.5 rounded-full border text-sm ${tab===t?'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}
        >{t==='ledger'? 'Ledger':'Students'}</button>
      ))}
    </div>

    {tab==='ledger' && <HouseLedger ledger={filteredLedger} approve={approve} />}
    {tab==='students' && <HouseStudents students={students} moveStudent={moveStudent} houses={SEED_HOUSES} />}
  </div>;
}

function HouseLedger({ledger,approve}){
  return <Card>
    <CardHeader><CardTitle className="text-sm">Points Ledger</CardTitle></CardHeader>
    <CardContent>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">House</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Points</th><th className="px-3 py-2 text-left">Reason</th><th className="px-3 py-2 text-left">By</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Actions</th></tr></thead>
          <tbody>
            {ledger.map(e=> <tr key={e.id} className="border-t hover:bg-slate-50">
              <td className="px-3 py-2">{e.date}</td>
              <td className="px-3 py-2">{e.houseId}</td>
              <td className="px-3 py-2">{e.type}</td>
              <td className="px-3 py-2">{e.points}</td>
              <td className="px-3 py-2 max-w-[200px] truncate" title={e.reason}>{e.reason}</td>
              <td className="px-3 py-2">{e.by}</td>
              <td className="px-3 py-2">{e.status}</td>
              <td className="px-3 py-2 flex gap-2"><Button className="text-xs" onClick={()=>approve(e.id)}>Approve</Button></td>
            </tr>)}
            {ledger.length===0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500">No entries</td></tr>}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>;
}

function HouseStudents({students,moveStudent,houses}){
  return <Card className="mt-6">
    <CardHeader><CardTitle className="text-sm">Students</CardTitle></CardHeader>
    <CardContent>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Class</th><th className="px-3 py-2 text-left">House</th><th className="px-3 py-2 text-left">Actions</th></tr></thead>
          <tbody>
            {students.map(s=> <tr key={s.id} className="border-t hover:bg-slate-50">
              <td className="px-3 py-2 font-medium">{s.name}</td>
              <td className="px-3 py-2">{s.class}-{s.section}</td>
              <td className="px-3 py-2">{s.houseId}</td>
              <td className="px-3 py-2 flex gap-2">
                {houses.map(h=> <Button key={h.id} className="text-xs" onClick={()=>moveStudent(s.id,h.id)}>{h.crest}</Button>)}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>;
}
