import React from 'react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  BookOpen,
  Calendar,
  ArrowRight,
  ChevronRight,
  Target,
  TrendingUp,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../../lib/utils';

import { StudentStats } from '../../types';

interface StudentStatsDashboardProps {
  quizzes: any[];
  submissions: any[];
  stats?: StudentStats | null;
  onQuizSelect?: (quiz: any) => void;
  onViewHistory?: () => void;
}

export const StudentStatsDashboard: React.FC<StudentStatsDashboardProps> = ({ quizzes, submissions, stats, onQuizSelect, onViewHistory }) => {
  // Use useMemo to calculate stats and pending list consistently from the data
  const { pendingQuizzes, calculatedStats, recentResults, mostUrgentQuiz } = React.useMemo(() => {
    // 1. Identify completed quizzes (submitted or graded)
    const completedIds = new Set(
      submissions
        .filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED')
        .map(s => s.quizId)
    );

    // 2. Filter pending quizzes
    const now = new Date();
    const pending = quizzes
      .filter(q => {
        const isCompleted = completedIds.has(q.id);
        const isDeleted = q.status === 'DELETED';
        const deadline = new Date(q.deadline);
        const isUpcoming = deadline.getTime() > (now.getTime() - 24 * 60 * 60 * 1000); 
        return !isCompleted && !isDeleted && isUpcoming;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    // 3. Calculate stats
    const total = quizzes.length;
    const completed = completedIds.size;
    const pendingCount = total - completed;

    // 4. Average score and recent results
    const latestSubs = submissions.reduce((acc: Map<number, any>, s: any) => {
      if (s.status === 'SUBMITTED' || s.status === 'GRADED') {
        const existing = acc.get(s.quizId);
        if (!existing || new Date(s.submittedAt) > new Date(existing.submittedAt)) {
          acc.set(s.quizId, s);
        }
      }
      return acc;
    }, new Map<number, any>());

    const latestSubsArray = Array.from(latestSubs.values()) as any[];
    latestSubsArray.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    const results = latestSubsArray.slice(-5).map((s, i) => ({
      name: `Quiz ${i + 1}`,
      score: Math.round(((Number(s.score) || 0) / (Number(s.totalScore) || 1)) * 100),
      date: new Date(s.submittedAt).toLocaleDateString()
    }));

    let totalPercentage = 0;
    latestSubsArray.forEach((s: any) => {
      const score = Number(s.score) || 0;
      const totalScore = Number(s.totalScore) || 1;
      totalPercentage += (score / totalScore);
    });
    const avg = latestSubsArray.length > 0
      ? (totalPercentage / latestSubsArray.length) * 100
      : 0;

    return {
      pendingQuizzes: pending,
      mostUrgentQuiz: pending[0] || null,
      recentResults: results,
      calculatedStats: {
        totalAssigned: total,
        completedCount: completed,
        pendingCount: pendingCount,
        averageScore: avg
      }
    };
  }, [quizzes, submissions]);

  const displayStats = stats || calculatedStats;
  const totalAssigned = displayStats.totalAssigned;
  const completedCount = displayStats.completedCount;
  const averageScore = displayStats.averageScore;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Main Content Area (8/12 = 2/3) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Quick Action: Continue Learning */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-300 border border-emerald-500/30">
                <PlayCircle className="w-3 h-3" /> Recommended Action
              </div>
              {mostUrgentQuiz ? (
                <>
                  <h2 className="text-3xl font-bold tracking-tight">Continue Learning</h2>
                  <p className="text-slate-400 text-sm max-w-md">
                    Your next quiz <span className="text-white font-bold">"{mostUrgentQuiz.title}"</span> is due soon. 
                    Stay on track with your academic goals.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold tracking-tight">All Caught Up!</h2>
                  <p className="text-slate-400 text-sm max-w-md">
                    You have completed all your assigned quizzes. Great job maintaining your progress!
                  </p>
                </>
              )}
            </div>
            {mostUrgentQuiz && (
              <button 
                onClick={() => onQuizSelect?.(mostUrgentQuiz)}
                className="group flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-lg shadow-white/5"
              >
                Start Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Learning Progress Section */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Course Progress</h3>
              <p className="text-xs text-slate-500 font-medium">Overall completion across all enrolled modules</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-emerald-600">
                {totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Completion Rate</span>
                  <span>{completedCount} / {totalAssigned} Quizzes</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0}%` }}
                    className="h-full bg-emerald-600 rounded-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Score</p>
                  <p className="text-xl font-bold text-slate-900">{averageScore.toFixed(0)}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Time</p>
                  <p className="text-xl font-bold text-slate-900">{completedCount * 30}m</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center border-l border-slate-100 pl-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeDasharray="100, 100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0}, 100` }}
                    className="text-emerald-600"
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{completedCount}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Done</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance Insights Chart */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Performance Insights</h3>
              <p className="text-xs text-slate-500 font-medium">Score trends from your last 5 attempts</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          
          <div className="h-64 w-full">
            {recentResults.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentResults}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <TrendingUp className="w-10 h-10 opacity-20" />
                <p className="text-xs font-medium">Complete more quizzes to see performance trends</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sidebar Area (4/12 = 1/3) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Upcoming Deadlines List */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Upcoming Deadlines
            </h3>
            {onViewHistory && (
              <button onClick={onViewHistory} className="text-[10px] font-bold text-emerald-600 hover:underline">
                View All
              </button>
            )}
          </div>

          <div className="space-y-4">
            {pendingQuizzes.length > 0 ? (
              pendingQuizzes.slice(0, 5).map((quiz) => {
                const deadline = new Date(quiz.deadline);
                const diffDays = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = diffDays <= 2;

                return (
                  <div 
                    key={quiz.id} 
                    onClick={() => onQuizSelect?.(quiz)}
                    className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{quiz.title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">{quiz.courseCode || 'General Class'}</p>
                      </div>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                        isUrgent ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {isUrgent ? 'Urgent' : 'Normal'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-medium">
                        Due in {diffDays <= 0 ? 'today' : `${diffDays} days`}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No pending tasks</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats / Achievements */}
        <motion.div variants={itemVariants} className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Academic Achievement</h3>
              <p className="text-[10px] text-emerald-100">Your current standing</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-100">Average Score</span>
              <span className="text-lg font-bold">{averageScore.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-100">Quizzes Completed</span>
              <span className="text-lg font-bold">{completedCount}</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                <Target className="w-3 h-3" /> Keep it up!
              </div>
            </div>
          </div>
        </motion.div>

        {/* Support Card */}
        <motion.div variants={itemVariants} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 mb-2">Need Help?</h3>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
            If you encounter any issues with your examinations or need technical support, our team is here to help.
          </p>
          <button className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
            Contact Support <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

