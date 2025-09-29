import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

function fmt(n){ return new Intl.NumberFormat().format(n||0); }

export default function StaffPage(){
  const [staff,setStaff] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [search,setSearch] = useState('');
  const [dept,setDept] = useState('All');
  const [role,setRole] = useState('All');
  const [showAdd,setShowAdd] = useState(false);
  const [form,setForm] = useState({ staff_code:'', name:'', role:'Teacher', department:'Mathematics', email:'', phone:'' });

  useEffect(()=>{
    api.listStaff().then(setStaff).catch(e=>setError(e.message||String(e))).finally(()=>setLoading(false));
  },[]);

  const filtered = useMemo(()=> staff.filter(s => (
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.staff_code.toLowerCase().includes(search.toLowerCase())) &&
    (dept==='All' || s.department===dept) &&
    (role==='All' || s.role===role)
  )),[staff,search,dept,role]);

  const createStaff = () => {
    api.createStaff(form).then(ns=>{ setStaff(prev=>[ns,...prev]); setShowAdd(false); }).catch(e=>alert(e.message||e));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <h1 className="text-xl font-semibold">Staff</h1>
        <span className="text-xs text-muted-foreground">{filtered.length}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
          <Select value={dept} onChange={e=>setDept(e.target.value)} className="w-[150px]">
            <option value="All">All Depts</option>
            {[...new Set(staff.map(s=>s.department).filter(Boolean))].map(d=> <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select value={role} onChange={e=>setRole(e.target.value)} className="w-[150px]">
            <option value="All">All Roles</option>
            {[...new Set(staff.map(s=>s.role))].map(r=> <option key={r} value={r}>{r}</option>)}
          </Select>
          <Button size="sm" onClick={()=>setShowAdd(true)}>Add</Button>
        </div>
      </div>
      {loading && <Skeleton className="h-20 w-full" />}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2">Dept</th>
                <th className="p-2">Attendance(30d)</th>
                <th className="p-2">Leave Bal</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b">
                  <td className="p-2 font-mono text-xs">{s.staff_code}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.role}</td>
                  <td className="p-2">{s.department||'—'}</td>
                  <td className="p-2">{s.attendance_30 ?? 0}%</td>
                  <td className="p-2">{s.leave_balance}</td>
                  <td className="p-2">{s.status==='Active' ? <Badge variant="outline">Active</Badge>: <Badge>{s.status}</Badge>}</td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground text-sm">No staff match filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg p-4 w-full max-w-md space-y-3">
            <h2 className="font-semibold text-lg">Add Staff</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="space-y-1 col-span-1"><span className="block text-xs text-muted-foreground">Code</span><Input value={form.staff_code} onChange={e=>setForm(f=>({...f,staff_code:e.target.value}))} /></label>
              <label className="space-y-1 col-span-1"><span className="block text-xs text-muted-foreground">Name</span><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></label>
              <label className="space-y-1 col-span-1"><span className="block text-xs text-muted-foreground">Role</span><Input value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} /></label>
              <label className="space-y-1 col-span-1"><span className="block text-xs text-muted-foreground">Department</span><Input value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} /></label>
              <label className="space-y-1 col-span-1"><span className="block text-xs text-muted-foreground">Email</span><Input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></label>
              <label className="space-y-1 col-span-1"><span className="block text-xs text-muted-foreground">Phone</span><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={createStaff}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
