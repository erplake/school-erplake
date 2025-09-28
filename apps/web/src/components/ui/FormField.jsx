import React from 'react';
import clsx from 'clsx';

export function FormField({ label, htmlFor, required, hint, error, children, className }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none flex gap-1 items-center">
          {label}
          {required && <span className="text-destructive" title="Required">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

export default FormField;
