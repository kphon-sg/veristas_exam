import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  User,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Trash2,
  Edit3,
  Send,
  UserPlus,
  LogOut,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Activity {
  id: number;
  userId: number;
  userName: string;
  actionType: string;
  entityType: string;
  entityId: number;
  details: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ActivityHistoryProps {
  userId: number;
  role: 'TEACHER' | 'STUDENT';
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onClose?: () => void;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ userId, role, authenticatedFetch, onClose }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let url = `/api/activities?userId=${userId}&page=${page}&limit=10`;
      if (filterType) url += `&type=${filterType}`;
      if (filterDate) url += `&date=${filterDate}`;

      const res = await authenticatedFetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setActivities(data.activities);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId, page, filterType, filterDate]);

  const getIcon = (type: string) => {
    const actionType = type?.toUpperCase();
    switch (actionType) {
      case 'QUIZ_CREATED': return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case 'QUIZ_UPDATED': return <Edit3 className="w-4 h-4 text-amber-500" />;
      case 'QUIZ_DELETED': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'QUIZ_STARTED': return <Clock className="w-4 h-4 text-veritas-indigo" />;
      case 'QUIZ_SUBMITTED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'QUIZ_GRADED': return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'COURSE_CREATED': return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'COURSE_DELETED': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'INVITATION_SENT': return <Send className="w-4 h-4 text-veritas-indigo" />;
      case 'INVITATION_ACCEPTED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'INVITATION_DECLINED': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'JOIN_REQUEST_SENT': return <UserPlus className="w-4 h-4 text-veritas-indigo" />;
      case 'JOIN_REQUEST_ACCEPTED': 
      case 'JOIN_REQUEST_ACCEPTED_BY_TEACHER': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'JOIN_REQUEST_DECLINED': 
      case 'JOIN_REQUEST_DECLINED_BY_TEACHER': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'STUDENT_ADDED': return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'STUDENT_REMOVED': return <LogOut className="w-4 h-4 text-rose-500" />;
      case 'COURSE_JOINED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'COURSE_LEFT': return <LogOut className="w-4 h-4 text-slate-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatType = (type: string) => {
    if (!type) return 'Activity';
    
    const mapping: Record<string, string> = {
      'QUIZ_CREATED': 'Quiz Created',
      'QUIZ_UPDATED': 'Quiz Updated',
      'QUIZ_DELETED': 'Quiz Deleted',
      'QUIZ_STARTED': 'Quiz Started',
      'QUIZ_SUBMITTED': 'Quiz Submitted',
      'QUIZ_GRADED': 'Quiz Graded',
      'COURSE_CREATED': 'Course Created',
      'COURSE_DELETED': 'Course Deleted',
      'INVITATION_SENT': 'Invite Sent',
      'INVITATION_ACCEPTED': 'Invite Accepted',
      'INVITATION_DECLINED': 'Invite Declined',
      'JOIN_REQUEST_SENT': 'Join Request Sent',
      'JOIN_REQUEST_ACCEPTED': 'Join Request Accepted',
      'JOIN_REQUEST_ACCEPTED_BY_TEACHER': 'Join Request Approved',
      'JOIN_REQUEST_DECLINED': 'Join Request Declined',
      'JOIN_REQUEST_DECLINED_BY_TEACHER': 'Join Request Declined',
      'STUDENT_ADDED': 'Student Added',
      'STUDENT_REMOVED': 'Student Removed',
      'COURSE_JOINED': 'Course Joined',
      'COURSE_LEFT': 'Course Left'
    };

    return mapping[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="portal-card-header flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4 relative z-10">
          <div className="portal-header-icon-box">
            <Clock className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="portal-header-title">
              {role === 'TEACHER' ? 'Teacher Activity History' : 'My Activity History'}
            </h2>
            <p className="portal-header-subtitle">Audit log of all your actions</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="portal-close-button relative z-10">
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filter:</span>
        </div>
        
        <select 
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-veritas-indigo/20 transition-all"
        >
          <option value="">All Types</option>
          <option value="QUIZ_CREATED">Quiz Created</option>
          <option value="QUIZ_UPDATED">Quiz Updated</option>
          <option value="QUIZ_DELETED">Quiz Deleted</option>
          <option value="QUIZ_STARTED">Quiz Started</option>
          <option value="QUIZ_SUBMITTED">Quiz Submitted</option>
          <option value="QUIZ_GRADED">Quiz Graded</option>
          <option value="COURSE_CREATED">Course Created</option>
          <option value="COURSE_JOINED">Course Joined</option>
          <option value="INVITATION_SENT">Invitation Sent</option>
          <option value="JOIN_REQUEST_SENT">Join Request Sent</option>
        </select>

        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
            className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-veritas-indigo/20 transition-all"
          />
        </div>

        {(filterType || filterDate) && (
          <button 
            onClick={() => { setFilterType(''); setFilterDate(''); setPage(1); }}
            className="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-4 border-veritas-indigo/20 border-t-veritas-indigo rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-slate-800 font-bold">No activities found</h3>
            <p className="text-sm text-slate-400 mt-1">Your history is currently empty.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100" />

            <div className="space-y-8">
              {activities.map((activity, idx) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 shadow-sm">
                    {getIcon(activity.actionType)}
                  </div>

                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-veritas-indigo uppercase tracking-widest bg-veritas-indigo/5 px-2 py-1 rounded">
                        {formatType(activity.actionType || (activity as any).action_type)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(activity.createdAt || (activity as any).created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {activity.details}
                    </p>
                    {(activity.entityType || (activity as any).entity_type) && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          Related {(activity.entityType || (activity as any).entity_type).toLowerCase().replace('class', 'course')}:
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          #{activity.entityId || (activity as any).entity_id}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {activities.length} of {pagination.total} activities
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-600 px-3">
              Page {page} of {pagination.totalPages}
            </span>
            <button 
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
