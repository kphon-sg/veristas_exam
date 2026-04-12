import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { 
  BookOpen, 
  CheckCircle2, 
  Trophy, 
  BarChart3, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronRight,
  Bell,
  Search,
  ArrowUpRight,
  MoreHorizontal,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
  GraduationCap,
  MapPin,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Table, TableRow, TableCell } from '../components/ui/Table';

import { useParams, useNavigate } from 'react-router-dom';

export const StudentDashboard = ({ user: authUser, onQuizSelect }: { user: any, onQuizSelect?: (quiz: any) => void }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [quizFilter, setQuizFilter] = useState<'all' | 'pending' | 'completed' | 'graded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completedCount: 0,
    pendingCount: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('veritas_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Dashboard Overview (Profile)
        const overviewRes = await fetch('/api/student/dashboard-overview', { headers });
        const overviewData = await overviewRes.json();
        if (overviewData.profile) setProfile(overviewData.profile);

        // 2. Fetch Dashboard Stats
        const statsRes = await fetch('/api/student/dashboard-stats', { headers });
        const statsData = await statsRes.json();
        if (!statsData.error) setStats(statsData);

        // 3. Fetch All Quizzes for the student
        const quizzesRes = await fetch(`/api/quizzes?studentId=${authUser.id}`, { headers });
        const quizzesData = await quizzesRes.json();
        setAllQuizzes(quizzesData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (authUser?.id) {
      fetchData();
    }
  }, [authUser]);

  const statCards = [
    { label: 'Total Assigned', value: stats.totalAssigned || 0, icon: BookOpen, trend: 'All quizzes', filter: 'all' },
    { label: 'Completed', value: stats.completedCount || 0, icon: CheckCircle2, trend: `${stats.totalAssigned > 0 ? Math.round((stats.completedCount / stats.totalAssigned) * 100) : 0}% rate`, filter: 'completed' },
    { label: 'Pending', value: stats.pendingCount || 0, icon: Clock, trend: `${stats.pendingCount || 0} urgent`, filter: 'pending' },
    { label: 'Avg. Score', value: `${stats.averageScore || 0}%`, icon: Trophy, trend: 'Overall', filter: 'graded' },
  ];

  const filteredQuizzes = allQuizzes.filter(q => {
    const matchesFilter = quizFilter === 'all' 
      ? true 
      : quizFilter === 'completed' 
        ? q.completionStatus === 'completed'
        : quizFilter === 'graded'
          ? (q.completionStatus === 'completed' && q.submissionScore !== null)
          : (q.completionStatus === 'pending' || q.completionStatus === 'overdue');
    
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.courseCode || q.course_code || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-400 outline-none transition-all w-64 font-bold shadow-sm"
            />
          </div>
          <button 
            onClick={() => {
              setQuizFilter('all');
              setSearchQuery('');
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl transition-all",
              quizFilter === 'all' && !searchQuery ? "border-emerald-500 text-emerald-600 shadow-sm" : "border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-500"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-bold">All Quizzes</span>
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800 leading-none">{profile?.fullName || authUser?.full_name || authUser?.username}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</p>
            </div>
            <Avatar name={profile?.fullName || authUser?.full_name || authUser?.username} src={profile?.profilePicture || authUser?.profilePicture} className="rounded-xl" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner & Profile Info */}
        <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Avatar Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200 flex-shrink-0 overflow-hidden relative group border border-white/20 ring-1 ring-white/20 ring-inset">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (authUser?.role === 'TEACHER' || profile?.role === 'TEACHER') ? (
                    <ShieldCheck strokeWidth={1.5} className="w-12 h-12 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <GraduationCap strokeWidth={1.5} className="w-12 h-12 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-500" />
                  )
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex-1 w-full space-y-6">
                {/* Top Row: Badge */}
                <div className="flex items-center justify-between md:justify-start">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 shadow-sm">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      (authUser?.role === 'TEACHER' || profile?.role === 'TEACHER') ? "bg-amber-400" : "bg-emerald-500"
                    )} />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">
                      {(authUser?.role === 'TEACHER' || profile?.role === 'TEACHER') ? 'Teacher Account' : 'Student Account'}
                    </span>
                  </div>
                </div>
                
                {/* Info Bar: Horizontal Layout with Dividers */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-0">
                  {/* Student ID */}
                  <div className="flex items-center gap-4 flex-1 min-w-[140px]">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                      <UserIcon className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Student ID</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{profile?.studentCode || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="hidden md:block h-10 w-px bg-slate-100 mx-8" />

                  {/* Department */}
                  <div className="flex items-center gap-4 flex-1 min-w-[180px]">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                      <GraduationCap className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{profile?.department || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="hidden md:block h-10 w-px bg-slate-100 mx-8" />

                  {/* Age / Year */}
                  <div className="flex items-center gap-4 flex-1 min-w-[140px]">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                      <Calendar className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Age / Year</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        {profile?.age && profile.age !== 'N/A' ? `${profile.age} yrs` : ''} 
                        {profile?.yearOfStudy && profile.yearOfStudy !== 'N/A' ? ` (Y${profile.yearOfStudy})` : ''}
                        {(!profile?.age || profile.age === 'N/A') && (!profile?.yearOfStudy || profile.yearOfStudy === 'N/A') ? 'N/A' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block h-10 w-px bg-slate-100 mx-8" />

                  {/* Location */}
                  <div className="flex items-center gap-4 flex-1 min-w-[120px]">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                      <MapPin className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{profile?.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Card 
              key={i} 
              onClick={() => {
                if (stat.filter === 'all' || stat.filter === 'pending' || stat.filter === 'completed' || stat.filter === 'graded') {
                  setQuizFilter(stat.filter as any);
                }
              }}
              className={cn(
                "border-none shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
                (stat.filter === quizFilter) && "ring-2 ring-emerald-500 ring-offset-2"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors",
                    (stat.filter === quizFilter) ? "bg-emerald-600 text-white" : "bg-white border border-slate-100 text-emerald-600"
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    (stat.filter === quizFilter) ? "text-emerald-600" : "text-slate-400"
                  )}>{stat.trend}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Quizzes List */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="h-full border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-800 tracking-tight">
                    {quizFilter === 'all' ? 'All Quizzes' : quizFilter === 'completed' ? 'Completed Quizzes' : quizFilter === 'graded' ? 'Exam Results' : 'Pending Quizzes'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setQuizFilter('all');
                    setSearchQuery('');
                  }}
                  className={cn(
                    "text-xs font-bold flex items-center gap-1 transition-colors",
                    quizFilter === 'all' && !searchQuery ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"
                  )}
                >
                  All Quizzes <ChevronRight className="w-3 h-3" />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {filteredQuizzes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table headers={['Quiz Title', 'Course', 'Duration', quizFilter === 'graded' ? 'Score' : 'Deadline', 'Action']}>
                      {filteredQuizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <p className="text-sm font-bold text-slate-800">{quiz.title}</p>
                              {quiz.completionStatus === 'overdue' && (
                                <span className="text-[10px] font-bold text-rose-500 uppercase">Missed / Expired</span>
                              )}
                              {quiz.completionStatus === 'completed' && (
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Completed</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">
                              {quiz.courseCode || quiz.course_code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">{quiz.durationMinutes || quiz.duration_minutes}m</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {quizFilter === 'graded' ? (
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-black text-emerald-600">
                                  {quiz.submissionScore}/{quiz.totalScore}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  ({Math.round((quiz.submissionScore / quiz.totalScore) * 100)}%)
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs font-bold text-slate-600">
                                {new Date(quiz.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {quiz.completionStatus === 'completed' ? (
                              <div className="flex items-center justify-end">
                                {quiz.submissionScore !== null ? (
                                  <span className="text-emerald-600 font-black text-xs uppercase tracking-wider">Graded</span>
                                ) : (
                                  <span className="text-amber-500 font-black text-xs uppercase tracking-wider">Not Graded</span>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  if (quiz.completionStatus !== 'overdue') {
                                    navigate(`/exam/setup/${quiz.id}`);
                                  }
                                }}
                                disabled={quiz.completionStatus === 'overdue'}
                                className={`${quiz.completionStatus === 'overdue' ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'} font-black text-xs uppercase tracking-wider flex items-center gap-1 ml-auto`}
                              >
                                {quiz.completionStatus === 'overdue' ? 'Closed' : 'Start'} <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </Table>
                  </div>
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">All Caught Up!</h4>
                      <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">You have no pending quizzes. Great job staying on top of your work!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Widgets */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Your Progress</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Completion</span>
                    <span className="text-sm font-black text-emerald-600">
                      {stats.totalAssigned > 0 ? Math.round((stats.completedCount / stats.totalAssigned) * 100) : 0}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={stats.totalAssigned > 0 ? (stats.completedCount / stats.totalAssigned) * 100 : 0} 
                    className="h-3 bg-slate-100" 
                    color="bg-emerald-600" 
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {stats.completedCount} of {stats.totalAssigned} quizzes completed
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Trophy className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Next Milestone</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Silver Badge</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                    <ProgressBar value={75} className="h-1.5" color="bg-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1c23] text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <CardContent className="p-6 space-y-4 relative z-10">
                <h4 className="text-lg font-black tracking-tight">Need Help?</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Our support team is available 24/7 to assist you with any technical issues.</p>
                <button className="w-full py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-emerald-600/20 hover:text-emerald-400 transition-all">Contact Support</button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

