import React, { useMemo, useState } from 'react';

// Adapted from provided FinanceAccountingPage: trimmed full-screen wrapper to fit existing layout container.

const cn = (...a) => a.filter(Boolean).join(' ');
const fmt = (n) => n.toLocaleString(undefined,{style:'currency',currency:'INR',maximumFractionDigits:0});
const pct = (n) => `${n}%`;
const todayISO = () => new Date().toISOString().slice(0,10);
const ym = (d) => (d || new Date().toISOString()).slice(0,7);

const SESSIONS = ['2025-26','2024-25'];
const DEFAULT_SESSION = '2025-26';

const STUDENTS = [
  { id:'S-1001', name:'Aarav Gupta', class:'Grade 1' },
  { id:'S-1002', name:'Siya Sharma', class:'Grade 1' },
  { id:'S-1003', name:'Kabir Singh', class:'Grade 3' },
  { id:'S-1004', name:'Meera Iyer', class:'Grade 3' },
  { id:'S-1005', name:'Vihaan Rao', class:'Grade 5' },
  { id:'S-1006', name:'Anaya Nair', class:'Grade 5' },
  { id:'S-1007', name:'Arjun Mehta', class:'Grade 7' },
  { id:'S-1008', name:'Ishita Jain', class:'Grade 7' },
  { id:'S-1009', name:'Rohan Das', class:'Grade 9' },
  { id:'S-1010', name:'Zoya Khan', class:'Grade 9' },
  { id:'S-1011', name:'Dev Malik', class:'Grade 10' },
  { id:'S-1012', name:'Nisha Paul', class:'Grade 10' },
];

const FEE_HEADS = [
  { code:'ADMISSION', name:'Admission Fee', cycle:'OneTime', defaultGst:0 },
  { code:'ANNUAL', name:'Annual Charges', cycle:'Yearly', defaultGst:0 },
  { code:'TUITION_MONTHLY', name:'Tuition (Monthly)', cycle:'Monthly', defaultGst:0 },
  { code:'TUITION_QUARTERLY', name:'Tuition (Quarterly)', cycle:'Quarterly', defaultGst:0 },
  { code:'COMPOSITE', name:'Composite Fee', cycle:'Quarterly', defaultGst:0 },
  { code:'TRANSPORT', name:'Transport Fee (Bus)', cycle:'Monthly', defaultGst:0 },
  { code:'LAB', name:'Lab/Practical Fee', cycle:'Quarterly', defaultGst:0 },
  { code:'TECHNOLOGY', name:'Technology/Smart Class', cycle:'Quarterly', defaultGst:0 },
  { code:'EXAM', name:'Examination Fee', cycle:'Yearly', defaultGst:0 },
  { code:'FIELD_TRIP', name:'Field Trip (Taxable)', cycle:'Adhoc', defaultGst:5 },
];

const INIT_INVOICES = [
  { id:'INV-24001', session:'2025-26', date:'2025-04-10', studentId:'S-1003', class:'Grade 3', feeHead:'TUITION_QUARTERLY', baseAmount:30000, gstRate:0, discount:0, gateway:'Razorpay', status:'Paid', notes:'Q1' },
  { id:'INV-24002', session:'2025-26', date:'2025-07-10', studentId:'S-1003', class:'Grade 3', feeHead:'TUITION_QUARTERLY', baseAmount:30000, gstRate:0, discount:0, gateway:'Razorpay', status:'Unpaid', notes:'Q2' },
  { id:'INV-24003', session:'2025-26', date:'2025-07-05', studentId:'S-1007', class:'Grade 7', feeHead:'COMPOSITE', baseAmount:36000, gstRate:0, discount:2000, gateway:'NEFT', status:'Partial', notes:'Term 1' },
  { id:'INV-24004', session:'2025-26', date:'2025-04-08', studentId:'S-1011', class:'Grade 10', feeHead:'TUITION_MONTHLY', baseAmount:6000, gstRate:0, discount:0, gateway:'Razorpay', status:'Paid', notes:'Apr' },
  { id:'INV-24005', session:'2025-26', date:'2025-05-08', studentId:'S-1011', class:'Grade 10', feeHead:'TUITION_MONTHLY', baseAmount:6000, gstRate:0, discount:0, gateway:'Razorpay', status:'Unpaid', notes:'May' },
  { id:'INV-24006', session:'2025-26', date:'2025-04-01', studentId:'S-1001', class:'Grade 1', feeHead:'ANNUAL', baseAmount:12000, gstRate:0, discount:500, gateway:'Cash', status:'Paid', notes:'Annual' },
  { id:'INV-24007', session:'2025-26', date:'2025-07-01', studentId:'S-1005', class:'Grade 5', feeHead:'TRANSPORT', baseAmount:1500, gstRate:0, discount:0, gateway:'Razorpay', status:'Paid', notes:'Jul Bus' },
  { id:'INV-24008', session:'2025-26', date:'2025-08-22', studentId:'S-1012', class:'Grade 10', feeHead:'FIELD_TRIP', baseAmount:2500, gstRate:5, discount:0, gateway:'Razorpay', status:'Unpaid', notes:'Science Museum' },
  { id:'INV-24009', session:'2025-26', date:'2025-06-15', studentId:'S-1009', class:'Grade 9', feeHead:'TECHNOLOGY', baseAmount:2000, gstRate:0, discount:0, gateway:'Cash', status:'Paid', notes:'Smart class' },
  { id:'INV-24010', session:'2025-26', date:'2025-04-20', studentId:'S-1006', class:'Grade 5', feeHead:'EXAM', baseAmount:1200, gstRate:0, discount:0, gateway:'NEFT', status:'Paid', notes:'Board Reg.' },
];

