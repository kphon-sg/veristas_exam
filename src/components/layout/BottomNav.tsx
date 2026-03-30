import React from 'react';
import { LayoutDashboard, BookOpen, Clock, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'quiz-history', label: 'History', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-50 md:hidden shadow-2xl">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            activeTab === item.id ? "text-violet-600" : "text-slate-600 hover:text-slate-800"
          )}
        >
          <item.icon className={cn(
            "w-5 h-5",
            activeTab === item.id ? "fill-violet-600/10" : ""
          )} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
