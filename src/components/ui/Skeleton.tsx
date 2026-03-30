import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rectangular' 
}) => {
  return (
    <div 
      className={cn(
        "skeleton shimmer-effect",
        variant === 'circular' && "rounded-full",
        variant === 'text' && "h-4 w-full",
        className
      )} 
    />
  );
};
