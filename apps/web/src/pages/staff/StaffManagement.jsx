// StaffManagement.jsx (Modular Orchestrator)
// Purpose: Provide a stable, minimal staff directory after corruption cleanup.
// Included: metrics summary, searchable/filterable table, add staff modal, staff detail side panel, CSV export, demo attendance chart.
// Excluded (reintroduce later): taxonomy mgmt, duties, announcements, substitutions, leave workflow, photos, settings, toasts.

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import { exportRowsAsCSV } from '../../utils/csv';
import { mapStaffFromApi, mapStaffToCreatePayload, mapLeaveRequestFromApi, deriveOnLeaveToday } from '../../utils/staffMapping';
import { Download, Plus, Megaphone, X, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '../../components/ToastProvider.jsx';

// Components
import { MetricsBar } from './components/MetricsBar';
import { StaffFilters } from './components/StaffFilters';
import { StaffTable } from './components/StaffTable';
import { LeaveRequestsPanel } from './components/LeaveRequestsPanel';
import { GradeCoverageCard } from './components/GradeCoverageCard';
import { ResignationsCard } from './components/ResignationsCard';
import { QuickActions } from './components/QuickActions';
import { AttendanceTrendChart } from './components/AttendanceTrendChart';
import { StaffDetailPanel } from './components/StaffDetailPanel';
import { AddStaffModal } from './components/AddStaffModal';
import { ResignModal } from './components/ResignModal';
import { AssignDutyModal } from './components/AssignDutyModal';
import { SubstitutionPlannerModal } from './components/SubstitutionPlannerModal';
import { DutiesPanel } from './components/DutiesPanel';
import { SubstitutionsPanel } from './components/SubstitutionsPanel';
import { KPI } from './components/primitives'; // ensure tree-shake friendliness

// Constants
const ROLES = ['All','Teacher','Principal','Vice Principal','Admin','Accountant','Librarian','Counselor','Support Staff'];
const DEPARTMENTS = ['All','Mathematics','Science','English','Social Studies','Computer Science','Administration','Sports','Arts'];
const ATTENDANCE_TREND = Array.from({ length: 12 }).map((_, i) => ({ wk: `W${i+1}`, percent: 88 + Math.round(Math.sin(i / 2) * 6 + (i % 3)) }));

function computeGradeCounts(staff){ const m={}; staff.forEach(s=>{ if(s.role==='Teacher' && s.grade) m[s.grade]=(m[s.grade]||0)+1; }); return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])); }

