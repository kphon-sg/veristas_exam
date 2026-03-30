import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="portal-card w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
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
          <button onClick={onClose} className="portal-close-button">
            <X className="w-6 h-6" />
          </button>
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
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "bg-white p-2 min-h-[100px] transition-colors relative group",
                    !day && "bg-slate-50/50",
                    day && "hover:bg-slate-50/80"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn(
                        "text-xs font-bold mb-2 inline-block w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                        isToday ? "bg-veritas-indigo text-white" : "text-slate-600 group-hover:text-slate-900"
                      )}>
                        {day.getDate()}
                      </span>
                      <div className="space-y-1">
                        {events.map((quiz, idx) => {
                          const isOpenDay = quiz.openAt && new Date(quiz.openAt).toDateString() === day.toDateString();
                          const isCloseDay = (quiz.closeAt || quiz.deadline) && new Date(quiz.closeAt || quiz.deadline).toDateString() === day.toDateString();
                          
                          if (userRole === 'STUDENT') {
                            const status = quiz.completionStatus;
                            const statusStyles = {
                              completed: "bg-emerald-100 border-emerald-200 text-emerald-700",
                              pending: "bg-blue-100 border-blue-200 text-blue-700",
                              overdue: "bg-rose-100 border-rose-200 text-rose-700"
                            };
                            const currentStyle = status ? statusStyles[status] : "bg-slate-100 border-slate-200 text-slate-700";

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
                                  className="p-1.5 bg-rose-50 border border-rose-100 rounded text-[9px] leading-tight cursor-pointer hover:scale-105 transition-transform hover:shadow-sm group/event"
                                >
                                  <div className="font-black text-rose-700 uppercase tracking-tighter flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> Deadline: {formatTime(quiz.closeAt || quiz.deadline)}
                                  </div>
                                  <div className="text-rose-600 font-bold truncate group-hover/event:text-rose-800">{quiz.title}</div>
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
        </div>
      </motion.div>

      {/* Quiz Detail Modal */}
      <AnimatePresence>
        {selectedQuiz && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="bg-gradient-to-r from-veritas-indigo to-emerald-400 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Quiz Details</div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedQuiz.title}</h3>
                    <p className="text-sm font-bold opacity-90 uppercase tracking-widest">{selectedQuiz.courseName || selectedQuiz.courseCode || 'Course Details'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedQuiz(null)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/70 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Time</div>
                      <div className="text-sm font-bold text-slate-700">
                        {selectedQuiz.openAt ? new Date(selectedQuiz.openAt).toLocaleString() : 'Immediate'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline</div>
                      <div className="text-sm font-bold text-rose-600">
                        {new Date(selectedQuiz.deadline).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {userRole === 'TEACHER' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Students Enrolled</div>
                        <div className="text-xl font-black text-indigo-600">
                          {/* Mocking number of students enrolled as it's not in the Quiz type */}
                          {Math.floor(Math.random() * 50) + 10} Students
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          onEditQuiz?.(selectedQuiz);
                          setSelectedQuiz(null);
                          onClose();
                        }}
                        className="w-full py-4 bg-veritas-indigo text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                      >
                        Quick Edit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={cn(
                          "p-4 rounded-2xl border",
                          selectedQuiz.completionStatus === 'completed' ? "bg-emerald-50 border-emerald-100" :
                          selectedQuiz.completionStatus === 'overdue' ? "bg-rose-50 border-rose-100" :
                          "bg-blue-50 border-blue-100"
                        )}>
                          <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Status</div>
                          <div className={cn(
                            "text-sm font-black uppercase tracking-tight",
                            selectedQuiz.completionStatus === 'completed' ? "text-emerald-600" :
                            selectedQuiz.completionStatus === 'overdue' ? "text-rose-600" :
                            "text-blue-600"
                          )}>
                            {selectedQuiz.completionStatus || 'Pending'}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</div>
                          <div className="text-sm font-black text-slate-700">
                            {selectedQuiz.submissionScore !== null && selectedQuiz.submissionScore !== undefined ? `${selectedQuiz.submissionScore} Pts` : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          onQuizSelect?.(selectedQuiz);
                          setSelectedQuiz(null);
                          onClose();
                        }}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                      >
                        {selectedQuiz.completionStatus === 'completed' ? 'Review Quiz' : 'Go to Quiz'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
