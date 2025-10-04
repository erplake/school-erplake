import React, { useState, useMemo } from 'react';

// Simple UI primitives (fallbacks)
const Card = ({children,className=''}) => <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
const CardContent = ({children,className=''}) => <div className={`p-4 ${className}`}>{children}</div>;
const Button = ({children,variant='default',size='md',className='',...p}) => <button {...p} className={`inline-flex items-center gap-1 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${variant==='outline'?'bg-white border-slate-300 text-slate-700 hover:bg-slate-50':variant==='ghost'?'bg-transparent border-transparent text-slate-600 hover:bg-slate-100':variant==='danger'?'bg-rose-600 border-rose-600 text-white hover:bg-rose-500':'bg-primary border-primary text-white hover:bg-primary/90'} ${size==='sm'?'h-8 px-2':'h-9 px-3'} ${className}`}>{children}</button>;

// Seed data
const seedCatalog = [
  { id:'B001', title:'Mathematics Concepts 7', author:'R. Gupta', category:'Math', grade:'VII', copies:12, issued:7, tags:['textbook'] },
  { id:'B002', title:'World Geography Atlas', author:'K. Singh', category:'Geography', grade:'VIII', copies:10, issued:4, tags:['reference'] },
  { id:'B003', title:'Modern Chemistry Lab Manual', author:'S. Patel', category:'Science', grade:'IX', copies:15, issued:11, tags:['lab'] },
  { id:'B004', title:'Hindi Kahaniya', author:'A. Sharma', category:'Language', grade:'VI', copies:8, issued:5, tags:['reader'] },
  { id:'B005', title:'Coding Fundamentals', author:'T. Rao', category:'Computers', grade:'VIII', copies:9, issued:2, tags:['coding'] },
];

const seedIssues = [
  { id:'I1001', book:'Mathematics Concepts 7', borrower:'Aarav S (VII)', due:'2025-10-10', status:'On Time' },
  { id:'I1002', book:'World Geography Atlas', borrower:'Myra K (VIII)', due:'2025-10-05', status:'Due Soon' },
  { id:'I1003', book:'Modern Chemistry Lab Manual', borrower:'Advait R (IX)', due:'2025-10-02', status:'Overdue' },
  { id:'I1004', book:'Hindi Kahaniya', borrower:'Isha D (VI)', due:'2025-10-12', status:'On Time' },
];

const seedVendors = [
  { id:'V01', name:'EduBooks Co', contact:'edubooks@example.com', pendingPos:2, lastSupply:'2025-09-20' },
  { id:'V02', name:'Scholastic Hub', contact:'hub@example.com', pendingPos:0, lastSupply:'2025-09-28' },
];

const seedRequests = [
  { id:'R01', title:'Physics Olympiad Guide', requestedBy:'Mr. Iyer', audience:'IX-X', status:'Pending' },
  { id:'R02', title:'Marathi Short Stories', requestedBy:'Language Dept', audience:'VI-VIII', status:'Approved' },
];

const seedActivities = [
  { id:'A01', name:'Reading Challenge', window:'Oct 1 - Oct 31', target:300, achieved:92 },
  { id:'A02', name:'STEM Research Hour', window:'Oct 5 - Nov 5', target:120, achieved:15 },
];

