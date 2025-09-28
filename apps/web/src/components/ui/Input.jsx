import React from 'react';
import clsx from 'clsx';

const base = 'flex h-9 w-full rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const Input = React.forwardRef(function Input({ className, invalid, ...props }, ref){
  return (
    <input
      ref={ref}
      data-invalid={invalid ? '' : undefined}
      className={clsx(base, 'border-input focus-visible:ring-offset-background', invalid && 'border-destructive focus-visible:ring-destructive', className)}
      {...props}
    />
  );
});

export default Input;
