import React from 'react';
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
  ScanFace,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Table, TableRow, TableCell } from '../components/ui/Table';

export const StudentDashboard = ({ user }: { user: any }) => {
  const stats = [
    { label: 'Total Courses', value: '12', icon: BookOpen, color: 'bg-blue-50 text-blue-600', trend: '+2 this week' },
    { label: 'Completed Quizzes', value: '48', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', trend: '85% rate' },
    { label: 'Average Score', value: '92%', icon: BarChart3, color: 'bg-amber-50 text-amber-600', trend: 'Top 10%' },
    { label: 'Global Rank', value: '#124', icon: Trophy, color: 'bg-indigo-50 text-indigo-600', trend: 'Rising' },
  ];

  const courses = [
    { name: 'Advanced Mathematics', instructor: 'Dr. Sarah Wilson', progress: 75, lastActivity: '2 hours ago', status: 'Active' },
    { name: 'Introduction to Psychology', instructor: 'Prof. James Bond', progress: 45, lastActivity: 'Yesterday', status: 'Active' },
    { name: 'Computer Science 101', instructor: 'Alan Turing', progress: 90, lastActivity: '3 days ago', status: 'Active' },
    { name: 'World History', instructor: 'Dr. Emily White', progress: 20, lastActivity: '1 week ago', status: 'Inactive' },
  ];

  const deadlines = [
    { title: 'Math Quiz: Calculus', date: 'Mar 24, 2026', time: '10:00 AM', priority: 'high' },
    { title: 'Psychology Essay', date: 'Mar 26, 2026', time: '11:59 PM', priority: 'medium' },
    { title: 'CS Final Project', date: 'Apr 02, 2026', time: '09:00 AM', priority: 'low' },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Performance</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-veritas-indigo transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-veritas-indigo transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800 leading-none">{user?.full_name || user?.username}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</p>
            </div>
            <Avatar name={user?.full_name || user?.username} src={user?.profilePicture} className="rounded-xl" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-8 flex items-center justify-between bg-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <ScanFace className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800">Welcome back, <span className="text-indigo-600">{user?.full_name?.split(' ')[0] || user?.username}</span>!</h2>
                <div className="flex items-center gap-3">
                  <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100">● Student Account</Badge>
                  <p className="text-slate-400 text-sm font-medium">You have 2 upcoming exams this week.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all">View Profile</button>
              <button className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-200">Join Exam</button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'Total Assigned', value: '0', icon: BookOpen, trend: '+2 this week' },
            { label: 'Completed', value: '0', icon: CheckCircle2, trend: '85% rate' },
            { label: 'Pending', value: '0', icon: Clock, trend: '3 urgent' },
            { label: 'Avg. Score', value: '0%', icon: Trophy, trend: 'Top 10%' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                    <stat.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{stat.trend}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Upcoming Deadlines */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="h-full border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Upcoming Deadlines</h3>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </CardHeader>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-slate-200" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">All Caught Up!</h4>
                  <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">You have no upcoming deadlines. Great job staying on top of your work!</p>
                </div>
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
                    <span className="text-sm font-black text-indigo-600">0%</span>
                  </div>
                  <ProgressBar value={0} className="h-3 bg-slate-100" color="bg-indigo-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">0 of 0 quizzes completed</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Trophy className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Next Milestone</p>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Silver Badge</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                    <ProgressBar value={75} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1c23] text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <CardContent className="p-6 space-y-4 relative z-10">
                <h4 className="text-lg font-black tracking-tight">Need Help?</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Our support team is available 24/7 to assist you with any technical issues.</p>
                <button className="w-full py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all">Contact Support</button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
