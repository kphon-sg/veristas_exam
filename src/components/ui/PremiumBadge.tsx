import React from 'react';
import { cn } from '../../lib/utils';

interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
  dot?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  dot = false
}) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    error: "bg-rose-50 text-rose-600 border-rose-100",
    info: "bg-indigo-50 text-indigo-600 border-indigo-100",
    neutral: "bg-slate-50 text-slate-600 border-slate-200"
  };

  const dots = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    info: "bg-indigo-500",
    neutral: "bg-slate-500"
  };

  return (
    <span className={cn(
      "premium-badge flex items-center gap-1.5 w-fit",
      variants[variant],
      className
    )}>
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dots[variant])} />
      )}
      {children}
    </span>
  );
};
