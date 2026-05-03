import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  Award,
  Settings, 
  LogOut,
  GraduationCap,
  Plus,
  X,
  Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  token: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  isOpen, 
  onClose,
  userRole,
  token
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const count = data.filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [token]);

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'join-course', label: 'Join Course', icon: Plus },
    { 
      id: userRole === 'TEACHER' ? 'grading-management' : 'quiz-history', 
      label: userRole === 'TEACHER' ? 'Grading Management' : 'Quiz History', 
      icon: userRole === 'TEACHER' ? Award : Clock 
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ].filter(item => {
    if (item.id === 'join-course' && userRole === 'TEACHER') return false;
    return true;
  });

  const settingsItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item, isActive }: { item: any, isActive: boolean }) => (
    <button
      onClick={() => {
        onTabChange?.(item.id);
        if (window.innerWidth < 768) onClose();
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group w-full text-left relative",
        isActive 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      <item.icon className={cn(
        "w-5 h-5 transition-colors",
        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
      )} />
      <span className="font-medium text-sm flex-1">{item.label}</span>
      {item.badge > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-[#1e293b] z-50 transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800 shadow-2xl md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header / Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tight">VeritasExam</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{userRole}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4">Main Menu</p>
            <div className="space-y-1">
              {mainNavItems.map(item => (
                <NavItem 
                  key={item.id} 
                  item={item} 
                  isActive={activeTab === item.id} 
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4">Account</p>
            <div className="space-y-1">
              {settingsItems.map(item => (
                <NavItem 
                  key={item.id} 
                  item={item} 
                  isActive={activeTab === item.id} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 w-full text-left group"
          >
            <LogOut className="w-5 h-5 group-hover:text-rose-500" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
