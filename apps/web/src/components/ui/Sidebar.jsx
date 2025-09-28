import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useGlobalSettings } from '../../context/GlobalSettingsContext';

function classNames(...cls){ return cls.filter(Boolean).join(' '); }

/**
 * Sidebar navigation component
 * props:
 *  sections: [{ label: string, items: [{ to, label, end? }] }]
 *  footer?: node
 *  onNavigate?: () => void (called after link click, for mobile closing)
 */
export function Sidebar({ sections, footer, onNavigate, version = 'v0.1.0', className, collapsible = true, onCollapsedChange }){
  const location = useLocation();
  const { brand } = useGlobalSettings();
  const [collapsed, setCollapsed] = useState(()=>{
    try { const raw = localStorage.getItem('sidebar_collapsed'); if(raw) return JSON.parse(raw); } catch {}
    return false;
  });
  // Track whether user explicitly toggled (to avoid auto-collapse overriding user choice on resize)
  const userToggledRef = useRef(false);
  useEffect(() => {
    try { if(sessionStorage.getItem('sidebar_user_toggled') === '1') { userToggledRef.current = true; } } catch {}
  }, []);
  const activeRef = useRef(null);
  const [accentPos, setAccentPos] = useState({ top: 0, height: 0, visible: false });
  const [lastActiveSection, setLastActiveSection] = useState(()=>{
    try { const raw = localStorage.getItem('sidebar_last_active_section'); if(raw) return raw; } catch {}
    return null;
  });
  const [open, setOpen] = useState(()=>{
    // restore from localStorage
    try { const raw = localStorage.getItem('sidebar_open'); if(raw) return JSON.parse(raw); } catch {}
    // default: all open
    return Object.fromEntries(sections.map(s => [s.label, true]));
  });

  const persist = useCallback((next) => {
    try { localStorage.setItem('sidebar_open', JSON.stringify(next)); } catch {}
  }, []);

  function toggle(label){
    setOpen(o => { const next = { ...o, [label]: !o[label] }; persist(next); return next; });
  }

  // Key navigation: ArrowUp/Down to move focus between headers, ArrowLeft/Right to collapse/expand
  const headerRefs = useRef({});
  function onHeaderKey(e, label){
    const labels = sections.map(s => s.label);
    const idx = labels.indexOf(label);
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      const next = headerRefs.current[labels[(idx+1)%labels.length]]; next && next.focus();
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      const prev = headerRefs.current[labels[(idx-1+labels.length)%labels.length]]; prev && prev.focus();
    } else if(e.key === 'ArrowLeft'){
      if(open[label]){ e.preventDefault(); toggle(label); }
    } else if(e.key === 'ArrowRight'){
      if(!open[label]){ e.preventDefault(); toggle(label); }
    } else if(e.key === 'Home'){
      e.preventDefault(); headerRefs.current[labels[0]]?.focus();
    } else if(e.key === 'End'){
      e.preventDefault(); headerRefs.current[labels[labels.length-1]]?.focus();
    }
  }

  // Auto open section that contains current route if closed
  useEffect(() => {
    let foundSection = null;
    sections.forEach(sec => {
      const active = sec.items.some(i => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)));
      if(active){ foundSection = sec.label; }
      if(!open[sec.label] && active && !collapsed){ toggle(sec.label); }
    });
    if(foundSection){
      setLastActiveSection(foundSection);
      try { localStorage.setItem('sidebar_last_active_section', foundSection); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, collapsed]);

  // When expanding from collapsed, restore last active section if closed
  useEffect(() => {
    if(!collapsed && lastActiveSection && !open[lastActiveSection]){
      toggle(lastActiveSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  // Recompute accent position after paint
  useEffect(() => {
    if(activeRef.current){
      const el = activeRef.current;
      const rect = el.getBoundingClientRect();
      const parentRect = el.offsetParent?.getBoundingClientRect();
      if(parentRect){
        setAccentPos({ top: rect.top - parentRect.top, height: rect.height, visible: true });
      }
    }
  }, [location.pathname, collapsed, open]);

  // Notify parent about collapsed state (initial + changes)
  useEffect(() => {
    if(typeof onCollapsedChange === 'function'){
      onCollapsedChange(collapsed);
    }
    // Dispatch global custom event
    try {
      const ev = new CustomEvent('sidebar:collapsed-change', { detail: { collapsed } });
      window.dispatchEvent(ev);
    } catch {}
  }, [collapsed, onCollapsedChange]);

  // Responsive auto-collapse behavior: below 1100px collapse unless user manually expanded during session
  useEffect(() => {
    function handleResize(){
      const w = window.innerWidth;
      if(w < 1100){
        if(!collapsed && !userToggledRef.current){
          setCollapsed(true);
          try { window.dispatchEvent(new CustomEvent('sidebar:auto-adjust', { detail:{ action:'auto-collapse', width:w } })); } catch {}
        }
      } else if(w >= 1240){
        if(collapsed && !userToggledRef.current){
          setCollapsed(false);
          try { window.dispatchEvent(new CustomEvent('sidebar:auto-adjust', { detail:{ action:'auto-expand', width:w } })); } catch {}
        }
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  return (
    <aside
      className={classNames('sidebar-root flex-col border-r bg-slate-900 text-slate-300 dark:bg-slate-950 dark:text-slate-300 hidden lg:flex', className)}
      data-collapsed={collapsed || undefined}
      aria-label="Primary"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {collapsed ? 'Sidebar collapsed' : 'Sidebar expanded'}
      </div>
      <div className="h-14 px-3 flex items-center border-b font-semibold tracking-tight gap-2 relative">
        <div className="flex items-center gap-2 overflow-hidden">
          {brand?.logo_url ? (
            <img src={brand.logo_url} alt={brand.school_name} className="h-7 w-7 object-contain rounded-sm" />
          ) : (
            <span className="text-sm font-semibold truncate-on-collapse">{brand?.school_name || 'School'}</span>
          )}
          <span className="text-xs text-slate-500 truncate-on-collapse max-w-[9rem]" title={brand?.tagline}>{brand?.tagline}</span>
        </div>
        {collapsible && (
          <button
            onClick={() => { const next = !collapsed; userToggledRef.current = true; try { sessionStorage.setItem('sidebar_user_toggled','1'); } catch {}; setCollapsed(next); try { localStorage.setItem('sidebar_collapsed', JSON.stringify(next)); } catch {} }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto p-1.5 rounded-md hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="block w-4 h-4 text-[10px] leading-none text-slate-300">{collapsed ? '›' : '‹'}</span>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 text-sm relative">
        {collapsed && (
          <div className="px-1 pb-2 flex flex-col gap-2 items-center" aria-hidden="true">
            <button className="w-8 h-8 rounded-md bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" title="Notifications">🔔</button>
            <button className="w-8 h-8 rounded-md bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" title="Help">?</button>
          </div>
        )}
        {sections.map(section => {
          const isOpen = open[section.label] ?? true;
          const SectionWrapper = ({ children }) => (
            <div className="group relative">{children}</div>
          );
          return (
            <SectionWrapper key={section.label}>
              <button
                onClick={() => toggle(section.label)}
                className={classNames('nav-section-header w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 dark:hover:bg-slate-800/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900', collapsed && 'justify-center')}
                aria-expanded={isOpen}
                aria-controls={`sec-${section.label}`}
                ref={el => headerRefs.current[section.label] = el}
                onKeyDown={(e)=>onHeaderKey(e, section.label)}
              >
                <span className="flex items-center gap-1"><span className="label-text" aria-hidden={collapsed}>{section.label}</span></span>
                {!collapsed && (
                  <span className={classNames('transition-transform duration-200 text-xs opacity-70 group-hover:opacity-100', isOpen ? 'rotate-90' : '')}>▶</span>
                )}
              </button>
              <div
                id={`sec-${section.label}`}
                className={classNames('mt-1 overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none motion-reduce:duration-0', isOpen && !collapsed ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0')}
              >
                <ul className={classNames('space-y-1 border-slate-700 dark:border-slate-800 relative', collapsed ? 'pl-0' : 'pl-1.5 border-l')}>
                  {accentPos.visible && (
                    <span
                      aria-hidden="true"
                      className={classNames('absolute left-0 w-0.5 rounded-r bg-primary/70 transition-all duration-300 ease-out motion-reduce:transition-none', collapsed ? 'left-1.5' : '')}
                      style={{ top: accentPos.top, height: accentPos.height }}
                    />
                  )}
                  {section.items.map(item => {
                    const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
                    const Icon = item.icon;
                    const tooltipId = `tt-${item.to.replace(/[^a-z0-9]/gi,'_')}`;
                    return (
                      <li key={item.to} className="relative">
                        <div className="tooltip-wrapper">
                          <NavLink
                            to={item.to}
                            end={item.end}
                            aria-describedby={collapsed ? tooltipId : undefined}
                            className={classNames(
                              'group/link flex items-center gap-2 rounded-md px-2 py-2 mt-0.5 relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                              collapsed ? 'justify-center' : 'pl-2 pr-3',
                              active ? 'bg-primary-tint-active text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-100 hover:bg-primary-tint-hover'
                            )}
                            onClick={() => onNavigate && onNavigate()}
                            ref={active ? activeRef : undefined}
                          >
                            {Icon && <Icon className={classNames('h-5 w-5 flex-shrink-0', active ? 'text-primary-light' : 'text-slate-400 group-hover/link:text-slate-200')} />}
                            {!collapsed && <span className="nav-item-label" aria-hidden={collapsed}>{item.label}</span>}
                          </NavLink>
                          {collapsed && (
                            <span id={tooltipId} role="tooltip" className="tooltip-pop">{item.label}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </SectionWrapper>
          );
        })}
      </div>
      <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between">
        <span className="truncate-on-collapse" aria-hidden={collapsed}>{version}</span>
        {!collapsed && footer}
      </div>
    </aside>
  );
}

export default Sidebar;