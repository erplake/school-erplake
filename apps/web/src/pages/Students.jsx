import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import create from 'zustand';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { Badge as BadgePrimitive } from '../components/ui/Badge';

const useStudentStore = create(set => ({
  students: [],
  setStudents: (students) => set({ students }),
  add(student){ set(state => ({ students: [student, ...state.students] })); }
}));

function Badge({children, color='brand'}){
  return <BadgePrimitive variant={color==='brand' ? 'default' : 'outline'}>{children}</BadgePrimitive>;
}

export function Students(){
  const { students, setStudents, add } = useStudentStore();
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [q,setQ] = useState('');
  const [showForm,setShowForm] = useState(false);

  useEffect(()=>{
    api.listStudents().then(r=>{ setStudents(r); setLoading(false); }).catch(e=>{ setError(e.message); setLoading(false); });
  },[setStudents]);

  const filtered = useMemo(()=> students.filter(s => {
    const t = (s.first_name+' '+(s.last_name||'')+' '+s.klass+' '+(s.section||'')+' '+(s.guardian_phone||'')).toLowerCase();
    return t.includes(q.toLowerCase());
  }),[students,q]);

  function handleSubmit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const student = {
      id: 'tmp-'+Date.now(),
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      klass: form.get('klass'),
      section: form.get('section'),
      guardian_phone: form.get('guardian_phone')
    };
    add(student); // optimistic local add
    setShowForm(false);
    // TODO: POST to API
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Students <span className="ml-2 text-xs font-normal text-slate-500">{students.length}</span></h2>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="w-full sm:w-56 pl-7 pr-2 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button onClick={()=>setShowForm(true)} className="inline-flex items-center gap-1 rounded-md bg-brand-600 text-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left font-medium px-3 py-2">Name</th>
                <th className="text-left font-medium px-3 py-2">Class</th>
                <th className="text-left font-medium px-3 py-2">Section</th>
                <th className="text-left font-medium px-3 py-2">Guardian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{s.first_name} {s.last_name}</td>
                  <td className="px-3 py-2"><Badge color='brand'>{s.klass}</Badge></td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.section}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.guardian_phone}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">No matches</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add Student</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">First name</label>
                  <input name="first_name" required className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Last name</label>
                  <input name="last_name" className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Class</label>
                  <input name="klass" required className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Section</label>
                  <input name="section" className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="flex flex-col gap-1 col-span-3 md:col-span-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Guardian Phone</label>
                  <input name="guardian_phone" className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40">Cancel</button>
                <Button type="submit" size="sm">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
