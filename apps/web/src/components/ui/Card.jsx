import React from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...rest }) {
  return (
    <div className={clsx('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...rest}>{children}</div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={clsx('p-4 pb-2 flex flex-col gap-1', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={clsx('font-medium leading-none tracking-tight', className)}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={clsx('text-sm text-muted-foreground', className)}>{children}</p>;
}

export function CardContent({ className, children }) {
  return <div className={clsx('p-4 pt-0', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={clsx('p-4 pt-0 flex items-center', className)}>{children}</div>;
}

export default Card;
