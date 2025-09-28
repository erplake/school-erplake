import React from 'react';
import clsx from 'clsx';

const base = 'flex h-9 w-full rounded-md border bg-background px-3 pr-8 text-sm shadow-sm transition-colors appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const Select = React.forwardRef(function Select({ className, invalid, children, ...props }, ref){
  return (
    <div className="relative">
      <select
        ref={ref}
        data-invalid={invalid ? '' : undefined}
        className={clsx(base, 'border-input focus-visible:ring-offset-background', invalid && 'border-destructive focus-visible:ring-destructive', className)}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground text-xs">▾</span>
    </div>
  );
});

export default Select;
