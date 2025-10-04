import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import GalleryUploader from '../../components/gallery/GalleryUploader';

const fetchClass = (id) => apiFetch(`/teacher/class/${id}`);

export default function TeacherClass(){
  const { classId } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey:['teacher-class', classId], queryFn: () => fetchClass(classId) });

  if(isLoading) return <div className="p-6">Loading...</div>;
  if(error) return <div className="p-6 text-rose-600">Error: {error.message}</div>;

  const [images, setImages] = useState(data?.recent_gallery_images || []);
  React.useEffect(() => { setImages(data?.recent_gallery_images || []); }, [data?.recent_gallery_images]);
  const att = data?.attendance_today || { percent_marked: 0 };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Class {data?.name} {data?.section_label}</h1>
          <p className="text-sm text-muted">Student count: {data?.student_count}</p>
        </div>
        <Link to="/teacher" className="text-sm text-indigo-600 hover:underline">Back to Dashboard</Link>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wide text-body mb-4">Today's Attendance</h2>
        <div className="flex items-center gap-4">
          <div className="w-52 h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{width: `${att.percent_marked || 0}%`}} />
          </div>
          <div className="text-sm font-medium">{att.percent_marked || 0}% ({att.marked}/{att.enrolled})</div>
          <Link to={`/teacher/class/${classId}/tools`} className="text-xs text-indigo-600 hover:underline">Class Tools</Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-body">Recent Images</h2>
          <GalleryUploader classSectionId={classId} onUploaded={(img) => setImages(prev => [img, ...prev].slice(0,10))} />
        </div>
        {images.length === 0 && <p className="text-sm text-muted">No images uploaded yet.</p>}
        <div className="grid gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map(img => (
            <div key={img.id} className="group relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 flex flex-col gap-2">
              <div className="aspect-video w-full rounded bg-gradient-to-br from-indigo-200 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center text-[10px] text-indigo-700 dark:text-indigo-300">
                IMG
              </div>
              <div className="text-[11px] truncate text-muted">{img.original_filename}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(img.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
