import React, { useState, useMemo } from 'react';
import { exportObjectsAsCSV } from '../../utils/csv';
import { useTemplates } from '../../context/TemplateContext.jsx';
import { RequireCapability, useRBAC } from '../../context/RBACContext.jsx';

const Button = ({children,variant='default',size='md',className='',...p}) => <button {...p} className={`inline-flex items-center gap-1 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${variant==='outline'?'bg-white border-slate-300 text-slate-700 hover:bg-slate-50':variant==='ghost'?'bg-transparent border-transparent text-slate-600 hover:bg-slate-100':variant==='danger'?'bg-rose-600 border-rose-600 text-white hover:bg-rose-500':'bg-primary border-primary text-white hover:bg-primary/90'} ${size==='sm'?'h-8 px-2':'h-9 px-3'} ${className}`}>{children}</button>;
const Input = p => <input {...p} className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;
const Textarea = p => <textarea {...p} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${p.className||''}`} />;

export default function Announcements() {
  const { templates } = useTemplates();
  const { hasCapability } = useRBAC();
  const [list,setList] = useState(()=>[{ id:'a1', title:'Welcome Back', body:'School reopens Monday 9 AM.' }] );
  const [compose,setCompose] = useState({ title:'', body:'', template:'', preview:'' });
  const [filter,setFilter] = useState('');
  const filtered = useMemo(()=> list.filter(a=> a.title.toLowerCase().includes(filter.toLowerCase()) || a.body.toLowerCase().includes(filter.toLowerCase())),[list,filter]);

  function applyTemplate(id){
    const tpl = templates.find(t=>t.id===id);
    if(!tpl) return;
    // simple injection – placeholders not replaced client side here
    setCompose(c=> ({ ...c, template:id, body: c.body? c.body + '\n\n' + tpl.body : tpl.body }));
  }
  function publish(){ if(!compose.title || !compose.body) return; setList(ls=> [{ id:'a'+Math.random().toString(36).slice(2,7), title:compose.title, body:compose.body }, ...ls]); setCompose({ title:'', body:'', template:'', preview:'' }); }
  function exportCSV(){ if(!list.length) return; exportObjectsAsCSV(list.map(a=>({id:a.id,title:a.title,body:a.body})), 'announcements.csv', { bom:true }); }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Announcements</h1>
        <div className="flex gap-2 items-center">
          <Input placeholder="Search" value={filter} onChange={e=>setFilter(e.target.value)} style={{maxWidth:220}} />
          <Button variant="outline" onClick={exportCSV}>Export</Button>
        </div>
      </header>

      <RequireCapability capability="template.manage" fallback={<div className="text-xs text-slate-500">You do not have permission to publish announcements.</div>}>
        <div className="p-4 border rounded-lg bg-white space-y-4">
          <h2 className="text-sm font-medium">Compose</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <label className="space-y-1 md:col-span-1"><span className="text-[11px] uppercase text-slate-500">Title</span><Input value={compose.title} onChange={e=>setCompose(c=>({...c,title:e.target.value}))} placeholder="Title" /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-[11px] uppercase text-slate-500">Body</span><Textarea rows={5} value={compose.body} onChange={e=>setCompose(c=>({...c,body:e.target.value}))} placeholder="Announcement body" /></label>
            <div className="space-y-1 md:col-span-3">
              <span className="text-[11px] uppercase text-slate-500">Templates</span>
              <div className="flex flex-wrap gap-2">
                {templates.map(t=> <button key={t.id} type="button" onClick={()=>applyTemplate(t.id)} className={`px-2 py-1 rounded-md border text-[11px] ${compose.template===t.id?'bg-primary text-white border-primary':'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'}`}>{t.name}</button>)}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setCompose({ title:'', body:'', template:'', preview:'' })}>Reset</Button>
            <Button onClick={publish} disabled={!compose.title || !compose.body}>Publish</Button>
          </div>
        </div>
      </RequireCapability>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Recent Announcements ({filtered.length})</h2>
        <div className="space-y-2">
          {filtered.map(a=> <div key={a.id} className="rounded border p-4 bg-white space-y-1 text-sm">
            <div className="font-medium">{a.title}</div>
            <div className="text-xs text-slate-600 whitespace-pre-wrap">{a.body}</div>
          </div>)}
          {filtered.length===0 && <div className="text-xs text-slate-500">No announcements found.</div>}
        </div>
      </section>
    </div>
  );
}