const INIT_EXPENSES = [
  { id:'EXP-3001', date:'2025-04-05', vendorId:'V-01', vendor:'BSES Electricity', category:'Electricity', amount:82000, gstRate:18, tdsRate:0, paid:true, invoiceNo:'BSES/2404/9123', recurring:true, frequency:'Monthly', nextDue:'2025-10-05' },
  { id:'EXP-3002', date:'2025-05-11', vendorId:'V-03', vendor:'NetWave ISP', category:'Internet', amount:6500, gstRate:18, tdsRate:0, paid:true, invoiceNo:'NW/INV/7789', recurring:true, frequency:'Monthly', nextDue:'2025-10-11' },
  { id:'EXP-3003', date:'2025-05-01', vendorId:'V-06', vendor:'Security Services', category:'Security', amount:42000, gstRate:18, tdsRate:1, paid:true, invoiceNo:'SEC/0525/22', recurring:true, frequency:'Monthly', nextDue:'2025-10-01' },
  { id:'EXP-3004', date:'2025-06-01', vendorId:'V-07', vendor:'Cleaning & Housekeeping', category:'Housekeeping', amount:22000, gstRate:18, tdsRate:1, paid:true, invoiceNo:'CLN/0625/40', recurring:true, frequency:'Monthly', nextDue:'2025-10-01' },
  { id:'EXP-3005', date:'2025-08-03', vendorId:'V-04', vendor:'Campus Repairs', category:'Maintenance', amount:42000, gstRate:18, tdsRate:1, paid:false, invoiceNo:'CR/INV/231', recurring:false },
  { id:'EXP-3006', date:'2025-07-18', vendorId:'V-05', vendor:'EduSupplies Pvt Ltd', category:'Inventory', amount:51000, gstRate:18, tdsRate:0, paid:true, invoiceNo:'EDU/7712', recurring:false },
];

const INIT_SALARIES = [
  { id:'SAL-7001', month:'2025-07', staff:'Priya Verma', dept:'Mathematics', gross:55000, pf:1800, esi:0, tds:2500, status:'Paid' },
  { id:'SAL-7002', month:'2025-07', staff:'Ravi Kumar', dept:'Transport', gross:30000, pf:1200, esi:300, tds:0, status:'Paid' },
  { id:'SAL-7003', month:'2025-08', staff:'Anita Das', dept:'Science', gross:60000, pf:1800, esi:0, tds:3000, status:'Unpaid' },
  { id:'SAL-7004', month:'2025-08', staff:'Vikram Shah', dept:'Accounts', gross:45000, pf:1500, esi:0, tds:2000, status:'Paid' },
];

const TAGS = {
  overview:{ label:'Overview', icon: LedgerIcon },
  revenue:{ label:'Revenue (Students)', icon: RevenueIcon },
  expenses:{ label:'Expenses (Vendors)', icon: ExpenseIcon },
  salaries:{ label:'Salaries', icon: SalaryIcon },
  reports:{ label:'Reports & Compliance', icon: ReportIcon },
  settings:{ label:'Settings', icon: GearIcon },
};

