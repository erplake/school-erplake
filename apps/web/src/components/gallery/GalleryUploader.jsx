import React, { useState } from 'react';
import { apiFetch } from '../../api/client';

async function registerBlob({ file }){
  // For local storage driver assume we can reference a placeholder path; real impl would upload then register.
  const storage_url = `/uploads/${Date.now()}_${file.name}`; // placeholder path
  const checksum = '';
  return apiFetch('/files/blobs', { method:'POST', body:{ storage_url, mime_type:file.type || 'application/octet-stream', bytes:file.size, checksum, is_public:true }});
}

async function uploadGalleryImage({ classSectionId, file }){
  const blob = await registerBlob({ file });
  return apiFetch('/gallery/upload', { method:'POST', body:{ class_section_id: classSectionId, blob_id: blob.id, original_filename: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, content_hash: null }});
}

export default function GalleryUploader({ classSectionId, onUploaded }){
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setBusy(true); setError(null);
    try {
      const img = await uploadGalleryImage({ classSectionId, file });
      onUploaded && onUploaded(img);
    } catch(err){
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 cursor-pointer">
        <input type="file" className="hidden" onChange={onChange} disabled={busy} />
        <span className="px-3 py-1.5 rounded-md border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs disabled:opacity-50">{busy ? 'Uploading...' : 'Upload Image'}</span>
      </label>
      {error && <div className="text-[11px] text-rose-600">{error}</div>}
    </div>
  );
}
