import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'STUDENT' | 'TEACHER';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  token: string | null;
}

export const DashboardLayout = ({ 
  children, 
  role, 
  activeTab, 
  onTabChange, 
  onLogout,
  token
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        userRole={role} 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout}
        isOpen={!collapsed}
        onClose={() => setCollapsed(true)}
        token={token}
      />
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        collapsed ? "ml-0" : "ml-0"
      )}>
        {children}
      </main>
    </div>
  );
};
