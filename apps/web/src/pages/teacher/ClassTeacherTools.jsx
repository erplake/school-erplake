import React, { useEffect, useMemo, useRef, useState } from 'react';
import { exportRowsAsCSV } from '../../utils/csv';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

// Reuse existing roster endpoint & class details
const fetchRoster = (id) => apiFetch(`/teacher/class/${id}/roster`);
const fetchClass = (id) => apiFetch(`/teacher/class/${id}`);
const fetchAttendance = (id, on) => apiFetch(`/teacher/class/${id}/attendance${on ? `?on=${on}` : ''}`);
const fetchTimetable = (id) => apiFetch(`/teacher/class/${id}/timetable`);
const postAttendance = (id, body) => apiFetch(`/teacher/class/${id}/attendance`, { method:'POST', body: JSON.stringify(body) });

// Mark categories: Present, Absent, Late, Excused
const cycle = { undefined: 'P', P: 'A', A: 'L', L: 'E', E: undefined };
const MARK_LABEL = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' };
const MARK_COLOR = { P: 'bg-emerald-600', A: 'bg-rose-600', L: 'bg-amber-500', E: 'bg-indigo-500' };

export default function ClassTeacherTools(){
  const { classId } = useParams();
  const queryClient = useQueryClient();
  const { data: classData } = useQuery({ queryKey:['teacher-class', classId], queryFn: () => fetchClass(classId) });
  const { data: rosterData, isLoading, error } = useQuery({ queryKey:['teacher-class-roster-full', classId], queryFn: () => fetchRoster(classId) });
  const todayISO = new Date().toISOString().slice(0,10);
  const { data: attendanceData } = useQuery({ queryKey:['teacher-class-att', classId, todayISO], queryFn: () => fetchAttendance(classId, todayISO) });
  const { data: timetableData } = useQuery({ queryKey:['teacher-class-tt', classId, todayISO], queryFn: () => fetchTimetable(classId) });

  const roster = rosterData?.students || [];
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return roster.filter(s => !q || `${s.full_name} ${s.roll_no}`.toLowerCase().includes(q));
  }, [roster, query]);

  // Attendance marks local state (no persistence yet)
  const [marks, setMarks] = useState({}); // { student_id: 'P'|'A'|'L'|'E' }
  const [unsynced, setUnsynced] = useState([]); // track which student ids changed

  // Preload marks from server when attendanceData arrives
  useEffect(() => {
    if (attendanceData?.marks) {
      const mapped = {};
      for (const m of attendanceData.marks) {
        // Map server statuses to letters
        const letter = m.status === 'present' ? 'P' : m.status === 'absent' ? 'A' : m.status === 'late' ? 'L' : m.status === 'excused' ? 'E' : undefined;
        if (letter) mapped[m.student_id] = letter;
      }
      setMarks(mapped);
      setUnsynced([]);
    }
  }, [attendanceData]);
  const toggleMark = (id) => {
    setMarks(prev => {
      const next = cycle[prev[id]];
      const copy = { ...prev };
      if (next) copy[id] = next; else delete copy[id];
      return copy;
    });
    setUnsynced(u => Array.from(new Set([...u, id])));
  };
  const markAll = (status) => {
    setMarks(prev => {
      const copy = { ...prev };
      filtered.forEach(s => { if (status) copy[s.student_id] = status; else delete copy[s.student_id]; });
      return copy;
    });
    setUnsynced(u => Array.from(new Set([...u, ...filtered.map(s=>s.student_id)])));
  };
  const clearMarks = () => markAll(undefined);

  const counts = useMemo(() => {
    const acc = { P:0, A:0, L:0, E:0 };
    Object.values(marks).forEach(m => { if (acc[m] !== undefined) acc[m] += 1; });
    return acc;
  }, [marks]);

  // Timer
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);
  const hh = String(Math.floor(seconds/3600)).padStart(2,'0');
  const mm = String(Math.floor((seconds%3600)/60)).padStart(2,'0');
  const ss = String(seconds%60).padStart(2,'0');

  // Random picker
  const randomPick = () => {
    if (!filtered.length) return alert('No students to pick');
    const idx = Math.floor(Math.random()*filtered.length);
    alert(`Random: ${filtered[idx].full_name}`);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['Roll','Name','Mark','AttendanceLabel'];
    const rows = filtered.map(s => {
      const m = marks[s.student_id];
      return [s.roll_no || '', s.full_name, m || '', MARK_LABEL[m] || ''];
    });
    exportRowsAsCSV(headers, rows, { filename:`class_${classId}_attendance.csv`, bom:true });
  };

  const submittingRef = useRef(false);
  const submitAttendance = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      // Convert marks to API statuses (only changed ones? For simplicity send all current marks)
      const payload = {
        date: todayISO,
        marks: Object.entries(marks).map(([sid, letter]) => ({
          student_id: Number(sid),
          status: letter === 'P' ? 'present' : letter === 'A' ? 'absent' : letter === 'L' ? 'late' : letter === 'E' ? 'excused' : 'present'
        }))
      };
      await postAttendance(classId, payload);
      setUnsynced([]);
      // Refetch
      queryClient.invalidateQueries(['teacher-class-att', classId, todayISO]);
    } catch (e) {
      alert('Failed to submit attendance');
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Class Tools – {classData?.name} {classData?.section_label}</h1>
          <p className="text-sm text-muted">Roster & quick attendance workspace</p>
          {timetableData?.periods && (
            <div className="flex flex-wrap gap-1 mt-2">
              {timetableData.periods.map(p => {
                const now = new Date();
                const [sh, sm] = p.start.split(':').map(Number);
                const [eh, em] = p.end.split(':').map(Number);
                const mins = now.getHours()*60 + now.getMinutes();
                const within = mins >= (sh*60+sm) && mins < (eh*60+em);
                return <span key={p.period} className={`px-2 py-1 rounded text-[10px] font-medium ${within ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>P{p.period} {p.start}-{p.end}</span>;
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline">P {counts.P}</Badge>
          <Badge variant="outline">A {counts.A}</Badge>
          <Badge variant="outline">L {counts.L}</Badge>
          <Badge variant="outline">E {counts.E}</Badge>
          <div className="px-2 py-1 rounded md text-[11px] bg-slate-100 dark:bg-slate-700 font-medium">{hh}:{mm}:{ss}</div>
          <Button variant="secondary" size="sm" onClick={()=>setRunning(r=>!r)}>{running ? 'Pause' : 'Start'}</Button>
          <Button variant="outline" size="sm" onClick={()=>{setSeconds(0);setRunning(false);}}>Reset</Button>
          <Button variant="outline" size="sm" onClick={randomPick}>Random</Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Search name or roll..." value={query} onChange={e=>setQuery(e.target.value)} className="w-64" />
        <Button variant="secondary" size="sm" onClick={() => markAll('P')}>All P</Button>
        <Button variant="secondary" size="sm" onClick={() => markAll('A')}>All A</Button>
        <Button variant="secondary" size="sm" onClick={clearMarks}>Clear</Button>
        <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
        <Link to={`/teacher/class/${classId}`} className="text-xs text-indigo-600 hover:underline ml-auto">Back to Class Overview</Link>
      </div>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Roster</CardTitle>
          <CardDescription>{isLoading ? 'Loading...' : `${filtered.length} students`}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && <div className="p-4 text-sm text-rose-600">Error loading roster</div>}
          <div className="max-h-[520px] overflow-auto divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(s => {
              const m = marks[s.student_id];
              return (
                <div key={s.student_id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-[11px] text-muted">{s.roll_no ?? ''}</div>
                    <div className="font-medium">{s.full_name}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleMark(s.student_id)}
                      className={`h-7 px-3 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-600 transition ${m ? MARK_COLOR[m] + ' text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      title={m ? MARK_LABEL[m] : 'Unset'}
                    >
                      {m || '—'}
                    </button>
                  </div>
                </div>
              );
            })}
            {!isLoading && filtered.length === 0 && <div className="p-4 text-xs text-muted text-center">No students</div>}
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {unsynced.length > 0 && <div className="text-[11px] text-amber-600 mr-auto">{unsynced.length} changed</div>}
          <Button size="sm" variant="primary" onClick={submitAttendance} disabled={unsynced.length===0}>Submit Attendance</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
