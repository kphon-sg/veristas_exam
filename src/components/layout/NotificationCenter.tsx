import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  UserPlus, 
  MessageSquare, 
  Info, 
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useNotifications } from '../ui/NotificationProvider';

interface Notification {
  id: number;
  userId: number;
  type: 'INVITATION' | 'JOIN_REQUEST' | 'SYSTEM' | 'INVITATION_RESPONSE' | 'JOIN_RESPONSE';
  title: string;
  message: string;
  relatedId: number;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  user: { id: number; role: string };
  onUpdate?: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, onUpdate, authenticatedFetch }) => {
  const { notify } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await authenticatedFetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const res = await authenticatedFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await authenticatedFetch(`/api/notifications/read-all`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleAction = async (notification: Notification, action: 'ACCEPTED' | 'DECLINED') => {
    setLoading(true);
    try {
      let endpoint = '';
      if (notification.type === 'INVITATION') {
        endpoint = `/api/invitations/${notification.relatedId}/respond`;
      } else if (notification.type === 'JOIN_REQUEST') {
        endpoint = `/api/join-requests/${notification.relatedId}/respond`;
      }

      if (!endpoint) return;

      const res = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ status: action })
      });

      if (res.ok) {
        await markAsRead(notification.id);
        fetchNotifications();
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        notify.error(data.error || "Action failed");
      }
    } catch (err) {
      console.error("Error handling notification action:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'INVITATION': return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'JOIN_REQUEST': return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'INVITATION_RESPONSE':
      case 'JOIN_RESPONSE': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-veritas-deep animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-veritas-indigo hover:text-indigo-700 uppercase tracking-widest"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={cn(
                        "p-4 transition-colors hover:bg-slate-50 relative group",
                        !notification.isRead && "bg-indigo-50/30"
                      )}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-veritas-indigo rounded-full" />
                      )}
                      <div className="flex gap-3">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{notification.title}</h4>
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {notification.message}
                          </p>

                          {/* Action Buttons for Invitations and Join Requests */}
                          {!notification.isRead && (notification.type === 'INVITATION' || notification.type === 'JOIN_REQUEST') && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAction(notification, 'ACCEPTED'); }}
                                disabled={loading}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3 h-3" /> Accept
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAction(notification, 'DECLINED'); }}
                                disabled={loading}
                                className="flex-1 py-1.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5"
                              >
                                <X className="w-3 h-3" /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold">No notifications yet.</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center justify-center gap-1 mx-auto">
                View all activity <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
