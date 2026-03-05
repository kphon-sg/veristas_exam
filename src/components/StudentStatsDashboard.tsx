import React from 'react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface StudentStatsDashboardProps {
  quizzes: any[];
  submissions: any[];
}

export const StudentStatsDashboard: React.FC<StudentStatsDashboardProps> = ({ quizzes, submissions }) => {
  // Ensure we only count submissions for the quizzes currently being displayed
  const relevantSubmissions = submissions.filter(s => quizzes.some(q => q.id === s.quizId));

  // Get unique quiz IDs that have been submitted among the relevant quizzes
  const submittedQuizIds = new Set(relevantSubmissions.map(s => s.quizId));

  // Calculate metrics
  const totalAssigned = quizzes.length;
  const completedCount = submittedQuizIds.size;
  const pendingCount = quizzes.filter(q => {
    const hasSubmitted = submittedQuizIds.has(q.id);
    const isExpired = new Date(q.deadline) < new Date();
    return !hasSubmitted && !isExpired;
  }).length;

  // For average score, we should probably take the latest submission per quiz if duplicates exist,
  // or just average all relevant submissions. Given the user's focus on "Completed" count,
  // let's ensure the count is correct first.
  const averageScore = relevantSubmissions.length > 0
    ? (relevantSubmissions.reduce((acc, s) => acc + (s.score / (s.totalScore || 1)), 0) / relevantSubmissions.length) * 100
    : 0;

  // Upcoming deadlines (next 6)
  const upcomingDeadlines = quizzes
    .filter(q => {
      const hasSubmitted = submittedQuizIds.has(q.id);
      const deadline = new Date(q.deadline);
      return !hasSubmitted && deadline > new Date();
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assigned', value: totalAssigned, icon: BookOpen, color: 'text-portal-600', bg: 'bg-portal-50' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Avg. Score', value: `${averageScore.toFixed(0)}%`, icon: Trophy, color: 'text-portal-500', bg: 'bg-portal-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-4 shadow-sm"
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", stat.bg, stat.bg.replace('bg-', 'border-'))}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">{stat.label}</div>
              <div className="text-xl font-black text-slate-800 font-mono">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div 
          variants={itemVariants}
          className="portal-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 font-bold">
              <Calendar className="w-4 h-4 text-amber-500" /> Upcoming Deadlines
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Urgent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Normal</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((quiz, i) => {
                const deadline = new Date(quiz.deadline);
                const diffDays = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={quiz.id} className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-3 group hover:border-portal-300 transition-all hover:translate-y-[-2px] shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-black text-slate-800 block truncate max-w-[150px]">{quiz.title}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">{quiz.classId}</span>
                      </div>
                      <span className={cn("badge", diffDays <= 2 ? "badge-rose" : "badge-amber")}>
                        {diffDays <= 0 ? 'Today' : `${diffDays}d left`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 font-bold">
                        <Clock className="w-3 h-3" />
                        {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 font-bold">
                        <BookOpen className="w-3 h-3" />
                        {quiz.questions?.length || 0} Qs
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-300">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-40">All caught up!</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Course Completion Progress</span>
                <p className="text-[9px] text-slate-500 font-medium">Based on assigned quizzes for this course</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-portal-600 font-mono">
                  {totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0}%
                </span>
                <div className="text-[9px] font-mono text-slate-400 uppercase font-bold">{completedCount} / {totalAssigned} Completed</div>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0}%` }}
                className="h-full bg-gradient-to-r from-portal-500 to-portal-700 shadow-[0_0_10px_rgba(var(--color-portal-500-rgb),0.3)]"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