function toCSV(rows, headers){ if(!rows?.length) return ''; const cols = headers || Object.keys(rows[0]); const lines=[cols.join(','), ...rows.map(r=> cols.map(c=> JSON.stringify(r[c]??'')).join(','))]; return lines.join('\n'); }
function download(filename,text){ const blob=new Blob([text],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

export default function LibraryManagementAdvanced(){
  const [tab,setTab] = useState('catalog');
  const [catalog,setCatalog] = useState(seedCatalog);
  const [issues,setIssues] = useState(seedIssues);
  const [vendors] = useState(seedVendors);
  const [requests,setRequests] = useState(seedRequests);
  const [activities,setActivities] = useState(seedActivities);
  const [search,setSearch] = useState('');
  const [category,setCategory] = useState('All');
  const [grade,setGrade] = useState('All');

  const filteredCatalog = useMemo(()=> catalog.filter(b=> (category==='All'||b.category===category) && (grade==='All'||b.grade===grade) && (search==='' || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())) ), [catalog,category,grade,search]);

  const stats = useMemo(()=>{ const totalBooks = catalog.reduce((a,b)=> a + b.copies,0); const totalIssued = catalog.reduce((a,b)=> a + b.issued,0); const util = totalBooks? Math.round((totalIssued/totalBooks)*100):0; const overdue = issues.filter(i=> i.status==='Overdue').length; return { totalBooks, totalIssued, util, overdue }; },[catalog,issues]);

  function exportCatalog(){ download('library_catalog.csv', toCSV(filteredCatalog)); }
  function exportIssues(){ download('library_issues.csv', toCSV(issues)); }
  function exportRequests(){ download('library_requests.csv', toCSV(requests)); }
  function exportActivities(){ download('library_activities.csv', toCSV(activities)); }

  function markReturned(issueId){ setIssues(is=> is.map(i=> i.id===issueId? {...i,status:'Returned'}: i)); }
  function approveRequest(id){ setRequests(rs=> rs.map(r=> r.id===id? {...r,status:'Approved'}: r)); }
  function addBook(){ const title=prompt('Title?'); if(!title) return; const author=prompt('Author?')||'Unknown'; const category=prompt('Category?')||'General'; const grade=prompt('Grade?')||'—'; const copies=Number(prompt('Copies?')||'1'); setCatalog(cs=> [{ id:'B'+Math.random().toString(36).slice(2,7), title, author, category, grade, copies, issued:0, tags:[] }, ...cs]); }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Advanced Library Management</h1>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <input className="h-9 rounded-md border border-slate-300 px-2" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="h-9 rounded-md border border-slate-300 px-2" value={category} onChange={e=>setCategory(e.target.value)}><option value="All">All Categories</option><option>Math</option><option>Geography</option><option>Science</option><option>Language</option><option>Computers</option></select>
          <select className="h-9 rounded-md border border-slate-300 px-2" value={grade} onChange={e=>setGrade(e.target.value)}><option value="All">All Grades</option><option>VI</option><option>VII</option><option>VIII</option><option>IX</option><option>X</option></select>
          <Button variant="outline" onClick={addBook}>Add Book</Button>
          <Button variant="outline" onClick={exportCatalog}>Export Catalog</Button>
          <Button variant="outline" onClick={exportIssues}>Export Issues</Button>
          <Button variant="outline" onClick={exportRequests}>Export Requests</Button>
          <Button variant="outline" onClick={exportActivities}>Export Activities</Button>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Total Copies</div><div className="text-lg font-semibold">{stats.totalBooks}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Issued</div><div className="text-lg font-semibold">{stats.totalIssued}</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Utilization</div><div className="text-lg font-semibold">{stats.util}%</div></CardContent></Card>
        <Card><CardContent className="space-y-1"><div className="text-xs text-slate-500">Overdue</div><div className="text-lg font-semibold">{stats.overdue}</div></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap text-sm">
        {['catalog','issues','requests','activities','vendors'].map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 h-8 rounded-md border text-xs font-medium ${tab===t?'bg-primary text-white border-primary':'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{t.toUpperCase()}</button>)}
      </div>

      {tab==='catalog' && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Catalog ({filteredCatalog.length})</h2>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Title</th><th className="p-2 text-left">Author</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Grade</th><th className="p-2 text-left">Copies</th><th className="p-2 text-left">Issued</th></tr></thead>
              <tbody>
                {filteredCatalog.map(b=> <tr key={b.id} className="border-t"><td className="p-2 font-medium">{b.id}</td><td className="p-2">{b.title}</td><td className="p-2">{b.author}</td><td className="p-2">{b.category}</td><td className="p-2">{b.grade}</td><td className="p-2">{b.copies}</td><td className="p-2">{b.issued}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab==='issues' && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Issues & Returns</h2>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Book</th><th className="p-2 text-left">Borrower</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>{issues.map(i=> <tr key={i.id} className="border-t"><td className="p-2 font-medium">{i.id}</td><td className="p-2">{i.book}</td><td className="p-2">{i.borrower}</td><td className="p-2">{i.due}</td><td className="p-2">{i.status}</td><td className="p-2"><Button size="sm" variant="outline" onClick={()=>markReturned(i.id)}>Mark Returned</Button></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      {tab==='requests' && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Acquisition Requests</h2>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Title</th><th className="p-2 text-left">Requested By</th><th className="p-2 text-left">Audience</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>{requests.map(r=> <tr key={r.id} className="border-t"><td className="p-2 font-medium">{r.id}</td><td className="p-2">{r.title}</td><td className="p-2">{r.requestedBy}</td><td className="p-2">{r.audience}</td><td className="p-2">{r.status}</td><td className="p-2">{r.status==='Pending' && <Button size="sm" variant="outline" onClick={()=>approveRequest(r.id)}>Approve</Button>}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      {tab==='activities' && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Reading & Engagement Activities</h2>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Activity</th><th className="p-2 text-left">Window</th><th className="p-2 text-left">Target</th><th className="p-2 text-left">Achieved</th></tr></thead>
              <tbody>{activities.map(a=> <tr key={a.id} className="border-t"><td className="p-2 font-medium">{a.id}</td><td className="p-2">{a.name}</td><td className="p-2">{a.window}</td><td className="p-2">{a.target}</td><td className="p-2">{a.achieved}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      {tab==='vendors' && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Vendors & Supply</h2>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Vendor</th><th className="p-2 text-left">Contact</th><th className="p-2 text-left">Pending POs</th><th className="p-2 text-left">Last Supply</th></tr></thead>
              <tbody>{vendors.map(v=> <tr key={v.id} className="border-t"><td className="p-2 font-medium">{v.id}</td><td className="p-2">{v.name}</td><td className="p-2">{v.contact}</td><td className="p-2">{v.pendingPos}</td><td className="p-2">{v.lastSupply}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
