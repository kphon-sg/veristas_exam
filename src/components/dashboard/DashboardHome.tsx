import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, BookOpen, Activity, User as UserIcon, Plus, ChevronRight, Clock, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StudentStatsDashboard } from './StudentStatsDashboard';
import { ProfileOverview } from './ProfileOverview';
import { useNavigate } from 'react-router-dom';

interface DashboardHomeProps {
  user: any;
  quizzes: any[];
  submissions: any[];
  userSubmissions: any[];
  availableClasses: any[];
  classes: any[];
  studentStats: any;
  isViewingProfile: boolean;
  handleTabChange: (tab: string) => void;
  handleLogout: () => void;
  setSelectedTeacherCourseId: (id: string | null) => void;
  setSelectedQuiz: (quiz: any) => void;
  setExamState: (state: any) => void;
  setIsViewingHistory: (val: boolean) => void;
  setIsViewingQuizHistory: (val: boolean) => void;
  setViewingStudentScores: (val: boolean) => void;
  setIsManagingClasses: (val: boolean) => void;
  setReviewingQuiz: (quiz: any) => void;
  setEditingQuiz: (quiz: any) => void;
  handleDeleteQuiz: (id: string) => void;
  handlePublishQuiz: (quiz: any) => void;
  formatDeadline: (deadline: any) => string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  quizzes,
  submissions,
  userSubmissions,
  availableClasses,
  classes,
  studentStats,
  isViewingProfile,
  handleTabChange,
  handleLogout,
  setSelectedTeacherCourseId,
  setSelectedQuiz,
  setExamState,
  setIsViewingHistory,
  setIsViewingQuizHistory,
  setViewingStudentScores,
  setIsManagingClasses,
  setReviewingQuiz,
  setEditingQuiz,
  handleDeleteQuiz,
  handlePublishQuiz,
  formatDeadline
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6 p-4 md:p-8">
      {/* Welcome Banner / Profile Overview Toggle */}
      <div className="col-span-12 mb-2">
        {isViewingProfile ? (
          <ProfileOverview 
            user={user} 
            onEditProfile={() => navigate('/dashboard/settings')}
            onClose={() => navigate('/dashboard')}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div 
                onClick={() => navigate('/dashboard/profile')}
                className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 overflow-hidden shadow-sm cursor-pointer hover:scale-105 transition-transform"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-8 h-8 text-veritas-indigo" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome back, <span className="text-veritas-indigo">{user.full_name || user.username}</span>
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    user.role === 'TEACHER' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  )}>
                    {user.role}
                  </span>
                  <button 
                    onClick={() => navigate('/dashboard/profile')}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-veritas-indigo transition-colors flex items-center gap-1"
                  >
                    View Full Profile
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/dashboard/settings')}
                  className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-veritas-indigo hover:text-white transition-all group shadow-sm"
                  title="Account Settings"
                >
                  <Settings className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group shadow-sm"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {!isViewingProfile && (
        <div className="col-span-12 grid grid-cols-12 gap-6">
          {user.role === 'TEACHER' ? (
            <div className="col-span-12 space-y-8">
              <div className="portal-card shadow-sm">
                <div className="portal-card-header flex items-center justify-between">
                  <span>Teacher Dashboard</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-teal-100 uppercase font-bold tracking-widest">System Status: </span>
                    <span className="text-[10px] font-mono text-emerald-100 uppercase font-bold">Operational</span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div onClick={() => navigate('/create-quiz')} className="p-6 bg-white rounded-lg border border-slate-200 hover:border-veritas-indigo transition-all cursor-pointer group shadow-sm">
                      <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100 mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-veritas-indigo" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Create New Quiz</h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Design questions and assign to courses</p>
                    </div>
                    <div 
                      onClick={() => navigate('/dashboard/grading')}
                      className="p-6 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100 mb-4 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">View Student Scores</h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Monitor performance and integrity logs</p>
                    </div>
                    <div 
                      onClick={() => setIsManagingClasses(true)}
                      className="p-6 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100 mb-4 group-hover:scale-110 transition-transform">
                        <UserIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Manage Courses</h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Enroll students and organize groups</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-5 h-5 text-veritas-indigo" />
                  Recent Quizzes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.slice(0, 6).map(quiz => (
                    <div key={quiz.id} className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-veritas-indigo transition-all flex flex-col shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn("badge", quiz.status === 'DRAFT' ? "badge-slate" : "badge-teal")}>{quiz.status}</div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{quiz.courseCode}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-800 mb-4 tracking-tight leading-tight group-hover:text-veritas-indigo transition-colors">{quiz.title}</h4>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> {quiz.duration} Mins
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <UserIcon className="w-3 h-3" /> {quiz.questions?.length || 0} Questions
                        </div>
                      </div>
                      <button onClick={() => setReviewingQuiz(quiz)} className="mt-auto w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all">View Submissions</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <StudentStatsDashboard 
                quizzes={quizzes}
                submissions={submissions}
                onQuizSelect={(quiz) => {
                  setSelectedQuiz(quiz as any);
                  setExamState((prev: any) => ({ ...prev, status: 'idle' }));
                }}
                onViewHistory={() => navigate('/dashboard/history')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
