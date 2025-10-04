import React, { useMemo, useState, useEffect } from "react";
import { api } from "../../api"; // real API client

// Single-file, light-theme classroom management page for Principal / Headmistress
// No external UI libs required; Tailwind classes used for styling.

/**********************
 * Small UI atoms
 **********************/
function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

function Progress({ percent }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="h-2.5 w-full rounded-full bg-gray-100">
      <div
        className="h-2.5 rounded-full bg-emerald-500"
        style={{ width: `${p}%` }}
        aria-label={`Progress ${p}%`}
      />
    </div>
  );
}

function Badge({ color = "gray", children }) {
  const map = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}

function PillButton({ children, onClick, variant = "ghost", disabled, ...rest }) {
  const base = "px-3 py-2 text-sm rounded-full border transition active:scale-[.98]";
  const tone =
    variant === "primary"
      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
      : variant === "danger"
      ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
  return (
    <button className={`${base} ${tone}`} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

function Drawer({ open, onClose, children, title = "Details" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl transform bg-white shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, width="max-w-xl" }) {
  useEffect(()=> { function onKey(e){ if(e.key==='Escape') onClose(); } if(open) document.addEventListener('keydown', onKey); return ()=> document.removeEventListener('keydown', onKey); }, [open, onClose]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative w-full ${width} rounded-2xl bg-white shadow-2xl border max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

/**********************
 * Helpers
 **********************/
function copy(txt) {
  try {
    navigator.clipboard.writeText(txt);
  } catch {}
}

function downloadCSV(rows, filename = "classrooms.csv") {
  const headers = Object.keys(rows[0] || {});
  const escape = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function pad(n) { return n.toString().padStart(2, "0"); }
function dateToInput(d) {
  // yyyy-mm-dd for <input type="date">
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function nextThursday18() {
  const d = new Date();
  const day = d.getDay();
  let delta = (4 - day + 7) % 7; // 4 = Thu
  if (delta === 0) delta = 7; // next week's Thu
  const due = new Date(d);
  due.setDate(d.getDate() + delta);
  due.setHours(18, 0, 0, 0);
  return dateToInput(due);
}

/**********************
 * Sample data factory
 **********************/
// seedData removed; real data will be fetched from API. Placeholder metrics remain 0 until backend provides them.

export default function ClassroomManagement() {
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [wing, setWing] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [teacher, setTeacher] = useState("");
  const [query, setQuery] = useState("");
  const [drawerRow, setDrawerRow] = useState(null);
  // expose for legacy inline script event handlers (Enter key adds)
  useEffect(()=> { if(drawerRow) { window.__currentDrawerRow = drawerRow; } }, [drawerRow]);
  const [windowLock, setWindowLock] = useState({ planner: false, reportCards: false, exams: false });
  // Inline settings tab replaces previous settings drawer
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'settings'
  const [wingsData, setWingsData] = useState([]);
  const [wingForm, setWingForm] = useState({ id:null, academic_year:'2025-26', name:'', grade_start:'', grade_end:'', target_ratio:'', head_id:'', head_name:'' });
  const [classForm, setClassForm] = useState({ id:null, academic_year:'2025-26', wing_id:'', grade:'', section:'', teacher_name:'', teacher_staff_id:'', assistant_teacher_id:'', support_staff_ids:[], target_ratio:'' });
  const [staff, setStaff] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingWing, setSavingWing] = useState(false);
  const [heads, setHeads] = useState([]); // head mistress list
  const [savingClass, setSavingClass] = useState(false);
  // Student assignment drawer state
  const [assignOpen, setAssignOpen] = useState(false);
  const [studentsAll, setStudentsAll] = useState([]);
  const [assignSelected, setAssignSelected] = useState(new Set());
  const [assignLoading, setAssignLoading] = useState(false);
  // Modal open states
  const [showWingModal, setShowWingModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignFilter, setAssignFilter] = useState("");
  // Storage & Meet edits (settings panel) ephemeral until backend persistence arrives
  const [storageMeetEdits, setStorageMeetEdits] = useState({}); // { [classId]: { storage, meet, dirty:true } }
  const [savingStorageMeet, setSavingStorageMeet] = useState(false);
  async function persistStorageMeet(updates){
    if(!updates || updates.length===0) return;
    try {
      setSavingStorageMeet(true);
      // Convert CLS-id to numeric id
      const payload = updates.map(u => ({ id: Number(u.classId.replace('CLS-','')), storage_path: u.storage, meet_link: u.meet }));
      await api.bulkClassSettings(payload.map(p => ({ id: p.id, storage_path: p.storage_path, meet_link: p.meet_link })));
      // Reflect in rows and clear dirty flags
      setRows(prev => prev.map(r => {
        const match = payload.find(p => p.id === Number(r.id.replace('CLS-','')));
        return match ? { ...r, storage: match.storage_path || r.storage, meet: match.meet_link || r.meet } : r;
      }));
      setStorageMeetEdits(m => {
        const copy = {...m};
        for(const u of updates){ if(copy[u.classId]) copy[u.classId].dirty = false; }
        return copy;
      });
    } catch(e){ alert(e.message||'Failed to save settings'); }
    finally { setSavingStorageMeet(false); }
  }
  function saveAllStorageMeet(){
    const updates = Object.entries(storageMeetEdits).filter(([_,v])=> v.dirty).map(([classId,v])=> ({ classId, storage: v.storage, meet: v.meet }));
    persistStorageMeet(updates);
  }

  // Load students list when drawer opens first time
  useEffect(() => {
    let cancel=false;
    async function loadStudents(){
      if(!assignOpen) return;
      if(studentsAll.length>0) return; // cache
      setAssignLoading(true); setAssignError(null);
      try {
        const list = await api.listStudents();
        if(!cancel) setStudentsAll(list);
      } catch(e){ if(!cancel) setAssignError(e.message||'Failed'); }
      finally { if(!cancel) setAssignLoading(false);}    }
    loadStudents();
    return ()=> { cancel=true; };
  }, [assignOpen, studentsAll.length]);

  function toggleAssignStudent(id){
    setAssignSelected(prev=> { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function submitAssign(){
    if(!drawerRow) return;
    if(assignSelected.size===0){ setAssignOpen(false); return; }
    setAssignLoading(true); setAssignError(null);
    try {
      const classIdNum = drawerRow.id.replace('CLS-','');
      await api.assignStudentsToClass(classIdNum, { student_ids: Array.from(assignSelected).map(Number) });
      // optimistic update: increment student count
      setRows(prev => prev.map(r => r.id===drawerRow.id ? { ...r, students: r.students + assignSelected.size } : r));
      setAssignSelected(new Set());
      setAssignOpen(false);
      setRefreshTick(t=>t+1); // force backend refresh for accurate metrics
    } catch(e){ setAssignError(e.message||'Failed to assign'); }
    finally { setAssignLoading(false); }
  }

  // Bulk-select + composer state
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  // Removed broadcast / announcement features per spec

  // Ops log with audit data (read receipts / acks / nudges)
  const [opsLog, setOpsLog] = useState([]); // newest first
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditOp, setAuditOp] = useState(null);

  const wings = useMemo(() => Array.from(new Set(rows.map((r) => r.wing).filter(Boolean))), [rows]);
  const grades = useMemo(() => Array.from(new Set(rows.filter((r) => (wing ? r.wing === wing : true)).map((r) => r.grade))), [rows, wing]);
  const sections = useMemo(
    () => Array.from(new Set(rows.filter((r) => (wing ? r.wing === wing : true) && (grade ? r.grade === grade : true)).map((r) => r.section))),
    [rows, wing, grade]
  );
  const teachers = useMemo(() => Array.from(new Set(rows.map((r) => r.teacher))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (wing && r.wing !== wing) return false;
      if (grade && r.grade !== grade) return false;
      if (section && r.section !== section) return false;
      if (teacher && r.teacher !== teacher) return false;
      if (query) {
        const q = query.toLowerCase();
        const text = `${r.wing} ${r.grade} ${r.section} ${r.teacher}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [rows, wing, grade, section, teacher, query]);

  const filteredIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);
  const filteredStudents = useMemo(() => {
    if(!assignFilter) return studentsAll;
    const q = assignFilter.toLowerCase();
    return studentsAll.filter(s => {
      const name = (s.name || s.full_name || `${s.first_name||''} ${s.last_name||''}`).toLowerCase();
      return name.includes(q);
    });
  }, [studentsAll, assignFilter]);

  // Summary + Latest Ack % for current view
  const summary = useMemo(() => {
    const cls = filtered.length;
    const students = filtered.reduce((a, b) => a + b.students, 0);
    const attend = filtered.reduce((a, b) => a + b.attendance * b.students, 0) / (students || 1);
    const feeDue = Math.round(filtered.reduce((a, b) => a + (b.feeDuePct / 100) * b.students, 0));
  const pending = 0; // pending approvals removed
    const totalCapacity = filtered.reduce((a,b)=> a + (b.target_ratio || 0), 0);
    const capUtil = totalCapacity ? Math.round((students / totalCapacity) * 100) : 0;

    // latest task op that targets any filtered classes
    const latestTask = opsLog.find((op) => op.kind === "Task" && op.recipients.some((rc) => filteredIds.has(rc.classId)));
    let ackPct = 0;
    if (latestTask) {
      const recs = latestTask.recipients.filter((rc) => filteredIds.has(rc.classId));
      const acked = recs.filter((rc) => rc.ack).length;
      ackPct = recs.length ? Math.round((acked / recs.length) * 100) : 0;
    }

    return { cls, students, attend: Math.round(attend), feeDue, pending, ackPct, totalCapacity, capUtil };
  }, [filtered, filteredIds, opsLog]);

  // approvePlanner removed (pending approvals deprecated)

  function lockWindow(key) {
    setWindowLock((x) => ({ ...x, [key]: !x[key] }));
  }

  async function loadTasksNotes(row){
    if(!row) return;
    try {
      const [tasksResp, notesResp] = await Promise.all([
        api.listClassTasks(row.grade, row.section).catch(()=>[]),
        api.listClassNotes(row.grade, row.section).catch(()=>[])
      ]);
      let updatedRowRef = null;
      setRows(prev => prev.map(r => {
        if(r.id!==row.id) return r;
        const existingTasks = r.tasks || [];
        const existingNotes = r.notes || [];
        const taskMap = new Map();
        tasksResp.forEach(t => taskMap.set(t.id, { id: t.id, text: t.text, due: t.due || '', status: t.status }));
        existingTasks.forEach(t => taskMap.set(t.id, t));
        const noteMap = new Map();
        notesResp.forEach(n => noteMap.set(n.id, { id: n.id, text: n.text }));
        existingNotes.forEach(n => noteMap.set(n.id, n));
        const mergedTasks = Array.from(taskMap.values()).sort((a,b)=> b.id - a.id);
        const mergedNotes = Array.from(noteMap.values()).sort((a,b)=> b.id - a.id);
        updatedRowRef = { ...r, tasks: mergedTasks, notes: mergedNotes };
        return updatedRowRef;
      }));
      if(updatedRowRef) setDrawerRow(updatedRowRef);
    } catch(e){ /* silent */ }
  }
  useEffect(()=>{ if(drawerRow){ loadTasksNotes(drawerRow); } }, [drawerRow]);
  async function pushTask(row, text, due=""){
    if(!text) return;
    try {
      // optimistic placeholder
      const tempId = -Date.now();
      let optimisticRef=null;
      setRows(prev => prev.map(r => {
        if(r.id!==row.id) return r;
        optimisticRef = { ...r, tasks: [{ id: tempId, text, due: due||'', status: 'Open' }, ...(r.tasks||[])] };
        return optimisticRef;
      }));
      if(optimisticRef) setDrawerRow(optimisticRef);
      const created = await api.createClassTask({ grade: row.grade, section: row.section, text, due: due? new Date(due).toISOString(): null });
      let finalRef=null;
      setRows(prev => prev.map(r => {
        if(r.id!==row.id) return r;
        const replaced = r.tasks.map(t => t.id===tempId ? { id: created.id, text: created.text, due: created.due||'', status: created.status } : t);
        finalRef = { ...r, tasks: replaced };
        return finalRef;
      }));
      if(finalRef) setDrawerRow(finalRef);
    } catch(e){ alert(e.message||'Failed to create task'); }
  }
  async function updateTask(row, taskId, patch){
    try { const updated = await api.updateClassTask(taskId, patch); let updatedRowRef=null; setRows(prev => prev.map(r => {
      if(r.id!==row.id) return r;
      updatedRowRef = { ...r, tasks: r.tasks.map(t => t.id===taskId ? { id: updated.id, text: updated.text, due: updated.due||'', status: updated.status }: t) };
      return updatedRowRef;
    })); if(updatedRowRef) setDrawerRow(updatedRowRef); } catch(e){ alert(e.message||'Failed'); }
  }
  async function deleteTask(row, taskId){
    if(!window.confirm('Delete task?')) return;
    try { await api.deleteClassTask(taskId); let updatedRowRef=null; setRows(prev => prev.map(r => {
      if(r.id!==row.id) return r; updatedRowRef = { ...r, tasks: r.tasks.filter(t => t.id!==taskId) }; return updatedRowRef; })); if(updatedRowRef) setDrawerRow(updatedRowRef); } catch(e){ alert(e.message||'Failed'); }
  }
  async function addNote(row, text){
    if(!text) return;
    try {
      const tempId = -Date.now();
      let optimisticRef=null;
      setRows(prev => prev.map(r => { if(r.id!==row.id) return r; optimisticRef = { ...r, notes: [{ id: tempId, text }, ...(r.notes||[])] }; return optimisticRef; }));
      if(optimisticRef) setDrawerRow(optimisticRef);
      const created = await api.createClassNote({ grade: row.grade, section: row.section, text });
      let finalRef=null;
      setRows(prev => prev.map(r => { if(r.id!==row.id) return r; finalRef = { ...r, notes: r.notes.map(n => n.id===tempId ? { id: created.id, text: created.text } : n) }; return finalRef; }));
      if(finalRef) setDrawerRow(finalRef);
    } catch(e){ alert(e.message||'Failed'); }
  }
  async function updateNote(row, noteId, text){
    try { const updated = await api.updateClassNote(noteId, { text }); let updatedRowRef=null; setRows(prev => prev.map(r => { if(r.id!==row.id) return r; updatedRowRef = { ...r, notes: r.notes.map(n => n.id===noteId ? { id: updated.id, text: updated.text }: n) }; return updatedRowRef; })); if(updatedRowRef) setDrawerRow(updatedRowRef); } catch(e){ alert(e.message||'Failed'); }
  }
  async function deleteNote(row, noteId){
    if(!window.confirm('Delete note?')) return;
    try { await api.deleteClassNote(noteId); let updatedRowRef=null; setRows(prev => prev.map(r => { if(r.id!==row.id) return r; updatedRowRef = { ...r, notes: r.notes.filter(n => n.id!==noteId) }; return updatedRowRef; })); if(updatedRowRef) setDrawerRow(updatedRowRef); } catch(e){ alert(e.message||'Failed'); }
  }

  function exportView() {
    const rowsForCsv = filtered.map((r) => ({
      Wing: r.wing,
      Class: r.grade, // export class without section per request
      Section: r.section,
      Teacher: r.teacher,
      Students: r.students,
      Male: r.male,
      Female: r.female,
      FeeDuePct: r.feeDuePct,
      StoragePath: r.storage,
      MeetLink: r.meet,
    }));
    downloadCSV(rowsForCsv, "classroom-management-view.csv");
  }

  // Bulk selection helpers
  function isSelected(id) { return selectedIds.has(id); }
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const allIds = filtered.map((r) => r.id);
      const allSelected = allIds.every((id) => prev.has(id)) && allIds.length > 0;
      if (allSelected) return new Set(Array.from(prev).filter((id) => !allIds.includes(id)));
      const next = new Set(prev);
      for (const id of allIds) next.add(id);
      return next;
    });
  }
  function clearSelection() { setSelectedIds(new Set()); }

  // Helpers to find latest task per class and op
  function latestTaskOp() {
    return opsLog.find((op) => op.kind === "Task"); // opsLog is newest first
  }
  function getRowById(id) { return rows.find((r) => r.id === id); }

  // Composer (Task / Announcement)
  // Composer removed

  // Removed targetsFromScope & submitComposer (composer feature removed)

  // Acknowledgement & Nudge controls
  function markAckForClass(classId) {
    setOpsLog((log) => {
      const copy = [...log];
      const op = copy.find((o) => o.kind === "Task");
      if (!op) return log;
      const rec = op.recipients.find((r) => r.classId === classId);
      if (rec) rec.ack = true;
      const row = getRowById(classId);
      if (row) addNote(row, "Teacher acknowledged task");
      return copy;
    });
  }

  function nudgeOverdueInView() {
    setOpsLog((log) => {
      const copy = [...log];
      const op = copy.find((o) => o.kind === "Task");
      if (!op) return log;
      const today = new Date(dateToInput(new Date())); // midnight today
      for (const rec of op.recipients) {
        if (!filteredIds.has(rec.classId)) continue;
        if (rec.ack) continue;
        if (rec.due && new Date(rec.due) < today) {
          rec.nudgedAt = new Date().toISOString();
          const row = getRowById(rec.classId);
          if (row) addNote(row, "Auto-nudge sent for overdue task");
        }
      }
      return copy;
    });
  }

  // Table helpers
  function ackBadgeFor(classId) {
    const op = latestTaskOp();
    if (!op) return <Badge color="gray">—</Badge>;
    const rec = op.recipients.find((r) => r.classId === classId);
    if (!rec) return <Badge color="gray">—</Badge>;
    if (rec.ack) return <Badge color="green">Acked</Badge>;
    const today = new Date(dateToInput(new Date()));
    if (rec.due && new Date(rec.due) < today) return <Badge color="red">Overdue</Badge>;
    return <Badge color="amber">Waiting</Badge>;
  }

  const now = new Date();
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(now);

  const selectedCount = selectedIds.size;
  const filteredAllSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  // Fetch wings + classes on mount / academicYear / manual refresh
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [wingsApi, classesApi, staffList, headList] = await Promise.all([
          api.listWings(academicYear).catch(() => []),
          api.listSchoolClasses(academicYear).catch(() => []),
          api.listStaff().catch(()=>[]),
          api.listHeadMistresses().catch(()=>[]),
        ]);
        if (cancelled) return;
        setWingsData(wingsApi);
        setStaff(staffList);
        setHeads(headList);
        const wingMap = Object.fromEntries(wingsApi.map(w => [w.id, w]));
        const staffMap = Object.fromEntries(staffList.map(s => [s.id, s]));
        const mapped = classesApi.map(c => ({
          id: `CLS-${c.id}`,
          wing: wingMap[c.wing_id]?.name || '',
            grade: String(c.grade),
            section: c.section,
            classLabel: `${c.grade}-${c.section}`,
            teacher: (c.teacher_staff_id && staffMap[c.teacher_staff_id]?.name) || c.teacher_name || '—',
            teacher_staff_id: c.teacher_staff_id || null,
            assistant_teacher_id: c.assistant_teacher_id || null,
            support_staff_ids: c.support_staff_ids || [],
            target_ratio: c.target_ratio || null,
            students: c.total_students || 0,
            male: c.male || 0,
            female: c.female || 0,
            attendance: c.attendance_pct || 0,
            feeDuePct: c.fee_due_pct || 0,
            resultsAvg: c.results_avg || 0,
            // pending approval removed
            storage: `/classes/${c.grade}-${c.section}`,
            meet: `https://meet.google.com/lookup/${c.grade}${c.section}${c.id}`.toLowerCase(),
            notes: [],
            tasks: [],
            lastUpdated: Date.now()
        }));
        setRows(mapped);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [academicYear, refreshTick]);

  async function refreshSettingsData() {
    try {
      setSettingsLoading(true);
      const [w, staffList, headList] = await Promise.all([
        api.listWings(academicYear).catch(()=>[]),
        api.listStaff().catch(()=>[]),
        api.listHeadMistresses().catch(()=>[])
      ]);
      setWingsData(w);
      setStaff(staffList);
      setHeads(headList);
    } finally { setSettingsLoading(false); }
  }

  function editWing(w=null){
    if(!w){
      setWingForm({ id:null, academic_year:academicYear, name:'', grade_start:'', grade_end:'', target_ratio:'', head_id:'', head_name:'' });
    } else {
      // Backend WingOut currently returns 'head' string; head_id may not yet be exposed; attempt to resolve by name if list loaded
      const resolved = heads.find(h => h.name === w.head);
      setWingForm({ id:w.id, academic_year:w.academic_year, name:w.name, grade_start:w.grade_start, grade_end:w.grade_end, target_ratio:w.target_ratio||'', head_id: resolved? String(resolved.id):'', head_name: w.head || '' });
    }
    setShowWingModal(true);
  }
  async function saveWing(){
    setSavingWing(true);
    try {
      // Backend now accepts alphanumeric grade strings; send as-is
      // Until backend exposes head_id field on wings, we continue to send head (name) for backward compatibility
      const selectedHead = heads.find(h => String(h.id) === String(wingForm.head_id));
      const payload = { 
        academic_year: wingForm.academic_year,
        name: wingForm.name,
        grade_start: wingForm.grade_start,
        grade_end: wingForm.grade_end,
        target_ratio: wingForm.target_ratio?Number(wingForm.target_ratio):null,
        head: selectedHead? selectedHead.name : (wingForm.head_name || null)
      };
      if(wingForm.id){ await api.updateWing(wingForm.id, payload); }
      else { await api.createWing(payload); }
      await refreshSettingsData(); setRefreshTick(t=>t+1); setShowWingModal(false);
    } catch(e){ alert(e.message); }
    finally { setSavingWing(false); }
  }
  async function deleteWing(id){ if(!window.confirm('Delete wing?')) return; try{ await api.deleteWing(id); await refreshSettingsData(); setRefreshTick(t=>t+1);}catch(e){ alert(e.message);} }

  function editClass(c=null){
    if(!c){
      setClassForm({ id:null, academic_year:academicYear, wing_id:'', grade:'', section:'', teacher_name:'', teacher_staff_id:'', assistant_teacher_id:'', support_staff_ids:[], target_ratio:'' });
    } else {
      setClassForm({ id:c.id.replace('CLS-',''), academic_year:academicYear, wing_id:wingsData.find(w=>w.name===c.wing)?.id||'', grade:String(c.grade), section:c.section, teacher_name:c.teacher==='—'?'':c.teacher, teacher_staff_id:c.teacher_staff_id?String(c.teacher_staff_id):'', assistant_teacher_id:c.assistant_teacher_id?String(c.assistant_teacher_id):'', support_staff_ids:(c.support_staff_ids||[]).map(x=> String(x)), target_ratio:c.target_ratio||'' });
    }
    setShowClassModal(true);
  }
  async function saveClass(){
    setSavingClass(true);
    try {
      // Treat grade as string now (alphanumeric allowed) so remove Number cast
      const payload = { academic_year: classForm.academic_year, wing_id: classForm.wing_id?Number(classForm.wing_id):null, grade: classForm.grade, section: classForm.section, teacher_staff_id: classForm.teacher_staff_id?Number(classForm.teacher_staff_id):null, assistant_teacher_id: classForm.assistant_teacher_id?Number(classForm.assistant_teacher_id):null, support_staff_ids: classForm.support_staff_ids.map(x=> Number(x)), target_ratio: classForm.target_ratio?Number(classForm.target_ratio):null };
      // Only include teacher_name when no teacher_staff_id chosen (backward compat)
      if(!payload.teacher_staff_id && classForm.teacher_name){ payload.teacher_name = classForm.teacher_name; }
      if(classForm.id){ await api.updateSchoolClass(classForm.id, { wing_id: payload.wing_id, teacher_staff_id: payload.teacher_staff_id, assistant_teacher_id: payload.assistant_teacher_id, support_staff_ids: payload.support_staff_ids, target_ratio: payload.target_ratio, section: payload.section, ...(payload.teacher_name? { teacher_name: payload.teacher_name }: {}) }); }
      else { await api.createSchoolClass(payload); }
      await refreshSettingsData(); setRefreshTick(t=>t+1); setShowClassModal(false);
    } catch(e){ alert(e.message); }
    finally { setSavingClass(false); }
  }
  async function deleteClass(id){ if(!window.confirm('Delete class?')) return; try{ const realId = id.replace('CLS-',''); await api.deleteSchoolClass(realId); setRefreshTick(t=>t+1);}catch(e){ alert(e.message);} }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-2xl font-semibold text-gray-900">Classroom Management</div>
            <div className="text-sm font-semibold text-gray-700">{fmt} • AY {academicYear} {loading && <span className="text-emerald-600 ml-2 font-normal">Loading…</span>} {error && <span className="text-rose-600 ml-2 font-normal">{error}</span>}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm" value={academicYear} onChange={e=>setAcademicYear(e.target.value)}>
              {['2025-26','2024-25','2023-24'].map(y=> <option key={y}>{y}</option>)}
            </select>
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <button type="button" onClick={()=> setActiveTab('dashboard')} className={`px-4 py-2 text-sm rounded-full border transition ${activeTab==='dashboard' ? 'bg-blue-600 text-white border-blue-600 shadow':'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Dashboard</button>
              <button type="button" onClick={()=> { setActiveTab('settings'); refreshSettingsData(); }} className={`px-4 py-2 text-sm rounded-full border transition ${activeTab==='settings' ? 'bg-blue-600 text-white border-blue-600 shadow':'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Settings</button>
            </div>
          </div>
        </div>
        {/* Mobile tab switcher */}
        <div className="sm:hidden -mt-2 mb-4 flex gap-2">
          <button type="button" onClick={()=> setActiveTab('dashboard')} className={`flex-1 px-3 py-2 text-sm rounded-full border ${activeTab==='dashboard' ? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300'}`}>Dashboard</button>
          <button type="button" onClick={()=> { setActiveTab('settings'); refreshSettingsData(); }} className={`flex-1 px-3 py-2 text-sm rounded-full border ${activeTab==='settings' ? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300'}`}>Settings</button>
        </div>

        {activeTab==='dashboard' && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <Stat label="Classes" value={summary.cls} sub="In current view" />
              <Stat label="Students" value={summary.students} sub="Across selected classes" />
              <Stat label="Attendance Today" value={`${summary.attend}%`} sub={<Progress percent={summary.attend} />} />
              <Stat label="Fee Dues (approx students)" value={summary.feeDue} sub={`${Math.round((summary.feeDue / (summary.students || 1)) * 100)}% of students`} />
              {/* Removed Latest Ack (view) tile per new requirements */}
              <Stat label="Capacity Util" value={`${summary.capUtil}%`} sub={summary.totalCapacity ? `${summary.students}/${summary.totalCapacity}` : '—'} />
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm mt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div>
                  <div className="mb-1 text-xs text-gray-500">Wing</div>
                  <Select value={wing} onChange={setWing} options={wings} placeholder="All wings" />
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">Class</div>
                  <Select value={grade} onChange={setGrade} options={grades} placeholder="All classes" />
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">Section</div>
                  <Select value={section} onChange={setSection} options={sections} placeholder="All sections" />
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">Class Teacher</div>
                  <Select value={teacher} onChange={setTeacher} options={teachers} placeholder="All teachers" />
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-1 text-xs text-gray-500">Search</div>
                  <Input value={query} onChange={setQuery} placeholder="Search by wing, class, section, teacher" />
                </div>
              </div>
              {/* Realigned control bar: inline lock toggles & actions */}
              <div className="mt-4 border-t pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                    <span className="font-medium text-gray-700">Planner</span>
                    <button type="button" className={`rounded-full px-2 py-1 text-xs font-medium border ${windowLock.planner? 'bg-red-600 text-white border-red-600':'bg-emerald-600 text-white border-emerald-600'}`} onClick={()=> lockWindow('planner')}>{windowLock.planner? 'Unlock':'Lock'}</button>
                    <span className={`rounded-full px-2 py-0.5 ${windowLock.planner? 'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>{windowLock.planner? 'Locked':'Open'}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                    <span className="font-medium text-gray-700">Report Cards</span>
                    <button type="button" className={`rounded-full px-2 py-1 text-xs font-medium border ${windowLock.reportCards? 'bg-red-600 text-white border-red-600':'bg-emerald-600 text-white border-emerald-600'}`} onClick={()=> lockWindow('reportCards')}>{windowLock.reportCards? 'Unlock':'Lock'}</button>
                    <span className={`rounded-full px-2 py-0.5 ${windowLock.reportCards? 'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>{windowLock.reportCards? 'Locked':'Open'}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                    <span className="font-medium text-gray-700">Exams</span>
                    <button type="button" className={`rounded-full px-2 py-1 text-xs font-medium border ${windowLock.exams? 'bg-red-600 text-white border-red-600':'bg-emerald-600 text-white border-emerald-600'}`} onClick={()=> lockWindow('exams')}>{windowLock.exams? 'Unlock':'Lock'}</button>
                    <span className={`rounded-full px-2 py-0.5 ${windowLock.exams? 'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>{windowLock.exams? 'Locked':'Open'}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <PillButton onClick={()=> setRefreshTick(t=>t+1)}>Refresh</PillButton>
                    <PillButton onClick={()=> exportView()}>Export CSV</PillButton>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

  {activeTab==='dashboard' && selectedCount > 0 && (
          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-gray-700"><span className="font-medium">{selectedCount}</span> classes selected</div>
              <div className="flex flex-wrap items-center gap-2">
                <PillButton variant="primary" onClick={() => openComposer("task", "selected")}>Assign Task</PillButton>
                <PillButton onClick={() => openComposer("announce", "selected")}>Broadcast</PillButton>
                <PillButton onClick={clearSelection}>Clear</PillButton>
              </div>
            </div>
          </div>
        )}

  {activeTab==='dashboard' && (
  <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-3">
            <div className="text-sm text-gray-600">{filtered.length} classrooms</div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className={`rounded-full px-2 py-1 font-medium ${windowLock.planner? 'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>Planner {windowLock.planner? 'Locked':'Open'}</span>
              <span className={`rounded-full px-2 py-1 font-medium ${windowLock.reportCards? 'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>Report Cards {windowLock.reportCards? 'Locked':'Open'}</span>
              <span className={`rounded-full px-2 py-1 font-medium ${windowLock.exams? 'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>Exams {windowLock.exams? 'Locked':'Open'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={filteredAllSelected} onChange={toggleSelectAllFiltered} /></th>
                  <th className="px-4 py-3">Wing</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Students / Cap</th>
                  <th className="px-4 py-3">M/F</th>
                  <th className="px-4 py-3">Fees</th>
                  <th className="px-4 py-3">Storage</th>
                  <th className="px-4 py-3">Meet</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={isSelected(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                    <td className="px-4 py-3 text-gray-700">{r.wing}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="font-medium text-gray-900 hover:underline" onClick={() => setDrawerRow(r)}>{r.grade}</button>
                        {r.tasks?.some(t=> t.status==='Open' && t.due && new Date(t.due) < new Date(dateToInput(new Date()))) && (
                          <Badge color="red">Overdue</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.section}</td>
                    <td className="px-4 py-3 text-gray-700">{r.teacher}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className={r.target_ratio && r.students > r.target_ratio ? 'text-red-600 font-medium' : ''}>{r.students}</span>
                      {r.target_ratio ? <span className="text-xs text-gray-500"> / {r.target_ratio}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.male}/{r.female}</td>
                    <td className="px-4 py-3">
                      <div className="w-28">
                        <div className="mb-1 text-xs text-gray-500">{r.feeDuePct}% due</div>
                        <Progress percent={r.feeDuePct} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <Badge color="blue">{r.storage}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <a href={r.meet} target="_blank" rel="noreferrer" className="text-emerald-700 underline">Open</a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <PillButton onClick={() => setDrawerRow(r)}>Manage</PillButton>
                        {/* Per requirement, Assign Students / To-Do / Mark Ack moved into Manage drawer */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab==='settings' && (
          <div className="space-y-10">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Wings</div>
                  <div className="text-xs text-gray-500">Manage academic wings & capacity ratios</div>
                </div>
                <PillButton onClick={()=> { editWing(); }} variant="primary">+ Wing</PillButton>
              </div>
              {settingsLoading ? <div className="text-xs text-gray-500">Loading…</div> : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Grades</th>
                        <th className="px-3 py-2">Target Ratio</th>
                        <th className="px-3 py-2">Head</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wingsData.map(w => (
                        <tr key={w.id} className="border-t">
                          <td className="px-3 py-2 font-medium text-gray-900">{w.name}</td>
                          <td className="px-3 py-2 text-gray-600">{w.grade_start}–{w.grade_end}</td>
                          <td className="px-3 py-2 text-gray-600">{w.target_ratio || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{w.head || '—'}</td>
                          <td className="px-3 py-2 flex flex-wrap gap-1.5">
                            <PillButton onClick={()=> editWing(w)}>Edit</PillButton>
                            <PillButton variant="danger" onClick={()=> deleteWing(w.id)}>Delete</PillButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Wing inline form removed - using modal */}
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Classes</div>
                  <div className="text-xs text-gray-500">Manage grade sections & teaching assignments</div>
                </div>
                <PillButton onClick={()=> editClass()} variant="primary">+ Class</PillButton>
              </div>
              <div className="overflow-x-auto rounded-xl border max-h-72">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Wing</th>
                      <th className="px-3 py-2">Teacher</th>
                      <th className="px-3 py-2">Target Ratio</th>
                      <th className="px-3 py-2">Students</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2 font-medium text-gray-900">{r.classLabel}</td>
                        <td className="px-3 py-2 text-gray-600">{r.wing}</td>
                        <td className="px-3 py-2 text-gray-600">{r.teacher}</td>
                        <td className="px-3 py-2 text-gray-600">—</td>
                        <td className="px-3 py-2 text-gray-600">{r.students}</td>
                        <td className="px-3 py-2 flex flex-wrap gap-1.5">
                          <PillButton onClick={()=> editClass(r)}>Edit</PillButton>
                          <PillButton variant="danger" onClick={()=> deleteClass(r.id)}>Delete</PillButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Class inline form removed - using modal */}
            </div>

            {/* Storage & Meet settings */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Storage & Meet</div>
                  <div className="text-xs text-gray-500">Configure per-class storage paths and Meet links. Changes require Save.</div>
                </div>
                <div className="flex items-center gap-2">
                  <PillButton onClick={saveAllStorageMeet} variant="primary" disabled={savingStorageMeet || Object.values(storageMeetEdits).filter(v=>v.dirty).length===0}>{savingStorageMeet? 'Saving…':'Save All'}</PillButton>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border max-h-80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Storage Path</th>
                      <th className="px-3 py-2">Meet Code / Link</th>
                      <th className="px-3 py-2">Apply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const edit = storageMeetEdits[r.id] || { storage: r.storage, meet: r.meet, dirty:false };
                      return (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2 font-medium text-gray-900 flex items-center gap-2">{r.classLabel}{edit.dirty && <span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 border border-amber-200">Unsaved</span>}</td>
                          <td className="px-3 py-2">
                            <input className="w-64 rounded-lg border border-gray-300 px-2 py-1 text-xs" value={edit.storage} onChange={e=> setStorageMeetEdits(m=> ({...m, [r.id]: { ...edit, storage: e.target.value, dirty:true }}))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className="w-72 rounded-lg border border-gray-300 px-2 py-1 text-xs" value={edit.meet} onChange={e=> setStorageMeetEdits(m=> ({...m, [r.id]: { ...edit, meet: e.target.value, dirty:true }}))} />
                          </td>
                          <td className="px-3 py-2">
                            <PillButton disabled={!edit.dirty || savingStorageMeet} onClick={()=> persistStorageMeet([{ classId: r.id, storage: edit.storage, meet: edit.meet }])}>{edit.dirty? 'Save':'Saved'}</PillButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <div>Suggested pattern: <code>/classes/{'{G}-{S}'}</code> and Meet code derived from <code>grade+section+classId</code>.</div>
                <div>Future: Integrate with storage policy & account provisioning (MinIO / Google Workspace).</div>
              </div>
            </div>
            {/* Modals */}
            <Modal open={showWingModal} onClose={()=> setShowWingModal(false)} title={wingForm.id? 'Edit Wing':'Add Wing'} width="max-w-lg">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="mb-1 text-xs text-gray-500">Name</div>
                  <Input value={wingForm.name} onChange={v=> setWingForm(f=> ({...f, name:v}))} placeholder="Wing name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Grade Start (alphanumeric)</div>
                    <Input value={wingForm.grade_start} onChange={v=> setWingForm(f=> ({...f, grade_start:v}))} placeholder="e.g. Nursery" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Grade End (alphanumeric)</div>
                    <Input value={wingForm.grade_end} onChange={v=> setWingForm(f=> ({...f, grade_end:v}))} placeholder="e.g. 5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Target Ratio</div>
                    <Input value={wingForm.target_ratio} onChange={v=> setWingForm(f=> ({...f, target_ratio:v}))} placeholder="30" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Head (Headmistress)</div>
                    <select
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none"
                      value={wingForm.head_id}
                      onChange={e=> {
                        const val = e.target.value; const rec = heads.find(h=> String(h.id)===val);
                        setWingForm(f=> ({...f, head_id: val, head_name: rec? rec.name : '' }));
                      }}
                    >
                      <option value="">No head assigned</option>
                      {heads.map(h=> <option key={h.id} value={h.id}>{h.name}{h.active? '':' (Inactive)'}</option>)}
                    </select>
                    {wingForm.head_id && (
                      <div className="mt-1 text-[10px] text-gray-500">Selected: {wingForm.head_name}</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <PillButton onClick={()=> setShowWingModal(false)}>Cancel</PillButton>
                  <PillButton variant="primary" disabled={savingWing} onClick={saveWing}>{savingWing? 'Saving…':'Save Wing'}</PillButton>
                </div>
              </div>
            </Modal>
            <Modal open={showClassModal} onClose={()=> setShowClassModal(false)} title={classForm.id? 'Edit Class':'Add Class'} width="max-w-2xl">
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Wing</div>
                    <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" value={classForm.wing_id} onChange={e=> setClassForm(f=> ({...f, wing_id:e.target.value}))}>
                      <option value="">Select wing</option>
                      {wingsData.map(w=> <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Grade (alphanumeric)</div>
                    <Input value={classForm.grade} onChange={v=> setClassForm(f=> ({...f, grade:v}))} placeholder="e.g. 1 or Nursery" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Section</div>
                    <Input value={classForm.section} onChange={v=> setClassForm(f=> ({...f, section:v}))} placeholder="A" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Primary Teacher</div>
                    <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" value={classForm.teacher_staff_id} onChange={e=> {
                      const val = e.target.value; const staffRec = staff.find(s=> String(s.id)===val);
                      setClassForm(f=> ({...f, teacher_staff_id:val, teacher_name: staffRec? staffRec.name : f.teacher_name }));
                    }}>
                      <option value="">Select</option>
                      {staff.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Assistant Teacher</div>
                    <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" value={classForm.assistant_teacher_id} onChange={e=> setClassForm(f=> ({...f, assistant_teacher_id:e.target.value}))}>
                      <option value="">Select</option>
                      {staff.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">Support Staff</div>
                  <div className="flex flex-wrap gap-2">
                    {staff.map(s=> {
                      const active = classForm.support_staff_ids.includes(String(s.id));
                      return <button key={s.id} type="button" onClick={()=> setClassForm(f=> ({...f, support_staff_ids: active? f.support_staff_ids.filter(x=> x!==String(s.id)) : [...f.support_staff_ids, String(s.id)] }))} className={`px-3 py-1 rounded-full text-xs border ${active? 'bg-emerald-600 text-white border-emerald-600':'bg-white text-gray-600 border-gray-300'}`}>{s.name}</button>;
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">Target Ratio</div>
                  <Input value={classForm.target_ratio} onChange={v=> setClassForm(f=> ({...f, target_ratio:v}))} placeholder="30" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <PillButton onClick={()=> setShowClassModal(false)}>Cancel</PillButton>
                  <PillButton variant="primary" disabled={savingClass} onClick={saveClass}>{savingClass? 'Saving…':'Save Class'}</PillButton>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* Ops feed & Audit */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">Recent Broadcasts & Tasks</div>
            <div className="text-xs text-gray-500">Click an item to audit recipients, reads & nudges</div>
          </div>
          {opsLog.length === 0 ? (
            <div className="text-xs text-gray-500">No items yet.</div>
          ) : (
            <ul className="space-y-2">
              {opsLog.slice(0, 8).map((op) => {
                const recsInView = op.recipients.filter((rc) => filteredIds.has(rc.classId));
                const acked = recsInView.filter((rc) => rc.ack).length;
                const pct = recsInView.length ? Math.round((acked / recsInView.length) * 100) : 0;
                return (
                  <li key={op.id} className="flex items-center justify-between rounded-xl border p-2 text-sm">
                    <button className="flex items-center gap-2" onClick={() => { setAuditOp(op); setAuditOpen(true); }}>
                      <Badge color={op.kind === "Announcement" ? "blue" : "violet"}>{op.kind}</Badge>
                      <span className="font-medium text-gray-900">{op.title}</span>
                      <span className="text-gray-500">• {op.recipients.length} classes • {op.scope}</span>
                    </button>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(op.when).toLocaleString()} • via {op.channels.join(", ") || "—"}</span>
                      {op.kind === "Task" && <span>Ack: {pct}%</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="text-xs text-gray-500">Storage policy (suggested): Teachers read/write <code>/classes/{`{G}-{S}`}/teacher</code>, students read <code>/classes/{`{G}-{S}`}/teacher</code> and read/write <code>/classes/{`{G}-{S}`}/students/{`{roll}`}</code>.</div>
      </div>

      {/* Drawer: Class details */}
      <Drawer open={!!drawerRow} onClose={() => setDrawerRow(null)} title="Classroom Details">
        {drawerRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-gray-500">Class</div>
                <div className="text-lg font-semibold text-gray-900">{drawerRow.wing} • {drawerRow.classLabel} • Section {drawerRow.section}</div>
                <div className="mt-1 text-sm text-gray-600">Class Teacher: <span className="font-medium">{drawerRow.teacher}</span></div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-gray-500">Quick Links</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PillButton onClick={() => copy(drawerRow.storage)}>Copy Storage Path</PillButton>
                  <a className="px-3 py-2 text-sm rounded-full border bg-white text-gray-700" href={drawerRow.meet} target="_blank" rel="noreferrer">Open Meet</a>
                  <PillButton onClick={() => copy(drawerRow.meet)}>Copy Meet Link</PillButton>
                </div>
                <div className="mt-2 text-xs text-gray-500">Storage: <code>{drawerRow.storage}</code></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-gray-500">Students</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{drawerRow.students}{drawerRow.target_ratio ? <span className="text-base text-gray-500 font-normal"> / {drawerRow.target_ratio}</span>: null}</div>
                <div className="mt-1 text-xs text-gray-500">M/F: {drawerRow.male}/{drawerRow.female}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-gray-500">Attendance</div>
                <div className="mt-2"><Progress percent={drawerRow.attendance} /></div>
                <div className="mt-1 text-xs text-gray-500">{drawerRow.attendance}% today</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-gray-500">Fees Due</div>
                <div className="mt-2"><Progress percent={drawerRow.feeDuePct} /></div>
                <div className="mt-1 text-xs text-gray-500">{drawerRow.feeDuePct}% of total</div>
              </div>
            </div>

            {/* Acknowledgement & SLA */}
            <div className="rounded-2xl border p-4">
              <div className="mb-2 text-sm font-medium text-gray-900">Acknowledgement</div>
              {(() => {
                const op = latestTaskOp();
                if (!op) return <div className="text-xs text-gray-500">No active task requiring acknowledgement.</div>;
                const rec = op.recipients.find((rc) => rc.classId === drawerRow.id);
                if (!rec) return <div className="text-xs text-gray-500">No active task for this class.</div>;
                const today = new Date(dateToInput(new Date()));
                const overdue = rec.due && new Date(rec.due) < today && !rec.ack;
                return (
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge color={rec.ack ? 'green' : overdue ? 'red' : 'amber'}>{rec.ack ? 'Acknowledged' : overdue ? 'Overdue' : 'Waiting'}</Badge>
                      {rec.due && <span className="text-gray-600">Due: {rec.due}</span>}
                      {rec.nudgedAt && <span className="text-gray-400">Nudged: {new Date(rec.nudgedAt).toLocaleString()}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!rec.ack && <PillButton variant="primary" onClick={() => markAckForClass(drawerRow.id)}>Mark Acknowledged</PillButton>}
                      {!rec.ack && overdue && <PillButton onClick={() => { setAuditOp(op); setAuditOpen(true); }}>Open Audit</PillButton>}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="rounded-2xl border p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <PillButton onClick={()=> { setAssignOpen(true); }}>Assign Students</PillButton>
                <PillButton onClick={()=> pushTask(drawerRow, `Follow-up with parents for ${drawerRow.classLabel}`)}>Assign To‑Do</PillButton>
                <PillButton onClick={()=> addNote(drawerRow, "General classroom check")}>Quick Note</PillButton>
                <PillButton onClick={()=> markAckForClass(drawerRow.id)}>Mark Ack</PillButton>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">Notes</div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input data-testid="add-note-input" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="Add note" onKeyDown={e=> { if(e.key==='Enter'){ addNote(drawerRow, e.target.value); e.target.value=''; } }} />
                    <PillButton data-testid="add-note-btn" onClick={(e)=> { const inp=e.currentTarget.parentElement.querySelector('[data-testid=add-note-input]'); if(inp&&inp.value){ addNote(drawerRow, inp.value); inp.value=''; } }}>Add</PillButton>
                  </div>
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1" data-testid="notes-list">
                    {drawerRow.notes.length === 0 && (
                      <li className="text-xs text-gray-500">No notes yet.</li>
                    )}
                    {drawerRow.notes.map((n) => (
                      <li key={n.id} className="rounded-xl border p-2 text-sm text-gray-700 flex items-start gap-2" data-testid="note-item">
                        <textarea defaultValue={n.text} data-testid="note-text" className="flex-1 text-xs border rounded p-1" rows={2} onBlur={e=> { if(e.target.value!==n.text) updateNote(drawerRow, n.id, e.target.value); }} />
                        <button className="text-[10px] text-rose-600" onClick={()=> deleteNote(drawerRow, n.id)}>Delete</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">To‑Dos</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <input data-testid="add-task-input" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="Add task" id="taskTextInput" />
                    <input data-testid="add-task-due" type="date" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" id="taskDueInput" />
                    <PillButton data-testid="add-task-btn" onClick={(e)=> { const wrap=e.currentTarget.parentElement; const txt=wrap.querySelector('[data-testid=add-task-input]'); const due=wrap.querySelector('[data-testid=add-task-due]'); if(txt && txt.value){ pushTask(drawerRow, txt.value, due && due.value || ''); txt.value=''; if(due) due.value=''; } }}>Add</PillButton>
                  </div>
                  <script dangerouslySetInnerHTML={{__html: `document.getElementById('taskTextInput')?.addEventListener('keydown', function(e){ if(e.key==='Enter'){ const due=document.getElementById('taskDueInput'); pushTask(window.__currentDrawerRow||{}, this.value, due && due.value || ''); this.value=''; if(due) due.value=''; } });`}} />
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1" data-testid="tasks-list">
                    {drawerRow.tasks.length === 0 && <li className="text-xs text-gray-500">No tasks yet.</li>}
                    {drawerRow.tasks.map((t) => {
                      const overdue = t.status==='Open' && t.due && new Date(t.due) < new Date(dateToInput(new Date()));
                      return (
                        <li key={t.id} className="flex flex-col gap-1 rounded-xl border p-2 text-sm text-gray-700" data-testid="task-item">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <input type="checkbox" checked={t.status !== 'Open'} onChange={()=> { updateTask(drawerRow, t.id, { status: t.status==='Open' ? 'Done':'Open' }); }} />
                              <input className={`border rounded px-2 py-1 text-xs ${t.status!=='Open'?'line-through text-gray-400':''}`} defaultValue={t.text} onBlur={e=> { const val=e.target.value; if(val!==t.text) updateTask(drawerRow, t.id, { text: val }); }} />
                              <input type="date" className="border rounded px-2 py-1 text-xs" defaultValue={t.due} onChange={e=> { const val=e.target.value; updateTask(drawerRow, t.id, { due: val? new Date(val).toISOString(): null }); }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge data-testid="task-status" color={t.status === 'Open' ? (overdue ? 'red':'amber') : 'green'}>{t.status==='Open' ? (overdue ? 'Overdue':'Open'):'Done'}</Badge>
                              <button className="text-xs text-rose-600" onClick={()=> deleteTask(drawerRow, t.id)}>Delete</button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div className="mb-2 text-sm font-medium text-gray-900">Curriculum & Windows</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm">
                  <div className="text-gray-500">Planner Window</div>
                  <div className="mt-1">{windowLock.planner ? <Badge color="red">Locked</Badge> : <Badge color="green">Open</Badge>}</div>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <div className="text-gray-500">Report Cards</div>
                  <div className="mt-1">{windowLock.reportCards ? <Badge color="red">Locked</Badge> : <Badge color="green">Open</Badge>}</div>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <div className="text-gray-500">Exams</div>
                  <div className="mt-1">{windowLock.exams ? <Badge color="red">Locked</Badge> : <Badge color="green">Open</Badge>}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Settings drawer removed: settings now inline via tabs */}

      {/* Bulk Composer removed */}

      {/* Drawer: Audit */}
      <Drawer open={auditOpen} onClose={() => setAuditOpen(false)} title="Audit & Read Receipts">
        {!auditOp ? (
          <div className="text-xs text-gray-500">No item selected.</div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border p-4">
              <div className="text-sm text-gray-500">Item</div>
              <div className="text-lg font-semibold text-gray-900">{auditOp.kind}: {auditOp.title}</div>
              <div className="text-xs text-gray-500">{new Date(auditOp.when).toLocaleString()} • via {auditOp.channels.join(", ") || "—"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Recipients: {auditOp.recipients.length}</div>
              {auditOp.kind === 'Task' && (
                <PillButton onClick={nudgeOverdueInView}>Nudge Overdue (view)</PillButton>
              )}
            </div>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Teacher</th>
                    <th className="px-3 py-2">Delivered</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditOp.recipients.map((rc) => {
                    const today = new Date(dateToInput(new Date()));
                    const overdue = rc.due && new Date(rc.due) < today && !rc.ack;
                    return (
                      <tr key={rc.classId} className="border-t">
                        <td className="px-3 py-2">{rc.classLabel}</td>
                        <td className="px-3 py-2">{rc.teacher}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{new Date(rc.deliveredAt).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{rc.due || '—'}</td>
                        <td className="px-3 py-2">{rc.ack ? <Badge color="green">Acked</Badge> : overdue ? <Badge color="red">Overdue</Badge> : <Badge color="amber">Waiting</Badge>}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {!rc.ack && <PillButton onClick={() => markAckForClass(rc.classId)}>Mark Ack</PillButton>}
                            {!rc.ack && overdue && <PillButton onClick={() => { setOpsLog((log) => { const copy = [...log]; const o = copy.find((x) => x.id === auditOp.id); const r = o?.recipients.find((z) => z.classId === rc.classId); if (r) r.nudgedAt = new Date().toISOString(); const row = getRowById(rc.classId); if (row) addNote(row, 'Nudged from audit'); return copy; }); }}>Nudge</PillButton>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>

      {/* Drawer: Assign Students */}
      <Drawer open={assignOpen} onClose={() => { setAssignOpen(false); setAssignSelected(new Set()); }} title="Assign Students to Class">
        {!drawerRow && <div className="text-xs text-gray-500">No class selected.</div>}
        {drawerRow && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <div>Class: <span className="font-medium">{drawerRow.classLabel}</span> • Current: {drawerRow.students}{drawerRow.target_ratio?` / ${drawerRow.target_ratio}`:''}</div>
              <div>Select students to assign. Already assigned students are filtered out if backend provides mapping (not yet shown in UI).</div>
            </div>
            <div className="flex items-center gap-2">
              <input value={assignFilter} onChange={e=> setAssignFilter(e.target.value)} placeholder="Search students" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <PillButton onClick={()=> { setStudentsAll([]); }} disabled={assignLoading}>Reload</PillButton>
            </div>
            {assignError && <div className="text-xs text-rose-600">{assignError}</div>}
            {assignLoading && studentsAll.length===0 && <div className="text-xs text-gray-500">Loading…</div>}
            <div className="max-h-72 overflow-y-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2"><input type="checkbox" onChange={e=> {
                      if(e.target.checked){
                        const filteredIds = filteredStudents.map(s=> s.id);
                        setAssignSelected(new Set([...assignSelected, ...filteredIds]));
                      } else {
                        setAssignSelected(new Set());
                      }
                    }} /></th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2"><input type="checkbox" checked={assignSelected.has(s.id)} onChange={()=> toggleAssignStudent(s.id)} /></td>
                      <td className="px-3 py-2 text-gray-700">{s.name || s.full_name || s.first_name + ' ' + (s.last_name||'')}</td>
                      <td className="px-3 py-2 text-gray-500">{s.grade ?? '—'}</td>
                    </tr>
                  ))}
                  {filteredStudents.length===0 && !assignLoading && <tr><td colSpan={3} className="px-3 py-4 text-xs text-center text-gray-500">No students</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Selected: {assignSelected.size}</div>
              <div className="flex gap-2">                
                <PillButton onClick={()=> { setAssignSelected(new Set()); }}>Clear</PillButton>
                <PillButton variant="primary" disabled={assignLoading || assignSelected.size===0} onClick={submitAssign}>{assignLoading? 'Assigning…':'Assign Selected'}</PillButton>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// Inline component to leverage main component closure state
// NOTE: This component must be declared inside same file; uses window-level variables not ideal.
// Simpler: inline in JSX; but for clarity, implement here receiving globals via window not used. Keeping minimal placeholder since real logic inline above.
function AssignStudentsSection(){ return null; }
