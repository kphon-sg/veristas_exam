import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'paper';
}

export const Card = ({ children, className, variant = 'default', ...props }: CardProps) => {
  return (
    <div 
      className={cn(
        "rounded-2xl transition-all duration-200",
        variant === 'default' ? "bg-white shadow-sm border border-slate-100" : "bg-white border border-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100", className)}>
    {children}
  </div>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl", className)}>
    {children}
  </div>
);
