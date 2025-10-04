import React, { useMemo, useState } from "react";

// School Planner page (Academic Session + Admissions + Tasks + Compliance)
// Converted from provided single-file implementation (TypeScript annotations removed)

// ---------- Small UI Primitives ----------
const SectionCard = ({ title, subtitle, right, className = "", children }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Button = ({ onClick, variant = "primary", disabled, className = "", type = "button", children }) => {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};

const Pill = ({ tone = "neutral", className = "", children }) => {
  const map = {
    neutral: "bg-slate-100 text-slate-700",
    ok: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]} ${className}`}>{children}</span>;
};

const ProgressBar = ({ value }) => (
  <div className="h-2 w-full rounded-full bg-slate-100">
    <div
      className="h-2 rounded-full bg-slate-900 transition-[width]"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      role="progressbar"
    />
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text", className = "" }) => (
  <input
    className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-2 ${className}`}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
  />
);

const Select = ({ value, onChange, options, className = "" }) => (
  <select
    className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-2 ${className}`}
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-300"}`}
    aria-pressed={checked}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

const Divider = () => <div className="my-3 h-px w-full bg-slate-100" />;

// ---------- Helper Data ----------
const AY_OPTIONS = [
  { value: "2024-25", label: "AY 2024-25" },
  { value: "2025-26", label: "AY 2025-26" },
  { value: "2026-27", label: "AY 2026-27" },
];

const GRADES = ["Nursery","KG","1","2","3","4","5","6","7","8","9","10","11","12"];

const DEFAULT_STEPS = [
  { id: "session", name: "Define Session" },
  { id: "sections", name: "Class Sections & Capacity" },
  { id: "fees", name: "Fee Templates" },
  { id: "calendar", name: "Academic Calendar & Exams" },
  { id: "staff", name: "Staff Allocation" },
  { id: "comms", name: "Communication Setup" },
  { id: "review", name: "Final Review & Publish" },
];

