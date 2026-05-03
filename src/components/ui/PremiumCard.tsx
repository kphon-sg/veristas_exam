import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
  title?: string;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  className, 
  hover = true,
  delay = 0,
  onClick,
  title
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className={cn(
        "glass-card",
        hover && "glass-card-hover",
        onClick && "cursor-pointer",
        className
      )}
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
        </div>
      )}
      {children}
    </motion.div>
  );
};
