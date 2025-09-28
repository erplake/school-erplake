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
  health: () => request('/healthz', { headers: {} }),
};

export { API_BASE };
