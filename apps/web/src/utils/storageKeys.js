// Centralized localStorage key constants
export const LS_KEYS = {
  STAFF_NOTIFY_LAST: 'staff.notify.last',
};

export function loadJSON(key, fallback){
  try { const raw = localStorage.getItem(key); if(!raw) return fallback; return JSON.parse(raw); } catch { return fallback; }
}
export function saveJSON(key, value){
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}