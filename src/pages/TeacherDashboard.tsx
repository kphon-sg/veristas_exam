import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ClipboardList, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Bell, 
  MoreHorizontal,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  ScanFace,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { cn } from '../lib/utils';

export const TeacherDashboard = ({ user }: { user: any }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeQuizzes: 0,
    pendingSubmissions: 0,
    classPerformance: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Stats
        const statsRes = await fetch('/api/teacher/stats', { headers });
        const statsData = await statsRes.json();
        if (!statsData.error) setStats(statsData);

        // Fetch Recent Submissions
        const recentRes = await fetch(`/api/teacher/submissions?teacherId=${user?.id}&limit=5`, { headers });
        const recentData = await recentRes.json();
        if (!recentData.error) setRecentSubmissions(recentData);

        // Fetch Performance Data (Graded)
        const perfRes = await fetch(`/api/teacher/submissions?teacherId=${user?.id}&status=GRADED`, { headers });
        const perfData = await perfRes.json();
        if (!perfData.error) setPerformanceData(perfData);

      } catch (error) {
        console.error("Error fetching teacher dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const analytics = [
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Enrolled in your courses' },
    { label: 'Active Quizzes', value: stats.activeQuizzes.toString(), icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Currently published' },
    { label: 'Pending Submissions', value: stats.pendingSubmissions.toString(), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Needs review' },
    { label: 'Class Performance', value: `${stats.classPerformance}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Average score' },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Teacher Dashboard</h1>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</p>
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
              <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <ScanFace className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800">Welcome back, <span className="text-emerald-600">{user?.full_name?.split(' ')[0] || 'Teacher'}!</span></h2>
                <div className="flex items-center gap-3">
                  <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-100">● Teacher Account</Badge>
                  <p className="text-slate-400 text-sm font-medium">You have {stats.activeQuizzes} active quizzes this week.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all">View Profile</button>
              <button className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-200">Create Quiz</button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {analytics.map((item, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl", item.bg)}>
                    <item.icon className={cn("w-6 h-6", item.color)} />
                  </div>
                  <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 mb-1">{item.value}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {item.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Recent Submissions */}
          <div className="col-span-12 lg:col-span-7">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Submissions</h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {recentSubmissions.length > 0 ? recentSubmissions.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <Avatar name={sub.studentName} size="sm" className="rounded-xl" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{sub.studentName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.quizTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={sub.status === 'GRADED' ? 'success' : 'warning'}>
                        {sub.status === 'GRADED' ? `${Math.round((sub.score / sub.total_score) * 100)}%` : 'Pending'}
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-400 font-medium">No recent submissions</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Monitoring */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="h-full border-none shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Monitoring</h3>
              </CardHeader>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <Monitor className="w-10 h-10 text-slate-200" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">No Active Exams</h4>
                  <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">There are currently no live examinations being proctored.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Student Performance Table */}
        <Card variant="paper" className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Student Performance</h3>
              <p className="text-xs font-medium text-slate-400">Detailed tracking of all student quiz attempts</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-200">
                <Plus className="w-4 h-4" />
                Create Quiz
              </button>
            </div>
          </CardHeader>
          <Table headers={['Student Name', 'Student ID', 'Last Attempt', 'Score', 'Status', 'Actions']}>
            {performanceData.length > 0 ? performanceData.map((student, i) => {
              const scorePercent = Math.round((student.score / student.total_score) * 100);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={student.studentName} size="sm" />
                      <div>
                        <p className="font-bold text-slate-800">{student.studentName}</p>
                        <p className="text-xs text-slate-400">{student.studentCode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-400">{student.studentCode}</TableCell>
                  <TableCell className="font-medium text-slate-600">{new Date(student.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            scorePercent >= 90 ? "bg-emerald-500" : 
                            scorePercent >= 70 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{scorePercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'GRADED' ? 'success' : 'warning'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">No performance data available</TableCell>
              </TableRow>
            )}
          </Table>
        </Card>
      </div>
    </div>
  );
};

