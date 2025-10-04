// New Students Page (shadcn-like scaffold integration)
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { exportRowsAsCSV } from '../utils/csv';
import { api } from '../api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import Select from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import { Sheet, SheetHeader, SheetTitle, SheetBody } from '../components/ui/Sheet';
import { Skeleton } from '../components/ui/Skeleton';
import clsx from 'clsx';
import {
  Search as SearchIcon,
  Filter as FilterIcon,
  Users as UsersIcon,
  AlertTriangle,
  Bus,
  MoreHorizontal,
  Eye,
  MessageSquareText,
  FileDown
} from 'lucide-react';

// Dummy fallback student dataset (used if API returns empty or fails)
const DUMMY_STUDENTS = [
  { id:'ST1001', first_name:'Aarav', last_name:'Sharma', admission_no:'A001', klass:5, section:'A', roll_no:12, guardian_name:'Rohan Sharma', guardian_phone:'+91-9876543201', fee_due_amount:0, attendancePct:94, transport:{route:'R1', stop:'Central'}, tags:['IEP'], status:'Active', absent_today:false, updated_at:new Date().toISOString(), blood_group:'B+', address:'12 Green Park, Delhi' },
  { id:'ST1002', first_name:'Ananya', last_name:'Verma', admission_no:'A002', klass:8, section:'B', roll_no:5, guardian_name:'Meera Verma', guardian_phone:'+91-9876543202', fee_due_amount:1200, attendancePct:88, transport:null, tags:['ALLERGY'], status:'Active', absent_today:false, updated_at:new Date().toISOString(), blood_group:'O+', address:'44 Lake Road, Bangalore' },
  { id:'ST1003', first_name:'Vihaan', last_name:'Patel', admission_no:'A003', klass:10, section:'C', roll_no:18, guardian_name:'Suresh Patel', guardian_phone:'+91-9876543203', fee_due_amount:0, attendancePct:97, transport:{route:'R2', stop:'Mall'}, tags:[], status:'Active', absent_today:true, updated_at:new Date().toISOString(), blood_group:'A+', address:'221B Baker Street (demo)' },
  { id:'ST1004', first_name:'Sara', last_name:'Khan', admission_no:'A004', klass:2, section:'A', roll_no:3, guardian_name:'Imran Khan', guardian_phone:'+91-9876543204', fee_due_amount:5000, attendancePct:76, transport:{route:'R3', stop:'North Gate'}, tags:['ALLERGY','IEP'], status:'Active', absent_today:false, updated_at:new Date().toISOString(), blood_group:'AB+', address:'Palm Meadows, Hyderabad' },
  { id:'ST1005', first_name:'Kabir', last_name:'Singh', admission_no:'A005', klass:12, section:'D', roll_no:27, guardian_name:'Amit Singh', guardian_phone:'+91-9876543205', fee_due_amount:0, attendancePct:91, transport:null, tags:[], status:'Active', absent_today:false, updated_at:new Date().toISOString(), blood_group:'O-', address:'Indiranagar, Bangalore' }
];

// Local types approximation (align with backend when available)
// Using the richer scaffold fields; backend currently returns simpler student objects.

function initials(name){
  return name.split(/\s+/).map(n=>n[0]||'').slice(0,2).join('').toUpperCase();
}

function formatINR(n){
  if(isNaN(n)) return '—';
  try { return n.toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}); } catch { return `₹${n}`; }
}

