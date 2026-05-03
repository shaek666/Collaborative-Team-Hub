import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: 'border-transparent bg-slate-800 text-slate-100',
    secondary: 'border-transparent bg-slate-700 text-slate-300',
    success: 'border-transparent bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    warning: 'border-transparent bg-amber-500/10 text-amber-500 border border-amber-500/20',
    danger: 'border-transparent bg-rose-500/10 text-rose-500 border border-rose-500/20',
    info: 'border-transparent bg-blue-500/10 text-blue-500 border border-blue-500/20',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
