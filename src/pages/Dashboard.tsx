import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Activity, 
  User, 
  Plus, 
  ChevronRight, 
  Clock, 
  Timer, 
  AlertCircle,
  Search,
  CheckCircle,
  ChevronLeft,
  Loader2,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StudentStatsDashboard } from '../components/dashboard/StudentStatsDashboard';

interface DashboardProps {
  user: any;
  quizzes: any[];
  submissions: any[];
  studentStats: any;
  availableClasses: any[];
  classes: any[];
  navigate: (path: string) => void;
  setSelectedCourseId: (id: string | null) => void;
  setViewingStudentScores: (view: boolean) => void;
  setIsManagingClasses: (view: boolean) => void;
  setReviewingQuiz: (quiz: any) => void;
  setSelectedTeacherCourseId: (id: string | null) => void;
  selectedTeacherCourseId: string | null;
  formatDeadline: (date: any) => string;
  handleDeleteQuiz: (id: string) => void;
  handlePublishQuiz: (quiz: any) => void;
  setEditingQuiz: (quiz: any) => void;
  selectedCourseId: string | null;
  userSubmissions: any[];
  isExpired: (date: any) => boolean;
  currentTime: Date;
  setSelectedQuiz: (quiz: any) => void;
  setExamState: (state: any) => void;
  setIsSettingUp: (view: boolean) => void;
  setIsCameraActive: (view: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  quizzes,
  submissions,
  studentStats,
  availableClasses,
  classes,
  navigate,
  setSelectedCourseId,
  setViewingStudentScores,
  setIsManagingClasses,
  setReviewingQuiz,
  setSelectedTeacherCourseId,
  selectedTeacherCourseId,
  formatDeadline,
  handleDeleteQuiz,
  handlePublishQuiz,
  setEditingQuiz,
  selectedCourseId,
  userSubmissions,
  isExpired,
  currentTime,
  setSelectedQuiz,
  setExamState,
  setIsSettingUp,
  setIsCameraActive,
}) => {
  if (user.role === 'TEACHER') {
    return (
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
                onClick={() => navigate('/scores')}
                className="p-6 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer group shadow-sm"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100 mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">View Student Scores</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Monitor performance and integrity logs</p>
              </div>
              <div 
                onClick={() => navigate('/classes')}
                className="p-6 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition-all cursor-pointer group shadow-sm"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100 mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-amber-500" />
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
                    <User className="w-3 h-3" /> {quiz.questions?.length || 0} Questions
                  </div>
                </div>
                <button onClick={() => setReviewingQuiz(quiz)} className="mt-auto w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all">View Submissions</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 space-y-8">
      <StudentStatsDashboard 
        quizzes={quizzes}
        submissions={userSubmissions}
        onQuizSelect={(quiz) => {
          setSelectedQuiz(quiz as any);
          setExamState({ title: quiz.title, duration: quiz.duration, remainingTime: quiz.duration * 60, status: 'idle' });
        }}
        onViewHistory={() => navigate('/history')}
      />
    </div>
  );
};

export default Dashboard;
