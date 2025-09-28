import React, { useId } from 'react';
import clsx from 'clsx';

// Accessible Tabs primitive (uncontrolled or controlled via value/onChange)
export function Tabs({ tabs, value, defaultValue, onChange, className, size='md', variant='default' }) {
  const [internal, setInternal] = React.useState(defaultValue || tabs[0]?.value);
  const active = value !== undefined ? value : internal;
  const idBase = useId();

  function select(v){
    if(value === undefined) setInternal(v);
    onChange?.(v);
  }

  const sizes = {
    sm: 'text-xs h-8 px-3',
    md: 'text-sm h-9 px-4',
    lg: 'text-sm h-10 px-5'
  };

  return (
    <div className={clsx('flex flex-col', className)}>
      <div role="tablist" aria-orientation="horizontal" className={clsx('inline-flex items-center gap-1 rounded-md bg-muted/50 p-1 overflow-x-auto')}>
        {tabs.map(t => {
          const isActive = t.value === active;
          return (
            <button
              key={t.value}
              role="tab"
              id={`${idBase}-tab-${t.value}`}
              aria-selected={isActive}
              aria-controls={`${idBase}-panel-${t.value}`}
              tabIndex={isActive ? 0 : -1}
              className={clsx('relative rounded-md font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', sizes[size], isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              onClick={() => select(t.value)}
            >
              {t.label}
              {isActive && <span className="absolute inset-0 rounded-md ring-1 ring-border pointer-events-none" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        {tabs.map(t => {
          const isActive = t.value === active;
          return (
            <div
              key={t.value}
              role="tabpanel"
              id={`${idBase}-panel-${t.value}`}
              aria-labelledby={`${idBase}-tab-${t.value}`}
              hidden={!isActive}
              className="focus-visible:outline-none"
            >
              {typeof t.content === 'function' ? t.content() : t.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;
