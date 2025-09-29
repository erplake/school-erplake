import React, { useState, useMemo } from 'react';

// Transport Management Page (Standalone Client-Side Demo)
// Converted from provided single-file component description.
// Tailwind utility classes only; no server calls.

export default function TransportManagement() {
  // --- Utilities
  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
  const parse = (d) => (typeof d === 'string' ? new Date(d) : d);
  const daysBetween = (a, b) => Math.ceil((+parse(b) - +parse(a)) / 86400000);
  const daysUntil = (d) => daysBetween(new Date(), d);
  const addDays = (d, n) => new Date(+parse(d) + n * 86400000);

  const badge = (text, color) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}>{text}</span>
  );

  const docColor = (dateStr) => {
    if (!dateStr) return 'bg-gray-100 text-gray-600';
    const du = daysUntil(parse(dateStr));
    if (du < 0) return 'bg-rose-100 text-rose-700'; // expired
    if (du <= 30) return 'bg-amber-100 text-amber-700'; // expiring soon
    return 'bg-emerald-100 text-emerald-700';
  };

  const computeNextService = (bus) => addDays(parse(bus.lastServiceDate), bus.serviceIntervalDays || 180);
  const serviceStatusBadge = (bus) => {
    const du = daysUntil(computeNextService(bus));
    if (du < 0) return badge('Service Overdue', 'bg-rose-100 text-rose-700');
    if (du <= 15) return badge(`Service in ${du}d`, 'bg-amber-100 text-amber-700');
    return badge(`Service in ${du}d`, 'bg-emerald-100 text-emerald-700');
  };

  const gpsBadge = (bus) => {
    const last = parse(bus.gpsLastPing);
    const minsAgo = Math.floor((Date.now() - +last) / 60000);
    if (minsAgo <= 5) return badge('Live', 'bg-emerald-100 text-emerald-700');
    if (minsAgo <= 60) return badge(`${minsAgo}m ago`, 'bg-amber-100 text-amber-700');
    return badge('Offline', 'bg-gray-200 text-gray-700');
  };

  const statusColor = (s) => ({
    'On Trip': 'bg-blue-100 text-blue-700',
    Idle: 'bg-slate-100 text-slate-700',
    Maintenance: 'bg-purple-100 text-purple-700',
    Reserved: 'bg-teal-100 text-teal-700',
  }[s] || 'bg-slate-100 text-slate-700');

  // Seed Data
  const [drivers] = useState([
    { id: 'D1', name: 'Ravi Kumar', phone: '+91-98100-12345', licenseNo: 'DL-12-345678', licenseExpiry: '2026-02-01' },
    { id: 'D2', name: 'S. Mehta', phone: '+91-98990-22211', licenseNo: 'DL-10-112233', licenseExpiry: '2025-10-30' },
    { id: 'D3', name: 'Anil Yadav', phone: '+91-88001-99887', licenseNo: 'HR-26-778899', licenseExpiry: '2025-10-05' },
    { id: 'D4', name: 'R. Sharma', phone: '+91-99110-44556', licenseNo: 'UP-14-556677', licenseExpiry: '2027-06-15' },
  ]);
  const [routes] = useState([
    { id: 'R1', name: 'North Loop', stops: 12 },
    { id: 'R2', name: 'South Circuit', stops: 15 },
    { id: 'R3', name: 'East Express', stops: 10 },
    { id: 'R4', name: 'West Ring', stops: 11 },
  ]);
  const [buses, setBuses] = useState([
    {
      id: 'B1', code: 'DL1PC1234', model: 'Tata Starbus 32', capacity: 40, driverId: 'D1', attendant: 'Sunita', routeId: 'R1', status: 'On Trip', lastServiceDate: '2025-05-10', serviceIntervalDays: 180, odometerKm: 84210, gpsLastPing: new Date(Date.now() - 3 * 60 * 1000).toISOString(), insuranceExpiry: '2026-01-12', permitExpiry: '2025-12-15', fitnessExpiry: '2026-09-20', pucExpiry: '2025-10-18', notes: 'Front brake pads replaced last service.', incidents: [], serviceHistory: [ { date: '2025-05-10', odometerKm: 80000, work: 'Full service + brake pads' }, { date: '2024-11-10', odometerKm: 62000, work: 'Engine oil + filters' } ],
    },
    {
      id: 'B2', code: 'DL1PB5678', model: 'Ashok Leyland 40', capacity: 50, driverId: 'D2', attendant: 'Mahesh', routeId: 'R2', status: 'Idle', lastServiceDate: '2025-03-20', serviceIntervalDays: 210, odometerKm: 120300, gpsLastPing: new Date(Date.now() - 35 * 60 * 1000).toISOString(), insuranceExpiry: '2025-11-02', permitExpiry: '2025-10-10', fitnessExpiry: '2026-04-01', pucExpiry: '2025-10-02', notes: 'AC compressor noisy.', incidents: [ { date: '2025-07-22', note: 'Minor dent near rear door.' } ], serviceHistory: [ { date: '2025-03-20', odometerKm: 110200, work: 'Full service' } ],
    },
    {
      id: 'B3', code: 'DL3CAB9090', model: 'Eicher Skyline 34', capacity: 42, driverId: 'D3', attendant: 'Priya', routeId: 'R3', status: 'Maintenance', lastServiceDate: '2025-04-02', serviceIntervalDays: 180, odometerKm: 65120, gpsLastPing: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), insuranceExpiry: '2025-10-04', permitExpiry: '2025-12-01', fitnessExpiry: '2026-01-01', pucExpiry: '2025-09-15', notes: 'Suspension work ongoing.', incidents: [], serviceHistory: [ { date: '2025-04-02', odometerKm: 62000, work: 'Full service' } ],
    },
    {
      id: 'B4', code: 'UP14BC2222', model: 'Mahindra Comfio 28', capacity: 32, driverId: 'D4', attendant: 'Geeta', routeId: 'R4', status: 'Reserved', lastServiceDate: '2025-06-01', serviceIntervalDays: 200, odometerKm: 30500, gpsLastPing: new Date(Date.now() - 7 * 60 * 1000).toISOString(), insuranceExpiry: '2026-07-01', permitExpiry: '2026-01-15', fitnessExpiry: '2027-06-12', pucExpiry: '2026-01-05', notes: 'New tires installed.', incidents: [], serviceHistory: [ { date: '2025-06-01', odometerKm: 28000, work: 'Full service' } ],
    },
    {
      id: 'B5', code: 'DL8SAA7001', model: 'Tata CNG 36', capacity: 44, driverId: 'D2', attendant: 'Raj', routeId: 'R1', status: 'On Trip', lastServiceDate: '2025-05-28', serviceIntervalDays: 180, odometerKm: 91000, gpsLastPing: new Date(Date.now() - 2 * 60 * 1000).toISOString(), insuranceExpiry: '2026-03-20', permitExpiry: '2025-10-02', fitnessExpiry: '2026-10-01', pucExpiry: '2025-11-01', notes: 'CNG filter due next service.', incidents: [], serviceHistory: [ { date: '2025-05-28', odometerKm: 87000, work: 'Full service' } ],
    },
    {
      id: 'B6', code: 'HR26DF9900', model: 'Ashok Leyland Viking', capacity: 52, driverId: 'D1', attendant: 'Asha', routeId: 'R2', status: 'Idle', lastServiceDate: '2024-12-20', serviceIntervalDays: 240, odometerKm: 154200, gpsLastPing: new Date(Date.now() - 120 * 60 * 1000).toISOString(), insuranceExpiry: '2025-12-15', permitExpiry: '2025-11-30', fitnessExpiry: '2026-12-31', pucExpiry: '2025-09-20', notes: 'Check wheel alignment.', incidents: [], serviceHistory: [ { date: '2024-12-20', odometerKm: 140000, work: 'Full service' } ],
    },
  ]);

  // Filters & UI State
  const [q, setQ] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [modal, setModal] = useState(null); // { type, busId }
  const [bulk, setBulk] = useState({ selected: new Set() });

  const routesById = useMemo(() => Object.fromEntries(routes.map(r => [r.id, r])), [routes]);
  const driversById = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);

  const filtered = useMemo(() => {
    return buses.filter(b => {
      if (q) {
        const needle = q.toLowerCase();
        const driver = driversById[b.driverId];
        const route = routesById[b.routeId];
        if (![b.code, b.model, driver?.name, route?.name].some(x => x && x.toLowerCase().includes(needle))) return false;
      }
      if (routeFilter !== 'all' && b.routeId !== routeFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (alertsOnly) {
        const soonService = daysUntil(computeNextService(b)) <= 15;
        const expiringDocs = [b.insuranceExpiry, b.permitExpiry, b.fitnessExpiry, b.pucExpiry].some(d => d && daysUntil(d) <= 30);
        if (!(soonService || expiringDocs)) return false;
      }
      return true;
    });
  }, [buses, q, routeFilter, statusFilter, alertsOnly, driversById, routesById]);

  // KPIs
  const kpis = useMemo(() => {
    const total = buses.length;
    const onTrip = buses.filter(b => b.status === 'On Trip').length;
    const maint = buses.filter(b => b.status === 'Maintenance').length;
    const serviceDue = buses.filter(b => daysUntil(computeNextService(b)) <= 15).length;
    const expiringDocs = buses.filter(b => [b.insuranceExpiry, b.permitExpiry, b.fitnessExpiry, b.pucExpiry].some(d => d && daysUntil(d) <= 30)).length;
    return { total, onTrip, maint, serviceDue, expiringDocs };
  }, [buses]);

  // Bulk helpers
  const toggleSelect = (id) => {
    setBulk(prev => {
      const next = new Set(prev.selected);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { selected: next };
    });
  };
  const allSelected = filtered.length > 0 && filtered.every(b => bulk.selected.has(b.id));
  const toggleSelectAll = () => {
    setBulk(prev => {
      if (allSelected) return { selected: new Set() };
      return { selected: new Set(filtered.map(f => f.id)) };
    });
  };

  // Actions
  const assignDriver = (busId, driverId) => setBuses(list => list.map(b => b.id === busId ? { ...b, driverId } : b));
  const assignRoute = (ids, routeId) => setBuses(list => list.map(b => ids.includes(b.id) ? { ...b, routeId } : b));
  const markMaintenance = (ids) => setBuses(list => list.map(b => ids.includes(b.id) ? { ...b, status: 'Maintenance' } : b));
  const logService = (busId, payload) => setBuses(list => list.map(b => b.id === busId ? {
    ...b,
    lastServiceDate: payload.date,
    odometerKm: payload.odometerKm,
    serviceHistory: [{ date: payload.date, odometerKm: payload.odometerKm, work: payload.work }, ...(b.serviceHistory || [])]
  } : b));
  const addIncident = (busId, entry) => setBuses(list => list.map(b => b.id === busId ? { ...b, incidents: [entry, ...(b.incidents || [])] } : b));
  const upsertBus = (bus) => setBuses(list => {
    const exists = list.find(b => b.id === bus.id);
    if (exists) return list.map(b => b.id === bus.id ? { ...exists, ...bus } : b);
    return [...list, { ...bus, id: `B${list.length + 1}` }];
  });

  const exportCSV = () => {
    const cols = ['Bus Code','Model','Capacity','Status','Route','Driver','Driver Phone','Last Service','Next Service','Odometer Km','Insurance Exp','Permit Exp','Fitness Exp','PUC Exp','GPS Last Ping'];
    const rows = filtered.map(b => {
      const driver = driversById[b.driverId];
      const route = routesById[b.routeId];
      return [b.code,b.model,b.capacity,b.status,route?.name||'',driver?.name||'',driver?.phone||'',fmt(b.lastServiceDate),fmt(computeNextService(b)),b.odometerKm,b.insuranceExpiry,b.permitExpiry,b.fitnessExpiry,b.pucExpiry,fmt(b.gpsLastPing)];
    });
    const csv = [cols.join(','), ...rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transport-fleet-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // Alerts
  const alerts = useMemo(() => {
    const list = [];
    buses.forEach(b => {
      const du = daysUntil(computeNextService(b));
      if (du <= 15) list.push({ type: 'Service', msg: `${b.code} due in ${du}d` });
      [['Insurance','insuranceExpiry'],['Permit','permitExpiry'],['Fitness','fitnessExpiry'],['PUC','pucExpiry']].forEach(([label, key]) => {
        const val = b[key];
        if (val) {
          const d = daysUntil(val);
            if (d < 0) list.push({ type: `${label} Expired`, msg: `${b.code} expired ${Math.abs(d)}d ago` });
            else if (d <= 30) list.push({ type: `${label} Soon`, msg: `${b.code} in ${d}d` });
        }
      });
      const driver = driversById[b.driverId];
      if (driver?.licenseExpiry) {
        const d = daysUntil(driver.licenseExpiry);
        if (d < 0) list.push({ type: 'License Expired', msg: `${driver.name} (${b.code}) ${Math.abs(d)}d ago` });
        else if (d <= 30) list.push({ type: 'License Soon', msg: `${driver.name} in ${d}d (${b.code})` });
      }
    });
    return list;
  }, [buses, driversById]);

  // Components (inline)
  const Card = ({ children, className = '' }) => <div className={`rounded-2xl border border-slate-200 bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4 ${className}`}>{children}</div>;
  const SectionTitle = ({ title, subtitle }) => (<div className="mb-3"><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}</div>);
  const Icon = ({ name, className = 'w-5 h-5' }) => {
    const paths = { bus: <path d="M3 6a3 3 0 013-3h12a3 3 0 013 3v9a2 2 0 01-2 2v1a1 1 0 11-2 0v-1H7v1a1 1 0 11-2 0v-1a2 2 0 01-2-2V6zm3-1h12a1 1 0 011 1v5H5V6a1 1 0 011-1zm0 8h12a1 1 0 001-1v-1H5v1a1 1 0 001 1z"/>, search: <path d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>, plus: <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>, download: <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeWidth="2" strokeLinecap="round"/>, print: <path d="M6 9V4h12v5M6 14H5a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2h-1m-2 0v5H8v-5h8z" strokeWidth="2" strokeLinecap="round"/>, wrench: <path d="M14.7 6.3A4 4 0 119.3 10.7l-6 6a1 1 0 101.4 1.4l6-6a4 4 0 003.999-5.8z"/>, alert: <path d="M12 9v4m0 4h.01M10.29 3.86l-8 14A1 1 0 003.09 20h17.82a1 1 0 00.86-1.5l-8-14a1 1 0 00-1.72 0z"/>, user: <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z"/>, route: <path d="M4 6a2 2 0 114 0 2 2 0 01-4 0zm12 12a2 2 0 114 0 2 2 0 01-4 0zM6 8v7a3 3 0 003 3h6" strokeWidth="2" strokeLinecap="round" fill="none"/>, calendar: <path d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round"/>, edit: <path d="M4 13.5V20h6.5l9-9a2.12 2.12 0 10-3-3l-9 9z"/>, assign: <path d="M16 11V7a4 4 0 10-8 0v4M5 21h14a2 2 0 002-2v-5a7 7 0 10-18 0v5a2 2 0 002 2z"/>, incident: <path d="M12 9v4m0 4h.01M10.29 3.86l-8 14A1 1 0 003.09 20h17.82a1 1 0 00.86-1.5l-8-14a1 1 0 00-1.72 0z"/> };
    return <svg className={className} viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" aria-hidden>{paths[name]}</svg>;
  };

  const Modal = ({ open, onClose, title, children, wide=false }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-6">
        <div className={`w-full ${wide? 'max-w-4xl':'max-w-2xl'} rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800"><h3 className="text-base sm:text-lg font-semibold">{title}</h3><button onClick={onClose} className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">✕</button></div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    );
  };

  const AssignDriverForm = ({ bus }) => {
    const [driverId, setDriverId] = useState(bus.driverId || drivers[0]?.id);
    return (
      <form onSubmit={e => { e.preventDefault(); assignDriver(bus.id, driverId); setModal(null); }} className="space-y-4">
        <div>
          <label className="text-sm text-slate-600">Driver</label>
          <select value={driverId} onChange={(e)=>setDriverId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900">
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.phone}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={()=>setModal(null)} className="px-3 py-2 rounded-lg border">Cancel</button>
          <button className="px-3 py-2 rounded-lg bg-blue-600 text-white">Assign</button>
        </div>
      </form>
    );
  };

  const ServiceForm = ({ bus }) => {
    const [date, setDate] = useState(new Date().toISOString().slice(0,10));
    const [odo, setOdo] = useState(bus.odometerKm || 0);
    const [work, setWork] = useState('');
    return (
      <form onSubmit={e => { e.preventDefault(); logService(bus.id, { date, odometerKm: Number(odo), work }); setModal(null); }} className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="text-sm text-slate-600">Service Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900"/></div>
          <div><label className="text-sm text-slate-600">Odometer (km)</label><input type="number" value={odo} onChange={e=>setOdo(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900"/></div>
          <div><label className="text-sm text-slate-600">Work Done</label><input value={work} onChange={e=>setWork(e.target.value)} placeholder="Oil, filters, brake pads…" className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900"/></div>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>setModal(null)} className="px-3 py-2 rounded-lg border">Cancel</button><button className="px-3 py-2 rounded-lg bg-emerald-600 text-white">Save Service</button></div>
      </form>
    );
  };

  const IncidentForm = ({ bus }) => {
    const [date, setDate] = useState(new Date().toISOString().slice(0,10));
    const [note, setNote] = useState('');
    return (
      <form onSubmit={e => { e.preventDefault(); if (!note.trim()) return; addIncident(bus.id, { date, note }); setModal(null); }} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm text-slate-600">Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900"/></div>
          <div><label className="text-sm text-slate-600">Note</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Brief description" className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900"/></div>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>setModal(null)} className="px-3 py-2 rounded-lg border">Cancel</button><button className="px-3 py-2 rounded-lg bg-amber-600 text-white">Log Incident</button></div>
      </form>
    );
  };

  const BusForm = ({ bus }) => {
    const editing = !!bus;
    const [code, setCode] = useState(bus?.code || '');
    const [model, setModel] = useState(bus?.model || '');
    const [capacity, setCapacity] = useState(bus?.capacity || 40);
    const [driverId, setDriverId] = useState(bus?.driverId || drivers[0]?.id);
    const [routeId, setRouteId] = useState(bus?.routeId || routes[0]?.id);
    const [status, setStatus] = useState(bus?.status || 'Idle');
    const [lastServiceDate, setLastServiceDate] = useState(bus?.lastServiceDate || new Date().toISOString().slice(0,10));
    const [serviceIntervalDays, setServiceIntervalDays] = useState(bus?.serviceIntervalDays || 180);
    const [odometerKm, setOdometerKm] = useState(bus?.odometerKm || 0);
    const [insuranceExpiry, setInsuranceExpiry] = useState(bus?.insuranceExpiry || '');
    const [permitExpiry, setPermitExpiry] = useState(bus?.permitExpiry || '');
    const [fitnessExpiry, setFitnessExpiry] = useState(bus?.fitnessExpiry || '');
    const [pucExpiry, setPucExpiry] = useState(bus?.pucExpiry || '');
    const submit = (e) => {
      e.preventDefault();
      upsertBus({ id: bus?.id, code, model, capacity: Number(capacity), driverId, routeId, status, lastServiceDate, serviceIntervalDays: Number(serviceIntervalDays), odometerKm: Number(odometerKm), insuranceExpiry, permitExpiry, fitnessExpiry, pucExpiry, incidents: bus?.incidents || [], serviceHistory: bus?.serviceHistory || [], attendant: bus?.attendant || '' });
      setModal(null);
    };
    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Code"><input value={code} onChange={e=>setCode(e.target.value)} required className="input"/></Field>
          <Field label="Model"><input value={model} onChange={e=>setModel(e.target.value)} required className="input"/></Field>
          <Field label="Capacity"><input type="number" value={capacity} onChange={e=>setCapacity(e.target.value)} required className="input"/></Field>
          <Field label="Driver"><select value={driverId} onChange={e=>setDriverId(e.target.value)} className="input">{drivers.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Route"><select value={routeId} onChange={e=>setRouteId(e.target.value)} className="input">{routes.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
          <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)} className="input">{['On Trip','Idle','Maintenance','Reserved'].map(s=> <option key={s}>{s}</option>)}</select></Field>
          <Field label="Last Service"><input type="date" value={lastServiceDate} onChange={e=>setLastServiceDate(e.target.value)} className="input"/></Field>
          <Field label="Service Interval (days)"><input type="number" value={serviceIntervalDays} onChange={e=>setServiceIntervalDays(e.target.value)} className="input"/></Field>
          <Field label="Odometer (km)"><input type="number" value={odometerKm} onChange={e=>setOdometerKm(e.target.value)} className="input"/></Field>
          <Field label="Insurance Expiry"><input type="date" value={insuranceExpiry} onChange={e=>setInsuranceExpiry(e.target.value)} className="input"/></Field>
          <Field label="Permit Expiry"><input type="date" value={permitExpiry} onChange={e=>setPermitExpiry(e.target.value)} className="input"/></Field>
          <Field label="Fitness Expiry"><input type="date" value={fitnessExpiry} onChange={e=>setFitnessExpiry(e.target.value)} className="input"/></Field>
          <Field label="PUC Expiry"><input type="date" value={pucExpiry} onChange={e=>setPucExpiry(e.target.value)} className="input"/></Field>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>setModal(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">{editing ? 'Save Changes' : 'Add Bus'}</button>
        </div>
      </form>
    );
  };

  const Field = ({ label, children }) => <label className="text-sm space-y-1 block"><span className="text-slate-600 dark:text-slate-400">{label}</span>{children}</label>;

  const BulkAssignRoute = ({ onAssign, onClose }) => {
    const [routeId, setRouteId] = useState(routes[0]?.id);
    const submit = (e) => { e.preventDefault(); onAssign(routeId); setModal(null); };
    return (
      <form onSubmit={submit} className="space-y-4">
        <div><label className="text-sm text-slate-600">Route</label><select value={routeId} onChange={e=>setRouteId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900">{routes.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border">Cancel</button><button className="px-3 py-2 rounded-lg bg-indigo-600 text-white">Assign</button></div>
      </form>
    );
  };

  const RowActions = ({ b }) => (
    <div className="flex items-center gap-2 text-xs">
      <button onClick={()=>setModal({ type:'assign', busId: b.id })} className="px-2 py-1 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800">Assign</button>
      <button onClick={()=>setModal({ type:'service', busId: b.id })} className="px-2 py-1 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800">Service</button>
      <button onClick={()=>setModal({ type:'incident', busId: b.id })} className="px-2 py-1 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800">Incident</button>
      <button onClick={()=>setModal({ type:'bus-edit', busId: b.id })} className="px-2 py-1 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800">Edit</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3"><Icon name="bus" className="w-7 h-7 text-indigo-600"/><div><h1 className="text-xl sm:text-2xl font-bold tracking-tight">Transport Management</h1><p className="text-sm text-slate-500">Fleet, drivers, maintenance, and compliance at a glance.</p></div></div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setModal({ type: 'bus-edit' })} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"><Icon name="plus"/>Add Bus</button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"><Icon name="download"/>Export</button>
            <button onClick={()=>window.print()} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border"><Icon name="print"/>Print</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card><div className="text-xs text-slate-500">Fleet Size</div><div className="text-2xl font-semibold">{kpis.total}</div></Card>
          <Card><div className="text-xs text-slate-500">On Trip</div><div className="text-2xl font-semibold">{kpis.onTrip}</div></Card>
            <Card><div className="text-xs text-slate-500">In Maintenance</div><div className="text-2xl font-semibold">{kpis.maint}</div></Card>
            <Card><div className="text-xs text-slate-500">Service ≤ 15d</div><div className="text-2xl font-semibold">{kpis.serviceDue}</div></Card>
            <Card><div className="text-xs text-slate-500">Docs expiring ≤ 30d</div><div className="text-2xl font-semibold">{kpis.expiringDocs}</div></Card>
        </div>

        <Card className="mb-6">
          <div className="grid sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2 flex items-center gap-2"><Icon name="search" className="w-5 h-5 text-slate-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bus, driver, route…" className="w-full bg-transparent outline-none"/></div>
            <div><label className="text-xs text-slate-500">Route</label><select value={routeFilter} onChange={e=>setRouteFilter(e.target.value)} className="mt-1 w-full rounded-md border bg-white dark:bg-slate-900 px-3 py-2"><option value="all">All</option>{routes.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <div><label className="text-xs text-slate-500">Status</label><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="mt-1 w-full rounded-md border bg-white dark:bg-slate-900 px-3 py-2"><option value="all">All</option>{['On Trip','Idle','Maintenance','Reserved'].map(s=> <option key={s}>{s}</option>)}</select></div>
            <div className="flex items-end"><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={alertsOnly} onChange={e=>setAlertsOnly(e.target.checked)} className="rounded"/>Show alerts only</label></div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle title="Fleet" subtitle="Select rows for bulk actions"/>
              <div className="flex items-center gap-2">
                <button disabled={bulk.selected.size===0} onClick={()=>setModal({ type: 'bulk-assign-route' })} className="px-3 py-2 rounded-xl border disabled:opacity-50"><span className="hidden sm:inline">Assign Route</span><span className="sm:hidden">Route</span></button>
                <button disabled={bulk.selected.size===0} onClick={()=>{ markMaintenance(Array.from(bulk.selected)); setBulk({ selected: new Set() }); }} className="px-3 py-2 rounded-xl border disabled:opacity-50 inline-flex items-center gap-2"><Icon name="wrench" className="w-4 h-4"/>Maintenance</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-2"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll}/></th>
                    <th className="py-2 pr-2">Bus</th>
                    <th className="py-2 pr-2">Driver</th>
                    <th className="py-2 pr-2">Route</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Last Service</th>
                    <th className="py-2 pr-2">Next Service</th>
                    <th className="py-2 pr-2">Docs</th>
                    <th className="py-2 pr-2">GPS</th>
                    <th className="py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const driver = driversById[b.driverId];
                    const route = routesById[b.routeId];
                    return (
                      <tr key={b.id} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40">
                        <td className="py-2 pr-2 align-top"><input type="checkbox" checked={bulk.selected.has(b.id)} onChange={()=>toggleSelect(b.id)}/></td>
                        <td className="py-2 pr-2 align-top space-y-1 min-w-[140px]">
                          <div className="font-medium leading-tight">{b.code}</div>
                          <div className="text-xs text-slate-500">{b.model}</div>
                          <div className="text-[10px] text-slate-400">Cap {b.capacity}</div>
                        </td>
                        <td className="py-2 pr-2 align-top text-xs">
                          {driver ? (
                            <div className="space-y-0.5">
                              <div className="font-medium">{driver.name}</div>
                              <div className="text-slate-500 text-[11px]">{driver.phone}</div>
                              <div className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] ${docColor(driver.licenseExpiry)}`}>Lic {fmt(driver.licenseExpiry)}</div>
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-2 pr-2 align-top text-xs">
                          {route ? (
                            <div className="space-y-0.5">
                              <div className="font-medium">{route.name}</div>
                              <div className="text-slate-500 text-[11px]">Stops {route.stops}</div>
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-2 pr-2 align-top">{badge(b.status, statusColor(b.status))}</td>
                        <td className="py-2 pr-2 align-top text-xs">{fmt(b.lastServiceDate)}</td>
                        <td className="py-2 pr-2 align-top text-xs">{fmt(computeNextService(b))}<div className="mt-1">{serviceStatusBadge(b)}</div></td>
                        <td className="py-2 pr-2 align-top text-[10px] space-y-1 min-w-[160px]">
                          <div className={`inline-block px-1.5 py-0.5 rounded ${docColor(b.insuranceExpiry)}`}>Ins {fmt(b.insuranceExpiry)}</div>{' '}
                          <div className={`inline-block px-1.5 py-0.5 rounded ${docColor(b.permitExpiry)}`}>Perm {fmt(b.permitExpiry)}</div>{' '}
                          <div className={`inline-block px-1.5 py-0.5 rounded ${docColor(b.fitnessExpiry)}`}>Fit {fmt(b.fitnessExpiry)}</div>{' '}
                          <div className={`inline-block px-1.5 py-0.5 rounded ${docColor(b.pucExpiry)}`}>PUC {fmt(b.pucExpiry)}</div>
                        </td>
                        <td className="py-2 pr-2 align-top text-xs">{gpsBadge(b)}</td>
                        <td className="py-2 pr-2 align-top"><RowActions b={b} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <SectionTitle title="Alerts" subtitle="Service & compliance within next 15–30 days" />
            {alerts.length === 0 ? <div className="text-sm text-slate-500">All clear. No immediate actions.</div> : (
              <ul className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {alerts.map((a,i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon name="alert" className="w-4 h-4 text-amber-600 mt-1" />
                    <div>
                      <div className="text-sm font-medium">{a.type}</div>
                      <div className="text-xs text-slate-600">{a.msg}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2"><Icon name="calendar" className="w-4 h-4"/> Today is {new Date().toLocaleDateString()} • Data is sample only</div>
      </div>

      <Modal open={modal?.type==='assign'} onClose={()=>setModal(null)} title="Assign Driver">{modal?.busId && <AssignDriverForm bus={buses.find(b=>b.id===modal.busId)} />}</Modal>
      <Modal open={modal?.type==='service'} onClose={()=>setModal(null)} title="Log Service">{modal?.busId && <ServiceForm bus={buses.find(b=>b.id===modal.busId)} />}</Modal>
      <Modal open={modal?.type==='incident'} onClose={()=>setModal(null)} title="Log Incident">{modal?.busId && <IncidentForm bus={buses.find(b=>b.id===modal.busId)} />}</Modal>
      <Modal open={modal?.type==='bus-edit'} onClose={()=>setModal(null)} title={(modal?.busId? 'Edit' : 'Add') + ' Bus'} wide><BusForm bus={modal?.busId ? buses.find(b=>b.id===modal.busId) : null} /></Modal>
      <Modal open={modal?.type==='bulk-assign-route'} onClose={()=>setModal(null)} title={`Assign Route to ${bulk.selected.size} bus(es)`}><BulkAssignRoute onClose={()=>setModal(null)} onAssign={(routeId)=> { assignRoute(Array.from(bulk.selected), routeId); setBulk({ selected: new Set() }); }} /></Modal>
    </div>
  );
}
