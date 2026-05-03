import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  X, 
  User, 
  Book, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Trophy,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Quiz {
  id: number;
  title: string;
  openAt?: string;
  closeAt?: string;
  deadline: string;
  courseCode?: string;
  courseName?: string;
  teacherName?: string;
  completionStatus?: 'completed' | 'pending' | 'overdue' | null;
  submissionScore?: number | null;
  submittedAt?: string | null;
}

interface CalendarViewProps {
  quizzes: Quiz[];
  onClose: () => void;
  userRole: 'TEACHER' | 'STUDENT';
  onQuizSelect?: (quiz: Quiz) => void;
  onEditQuiz?: (quiz: Quiz) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ quizzes, onClose, userRole, onQuizSelect, onEditQuiz }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Add empty slots for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add days of current month
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: Date) => {
    return quizzes.filter(quiz => {
      const openDate = quiz.openAt ? new Date(quiz.openAt) : null;
      const closeDate = quiz.closeAt ? new Date(quiz.closeAt) : new Date(quiz.deadline);
      
      const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() && 
        d1.getMonth() === d2.getMonth() && 
        d1.getDate() === d2.getDate();

      if (userRole === 'STUDENT') {
        // For students, focus on the deadline
        return closeDate && isSameDay(day, closeDate);
      }

      return (openDate && isSameDay(day, openDate)) || (closeDate && isSameDay(day, closeDate));
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const Legend = () => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Legend (Chú thích):</span>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200" />
        <span className="text-xs font-bold text-slate-600">Completed (Đã hoàn thành)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm shadow-amber-200" />
        <span className="text-xs font-bold text-slate-600">Pending (Chưa hoàn thành)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-rose-500 rounded-full shadow-sm shadow-rose-200" />
        <span className="text-xs font-bold text-slate-600">Quiz Deadline (Hạn chót)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-rose-500 rounded-sm border border-rose-200" />
        <span className="text-xs font-bold text-rose-600">● Red: Quiz Deadline (Expires soon)</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="portal-card-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="portal-header-icon-box">
            <CalendarIcon className="w-6 h-6 text-slate-800" />
          </div>
          <div>
            <h2 className="portal-header-title">Quiz Schedule</h2>
            <p className="portal-header-subtitle">
              Manage your upcoming examinations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {userRole === 'STUDENT' && (
            <div className="hidden md:flex items-center gap-4 mr-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Pending</span>
              </div>
            </div>
          )}
          <button 
            onClick={onClose} 
            className="portal-close-button"
            title="Back to Dashboard"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-white p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-200">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const events = day ? getEventsForDay(day) : [];
            const isToday = day && new Date().toDateString() === day.toDateString();
            const hasDeadline = day && events.some(quiz => {
              const closeDate = quiz.closeAt || quiz.deadline;
              return closeDate && new Date(closeDate).toDateString() === day.toDateString();
            });
            
            return (
              <div 
                key={i} 
                className={cn(
                  "bg-white p-2 min-h-[100px] transition-colors relative group",
                  !day && "bg-slate-50/50",
                  day && "hover:bg-slate-50/80",
                  hasDeadline && "ring-1 ring-inset ring-rose-100 bg-rose-50/10"
                )}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-xs font-bold inline-block w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                        isToday ? "bg-veritas-indigo text-white" : "text-slate-600 group-hover:text-slate-900"
                      )}>
                        {day.getDate()}
                      </span>
                      {hasDeadline && (
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" title="Deadline today" />
                      )}
                    </div>
                    <div className="space-y-1">
                      {events.map((quiz, idx) => {
                        const isOpenDay = quiz.openAt && new Date(quiz.openAt).toDateString() === day.toDateString();
                        const isCloseDay = (quiz.closeAt || quiz.deadline) && new Date(quiz.closeAt || quiz.deadline).toDateString() === day.toDateString();
                        
                        if (userRole === 'STUDENT') {
                          const status = quiz.completionStatus;
                          const statusStyles = {
                            completed: "bg-emerald-50 border-emerald-100 text-emerald-700",
                            pending: "bg-amber-50 border-amber-100 text-amber-700",
                            overdue: "bg-rose-50 border-rose-100 text-rose-700"
                          };
                          const currentStyle = status === 'completed' 
                            ? statusStyles.completed 
                            : "bg-rose-50 border-rose-200 text-rose-700 shadow-sm";

                          return (
                            <div 
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuiz(quiz);
                              }}
                              className={cn(
                                "p-1.5 border rounded text-[9px] leading-tight cursor-pointer hover:scale-105 transition-transform hover:shadow-sm group/event",
                                currentStyle
                              )}
                            >
                              <div className="font-black uppercase tracking-tighter flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> {formatTime(quiz.closeAt || quiz.deadline)}
                                </div>
                                {status === 'completed' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-[6px]">✓</div>}
                              </div>
                              <div className="font-bold truncate">{quiz.title}</div>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="space-y-1">
                            {isOpenDay && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuiz(quiz);
                                }}
                                className="p-1.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] leading-tight cursor-pointer hover:scale-105 transition-transform hover:shadow-sm group/event"
                              >
                                <div className="font-black text-emerald-700 uppercase tracking-tighter flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> Starts: {formatTime(quiz.openAt!)}
                                </div>
                                <div className="text-emerald-600 font-bold truncate group-hover/event:text-emerald-800">{quiz.title}</div>
                              </div>
                            )}
                            {isCloseDay && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuiz(quiz);
                                }}
                                className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[9px] leading-tight cursor-pointer hover:scale-105 transition-transform hover:shadow-md group/event"
                              >
                                <div className="font-black text-rose-700 uppercase tracking-tighter flex items-center gap-1">
                                  <AlertCircle className="w-2.5 h-2.5" /> Deadline: {formatTime(quiz.closeAt || quiz.deadline)}
                                </div>
                                <div className="text-rose-800 font-bold truncate group-hover/event:text-rose-900">{quiz.title}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {userRole === 'STUDENT' && <Legend />}
      </div>

      {/* Quiz Detail Modal */}
      <AnimatePresence>
        {selectedQuiz && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              {/* Minimalist Header */}
              <div className="bg-[#F9FAFB] p-8 border-b border-slate-100 relative">
                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      <CalendarIcon className="w-3 h-3" /> Quiz Information
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                      {selectedQuiz.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Book className="w-3.5 h-3.5" />
                      <span>{selectedQuiz.courseCode || 'N/A'} — {selectedQuiz.courseName || 'General Course'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedQuiz(null)}
                    className="p-2 hover:bg-slate-200/50 rounded-lg transition-all text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8 font-sans">
                {/* Meta Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Time</p>
                        <p className="text-sm font-medium text-slate-700">
                          {selectedQuiz.openAt ? new Date(selectedQuiz.openAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Immediate Access'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deadline</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(selectedQuiz.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned By</p>
                        <p className="text-sm font-medium text-slate-700">
                          {selectedQuiz.teacherName || 'Course Instructor'}
                        </p>
                      </div>
                    </div>

                    {userRole === 'STUDENT' && (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <div className={cn(
                            "inline-flex items-center text-xs font-bold",
                            selectedQuiz.completionStatus === 'completed' ? "text-emerald-600" :
                            selectedQuiz.completionStatus === 'overdue' ? "text-rose-600" :
                            "text-amber-600"
                          )}>
                            {selectedQuiz.completionStatus === 'completed' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                            {selectedQuiz.completionStatus === 'overdue' && <XCircle className="w-3 h-3 mr-1.5" />}
                            {(!selectedQuiz.completionStatus || selectedQuiz.completionStatus === 'pending') && <Clock className="w-3 h-3 mr-1.5" />}
                            {selectedQuiz.completionStatus || 'Pending'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Section for Students - Integrated Design */}
                {userRole === 'STUDENT' && selectedQuiz.completionStatus === 'completed' && (
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Your Performance</p>
                        <p className="text-lg font-bold text-slate-900">
                          {selectedQuiz.submissionScore !== null && selectedQuiz.submissionScore !== undefined 
                            ? `${selectedQuiz.submissionScore} Points` 
                            : 'Grading in progress'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Submitted At</p>
                      <p className="text-xs font-medium text-slate-500">
                        {selectedQuiz.submittedAt ? new Date(selectedQuiz.submittedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
