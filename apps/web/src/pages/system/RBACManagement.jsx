import React, { useState } from 'react';
import { useRBAC, CAPABILITIES } from '../../context/RBACContext.jsx';

const Chip = ({active, children, onClick}) => <button onClick={onClick} className={`px-2 py-1 rounded-md text-[11px] border ${active?'bg-primary text-white border-primary':'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-600'}`}>{children}</button>;

export default function RBACManagement(){
  const { roles, userRole, setUserRole, updateRoleCaps, addRole, removeRole } = useRBAC();
  const [selectedRole,setSelectedRole] = useState(Object.keys(roles)[0]);
  const [filter,setFilter] = useState('');
  const caps = roles[selectedRole]||[];
  const toggleCap = (cap)=> { const exists = caps.includes(cap); const next = exists? caps.filter(c=>c!==cap): [...caps,cap]; updateRoleCaps(selectedRole,next); };
  const createRole = ()=> { const name = prompt('New role name?'); if(name) addRole(name.trim()); };
  const deleteRole = ()=> { if(selectedRole && window.confirm('Delete role '+selectedRole+'?')){ removeRole(selectedRole); setSelectedRole(Object.keys(roles).filter(r=>r!==selectedRole)[0]||''); } };
  const visibleCaps = CAPABILITIES.filter(c=> c.includes(filter));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Role & Permission Management</h1>
        <div className="flex gap-2 items-center text-sm">
          <span className="text-slate-500">Impersonate:</span>
          <select className="h-9 border rounded-md px-2" value={userRole} onChange={e=>setUserRole(e.target.value)}>
            {Object.keys(roles).map(r=> <option key={r}>{r}</option>)}
          </select>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Roles</h2>
            <button onClick={createRole} className="text-xs px-2 py-1 rounded bg-primary text-white">Add</button>
          </div>
          <div className="space-y-1">
            {Object.keys(roles).map(r=> <button key={r} onClick={()=>setSelectedRole(r)} className={`w-full text-left px-3 py-2 rounded-md text-sm border ${r===selectedRole?'bg-primary text-white border-primary':'bg-white border-slate-300 hover:bg-slate-50'}`}>{r} {r===userRole && <span className="text-[10px] opacity-70">(active)</span>}</button>)}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={deleteRole} className="text-xs px-2 py-1 rounded border border-rose-300 text-rose-600 hover:bg-rose-50">Delete</button>
          </div>
        </div>
        <div className="md:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input className="h-9 border rounded-md px-3 text-sm" placeholder="Filter capabilities" value={filter} onChange={e=>setFilter(e.target.value)} />
            <span className="text-xs text-slate-500">{visibleCaps.length} / {CAPABILITIES.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleCaps.map(c=> <Chip key={c} active={caps.includes(c)} onClick={()=>toggleCap(c)}>{c}</Chip>)}
            {visibleCaps.length===0 && <div className="text-xs text-slate-500">No capabilities match.</div>}
          </div>
          <div className="text-xs text-slate-500 pt-2 border-t">Click a capability to toggle. Changes persist locally.</div>
        </div>
      </div>
    </div>
  );
}