// ---------- Main Component ----------
export default function Planner() {
  // Tabs
  const [tab, setTab] = useState("overview");

  // Session Wizard State
  const [targetAY, setTargetAY] = useState("2025-26");
  const [terms, setTerms] = useState(2);
  const [startDate, setStartDate] = useState("2025-04-01");
  const [endDate, setEndDate] = useState("2026-03-31");
  const [stepsComplete, setStepsComplete] = useState({});
  // Hoisted states that were incorrectly inside render blocks
  const [staffMap, setStaffMap] = useState({});
  const REMINDERS = [
    { id:'fee-due', label:'Fee due (nudge unpaid parents 5 days before due date)' },
    { id:'admission-incomplete', label:'Admissions: Incomplete applications weekly summary' },
    { id:'exam-publish', label:'Exam calendar publish alert to parents & staff' },
    { id:'term-start', label:'Term start checklist broadcast' },
  ];
  const [remState, setRemState] = useState(REMINDERS.reduce((a,r)=>({...a,[r.id]:true}),{}));
  // Session Step To-do checklist
  const LAST_YEAR_BASE = [
    'Confirm academic year structure',
    'Approve term dates',
    'Sync holidays with district calendar',
    'Map exam window placeholders',
  ];
  const [sessionTodos, setSessionTodos] = useState(LAST_YEAR_BASE.map((t,i)=>({ id:`S${i+1}`, title:t, done:false })));
  const [newSessionTodo, setNewSessionTodo] = useState("");
  const copyLastYearTodos = () => {
    // simulate copy, mark as pending
    setSessionTodos(LAST_YEAR_BASE.map((t,i)=>({ id:`S${Date.now()}-${i}`, title:t, done:false })));
  };
  const addSessionTodo = (e) => {
    e.preventDefault();
    if(!newSessionTodo.trim()) return;
    setSessionTodos(ts=>[...ts,{ id:`S${Date.now()}`, title:newSessionTodo.trim(), done:false }]);
    setNewSessionTodo("");
  };
  const toggleSessionTodo = (id) => setSessionTodos(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
  const removeSessionTodo = (id) => setSessionTodos(ts=>ts.filter(t=>t.id!==id));

  // Capacity Matrix
  const [capacity, setCapacity] = useState(
    Object.fromEntries(GRADES.map(g => [g, { seats: 40, sections: 2, enrolled: Math.floor(Math.random()*60)+20 }]))
  );

  // Admissions Pipeline
  const [pipeline, setPipeline] = useState({
    Leads: [
      { id: "L-101", name: "Aarav Gupta", grade: "1", src: "Walk-in" },
      { id: "L-102", name: "Sara Khan", grade: "KG", src: "Website" },
      { id: "L-103", name: "Kabir Mehta", grade: "6", src: "Referral" },
    ],
    Applied: [ { id: "A-201", name: "Ishita Verma", grade: "3", src: "Website" } ],
    Verified: [],
    Offered: [],
    Enrolled: [ { id: "E-401", name: "Rohan Das", grade: "2", src: "Transfer" } ],
    Waitlisted: [],
  });

  // Tasks & Approvals
  const [tasks, setTasks] = useState([
    { id: "T1", title: "Upload fee template for AY 2025-26", assignee: "Accountant", due: "2025-10-05", done: false, requiresApproval: true },
    { id: "T2", title: "Publish admission brochure", assignee: "Admin", due: "2025-10-01", done: true },
    { id: "T3", title: "Lock exam windows (Term 1)", assignee: "Principal", due: "2025-10-15", done: false, requiresApproval: true },
  ]);

  // Compliance Checklist
  const [checks, setChecks] = useState([
    { id: "C1", label: "Affiliation letter current", ok: true },
    { id: "C2", label: "Fire NOC renewed", ok: false },
    { id: "C3", label: "Transport fitness certs", ok: true },
    { id: "C4", label: "Staff police verification updated", ok: false },
  ]);

  // Communication plan toggles
  const [notifyParents, setNotifyParents] = useState(true);
  const [notifyStaff, setNotifyStaff] = useState(true);

  // Readiness score
  const readiness = useMemo(() => {
    const stepsDone = DEFAULT_STEPS.filter(s => stepsComplete[s.id]).length;
    const stepPart = Math.round((stepsDone / DEFAULT_STEPS.length) * 40);
    const compliancePart = Math.round((checks.filter(c => c.ok).length / checks.length) * 30);
    const taskPart = Math.round((tasks.filter(t => t.done).length / tasks.length) * 30);
    return Math.min(100, stepPart + compliancePart + taskPart);
  }, [stepsComplete, checks, tasks]);

  // Utilities
  const markStep = (id, val) => setStepsComplete(s => ({ ...s, [id]: val }));
  const bumpCandidate = (from, to, idx) => {
    setPipeline(prev => {
      const item = prev[from][idx];
      const fromArr = prev[from].filter((_, i) => i !== idx);
      const toArr = [...prev[to], item];
      return { ...prev, [from]: fromArr, [to]: toArr };
    });
  };

  const addTask = (title) => setTasks(ts => ([
    ...ts,
    { id: `T${ts.length+1}`, title, assignee: "Admin", due: new Date().toISOString().slice(0,10), done: false }
  ]));

  const toggleCheck = (id) => setChecks(cs => cs.map(c => c.id === id ? { ...c, ok: !c.ok } : c));

  // Render helpers
  const Stat = ({ label, value, hint }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );

  const SeatRow = ({ grade }) => {
    const row = capacity[grade];
    const filled = Math.min(100, Math.round((row.enrolled / (row.seats * row.sections)) * 100));
    return (
      <div className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-100 p-3">
        <div className="col-span-2 font-medium">{grade}</div>
        <div className="col-span-2">Sections: <span className="font-medium">{row.sections}</span></div>
        <div className="col-span-2">Seats/Section: <span className="font-medium">{row.seats}</span></div>
        <div className="col-span-2">Enrolled: <span className="font-medium">{row.enrolled}</span></div>
        <div className="col-span-4">
          <ProgressBar value={filled} />
          <div className="mt-1 text-[11px] text-slate-500">{filled}% filled</div>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${tab === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold">Planner</h1>
            <p className="text-xs text-slate-600">Standardize new academic session, review current, admissions & schoolwide planning</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setTab("review")}>Review current session</Button>
            <Button onClick={() => setTab("new")}>New Session Wizard</Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <Select value={targetAY} onChange={setTargetAY} options={AY_OPTIONS} className="w-44" />
            <Pill tone="info">Default target AY</Pill>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost">Import last year</Button>
            <Button variant="ghost">Download plan</Button>
            <Button variant="success">Submit for approval</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex flex-wrap gap-2">
          <TabButton id="overview" label="Overview" />
          <TabButton id="new" label="New Session" />
          <TabButton id="review" label="Review Session" />
          <TabButton id="admissions" label="Admissions" />
          <TabButton id="capacity" label="Capacity" />
          <TabButton id="calendar" label="Exams & Calendar" />
          <TabButton id="comms" label="Comms" />
          <TabButton id="compliance" label="Compliance" />
          <TabButton id="tasks" label="Tasks & Approvals" />
          <TabButton id="templates" label="Templates" />
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-4">
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <SectionCard title="Readiness" subtitle="Auto-computed from steps, compliance, and tasks">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Stat label="Overall" value={<>
                    <div className="mb-1"><ProgressBar value={readiness} /></div>
                    <span>{readiness}%</span>
                  </>} />
                  <Stat label="Steps done" value={`${DEFAULT_STEPS.filter(s=>stepsComplete[s.id]).length}/${DEFAULT_STEPS.length}`} />
                  <Stat label="Compliant" value={`${checks.filter(c=>c.ok).length}/${checks.length}`} />
                  <Stat label="Tasks done" value={`${tasks.filter(t=>t.done).length}/${tasks.length}`} />
                </div>
              </SectionCard>

              <SectionCard title="Quick Actions">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setTab("new")}>Start New Session Wizard</Button>
                  <Button variant="secondary" onClick={() => setTab("admissions")}>Open Admissions Pipeline</Button>
                  <Button variant="secondary" onClick={() => setTab("capacity")}>Review Seat Matrix</Button>
                  <Button variant="secondary" onClick={() => setTab("calendar")}>Set Exam Windows</Button>
                </div>
              </SectionCard>

              <SectionCard title="Timeline" subtitle="Key milestones">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">Publish fee templates</div>
                      <div className="text-xs text-slate-500">Auto-reminder to Accounts & Principal</div>
                    </div>
                    <Pill tone="warn">Due Oct 5</Pill>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">Admissions kickoff webinar</div>
                      <div className="text-xs text-slate-500">Notify all leads & parents</div>
                    </div>
                    <Pill tone="neutral">Oct 10</Pill>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">Lock Term 1 exam plan</div>
                      <div className="text-xs text-slate-500">Needs Principal approval</div>
                    </div>
                    <Pill tone="ok">Planned</Pill>
                  </li>
                </ul>
              </SectionCard>
            </div>

            <div className="space-y-4">
              <SectionCard title="Approvals" subtitle="Gated changes">
                <div className="space-y-2 text-sm">
                  {tasks.filter(t=>t.requiresApproval).map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2">
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-slate-500">Assignee: {t.assignee}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost">Reject</Button>
                        <Button variant="success">Approve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Comms toggles" subtitle="Who gets notified">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notify Parents</div>
                    <div className="text-xs text-slate-500">Admissions, calendar & fee updates</div>
                  </div>
                  <Toggle checked={notifyParents} onChange={setNotifyParents} />
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notify Staff</div>
                    <div className="text-xs text-slate-500">Tasks, schedules & approvals</div>
                  </div>
                  <Toggle checked={notifyStaff} onChange={setNotifyStaff} />
                </div>
              </SectionCard>

              <SectionCard title="Add quick task">
                <div className="flex items-center gap-2">
                  <QuickAdd onAdd={addTask} />
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === "new" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Horizontal workflow tiles */}
            <div className="lg:col-span-3">
              <div className="overflow-x-auto pb-2 -mx-1">
                <div className="flex min-w-max gap-3 px-1">
                  {DEFAULT_STEPS.map((s, i) => {
                    const done = !!stepsComplete[s.id];
                    return (
                      <div key={s.id} className={`relative flex flex-col justify-between rounded-2xl border p-3 w-52 shrink-0 transition ${done? 'border-emerald-300 bg-emerald-50':'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${done? 'bg-emerald-600 text-white':'bg-slate-900 text-white'}`}>{i+1}</span>
                          <span className="text-sm font-medium leading-tight">{s.name}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                          <Pill tone={done? 'ok':'neutral'}>{done? 'Done':'Pending'}</Pill>
                          <div className="flex gap-1">
                            {!done && <Button variant="ghost" className="px-2 py-1 text-[11px]" onClick={()=>markStep(s.id,true)}>Mark</Button>}
                            {done && <Button variant="ghost" className="px-2 py-1 text-[11px]" onClick={()=>markStep(s.id,false)}>Undo</Button>}
                          </div>
                        </div>
                        {i < DEFAULT_STEPS.length-1 && <div className="absolute top-1/2 -right-4 hidden xl:block"><div className="h-0 w-8 border-t-2 border-dashed border-slate-300" /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-4 lg:col-span-3">
              {/* Step: Define Session */}
              <SectionCard title="1) Define Session" subtitle="AY & term structure" right={<Pill tone={stepsComplete.session?"ok":"neutral"}>{stepsComplete.session?"Done":"Pending"}</Pill>}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-600">Academic Year</label>
                    <Select value={targetAY} onChange={setTargetAY} options={AY_OPTIONS} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Terms</label>
                    <Input type="number" value={terms} onChange={(e)=>setTerms(parseInt(e.target.value||"0",10))} />
                  </div>
                  <div className="hidden md:block" />
                  <div>
                    <label className="text-xs text-slate-600">Start date</label>
                    <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">End date</label>
                    <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
                  </div>
                </div>
                {/* Checklist */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Session To-do Checklist</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={copyLastYearTodos}>Copy last year</Button>
                      <Button variant="success" disabled={sessionTodos.every(t=>t.done)} onClick={()=>markStep("session", true)}>Mark complete</Button>
                    </div>
                  </div>
                  <form onSubmit={addSessionTodo} className="flex gap-2">
                    <Input value={newSessionTodo} onChange={(e)=>setNewSessionTodo(e.target.value)} placeholder="Add checklist item" />
                    <Button type="submit" variant="secondary">Add</Button>
                  </form>
                  <ul className="space-y-2 text-sm">
                    {sessionTodos.map(item => (
                      <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2">
                        <label className="flex flex-1 items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="h-4 w-4" checked={item.done} onChange={()=>toggleSessionTodo(item.id)} />
                          <span className={item.done?"line-through text-slate-400":""}>{item.title}</span>
                        </label>
                        <Button variant="ghost" onClick={()=>removeSessionTodo(item.id)}>✕</Button>
                      </li>
                    ))}
                    {sessionTodos.length===0 && <li className="text-xs text-slate-500">No items. Add one.</li>}
                  </ul>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={()=>markStep("session", false)}>Undo</Button>
                  </div>
                </div>
                
              </SectionCard>

              {/* Step: Sections & Capacity (Wing Grouped) */}
              <SectionCard title="2) Class Sections & Capacity" subtitle="Seat matrix grouped by wings" right={<Pill tone={stepsComplete.sections?"ok":"neutral"}>{stepsComplete.sections?"Done":"Pending"}</Pill>}>
                {(() => {
                  const wings = [
                    { name: 'Primary', grades: ['Nursery','KG','1','2'] },
                    { name: 'Junior', grades: ['3','4','5'] },
                    { name: 'Middle', grades: ['6','7','8'] },
                    { name: 'Senior', grades: ['9','10','11','12'] },
                  ];
                  return (
                    <div className="space-y-6">
                      {wings.map(wing => {
                        const wingRows = wing.grades.filter(g=>capacity[g]);
                        const totals = wingRows.reduce((acc,g)=>{
                          const r = capacity[g];
                          acc.sections += r.sections;
                          acc.seats += r.sections * r.seats;
                          acc.enrolled += r.enrolled;
                          return acc;
                        }, { sections:0, seats:0, enrolled:0 });
                        const fill = totals.seats ? Math.round((totals.enrolled / totals.seats) * 100) : 0;
                        return (
                          <div key={wing.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold">{wing.name} Wing</h4>
                              <div className="flex flex-wrap gap-4 text-xs">
                                <span>Sections: <span className="font-medium">{totals.sections}</span></span>
                                <span>Seats: <span className="font-medium">{totals.seats}</span></span>
                                <span>Enrolled: <span className="font-medium">{totals.enrolled}</span></span>
                                <span className="flex items-center gap-1">Fill <Pill tone={fill>95?'danger':fill>85?'warn':'info'}>{fill}%</Pill></span>
                              </div>
                            </div>
                            {wingRows.map(g => {
                              const r = capacity[g];
                              const filled = Math.min(100, Math.round((r.enrolled / (r.sections * r.seats)) * 100));
                              return (
                                <div key={g} className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-100 p-3 bg-white text-xs md:text-sm">
                                  <div className="col-span-2 font-medium text-sm">{g}</div>
                                  <div className="col-span-2 flex items-center gap-1">
                                    <span className="text-[11px] text-slate-500">Sec</span>
                                    <Input type="number" value={r.sections}
                                      onChange={(e)=>setCapacity(c=>({ ...c, [g]: { ...c[g], sections: parseInt(e.target.value||'0',10) } }))}
                                      className="w-14" />
                                  </div>
                                  <div className="col-span-2 flex items-center gap-1">
                                    <span className="text-[11px] text-slate-500">Seats</span>
                                    <Input type="number" value={r.seats}
                                      onChange={(e)=>setCapacity(c=>({ ...c, [g]: { ...c[g], seats: parseInt(e.target.value||'0',10) } }))}
                                      className="w-16" />
                                  </div>
                                  <div className="col-span-2 flex items-center gap-1 text-[11px] md:text-xs text-slate-600">
                                    <span>Enr</span>
                                    <span className="font-medium">{r.enrolled}</span>
                                  </div>
                                  <div className="col-span-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1"><ProgressBar value={filled} /></div>
                                      <span className="text-[11px] text-slate-500 w-10 text-right">{filled}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="success" onClick={()=>markStep("sections", true)}>Mark complete</Button>
                  <Button variant="ghost" onClick={()=>markStep("sections", false)}>Undo</Button>
                </div>
              </SectionCard>

              {/* Step: Fee Templates */}
              <SectionCard title="3) Fee Templates" subtitle="Define heads & schedules" right={<Pill tone={stepsComplete.fees?"ok":"neutral"}>{stepsComplete.fees?"Done":"Pending"}</Pill>}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs text-slate-600">Billing cadence</label>
                    <Select value={"quarterly"} onChange={()=>{}} options={[
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "yearly", label: "Yearly" },
                    ]} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Transport fee</label>
                    <Select value={"separate"} onChange={()=>{}} options={[
                      { value: "separate", label: "Separate head" },
                      { value: "composite", label: "Composite fee" },
                    ]} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Early payment discount</label>
                    <Select value={"5"} onChange={()=>{}} options={[
                      { value: "0", label: "None" },
                      { value: "5", label: "5%" },
                      { value: "10", label: "10%" },
                    ]} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="success" onClick={()=>markStep("fees", true)}>Mark complete</Button>
                  <Button variant="ghost" onClick={()=>markStep("fees", false)}>Undo</Button>
                </div>
              </SectionCard>

              {/* Step: Calendar & Exams */}
              <SectionCard title="4) Academic Calendar & Exams" subtitle="Holidays & exam windows" right={<Pill tone={stepsComplete.calendar?"ok":"neutral"}>{stepsComplete.calendar?"Done":"Pending"}</Pill>}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-sm font-medium">Holidays</div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>15 Aug — Independence Day</li>
                      <li>02 Oct — Gandhi Jayanti</li>
                      <li>Diwali break — 3 days</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-sm font-medium">Exam Windows</div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Term 1: 2025-09-20 → 2025-09-30</li>
                      <li>Term 2: 2026-02-15 → 2026-02-25</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="success" onClick={()=>markStep("calendar", true)}>Mark complete</Button>
                  <Button variant="ghost" onClick={()=>markStep("calendar", false)}>Undo</Button>
                </div>
              </SectionCard>

              {/* Step: Staff Allocation (Wing + Primary/Assistant) */}
              <SectionCard title="5) Staff Allocation" subtitle="Assign primary & assistant teacher per grade" right={<Pill tone={stepsComplete.staff?"ok":"neutral"}>{stepsComplete.staff?"Done":"Pending"}</Pill>}>
                {(() => {
                  const wings = [
                    { name: 'Primary', grades: ['Nursery','KG','1','2'] },
                    { name: 'Junior', grades: ['3','4','5'] },
                    { name: 'Middle', grades: ['6','7','8'] },
                    { name: 'Senior', grades: ['9','10','11','12'] },
                  ];
                  return (
                    <div className="space-y-6">
                      {wings.map(wing => (
                        <div key={wing.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">{wing.name} Wing</h4>
                            <Pill tone="info">{wing.grades.length} grades</Pill>
                          </div>
                          <div className="overflow-auto rounded-xl border border-slate-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-600">
                                  <th className="p-2 text-left font-medium">Grade</th>
                                  <th className="p-2 text-left font-medium">Primary Teacher</th>
                                  <th className="p-2 text-left font-medium">Assistant Teacher</th>
                                  <th className="p-2 text-left font-medium">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {wing.grades.map(g => (
                                  <tr key={g} className="border-t">
                                    <td className="p-2 font-medium">{g}</td>
                                    <td className="p-2"><Input value={staffMap[g]?.primary || ''} onChange={(e)=>setStaffMap(m=>({...m,[g]:{...(m[g]||{}), primary:e.target.value}}))} placeholder="e.g., Ms. Ahuja" /></td>
                                    <td className="p-2"><Input value={staffMap[g]?.assistant || ''} onChange={(e)=>setStaffMap(m=>({...m,[g]:{...(m[g]||{}), assistant:e.target.value}}))} placeholder="e.g., Mr. Rao" /></td>
                                    <td className="p-2"><Input value={staffMap[g]?.notes || ''} onChange={(e)=>setStaffMap(m=>({...m,[g]:{...(m[g]||{}), notes:e.target.value}}))} placeholder="Optional" /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="success" onClick={()=>markStep("staff", true)}>Mark complete</Button>
                  <Button variant="ghost" onClick={()=>markStep("staff", false)}>Undo</Button>
                </div>
              </SectionCard>

              {/* Step: Comms */}
              <SectionCard title="6) Communication Setup" subtitle="Channels & scheduled broadcast reminders" right={<Pill tone={stepsComplete.comms?"ok":"neutral"}>{stepsComplete.comms?"Done":"Pending"}</Pill>}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div>
                      <div className="text-sm font-medium">Parents updates</div>
                      <div className="text-xs text-slate-500">Admissions & fees</div>
                    </div>
                    <Toggle checked={notifyParents} onChange={setNotifyParents} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div>
                      <div className="text-sm font-medium">Staff alerts</div>
                      <div className="text-xs text-slate-500">Tasks & approvals</div>
                    </div>
                    <Toggle checked={notifyStaff} onChange={setNotifyStaff} />
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="font-medium">Channels</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill tone="info">Email</Pill>
                      <Pill tone="info">WhatsApp</Pill>
                      <Pill tone="info">SMS</Pill>
                      <Pill tone="info">Portal</Pill>
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Scheduled Broadcast Reminders</h4>
                    <Pill tone="info">Auto</Pill>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {REMINDERS.map(r => (
                      <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2 bg-white">
                        <div className="flex-1">
                          <div className="font-medium text-slate-700 text-[11px] md:text-xs">{r.label}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Toggle checked={remState[r.id]} onChange={(v)=>setRemState(s=>({...s,[r.id]:v}))} />
                          <Button variant="ghost">Edit</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="success" onClick={()=>markStep("comms", true)}>Mark complete</Button>
                  <Button variant="ghost" onClick={()=>markStep("comms", false)}>Undo</Button>
                </div>
              </SectionCard>

              {/* Step: Final */}
              <SectionCard title="7) Final Review & Publish" subtitle="Lock plan & notify">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Readiness</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-40"><ProgressBar value={readiness} /></div>
                      <span className="text-sm font-semibold">{readiness}%</span>
                    </div>
                  </div>
                  <Pill tone="warn">Principal approval required</Pill>
                  <Button variant="success" onClick={()=>markStep("review", true)}>Publish draft</Button>
                </div>
              </SectionCard>
            </div>

            {/* Notes moved below main content to utilize full width */}
            <div className="space-y-4 lg:col-span-3">
              <SectionCard title="Notes">
                <ul className="list-disc pl-5 text-sm text-slate-600">
                  <li>Keep NEP/CBSE alignment in calendar & assessment weightages.</li>
                  <li>Seat matrix drives admissions caps and waitlists.</li>
                  <li>All fee changes are approval-gated.</li>
                </ul>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === "review" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              <SectionCard title="Session Snapshot" subtitle={`AY ${targetAY}`}>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Grades" value={GRADES.length} />
                  <Stat label="Sections" value={Object.values(capacity).reduce((a,b)=>a+b.sections,0)} />
                  <Stat label="Planned seats" value={Object.values(capacity).reduce((a,b)=>a+(b.sections*b.seats),0)} />
                  <Stat label="Enrolled" value={Object.values(capacity).reduce((a,b)=>a+b.enrolled,0)} />
                </div>
              </SectionCard>
              <SectionCard title="Risks & Blockers">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 p-2">
                    <span>Fire NOC renewal pending</span>
                    <Pill tone="warn">Compliance</Pill>
                  </li>
                  <li className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50 p-2">
                    <span>Admission funnel below target in Grades 6–8</span>
                    <Pill tone="danger">Admissions</Pill>
                  </li>
                </ul>
              </SectionCard>
            </div>
            <div className="space-y-4">
              <SectionCard title="Checklist">
                <div className="space-y-2 text-sm">
                  {checks.map(c => (
                    <label key={c.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-100 p-2">
                      <span>{c.label}</span>
                      <input type="checkbox" className="h-4 w-4" checked={c.ok} onChange={()=>toggleCheck(c.id)} />
                    </label>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === "admissions" && (
          <SectionCard title="Admissions Pipeline" subtitle="Move candidates across stages">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {Object.keys(pipeline).map((col) => (
                <div key={col} className="rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between border-b border-slate-200 p-3">
                    <div className="text-sm font-semibold">{col}</div>
                    <Pill tone="info">{pipeline[col].length}</Pill>
                  </div>
                  <div className="space-y-2 p-3">
                    {pipeline[col].map((c, idx) => (
                      <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-2 text-sm">
                        <div className="font-medium">{c.name}</div>
                        <div className="mt-1 text-xs text-slate-500">Grade {c.grade} · {c.src}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {col !== "Enrolled" && (
                            <Button variant="secondary" onClick={()=>{
                              const order = ["Leads","Applied","Verified","Offered","Enrolled","Waitlisted"];
                              const next = order[Math.min(order.indexOf(col)+1, order.length-1)];
                              bumpCandidate(col, next, idx);
                            }}>Move →</Button>
                          )}
                          {col !== "Leads" && (
                            <Button variant="ghost" onClick={()=>{
                              const order = ["Leads","Applied","Verified","Offered","Enrolled","Waitlisted"];
                              const prev = order[Math.max(order.indexOf(col)-1, 0)];
                              setPipeline(p => {
                                const item = p[col][idx];
                                const fromArr = p[col].filter((_, i)=> i!==idx);
                                const toArr = [...p[prev], item];
                                return { ...p, [col]: fromArr, [prev]: toArr };
                              });
                            }}>← Back</Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {pipeline[col].length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">No items</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {tab === "capacity" && (
          <SectionCard title="Seat Matrix" subtitle="Per grade capacity and fill">
            <div className="space-y-2">
              {GRADES.map(g => <SeatRow key={g} grade={g} />)}
            </div>
          </SectionCard>
        )}

        {tab === "calendar" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <SectionCard title="Exam Planner" subtitle="Define assessment windows">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between rounded-xl border border-slate-100 p-2"><span>Term 1 (Sep 20–30)</span><Pill tone="ok">Ready</Pill></li>
                  <li className="flex items-center justify-between rounded-xl border border-slate-100 p-2"><span>Monday Tests (Weekly)</span><Pill>Scheduled</Pill></li>
                  <li className="flex items-center justify-between rounded-xl border border-slate-100 p-2"><span>Unit Tests (Monthly)</span><Pill>Draft</Pill></li>
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary">Add window</Button>
                  <Button variant="ghost">Export</Button>
                </div>
              </SectionCard>

              <SectionCard title="Academic Calendar" subtitle="Holidays & events">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="font-medium">Holidays</div>
                    <ul className="mt-2 list-disc pl-5 text-slate-600">
                      <li>Independence Day</li>
                      <li>Gandhi Jayanti</li>
                      <li>Diwali</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="font-medium">Events</div>
                    <ul className="mt-2 list-disc pl-5 text-slate-600">
                      <li>Sports Day</li>
                      <li>Science Fair</li>
                      <li>Annual Day</li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>
            <div className="space-y-4">
              <SectionCard title="Policy Notes" subtitle="Keep in view">
                <ul className="list-disc pl-5 text-sm text-slate-600">
                  <li>Balance formative (weekly) and summative (term) assessments.</li>
                  <li>Publish calendars to parents at least 2 weeks prior.</li>
                  <li>Accommodations for special needs where relevant.</li>
                </ul>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === "comms" && (
          <SectionCard title="Announcements & Templates" subtitle="Prepare messages in advance">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                <div className="font-medium">Admissions open (AY {targetAY})</div>
                <p className="mt-1 text-slate-600">Applications are now open. Please review the brochure and key dates.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary">Preview</Button>
                  <Button>Schedule</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                <div className="font-medium">Fee structure published</div>
                <p className="mt-1 text-slate-600">Fee heads and timelines are available in the parent portal.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary">Preview</Button>
                  <Button>Schedule</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                <div className="font-medium">Exam calendar (Term 1)</div>
                <p className="mt-1 text-slate-600">Please see dates and syllabus coverage on the portal.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary">Preview</Button>
                  <Button>Schedule</Button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === "compliance" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard title="Compliance Checklist" subtitle="Upload evidence & mark done">
              <div className="space-y-2 text-sm">
                {checks.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2">
                    <div>{c.label}</div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" checked={c.ok} onChange={()=>toggleCheck(c.id)} />
                      <Button variant="ghost">Upload</Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Docs & Policies" subtitle="Central store">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between rounded-xl border border-slate-100 p-2"><span>Admission Policy (PDF)</span><Button variant="ghost">View</Button></li>
                <li className="flex items-center justify-between rounded-xl border border-slate-100 p-2"><span>Fee Policy (PDF)</span><Button variant="ghost">View</Button></li>
                <li className="flex items-center justify-between rounded-xl border border-slate-100 p-2"><span>Discipline Policy (PDF)</span><Button variant="ghost">View</Button></li>
              </ul>
            </SectionCard>
          </div>
        )}

        {tab === "tasks" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <SectionCard title="Tasks" subtitle="Track work & approvals">
                <div className="mb-3"><QuickAdd onAdd={addTask} /></div>
                <div className="space-y-2 text-sm">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2">
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-slate-500">{t.assignee} • Due {t.due}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.requiresApproval && <Pill tone="warn">Approval</Pill>}
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={t.done} onChange={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:!x.done}:x))} /> Done</label>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
            <div className="space-y-4">
              <SectionCard title="Summary">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>Total</span><span className="font-medium">{tasks.length}</span></div>
                  <div className="flex items-center justify-between"><span>Open</span><span className="font-medium">{tasks.filter(t=>!t.done).length}</span></div>
                  <div className="flex items-center justify-between"><span>Needs Approval</span><span className="font-medium">{tasks.filter(t=>t.requiresApproval).length}</span></div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === "templates" && (
          <SectionCard title="Templates Library" subtitle="Reusable forms & letters">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="font-medium">Admission Form</div>
                <p className="mt-1 text-slate-600">Parent/guardian details, prior school, documents.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary">Preview</Button>
                  <Button>Use</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="font-medium">Fee Waiver Request</div>
                <p className="mt-1 text-slate-600">Means-based or sibling policy.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary">Preview</Button>
                  <Button>Use</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="font-medium">Transfer Certificate</div>
                <p className="mt-1 text-slate-600">Auto-fill from student records.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary">Preview</Button>
                  <Button>Use</Button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-slate-500">
        Built for Principals & Admins • Planner v1.0
      </footer>
    </div>
  );
}

// ---------- Subcomponents ----------
const QuickAdd = ({ onAdd }) => {
  const [val, setVal] = useState("");
  return (
    <form
      onSubmit={(e)=>{ e.preventDefault(); if(val.trim()){ onAdd(val.trim()); setVal(""); } }}
      className="flex w-full items-center gap-2"
    >
      <Input value={val} onChange={(e)=>setVal(e.target.value)} placeholder="Add a task..." />
      <Button type="submit">Add</Button>
    </form>
  );
};
