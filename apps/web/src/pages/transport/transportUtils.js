// Shared utility functions extracted from TransportManagement demo
export const DAY_MS = 86400000;
export const parse = (d) => (d ? new Date(d) : null);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export const daysBetween = (a, b) => Math.ceil((parse(b) - parse(a)) / DAY_MS);
export const daysUntil = (d) => (d ? daysBetween(new Date(), d) : Infinity);
export const addDays = (d, n) => new Date(parse(d).getTime() + n * DAY_MS);

export const docColor = (dateStr) => {
  if (!dateStr) return 'bg-gray-100 text-gray-600';
  const du = daysUntil(dateStr);
  if (du < 0) return 'bg-rose-100 text-rose-700';
  if (du <= 30) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

export const computeNextService = (bus) => {
  if (!bus.last_service_date) return null;
  return addDays(bus.last_service_date, bus.service_interval_days || 180);
};

export const serviceStatusBadgeMeta = (bus) => {
  const next = computeNextService(bus);
  if (!next) return { text: 'No Service Data', color: 'bg-gray-100 text-gray-600' };
  const du = daysUntil(next);
  if (du < 0) return { text: 'Service Overdue', color: 'bg-rose-100 text-rose-700' };
  if (du <= 15) return { text: `Service in ${du}d`, color: 'bg-amber-100 text-amber-700' };
  return { text: `Service in ${du}d`, color: 'bg-emerald-100 text-emerald-700' };
};

export const gpsBadgeMeta = (pingedAt) => {
  if (!pingedAt) return { text: 'Offline', color: 'bg-gray-200 text-gray-700' };
  const minsAgo = Math.floor((Date.now() - new Date(pingedAt).getTime()) / 60000);
  if (minsAgo <= 5) return { text: 'Live', color: 'bg-emerald-100 text-emerald-700' };
  if (minsAgo <= 60) return { text: `${minsAgo}m ago`, color: 'bg-amber-100 text-amber-700' };
  return { text: 'Offline', color: 'bg-gray-200 text-gray-700' };
};

export const statusColor = (s) => ({
  'On Trip': 'bg-blue-100 text-blue-700',
  Idle: 'bg-slate-100 text-slate-700',
  Maintenance: 'bg-purple-100 text-purple-700',
  Reserved: 'bg-teal-100 text-teal-700',
}[s] || 'bg-slate-100 text-slate-700');
