import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  User, 
  BookOpen, 
  Clock,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Notification {
  id: number;
  type: 'INVITATION' | 'JOIN_REQUEST' | 'SYSTEM' | 'INVITATION_RESPONSE' | 'JOIN_RESPONSE';
  title: string;
  message: string;
  relatedId: number;
  isRead: boolean;
  createdAt: string;
  details?: any;
}

interface NotificationsViewProps {
  userId: number;
  userRole: 'STUDENT' | 'TEACHER';
  token: string | null;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ userId, userRole, token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleRespond = async (notificationId: number, response: 'ACCEPT' | 'DECLINE' | 'APPROVE' | 'REJECT') => {
    if (!token) return;
    try {
      setProcessingId(notificationId);
      const res = await fetch('/api/notifications/respond', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId, response })
      });

      if (!res.ok) throw new Error('Failed to respond to request');
      
      // Refresh notifications
      await fetchNotifications();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, { 
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const pendingRequests = notifications.filter(n => 
    (n.type === 'INVITATION' || n.type === 'JOIN_REQUEST') && 
    n.details?.status === 'PENDING'
  );

  const otherNotifications = notifications.filter(n => 
    !((n.type === 'INVITATION' || n.type === 'JOIN_REQUEST') && n.details?.status === 'PENDING')
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="portal-card-header">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="portal-header-icon-box">
              <Bell className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="portal-header-title">Notifications & Requests</h2>
              <p className="portal-header-subtitle">Centralized hub for course invitations and join requests</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm">When you receive invitations or requests, they will appear here.</p>
          </div>
        ) : (
          <>
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Pending Requests
                  <span className="bg-violet-600 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>
                </h3>
                <div className="grid gap-4">
                  {pendingRequests.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            notif.type === 'INVITATION' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {notif.type === 'INVITATION' ? <BookOpen className="w-6 h-6" /> : <User className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{notif.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                            
                            {/* Detailed Info */}
                            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {notif.type === 'INVITATION' ? (
                                <>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</p>
                                    <p className="text-sm font-semibold text-slate-700">{notif.details?.teacher_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course</p>
                                    <p className="text-sm font-semibold text-slate-700">{notif.details?.course_code}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</p>
                                    <p className="text-sm font-semibold text-slate-700">{notif.details?.student_name}</p>
                                    <p className="text-[10px] text-slate-400">ID: {notif.details?.student_code}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course</p>
                                    <p className="text-sm font-semibold text-slate-700">{notif.details?.course_code}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            disabled={processingId === notif.id}
                            onClick={() => handleRespond(notif.id, userRole === 'STUDENT' ? 'ACCEPT' : 'APPROVE')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            {userRole === 'STUDENT' ? 'Accept' : 'Approve'}
                          </button>
                          <button
                            disabled={processingId === notif.id}
                            onClick={() => handleRespond(notif.id, userRole === 'STUDENT' ? 'DECLINE' : 'REJECT')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            {userRole === 'STUDENT' ? 'Decline' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Other Notifications Section */}
            {otherNotifications.length > 0 && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Recent Notifications</h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {otherNotifications.map((notif, idx) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={cn(
                        "p-4 flex items-start gap-4 transition-colors cursor-pointer",
                        !notif.isRead ? "bg-violet-50/50" : "hover:bg-slate-50",
                        idx !== otherNotifications.length - 1 && "border-b border-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        notif.isRead ? "bg-slate-100 text-slate-400" : "bg-violet-100 text-violet-600"
                      )}>
                        {notif.type.includes('RESPONSE') ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={cn("text-sm truncate", notif.isRead ? "text-slate-600 font-medium" : "text-slate-900 font-bold")}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-violet-600 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
