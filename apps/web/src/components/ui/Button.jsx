import React from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary/90 focus-visible:ring-primary/40',
  secondary: 'bg-slate-600 text-white hover:bg-slate-600/90 dark:bg-slate-500 dark:hover:bg-slate-400/90',
  outline: 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:hover:bg-slate-600/60',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60',
  danger: 'bg-rose-600 text-white hover:bg-rose-600/90 focus-visible:ring-rose-500/40'
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-6 text-sm'
};

export function Button({ variant='primary', size='md', className, asChild, ...props }) {
  const Comp = asChild ? React.Fragment : 'button';
  const classes = clsx(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary/40',
  variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className
  );
  if (asChild) {
    return React.cloneElement(React.Children.only(props.children), { className: clsx(classes, props.children.props.className) });
  }
  return <Comp className={classes} {...props} />;
}

export default Button;
