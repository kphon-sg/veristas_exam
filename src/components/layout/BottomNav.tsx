import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Clock, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  userRole?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ userRole = 'STUDENT', activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'courses', label: 'Courses', icon: BookOpen, path: '/dashboard/courses' },
    { 
      id: 'quiz-history', 
      label: 'History', 
      icon: Clock, 
      path: '/dashboard/history',
      roles: ['STUDENT']
    },
    { 
      id: 'grading', 
      label: 'Grading', 
      icon: Clock, 
      path: '/dashboard/grading',
      roles: ['TEACHER']
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
  ].filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-50 md:hidden shadow-2xl">
      {navItems.map(item => (
        <NavLink
          key={item.id}
          to={item.path}
          end={item.path === '/dashboard'}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            isActive ? "text-emerald-600" : "text-slate-600 hover:text-slate-800"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "fill-emerald-600/10" : ""
              )} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