export default function Students(){
  // Server data & loading
  const [serverStudents,setServerStudents] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  // Enhanced filter state (from scaffold)
  const [year,setYear] = useState('2025-26');
  const [grade,setGrade] = useState('All');
  const [section,setSection] = useState('All');
  const [status,setStatus] = useState('Active'); // placeholder; backend may not send yet
  const [query,setQuery] = useState('');

  const [chipFeeDue,setChipFeeDue] = useState(false);
  const [chipAbsent,setChipAbsent] = useState(false);
  const [chipTransport,setChipTransport] = useState(false);
  const [chipIEP,setChipIEP] = useState(false);
  const [chipAllergy,setChipAllergy] = useState(false);
  const [showOps,setShowOps] = useState(false);

  // Selection & drawer
  const [selected,setSelected] = useState(new Set());
  const [drawerStudent,setDrawerStudent] = useState(null);
  const [drawerTab,setDrawerTab] = useState('overview');
  const [drawerOpen,setDrawerOpen] = useState(false);
  const [drawerEdit,setDrawerEdit] = useState(false);
  const [editDirty,setEditDirty] = useState(false);
  const [saving,setSaving] = useState(false);
  const [form,setForm] = useState(null); // current editable snapshot
  const [formErrors,setFormErrors] = useState({});

  // Fetch students (mapping backend format to extended scaffold shape where possible)
  useEffect(()=>{
    let cancelled=false;
    api.listStudents()
      .then(list=>{
        if(cancelled) return;
        const raw = (Array.isArray(list) && list.length>0) ? list : DUMMY_STUDENTS;
        const mapped = raw.map(s => ({
          id: s.id || s.uuid || String(s.admission_no || s.admissionNo || s.id || Math.random()),
          name: [s.first_name, s.last_name].filter(Boolean).join(' ') || s.name || 'Unnamed',
          admissionNo: s.admission_no || s.admissionNo || s.id || '-',
            grade: parseInt(s.klass || s.grade || 0) || 0,
          section: s.section || s.section_name || '-',
          rollNo: s.roll_no || s.rollNo || null,
          guardianName: s.guardian_name || s.guardianName || '-',
          guardianPhone: s.guardian_phone || s.guardianPhone || '-',
          attendancePct: s.attendancePct || 0,
          feeDueAmount: s.fee_due_amount || s.feeDueAmount || 0,
          transport: s.transport || null,
          tags: s.tags || [],
          status: s.status || 'Active',
          absentToday: s.absent_today || s.absentToday || false,
          updatedAt: s.updated_at || s.updatedAt || new Date().toISOString(),
          bloodGroup: s.blood_group || s.bloodGroup || null,
          address: s.address || null
        }));
        setServerStudents(mapped);
        setError(null);
        setLoading(false);
      })
      .catch(e=>{ if(!cancelled){
        // API failed, use dummy dataset
        const mapped = DUMMY_STUDENTS.map(s => ({
          id: s.id,
          name: [s.first_name, s.last_name].filter(Boolean).join(' '),
          admissionNo: s.admission_no,
          grade: s.klass,
          section: s.section,
          rollNo: s.roll_no,
          guardianName: s.guardian_name,
          guardianPhone: s.guardian_phone,
          attendancePct: s.attendancePct,
          feeDueAmount: s.fee_due_amount,
          transport: s.transport,
          tags: s.tags,
          status: s.status,
          absentToday: s.absent_today,
          updatedAt: s.updated_at,
          bloodGroup: s.blood_group,
          address: s.address
        }));
        setServerStudents(mapped);
        setError(e.message);
        setLoading(false);
      }});
    return ()=>{ cancelled=true; };
  },[]);

  // Filtered list
  const filtered = useMemo(()=>{
    return serverStudents.filter(s => {
      if(status!== 'All' && s.status !== status) return false;
      if(grade !== 'All' && String(s.grade) !== grade) return false;
      if(section !== 'All' && s.section !== section) return false;
      if(chipFeeDue && !(s.feeDueAmount>0)) return false;
      if(chipAbsent && !s.absentToday) return false;
      if(chipTransport && !s.transport) return false;
      if(chipIEP && !s.tags.includes('IEP')) return false;
      if(chipAllergy && !s.tags.includes('ALLERGY')) return false;
      if(query){
        const hay = [s.name,s.admissionNo,s.guardianName,s.guardianPhone,`${s.grade}-${s.section}`, s.rollNo||''].join(' ').toLowerCase();
        if(!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  },[serverStudents,status,grade,section,chipFeeDue,chipAbsent,chipTransport,chipIEP,chipAllergy,query]);

  const totalDueCount = filtered.filter(s=>s.feeDueAmount>0).length;
  const totalDueAmount = filtered.reduce((a,s)=>a+(s.feeDueAmount||0),0);
  const absentCount = filtered.filter(s=>s.absentToday).length;

  // CSV export
  const exportCSV = () => {
    const fields = [
      'ID','Name','AdmissionNo','Grade','Section','GuardianName','GuardianPhone',
      ...(showOps ? ['AttendancePct','FeeDueAmount'] : []),
      'TransportRoute','TransportStop','Tags','Status','AbsentToday','UpdatedAt'
    ];
    const rows = filtered.map(s => {
      const base = [
        s.id,
        s.name,
        s.admissionNo,
        s.grade,
        s.section,
        s.guardianName,
        s.guardianPhone
      ];
      if(showOps){ base.push(s.attendancePct, s.feeDueAmount); }
      base.push(
        s.transport?.route || '',
        s.transport?.stop || '',
        s.tags.join(';'),
        s.status,
        s.absentToday ? 'Yes':'No',
        s.updatedAt
      );
      return base;
    });
    exportRowsAsCSV(fields, rows, { filename:`students_${year}_${grade}_${section}.csv`, bom:true });
  };

  const toggleAll = (checked) => {
    if(checked) setSelected(new Set(filtered.map(s=>s.id)));
    else setSelected(new Set());
  };
  const toggleOne = (id,checked) => {
    setSelected(prev=>{ const n=new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  };

  const openDrawer = (s) => { setDrawerStudent(s); setDrawerOpen(true); setDrawerEdit(false); setEditDirty(false); setBonafide(null); };

  // Helpers to split name into first/last (very naive)
  const splitName = (name) => {
    if(!name) return { first_name:'', last_name:''};
    const parts = name.trim().split(/\s+/);
    if(parts.length===1) return { first_name: parts[0], last_name: ''};
    return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  };

  const beginEdit = () => {
    if(!drawerStudent) return;
    const { first_name, last_name } = splitName(drawerStudent.name);
    setForm({
      first_name,
      last_name,
      klass: drawerStudent.grade || '',
      section: drawerStudent.section || '',
      roll_no: drawerStudent.rollNo || '',
      guardian_name: drawerStudent.guardianName || '',
      guardian_phone: drawerStudent.guardianPhone || '',
      blood_group: drawerStudent.bloodGroup || '',
      address: drawerStudent.address || '',
      tags: [...(drawerStudent.tags||[])],
      transport: drawerStudent.transport ? { ...drawerStudent.transport } : null
    });
    setFormErrors({});
    setDrawerEdit(true);
  };

  const cancelEdit = () => {
    if(editDirty && !window.confirm('Discard unsaved changes?')) return;
    setDrawerEdit(false); setEditDirty(false); setForm(null); setFormErrors({});
  };

  const updateForm = (patch) => {
    setForm(f => { const next = { ...f, ...patch }; setEditDirty(true); return next; });
  };

  const validate = useCallback((data) => {
    const errs = {};
    if(!data.first_name) errs.first_name = 'First name required';
    if(data.klass === '' || isNaN(parseInt(data.klass))) errs.klass = 'Grade required';
    else if(parseInt(data.klass) < 1 || parseInt(data.klass) > 12) errs.klass = 'Grade 1-12';
    if(!data.section) errs.section = 'Section required';
    else if(!/^[A-Za-z]$/.test(data.section)) errs.section = 'One letter';
    if(data.roll_no && isNaN(parseInt(data.roll_no))) errs.roll_no = 'Roll must be number';
    if(data.guardian_phone && !/^[0-9+\-()\s]{8,20}$/.test(data.guardian_phone)) errs.guardian_phone = 'Phone invalid';
    if(data.tags.some(t=>t.length>20)) errs.tags = 'Tag max 20 chars';
    setFormErrors(errs);
    return errs;
  },[]);

  const saveEdit = async () => {
    if(!form || !drawerStudent) return;
    const errs = validate(form);
    if(Object.keys(errs).length){ return; }
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name || null,
        klass: form.klass ? parseInt(form.klass) : null,
        section: form.section.toUpperCase(),
        roll_no: form.roll_no === '' ? null : parseInt(form.roll_no),
        guardian_name: form.guardian_name || null,
        guardian_phone: form.guardian_phone || null,
        blood_group: form.blood_group || null,
        address: form.address || null,
        tags: form.tags,
        transport: form.transport ? { route: form.transport.route || '', stop: form.transport.stop || '' } : null
      };
      await api.updateStudent(drawerStudent.id, payload);
      // Optimistic local merge
      setServerStudents(list => list.map(s => s.id === drawerStudent.id ? {
        ...s,
        name: [payload.first_name, payload.last_name].filter(Boolean).join(' '),
        grade: payload.klass ?? s.grade,
        section: payload.section,
        rollNo: payload.roll_no,
        guardianName: payload.guardian_name || '-',
        guardianPhone: payload.guardian_phone || '-',
        bloodGroup: payload.blood_group,
        address: payload.address,
        tags: payload.tags,
        transport: payload.transport,
        updatedAt: new Date().toISOString()
      } : s));
      // Update drawer student snapshot
      setDrawerStudent(prev => prev ? { ...prev,
        name: [payload.first_name, payload.last_name].filter(Boolean).join(' '),
        grade: payload.klass ?? prev.grade,
        section: payload.section,
        rollNo: payload.roll_no,
        guardianName: payload.guardian_name || '-',
        guardianPhone: payload.guardian_phone || '-',
        bloodGroup: payload.blood_group,
        address: payload.address,
        tags: payload.tags,
        transport: payload.transport,
        updatedAt: new Date().toISOString()
      } : prev);
      setDrawerEdit(false); setEditDirty(false); setForm(null);
    } catch(e){
      alert('Save failed: '+ e.message);
    } finally { setSaving(false); }
  };

  // Tag editor inline component
  const TagEditor = ({ value, onChange, error }) => {
    const [input,setInput] = useState('');
    const addTag = (t) => {
      t = t.trim().toUpperCase();
      if(!t) return; if(value.includes(t)) return; onChange([...value,t]); setInput('');
    };
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1 mb-1">
          {value.map(tag => (
            <Badge key={tag} variant={tag==='ALLERGY'? 'danger':'outline'} className="flex items-center gap-1">
              {tag}
              <button type="button" className="text-[10px] px-1" onClick={()=>onChange(value.filter(t=>t!==tag))}>✕</button>
            </Badge>
          ))}
          {value.length===0 && <span className="text-xs text-muted-foreground">No tags</span>}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add tag…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{
            if(e.key==='Enter'){ e.preventDefault(); addTag(input); }
          }} />
          <Button type="button" variant="outline" size="sm" onClick={()=>addTag(input)}>Add</Button>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
    );
  };

  const TransportEditor = ({ value, onChange }) => {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Route</div>
            <Input value={value?.route || ''} placeholder="Route" onChange={e=>onChange({ ...(value||{}), route: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Stop</div>
            <Input value={value?.stop || ''} placeholder="Stop" onChange={e=>onChange({ ...(value||{}), stop: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={()=>onChange(value ? null : { route:'', stop:'' })}>{value ? 'Remove transport':'Assign transport'}</Button>
        </div>
      </div>
    );
  };
  const [messaging,setMessaging] = useState(false);
  const [bonafide,setBonafide] = useState(null);
  const sendMessage = async (s) => {
    const text = prompt('Message to guardian of '+s.name+':');
    if(!text) return;
    setMessaging(true);
    try { await api.messageGuardian(s.id, text); alert('Queued'); } catch(e){ alert(e.message); } finally { setMessaging(false); }
  };
  const fetchBonafide = async (s) => {
    try { const r = await api.getBonafide(s.id); setBonafide(r.bonafide_text); }
    catch(e){ alert(e.message); }
  };

  // Basic saved view samples
  const applySavedView = (k) => {
    if(k==='ALL'){ setGrade('All'); setSection('All'); setStatus('Active'); setChipFeeDue(false); setChipAbsent(false); setChipTransport(false); setChipIEP(false); setChipAllergy(false); setQuery(''); }
    else if(k==='ABSENT'){ setChipAbsent(true); setStatus('Active'); }
    else if(k==='DUES'){ setChipFeeDue(true); setStatus('Active'); }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          <h1 className="text-xl font-semibold tracking-tight">Students</h1>
          <span className="text-xs text-muted-foreground">{filtered.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={grade} onChange={e=>setGrade(e.target.value)} className="w-[110px]">
            <option value="All">All Grades</option>
            {Array.from({length:12}).map((_,i)=>(<option key={i+1} value={i+1}>{i+1}</option>))}
          </Select>
          <Select value={section} onChange={e=>setSection(e.target.value)} className="w-[90px]">
            <option value="All">All</option>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(s=>(<option key={s} value={s}>{s}</option>))}
          </Select>
          <Select value={year} onChange={e=>setYear(e.target.value)} className="w-[120px]">
            <option value="2025-26">2025–26</option>
            <option value="2024-25">2024–25</option>
          </Select>
          <Select value={status} onChange={e=>setStatus(e.target.value)} className="w-[120px]">
            {['All','Active','Applicant','Alumni','Transferred','On Leave'].map(s=>(<option key={s} value={s}>{s}</option>))}
          </Select>
          <div className="relative w-[220px] md:w-[260px]">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 opacity-60" />
            <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, adm no., guardian…" className="pl-8" />
          </div>
          <Button variant={showOps? 'secondary':'outline'} size="sm" className="rounded-full" onClick={()=>setShowOps(v=>!v)}>
            {showOps ? 'Ops: attendance & fees' : 'Show attendance & fees'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      {/* Snapshot cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          [0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <Card className="shadow-sm"><CardContent className="p-3"><div className="text-sm text-muted-foreground">Total (filtered)</div><div className="text-2xl font-semibold">{filtered.length}</div></CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" />Absent today</div><div className="text-2xl font-semibold">{absentCount}</div></CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-3"><div className="text-sm text-muted-foreground">Fee dues (count)</div><div className="text-2xl font-semibold">{totalDueCount}</div></CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-3"><div className="text-sm text-muted-foreground">Fee dues (₹)</div><div className="text-2xl font-semibold">{formatINR(totalDueAmount)}</div></CardContent></Card>
          </>
        )}
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block rounded-2xl border bg-card min-h-[300px]">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-8 w-full" />))}
          </div>
        ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Adm No.</th>
              <th className="p-2">Class</th>
              <th className="p-2">Roll</th>
              <th className="p-2">Guardian</th>
              <th className="p-2">Blood</th>
              <th className="p-2">Address</th>
              {showOps && <th className="p-2">Attendance</th>}
              {showOps && <th className="p-2">Fees</th>}
              <th className="p-2">Transport</th>
              <th className="p-2">Tags</th>
              <th className="p-2 text-right"><MoreHorizontal className="h-4 w-4" /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b last:border-none hover:bg-muted/40">
                <td className="p-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{initials(s.name)}</div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm flex items-center gap-2">{s.name}{s.absentToday && <Badge variant="danger" className="text-[10px]">ABSENT</Badge>}</span>
                      <span className="text-[11px] text-muted-foreground">Updated {new Date(s.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </td>
                <td className="p-2 text-sm">{s.admissionNo}</td>
                <td className="p-2 text-sm">{s.grade}-{s.section}</td>
                <td className="p-2 text-sm">{s.rollNo ?? '—'}</td>
                <td className="p-2 text-sm">
                  <div className="flex flex-col"><span>{s.guardianName}</span><span className="text-muted-foreground text-[11px]">{s.guardianPhone}</span></div>
                </td>
                <td className="p-2 text-sm">{s.bloodGroup || '—'}</td>
                <td className="p-2 text-sm max-w-[200px] truncate" title={s.address || ''}>{s.address || '—'}</td>
                {showOps && <td className="p-2 text-sm">{s.attendancePct}%</td>}
                {showOps && <td className="p-2 text-sm">{s.feeDueAmount>0 ? <Badge variant="outline">Due {formatINR(s.feeDueAmount)}</Badge> : <Badge variant="outline">Paid</Badge>}</td>}
                <td className="p-2 text-sm">{s.transport ? <span className="inline-flex items-center gap-1"><Bus className="h-3.5 w-3.5" /> {s.transport.route} • {s.transport.stop}</span> : <span className="text-muted-foreground">—</span>}</td>
                <td className="p-2 text-sm"><div className="flex flex-wrap gap-1">{s.tags.map(t => <Badge key={t} variant={t==='ALLERGY' ? 'danger':'outline'}>{t}</Badge>)}</div></td>
                <td className="p-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={()=>openDrawer(s)}><Eye className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={showOps? 12:10} className="p-8 text-center text-sm text-muted-foreground">No students match current filters.</td></tr>}
          </tbody>
        </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2 min-h-[200px]">
        {loading && (
          <div className="space-y-2">{Array.from({length:4}).map((_,i)=>(<Skeleton key={i} className="h-24 w-full rounded-xl" />))}</div>
        )}
        {filtered.map(s => (
          <div key={s.id} className="rounded-xl border p-3 bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">{initials(s.name)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{s.name}</div>
                  <Button variant="ghost" size="sm" onClick={()=>openDrawer(s)}>View</Button>
                </div>
                <div className="text-xs text-muted-foreground">{s.grade}-{s.section} • Roll {s.rollNo ?? '—'}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{s.address || '—'}</div>
                {showOps && <div className="mt-1 flex items-center gap-2"><Badge variant="outline">{s.attendancePct}%</Badge>{s.feeDueAmount>0 ? <Badge variant="outline">Due {formatINR(s.feeDueAmount)}</Badge> : <Badge variant="outline">Paid</Badge>}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer (simple inline implementation) */}
      <Sheet open={drawerOpen && !!drawerStudent} onOpenChange={setDrawerOpen}>
        {drawerStudent && (
          <>
            <SheetHeader>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">{initials(drawerStudent.name)}</div>
              <div className="flex flex-col">
                <SheetTitle>{drawerStudent.name}</SheetTitle>
                <span className="text-xs text-muted-foreground">{drawerStudent.admissionNo} • {drawerStudent.grade}-{drawerStudent.section}</span>
              </div>
              <div className="ml-auto flex gap-2">
                {!drawerEdit && <Button size="sm" variant="outline" onClick={beginEdit}>Edit</Button>}
                {drawerEdit && <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>}
                <Button size="sm" variant="outline" disabled={messaging || drawerEdit} onClick={()=>sendMessage(drawerStudent)}><MessageSquareText className="h-4 w-4 mr-1" /> Msg</Button>
                <Button size="sm" variant="outline" disabled={drawerEdit} onClick={()=>fetchBonafide(drawerStudent)}><FileDown className="h-4 w-4 mr-1" /> Bonafide</Button>
                <Button size="sm" variant="ghost" onClick={()=>setDrawerOpen(false)}>Close</Button>
              </div>
            </SheetHeader>
            <SheetBody>
              {!drawerEdit && (
              <Tabs
                value={drawerTab}
                onChange={setDrawerTab}
                tabs={[
                  { value:'overview', label:'Overview', content: () => (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Attendance</div><div className="text-xl font-semibold">{drawerStudent.attendancePct}%</div></CardContent></Card>
                        <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Fees</div><div className="text-xl font-semibold">{drawerStudent.feeDueAmount>0 ? <>Due {formatINR(drawerStudent.feeDueAmount)}</> : 'Paid'}</div></CardContent></Card>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">{drawerStudent.tags.length===0 && <span className="text-xs text-muted-foreground">None</span>}{drawerStudent.tags.map(t=> <Badge key={t} variant={t==='ALLERGY'? 'danger':'outline'}>{t}</Badge>)}</div>
                      </div>
                      {bonafide && (
                        <div className="rounded-md border p-3 bg-muted/30 text-xs whitespace-pre-wrap">
                          {bonafide}
                        </div>
                      )}
                    </div>
                  )},
                  { value:'attendance', label:'Attendance', content: () => (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Last 30 days (placeholder)</div>
                      <div className="grid grid-cols-10 gap-1">{Array.from({length:30}).map((_,i)=><div key={i} className="h-5 rounded bg-muted" />)}</div>
                    </div>
                  )},
                  { value:'fees', label:'Fees', content: () => (
                    <div className="space-y-3"><div className="text-sm">Next invoice: <span className="text-muted-foreground">—</span></div><div className="text-sm">Last payment: <span className="text-muted-foreground">—</span></div><Button size="sm" variant="outline">Open ledger</Button></div>
                  )},
                  { value:'academics', label:'Academics', content: () => (<div className="text-sm text-muted-foreground">No academic data yet.</div>)},
                  { value:'docs', label:'Docs', content: () => (
                    <div className="flex flex-col gap-2"><Button variant="outline" size="sm">Open ID card</Button><Button variant="outline" size="sm" onClick={()=>fetchBonafide(drawerStudent)}>Download bonafide</Button><Button variant="outline" size="sm">Upload document</Button></div>
                  )}
                ]}
              />)}
              {drawerEdit && form && (
                <div className="space-y-5 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">First Name</div>
                      <Input value={form.first_name} onChange={e=>updateForm({ first_name: e.target.value })} />
                      {formErrors.first_name && <div className="text-xs text-red-600 mt-0.5">{formErrors.first_name}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Last Name</div>
                      <Input value={form.last_name} onChange={e=>updateForm({ last_name: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Grade</div>
                      <Input value={form.klass} onChange={e=>updateForm({ klass: e.target.value })} />
                      {formErrors.klass && <div className="text-xs text-red-600 mt-0.5">{formErrors.klass}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Section</div>
                      <Input value={form.section} onChange={e=>updateForm({ section: e.target.value })} />
                      {formErrors.section && <div className="text-xs text-red-600 mt-0.5">{formErrors.section}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Roll No</div>
                      <Input value={form.roll_no} onChange={e=>updateForm({ roll_no: e.target.value })} />
                      {formErrors.roll_no && <div className="text-xs text-red-600 mt-0.5">{formErrors.roll_no}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Blood Group</div>
                      <Input value={form.blood_group} onChange={e=>updateForm({ blood_group: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Address</div>
                      <textarea className="w-full border rounded-md p-2 bg-background text-sm" rows={3} value={form.address} onChange={e=>updateForm({ address: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Guardian Name</div>
                        <Input value={form.guardian_name} onChange={e=>updateForm({ guardian_name: e.target.value })} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Guardian Phone</div>
                        <Input value={form.guardian_phone} onChange={e=>updateForm({ guardian_phone: e.target.value })} />
                        {formErrors.guardian_phone && <div className="text-xs text-red-600 mt-0.5">{formErrors.guardian_phone}</div>}
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Tags</div>
                        <TagEditor value={form.tags} onChange={tags=>updateForm({ tags })} error={formErrors.tags} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Transport</div>
                      <TransportEditor value={form.transport} onChange={v=>updateForm({ transport: v })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button size="sm" disabled={saving} onClick={saveEdit}>{saving? 'Saving…':'Save'}</Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={cancelEdit}>Cancel</Button>
                    {editDirty && !saving && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
                  </div>
                </div>
              )}
              <div className="mt-6 text-xs text-muted-foreground">Last update {new Date(drawerStudent.updatedAt).toLocaleDateString()}</div>
            </SheetBody>
          </>
        )}
      </Sheet>
    </div>
  );
}
