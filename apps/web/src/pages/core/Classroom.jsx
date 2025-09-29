import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Users as UsersIcon,
  Search as SearchIcon,
  FileDown,
  AlertTriangle,
} from 'lucide-react';

// NOTE: Live integration: class list now fetched from backend /classes endpoint.
// Roster + bulk actions will be wired next step.
import { api } from '../../api';

function formatINR(n){
  if(isNaN(n)) return '—';
  try { return n.toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}); } catch { return `₹${n}`; }
}

export default function ClassroomManagement(){
  // Filters & scope
  const [year,setYear] = useState('2025-26');
  const [gradeFilter,setGradeFilter] = useState('All');
  const [sectionFilter,setSectionFilter] = useState('All');
  const [timeWindow,setTimeWindow] = useState('Today');
  const [query,setQuery] = useState('');
  const [selectedClassId,setSelectedClassId] = useState(null);

  const [classRows,setClassRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [selectedIds,setSelectedIds] = useState([]);
  const [bulkAction,setBulkAction] = useState('set_result');
  const [resultChoice,setResultChoice] = useState('Published');
  const [lockChoice,setLockChoice] = useState('Lock');
  const [detail,setDetail] = useState(null); // class detail with roster
  const [detailLoading,setDetailLoading] = useState(false);
  const [detailError,setDetailError] = useState(null);
  const [bulkLoading,setBulkLoading] = useState(false);

  const filteredClasses = useMemo(()=> classRows.filter(c => (
    (gradeFilter==='All' || c.grade === parseInt(gradeFilter)) &&
    (sectionFilter==='All' || c.section === sectionFilter)
  )),[classRows,gradeFilter,sectionFilter]);

  const allSelected = filteredClasses.length>0 && filteredClasses.every(c=>selectedIds.includes(c.id));
  const selected = filteredClasses.find(c=>c.id===selectedClassId) || null;

  const toggleSelectAll = (v) => {
    const ids = filteredClasses.map(c=>c.id);
    setSelectedIds(prev => v ? Array.from(new Set([...prev,...ids])) : prev.filter(id=>!ids.includes(id)) );
  };
  const toggleRow = (id,v) => setSelectedIds(prev => v ? Array.from(new Set([...prev,id])) : prev.filter(x=>x!==id));

  const applyAction = async (scope) => {
    if(bulkLoading) return;
    const ids = scope==='selected' ? selectedIds : scope==='filtered' ? filteredClasses.map(c=>c.id) : classRows.map(c=>c.id);
    if(ids.length===0){ alert('No classes in scope.'); return; }
    setBulkLoading(true);
    try {
      const payload = { action: bulkAction, class_ids: ids.map(id=> id.includes('-')? id : id.replace(/^(\d+)([A-Z])$/,'$1-$2')), params: {} };
      if(bulkAction==='set_result') payload.params.result_status = resultChoice;
      if(bulkAction==='lock_reports') payload.params.lock = (lockChoice==='Lock');
      const res = await api.bulkClassAction(payload);
      if(bulkAction==='set_result' && res.status==='ok'){
        // optimistic merge result status
        setClassRows(prev=> prev.map(c=> ids.includes(c.id) ? { ...c, resultStatus: resultChoice } : c));
        if(detail && ids.includes(detail.id)){
          setDetail(d=> d ? {...d, resultStatus: resultChoice } : d);
        }
      }
      // For queued actions we just show a toast/alert
      alert(`Bulk action ${bulkAction} ${res.status} (affected ${res.affected})`);
    } catch(err){
      alert(`Bulk action failed: ${err.message||err}`);
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(()=>{
    let cancelled=false;
    setLoading(true); setError(null);
    api.listClasses()
      .then(data=>{
        if(cancelled) return;
        // Map snake_case to camelCase UI fields
        const mapped = data.map(r=>({
          id: r.id.includes('-')? r.id : `${r.grade}-${r.section}`,
            // backend id is grade+section (may not include dash). Unify with dash for uniqueness match with original pattern
          grade: r.grade,
          section: r.section,
          classTeacher: r.class_teacher || '—',
          total: r.total,
          male: r.male,
          female: r.female,
          attendancePct: r.attendance_pct,
          feeDueCount: r.fee_due_count,
          feeDueAmount: r.fee_due_amount,
          resultStatus: r.result_status,
        }));
        setClassRows(mapped);
      })
      .catch(err=>{ if(!cancelled) setError(err.message || String(err)); })
      .finally(()=>{ if(!cancelled) setLoading(false); });
    return ()=>{ cancelled=true; };
  },[]);

  // Fetch class detail when selectedClassId changes
  useEffect(()=>{
    if(!selectedClassId){ setDetail(null); setDetailError(null); return; }
    setDetailLoading(true); setDetailError(null);
    // selectedClassId may have form '8-A' already; backend expects same; we normalize removing duplicate dash scenario
    const cid = selectedClassId;
    api.getClass(cid.replace(/^(\d+)([A-Z])$/,'$1-$2'))
      .then(data=>{
        setDetail({
          id: data.id.includes('-')? data.id : `${data.grade}-${data.section}`,
          grade: data.grade,
          section: data.section,
          classTeacher: data.class_teacher || '—',
          total: data.total,
            male: data.male, female: data.female,
          attendancePct: data.attendance_pct,
          feeDueCount: data.fee_due_count,
          feeDueAmount: data.fee_due_amount,
          resultStatus: data.result_status,
          roster: (data.roster||[]).map(r=>({
            studentId: r.student_id,
            name: r.name,
            roll: r.roll,
            guardianPhone: r.guardian_phone,
            tags: r.tags||[],
            feeDueAmount: r.fee_due_amount,
            attendanceMark: r.attendance_mark
          })),
          generatedAt: data.generated_at,
        });
      })
      .catch(err=> setDetailError(err.message||String(err)))
      .finally(()=> setDetailLoading(false));
  },[selectedClassId]);

  const exportSummaryCSV = () => {
    const header = 'Class,ClassTeacher,Total,Male,Female,AttendancePct,FeeDueCount,FeeDueAmount,ResultStatus,Year,TimeWindow';
    const lines = filteredClasses.map(c => [
      `${c.grade}${c.section}`,c.classTeacher,c.total,c.male,c.female,c.attendancePct,c.feeDueCount,c.feeDueAmount,c.resultStatus,year,timeWindow
    ].map(v=>{ const s=String(v).replace(/"/g,'""'); return /[",\n]/.test(s)?`"${s}"`:s; }).join(','));
    const blob = new Blob([ [header,...lines].join('\n') ], { type:'text/csv;charset=utf-8;' });
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`class_summary_${year}_${timeWindow}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          <h1 className="text-xl font-semibold tracking-tight">Classroom Management</h1>
          <span className="text-xs text-muted-foreground">{filteredClasses.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onChange={e=>setYear(e.target.value)} className="w-[120px]">
            <option value="2025-26">2025–26</option>
            <option value="2024-25">2024–25</option>
          </Select>
          <Select value={timeWindow} onChange={e=>setTimeWindow(e.target.value)} className="w-[140px]">
            {['Today','This week','This month','This term'].map(p=> <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)} className="w-[110px]">
            <option value="All">All Grades</option>
            {Array.from({length:12}).map((_,i)=>(<option key={i+1} value={i+1}>{i+1}</option>))}
          </Select>
          <Select value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)} className="w-[110px]">
            <option value="All">All</option>
            {'ABCDEFGH'.split('').map(s=> <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="relative w-[240px] md:w-[300px]">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 opacity-60" />
            <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search class or teacher…" className="pl-8" />
          </div>
          <Button variant="outline" size="sm" onClick={exportSummaryCSV}><FileDown className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        {loading && (
          <div className="p-6 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        {error && !loading && (
          <div className="p-4 text-sm text-red-600">Failed to load classes: {error}</div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="p-2"><input type="checkbox" checked={allSelected} onChange={e=>toggleSelectAll(e.target.checked)} /></th>
              <th className="p-2">Class</th>
              <th className="p-2">Teacher</th>
              <th className="p-2">Students</th>
              <th className="p-2">Attendance ({timeWindow})</th>
              <th className="p-2">Fee Status</th>
              <th className="p-2">Result</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredClasses.map(c => (
              <tr key={c.id} className={selectedClassId===c.id ? 'bg-muted/40 border-b' : 'border-b'}>
                <td className="p-2"><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={e=>toggleRow(c.id,e.target.checked)} /></td>
                <td className="p-2 font-medium">{c.grade}{c.section}</td>
                <td className="p-2">{c.classTeacher}</td>
                <td className="p-2"><div>Total {c.total}</div><div className="text-[11px] text-muted-foreground">M {c.male} • F {c.female}</div></td>
                <td className="p-2">{c.attendancePct}%</td>
                <td className="p-2">{c.feeDueCount===0 ? <Badge variant="outline">Clear</Badge> : <div>{c.feeDueCount} due <span className="text-[11px] text-muted-foreground">• {formatINR(c.feeDueAmount)}</span></div>}</td>
                <td className="p-2"><Badge variant={c.resultStatus==='Published'? 'outline':'secondary'}>{c.resultStatus}</Badge></td>
                <td className="p-2 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={()=>setSelectedClassId(c.id)}>View</Button></div></td>
              </tr>
            ))}
            {!loading && filteredClasses.length===0 && (
              <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">No classes match filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk actions panel */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-muted-foreground">Bulk action</div>
          <Select value={bulkAction} onChange={e=>setBulkAction(e.target.value)} className="w-[200px]">
            <option value="set_result">Set result status</option>
            <option value="notify">Notify class teacher</option>
            <option value="lock_reports">Report card lock</option>
            <option value="remind_fees">Remind fee dues</option>
            <option value="download_reports">Download report bundle</option>
          </Select>
          {bulkAction==='set_result' && (
            <Select value={resultChoice} onChange={e=>setResultChoice(e.target.value)} className="w-[140px]">
              <option value="Published">Published</option>
              <option value="Pending">Pending</option>
            </Select>
          )}
          {bulkAction==='lock_reports' && (
            <Select value={lockChoice} onChange={e=>setLockChoice(e.target.value)} className="w-[140px]">
              <option value="Lock">Lock</option>
              <option value="Unlock">Unlock</option>
            </Select>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={bulkLoading} onClick={()=>applyAction('selected')}>{bulkLoading? 'Working…':'Apply to selected'}</Button>
            <Button size="sm" disabled={bulkLoading} onClick={()=>applyAction('filtered')}>{bulkLoading? 'Working…':'Apply to filtered'}</Button>
            <Button size="sm" variant="secondary" disabled={bulkLoading} onClick={()=>applyAction('all')}>{bulkLoading? 'Working…':'Apply to all'}</Button>
          </div>
        </div>
      </div>

      {/* Drill-down panel */}
      {selected && (
        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Class {selected.grade}{selected.section} — {selected.classTeacher}</div>
                <div className="text-xs text-muted-foreground">{year} • {timeWindow}</div>
              </div>
              <Button size="sm" variant="outline" onClick={()=>setSelectedClassId(null)}>Close</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="shadow-sm"><CardContent className="p-3"><div className="text-xs text-muted-foreground">Students</div><div className="text-xl font-semibold">{detail? detail.total : selected.total}</div><div className="text-xs text-muted-foreground">M {detail? detail.male : selected.male} • F {detail? detail.female : selected.female}</div></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3"><div className="text-xs text-muted-foreground">Attendance</div><div className="text-xl font-semibold">{detail? detail.attendancePct : selected.attendancePct}%</div><div className="text-xs text-muted-foreground">{timeWindow}</div></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3"><div className="text-xs text-muted-foreground">Fee due</div><div className="text-xl font-semibold">{detail? detail.feeDueCount : selected.feeDueCount}</div><div className="text-xs text-muted-foreground">{formatINR(detail? detail.feeDueAmount : selected.feeDueAmount)}</div></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3"><div className="text-xs text-muted-foreground">Result</div><div className="text-xl font-semibold">{detail? detail.resultStatus : selected.resultStatus}</div><div className="text-xs text-muted-foreground">Overall</div></CardContent></Card>
            </div>
            {detailLoading && <div className="text-xs text-muted-foreground">Loading roster…</div>}
            {detailError && <div className="text-xs text-red-600">Failed to load detail: {detailError}</div>}
            {detail && detail.roster && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground">
                      <th className="p-2 text-left">Roll</th>
                      <th className="p-2 text-left">Student</th>
                      <th className="p-2 text-left">Tags</th>
                      <th className="p-2 text-left">Fee Due</th>
                      <th className="p-2 text-left">Attendance</th>
                      <th className="p-2 text-left">Guardian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.roster.map(r => (
                      <tr key={r.studentId} className="border-t">
                        <td className="p-2 w-[50px]">{r.roll || '—'}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 space-x-1">{r.tags.map(t=> <Badge key={t} variant="outline">{t}</Badge>)}</td>
                        <td className="p-2">{r.feeDueAmount? formatINR(r.feeDueAmount): '—'}</td>
                        <td className="p-2">{r.attendanceMark || '—'}</td>
                        <td className="p-2">{r.guardianPhone || '—'}</td>
                      </tr>
                    ))}
                    {detail.roster.length===0 && (
                      <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No students in this class.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
