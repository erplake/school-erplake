// Full Featured Library Page (multi-tab) with RBAC gating applied
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRBAC } from '../../context/RBACContext';

// ---------------- UI Primitives ----------------
const Button = ({ children, className = '', disabled, ...p }) => (
  <button
    disabled={disabled}
    className={'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 shadow-sm text-sm ' + className}
    {...p}
  >
    {children}
  </button>
);

const PrimaryButton = ({ children, className = '', disabled, ...p }) => (
  <button
    disabled={disabled}
    className={'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm text-sm ' + className}
    {...p}
  >
    {children}
  </button>
);

const DangerButton = ({ children, className = '', disabled, ...p }) => (
  <button
    disabled={disabled}
    className={'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm text-sm ' + className}
    {...p}
  >
    {children}
  </button>
);

const Input = ({ className = '', ...p }) => (
  <input
    className={'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + className}
    {...p}
  />
);

const Select = ({ className = '', children, ...p }) => (
  <select
    className={'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + className}
    {...p}
  >
    {children}
  </select>
);

const Badge = ({ children, color = 'gray' }) => {
  const map = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={'px-2 py-1 rounded-full text-xs ' + (map[color] || map.gray)}>{children}</span>
  );
};

const Modal = ({ open, onClose, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[85vh] w-[min(780px,92vw)] overflow-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button onClick={onClose} aria-label="Close">✕</Button>
        </div>
        <div className="space-y-4">{children}</div>
        {actions && <div className="mt-6 flex items-center justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
};

const Drawer = ({ open, onClose, title, children }) => (
  <div className={'fixed inset-0 z-40 ' + (open ? '' : 'pointer-events-none')}>
    <div
      className={'absolute inset-0 bg-black/20 transition-opacity ' + (open ? 'opacity-100' : 'opacity-0')}
      onClick={onClose}
    />
    <div
      className={'absolute right-0 top-0 h-full w-[min(520px,95vw)] bg-white shadow-2xl transition-transform duration-300 ' + (open ? 'translate-x-0' : 'translate-x-full')}
    >
      <div className="p-5 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={onClose}>Close</Button>
      </div>
      <div className="p-5 overflow-y-auto h-[calc(100%-64px)]">{children}</div>
    </div>
  </div>
);

const Toast = ({ toasts, remove }) => (
  <div className="fixed bottom-4 right-4 z-[60] space-y-2">
    {toasts.map(t => (
      <div
        key={t.id}
        className={'rounded-lg px-4 py-3 shadow-md text-sm text-white ' + (t.type === 'error' ? 'bg-red-600' : t.type === 'warn' ? 'bg-yellow-600' : 'bg-green-600')}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{t.type === 'error' ? '⚠️' : t.type === 'warn' ? '⚠️' : '✅'}</div>
          <div className="flex-1">
            <div className="font-medium">{t.title}</div>
            {t.msg && <div className="opacity-90">{t.msg}</div>}
          </div>
          <button className="opacity-75 hover:opacity-100" onClick={() => remove(t.id)}>✕</button>
        </div>
      </div>
    ))}
  </div>
);

// ---------------- Sample Data ----------------
const CATEGORIES = ['All','Fiction','Non-Fiction','Reference','Science','Mathematics','Computers','Languages','History','Geography','Comics','Magazines','E-Books'];
const FORMATS = ['Hardcover','Paperback','E-Book','Magazine'];
const LANGS = ['English','Hindi','French','German','Sanskrit'];
const SAMPLE_BOOKS = [
  { id:'B001', isbn:'9780140449136', title:'The Odyssey', author:'Homer', category:'Fiction', format:'Paperback', language:'English', copiesTotal:6, copiesAvailable:3, tags:['Classic','Epic'], price:399, vendor:'BookHub', addedAt:'2025-04-10' },
  { id:'B002', isbn:'9780262046305', title:'Introduction to Algorithms', author:'Cormen, Leiserson, Rivest, Stein', category:'Computers', format:'Hardcover', language:'English', copiesTotal:4, copiesAvailable:1, tags:['Algorithm','CS'], price:12999, vendor:'MIT Press', addedAt:'2025-02-01' },
  { id:'B003', isbn:'9789388704377', title:'NCERT Physics XI', author:'NCERT', category:'Science', format:'Paperback', language:'English', copiesTotal:12, copiesAvailable:8, tags:['CBSE','Textbook'], price:250, vendor:'NCERT', addedAt:'2024-08-21' }
];
const SAMPLE_MEMBERS = [
  { id:'S101', name:'Aarav Gupta', role:'Student', classSection:'VI-B', roll:12, fines:0 },
  { id:'S102', name:'Ananya Singh', role:'Student', classSection:'X-A', roll:5, fines:50 },
  { id:'T201', name:'Mr. Verma', role:'Teacher', classSection:'-', roll:'-', fines:0 }
];
const SAMPLE_VENDORS = [
  { id:'V1', name:'BookHub', contact:'+91 98xxxxxx01', email:'sales@bookhub.example', status:'Active' },
  { id:'V2', name:'MIT Press', contact:'+1 (617) xxx-xxxx', email:'orders@mitpress.example', status:'Active' }
];
const SAMPLE_SUBSCRIPTIONS = [
  { id:'SUB1', title:'National Geographic', period:'Monthly', nextRenewal:'2025-05-01', copies:3 }
];

// Helpers
const uid = () => Math.random().toString(36).slice(2, 10);
const formatDate = d => { try { return new Date(d).toLocaleDateString(); } catch { return d; } };

export default function Library() {
  const { hasCapability } = useRBAC();
  const canView = hasCapability('library.view');
  const canManage = hasCapability('library.manage');

  // State
  const [tab, setTab] = useState('Catalog');
  const [books, setBooks] = useState(SAMPLE_BOOKS);
  const [members] = useState(SAMPLE_MEMBERS);
  const [vendors] = useState(SAMPLE_VENDORS);
  const [subs] = useState(SAMPLE_SUBSCRIPTIONS);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [fmt, setFmt] = useState('All');
  const [lang, setLang] = useState('All');
  const [avail, setAvail] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [view, setView] = useState('grid');
  const [detailBook, setDetailBook] = useState(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [actBook, setActBook] = useState(null);
  const [issueMember, setIssueMember] = useState('');
  const [issueDue, setIssueDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [bookForm, setBookForm] = useState({
    id: '',
    isbn: '',
    title: '',
    author: '',
    category: 'Fiction',
    format: 'Paperback',
    language: 'English',
    copiesTotal: 1,
    copiesAvailable: 1,
    tags: '',
    price: 0,
    vendor: '',
    addedAt: new Date().toISOString().slice(0, 10)
  });
  const [toasts, setToasts] = useState([]);
  const pushToast = t => {
    const id = uid();
    setToasts(x => [...x, { id, ...t }]);
    setTimeout(() => removeToast(id), 3000);
  };
  const removeToast = id => setToasts(x => x.filter(t => t.id !== id));

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Library</h1>
        <div className="border rounded-md bg-white p-6 text-sm text-slate-600">You do not have permission to view the library module.</div>
      </div>
    );
  }

  // Derived
  const filteredBooks = useMemo(() => {
    let out = [...books];
    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter(
        b =>
          b.title.toLowerCase().includes(qq) ||
          b.author.toLowerCase().includes(qq) ||
          b.isbn.toLowerCase().includes(qq) ||
          (b.tags || []).join(' ').toLowerCase().includes(qq)
      );
    }
    if (cat !== 'All') out = out.filter(b => b.category === cat);
    if (fmt !== 'All') out = out.filter(b => b.format === fmt);
    if (lang !== 'All') out = out.filter(b => b.language === lang);
    if (avail !== 'All') {
      if (avail === 'Available') out = out.filter(b => b.copiesAvailable > 0);
      if (avail === 'Checked-out') out = out.filter(b => b.copiesAvailable === 0);
    }
    if (sortBy === 'recent') out.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    if (sortBy === 'title') out.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'author') out.sort((a, b) => a.author.localeCompare(b.author));
    if (sortBy === 'availability') out.sort((a, b) => b.copiesAvailable - a.copiesAvailable);
    return out;
  }, [books, q, cat, fmt, lang, avail, sortBy]);

  const [page, setPage] = useState(1);
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  useEffect(() => setPage(1), [q, cat, fmt, lang, avail]);
  const pageItems = useMemo(
    () => filteredBooks.slice((page - 1) * pageSize, page * pageSize),
    [filteredBooks, page]
  );

  const scanRef = useRef(null);
  const [scanInput, setScanInput] = useState('');
  const handleScanEnter = e => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const byIsbn = books.find(b => b.isbn.toLowerCase() === scanInput.trim().toLowerCase());
      if (byIsbn) {
        setActBook(byIsbn);
        setIssueOpen(true);
        pushToast({ type: 'success', title: 'Book detected', msg: byIsbn.title });
      } else {
        pushToast({ type: 'warn', title: 'No match', msg: scanInput.trim() });
      }
      setScanInput('');
    }
  };

  const stats = useMemo(() => {
    const total = books.reduce((a, b) => a + b.copiesTotal, 0);
    const available = books.reduce((a, b) => a + b.copiesAvailable, 0);
    const overdue = loans.filter(l => !l.returnedOn && new Date(l.dueOn) < new Date()).length;
    return { total, available, issued: total - available, overdue };
  }, [books, loans]);

  // Actions (mutating)
  const openIssue = book => { if (!canManage) return; setActBook(book); setIssueOpen(true); };
  const doIssue = () => {
    if (!canManage || !actBook || !issueMember) return;
    const member = members.find(m => m.id === issueMember);
    if (!member) return pushToast({ type: 'error', title: 'Member not found' });
    if (actBook.copiesAvailable <= 0) return pushToast({ type: 'error', title: 'No copies' });
    const nl = { id: uid(), bookId: actBook.id, memberId: member.id, issuedOn: new Date().toISOString().slice(0, 10), dueOn: issueDue };
    setLoans(x => [nl, ...x]);
    setBooks(x => x.map(b => b.id === actBook.id ? { ...b, copiesAvailable: b.copiesAvailable - 1 } : b));
    setIssueOpen(false);
    pushToast({ type: 'success', title: 'Issued', msg: actBook.title });
  };
  const doReturn = loanId => {
    if (!canManage) return;
    setLoans(x => x.map(l => l.id === loanId ? { ...l, returnedOn: new Date().toISOString().slice(0, 10) } : l));
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      setBooks(x => x.map(b => b.id === loan.bookId ? { ...b, copiesAvailable: b.copiesAvailable + 1 } : b));
      pushToast({ type: 'success', title: 'Returned' });
    }
  };
  const openReserve = book => { if (!canManage) return; setActBook(book); setReserveOpen(true); };
  const doReserve = memberId => {
    if (!canManage) return;
    const m = members.find(mm => mm.id === memberId);
    if (!actBook || !m) return;
    const entry = { id: uid(), bookId: actBook.id, memberId: m.id, date: new Date().toISOString().slice(0, 10), status: 'Queued' };
    setReservations(x => [entry, ...x]);
    setReserveOpen(false);
    pushToast({ type: 'success', title: 'Reserved', msg: actBook.title });
  };
  const startAddBook = () => {
    if (!canManage) return;
    setBookForm({
      id: '', isbn: '', title: '', author: '', category: 'Fiction', format: 'Paperback', language: 'English', copiesTotal: 1, copiesAvailable: 1, tags: '', price: 0, vendor: '', addedAt: new Date().toISOString().slice(0, 10)
    });
    setAddOpen(true);
  };
  const saveBook = () => {
    if (!canManage) return;
    if (!bookForm.title || !bookForm.isbn) return pushToast({ type: 'error', title: 'Title & ISBN required' });
    const normalize = f => ({
      ...f,
      tags: typeof f.tags === 'string' ? f.tags.split(',').map(s => s.trim()).filter(Boolean) : f.tags,
      copiesTotal: Number(f.copiesTotal) || 0,
      copiesAvailable: Number(f.copiesAvailable) || 0,
      price: Number(f.price) || 0
    });
    if (bookForm.id) {
      setBooks(x => x.map(b => b.id === bookForm.id ? normalize(bookForm) : b));
      pushToast({ type: 'success', title: 'Book updated' });
    } else {
      const id = 'B' + Math.floor(1000 + Math.random() * 9000);
      const nb = normalize({ ...bookForm, id });
      setBooks(x => [nb, ...x]);
      pushToast({ type: 'success', title: 'Book added' });
    }
    setAddOpen(false);
  };
  const editBook = b => { if (!canManage) return; setBookForm({ ...b, tags: (b.tags || []).join(', ') }); setAddOpen(true); };
  const deleteBook = id => { if (!canManage) return; setBooks(x => x.filter(b => b.id !== id)); setDetailBook(null); pushToast({ type: 'success', title: 'Book removed' }); };

  // Subcomponents
  const Header = () => (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white grid place-items-center text-sm font-bold">LIB</div>
            <div>
              <div className="text-lg font-semibold leading-tight">School Library</div>
              <div className="text-xs text-gray-500">Catalog • Circulation • Members • Reports</div>
            </div>
          </div>
          <div className="flex-1 min-w-[240px] max-w-[520px]">
            <Input
              placeholder="Search by title, author, ISBN, tag…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {canManage && <Button onClick={startAddBook}>➕ Add Book</Button>}
            {canManage && <Button onClick={() => pushToast({ type: 'success', title: 'CSV template' })}>📥 CSV Template</Button>}
            {canManage && <Button onClick={() => pushToast({ type: 'success', title: 'Import started' })}>⬆️ Bulk Import (CSV)</Button>}
            <PrimaryButton onClick={() => scanRef.current?.focus()} disabled={!canManage}>📷 Scan</PrimaryButton>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2">
          <Select value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={fmt} onChange={e => setFmt(e.target.value)}>
            {['All', ...FORMATS].map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
            <Select value={lang} onChange={e => setLang(e.target.value)}>
            {['All', ...LANGS].map(l => <option key={l} value={l}>{l}</option>)}
          </Select>
          <Select value={avail} onChange={e => setAvail(e.target.value)}>
            {['All','Available','Checked-out'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="recent">Sort: Recent</option>
            <option value="title">Sort: Title</option>
            <option value="author">Sort: Author</option>
            <option value="availability">Sort: Availability</option>
          </Select>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setView('grid')} className={view === 'grid' ? 'ring-2 ring-blue-500' : ''}>🔳 Grid</Button>
            <Button onClick={() => setView('list')} className={view === 'list' ? 'ring-2 ring-blue-500' : ''}>📃 List</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const Tabs = () => (
    <div className="mx-auto max-w-7xl px-4 mt-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {'Dashboard Catalog Circulation Reservations Members Vendors Reports Settings'.split(' ').map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={'px-3 py-2 rounded-lg border ' + (tab === t ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300')}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  const CatalogGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pageItems.map(b => (
        <div key={b.id} className="rounded-2xl border p-4 bg-white shadow-sm flex flex-col">
          <div className="flex gap-3">
            <div className="w-16 h-24 rounded-md bg-gray-100 grid place-items-center text-xs text-gray-500">📚</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate" title={b.title}>{b.title}</div>
              <div className="text-sm text-gray-600 truncate">{b.author}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge color="blue">{b.category}</Badge>
                <Badge>{b.format}</Badge>
                <Badge color={b.copiesAvailable ? 'green' : 'red'}>{b.copiesAvailable} / {b.copiesTotal}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">ISBN: {b.isbn} • Lang: {b.language}</div>
          <div className="mt-3 flex items-center gap-2">
            {canManage && <PrimaryButton onClick={() => openIssue(b)} disabled={!b.copiesAvailable}>📗 Issue</PrimaryButton>}
            {canManage && <Button onClick={() => openReserve(b)}>🔖 Reserve</Button>}
            <Button onClick={() => setDetailBook(b)}>ℹ️ Details</Button>
            {canManage && <Button onClick={() => editBook(b)}>✏️ Edit</Button>}
          </div>
        </div>
      ))}
    </div>
  );

  const CatalogList = () => (
    <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Title</th>
            <th className="text-left p-3">Author</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Format</th>
            <th className="text-left p-3">Lang</th>
            <th className="text-left p-3">ISBN</th>
            <th className="text-left p-3">Avail</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map(b => (
            <tr key={b.id} className="border-t">
              <td className="p-3 font-medium">{b.title}</td>
              <td className="p-3">{b.author}</td>
              <td className="p-3">{b.category}</td>
              <td className="p-3">{b.format}</td>
              <td className="p-3">{b.language}</td>
              <td className="p-3">{b.isbn}</td>
              <td className="p-3"><Badge color={b.copiesAvailable ? 'green' : 'red'}>{b.copiesAvailable}/{b.copiesTotal}</Badge></td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  {canManage && <PrimaryButton onClick={() => openIssue(b)} disabled={!b.copiesAvailable}>Issue</PrimaryButton>}
                  {canManage && <Button onClick={() => openReserve(b)}>Reserve</Button>}
                  <Button onClick={() => setDetailBook(b)}>Details</Button>
                  {canManage && <Button onClick={() => editBook(b)}>Edit</Button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredBooks.length)} of {filteredBooks.length}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
        <div className="text-sm">Page {page} / {pageCount}</div>
        <Button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</Button>
      </div>
    </div>
  );

  const CirculationTab = () => {
    const active = loans.filter(l => !l.returnedOn);
    const overdue = active.filter(l => new Date(l.dueOn) < new Date());
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-semibold mb-3">Quick Issue</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Scan/enter ISBN"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleScanEnter}
                disabled={!canManage}
              />
              <Select value={issueMember} onChange={e => setIssueMember(e.target.value)} disabled={!canManage}>
                <option value="">Member…</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
              <Input type="date" value={issueDue} onChange={e => setIssueDue(e.target.value)} disabled={!canManage} />
              <PrimaryButton onClick={() => { if (actBook) doIssue(); }} disabled={!canManage || !issueMember || !actBook}>Issue</PrimaryButton>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-semibold mb-3">Active Loans</div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Book</th>
                    <th className="text-left p-2">Member</th>
                    <th className="text-left p-2">Issued</th>
                    <th className="text-left p-2">Due</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(l => (
                    <tr key={l.id} className="border-t">
                      <td className="p-2">{books.find(b => b.id === l.bookId)?.title || l.bookId}</td>
                      <td className="p-2">{members.find(m => m.id === l.memberId)?.name || l.memberId}</td>
                      <td className="p-2">{formatDate(l.issuedOn)}</td>
                      <td className="p-2">{formatDate(l.dueOn)}</td>
                      <td className="p-2">{new Date(l.dueOn) < new Date() ? <Badge color="red">Overdue</Badge> : <Badge color="green">On time</Badge>}</td>
                      <td className="p-2">{canManage && <PrimaryButton onClick={() => doReturn(l.id)}>Return</PrimaryButton>}</td>
                    </tr>
                  ))}
                  {active.length === 0 && <tr><td className="p-4 text-center text-gray-500" colSpan={6}>No active loans.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-semibold mb-3">Overdue</div>
            {overdue.length === 0 ? (
              <div className="text-sm text-gray-600">None.</div>
            ) : (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {overdue.map(l => {
                  const b = books.find(bb => bb.id === l.bookId);
                  const m = members.find(mm => mm.id === l.memberId);
                  return <li key={l.id}>{b?.title} — {m?.name}</li>;
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MembersTab = () => {
    const activeLoans = id => loans.filter(l => l.memberId === id && !l.returnedOn).length;
    return (
      <div className="overflow-auto rounded-2xl border bg-white shadow-sm p-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Class</th>
              <th className="text-left p-2">Roll</th>
              <th className="text-left p-2">Active Loans</th>
              <th className="text-left p-2">Fines</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-2 font-medium">{m.name}</td>
                <td className="p-2">{m.role}</td>
                <td className="p-2">{m.classSection}</td>
                <td className="p-2">{m.roll}</td>
                <td className="p-2">{activeLoans(m.id)}</td>
                <td className="p-2">₹{m.fines}</td>
                <td className="p-2 flex gap-2">
                  {canManage && <Button onClick={() => pushToast({ type: 'success', title: 'Reminder queued', msg: m.name })}>Reminder</Button>}
                  {canManage && <Button onClick={() => pushToast({ type: 'success', title: 'Statement exported' })}>Statement</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const VendorsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-semibold mb-3">Vendors</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Vendor</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="p-2 font-medium">{v.name}</td>
                  <td className="p-2">{v.contact}</td>
                  <td className="p-2">{v.email}</td>
                  <td className="p-2"><Badge color={v.status === 'Active' ? 'green' : 'yellow'}>{v.status}</Badge></td>
                  <td className="p-2">{canManage && <Button onClick={() => pushToast({ type: 'success', title: 'PO created', msg: v.name })}>Create PO</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-semibold mb-3">Subscriptions</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Period</th>
                <th className="text-left p-2">Next Renewal</th>
                <th className="text-left p-2">Copies</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="p-2 font-medium">{s.title}</td>
                  <td className="p-2">{s.period}</td>
                  <td className="p-2">{formatDate(s.nextRenewal)}</td>
                  <td className="p-2">{s.copies}</td>
                  <td className="p-2">{canManage && <Button onClick={() => pushToast({ type: 'success', title: 'Renewal started', msg: s.title })}>Renew</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ReportsTab = () => {
    const byCat = {};
    books.forEach(b => { byCat[b.category] = (byCat[b.category] || 0) + b.copiesTotal; });
    const catEntries = Object.entries(byCat);
    const maxVal = Math.max(1, ...catEntries.map(([, v]) => v));
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs text-gray-500">Total Copies</div><div className="text-2xl font-semibold">{stats.total}</div></div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs text-gray-500">Issued</div><div className="text-2xl font-semibold">{stats.total - stats.available}</div></div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs text-gray-500">Available</div><div className="text-2xl font-semibold">{stats.available}</div></div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs text-gray-500">Overdue</div><div className="text-2xl font-semibold">{stats.overdue}</div></div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold mb-3">Copies by Category</div>
          <div className="space-y-2">
            {catEntries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <div className="w-32 text-sm">{k}</div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${(v / maxVal) * 100}%` }} />
                </div>
                <div className="w-10 text-sm text-right">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <Tabs />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {tab === 'Catalog' && (
          <>
            <div>{view === 'grid' ? <CatalogGrid /> : <CatalogList />}</div>
            <Pagination />
          </>
        )}
        {tab === 'Circulation' && <CirculationTab />}
        {tab === 'Members' && <MembersTab />}
        {tab === 'Vendors' && <VendorsTab />}
        {tab === 'Reports' && <ReportsTab />}
      </main>
      <Drawer
        open={!!detailBook}
        onClose={() => setDetailBook(null)}
        title={detailBook?.title || 'Details'}
      >
        {detailBook && (
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-16 h-24 rounded-md bg-gray-100 grid place-items-center text-xs text-gray-500">📚</div>
              <div className="flex-1">
                <div className="text-base font-semibold">{detailBook.title}</div>
                <div className="text-gray-600">{detailBook.author}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge color="blue">{detailBook.category}</Badge>
                  <Badge>{detailBook.format}</Badge>
                  <Badge color={detailBook.copiesAvailable ? 'green' : 'red'}>{detailBook.copiesAvailable}/{detailBook.copiesTotal}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-gray-500">ISBN</div>
                <div className="font-medium">{detailBook.isbn}</div>
              </div>
              <div>
                <div className="text-gray-500">Language</div>
                <div className="font-medium">{detailBook.language}</div>
              </div>
              <div>
                <div className="text-gray-500">Vendor</div>
                <div className="font-medium">{detailBook.vendor || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Added</div>
                <div className="font-medium">{formatDate(detailBook.addedAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManage && <PrimaryButton onClick={() => openIssue(detailBook)} disabled={!detailBook.copiesAvailable}>Issue</PrimaryButton>}
              {canManage && <Button onClick={() => openReserve(detailBook)}>Reserve</Button>}
              <Button onClick={() => setDetailBook(null)}>Close</Button>
              {canManage && <Button onClick={() => editBook(detailBook)}>Edit</Button>}
              {canManage && <DangerButton onClick={() => deleteBook(detailBook.id)}>Delete</DangerButton>}
            </div>
          </div>
        )}
      </Drawer>
      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title={actBook ? `Issue: ${actBook.title}` : 'Issue Book'}
        actions={
          <>
            <Button onClick={() => setIssueOpen(false)}>Cancel</Button>
            {canManage && <PrimaryButton onClick={doIssue} disabled={!issueMember || !issueDue}>Issue</PrimaryButton>}
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500 mb-1">Member</div>
            <Select value={issueMember} onChange={e => setIssueMember(e.target.value)} disabled={!canManage}>
              <option value="">Select member…</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Due date</div>
            <Input type="date" value={issueDue} onChange={e => setIssueDue(e.target.value)} disabled={!canManage} />
          </div>
        </div>
        <div className="text-xs text-gray-500">Loan rules & fines would live in Settings.</div>
      </Modal>
      <Modal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        title={actBook ? `Reserve: ${actBook.title}` : 'Reserve Book'}
        actions={<Button onClick={() => setReserveOpen(false)}>Close</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map(m => (
            <Button key={m.id} onClick={() => doReserve(m.id)} disabled={!canManage}>{m.name} — {m.role}</Button>
          ))}
        </div>
        <div className="text-xs text-gray-500">Pick a member to add to queue.</div>
      </Modal>
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={bookForm.id ? 'Edit Book' : 'Add Book'}
        actions={
          <>
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            {canManage && <PrimaryButton onClick={saveBook}>{bookForm.id ? 'Save' : 'Add'}</PrimaryButton>}
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">Title
            <Input value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">ISBN
            <Input value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">Author
            <Input value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">Vendor
            <Input value={bookForm.vendor} onChange={e => setBookForm({ ...bookForm, vendor: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">Category
            <Select value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} disabled={!canManage}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </Select>
          </label>
          <label className="text-sm">Format
            <Select value={bookForm.format} onChange={e => setBookForm({ ...bookForm, format: e.target.value })} disabled={!canManage}>
              {FORMATS.map(f => <option key={f}>{f}</option>)}
            </Select>
          </label>
          <label className="text-sm">Language
            <Select value={bookForm.language} onChange={e => setBookForm({ ...bookForm, language: e.target.value })} disabled={!canManage}>
              {LANGS.map(l => <option key={l}>{l}</option>)}
            </Select>
          </label>
          <label className="text-sm">Copies Total
            <Input type="number" value={bookForm.copiesTotal} onChange={e => setBookForm({ ...bookForm, copiesTotal: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">Copies Available
            <Input type="number" value={bookForm.copiesAvailable} onChange={e => setBookForm({ ...bookForm, copiesAvailable: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm md:col-span-2">Tags
            <Input value={bookForm.tags} onChange={e => setBookForm({ ...bookForm, tags: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">Price
            <Input type="number" value={bookForm.price} onChange={e => setBookForm({ ...bookForm, price: e.target.value })} disabled={!canManage} />
          </label>
          <label className="text-sm">Added
            <Input type="date" value={bookForm.addedAt} onChange={e => setBookForm({ ...bookForm, addedAt: e.target.value })} disabled={!canManage} />
          </label>
        </div>
      </Modal>
      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}

