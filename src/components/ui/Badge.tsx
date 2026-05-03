import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  children: React.ReactNode;
}

export const Badge = ({ children, variant = 'default', className, ...props }: BadgeProps) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    danger: "bg-rose-50 text-rose-600 border-rose-100",
    info: "bg-blue-50 text-blue-600 border-blue-100",
    default: "bg-slate-50 text-slate-600 border-slate-200"
  };

  return (
    <span 
      className={cn(
        "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
