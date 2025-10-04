import React, { useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import Tabs from '../../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Separator from '../../components/ui/Separator';
import {
  Megaphone, Calendar, Target, Star, Send, QrCode, Globe, Facebook, Instagram, Linkedin, Filter
} from 'lucide-react';

// Simplified adaptation of VIDA — Social & Marketing Hub preview
// Conforms to existing local UI kit (not shadcn). Assumes light/dark is handled globally.

const REVIEWS = [
  { id: 'r1', platform: 'Google', rating: 5, author: 'Priya S.', text: 'Clean campus and helpful teachers.', age: '2h' },
  { id: 'r2', platform: 'Facebook', rating: 4, author: 'Megha T.', text: 'Annual day was fantastic!', age: '3d' },
  { id: 'r3', platform: 'Instagram', rating: 5, author: 'Alumni – Arjun', text: 'Sports facilities are top-notch.', age: '5d' },
];
const CONNECTORS = [
  { key: 'google', name: 'Google Reviews', icon: Globe, connected: true },
  { key: 'facebook', name: 'Facebook', icon: Facebook, connected: true },
  { key: 'instagram', name: 'Instagram', icon: Instagram, connected: false },
  { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, connected: true },
];
const QUEUE = [
  { id: 'p1', date: '2025-10-02', platform: 'Instagram', title: 'Robotics Club Highlights' },
  { id: 'p2', date: '2025-10-05', platform: 'LinkedIn', title: 'Teacher Spotlight: Ms. Iyer' },
];
const CONTENT_TASKS = [
  { id: 'C-001', title: 'Open House Announcement', platforms: ['Facebook','Instagram'], external: 'https://facebook.com/…', assignee: 'Anita', review: 'Pending Principal', due: '2025-10-03', schedule: '2025-10-04 17:00', status: 'Planned' },
  { id: 'C-002', title: 'Robotics Club Reel', platforms: ['Instagram'], external: 'https://instagram.com/…', assignee: 'Rohit', review: 'Approved', due: '2025-10-02', schedule: '2025-10-02 18:00', status: 'Scheduled' },
];
const HOLIDAYS = [
  { date: '2025-10-02', name: 'Gandhi Jayanti' },
  { date: '2025-11-14', name: 'Children’s Day' },
  { date: '2025-12-25', name: 'Christmas' },
];
const POST_TEMPLATES = [
  { key: 'festival', name: 'Festival Greeting', brief: 'Warm wishes post with school branding.', checklist: ['Artwork in school colors','Principal quote','Hashtags (#SchoolName #Festival)'], defaultPlatforms: ['Facebook','Instagram'] },
  { key: 'event_announce', name: 'Event Announcement', brief: 'Announce event date/time and registration.', checklist: ['Date & time','RSVP link','Banner image','Call-to-action'], defaultPlatforms: ['Facebook','Instagram','LinkedIn'] },
  { key: 'admissions', name: 'Admissions Push', brief: 'Drive inquiries for next session.', checklist: ['USP bullets','Contact','Landing link (UTM)','Consent copy'], defaultPlatforms: ['Facebook','Instagram','LinkedIn'] },
];

export default function MarketingPortal(){
  const [role,setRole] = useState('Marketing'); // 'Marketing' | 'Principal'
  const [tasks,setTasks] = useState(()=> CONTENT_TASKS.map(t=> /(pending principal|sent to principal)/i.test(t.review)? { ...t, requestedAt: Date.now() - 26*60*60*1000 }: t));
  const [openTask,setOpenTask] = useState(false);
  const [openTemplates,setOpenTemplates] = useState(false);
  const [templateKey,setTemplateKey] = useState('festival');
  const [search,setSearch] = useState('');
  const [slaHours,setSlaHours] = useState(24);

  function requestApproval(id){ setTasks(prev=> prev.map(t=> t.id===id? { ...t, review:'Sent to Principal', status:'Awaiting Approval', requestedAt:Date.now() }: t)); }
  function approveTask(id){ setTasks(prev=> prev.map(t=> t.id===id? { ...t, review:'Approved', status: t.schedule? 'Scheduled':'Planned' }: t)); }
  function sendBack(id){ setTasks(prev=> prev.map(t=> t.id===id? { ...t, review:'Changes Requested', status:'Planned' }: t)); }
  function doneTask(id){ setTasks(prev=> prev.map(t=> t.id===id? { ...t, status:'Posted' }: t)); }
  function nudgePrincipal(id){ setTasks(prev=> prev.map(t=> t.id===id? { ...t, lastRemindedAt: Date.now() }: t)); }
  const canNudge = t => !!t.requestedAt && (Date.now() - t.requestedAt) >= slaHours*60*60*1000;

  const pendingApprovals = useMemo(()=> tasks.filter(t=> /(pending principal|sent to principal)/i.test(t.review)), [tasks]);
  const filteredReviews = useMemo(()=> { const q = search.trim().toLowerCase(); if(!q) return REVIEWS; return REVIEWS.filter(r=> r.platform.toLowerCase().includes(q) || r.author.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)); }, [search]);

  function addFromTemplate(key, titleOverride){
    const tpl = POST_TEMPLATES.find(x=>x.key===key); if(!tpl) return;
    const id = 'C-' + String(Date.now()).slice(-6);
    const newTask = { id, title: titleOverride || tpl.name, platforms: tpl.defaultPlatforms, external: '', assignee: '—', review: 'Pending Principal', due: new Date().toISOString().slice(0,10), schedule: '', status:'Planned', requestedAt: Date.now() };
    setTasks(prev=> [newTask, ...prev]); setOpenTemplates(false);
  }

  function exportTasksCsv(){
    const header = ['ID','Title','Platforms','External','Assignee','Review','Due','Schedule','Status'];
    const rows = tasks.map(t=> [t.id,t.title,t.platforms.join(';'),t.external,t.assignee,t.review,t.due,t.schedule,t.status]);
    const csv = [header,...rows].map(r=> r.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='marketing_content.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Marketing Portal</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Plan content, approvals and engagement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 text-sm dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">View as</span>
            <select className="bg-transparent outline-none" value={role} onChange={e=> setRole(e.target.value)}>
              <option value="Marketing">Marketing</option>
              <option value="Principal">Principal</option>
            </select>
          </div>
          <Button className="gap-2" onClick={()=> setOpenTask(true)}><Megaphone className="h-4 w-4" /> New Task</Button>
          <Button className="gap-2" variant="outline" onClick={()=> setOpenTemplates(true)}><Star className="h-4 w-4" /> Templates</Button>
          <Button className="gap-2" variant="outline"><Calendar className="h-4 w-4" /> New Event</Button>
        </div>
      </header>

      <Tabs
        defaultActive="posts"
        tabs={[
          { value:'posts', label:'Posts', content: () => (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Content Plan</CardTitle><CardDescription>Native posts → assign → principal review → schedule</CardDescription></CardHeader>
                <CardContent>
                  <div className="w-full overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500 border-b">
                        <tr><th className="p-2 text-left">Title</th><th className="p-2 text-left">Platforms</th><th className="p-2 text-left">Assignee</th><th className="p-2 text-left">Review</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Schedule</th><th className="p-2 text-left">Status</th><th className="p-2 text-left" /></tr>
                      </thead>
                      <tbody>
                        {tasks.map(t=> (
                          <tr key={t.id} className="border-b last:border-0">
                            <td className="p-2 font-medium whitespace-nowrap max-w-[180px] truncate">{t.title}</td>
                            <td className="p-2"><div className="flex flex-wrap gap-1">{t.platforms.map(p=> <Badge key={p} variant="secondary">{p}</Badge>)}</div></td>
                            <td className="p-2">{t.assignee}</td>
                            <td className="p-2">{t.review}</td>
                            <td className="p-2">{t.due}</td>
                            <td className="p-2">{t.schedule}</td>
                            <td className="p-2"><Badge>{t.status}</Badge></td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-2">
                                {role === 'Principal' ? (
                                  /approved/i.test(t.review) ? <Button size="sm" variant="ghost" onClick={()=> doneTask(t.id)}>Done</Button> : <><Button size="sm" onClick={()=> approveTask(t.id)}>Approve</Button><Button size="sm" variant="ghost" onClick={()=> sendBack(t.id)}>Send Back</Button></>
                                ) : (
                                  /approved/i.test(t.review) ? <Button size="sm" variant="ghost" onClick={()=> doneTask(t.id)}>Done</Button> : /sent to principal/i.test(t.review) ? <Button size="sm" variant="outline" disabled={!canNudge(t)} onClick={()=> nudgePrincipal(t.id)}>Remind</Button> : <Button size="sm" onClick={()=> requestApproval(t.id)}>Request</Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={exportTasksCsv}>Export CSV</Button>
                    <Button size="sm" variant="secondary" onClick={()=> setOpenTemplates(true)}>Templates</Button>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle>{role==='Principal'? 'Principal Approval':'Awaiting Principal'}</CardTitle><CardDescription>{role==='Principal'? 'Approve or send back':'Items sent for approval'}</CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    {pendingApprovals.length===0 ? <div className="text-xs text-slate-500">Nothing pending</div> : pendingApprovals.map(p=> (
                      <div key={p.id} className="border rounded-lg p-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-medium truncate max-w-[140px]">{p.title}</div>
                            <div className="text-[10px] text-slate-500">Due {p.due} • {p.platforms.join(', ')} </div>
                          </div>
                          <div className="flex gap-1">
                            {role==='Principal' ? <><Button size="sm" onClick={()=> approveTask(p.id)}>Approve</Button><Button size="sm" variant="ghost" onClick={()=> sendBack(p.id)}>Back</Button></> : <Button size="sm" variant="outline" disabled={!canNudge(p)} onClick={()=> nudgePrincipal(p.id)}>Nudge</Button>}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-[10px] text-slate-500">{role==='Principal'? 'You are approving as Principal.':'Principal signs off from their view.'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle>Upcoming Schedule</CardTitle><CardDescription>What’s lined up</CardDescription></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {QUEUE.map(q=> (
                      <div key={q.id} className="border rounded-lg p-2">
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-slate-500">{q.date} • {q.platform}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )},
          { value:'reviews', label:'Reviews', content: () => (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Search reviews, authors, platforms…" className="w-full md:w-80" /><Button variant="outline">Export</Button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredReviews.map(r=> (
                  <div key={r.id} className="border rounded-xl p-3 text-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between"><Badge variant="secondary">{r.platform}</Badge><div className="text-xs">{r.rating}★</div></div>
                    <div>{r.text}</div>
                    <div className="text-[11px] text-slate-500">by <b>{r.author}</b> • {r.age} ago</div>
                    <div className="flex gap-2 pt-1"><Button size="sm" variant="outline" className="gap-1"><Send className="h-3 w-3" />Reply</Button><Button size="sm" variant="ghost">Assign</Button></div>
                  </div>
                ))}
              </div>
            </div>
          )},
          { value:'settings', label:'Settings', content: () => (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle>Connectors</CardTitle><CardDescription>Linked social & review sources</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {CONNECTORS.map(c=> (
                    <div key={c.key} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <c.icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.connected? 'Connected':'Not connected'}</div>
                        </div>
                      </div>
                      <Badge variant={c.connected? 'secondary':'outline'}>{c.connected? 'OK':'Connect'}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle>Approval SLA</CardTitle><CardDescription>Hours before reminder enabled</CardDescription></CardHeader>
                <CardContent className="flex items-center gap-3 text-sm">
                  <Input type="number" className="w-32" value={slaHours} onChange={e=> setSlaHours(Number(e.target.value)||0)} />
                  <Badge variant="secondary">{slaHours}h</Badge>
                </CardContent>
              </Card>
            </div>
          )},
        ]}
      />

      {/* New Task Dialog */}
      <Dialog open={openTask} onClose={setOpenTask} title="New Content Task">
        <div className="grid gap-3">
          <Input placeholder="Title (e.g., Open House Announcement)" />
          <Input placeholder="External URL (native post)" />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Facebook</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Instagram</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Google</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> LinkedIn</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Assignee (e.g., Anita)" />
            <Input placeholder="Due Date (YYYY-MM-DD)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Send for Principal Approval</label>
            <Input placeholder="Schedule (YYYY-MM-DD HH:MM)" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> setOpenTask(false)}>Close</Button>
            <Button>Create Task</Button>
          </div>
        </div>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={openTemplates} onClose={setOpenTemplates} title="Templates & Checklists">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs font-medium">Post Type</div>
              <select className="w-full border rounded-md p-2 text-sm" value={templateKey} onChange={e=> setTemplateKey(e.target.value)}>
                {POST_TEMPLATES.map(t=> <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>
            </div>
            <div className="text-xs">
              <div className="font-medium">Brief</div>
              <div>{POST_TEMPLATES.find(t=> t.key===templateKey)?.brief}</div>
            </div>
            <div className="text-xs">
              <div className="font-medium mb-1">Checklist</div>
              <ul className="list-disc pl-4 space-y-1">
                {POST_TEMPLATES.find(t=> t.key===templateKey)?.checklist.map((c,i)=> <li key={i}>{c}</li>)}
              </ul>
            </div>
            <Button size="sm" onClick={()=> addFromTemplate(templateKey)}>Insert as Task</Button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-medium">Upcoming Holidays</div>
            <div className="max-h-56 overflow-auto space-y-2">
              {HOLIDAYS.map(h=> (
                <div key={h.date} className="border rounded-md p-2 flex items-center justify-between gap-2">
                  <div className="text-xs"><b>{h.name}</b><div className="text-slate-500">{h.date}</div></div>
                  <Button size="sm" variant="outline" onClick={()=> addFromTemplate(templateKey, `${h.name} — ${POST_TEMPLATES.find(t=> t.key===templateKey)?.name}`)}>Use</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={()=> setOpenTemplates(false)}>Close</Button></div>
      </Dialog>
    </div>
  );
}