export default function FinanceAccounting(){
  const [tab,setTab] = useState('overview');
  const [session,setSession] = useState(DEFAULT_SESSION);
  const [selectedCycle,setSelectedCycle] = useState('Quarterly');
  const [showDetails,setShowDetails] = useState({ revenue:false, expenses:false, salaries:false });
  const [invoices,setInvoices] = useState(INIT_INVOICES);
  const [expenses,setExpenses] = useState(INIT_EXPENSES);
  const [salaries,setSalaries] = useState(INIT_SALARIES);
  const [filters,setFilters] = useState({ class:'All', status:'All' });
  const [expMode,setExpMode] = useState('recurring');
  const [showInvoiceModal,setShowInvoiceModal] = useState(false);
  const [invoiceDraft,setInvoiceDraft] = useState(newInvoiceDraft());

  const STUDENT_INDEX = useMemo(()=>Object.fromEntries(STUDENTS.map(s=>[s.id,s])),[]);
  const FEE_INDEX = useMemo(()=>Object.fromEntries(FEE_HEADS.map(f=>[f.code,f])),[]);

  const revenueTotals = useMemo(()=>{ const rows=invoices.filter(r=>r.session===session); let base=0,gst=0,discount=0,paid=0,unpaid=0,partial=0; for(const r of rows){ const b=r.baseAmount; const g=Math.round(b*(r.gstRate/100)); base+=b; gst+=g; discount+=r.discount||0; const total=b+g-(r.discount||0); if(r.status==='Paid') paid+=total; else if(r.status==='Unpaid') unpaid+=total; else partial+=total;} const receivable=unpaid+partial; return { base,gst,discount,paid,receivable,gross:base+gst-discount }; },[invoices,session]);
  const expenseTotals = useMemo(()=>{ let base=0,gst=0,tds=0,paid=0,unpaid=0; for(const e of expenses){ const b=e.amount; const g=Math.round(b*(e.gstRate/100)); const t=Math.round(b*(e.tdsRate/100)); base+=b; gst+=g; tds+=t; if(e.paid) paid+=b+g-t; else unpaid+=b+g-t;} return { base,gst,tds,paid,unpaid,gross:base+gst-tds }; },[expenses]);
  const salaryTotals = useMemo(()=>{ let gross=0,ded=0,net=0,paid=0,unpaid=0; for(const s of salaries){ const d=(s.pf||0)+(s.esi||0)+(s.tds||0); const n=s.gross-d; gross+=s.gross; ded+=d; net+=n; if(s.status==='Paid') paid+=n; else unpaid+=n;} return { gross,ded,net,paid,unpaid }; },[salaries]);
  const netPosition = useMemo(()=> revenueTotals.paid - (expenseTotals.paid + salaryTotals.paid),[revenueTotals,expenseTotals,salaryTotals]);
  const classes = useMemo(()=> ['All',...Array.from(new Set(STUDENTS.map(s=>s.class)))],[]);
  const MAIN_FEE_CODES = new Set(['TUITION_MONTHLY','TUITION_QUARTERLY','COMPOSITE','ANNUAL']);
  const classSummary = useMemo(()=>{ const map={}; for(const s of STUDENTS){ if(!map[s.class]) map[s.class]={ class:s.class, students:0, paid:0, due:0, receivable:0 }; map[s.class].students+=1;} const rows=invoices.filter(r=>r.session===session && MAIN_FEE_CODES.has(r.feeHead)); for(const r of rows){ const total=r.baseAmount + Math.round(r.baseAmount*(r.gstRate/100)) - (r.discount||0); const c=r.class; if(c && map[c]){ if(r.status==='Paid') map[c].paid+=total; else { map[c].due+=1; map[c].receivable+=total; } } } return Object.values(map).sort((a,b)=>a.class.localeCompare(b.class)); },[invoices,session]);
  const filteredInvoices = useMemo(()=> invoices.filter(r=> r.session===session && (filters.class==='All'||r.class===filters.class) && (filters.status==='All'|| r.status===filters.status)),[invoices,session,filters]);

  function newInvoiceDraft(){ return { session:DEFAULT_SESSION, date:todayISO(), studentId:STUDENTS[0]?.id||'', class:STUDENTS[0]?.class||'', feeHead:FEE_HEADS[2]?.code||'TUITION_MONTHLY', baseAmount:0, gstRate:FEE_HEADS[2]?.defaultGst||0, discount:0, gateway:'Razorpay', notes:'' }; }
  function handleAddInvoice(){ const id=`INV-${Math.floor(24000+Math.random()*1000)}`; setInvoices(prev=>[{ id,status:'Unpaid', ...invoiceDraft }, ...prev]); setShowInvoiceModal(false); setInvoiceDraft(newInvoiceDraft()); }
  function markPaid(id){ setInvoices(prev=> prev.map(r=> r.id===id?{...r,status:'Paid'}:r)); alert('Marked paid (demo)'); }
  function razorpayCollect(row){ alert(`Razorpay checkout placeholder for ${row.id}`); }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
          <div className="flex items-center gap-2">
            <LedgerIcon className="w-6 h-6" />
            <h1 className="text-xl font-semibold tracking-tight">Finance & Accounting</h1>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Fees Collected" value={fmt(revenueTotals.paid)} hint="YTD" />
            <StatCard label="Receivables" value={fmt(revenueTotals.receivable)} hint="Outstanding" />
            <StatCard label="Expenses Paid" value={fmt(expenseTotals.paid)} hint="Vendors" />
            <StatCard label="Net Position" value={fmt(netPosition)} hint="Inflow - Outflow" positive={netPosition>=0} />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {Object.entries(TAGS).map(([key,meta]) => (
            <button key={key} onClick={()=>setTab(key)} className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm', tab===key ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}>{meta.icon && <meta.icon className="w-4 h-4" />} {meta.label}</button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
            <span>Session</span>
            <select value={session} onChange={e=>setSession(e.target.value)} className="rounded-md border bg-background px-2 py-1 text-xs">
              {SESSIONS.map(s=> <option key={s}>{s}</option>)}
            </select>
            <span>Cycle</span>
            <select value={selectedCycle} onChange={e=>setSelectedCycle(e.target.value)} className="rounded-md border bg-background px-2 py-1 text-xs">
              {['Monthly','Quarterly','Yearly'].map(c=> <option key={c}>{c}</option>)}
            </select>
          </div>
        </nav>
      </header>

      <main className="space-y-10">
        {tab==='overview' && (
          <section className="space-y-6">
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-base font-medium">Class-wise Collections — {session}</h2>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="px-3 py-2 text-left">Class</th>
                      <th className="px-3 py-2 text-left">Students</th>
                      <th className="px-3 py-2 text-left">Paid</th>
                      <th className="px-3 py-2 text-left">Left to Pay</th>
                      <th className="px-3 py-2 text-right">Receivable</th>
                      <th className="px-3 py-2 text-right">Collected</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {classSummary.map(row => (
                      <tr key={row.class} className="border-b last:border-none hover:bg-muted/40">
                        <td className="px-3 py-2 font-medium">{row.class}</td>
                        <td className="px-3 py-2">{row.students}</td>
                        <td className="px-3 py-2">{Math.max(0,row.students - row.due)}</td>
                        <td className="px-3 py-2"><StatusPill value={`${row.due} due`} /></td>
                        <td className="px-3 py-2 text-right">{fmt(row.receivable)}</td>
                        <td className="px-3 py-2 text-right">{fmt(row.paid)}</td>
                        <td className="px-3 py-2 text-right">
                          <button className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={()=>{ setTab('revenue'); setFilters(f=>({...f, class:row.class, status:'All'})); }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Counts consider main fee heads (Tuition/Composite/Annual). Use Revenue tab for details.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <MiniCard title="Fees Collected" value={fmt(revenueTotals.paid)} subtitle="YTD" />
              <MiniCard title="Outstanding (AR)" value={fmt(revenueTotals.receivable)} subtitle="Students with dues" />
              <MiniCard title="Recurring Bills (Next 30d)" value={fmt(sumDueNext30(expenses))} subtitle="Electricity, ISP, etc." />
            </div>
          </section>
        )}

        {tab==='revenue' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-muted-foreground">Class</label>
                <select value={filters.class} onChange={e=>setFilters(f=>({...f, class:e.target.value}))} className="rounded-md border bg-background px-3 py-2 text-sm">
                  {classes.map(c=> <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">Status</label>
                <select value={filters.status} onChange={e=>setFilters(f=>({...f, status:e.target.value}))} className="rounded-md border bg-background px-3 py-2 text-sm">
                  {['All','Paid','Partial','Unpaid'].map(s=> <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={()=>setShowInvoiceModal(true)} className="ml-auto rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">+ Create Invoice</button>
              <button onClick={()=>setShowDetails(d=>({...d, revenue:!d.revenue}))} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">{showDetails.revenue?'Hide Details':'Show Details'}</button>
            </div>
            {!showDetails.revenue && (
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">At a Glance</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniCard title="Gross Invoiced" value={fmt(revenueTotals.gross)} subtitle="Base + GST - Discount" />
                  <MiniCard title="Collected" value={fmt(revenueTotals.paid)} subtitle="Gateway/Offline" />
                  <MiniCard title="Outstanding" value={fmt(revenueTotals.receivable)} subtitle="Unpaid + Partial" />
                  <MiniCard title="Taxable Portion (est.)" value={fmt(estimateTaxable(invoices, session))} subtitle="Trips/Extras" />
                </div>
              </div>
            )}
            {showDetails.revenue && (
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Invoice</th>
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2 text-left">Class</th>
                      <th className="px-3 py-2 text-left">Fee Head</th>
                      <th className="px-3 py-2 text-right">Base</th>
                      <th className="px-3 py-2 text-right">GST%</th>
                      <th className="px-3 py-2 text-right">GST Amt</th>
                      <th className="px-3 py-2 text-right">Discount</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-left">Gateway</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(row => { const student=STUDENT_INDEX[row.studentId]||{name:'?'}; const gstAmt=Math.round(row.baseAmount*(row.gstRate/100)); const total=row.baseAmount+gstAmt-(row.discount||0); return (
                      <tr key={row.id} className="border-b last:border-none hover:bg-muted/40">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 font-medium">{row.id}</td>
                        <td className="px-3 py-2">{student.name}</td>
                        <td className="px-3 py-2">{row.class}</td>
                        <td className="px-3 py-2">{FEE_INDEX[row.feeHead]?.name || row.feeHead}</td>
                        <td className="px-3 py-2 text-right">{fmt(row.baseAmount)}</td>
                        <td className="px-3 py-2 text-right">{pct(row.gstRate)}</td>
                        <td className="px-3 py-2 text-right">{fmt(gstAmt)}</td>
                        <td className="px-3 py-2 text-right">{fmt(row.discount||0)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(total)}</td>
                        <td className="px-3 py-2">{row.gateway}</td>
                        <td className="px-3 py-2"><StatusPill value={row.status} /></td>
                        <td className="px-3 py-2"><div className="flex gap-2"> <button className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={()=>razorpayCollect(row)}>Collect</button>{row.status!=='Paid' && <button className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500" onClick={()=>markPaid(row.id)}>Mark Paid</button>} </div></td>
                      </tr> ); })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab==='expenses' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium">Vendor Expenses</h2>
                <div className="ml-2 inline-flex rounded-full border p-1 text-xs">
                  {['recurring','other'].map(k=> <button key={k} onClick={()=>setExpMode(k)} className={cn('px-2 py-1 rounded-full', expMode===k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>{k}</button>)}
                </div>
              </div>
              <button onClick={()=>addExpense(setExpenses)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">+ Add Expense</button>
            </div>
            {!showDetails.expenses && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MiniCard title="Expenses (Base)" value={fmt(expenseTotals.base)} />
                <MiniCard title="GST Input" value={fmt(expenseTotals.gst)} />
                <MiniCard title="TDS Deducted" value={fmt(expenseTotals.tds)} />
                <MiniCard title="Paid" value={fmt(expenseTotals.paid)} />
              </div>
            )}
            <div>
              <button onClick={()=>setShowDetails(d=>({...d, expenses:!d.expenses}))} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">{showDetails.expenses?'Hide Details':'Show Details'}</button>
            </div>
            {showDetails.expenses && (
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Invoice No</th>
                      <th className="px-3 py-2 text-left">Vendor</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Recurring</th>
                      <th className="px-3 py-2 text-left">Frequency</th>
                      <th className="px-3 py-2 text-right">Base</th>
                      <th className="px-3 py-2 text-right">GST%</th>
                      <th className="px-3 py-2 text-right">GST Amt</th>
                      <th className="px-3 py-2 text-right">TDS%</th>
                      <th className="px-3 py-2 text-right">Payable</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e=> expMode==='recurring'? e.recurring : !e.recurring).map(e=> { const gstAmt=Math.round(e.amount*(e.gstRate/100)); const tdsAmt=Math.round(e.amount*(e.tdsRate/100)); const payable=e.amount+gstAmt-tdsAmt; return (
                      <tr key={e.id} className="border-b last:border-none hover:bg-muted/40">
                        <td className="px-3 py-2">{e.date}</td>
                        <td className="px-3 py-2">{e.invoiceNo}</td>
                        <td className="px-3 py-2">{e.vendor}</td>
                        <td className="px-3 py-2">{e.category}</td>
                        <td className="px-3 py-2">{e.recurring?'Yes':'No'}</td>
                        <td className="px-3 py-2">{e.frequency || '-'}</td>
                        <td className="px-3 py-2 text-right">{fmt(e.amount)}</td>
                        <td className="px-3 py-2 text-right">{pct(e.gstRate)}</td>
                        <td className="px-3 py-2 text-right">{fmt(gstAmt)}</td>
                        <td className="px-3 py-2 text-right">{pct(e.tdsRate)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(payable)}</td>
                        <td className="px-3 py-2"><StatusPill value={e.paid ? 'Paid' : 'Unpaid'} /></td>
                        <td className="px-3 py-2">{e.nextDue || '-'}</td>
                      </tr> ); })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab==='salaries' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Staff Salaries</h2>
              <div className="flex items-center gap-2">
                <button onClick={()=>addSalary(setSalaries)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">+ Add Salary Row</button>
                <button onClick={()=>setShowDetails(d=>({...d, salaries:!d.salaries}))} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">{showDetails.salaries?'Hide Details':'Show Details'}</button>
              </div>
            </div>
            {!showDetails.salaries && (
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Monthly Snapshot</h3>
                {groupByMonth(salaries).map(m => <BarRow key={m.month} label={m.month} value={m.net} max={Math.max(...groupByMonth(salaries).map(x=>x.net),1)} />)}
                <div className="grid gap-4 mt-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniCard title="Gross" value={fmt(salaryTotals.gross)} />
                  <MiniCard title="Deductions" value={fmt(salaryTotals.ded)} />
                  <MiniCard title="Net" value={fmt(salaryTotals.net)} />
                  <MiniCard title="Paid" value={fmt(salaryTotals.paid)} />
                </div>
              </div>
            )}
            {showDetails.salaries && (
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-2 text-left">Month</th>
                      <th className="px-3 py-2 text-left">Staff</th>
                      <th className="px-3 py-2 text-left">Dept</th>
                      <th className="px-3 py-2 text-right">Gross</th>
                      <th className="px-3 py-2 text-right">Deductions</th>
                      <th className="px-3 py-2 text-right">Net</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map(s=> { const ded=(s.pf||0)+(s.esi||0)+(s.tds||0); const net=s.gross-ded; return (
                      <tr key={s.id} className="border-b last:border-none hover:bg-muted/40">
                        <td className="px-3 py-2">{s.month}</td>
                        <td className="px-3 py-2">{s.staff}</td>
                        <td className="px-3 py-2">{s.dept}</td>
                        <td className="px-3 py-2 text-right">{fmt(s.gross)}</td>
                        <td className="px-3 py-2 text-right">{fmt(ded)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(net)}</td>
                        <td className="px-3 py-2"><StatusPill value={s.status} /></td>
                      </tr> ); })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab==='reports' && (
          <section className="space-y-6">
            <h2 className="text-base font-medium">Summary & Compliance (India)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Cashflow Snapshot</h3>
                <BarRow label="Fees Collected" value={revenueTotals.paid} max={Math.max(revenueTotals.paid, expenseTotals.paid + salaryTotals.paid,1)} />
                <BarRow label="Expenses Paid" value={expenseTotals.paid} max={Math.max(revenueTotals.paid, expenseTotals.paid + salaryTotals.paid,1)} />
                <BarRow label="Salaries Paid" value={salaryTotals.paid} max={Math.max(revenueTotals.paid, expenseTotals.paid + salaryTotals.paid,1)} />
                <div className="mt-3 text-sm">Net Position: <span className={cn('font-semibold', netPosition>=0 ? 'text-emerald-600':'text-red-600')}>{fmt(netPosition)}</span></div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">GST (Output vs Input)</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Output GST (Taxable revenue)</span><span>{fmt(sumGstOut(invoices, session))}</span></div>
                  <div className="flex justify-between"><span>Input GST (Expenses)</span><span>{fmt(expenseTotals.gst)}</span></div>
                  <div className="flex justify-between"><span>Net GST Payable</span><span className="font-semibold">{fmt(Math.max(sumGstOut(invoices, session) - expenseTotals.gst,0))}</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={()=>alert('Export GSTR-1 (demo)')} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Export GSTR-1</button>
                  <button onClick={()=>alert('Export GSTR-3B (demo)')} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Export GSTR-3B</button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Core school fees are generally GST-exempt; confirm with your CA.</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-3">Balance Sheet (Lite)</h3>
              <div className="grid gap-6 md:grid-cols-2 text-sm">
                <div>
                  <h4 className="text-muted-foreground mb-1">Assets</h4>
                  <LineItem k="Cash/Bank (approx)" v={fmt(revenueTotals.paid - (expenseTotals.paid + salaryTotals.paid))} />
                  <LineItem k="Accounts Receivable" v={fmt(revenueTotals.receivable)} />
                </div>
                <div>
                  <h4 className="text-muted-foreground mb-1">Liabilities</h4>
                  <LineItem k="Accounts Payable (Vendors Unpaid)" v={fmt(expenseTotals.unpaid)} />
                  <LineItem k="Payroll Due (Net Unpaid)" v={fmt(salaryTotals.unpaid)} />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Operational snapshot. For statutory filings, export ledgers & reconcile.</p>
            </div>
          </section>
        )}

        {tab==='settings' && (
          <section className="space-y-6">
            <h2 className="text-base font-medium">Configuration</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">School Session & Invoice</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Active Session" value={session} onChange={v=>setSession(v)} />
                  <Field label="Invoice Prefix" placeholder="INV-" />
                  <Field label="FY Start Month" placeholder="April" />
                  <Field label="Address (for invoice)" placeholder="School address" colSpan={2} />
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Fee Heads & Cycles</h3>
                <div className="space-y-2 text-sm">
                  {FEE_HEADS.map(h=> (
                    <div key={h.code} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{h.name}</div>
                        <div className="text-xs text-muted-foreground">Code: {h.code} • Cycle: {h.cycle}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">GST</span>
                        <input type="number" min={0} max={28} defaultValue={h.defaultGst} onChange={e=>{ h.defaultGst=Number(e.target.value); setInvoiceDraft(d=>({...d})); }} className="w-20 rounded-md border bg-background px-2 py-1 text-xs" />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Payment Gateway (Razorpay)</h3>
                <div className="space-y-2 text-sm">
                  <Field label="Key ID" placeholder="rzp_test_xxxxx" />
                  <Field label="Key Secret" placeholder="••••••••" type="password" />
                  <button onClick={()=>alert('Test connection (demo)')} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Test Connection</button>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Compliance Flags</h3>
                <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  <li>Auto-calc GST only for taxable heads.</li>
                  <li>TDS tracked at line level for applicable vendors.</li>
                  <li>Lock month-end after reconciliation with audit trail.</li>
                  <li>Export GSTR-1/3B JSON + Tally CSV.</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={()=>setShowInvoiceModal(false)}>
          <div className="w-full max-w-xl rounded-lg border bg-card p-4" onClick={e=>e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-medium">Create Invoice</h3><button onClick={()=>setShowInvoiceModal(false)} className="rounded-md border px-2 py-1 text-xs">Close</button></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground">Student</label>
                <select value={invoiceDraft.studentId} onChange={e=>{ const id=e.target.value; const s=STUDENTS.find(x=>x.id===id); setInvoiceDraft(d=>({...d, studentId:id, class:s?.class||'' })); }} className="w-full rounded-md border bg-background px-3 py-2">
                  {STUDENTS.map(s=> <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">Fee Head</label>
                <select value={invoiceDraft.feeHead} onChange={e=>{ const code=e.target.value; const gh=FEE_HEADS.find(f=>f.code===code); setInvoiceDraft(d=>({...d, feeHead:code, gstRate: gh?.defaultGst||0 })); }} className="w-full rounded-md border bg-background px-3 py-2">
                  {FEE_HEADS.map(f=> <option key={f.code} value={f.code}>{f.name}</option>)}
                </select>
              </div>
              <Field label="Date" value={invoiceDraft.date} onChange={v=>setInvoiceDraft(d=>({...d, date:v}))} type="date" />
              <Field label="Base Amount (₹)" value={invoiceDraft.baseAmount} onChange={v=>setInvoiceDraft(d=>({...d, baseAmount:Number(v)}))} type="number" />
              <Field label="GST %" value={invoiceDraft.gstRate} onChange={v=>setInvoiceDraft(d=>({...d, gstRate:Number(v)}))} type="number" />
              <Field label="Discount (₹)" value={invoiceDraft.discount} onChange={v=>setInvoiceDraft(d=>({...d, discount:Number(v)}))} type="number" />
              <div className="col-span-2"><Field label="Notes" value={invoiceDraft.notes} onChange={v=>setInvoiceDraft(d=>({...d, notes:v}))} placeholder="e.g., Q1 Early bird" /></div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={()=>setShowInvoiceModal(false)} className="rounded-md border px-3 py-2 text-sm">Cancel</button>
              <button onClick={handleAddInvoice} className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500">Add Invoice</button>
            </div>
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Preview build. Wire APIs (fees, payments, vendors, payroll), integrate Razorpay Orders, exports (GST/TDS).</p>
    </div>
  );
}

function StatCard({ label,value,hint,positive }){ return <div className="rounded-lg border p-3"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className={cn('mt-1 text-lg font-semibold', positive===true ? 'text-emerald-600':undefined)}>{value}</div>{hint && <div className="text-[11px] text-muted-foreground/70">{hint}</div>}</div>; }
function MiniCard({ title,value,subtitle }){ return <div className="rounded-lg border p-4"><div className="text-sm text-muted-foreground">{title}</div><div className="text-lg font-semibold">{value}</div>{subtitle && <div className="text-xs text-muted-foreground/70">{subtitle}</div>}</div>; }
function StatusPill({ value }){ const color=String(value).toLowerCase().includes('paid')?'bg-emerald-100 text-emerald-700 border-emerald-300':String(value).toLowerCase().includes('due')?'bg-amber-100 text-amber-700 border-amber-300':String(value).toLowerCase().includes('unpaid')?'bg-red-100 text-red-700 border-red-300':'bg-muted text-foreground border-border'; return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', color)}>{value}</span>; }
function Field({ label,value,onChange,placeholder,type='text',colSpan }){ return <label className={cn('block', colSpan===2 ? 'col-span-2':'')}><span className="block text-xs text-muted-foreground">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={e=>onChange?.(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>; }
function LineItem({ k,v }){ return <div className="flex items-center justify-between border-b py-1 text-sm"><span>{k}</span><span className="font-medium">{v}</span></div>; }
function BarRow({ label,value,max }){ const pctW=Math.max(3, Math.round((value/(max||1))*100)); return <div className="mb-2"><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{fmt(value)}</span></div><div className="h-2 w-full rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: pctW + '%' }} /></div></div>; }

// Utils / calculations
function sumDueNext30(list){ const now=new Date(); const in30=new Date(now.getTime()+30*24*3600*1000); let total=0; for(const e of list){ if(e.recurring && e.nextDue){ const d=new Date(e.nextDue); if(d>=now && d<=in30) total+=e.amount; } } return total; }
function estimateTaxable(invoices, session){ let base=0,gst=0; for(const r of invoices){ if(r.session===session && r.gstRate>0){ base+=r.baseAmount; gst+=Math.round(r.baseAmount*(r.gstRate/100)); } } return base+gst; }
function sumGstOut(invoices, session){ let gst=0; for(const r of invoices){ if(r.session===session) gst+=Math.round(r.baseAmount*(r.gstRate/100)); } return gst; }
function groupByMonth(rows){ const map=new Map(); for(const r of rows){ const m=ym(r.month+'-01'); const ded=(r.pf||0)+(r.esi||0)+(r.tds||0); const net=r.gross-ded; const x=map.get(m)||{ month:m, net:0 }; x.net+=net; map.set(m,x); } return Array.from(map.values()).sort((a,b)=>a.month.localeCompare(b.month)); }

// Icon components
function LedgerIcon(props){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 3v18M3 8h18" /></svg>; }
function RevenueIcon(props){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /><path d="M14 7h7v7" /></svg>; }
function ExpenseIcon(props){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7l-6 6-4-4-7 7" /><path d="M10 7H3v7" /></svg>; }
function SalaryIcon(props){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 7v10M17 7v10M3 12h18" /></svg>; }
function ReportIcon(props){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M16 4v4h4" /><path d="M8 13h8M8 17h5M8 9h3" /></svg>; }
function GearIcon(props){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.07a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.07a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.07a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.07a1.65 1.65 0 0 0-1.51 1z" /></svg>; }

function addExpense(setter){ const id=`EXP-${Math.floor(3000+Math.random()*1000)}`; const row={ id,date:todayISO(), vendorId:'V-05', vendor:'New Vendor', category:'Misc', amount:10000, gstRate:18, tdsRate:0, paid:false, invoiceNo:`V-${Math.floor(Math.random()*9999)}`, recurring:false }; setter(prev=>[row,...prev]); }
function addSalary(setter){ const id=`SAL-${Math.floor(7000+Math.random()*1000)}`; const row={ id, month:new Date().toISOString().slice(0,7), staff:'New Staff', dept:'Admin', gross:45000, pf:1500, esi:0, tds:0, status:'Unpaid' }; setter(prev=>[row,...prev]); }
