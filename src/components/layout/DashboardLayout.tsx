import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '../../lib/utils';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, GraduationCap, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  role: 'STUDENT' | 'TEACHER';
  user: any;
  onLogout: () => void;
  token: string | null;
  onUpdate?: () => void;
  authenticatedFetch: any;
}

export const DashboardLayout = ({ 
  children,
  role, 
  user,
  onLogout,
  token,
  onUpdate,
  authenticatedFetch
}: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden font-sans selection:bg-violet-600/10">
      <Sidebar 
        userRole={role} 
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        token={token}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-slate-800 text-sm tracking-tight">VeritasExam</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && <NotificationCenter user={user} onUpdate={onUpdate || (() => {})} authenticatedFetch={authenticatedFetch} />}
            <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="min-h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
