// Simple API client using fetch with optional dev token
// Ensure API_BASE targets the /api prefix (backend mounts all routers under /api)
// If VITE_API_BASE already includes /api it won't be duplicated.
let _rawBase = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '');
// If user already appended /api, keep it, otherwise add.
if(!_rawBase.endsWith('/api')) _rawBase += '/api';
// Normalize accidental duplication like /api/api
_rawBase = _rawBase.replace(/\/api\/api$/, '/api');
const API_BASE = _rawBase;
const DEV_TOKEN = import.meta.env.VITE_DEV_ACCESS_TOKEN;

async function request(path, options = {}) {
  // Normalize provided path:
  // 1. Ensure it starts with a single '/'
  // 2. Remove any accidental duplicate '/api' segments (e.g., /api/api/staff)
  // 3. Prevent protocol-like occurrences (very unlikely) but keep it simple.
  let p = path || '';
  if(!p.startsWith('/')) p = '/' + p;
  // Collapse multiple consecutive slashes first (except after protocol but we don't have full URLs here)
  p = p.replace(/\/+/g,'/');
  // Replace repeated /api segments at the beginning: /api/api/... -> /api/...
  p = p.replace(/^\/api(?:\/api)+\//, '/api/');
  // Also handle trailing exact duplication like '/api/api' with no following slash
  p = p.replace(/^\/api\/api$/, '/api');
  const headers = Object.assign({'Content-Type':'application/json'}, options.headers || {});
  if (DEV_TOKEN && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${DEV_TOKEN}`;
  }
  const res = await fetch(API_BASE + p, {...options, headers});
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const data = await res.json(); msg = data.detail || JSON.stringify(data); } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  listStudents: () => request('/students'),
  updateStudent: (id, payload) => request(`/students/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  messageGuardian: (id, message) => request(`/students/${id}/message`, { method:'POST', body: JSON.stringify({ message }) }),
  getBonafide: (id) => request(`/students/${id}/bonafide`),
  // Admissions
  createAdmission: (payload) => request('/admissions', { method:'POST', body: JSON.stringify(payload) }),
  listAdmissions: () => request('/admissions'),
  getAdmission: (id) => request(`/admissions/${id}`),
  updateAdmission: (id, payload) => request(`/admissions/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  transitionAdmission: (id, target) => request(`/admissions/${id}/transition`, { method:'POST', body: JSON.stringify({ target }) }),
  // Leaves
  createLeave: (payload) => request('/leaves', { method:'POST', body: JSON.stringify(payload) }),
  listLeaves: () => request('/leaves'),
  getLeave: (id) => request(`/leaves/${id}`),
  approveLeave: (id, approved_by) => request(`/leaves/${id}/approve`, { method:'POST', body: JSON.stringify({ approved_by }) }),
  rejectLeave: (id, rejected_by) => request(`/leaves/${id}/reject`, { method:'POST', body: JSON.stringify({ rejected_by }) }),
  cancelLeave: (id) => request(`/leaves/${id}/cancel`, { method:'POST' }),
  // Classes
  listClasses: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/classes${qs?`?${qs}`:''}`);
  },
  getClass: (classId, params={}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/classes/${classId}${qs?`?${qs}`:''}`);
  },
  bulkClassAction: (payload) => request('/classes/bulk-action', { method:'POST', body: JSON.stringify(payload) }),
  // Staff
  createStaff: (payload) => request('/staff', { method:'POST', body: JSON.stringify(payload) }),
  listStaff: (suffix='') => request('/staff'+suffix),
  getStaff: (id) => request(`/staff/id/${id}`),
  updateStaff: (id, payload) => request(`/staff/id/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  createStaffLeave: (payload) => request('/staff/leave', { method:'POST', body: JSON.stringify(payload) }),
  listStaffLeave: () => request('/staff/leave'),
  transitionStaffLeave: (leaveId, target) => request(`/staff/leave/${leaveId}/transition?target=${encodeURIComponent(target)}`, { method:'POST' }),
  // Staff announcements
  listStaffAnnouncements: () => request('/staff/announcements'),
  createStaffAnnouncement: (message) => request('/staff/announcements', { method:'POST', body: JSON.stringify({ message }) }),
  // Staff duties & substitutions
  createStaffDuty: (payload) => request('/staff/duties', { method:'POST', body: JSON.stringify(payload) }),
  listStaffDuties: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return request('/staff/duties'+(qs?`?${qs}`:''));
  },
  createStaffSubstitution: (payload) => request('/staff/substitutions', { method:'POST', body: JSON.stringify(payload) }),
  listStaffSubstitutions: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return request('/staff/substitutions'+(qs?`?${qs}`:''));
  },
  health: () => request('/healthz', { headers: {} }),
};

export { API_BASE };
