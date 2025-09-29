// Simple API client using fetch with optional dev token
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const DEV_TOKEN = import.meta.env.VITE_DEV_ACCESS_TOKEN;

async function request(path, options = {}) {
  const headers = Object.assign({'Content-Type':'application/json'}, options.headers || {});
  if (DEV_TOKEN && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${DEV_TOKEN}`;
  }
  const res = await fetch(API_BASE + path, {...options, headers});
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
  listStaff: () => request('/staff'),
  getStaff: (id) => request(`/staff/id/${id}`),
  updateStaff: (id, payload) => request(`/staff/id/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  createStaffLeave: (payload) => request('/staff/leave', { method:'POST', body: JSON.stringify(payload) }),
  listStaffLeave: () => request('/staff/leave'),
  transitionStaffLeave: (leaveId, target) => request(`/staff/leave/${leaveId}/transition?target=${encodeURIComponent(target)}`, { method:'POST' }),
  health: () => request('/healthz', { headers: {} }),
};

export { API_BASE };
