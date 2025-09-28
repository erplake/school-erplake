import React from 'react';
import clsx from 'clsx';

export function PageHeader({ title, description, actions, className }){
  return (
    <div className={clsx('flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground max-w-prose">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export default PageHeader;
