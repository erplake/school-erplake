import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-md bg-muted', className)} />;
}

export default Skeleton;
