import React, { useMemo, useState } from 'react';
import { useTemplates, TEMPLATE_TYPES } from '../../context/TemplateContext.jsx';
import { useRBAC, RequireCapability } from '../../context/RBACContext.jsx';

function renderPreview(tpl){
  // naive placeholder highlight
  return tpl.body.split(/(\{\{[^}]+\}\})/g).map((seg,i)=> seg.startsWith('{{')? <span key={i} className="text-primary font-mono">{seg}</span>: seg);
}

export default function TemplateManager(){
  const { templates, selectedId, setSelectedId, upsertTemplate, deleteTemplate, cloneTemplate } = useTemplates();
  const { hasCapability } = useRBAC();
  const [filter,setFilter] = useState('');
  const [editing,setEditing] = useState(null);

  const filtered = useMemo(()=> templates.filter(t=> t.name.toLowerCase().includes(filter.toLowerCase()) || t.type.includes(filter)),[templates,filter]);
  const current = templates.find(t=> t.id===selectedId) || filtered[0];

  const startNew = ()=> { setEditing({ id:'tpl_'+Math.random().toString(36).slice(2,7), type:'announcement', name:'', subject:'', body:'', updatedAt:Date.now() }); };
  const editCurrent = ()=> { if(!current) return; setEditing({...current}); };
  const saveEditing = ()=> { if(!editing.name) return; upsertTemplate(editing); setSelectedId(editing.id); setEditing(null); };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Template Manager</h1>
        <div className="flex gap-2">
          {hasCapability('template.manage') && <button onClick={startNew} className="h-9 px-3 rounded-md bg-primary text-white text-sm">New Template</button>}
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="space-y-3 md:col-span-1">
          <input className="h-9 w-full border rounded-md px-2 text-sm" placeholder="Search / filter" value={filter} onChange={e=>setFilter(e.target.value)} />
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map(t=> <button key={t.id} onClick={()=>setSelectedId(t.id)} className={`w-full text-left px-3 py-2 rounded-md border text-sm ${current?.id===t.id?'bg-primary text-white border-primary':'bg-white border-slate-300 hover:bg-slate-50'}`}>
              <div className="font-medium truncate">{t.name||'(Untitled)'}</div>
              <div className="text-[10px] opacity-70">{t.type}</div>
            </button>)}
            {filtered.length===0 && <div className="text-xs text-slate-500">No templates.</div>}
          </div>
        </div>
        <div className="md:col-span-3 space-y-4">
          {!editing && current && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-medium">{current.name}</h2>
                  <div className="text-[11px] text-slate-500">Type: {current.type} • Updated {new Date(current.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  {hasCapability('template.manage') && <>
                    <button onClick={editCurrent} className="h-8 px-2 text-xs rounded-md border border-slate-300">Edit</button>
                    <button onClick={()=>cloneTemplate(current.id)} className="h-8 px-2 text-xs rounded-md border border-slate-300">Clone</button>
                    <button onClick={()=>{ if(window.confirm('Delete template?')) deleteTemplate(current.id); }} className="h-8 px-2 text-xs rounded-md border border-rose-300 text-rose-600">Delete</button>
                  </>}
                </div>
              </div>
              {current.subject && <div className="p-3 rounded-md bg-slate-50 border text-xs"><strong>Subject:</strong> {current.subject}</div>}
              <div className="p-4 rounded-md border bg-white text-sm leading-relaxed min-h-[160px]">
                {renderPreview(current)}
              </div>
              <div className="text-[11px] text-slate-500">Placeholders use <code className="bg-slate-100 px-1 rounded">&#123;&#123;variable.name&#125;&#125;</code> syntax. Rendering engine is a simple replacer (implement backend later).</div>
            </div>
          )}
          {editing && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <label className="space-y-1"><span className="text-[11px] uppercase text-slate-500">Name</span><input value={editing.name} onChange={e=>setEditing(s=>({...s,name:e.target.value}))} className="h-9 w-full border rounded-md px-2" /></label>
                <label className="space-y-1"><span className="text-[11px] uppercase text-slate-500">Type</span><select value={editing.type} onChange={e=>setEditing(s=>({...s,type:e.target.value}))} className="h-9 w-full border rounded-md px-2">{TEMPLATE_TYPES.map(t=> <option key={t}>{t}</option>)}</select></label>
                {editing.type !== 'sms' && <label className="space-y-1 md:col-span-2"><span className="text-[11px] uppercase text-slate-500">Subject (email/certificate)</span><input value={editing.subject||''} onChange={e=>setEditing(s=>({...s,subject:e.target.value}))} className="h-9 w-full border rounded-md px-2" /></label>}
                <label className="space-y-1 md:col-span-2"><span className="text-[11px] uppercase text-slate-500">Body</span><textarea value={editing.body} onChange={e=>setEditing(s=>({...s,body:e.target.value}))} className="w-full h-48 border rounded-md p-2 font-mono text-xs" placeholder="Type template with {{placeholders}}" /></label>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>setEditing(null)} className="h-9 px-3 rounded-md border border-slate-300 text-sm">Cancel</button>
                <button onClick={saveEditing} className="h-9 px-3 rounded-md bg-primary text-white text-sm">Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
