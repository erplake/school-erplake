import React from 'react';
import clsx from 'clsx';

// Provides a consistent neutral background + max width + vertical spacing baseline
export function PageContainer({ className, children, width='max-w-[1400px]' }){
  return (
    <div className={clsx('w-full mx-auto', width, 'space-y-8', className)}>
      {children}
    </div>
  );
}

export default PageContainer;