export default function StaffManagementPage(){
  const { push } = useToast();
  // Staff & data
  const [staff,setStaff] = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  // Filters
  const [search,setSearch] = useState('');
  const [dept,setDept] = useState('All');
  const [role,setRole] = useState('All');
  const [showOnLeaveOnly,setShowOnLeaveOnly] = useState(false);
  const [includeResigned,setIncludeResigned] = useState(false);
  const [minAttendance,setMinAttendance] = useState(0);

  // Leave requests (populated from backend)
  const [requests,setRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [transitioningLeave, setTransitioningLeave] = useState(false);

  // Selection & modals
  const [selected,setSelected] = useState(null);
  const [showAdd,setShowAdd] = useState(false);
  const [addForm,setAddForm] = useState({ name:'', role:'Teacher', department:'Mathematics', grade:'Grade 1', email:'', phone:'', doj:new Date().toISOString().slice(0,10), reportsTo:'' });
  const [showResign,setShowResign] = useState(false);
  const [resign,setResign] = useState({ date:new Date().toISOString().slice(0,10), reason:'' });
  // Duty & substitution modals
  const [showAssignDuty, setShowAssignDuty] = useState(false);
  const [assignDutyForm, setAssignDutyForm] = useState({ title:'', date:new Date().toISOString().slice(0,10), staffId:'', notes:'' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [subsForm, setSubsForm] = useState({ date:new Date().toISOString().slice(0,10), absentId:'', subId:'', periods:'', notes:'' });
  const [subsSubmitting, setSubsSubmitting] = useState(false);
  // NOTE: Duty assignment & substitution planning are currently client-only placeholders.
  // Future backend endpoints could be:
  //   POST /staff/duties  { staff_id, title, date, notes }
  //   POST /academics/substitutions { date, absent_staff_id, substitute_staff_id, periods:[int], notes }
  // Add retrieval lists for recent duties or planned substitutions and show them in side panels/cards.
  const [duties, setDuties] = useState([]);
  const [subsList, setSubsList] = useState([]);
  // Announcement modal state
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [announceSending, setAnnounceSending] = useState(false);
  const [announceSent, setAnnounceSent] = useState([]); // persisted (backend) + newly sent

  // Debounced search value to limit backend calls
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(()=>{ const t = setTimeout(()=> setDebouncedSearch(search), 400); return ()=> clearTimeout(t); }, [search]);

  // Load staff + leave requests + announcements on relevant filter changes (announcements only once on mount)
  useEffect(()=>{ (async()=>{
    setLoading(true); setError('');
    try {
      const params = {};
      if(debouncedSearch) params.search = debouncedSearch;
      if(role !== 'All') params.role = role;
      if(dept !== 'All') params.department = dept;
      if(!includeResigned) params.status = 'Active';
      const qs = new URLSearchParams(params).toString();
      const staffRaw = await api.listStaff(qs ? '?' + qs : '');
      const mapped = staffRaw.map(mapStaffFromApi);
      setStaff(mapped);
      // build index for leave hydration
      const idx = new Map(mapped.map(s=>[s.id, s]));
      setLeaveLoading(true);
      try {
        const leaveRaw = await api.listStaffLeave();
        const leaveMapped = leaveRaw.map(r=> mapLeaveRequestFromApi(r, idx));
        setRequests(leaveMapped);
      } catch(leaveErr){ console.warn('Leave load failed', leaveErr); }
      finally { setLeaveLoading(false); }
      // announcements only when first load (debouncedSearch triggers re-runs; guard by length)
      if(announceSent.length===0){
        try {
          const anns = await api.listStaffAnnouncements();
          setAnnounceSent(anns.map(a=>({ id:a.id, at:a.created_at, message:a.message, count: mapped.filter(s=>s.status!=='Resigned').length })));
        } catch(aErr){ console.warn('Announcements load failed', aErr); }
      }
      // load duties & substitutions (limit to recent scope)
      try {
        const dutiesData = await api.listStaffDuties({ limit: 10 });
        setDuties(dutiesData);
      } catch(dErr){ console.warn('Duties load failed', dErr); }
      try {
        const subsData = await api.listStaffSubstitutions({ limit: 10 });
        setSubsList(subsData);
      } catch(sErr){ console.warn('Substitutions load failed', sErr); }
    } catch(e){ setError(e.message||'Failed to load staff'); }
    finally { setLoading(false); }
  })(); }, [debouncedSearch, role, dept, includeResigned]);

  // Derived filtered staff
  const filtered = useMemo(()=> staff.filter(s => {
    if(!includeResigned && s.status==='Resigned') return false;
    if(dept!=='All' && s.department!==dept) return false;
    if(role!=='All' && s.role!==role) return false;
    if(showOnLeaveOnly && !s.onLeaveToday) return false;
    if(minAttendance && (s.attendance30||0) < minAttendance) return false;
    if(search){ const blob = `${s.name} ${s.email||''} ${s.phone||''} ${s.department||''} ${s.role} ${s.grade||''}`.toLowerCase(); if(!blob.includes(search.toLowerCase())) return false; }
    return true;
  }),[staff, includeResigned, dept, role, showOnLeaveOnly, minAttendance, search]);

  const metrics = useMemo(()=>{
    const active = staff.filter(s=> s.status!=='Resigned');
    const total = active.length;
    const teachers = active.filter(s=> s.role==='Teacher').length;
    const nonTeaching = total - teachers;
    const onLeaveToday = active.filter(s=> s.onLeaveToday).length;
    const pending = requests.filter(r=> r.status==='Pending').length;
    const avgAttendance = total ? Math.round(active.reduce((a,s)=>a+(s.attendance30||0),0)/total) : 0;
    return { total, teachers, nonTeaching, onLeaveToday, pending, avgAttendance };
  },[staff, requests]);

  const gradeCounts = useMemo(()=> computeGradeCounts(staff), [staff]);
  const resignations = useMemo(()=> staff.filter(s=> s.status==='Resigned'), [staff]);

  // Actions
  async function handleRequest(id, action){
    setTransitioningLeave(true);
    try {
      await api.transitionStaffLeave(id, action==='approve' ? 'Approved' : 'Rejected');
      // refresh leave list after successful transition
      const idx = new Map(staff.map(s=>[s.id,s]));
      const leaveRaw = await api.listStaffLeave();
      const leaveMapped = leaveRaw.map(r=> mapLeaveRequestFromApi(r, idx));
      setRequests(leaveMapped);
    } catch(err){
      console.error('Transition failed', err);
      push('Failed to transition leave: '+err.message, { type:'error' });
    } finally { setTransitioningLeave(false); }
  }
  async function sendAnnouncement(){
    setShowAnnounce(true);
  }
  async function confirmAnnouncement(){
    if(!announceText.trim()) return;
    setAnnounceSending(true);
    try {
      const created = await api.createStaffAnnouncement(announceText.trim());
      setAnnounceSent(prev=>[{ id:created.id, at: created.created_at, message: created.message, count: staff.filter(s=>s.status!=='Resigned').length }, ...prev]);
      setAnnounceText('');
      setShowAnnounce(false);
    } catch(err){
      push('Announcement failed: '+err.message, { type:'error' });
    } finally { setAnnounceSending(false); }
  }
  function exportCSV(){
    const headers = [ 'ID','Name','Role','Department','Grade','Email','Phone','DOJ','ReportsTo','Attendance30','LeavesTakenYTD','LeaveBalance','OnLeaveToday','Status','LastAppraisal','NextAppraisal','ResignationDate','ResignationReason' ];
    const rows = filtered.map(s=>[
      s.id,
      s.name,
      s.role,
      s.department,
      s.grade||'',
      s.email||'',
      s.phone||'',
      s.doj||'',
      s.reportsTo||'',
      s.attendance30 ?? '',
      s.leavesTakenYTD ?? '',
      s.leaveBalance ?? '',
      s.onLeaveToday ? 'Yes':'No',
      s.status || 'Active',
      s.lastAppraisal || '',
      s.nextAppraisal || '',
      s.resignationDate || '',
      s.resignationReason || ''
    ]);
    exportRowsAsCSV(headers, rows, { filename:'staff_export.csv', bom:true });
  }
  async function createStaff(){
    // generate staff_code attempt; retry with counter if conflict
    let attempt = 0; let staff_code;
    const basePrefix = addForm.role==='Teacher' ? 'T' : 'NT';
    while(attempt < 5){
      staff_code = basePrefix + String(staff.length + 1 + attempt).padStart(3,'0');
      try {
        const payload = mapStaffToCreatePayload({ ...addForm, staff_code });
        const created = await api.createStaff(payload);
        const mapped = mapStaffFromApi(created);
        setStaff(prev=> [mapped, ...prev]);
        setShowAdd(false);
        return;
      } catch(err){
        if(!String(err.message).includes('409') || attempt===4){
          push('Create failed: '+err.message, { type:'error' });
          return;
        }
        attempt++;
      }
    }
  }
  function openResign(s){ setSelected(s); setResign({ date:new Date().toISOString().slice(0,10), reason:'' }); setShowResign(true); }
  async function confirmResign(){
    if(!selected) return;
    try {
      await api.updateStaff(selected.id, { status:'Resigned', resignation_date: resign.date, resignation_reason: resign.reason || null });
      setStaff(prev=> prev.map(x=> x.id===selected.id ? { ...x, status:'Resigned', resignationDate: resign.date, resignationReason: resign.reason }: x));
    } catch(err){
      push('Failed to resign: '+err.message, { type:'error' });
    } finally {
      setShowResign(false); setSelected(null);
    }
  }
  async function reinstate(id){
    try { await api.updateStaff(id, { status:'Active', resignation_date: null, resignation_reason: null }); }
    catch(err){ push('Failed to reinstate: '+err.message, { type:'error' }); return; }
    setStaff(prev=> prev.map(x=> x.id===id ? { ...x, status:'Active', resignationDate: undefined, resignationReason: undefined }: x));
  }

  // Recompute onLeaveToday flags whenever requests change
  useEffect(()=>{
    const onLeaveSet = deriveOnLeaveToday(requests);
    setStaff(prev => prev.map(s => onLeaveSet.has(s.id) ? { ...s, onLeaveToday:true } : { ...s, onLeaveToday:false }));
  }, [requests]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-content-center shadow-sm"><span className="text-xs font-semibold">SM</span></div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Staff Management</h1>
              <p className="text-xs text-slate-500">Modular rebuild · directory · leave · insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sendAnnouncement} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm text-sm"><Megaphone size={14}/>Announcement</button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm text-sm"><Download size={14}/>Export</button>
            <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm text-sm"><Plus size={14}/>Add Staff</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {(loading || leaveLoading || transitioningLeave) && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 flex items-center gap-3">
            <span className="animate-spin inline-block h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full" />
            <span>Loading{transitioningLeave? ' (updating leave)':''}…</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 flex items-center justify-between">
            <span>Error: {error}</span>
            <button onClick={()=>window.location.reload()} className="text-rose-700 underline text-xs">Reload</button>
          </div>
        )}
        <section>
          <MetricsBar metrics={metrics} />
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <StaffFilters
                search={search} setSearch={setSearch}
                dept={dept} setDept={setDept}
                role={role} setRole={setRole}
                minAttendance={minAttendance} setMinAttendance={setMinAttendance}
                showOnLeaveOnly={showOnLeaveOnly} setShowOnLeaveOnly={setShowOnLeaveOnly}
                includeResigned={includeResigned} setIncludeResigned={setIncludeResigned}
                departments={DEPARTMENTS} roles={ROLES}
              />
            </div>
            <StaffTable rows={filtered} onSelect={setSelected} />
            <LeaveRequestsPanel requests={requests} onAction={handleRequest} />
          </div>
          <div className="space-y-6">
            <AttendanceTrendChart data={ATTENDANCE_TREND} />
            <GradeCoverageCard gradeCounts={gradeCounts} />
            <ResignationsCard resignations={resignations} onReinstate={reinstate} />
            <QuickActions 
              onAssignDuty={()=> setShowAssignDuty(true)} 
              onPlanSubs={()=> setShowSubs(true)} 
              onNotify={sendAnnouncement} 
              onExport={exportCSV} 
            />
            <DutiesPanel duties={duties} staffIndex={useMemo(()=> new Map(staff.map(s=>[s.id,s])), [staff])} />
            <SubstitutionsPanel subs={subsList} staffIndex={useMemo(()=> new Map(staff.map(s=>[s.id,s])), [staff])} />
          </div>
        </section>
      </main>

      <StaffDetailPanel staff={selected} onClose={()=>setSelected(null)} onOpenResign={openResign} />
      <AddStaffModal open={showAdd} onClose={()=>setShowAdd(false)} form={addForm} setForm={setAddForm} roles={ROLES} departments={DEPARTMENTS} onCreate={createStaff} />
      <ResignModal open={showResign} onClose={()=>setShowResign(false)} staff={selected} resign={resign} setResign={setResign} onConfirm={confirmResign} />
      <AssignDutyModal 
        open={showAssignDuty} 
        onClose={()=> setShowAssignDuty(false)} 
        staff={staff} 
        form={assignDutyForm} 
        setForm={setAssignDutyForm} 
        submitting={assignSubmitting}
        onSubmit={async ()=>{
          setAssignSubmitting(true);
          try {
            const payload = { staff_id: assignDutyForm.staffId, title: assignDutyForm.title.trim(), duty_date: assignDutyForm.date, notes: assignDutyForm.notes || null };
            const created = await api.createStaffDuty(payload);
            setDuties(prev=> [created, ...prev].slice(0,10));
            push('Duty assigned', { type:'success' });
            setShowAssignDuty(false);
            setAssignDutyForm({ title:'', date:new Date().toISOString().slice(0,10), staffId:'', notes:'' });
          } catch(err){
            push('Failed to assign duty: '+err.message, { type:'error' });
          } finally { setAssignSubmitting(false); }
        }}
      />
      <SubstitutionPlannerModal 
        open={showSubs} 
        onClose={()=> setShowSubs(false)} 
        staff={staff}
        form={subsForm}
        setForm={setSubsForm}
        submitting={subsSubmitting}
        onSubmit={async ()=>{
          setSubsSubmitting(true);
          try {
            const payload = { date: subsForm.date, absent_staff_id: subsForm.absentId, substitute_staff_id: subsForm.subId, periods: subsForm.periods.trim(), notes: subsForm.notes || null };
            const created = await api.createStaffSubstitution(payload);
            setSubsList(prev=> [created, ...prev].slice(0,10));
            push('Substitution planned', { type:'success' });
            setShowSubs(false);
            setSubsForm({ date:new Date().toISOString().slice(0,10), absentId:'', subId:'', periods:'', notes:'' });
          } catch(err){
            push('Failed to plan substitution: '+err.message, { type:'error' });
          } finally { setSubsSubmitting(false); }
        }}
      />

      <footer className="py-6 text-center text-xs text-slate-400">Modular Staff Management · Reintroduced features {new Date().getFullYear()}</footer>
      {/* Announcement Modal */}
      <AnimatePresence>
        {showAnnounce && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{scale:.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:.9, opacity:0}} className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm flex items-center gap-2"><Megaphone size={16} className="text-indigo-600"/> Broadcast Announcement</h2>
                <button onClick={()=>!announceSending && setShowAnnounce(false)} className="p-1 rounded-md hover:bg-slate-100"><X size={16}/></button>
              </div>
              <div className="space-y-2">
                <textarea value={announceText} onChange={e=>setAnnounceText(e.target.value)} rows={4} className="w-full rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Write a short message to all active staff..." />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{staff.filter(s=>s.status!=='Resigned').length} recipients</span>
                  <span>{announceText.length}/500</span>
                </div>
              </div>
              {announceSent.length>0 && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 max-h-28 overflow-auto text-xs space-y-1">
                  {announceSent.map(a=> <div key={a.at} className="flex items-start gap-2"><span className="text-slate-400">{new Date(a.at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span className="flex-1">{a.message}</span><span className="text-slate-400">{a.count}</span></div> )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button disabled={announceSending} onClick={()=>setShowAnnounce(false)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button disabled={!announceText.trim() || announceText.length>500 || announceSending} onClick={confirmAnnouncement} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {announceSending && <span className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
                  <Send size={14}/>Send
                </button>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500"/> This sends only locally for now – connect to backend broadcast endpoint to persist.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}













