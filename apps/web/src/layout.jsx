import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon, SunIcon, MoonIcon, HomeIcon, UserGroupIcon, ClipboardDocumentCheckIcon, ClockIcon, BookOpenIcon, AcademicCapIcon, ClipboardDocumentListIcon, ChartBarSquareIcon, BeakerIcon, SparklesIcon, PresentationChartBarIcon, TrophyIcon, UserCircleIcon, ChatBubbleBottomCenterTextIcon, UsersIcon, CurrencyRupeeIcon, DocumentTextIcon, BanknotesIcon, TruckIcon, BellAlertIcon, ShieldCheckIcon, PaintBrushIcon, Cog6ToothIcon, WrenchScrewdriverIcon, BoltIcon } from '@heroicons/react/24/outline';
import './styles.css';
import { Sidebar } from './components/ui/Sidebar';
import PageContainer from './components/ui/PageContainer';
import { useGlobalSettings } from './context/GlobalSettingsContext';

// Navigation definition grouped by domain
const navSections = [
  {
    label: 'Core',
    items: [
  { to: '/', label: 'Dashboard', end: true, icon: HomeIcon },
  { to: '/students', label: 'Students', icon: UserGroupIcon },
  { to: '/attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon },
  { to: '/timetable', label: 'Timetable', icon: ClockIcon },
  { to: '/library', label: 'Library', icon: BookOpenIcon },
    ],
  },
  {
    label: 'Academics',
    items: [
  { to: '/classes', label: 'Classes', icon: AcademicCapIcon },
  { to: '/exams', label: 'Exams', icon: ClipboardDocumentListIcon },
  { to: '/homework', label: 'Homework', icon: DocumentTextIcon },
  { to: '/academics/lesson-plans', label: 'Lesson Plans', icon: PaintBrushIcon },
  { to: '/analytics/attendance', label: 'Analytics', icon: ChartBarSquareIcon },
    ],
  },
  {
    label: 'Enrichment',
    items: [
  { to: '/workshops', label: 'Workshops', icon: WrenchScrewdriverIcon },
  { to: '/activities', label: 'Co-Scholastic', icon: SparklesIcon },
  { to: '/labs', label: 'Labs', icon: BeakerIcon },
  { to: '/events/engagement', label: 'Events Engagement', icon: PresentationChartBarIcon },
  { to: '/events/external', label: 'External Events', icon: TrophyIcon },
    ],
  },
  {
    label: 'Parent',
    items: [
  { to: '/parent/profile', label: 'Parent Profile', icon: UserCircleIcon },
  { to: '/parent/feedback', label: 'Feedback', icon: ChatBubbleBottomCenterTextIcon },
  { to: '/parent/connect', label: 'Connect', icon: BoltIcon },
  { to: '/parent/groups', label: 'Groups', icon: UsersIcon },
    ],
  },
  {
    label: 'Finance & HR',
    items: [
  { to: '/fees', label: 'Fees', icon: CurrencyRupeeIcon },
  { to: '/invoices', label: 'Invoices', icon: DocumentTextIcon },
  { to: '/payroll/components', label: 'Payroll', icon: BanknotesIcon },
  { to: '/transport', label: 'Transport', icon: TruckIcon },
    ],
  },
  {
    label: 'System',
    items: [
    { to: '/notifications', label: 'Notifications', icon: BellAlertIcon },
    { to: '/audit', label: 'Audit Log', icon: ShieldCheckIcon },
    { to: '/theme', label: 'Theme', icon: PaintBrushIcon },
    { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
    { to: '/features', label: 'Features', icon: SparklesIcon },
    { to: '/engagement', label: 'Engagement', icon: BoltIcon },
    ],
  },
];

function classNames(...cls) { return cls.filter(Boolean).join(' '); }

export function Layout(){
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // persisted
  const location = useLocation();
  const { brand } = useGlobalSettings();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      setDarkMode(stored === 'dark');
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefers);
      document.documentElement.classList.toggle('dark', prefers);
    }
  }, []);

  // apply when toggled
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // inject dynamic primary color from brand (expecting hex in brand.primary_color, else fallback)
  useEffect(() => {
    if(brand?.primary_color){
      const hex = brand.primary_color.trim();
      const isHex = /^#?[0-9a-fA-F]{6}$/.test(hex);
      if(isHex){
        const clean = hex.replace('#','');
        const r = parseInt(clean.slice(0,2),16);
        const g = parseInt(clean.slice(2,4),16);
        const b = parseInt(clean.slice(4,6),16);
        document.documentElement.style.setProperty('--color-primary', `#${clean}`);
        document.documentElement.style.setProperty('--color-primary-rgb', `${r} ${g} ${b}`);
      }
    }
  }, [brand?.primary_color]);

  return (
    <div className={classNames('app-layout-root','bg-background text-foreground')} data-sidebar-collapsed={sidebarCollapsed || undefined}>
      {/* Fixed background sidebar column to ensure full-height color fill */}
      <div className="sidebar-bg" aria-hidden="true" />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-slate-900 text-white dark:bg-slate-800 px-4 py-2 rounded-md z-[100]">Skip to content</a>
      <div className="sidebar-wrapper">
        <Sidebar
            sections={navSections}
            footer={brand?.tagline && <span className="truncate max-w-[8rem]" title={brand.tagline}>{brand.tagline}</span>}
            collapsible
            onCollapsedChange={(c) => setSidebarCollapsed(c)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      <Transition show={mobileOpen} as={Fragment}>
        <div className="lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-150"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <aside className="fixed z-50 inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 dark:bg-slate-950 dark:text-slate-300 border-r flex flex-col">
              <div className="h-14 px-4 flex items-center border-b border-slate-800 dark:border-slate-800 font-semibold tracking-tight justify-between gap-2">
                {brand?.logo_url ? (
                  <img src={brand.logo_url} alt={brand.school_name} className="h-7 w-auto" />
                ) : (
                  <span className="text-sm font-semibold">{brand?.school_name || 'School'}</span>
                )}
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-muted">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-sm">
                {navSections.map(section => (
                  <div key={section.label}>
                    <div className="px-2 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-medium mb-2">{section.label}</div>
                    <ul className="space-y-1">
                      {section.items.map(item => {
                        const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
                        return (
                          <li key={item.to}>
                            <NavLink
                              to={item.to}
                              end={item.end}
                              className={classNames(
                                'block rounded-md px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                                active ? 'bg-slate-800/80 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                              )}
                              onClick={() => setMobileOpen(false)}
                            >
                              {item.label}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-800 dark:border-slate-800 text-xs text-slate-500">v0.1.0</div>
            </aside>
          </Transition.Child>
        </div>
      </Transition>

      {/* Main area */}
  <div className="main-wrapper">
  <header className="h-16 border-b flex items-center gap-4 px-4 bg-card sticky top-0 z-20 shadow-sm">
          <button className="lg:hidden p-2 rounded-md hover:bg-muted" onClick={() => setMobileOpen(true)}>
            <Bars3Icon className="h-5 w-5" />
          </button>
          {brand?.logo_url ? (
            <img src={brand.logo_url} alt={brand.school_name} className="h-8 w-auto hidden sm:block" />
          ) : (
            <span className="font-semibold tracking-tight hidden sm:block">{brand?.school_name || 'ERPLake'}</span>
          )}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search..."
              className="w-full h-9 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 text-body placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 transition-colors"
            />
          </div>
          <button
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-md hover:bg-muted"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <Menu as="div" className="relative text-left">
            <Menu.Button className="h-8 rounded-md border px-3 flex items-center gap-2 text-sm hover:bg-muted">
              <span className="inline-block h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/60" />
              <span>Admin</span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-md border bg-card shadow focus:outline-none py-1 text-sm">
                <Menu.Item>
                  {({ active }) => (
                    <NavLink to="/profile" className={classNames('block px-3 py-1.5', active && 'bg-muted')}>Profile</NavLink>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button className={classNames('w-full text-left px-3 py-1.5', active && 'bg-muted')}>Logout</button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </header>
        <main id="main-content" className="flex-1 overflow-y-auto min-w-0 p-6 lg:p-8 bg-background" tabIndex={-1}>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
        {/* Mobile bottom nav */}
  <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur border-t border-slate-800 flex items-center justify-around z-40 mobile-bottom-nav-enter">
          {[
            navSections[0].items[0], // dashboard
            navSections[0].items[1], // students
            navSections[1].items[4], // analytics
            navSections[4].items[0], // fees
            navSections[5].items[3], // settings
          ].map(item => {
            const active = location.pathname === item.to || (!item.end && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={classNames('flex flex-col items-center justify-center gap-1 w-full h-full text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900', active ? 'text-primary' : 'text-slate-400 hover:text-slate-100')}> 
                {Icon && <Icon className={classNames('h-5 w-5', active ? 'text-primary' : '')} />}
                <span>{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
