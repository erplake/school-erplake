// Centralized API client with basic JSON handling and optional auth header injection.
// Future: integrate token refresh logic.

export async function apiFetch(path, { method='GET', body, headers, json=true } = {}) {
  const opts = { method, headers: { 'Accept':'application/json', ...(json && body ? { 'Content-Type':'application/json'}:{}), ...headers } };
  if(body){
    opts.body = json ? JSON.stringify(body) : body;
  }
  const res = await fetch(path.startsWith('/api') ? path : `/api${path.startsWith('/')?path:'/'+path}`, opts);
  const ct = res.headers.get('content-type') || '';
  if(!res.ok){
    // If HTML, read text directly to avoid JSON parse crash
    if(ct.includes('text/html')){
      const html = await res.text();
      throw new Error(`HTTP ${res.status}: HTML response (likely proxy or server error)`);
    }
    let msg = res.status + ' ' + res.statusText;
    try { const data = await res.json(); msg = data.detail || JSON.stringify(data); } catch(e){/* ignore */}
    throw new Error(msg);
  }
  if(ct.includes('application/json')) return res.json();
  if(ct.includes('text/html')){
    const html = await res.text();
    throw new Error('Unexpected HTML response');
  }
  return res.text();
}

export function buildFormData(obj){
  const fd = new FormData();
  Object.entries(obj).forEach(([k,v]) => { if(v!==undefined && v!==null) fd.append(k, v); });
  return fd;
}

// Staff-specific helpers (extend as needed)
export const staffApi = {
  async downloadImportTemplate(){
    const res = await fetch('/api/staff/import/template');
    if(!res.ok) throw new Error('Failed to fetch template');
    return res.text();
  },
  async importStaffCSV(file){
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/staff/import', { method:'POST', body: fd });
    const ct = res.headers.get('content-type')||'';
    if(!res.ok){
      let msg = 'Import failed';
      if(ct.includes('application/json')){ try{ const j = await res.json(); msg = j.detail || msg; }catch{} }
      throw new Error(msg);
    }
    return res.json();
  },
  async createDuty(payload){
    const res = await fetch('/api/staff/duties', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok){
      let msg = 'Duty create failed';
      try { const j = await res.json(); msg = j.detail || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },
  // Added methods used by StaffManagement.jsx
  getStaffDashboard: () => apiFetch('/api/staff/dashboard'),
  getStaffProfile: (id) => apiFetch(`/api/staff/${id}/profile`),
  listStaffLeave: () => apiFetch('/api/staff/leave'),
  transitionStaffLeave: (id, status) => apiFetch(`/api/staff/leave/${id}/status`, { method:'PUT', body: JSON.stringify({ status }) }),
  staffMeta: () => apiFetch('/api/staff/meta'),
  createStaff: (payload) => apiFetch('/api/staff/code', { method:'POST', body: JSON.stringify(payload) }),
  updateStaff: (id, payload) => apiFetch(`/api/staff/id/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  uploadStaffPhoto: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiFetch(`/api/staff/id/${id}/photo`, { method:'POST', body: fd, json:false });
  },
  createStaffRole: (payload) => apiFetch('/api/staff/roles', { method:'POST', body: JSON.stringify(payload) }),
  createStaffDepartment: (payload) => apiFetch('/api/staff/departments', { method:'POST', body: JSON.stringify(payload) }),
  deactivateStaffRole: (id, body={}) => apiFetch(`/api/staff/roles/${id}/deactivate`, { method:'POST', body: JSON.stringify(body) }),
  deactivateStaffDepartment: (id, body={}) => apiFetch(`/api/staff/departments/${id}/deactivate`, { method:'POST', body: JSON.stringify(body) }),
  updateStaffRole: (id, payload) => apiFetch(`/api/staff/roles/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  updateStaffDepartment: (id, payload) => apiFetch(`/api/staff/departments/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
};
