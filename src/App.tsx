import React, { useState, useEffect, useCallback } from 'react';
import { 
  Timer, 
  User, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Monitor,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { WebcamMonitor } from './components/WebcamMonitor';
import { EventLog } from './components/EventLog';
import { StudentStatsDashboard } from './components/StudentStatsDashboard';
import { QuizCreator } from './components/QuizCreator';
import { SubmissionReview } from './components/SubmissionReview';
import { StudentScoresView } from './components/StudentScoresView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPortal } from './components/LoginPortal';
import { ManageClasses } from './components/ManageClasses';
import { ActivityHistory } from './components/ActivityHistory';
import { NotificationCenter } from './components/NotificationCenter';
import { MonitoringEvent, ExamState } from './types';
import { cn } from './lib/utils';
import { 
  Search,
  Plus,
  ArrowRight,
  Globe,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface Question {
  id?: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  options: string[];
  correctAnswer: number | null;
  points: number;
}

interface Quiz {
  id: number;
  title: string;
  duration: number;
  classId: number;
  courseCode?: string;
  courseName?: string;
  teacherId: number;
  deadline: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'DELETED';
  questions: Question[];
}

export default function App() {
  const [user, setUser] = useState<{ id: number; username: string; studentCode?: string; role: string; classId: number; full_name?: string } | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [examState, setExamState] = useState<ExamState>({
    title: "",
    duration: 30,
    remainingTime: 1800,
    status: 'idle'
  });
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [reviewingQuiz, setReviewingQuiz] = useState<Quiz | null>(null);
  const [viewingStudentScores, setViewingStudentScores] = useState(false);
  const [isManagingClasses, setIsManagingClasses] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [isSearchingCourse, setIsSearchingCourse] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseSearchResults, setCourseSearchResults] = useState<any[]>([]);
  const [searchingCourses, setSearchingCourses] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loginData, setLoginData] = useState({ studentId: '', password: '' });
  const [loginType, setLoginType] = useState<'TEACHER' | 'STUDENT'>('STUDENT');

  // Update current time for countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch available classes for student
  const fetchAvailableClasses = useCallback(() => {
    if (user) {
      const url = user.role === 'STUDENT' 
        ? `/api/classes?studentId=${user.id}` 
        : '/api/classes';
      
      fetch(url)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const classList = Array.isArray(data) ? data : [];
          if (user.role === 'STUDENT') {
            setAvailableClasses(classList);
          } else {
            setClasses(classList);
          }
        })
        .catch(err => console.error("[AUTH] Error fetching classes:", err));
    }
  }, [user]);

  useEffect(() => {
    fetchAvailableClasses();
  }, [fetchAvailableClasses]);

  const handleSearchCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (courseSearchQuery.length < 2) return;
    
    setSearchingCourses(true);
    try {
      const res = await fetch(`/api/classes/search-available?query=${encodeURIComponent(courseSearchQuery)}&studentId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setCourseSearchResults(data);
      }
    } catch (err) {
      console.error("Error searching courses:", err);
    } finally {
      setSearchingCourses(false);
    }
  };

  const handleJoinRequest = async (courseId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/classes/${courseId}/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id })
      });
      if (res.ok) {
        alert("Join request sent successfully!");
        handleSearchCourses({ preventDefault: () => {} } as any);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send join request");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
    }
  };

  // Fetch quizzes and submissions
  const loadQuizzes = useCallback(() => {
    if (user) {
      // For students, also fetch available classes to keep "My Courses" updated
      if (user.role === 'STUDENT') {
        fetch(`/api/classes?studentId=${user.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            const classList = Array.isArray(data) ? data : [];
            setAvailableClasses(classList);
          })
          .catch(err => console.error("[AUTH] Error fetching classes:", err));
      }

      // For students, only fetch if a course is selected
      if (user.role === 'STUDENT' && !selectedCourseId) {
        setQuizzes([]);
        setUserSubmissions([]);
        return;
      }

      const url = user.role === 'STUDENT' 
        ? `/api/quizzes?classId=${selectedCourseId}` 
        : `/api/quizzes?teacherId=${user.id}`;
      
      fetch(url)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const quizList = Array.isArray(data) ? data : [];
          if (user.role === 'STUDENT' && examState.status === 'running' && selectedQuiz) {
            const stillExists = quizList.some((q: any) => q.id === selectedQuiz.id);
            if (!stillExists) {
              setExamState(prev => ({ ...prev, status: 'idle' }));
              setIsMonitoring(false);
              setIsCameraActive(false);
              setSelectedQuiz(null);
              alert("This quiz has been removed by the teacher.");
            }
          }
          setQuizzes(quizList);
        })
        .catch(err => console.error("[QUIZ] Error fetching quizzes:", err));

      if (user.role === 'STUDENT' && selectedCourseId) {
        fetch(`/api/submissions?studentId=${user.id}&classId=${selectedCourseId}`)
          .then(res => res.json())
          .then(data => {
            const subs = Array.isArray(data) ? data : [];
            setUserSubmissions(subs);
          })
          .catch(err => console.error("[QUIZ] Error fetching student submissions:", err));
      }
    }
  }, [user, selectedCourseId, examState.status, selectedQuiz]);

  useEffect(() => {
    loadQuizzes();
    let interval: any;
    if (user && user.role === 'STUDENT') {
      interval = setInterval(loadQuizzes, 10000);
    }
    return () => clearInterval(interval);
  }, [loadQuizzes, user]);

  useEffect(() => {
    if (location.pathname === '/create-quiz' && user?.role === 'TEACHER') {
      setIsCreatingQuiz(true);
    } else if (location.pathname === '/') {
      setIsCreatingQuiz(false);
    }
  }, [location.pathname, user]);

  const handleSaveQuiz = async (quizData: any) => {
    console.log("[App] handleSaveQuiz called with:", quizData);
    try {
      const isEdit = !!quizData.id;
      const url = isEdit ? `/api/quizzes/${quizData.id}` : '/api/quizzes';
      const method = isEdit ? 'PUT' : 'POST';

      console.log(`[App] Sending ${method} request to ${url}`);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });
      if (res.ok) {
        console.log("[App] Quiz saved successfully");
        alert("Quiz saved successfully!");
        loadQuizzes();
        setIsCreatingQuiz(false);
        setEditingQuiz(null);
        navigate('/');
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
        console.error("[App] Failed to save quiz:", err);
        alert(`Failed to save quiz: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("[App] Network error while saving quiz:", err);
      alert("Network error while saving quiz.");
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) loadQuizzes();
    } catch (err) {
      console.error("Error deleting quiz:", err);
    }
  };

  const handlePublishQuiz = async (quiz: Quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quiz, status: 'PUBLISHED' })
      });
      if (res.ok) loadQuizzes();
    } catch (err) {
      console.error("Error publishing quiz:", err);
    }
  };

  const handleQuizSubmission = async () => {
    if (!selectedQuiz || !user) return;

    if (!confirm("Are you sure you want to finish the examination? Your answers will be submitted and you won't be able to change them.")) {
      return;
    }

    const submission = {
      quizId: selectedQuiz.id,
      studentId: user.id,
      startTime: examState.startTime,
      browserInfo: navigator.userAgent,
      ipAddress: "127.0.0.1",
      answers: selectedQuiz.questions.map((q, idx) => ({
        questionId: q.id,
        answerText: q.type === 'ESSAY' ? (answers[idx] || "") : null,
        selectedOption: q.type === 'MULTIPLE_CHOICE' ? (answers[idx] !== undefined ? answers[idx] : null) : null
      }))
    };

    console.log("[App] Submitting quiz answers:", submission);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      if (res.ok) {
        const result = await res.json();
        console.log("[App] Submission successful:", result);
        setExamState(prev => ({ ...prev, status: 'finished' }));
        setIsMonitoring(false);
        setIsCameraActive(false);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        console.error("[App] Submission failed:", errorData);
        alert(`Submission failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("[App] Network error during submission:", err);
      alert("Network error: Could not submit the examination. Please check your connection or contact support.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginData.studentId,
          password: loginData.password,
          loginType: loginType
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data);
        // Show welcome message
        alert(`Welcome ${data.full_name}`);
      } else {
        // Handle specific error messages from backend
        alert(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Could not connect to server");
    }
  };

  const handleDetection = useCallback((type: string) => {
    if (examState.status !== 'running') return;

    const messages: Record<string, { msg: string; severity: 'low' | 'medium' | 'high' }> = {
      face_missing: { msg: "No face detected in webcam stream.", severity: 'high' },
      multiple_faces: { msg: "Multiple faces detected in frame.", severity: 'high' },
      looking_away: { msg: "Student is looking away from the screen.", severity: 'medium' },
      tab_switch: { msg: "Browser tab switch detected.", severity: 'high' },
      app_blur: { msg: "Application lost focus.", severity: 'medium' }
    };

    const event: MonitoringEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: type as any,
      message: messages[type]?.msg || "Suspicious behavior detected.",
      severity: messages[type]?.severity || 'medium'
    };

    setEvents(prev => [event, ...prev].slice(0, 50));

    if (user) {
      fetch('/api/exam/report-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          type: event.type,
          message: event.message,
          severity: event.severity
        })
      }).catch(err => console.error("Error reporting violation:", err));
    }
  }, [user, examState.status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMonitoring) handleDetection('tab_switch');
    };
    const handleBlur = () => {
      if (isMonitoring) handleDetection('app_blur');
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isMonitoring, handleDetection]);

  useEffect(() => {
    let timer: any;
    if (examState.status === 'running') {
      timer = setInterval(() => {
        setExamState(prev => {
          const newTime = Math.max(0, prev.remainingTime - 1);
          if (newTime === 0 && prev.status === 'running') handleQuizSubmission();
          return { ...prev, remainingTime: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examState.status]);

  const startExam = async () => {
    if (!selectedQuiz || !user) return;
    
    try {
      await fetch(`/api/quizzes/${selectedQuiz.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id })
      });
    } catch (err) {
      console.error("Error logging quiz start:", err);
    }

    setIsMonitoring(true);
    setExamState(prev => ({ 
      ...prev, 
      status: 'running',
      startTime: new Date().toISOString()
    }));
  };

  const isExpired = (deadline: string) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    return !isNaN(d.getTime()) && d < new Date();
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return "No deadline set";
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ErrorBoundary>
      {!user ? (
        <LoginPortal 
          onLogin={handleLogin} 
          loginData={loginData as any} 
          setLoginData={setLoginData} 
          loginType={loginType}
          setLoginType={setLoginType}
        />
      ) : (
        <div className="min-h-screen bg-[#f4f7f9] text-slate-800 font-sans selection:bg-veritas-indigo/20">
          <nav className="h-16 border-b border-white/10 bg-gradient-to-r from-veritas-deep to-veritas-indigo flex items-center justify-between px-6 sticky top-0 z-50 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-tight">VeritasExam</h1>
                <p className="text-[9px] font-mono text-teal-100/60 uppercase tracking-widest font-bold">Secure Monitoring System v2.4.0</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                {user && <NotificationCenter user={user} onUpdate={fetchAvailableClasses} />}
                {examState.status === 'running' && (
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-teal-100 uppercase font-bold">Remaining Time</div>
                    <div className={cn(
                      "text-lg font-mono font-black tabular-nums text-white",
                      examState.remainingTime < 300 && "text-rose-200 animate-pulse"
                    )}>
                      {formatTime(examState.remainingTime)}
                    </div>
                  </div>
                )}
                <div className="h-8 w-px bg-teal-400/30" />
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-[10px] font-mono text-teal-100 uppercase font-bold">{user.role} Profile</div>
                    <div className="text-xs font-black text-white font-mono">{user.full_name || user.username}</div>
                  </div>
                  <button 
                    onClick={() => {
                      setUser(null);
                      setExamState({ title: "", duration: 30, remainingTime: 1800, status: 'idle' });
                      setSelectedQuiz(null);
                      setIsCameraActive(false);
                      setIsMonitoring(false);
                      navigate('/');
                    }}
                    className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all group shadow-sm active:scale-95"
                  >
                    <LogOut className="w-5 h-5 text-white group-hover:text-rose-200 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <main className="p-6 max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
            {/* Welcome Banner */}
            <div className="col-span-12 mb-2">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
                    <User className="w-6 h-6 text-veritas-indigo" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Welcome, <span className="text-veritas-indigo">{user.full_name || user.username}</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">Role:</span>
                      <span className={cn(
                        "text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded",
                        user.role === 'TEACHER' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3 text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">System Status</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">Active Session</span>
                  </div>
                </div>
              </motion.div>
            </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div onClick={() => navigate('/create-quiz')} className="p-6 bg-white rounded-lg border border-slate-200 hover:border-veritas-indigo transition-all cursor-pointer group shadow-sm">
                      <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100 mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-veritas-indigo" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Create New Quiz</h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Design questions and assign to courses</p>
                    </div>
                    <div 
                      onClick={() => {
                        console.log(`[App] Opening StudentScoresView for teacherId: ${user.id}`);
                        setViewingStudentScores(true);
                      }}
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
                        <User className="w-6 h-6 text-amber-500" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Manage Courses</h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Enroll students and organize groups</p>
                    </div>
                    <div 
                      onClick={() => setIsViewingHistory(true)}
                      className="p-6 bg-white rounded-lg border border-slate-200 hover:border-veritas-indigo transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 mb-4 group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-veritas-indigo" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Activity History</h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">View your past actions and logs</p>
                    </div>
                  </div>

                  <div className="mt-12 space-y-12">
                    {Array.from(new Set(quizzes.map(q => q.classId))).sort().map(classId => {
                      const classQuizzes = quizzes.filter(q => q.classId === classId);
                      const classInfo = classes.find(c => c.id === classId);
                      const firstQuiz = classQuizzes[0];
                      
                      // Priority: classInfo from classes state > firstQuiz details > fallback to ID
                      const displayCode = (classInfo?.courseCode || firstQuiz?.courseCode || "").trim();
                      const displayName = (classInfo?.name || firstQuiz?.courseName || "").trim();
                      
                      return (
                        <div key={classId} className="portal-card">
                          <div className="portal-card-header flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest font-black text-white">Course:</span>
                            <span className="text-xs font-black text-white font-mono tracking-wider">
                              {displayCode && displayName 
                                ? `${displayCode} - ${displayName}`
                                : `Class ID: ${classId}`}
                            </span>
                          </div>
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classQuizzes.map(quiz => (
                              <div key={quiz.id} className="p-6 bg-white border border-slate-200 rounded-lg hover:border-veritas-indigo transition-all flex flex-col shadow-sm group">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 tracking-tight leading-tight">{quiz.title}</h4>
                                <div className="flex flex-wrap gap-2 mb-6">
                                  <div className={cn("badge", quiz.status === 'DRAFT' ? "badge-slate" : "badge-teal")}>{quiz.status}</div>
                                  <div className="badge badge-slate">{quiz.questions?.length || 0} Questions</div>
                                </div>
                                <div className="space-y-3 mb-8">
                                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium"><Timer className="w-4 h-4 text-slate-300" /> Deadline: <span className="font-bold text-slate-700">{formatDeadline(quiz.deadline)}</span></div>
                                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium"><Activity className="w-4 h-4 text-slate-300" /> Duration: <span className="font-bold text-slate-700">{quiz.duration} Mins</span></div>
                                </div>
                                <div className="mt-auto pt-6 border-t border-slate-50 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setEditingQuiz(quiz)} className="btn-secondary py-2 text-xs">Edit</button>
                                    <button onClick={() => handleDeleteQuiz(quiz.id)} className="btn-secondary py-2 text-xs text-rose-500 hover:text-rose-600">Delete</button>
                                  </div>
                                  {quiz.status === 'DRAFT' && <button onClick={() => handlePublishQuiz(quiz)} className="w-full py-2 bg-teal-50 border border-teal-100 rounded-md text-xs font-bold text-veritas-indigo hover:bg-teal-100 transition-all">Publish Quiz</button>}
                                  <button onClick={() => setReviewingQuiz(quiz)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-bold transition-all">View Submissions</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {(isCreatingQuiz || editingQuiz) && <QuizCreator teacherId={user.id} initialData={editingQuiz} onClose={() => { setIsCreatingQuiz(false); setEditingQuiz(null); navigate('/'); }} onSave={handleSaveQuiz} />}
              {reviewingQuiz && <SubmissionReview quiz={reviewingQuiz} onClose={() => setReviewingQuiz(null)} />}
              {isManagingClasses && <ManageClasses teacherId={user.id} onClose={() => setIsManagingClasses(false)} />}
            </div>
          ) : (
            <>
              <div className="col-span-12 lg:col-span-8 space-y-8">
                {examState.status === 'idle' && !selectedCourseId ? (
                  <div className="space-y-10">
                    <div className="portal-card shadow-sm">
                      <div className="portal-card-header flex items-center justify-between">
                        <span>My Courses</span>
                        <button 
                          onClick={() => setIsViewingHistory(true)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 mr-2"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          History
                        </button>
                        <button 
                          onClick={() => setIsSearchingCourse(true)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Join Course
                        </button>
                      </div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {availableClasses.map(course => (
                          <motion.div key={course.id} whileHover={{ scale: 1.02, translateY: -4 }} onClick={() => setSelectedCourseId(course.id)} className="p-8 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-veritas-indigo transition-all shadow-sm group relative overflow-hidden">
                            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                              <BookOpen className="w-6 h-6 text-veritas-indigo" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{course.courseCode || course.id}</h3>
                            <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest font-mono">{course.name}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 text-slate-300 group-hover:text-veritas-indigo transition-colors">
                              <span className="text-[10px] font-mono uppercase font-black">View Quizzes</span>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : examState.status === 'idle' && selectedCourseId ? (
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                      <button onClick={() => setSelectedCourseId(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-teal-50 transition-all shadow-sm active:scale-90"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Assigned Quizzes: {availableClasses.find(c => c.id === selectedCourseId) ? `${availableClasses.find(c => c.id === selectedCourseId).courseCode} - ${availableClasses.find(c => c.id === selectedCourseId).name}` : selectedCourseId}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      {quizzes.map(quiz => {
                        const submission = userSubmissions.find(s => s.quizId === quiz.id);
                        const completed = !!submission;
                        const expired = isExpired(quiz.deadline);
                        return (
                          <motion.div key={quiz.id} whileHover={{ scale: 1.01 }} className={cn("portal-card hover:border-veritas-indigo transition-all shadow-sm", completed && "opacity-80")}>
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-40 flex flex-col items-center justify-center p-8 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">
                                <span className="text-4xl font-black text-veritas-indigo font-mono tracking-tighter">{quiz.classId}</span>
                              </div>
                              <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
                                <div className="space-y-4">
                                  <h3 className="text-xl font-black text-slate-800 tracking-tight">{quiz.title}</h3>
                                  <div className="flex flex-wrap gap-4 text-[10px] font-black text-slate-400 font-mono uppercase tracking-wider">
                                    <div className="flex items-center gap-2"><Timer className="w-3.5 h-3.5" /> {quiz.duration} Mins</div>
                                    <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> {quiz.questions?.length || 0} Qs</div>
                                    <div className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Deadline: {formatDeadline(quiz.deadline)}</div>
                                  </div>
                                </div>
                                <button 
                                  disabled={expired || completed} 
                                  onClick={() => { setSelectedQuiz(quiz); setExamState({ title: quiz.title, duration: quiz.duration, remainingTime: quiz.duration * 60, status: 'idle' }); setIsCameraActive(true); }} 
                                  className={cn(
                                    "px-8 py-3 rounded-md text-xs font-black transition-all uppercase tracking-widest", 
                                    (expired || completed) ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-veritas-deep to-veritas-indigo hover:opacity-90 text-white shadow-sm"
                                  )}
                                >
                                  {completed ? "Completed" : expired ? "Closed" : "Start Setup"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="portal-card shadow-sm">
                      <div className="portal-card-header">Academic Performance: {selectedCourseId}</div>
                      <div className="p-8">
                        <StudentStatsDashboard 
                          quizzes={quizzes.filter(q => q.classId === selectedCourseId)} 
                          submissions={userSubmissions.filter(s => {
                            const quiz = quizzes.find(q => q.id === s.quizId);
                            return quiz && quiz.classId === selectedCourseId && s.studentId === user.id;
                          })} 
                        />
                      </div>
                    </div>
                    {selectedQuiz && examState.status === 'idle' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="portal-card p-12 text-center mt-10 relative shadow-lg">
                        <button onClick={() => { setSelectedQuiz(null); setIsMonitoring(false); setIsCameraActive(false); setExamState(prev => ({ ...prev, status: 'idle' })); }} className="absolute top-8 left-8 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-veritas-indigo transition-colors flex items-center gap-2 font-black"><ChevronLeft className="w-4 h-4" /> Back to List</button>
                        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-200 shadow-inner">
                          <Monitor className="w-8 h-8 text-veritas-indigo" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">{examState.title}</h2>
                        <p className="text-slate-500 text-sm mb-10 max-w-lg mx-auto leading-relaxed font-medium">This examination is monitored by an Edge AI system. Your behavior will be analyzed locally to ensure academic integrity.</p>
                        <button onClick={startExam} disabled={!selectedQuiz.questions || selectedQuiz.questions.length === 0} className="btn-primary px-12 py-4 text-sm uppercase tracking-widest">Start Examination</button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="portal-card shadow-sm">
                      <div className="portal-card-header flex items-center justify-between">
                        <span>Question {currentQuestion + 1} of {selectedQuiz?.questions.length}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-100 animate-pulse" />
                          <span className="text-[10px] font-mono text-emerald-100 uppercase font-black">Live Monitoring</span>
                        </div>
                      </div>
                      <div className="p-10">
                        <h3 className="text-xl font-bold text-slate-800 mb-10 leading-tight tracking-tight">{selectedQuiz?.questions[currentQuestion].text}</h3>
                        {selectedQuiz?.questions[currentQuestion].type === 'MULTIPLE_CHOICE' ? (
                          <div className="space-y-4">
                            {selectedQuiz?.questions[currentQuestion].options.map((option, idx) => (
                              <button key={idx} onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })} className={cn("w-full p-5 rounded-md border text-left transition-all flex items-center justify-between group", answers[currentQuestion] === idx ? "bg-teal-50 border-veritas-indigo text-teal-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300")}>
                                <span className="text-sm font-bold">{option}</span>
                                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", answers[currentQuestion] === idx ? "border-veritas-indigo bg-veritas-indigo" : "border-slate-200 group-hover:border-slate-300")}>{answers[currentQuestion] === idx && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea value={answers[currentQuestion] || ''} onChange={(e) => setAnswers({ ...answers, [currentQuestion]: e.target.value })} placeholder="Type your answer here..." className="w-full bg-slate-50 border border-slate-200 rounded-md p-6 text-slate-800 focus:border-veritas-indigo outline-none transition-all min-h-[250px] resize-none text-base font-medium" />
                        )}
                        <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
                          <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(prev => prev - 1)} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-colors uppercase tracking-widest"><ChevronLeft className="w-4 h-4" /> Previous</button>
                          <button onClick={() => { if (currentQuestion < selectedQuiz!.questions.length - 1) setCurrentQuestion(prev => prev + 1); else handleQuizSubmission(); }} className="btn-primary px-8 py-3 text-xs uppercase tracking-widest">{currentQuestion === selectedQuiz!.questions.length - 1 ? "Finish Exam" : "Next Question"}<ChevronRight className="w-4 h-4 ml-2" /></button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>

              {selectedQuiz && (
                <div className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="portal-card">
                    <div className="portal-card-header flex items-center justify-between">
                      <span>Live Stream</span>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", isMonitoring ? "bg-rose-100 animate-pulse" : "bg-slate-300")} />
                        <span className="text-[9px] font-mono text-teal-100 uppercase font-black">{isMonitoring ? "REC" : "OFF"}</span>
                      </div>
                    </div>
                    <div className="p-2">
                      <WebcamMonitor onDetection={handleDetection} isCameraActive={isCameraActive} isDetectionActive={isMonitoring} />
                    </div>
                  </div>
                  <div className="h-[400px] portal-card">
                    <div className="portal-card-header">Activity Log</div>
                    <div className="p-2 h-[calc(100%-40px)]">
                      <EventLog events={events} />
                    </div>
                  </div>
                  <div className="portal-card">
                    <div className="portal-card-header">Security Protocols</div>
                    <div className="p-6">
                      <ul className="space-y-4">
                        {[{ label: "Face Recognition", status: "Active" }, { label: "Gaze Tracking", status: "Active" }, { label: "Tab Monitor", status: "Active" }, { label: "Encrypted Logs", status: "Ready" }].map((item, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                            <span className="text-[10px] font-mono text-veritas-indigo font-black uppercase tracking-wider">{item.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {user.role === 'TEACHER' && viewingStudentScores && (
          <StudentScoresView teacherId={user.id} onClose={() => setViewingStudentScores(false)} />
        )}

        <AnimatePresence>
          {examState.status === 'finished' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="portal-card max-w-lg w-full text-center shadow-2xl">
                <div className="portal-card-header py-4 text-xl">Examination Completed</div>
                <div className="p-12">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-200 shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Submission Received</h2>
                  <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Your responses and behavior logs have been securely submitted to the institution portal.</p>
                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-2 font-black">Total Events</div>
                      <div className="text-2xl font-black text-slate-800 font-mono">{events.length}</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-2 font-black">Integrity Score</div>
                      <div className="text-2xl font-black text-veritas-indigo font-mono">{Math.max(0, 100 - events.length * 5)}%</div>
                    </div>
                  </div>
                  <button onClick={() => { setExamState(prev => ({ ...prev, status: 'idle' })); setSelectedQuiz(null); setIsCameraActive(false); setIsMonitoring(false); setAnswers({}); setCurrentQuestion(0); setEvents([]); navigate('/'); }} className="btn-primary w-full py-4 uppercase tracking-widest">Return to Dashboard</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Course Modal */}
        <AnimatePresence>
          {isSearchingCourse && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSearchingCourse(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                      <Globe className="w-6 h-6 text-veritas-indigo" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Join New Course</h3>
                      <p className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-widest">Search and request to join classes</p>
                    </div>
                  </div>
                  <button onClick={() => setIsSearchingCourse(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <form onSubmit={handleSearchCourses} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Enter Course Code (e.g. IT101) or Course Name..."
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-veritas-indigo/10 focus:border-veritas-indigo transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={courseSearchQuery.length < 2 || searchingCourses}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shadow-lg active:scale-95"
                    >
                      {searchingCourses ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  <div className="space-y-4">
                    {courseSearchResults.map(course => (
                      <div key={course.id} className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-veritas-indigo/30 transition-all shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                            <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-veritas-indigo transition-colors" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono font-black text-veritas-indigo bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">{course.courseCode}</span>
                              <h4 className="text-lg font-black text-slate-800 tracking-tight">{course.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                              <User className="w-3.5 h-3.5" />
                              <span>Teacher: {course.teacherName}</span>
                            </div>
                          </div>
                        </div>

                        {course.requestStatus === 'PENDING' ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Requested</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleJoinRequest(course.id)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                          >
                            Request to Join
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {courseSearchResults.length === 0 && courseSearchQuery.length >= 2 && !searchingCourses && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold">No courses found matching your search.</p>
                      </div>
                    )}

                    {courseSearchQuery.length < 2 && (
                      <div className="text-center py-12">
                        <p className="text-slate-400 font-bold">Enter at least 2 characters to search for courses.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {isViewingHistory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsViewingHistory(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              >
                <ActivityHistory 
                  userId={user.id} 
                  role={user.role as 'TEACHER' | 'STUDENT'} 
                  onClose={() => setIsViewingHistory(false)} 
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      )}
    </ErrorBoundary>
  );
}
