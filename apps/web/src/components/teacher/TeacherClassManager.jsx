import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import clsx from 'clsx';

// NOTE: This is a lightweight placeholder derived from the provided sample.
// It currently uses static sample data. Next step: wire real data from API endpoints.

const SAMPLE_CLASSES = [
  { id: '8A', label: 'Grade 8 • Section A' },
  { id: '8B', label: 'Grade 8 • Section B' },
  { id: '9A', label: 'Grade 9 • Section A' }
];

// local fallback roster sample; real data fetched per class
const SAMPLE_ROSTER = {
  '8A': [ { student_id: 1, full_name: 'Aarav Sharma', roll_no: 1 }, { student_id: 2, full_name: 'Ananya Gupta', roll_no: 2 } ],
  '8B': [ { student_id: 3, full_name: 'Rohan Das', roll_no: 1 } ],
  '9A': [ { student_id: 4, full_name: 'Vihaan Mehta', roll_no: 1 } ]
};

import { apiFetch } from '../../api/client';

export default function TeacherClassManager(){
  const { data: classesData, isLoading: clsLoading, error: clsError } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => apiFetch('/teacher/classes')
  });
  const classes = (classesData?.classes || []).map(c => ({
    id: String(c.id ?? ''),
    label: c.grade_label && c.section_label ? `Grade ${c.grade_label} • Section ${c.section_label}` : (c.label || `Class ${c.id}`)
  }));
  const fallback = classes.length === 0;
  const effectiveClasses = fallback ? SAMPLE_CLASSES : classes;
  const [currentClass, setCurrentClass] = useState(effectiveClasses[0].id);
  useEffect(() => {
    if (!effectiveClasses.find(c => c.id === currentClass)) {
      if (effectiveClasses[0]) setCurrentClass(effectiveClasses[0].id);
    }
  }, [effectiveClasses, currentClass]);

  const { data: rosterData, isLoading: rosterLoading, error: rosterError } = useQuery({
    enabled: !fallback && !!currentClass,
    queryKey: ['teacher-class-roster', currentClass],
    queryFn: () => apiFetch(`/teacher/class/${currentClass}/roster`)
  });

  const rosterStudents = fallback ? (SAMPLE_ROSTER[currentClass] || []) : (rosterData?.students || []);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => rosterStudents.filter(s => (s.full_name || '').toLowerCase().includes(query.toLowerCase()) || String(s.roll_no || '').toLowerCase().includes(query.toLowerCase())), [rosterStudents, query]);

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Class Manager (Prototype)</CardTitle>
        <CardDescription>{fallback ? 'Sample data (no classes assigned yet)' : 'Live class & roster data'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {clsLoading && <div className="text-xs text-muted">Loading classes…</div>}
        {clsError && <div className="text-xs text-rose-600">Error loading classes</div>}
        <div className="flex flex-wrap gap-2">
          {effectiveClasses.map(c => (
            <button
              key={c.id}
              onClick={() => setCurrentClass(c.id)}
              className={clsx('px-3 py-1 rounded-md text-xs font-medium border transition', c.id === currentClass ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700')}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div>
          <Input placeholder="Filter students..." value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
        {rosterLoading && !fallback && <div className="text-xs text-muted">Loading roster…</div>}
        {rosterError && <div className="text-xs text-rose-600">Failed to load roster</div>}
        <div className="max-h-56 overflow-auto border rounded-md divide-y divide-slate-100 dark:divide-slate-700 text-sm">
          {filtered.map(s => (
            <div key={s.student_id} className="px-3 py-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{s.full_name}</span>
                <span className="text-[11px] text-muted">{s.roll_no != null ? `Roll ${s.roll_no}` : ''}</span>
              </div>
              <Badge variant="outline">P</Badge>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted text-center">No students match filter.</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="secondary" size="sm">Open Full View</Button>
        <Button size="sm">Mark Attendance</Button>
      </CardFooter>
    </Card>
  );
}
