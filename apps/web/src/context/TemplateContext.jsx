import React, { createContext, useContext, useEffect, useState } from 'react';

// Supported template types
export const TEMPLATE_TYPES = ['announcement','email','sms','certificate'];
const STORAGE_KEY = 'template_store_v1';

const TemplateContext = createContext(null);

export function TemplateProvider({ children }){
  const [templates,setTemplates] = useState(()=>{
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }catch{} return [
      { id:'t_welcome', type:'email', name:'Welcome Email', subject:'Welcome to our School', body:'Hello {{student.name}}, welcome!', updatedAt:Date.now() },
      { id:'t_fee_due', type:'sms', name:'Fee Due Reminder', body:'Dear {{parent.name}}, fee for {{student.name}} is due on {{fee.dueDate}}.', updatedAt:Date.now() },
      { id:'t_announcement_std', type:'announcement', name:'Generic Announcement', body:'{{announcement.body}}', updatedAt:Date.now() },
    ]; });
  const [selectedId,setSelectedId] = useState(null);

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)); }catch{} },[templates]);

  const upsertTemplate = (tpl)=>{ setTemplates(ts=>{ const idx = ts.findIndex(t=>t.id===tpl.id); if(idx>=0){ const copy=[...ts]; copy[idx]={...tpl, updatedAt:Date.now()}; return copy;} return [...ts,{...tpl, updatedAt:Date.now()}]; }); };
  const deleteTemplate = (id)=> setTemplates(ts=> ts.filter(t=> t.id!==id));
  const cloneTemplate = (id)=> setTemplates(ts=> { const src = ts.find(t=>t.id===id); if(!src) return ts; return [...ts,{...src,id:src.id+'_copy', name:src.name+' Copy', updatedAt:Date.now()}]; });

  return <TemplateContext.Provider value={{ templates, selectedId, setSelectedId, upsertTemplate, deleteTemplate, cloneTemplate }}>
    {children}
  </TemplateContext.Provider>;
}
export function useTemplates(){ const ctx = useContext(TemplateContext); if(!ctx) throw new Error('useTemplates must be used inside TemplateProvider'); return ctx; }
