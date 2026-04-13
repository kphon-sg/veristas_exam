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
  ScanFace,
  Activity,
  GraduationCap,
  Menu,
  Search,
  Plus,
  ArrowRight,
  Globe,
  CheckCircle,
  Clock,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { WebcamMonitor } from './components/monitoring/WebcamMonitor';
import { EventLog } from './components/monitoring/EventLog';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentStatsDashboard } from './components/dashboard/StudentStatsDashboard';
import { QuizCreator } from './components/admin/QuizCreator';
import { SubmissionReview } from './components/admin/SubmissionReview';
import { StudentScoresView } from './components/dashboard/StudentScoresView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPortal } from './components/common/LoginPortal';
import { ManageClasses } from './components/admin/ManageClasses';
import { ActivityHistory } from './components/dashboard/ActivityHistory';
import { QuizHistory } from './components/quiz/QuizHistory';
import { GradingManagement } from './components/teacher/GradingManagement';
import { CalendarView } from './components/dashboard/CalendarView';
import { ProfileSettingsView } from './components/dashboard/ProfileSettingsModal';
import { ProfileOverview } from './components/dashboard/ProfileOverview';
import { NotificationsView } from './components/dashboard/NotificationsView';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { NotificationCenter } from './components/layout/NotificationCenter';
import { useNotifications } from './components/ui/NotificationProvider';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import HelpCenter from './pages/HelpCenter';
import { PreExamSetup } from './components/monitoring/PreExamSetup';
import { ExamSetupPage } from './pages/ExamSetupPage';
import { MonitoringEvent, ExamState, StudentStats } from './types';
import { cn } from './lib/utils';

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
  openAt?: string;
  closeAt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'DELETED';
  questions: Question[];
}

export default function App() {
  const { confirm, notify } = useNotifications();
  const [user, setUser] = useState<{ 
    id: number; 
    username: string; 
    studentCode?: string; 
    role: string; 
    classId: number; 
    full_name?: string;
    department?: string;
    profilePicture?: string;
    phoneNumber?: string;
  } | null>(() => {
    const savedUser = localStorage.getItem('veritas_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('veritas_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
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
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [reviewingQuiz, setReviewingQuiz] = useState<Quiz | null>(null);
  const [viewingStudentScores, setViewingStudentScores] = useState(false);
  const [isManagingClasses, setIsManagingClasses] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [isViewingCourses, setIsViewingCourses] = useState(false);
  const [isJoiningCourse, setIsJoiningCourse] = useState(false);
  const [selectedTeacherCourseId, setSelectedTeacherCourseId] = useState<number | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<number | null>(null);

  // Advanced Course Search Filters
  const [courseNameFilter, setCourseNameFilter] = useState('');
  const [courseCodeFilter, setCourseCodeFilter] = useState('');
  const [teacherNameFilter, setTeacherNameFilter] = useState('');
  const [schoolNameFilter, setSchoolNameFilter] = useState('');
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<any>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseSearchResults, setCourseSearchResults] = useState<any[]>([]);
  const [searchingCourses, setSearchingCourses] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    return fetch(url, { ...options, headers });
  }, [token]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loginData, setLoginData] = useState({ studentId: '', password: '' });
  const [loginType, setLoginType] = useState<'TEACHER' | 'STUDENT'>('STUDENT');

  // Update current time for countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10 seconds for better responsiveness
    return () => clearInterval(timer);
  }, []);

  // Fetch available classes for student
  const fetchAvailableClasses = useCallback(() => {
    if (user && token) {
      const url = user.role === 'STUDENT' 
        ? `/api/classes?studentId=${user.id}` 
        : '/api/classes';
      
      authenticatedFetch(url)
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
  }, [user, token, authenticatedFetch]);

  useEffect(() => {
    if (courseSearchQuery.length < 2) {
      setCourseSearchResults([]);
    }
  }, [courseSearchQuery]);

  useEffect(() => {
    fetchAvailableClasses();
  }, [fetchAvailableClasses]);

  const handleSearchCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If all filters are empty, don't search
    if (!courseSearchQuery && !courseNameFilter && !courseCodeFilter && !teacherNameFilter && !schoolNameFilter) {
      setCourseSearchResults([]);
      return;
    }
    
    setSearchingCourses(true);
    try {
      const params = new URLSearchParams();
      if (courseSearchQuery) params.append('query', courseSearchQuery);
      if (courseNameFilter) params.append('courseName', courseNameFilter);
      if (courseCodeFilter) params.append('courseCode', courseCodeFilter);
      if (teacherNameFilter) params.append('teacherName', teacherNameFilter);
      if (schoolNameFilter) params.append('schoolName', schoolNameFilter);
      params.append('studentId', user?.id?.toString() || '');

      const res = await authenticatedFetch(`/api/classes/search-available?${params.toString()}`);
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
      const res = await authenticatedFetch(`/api/classes/${courseId}/join-request`, {
        method: 'POST',
        body: JSON.stringify({ studentId: user.id })
      });
      if (res.ok) {
        notify.success("Join request sent successfully!");
        handleSearchCourses({ preventDefault: () => {} } as any);
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to send join request");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
    }
  };

  // Fetch quizzes and submissions
  const loadQuizzes = useCallback(() => {
    if (user && token) {
      // For students, also fetch available classes to keep "My Courses" updated
      if (user.role === 'STUDENT') {
        authenticatedFetch(`/api/classes?studentId=${user.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            const classList = Array.isArray(data) ? data : [];
            setAvailableClasses(classList);
          })
          .catch(err => console.error("[AUTH] Error fetching classes:", err));
      }

      // For students, only fetch if a course is selected, viewing calendar, or on dashboard
      if (user.role === 'STUDENT' && !selectedCourseId && activeTab !== 'calendar' && activeTab !== 'dashboard') {
        setQuizzes([]);
        setUserSubmissions([]);
        setStudentStats(null);
        return;
      }

      const url = user.role === 'STUDENT' 
        ? (selectedCourseId ? `/api/quizzes?classId=${selectedCourseId}` : '/api/quizzes')
        : `/api/quizzes?teacherId=${user.id}`;
      
      authenticatedFetch(url)
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
              notify.error("This quiz has been removed by the teacher.");
            }
          }
          setQuizzes(quizList);
        })
        .catch(err => console.error("[QUIZ] Error fetching quizzes:", err));

      if (user.role === 'STUDENT' && (selectedCourseId || activeTab === 'calendar' || activeTab === 'dashboard')) {
        const subUrl = selectedCourseId 
          ? `/api/submissions?classId=${selectedCourseId}` 
          : '/api/submissions';
          
        authenticatedFetch(subUrl)
          .then(res => res.json())
          .then(data => {
            const subs = Array.isArray(data) ? data : [];
            setUserSubmissions(subs);
          })
          .catch(err => console.error("[QUIZ] Error fetching student submissions:", err));

        const statsUrl = selectedCourseId
          ? `/api/student/stats?classId=${selectedCourseId}`
          : '/api/student/stats';

        authenticatedFetch(statsUrl)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setStudentStats(data);
          })
          .catch(err => console.error("[QUIZ] Error fetching student stats:", err));
      }
    }
  }, [user, token, selectedCourseId, activeTab, examState.status, selectedQuiz, authenticatedFetch]);

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
      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(quizData)
      });
      if (res.ok) {
        console.log("[App] Quiz saved successfully");
        notify.success("Quiz saved successfully!");
        loadQuizzes();
        setIsCreatingQuiz(false);
        setEditingQuiz(null);
        navigate('/');
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
        console.error("[App] Failed to save quiz:", err);
        notify.error(`Failed to save quiz: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("[App] Network error while saving quiz:", err);
      notify.error("Network error while saving quiz.");
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Quiz',
      message: 'Are you sure you want to delete this quiz? This action cannot be undone.',
      type: 'danger',
      confirmLabel: 'Delete'
    });

    if (!isConfirmed) return;
    try {
      const res = await authenticatedFetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) loadQuizzes();
    } catch (err) {
      console.error("Error deleting quiz:", err);
    }
  };

  const handlePublishQuiz = async (quiz: Quiz) => {
    try {
      const res = await authenticatedFetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...quiz, status: 'PUBLISHED' })
      });
      if (res.ok) loadQuizzes();
    } catch (err) {
      console.error("Error publishing quiz:", err);
    }
  };

  const handleQuizSubmission = async (isAutoSubmit = false) => {
    if (!selectedQuiz || !user || isSubmitting) return;

    if (!isAutoSubmit) {
      const isConfirmed = await confirm({
        title: 'Finish Examination',
        message: "Are you sure you want to finish the examination? Your answers will be submitted and you won't be able to change them.",
        type: 'warning',
        confirmLabel: 'Finish'
      });

      if (!isConfirmed) {
        return;
      }
    } else {
      notify.info("Time is up! Your exam has been automatically submitted.");
    }

    setIsSubmitting(true);

    // Close any active proctoring logs before final submission
    const now = Date.now();
    const activeViolations = events.filter(e => !e.endTime);
    for (const violation of activeViolations) {
      if (user && currentSubmissionId) {
        const duration = Math.round((now - violation.timestamp) / 1000);
        authenticatedFetch('/api/proctoring/log-event', {
          method: 'POST',
          body: JSON.stringify({
            submissionId: currentSubmissionId,
            eventType: violation.type,
            severity: violation.severity.toUpperCase(),
            startTime: new Date(violation.timestamp).toISOString(),
            endTime: new Date(now).toISOString(),
            duration: duration,
            message: violation.message
          })
        }).catch(err => console.error("Error logging final proctoring event:", err));
      }
    }

    // Payload Verification: Gather all answers and proctoring counts
    const faceMissingCount = events.filter(e => e.type === 'face_missing').length;
    const lookingAwayCount = events.filter(e => e.type === 'looking_away').length;
    const multipleFacesCount = events.filter(e => e.type === 'multiple_faces').length;
    const tabSwitchCount = events.filter(e => e.type === 'tab_switch').length;

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
      })),
      proctoringLogs: {
        faceMissing: faceMissingCount,
        lookingAway: lookingAwayCount,
        multipleFaces: multipleFacesCount,
        tabSwitches: tabSwitchCount
      }
    };

    console.log("[App] Submitting quiz answers:", submission);

    try {
      // Async Handling: Use await for the API call
      const res = await authenticatedFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(submission)
      });

      if (res.ok) {
        const result = await res.json();
        console.log("[App] Submission successful:", result);
        
        // State Reset: Clear timer persistence and stop camera
        localStorage.removeItem(`quiz_end_time_${selectedQuiz.id}_${user.id}`);
        localStorage.removeItem(`current_submission_id_${selectedQuiz.id}_${user.id}`);
        
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
          setActiveStream(null);
        }

        // Navigation: Reset exam state and show Quiz History
        setExamState(prev => ({ ...prev, status: 'idle' }));
        setIsMonitoring(false);
        setIsCameraActive(false);
        setAnswers({});
        setCurrentQuestion(0);
        setEvents([]);
        setSelectedQuiz(null);
        
        notify.success("Examination submitted successfully!");
        setActiveTab('quiz-history');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        console.error("[App] Submission failed:", errorData);
        notify.error(`Submission failed: ${errorData.error || 'Unknown error'}. Please check your internet and try again.`);
      }
    } catch (err) {
      console.error("[App] Network error during submission:", err);
      notify.error("Submission failed. Please check your internet and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
        setToken(data.token);
        localStorage.setItem('veritas_token', data.token);
        localStorage.setItem('veritas_user', JSON.stringify(data));
        setLoginData({ studentId: '', password: '' });
        notify.success(`Welcome ${data.full_name || data.username}`);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Login failed. Please check your credentials.");
        notify.error(errorMsg);
      }
    } catch (err) {
      console.error("Login error:", err);
      notify.error("Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent, regData: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();

      if (res.ok) {
        notify.success("Registration successful! You are now logged in.");
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('veritas_token', data.token);
        localStorage.setItem('veritas_user', JSON.stringify(data.user));
      } else {
        notify.error(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      notify.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('veritas_token');
    localStorage.removeItem('veritas_user');
    setIsMonitoring(false);
    setExamState({ title: "", duration: 30, remainingTime: 1800, status: 'idle' });
    setSelectedQuiz(null);
    setIsCameraActive(false);
    setEvents([]);
    navigate('/');
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Reset all view states
    setIsViewingProfile(false);
    setIsManagingClasses(false);
    setIsViewingHistory(false);
    setViewingStudentScores(false);
    setIsCreatingQuiz(false);
    setSelectedCourseId(null);
    setIsViewingCourses(false);
    setIsJoiningCourse(false);

    // Map tabId to specific view states
    switch (tabId) {
      case 'dashboard':
        navigate('/');
        break;
      case 'courses':
        if (user?.role === 'TEACHER') {
          setSelectedTeacherCourseId(null);
          navigate('/');
        } else {
          setIsViewingCourses(true);
        }
        break;
      case 'join-course':
        if (user?.role === 'STUDENT') {
          setIsJoiningCourse(true);
        }
        break;
      case 'grading-management':
        if (user?.role === 'TEACHER') {
          setActiveTab('grading-management');
        } else {
          setActiveTab('quiz-history');
        }
        break;
      case 'quiz-history':
        setActiveTab('quiz-history');
        break;
      case 'calendar':
        setActiveTab('calendar');
        break;
      case 'settings':
        setActiveTab('settings');
        break;
      case 'profile':
        setIsViewingProfile(true);
        break;
      default:
        break;
    }
  };

  const addEvent = (message: string, severity: 'low' | 'medium' | 'high' | 'none' = 'none', type: any = 'valid') => {
    const newEvent: MonitoringEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: type as any,
      severity: severity as any,
      message
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleDetection = useCallback((type: string, snapshot?: string, source: 'camera' | 'browser' = 'camera') => {
    console.log(`[App] handleDetection: type=${type}, source=${source}, status=${examState.status}, hasQuiz=${!!selectedQuiz}, submissionId=${currentSubmissionId}`);
    // Allow detection during setup for feedback, but only log if running or setup
    if (examState.status === 'idle' && !selectedQuiz) {
      console.log(`[App] handleDetection ignored: idle and no quiz`);
      return;
    }

    const messages: Record<string, { msg: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE' }> = {
      face_missing: { msg: "No face detected in webcam stream.", severity: 'HIGH' },
      multiple_faces: { msg: "Multiple faces detected in frame.", severity: 'HIGH' },
      looking_away: { msg: "Student is looking away from the screen.", severity: 'MEDIUM' },
      tab_switch: { msg: "Browser tab switch detected.", severity: 'HIGH' },
      app_blur: { msg: "Application lost focus.", severity: 'MEDIUM' },
      phone_detected: { msg: "Mobile device detected in frame.", severity: 'HIGH' },
      valid: { msg: "Monitoring active. No violations detected.", severity: 'NONE' }
    };

    const CAMERA_VIOLATIONS = ['face_missing', 'multiple_faces', 'looking_away'];
    const BROWSER_VIOLATIONS = ['tab_switch', 'app_blur'];

    const now = Date.now();

    setEvents(prev => {
      console.log(`[App] setEvents: type=${type}, lastEvent=${prev[0]?.type}`);

      if (type === 'valid') {
        // Find the most recent active violation for this source and close it
        const activeViolationIdx = prev.findIndex(e => 
          !e.endTime && (
            (source === 'camera' && CAMERA_VIOLATIONS.includes(e.type)) ||
            (source === 'browser' && BROWSER_VIOLATIONS.includes(e.type))
          )
        );

        if (activeViolationIdx !== -1) {
          const violation = prev[activeViolationIdx];
          console.log(`[App] Closing violation: ${violation.type} at index ${activeViolationIdx}`);
          
          // Report to backend when violation ends
          if (user && currentSubmissionId && examState.status === 'running') {
            const duration = Math.round((now - violation.timestamp) / 1000);
            authenticatedFetch('/api/proctoring/log-event', {
              method: 'POST',
              body: JSON.stringify({
                submissionId: currentSubmissionId,
                eventType: violation.type,
                severity: violation.severity.toUpperCase(),
                startTime: new Date(violation.timestamp).toISOString(),
                endTime: new Date(now).toISOString(),
                duration: duration,
                message: violation.message
              })
            }).catch(err => console.error("Error logging proctoring event:", err));
          }

          return prev.map((e, idx) => idx === activeViolationIdx ? { ...e, endTime: now } : e);
        }
        return prev;
      }

      // If it's a violation and it's already active (no endTime), just return
      const alreadyActive = prev.find(e => e.type === type && !e.endTime);
      if (alreadyActive) {
        console.log(`[App] Violation already active: ${type}`);
        return prev;
      }

      console.log(`[App] Adding new violation: ${type}`);

      // New violation: close any previous active violation from the SAME source
      const updatedPrev = prev.map((e) => {
        if (!e.endTime) {
          const isCameraViolation = CAMERA_VIOLATIONS.includes(e.type);
          const isBrowserViolation = BROWSER_VIOLATIONS.includes(e.type);
          const newIsCamera = CAMERA_VIOLATIONS.includes(type);
          const newIsBrowser = BROWSER_VIOLATIONS.includes(type);

          if ((newIsCamera && isCameraViolation) || (newIsBrowser && isBrowserViolation)) {
            // Report the closed violation to backend
            if (user && currentSubmissionId && examState.status === 'running') {
              const duration = Math.round((now - e.timestamp) / 1000);
              authenticatedFetch('/api/proctoring/log-event', {
                method: 'POST',
                body: JSON.stringify({
                  submissionId: currentSubmissionId,
                  eventType: e.type,
                  severity: e.severity.toUpperCase(),
                  startTime: new Date(e.timestamp).toISOString(),
                  endTime: new Date(now).toISOString(),
                  duration: duration,
                  message: e.message
                })
              }).catch(err => console.error("Error logging proctoring event:", err));
            }
            return { ...e, endTime: now };
          }
        }
        return e;
      });

      const event: MonitoringEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: now,
        type: type as any,
        message: messages[type]?.msg || "Suspicious behavior detected.",
        severity: (messages[type]?.severity || 'MEDIUM').toLowerCase() as any,
        snapshot
      };

      // Also report to the old violations table for compatibility/evidence
      if (user && type !== 'valid' && examState.status === 'running') {
        authenticatedFetch('/api/exam/report-violation', {
          method: 'POST',
          body: JSON.stringify({
            studentId: user.id,
            submissionId: currentSubmissionId,
            type: event.type,
            message: event.message,
            severity: event.severity,
            snapshot: event.snapshot
          })
        }).catch(err => console.error("Error reporting violation:", err));
      }

      return [event, ...updatedPrev].slice(0, 50);
    });
  }, [user, examState.status, selectedQuiz, currentSubmissionId, authenticatedFetch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMonitoring) {
        handleDetection('tab_switch', undefined, 'browser');
      } else if (!document.hidden && isMonitoring) {
        handleDetection('valid', undefined, 'browser');
      }
    };

    const handleBlur = () => {
      if (isMonitoring) handleDetection('app_blur', undefined, 'browser');
    };

    const handleFocus = () => {
      if (isMonitoring) handleDetection('valid', undefined, 'browser');
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isMonitoring, handleDetection]);

  useEffect(() => {
    let timer: any;
    if (examState.status === 'running') {
      timer = setInterval(() => {
        setExamState(prev => {
          let newTime = prev.remainingTime;
          
          // If we have an endTime, use it to calculate remaining time (more accurate on refresh)
          if (prev.endTime) {
            newTime = Math.max(0, Math.floor((prev.endTime - Date.now()) / 1000));
          } else {
            newTime = Math.max(0, prev.remainingTime - 1);
          }
          
          if (newTime === 0 && prev.status === 'running') {
            handleQuizSubmission(true);
            return { ...prev, remainingTime: 0, status: 'finished' };
          }
          return { ...prev, remainingTime: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examState.status, examState.endTime]);

  // Restore exam state on refresh
  useEffect(() => {
    if (user && selectedQuiz && examState.status === 'idle') {
      const savedEndTime = localStorage.getItem(`quiz_end_time_${selectedQuiz.id}_${user.id}`);
      if (savedEndTime) {
        const endTime = parseInt(savedEndTime);
        const remainingTime = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        
        if (remainingTime > 0) {
          const savedSubId = localStorage.getItem(`current_submission_id_${selectedQuiz.id}_${user.id}`);
          if (savedSubId) {
            setCurrentSubmissionId(parseInt(savedSubId));
          }
          setExamState(prev => ({
            ...prev,
            status: 'running',
            duration: selectedQuiz.duration || 30,
            remainingTime: remainingTime,
            endTime: endTime,
            startTime: new Date(endTime - (selectedQuiz.duration || 30) * 60 * 1000).toISOString()
          }));
          setIsMonitoring(true);
        } else {
          // Time expired while away
          localStorage.removeItem(`quiz_end_time_${selectedQuiz.id}_${user.id}`);
        }
      }
    }
  }, [user, selectedQuiz, examState.status]);

  const startExam = async (stream?: MediaStream, quizOverride?: Quiz) => {
    const activeQuiz = quizOverride || selectedQuiz;
    if (!activeQuiz || !user) return;
    
    if (stream) {
      setActiveStream(stream);
    }

    // Fullscreen for academic integrity
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }

    setEvents([]); // Clear logs for new session BEFORE starting monitoring
    addEvent('Exam started', 'none');
    
    const durationInSeconds = (activeQuiz.duration || 30) * 60;
    const endTime = Date.now() + durationInSeconds * 1000;
    
    // Persist for refresh
    localStorage.setItem(`quiz_end_time_${activeQuiz.id}_${user.id}`, endTime.toString());
    
    setIsMonitoring(true);
    setExamState(prev => ({ 
      ...prev, 
      status: 'running', 
      startTime: new Date().toISOString(),
      duration: activeQuiz.duration || 30,
      remainingTime: durationInSeconds,
      endTime: endTime
    }));

    try {
      const res = await authenticatedFetch(`/api/quizzes/${activeQuiz.id}/start`, {
        method: 'POST',
        body: JSON.stringify({ studentId: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.submissionId) {
          setCurrentSubmissionId(data.submissionId);
          localStorage.setItem(`current_submission_id_${activeQuiz.id}_${user.id}`, data.submissionId.toString());
        }
      }
    } catch (err) {
      console.error("Error logging quiz start:", err);
    }
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
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/exam/setup/:quizId" element={
          user ? (
            <ExamSetupPage 
              token={token} 
              onJoin={(quiz, stream) => {
                setSelectedQuiz(quiz);
                setExamState({ 
                  title: quiz.title, 
                  duration: quiz.duration, 
                  remainingTime: quiz.duration * 60, 
                  status: 'idle' 
                });
                setIsFaceDetected(true);
                startExam(stream, quiz);
                navigate('/'); // Navigate back to root where the exam UI is rendered
              }} 
            />
          ) : <Navigate to="/" />
        } />
        <Route path="/*" element={
          !user ? (
            <LoginPortal 
              onLogin={handleLogin} 
              onRegister={handleRegister}
              loginData={loginData as any} 
              setLoginData={setLoginData} 
              loginType={loginType}
              setLoginType={setLoginType}
              isLoading={isLoading}
            />
          ) : examState.status === 'running' ? (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-veritas-indigo/10 selection:text-veritas-indigo">
              {/* Header */}
              <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-veritas-indigo/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-veritas-indigo" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight">{selectedQuiz?.title || "Quiz 1 - Logic & Critical Thinking"}</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Examination in Progress</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className={cn(
                    "flex items-center gap-3 px-6 py-2.5 rounded-full shadow-lg border transition-all duration-300",
                    examState.remainingTime < 60 
                      ? "bg-rose-500 border-rose-400 animate-pulse" 
                      : "bg-slate-900 border-slate-800"
                  )}>
                    <Timer className={cn(
                      "w-4 h-4",
                      examState.remainingTime < 60 ? "text-white" : "text-emerald-400"
                    )} />
                    <span className={cn(
                      "text-sm font-mono font-black tracking-widest",
                      examState.remainingTime < 60 ? "text-white" : "text-white"
                    )}>{formatTime(examState.remainingTime)}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleQuizSubmission(false)}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Finish Exam"}
                  </button>
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Question Navigation */}
                <aside className="w-80 bg-white border-r border-slate-200 p-8 overflow-y-auto hidden md:block">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Question Navigation</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedQuiz?.questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestion(idx)}
                        className={cn(
                          "aspect-square rounded-xl text-xs font-black transition-all border-2",
                          currentQuestion === idx 
                            ? "bg-veritas-indigo border-veritas-indigo text-white shadow-md" 
                            : (answers[idx] !== undefined 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200")
                        )}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-4 h-4 text-veritas-indigo" />
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Exam Progress</h4>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-veritas-indigo transition-all duration-500"
                        style={{ width: `${(Object.keys(answers).length / (selectedQuiz?.questions.length || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">
                      {Object.keys(answers).length} of {selectedQuiz?.questions.length} Answered
                    </p>
                  </div>
                </aside>

                {/* Main Content: Question */}
                <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50/50 relative">
                  <div className="max-w-3xl mx-auto">
                    <motion.div
                      key={currentQuestion}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200"
                    >
                      <div className="flex items-center gap-3 mb-8">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Question {currentQuestion + 1}
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>

                      <h2 className="text-2xl font-black text-slate-800 mb-10 leading-tight tracking-tight">
                        {selectedQuiz?.questions[currentQuestion].text}
                      </h2>

                      {selectedQuiz?.questions[currentQuestion].type === 'MULTIPLE_CHOICE' ? (
                        <div className="space-y-4">
                          {selectedQuiz?.questions[currentQuestion].options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })}
                              className={cn(
                                "w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                                answers[currentQuestion] === idx 
                                  ? "bg-veritas-indigo/5 border-veritas-indigo text-veritas-indigo" 
                                  : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                              )}
                            >
                              <span className="text-sm font-bold">{option}</span>
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                answers[currentQuestion] === idx 
                                  ? "border-veritas-indigo bg-veritas-indigo" 
                                  : "border-slate-200 group-hover:border-slate-300"
                              )}>
                                {answers[currentQuestion] === idx && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          value={answers[currentQuestion] || ''}
                          onChange={(e) => setAnswers({ ...answers, [currentQuestion]: e.target.value })}
                          placeholder="Type your answer here..."
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-8 text-slate-800 focus:border-veritas-indigo outline-none transition-all min-h-[300px] resize-none text-base font-medium"
                        />
                      )}

                      <div className="flex items-center justify-between mt-12 pt-10 border-t border-slate-100">
                        <button 
                          disabled={currentQuestion === 0}
                          onClick={() => setCurrentQuestion(prev => prev - 1)}
                          className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-colors uppercase tracking-widest"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button 
                          disabled={isSubmitting}
                          onClick={() => {
                            if (currentQuestion < selectedQuiz!.questions.length - 1) {
                              setCurrentQuestion(prev => prev + 1);
                            } else {
                              handleQuizSubmission();
                            }
                          }}
                          className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {currentQuestion === selectedQuiz!.questions.length - 1 ? (isSubmitting ? "Submitting..." : "Finish Exam") : "Next Question"}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </main>

                {/* Right Sidebar: Proctoring & Logs */}
                <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
                  <div className="p-6 h-full flex flex-col gap-6">
                    {/* Live Stream */}
                    <div className="portal-card overflow-hidden shadow-sm border border-slate-200">
                      <div className="px-4 py-2 flex items-center justify-between bg-slate-50 text-slate-800 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[12px] font-black uppercase tracking-widest">Live Stream</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">REC</span>
                        </div>
                      </div>
                      <div className="aspect-video relative bg-slate-900">
                        <WebcamMonitor 
                          onDetection={handleDetection} 
                          onFaceStatusChange={setIsFaceDetected}
                          isCameraActive={true} 
                          isDetectionActive={true} 
                          showIdentityVerified={false}
                          isExamRunning={true}
                          stream={activeStream}
                          submissionId={currentSubmissionId}
                          token={token}
                        />
                      </div>
                    </div>

                    {/* Activity Log */}
                    <div className="flex-1 flex flex-col min-h-0 portal-card overflow-hidden shadow-sm border border-slate-200">
                      <div className="px-4 py-2 flex items-center justify-between bg-slate-50 text-slate-800 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-veritas-indigo" />
                          <span className="text-[12px] font-black uppercase tracking-widest">Activity Log</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden p-2 bg-slate-50/50">
                        <EventLog events={events} />
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <div className="min-h-screen bg-[#f4f7f9] flex overflow-hidden font-sans selection:bg-emerald-600/10">
              <Sidebar 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                onLogout={handleLogout} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                userRole={user.role}
                token={token}
              />
              
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:hidden shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-black text-slate-800 text-sm tracking-tight">VeritasExam</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {user && <NotificationCenter user={user} onUpdate={fetchAvailableClasses} authenticatedFetch={authenticatedFetch} />}
                    <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                  <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
            {/* Welcome Banner / Profile Overview Toggle */}
            <div className="col-span-12 mb-2">
              {isViewingProfile ? (
                <ProfileOverview 
                  user={user} 
                  onEditProfile={() => handleTabChange('settings')}
                  onClose={() => handleTabChange('dashboard')}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div 
                      onClick={() => handleTabChange('profile')}
                      className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 overflow-hidden shadow-sm cursor-pointer hover:scale-105 transition-transform"
                    >
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-veritas-indigo" />
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
                          onClick={() => handleTabChange('profile')}
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
                        onClick={() => handleTabChange('settings')}
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
              <>
                <div className="col-span-12 grid grid-cols-12 gap-6">
                {user.role === 'TEACHER' ? (
              <div className="col-span-12 space-y-8">
                {activeTab === 'dashboard' ? (
                  <>
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
                  </>
                ) : activeTab === 'courses' ? (
                  selectedTeacherCourseId ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedTeacherCourseId(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:text-veritas-indigo hover:border-veritas-indigo transition-all shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back to Courses
                        </button>
                        <div className="text-right">
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {classes.find(c => c.id === selectedTeacherCourseId)?.name}
                          </h2>
                          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest font-bold">
                            {classes.find(c => c.id === selectedTeacherCourseId)?.courseCode}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {quizzes.filter(q => q.classId === selectedTeacherCourseId).map(quiz => (
                          <div key={quiz.id} className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-veritas-indigo transition-all flex flex-col shadow-sm group">
                            <h4 className="text-lg font-bold text-slate-800 mb-4 tracking-tight leading-tight">{quiz.title}</h4>
                            <div className="flex flex-wrap gap-2 mb-6">
                              <div className={cn("badge", quiz.status === 'DRAFT' ? "badge-slate" : "badge-teal")}>{quiz.status}</div>
                              <div className="badge badge-slate">{quiz.questions?.length || 0} Questions</div>
                            </div>
                            <div className="space-y-3 mb-8">
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                <Clock className="w-4 h-4 text-slate-300" /> 
                                Opens: <span className="font-bold text-slate-700">{quiz.openAt ? new Date(quiz.openAt).toLocaleString() : 'Immediate'}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                <Timer className="w-4 h-4 text-slate-300" /> 
                                Deadline: <span className="font-bold text-slate-700">{formatDeadline(quiz.closeAt || quiz.deadline)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                <Activity className="w-4 h-4 text-slate-300" /> 
                                Duration: <span className="font-bold text-slate-700">{quiz.duration} Mins</span>
                              </div>
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
                        <div 
                          onClick={() => navigate('/create-quiz')}
                          className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-veritas-indigo hover:text-veritas-indigo transition-all cursor-pointer group bg-slate-50/50"
                        >
                          <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Plus className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-black uppercase tracking-widest">Create Quiz</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {classes.map(cls => (
                        <div 
                          key={cls.id} 
                          onClick={() => setSelectedTeacherCourseId(cls.id)}
                          className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-veritas-indigo hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                          <div className="relative z-10">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 mb-6 group-hover:bg-veritas-indigo group-hover:text-white transition-all">
                              <BookOpen className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-[0.2em] mb-2 block">{cls.courseCode}</span>
                            <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-veritas-indigo transition-colors leading-tight">{cls.name}</h3>
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                      <User className="w-3 h-3 text-slate-400" />
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Students</span>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div 
                        onClick={() => setIsManagingClasses(true)}
                        className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-veritas-indigo hover:text-veritas-indigo transition-all cursor-pointer group bg-slate-50/50"
                      >
                        <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                          <Plus className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">Add New Course</span>
                      </div>
                    </div>
                  )
                ) : activeTab === 'notifications' ? (
                  <NotificationsView userId={user.id} userRole="TEACHER" token={token} />
                ) : activeTab === 'grading-management' ? (
                  <div className="col-span-12">
                    <GradingManagement 
                      teacherId={user.id} 
                      onClose={() => handleTabChange('dashboard')}
                      authenticatedFetch={authenticatedFetch}
                      onReviewSubmission={(sub) => setReviewingSubmission(sub)}
                    />
                  </div>
                ) : activeTab === 'calendar' ? (
                  <div className="col-span-12">
                    <CalendarView 
                      quizzes={quizzes} 
                      onClose={() => handleTabChange('dashboard')} 
                      userRole="TEACHER"
                      onEditQuiz={(quiz) => setEditingQuiz(quiz as any)}
                    />
                  </div>
                ) : activeTab === 'settings' ? (
                  <div className="col-span-12">
                    <ProfileSettingsView
                      user={user}
                      token={token}
                      onClose={() => handleTabChange('dashboard')}
                      onUpdate={(updatedUser) => {
                        const newUser = { ...user, ...updatedUser };
                        setUser(newUser);
                        localStorage.setItem('veritas_user', JSON.stringify(newUser));
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="col-span-12 grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  {examState.status === 'idle' && !selectedCourseId ? (
                    activeTab === 'dashboard' ? (
                      <div className="space-y-10">
                        <StudentDashboard 
                          user={user}
                          onQuizSelect={(quiz) => {
                            setSelectedQuiz(quiz as any);
                            setExamState({ ...examState, status: 'idle' });
                          }}
                        />
                      </div>
                    ) : activeTab === 'courses' ? (
                      <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Enrolled Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    ) : activeTab === 'calendar' ? (
                      <CalendarView 
                        quizzes={quizzes.map(quiz => {
                          const submission = userSubmissions.find(s => s.quizId === quiz.id);
                          const isCompleted = !!submission;
                          const isOverdue = !isCompleted && new Date(quiz.deadline) < new Date();
                          
                          return {
                            ...quiz,
                            completionStatus: isCompleted ? 'completed' : (isOverdue ? 'overdue' : 'pending'),
                            submissionScore: submission?.score,
                            submittedAt: submission?.timestamp
                          };
                        })} 
                        onClose={() => handleTabChange('dashboard')} 
                        userRole="STUDENT"
                        onQuizSelect={(quiz) => {
                          setSelectedQuiz(quiz as any);
                          setExamState({ ...examState, status: 'idle' });
                        }}
                      />
                    ) : activeTab === 'quiz-history' ? (
                      <QuizHistory 
                        userId={user.id} 
                        courseId={selectedCourseId}
                        onClose={() => handleTabChange('dashboard')} 
                        authenticatedFetch={authenticatedFetch}
                      />
                    ) : activeTab === 'settings' ? (
                      <ProfileSettingsView
                        user={user}
                        token={token}
                        onClose={() => handleTabChange('dashboard')}
                        onUpdate={(updatedUser) => {
                          const newUser = { ...user, ...updatedUser };
                          setUser(newUser);
                          localStorage.setItem('veritas_user', JSON.stringify(newUser));
                        }}
                      />
                    ) : activeTab === 'notifications' ? (
                      <NotificationsView userId={user.id} userRole="STUDENT" token={token} />
                    ) : activeTab === 'join-course' ? (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Join New Course</h2>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Web Development"
                                value={courseNameFilter}
                                onChange={(e) => setCourseNameFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-veritas-indigo transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Code</label>
                              <input 
                                type="text" 
                                placeholder="e.g. WEB101"
                                value={courseCodeFilter}
                                onChange={(e) => setCourseCodeFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-veritas-indigo transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Dr. Alan Turing"
                                value={teacherNameFilter}
                                onChange={(e) => setTeacherNameFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-veritas-indigo transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School/Department</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Veritas University"
                                value={schoolNameFilter}
                                onChange={(e) => setSchoolNameFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-veritas-indigo transition-all"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-4">
                            <button 
                              onClick={handleSearchCourses}
                              disabled={searchingCourses}
                              className="btn-primary px-10 py-3 text-xs uppercase tracking-widest"
                            >
                              {searchingCourses ? "Searching..." : "Search Courses"}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {courseSearchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                              {courseSearchResults.map(course => (
                                <div key={course.id} className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-veritas-indigo transition-all shadow-sm">
                                  <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                                      <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-veritas-indigo" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-mono font-black text-veritas-indigo bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{course.courseCode}</span>
                                        <h4 className="text-lg font-black text-slate-800">{course.name}</h4>
                                      </div>
                                      <p className="text-xs text-slate-500 font-medium">Teacher: <span className="text-slate-700 font-bold">{course.teacherName}</span> • {course.schoolName}</p>
                                    </div>
                                  </div>
                                  <button 
                                    disabled={course.isEnrolled || course.requestStatus === 'PENDING'}
                                    onClick={() => handleJoinRequest(course.id)}
                                    className={cn(
                                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                      course.isEnrolled ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                                      course.requestStatus === 'PENDING' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                      "bg-slate-900 text-white hover:bg-slate-800"
                                    )}
                                  >
                                    {course.isEnrolled ? "Enrolled" : course.requestStatus === 'PENDING' ? "Pending" : "Request to Join"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : !searchingCourses && (courseNameFilter || courseCodeFilter || teacherNameFilter || schoolNameFilter) ? (
                            <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                              <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                              <p className="text-slate-500 font-bold">No courses found matching your criteria.</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null
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
                        const deadline = quiz.closeAt || quiz.deadline;
                        const expired = isExpired(deadline);
                        
                        const openTime = quiz.openAt ? new Date(quiz.openAt) : null;
                        const closeTime = quiz.closeAt ? new Date(quiz.closeAt) : new Date(quiz.deadline);
                        const isScheduled = openTime && currentTime < openTime;
                        const isExpiredQuiz = closeTime && currentTime > closeTime;
                        
                        return (
                          <motion.div key={quiz.id} whileHover={{ scale: 1.01 }} className={cn("portal-card hover:border-veritas-indigo transition-all shadow-sm", (completed || isScheduled) && "opacity-80")}>
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-40 flex flex-col items-center justify-center p-8 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">
                                <span className="text-4xl font-black text-emerald-600 font-mono tracking-tighter">{quiz.classId}</span>
                              </div>
                              <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
                                <div className="space-y-4">
                                  <h3 className="text-xl font-black text-slate-800 tracking-tight">{quiz.title}</h3>
                                  <div className="flex flex-wrap gap-4 text-[10px] font-black text-slate-400 font-mono uppercase tracking-wider">
                                    <div className="flex items-center gap-2"><Timer className="w-3.5 h-3.5" /> {quiz.duration} Mins</div>
                                    <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> {quiz.questions?.length || 0} Qs</div>
                                    <div className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Deadline: {formatDeadline(deadline)}</div>
                                    {isScheduled && (
                                      <div className="flex items-center gap-2 text-amber-500"><Clock className="w-3.5 h-3.5" /> Available on: {new Date(quiz.openAt!).toLocaleString()}</div>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  disabled={expired || completed || isScheduled || isExpiredQuiz} 
                                  onClick={() => { 
                                    setSelectedQuiz(quiz); 
                                    setExamState({ title: quiz.title, duration: quiz.duration, remainingTime: quiz.duration * 60, status: 'idle' }); 
                                    setIsSettingUp(true);
                                    setIsCameraActive(true); 
                                  }} 
                                  className={cn(
                                    "px-8 py-3 rounded-md text-xs font-black transition-all uppercase tracking-widest", 
                                    (expired || completed || isScheduled || isExpiredQuiz) ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-700 to-emerald-500 hover:opacity-90 text-white shadow-sm"
                                  )}
                                >
                                  {completed ? "Completed" : isScheduled ? "Scheduled" : (expired || isExpiredQuiz) ? "Closed" : "Start Setup"}
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
                          stats={studentStats}
                          onQuizSelect={(quiz) => { 
                            setSelectedQuiz(quiz); 
                            setExamState({ 
                              title: quiz.title, 
                              duration: quiz.duration, 
                              remainingTime: quiz.duration * 60, 
                              status: 'idle' 
                            }); 
                            setIsSettingUp(true);
                            setIsCameraActive(true);
                          }}
                          onViewHistory={() => setActiveTab('quiz-history')}
                        />
                      </div>
                    </div>
                    {selectedQuiz && examState.status === 'idle' && !isSettingUp && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="portal-card p-12 text-center mt-10 relative shadow-lg">
                        <button onClick={() => { 
                          setSelectedQuiz(null); 
                          setIsMonitoring(false); 
                          setIsCameraActive(false); 
                          setEvents([]); // Clear logs when going back
                          setExamState(prev => ({ ...prev, status: 'idle' })); 
                        }} className="absolute top-8 left-8 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-veritas-indigo transition-colors flex items-center gap-2 font-black"><ChevronLeft className="w-4 h-4" /> Back to List</button>
                        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-200 shadow-inner">
                          <Monitor className="w-8 h-8 text-veritas-indigo" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">{examState.title}</h2>
                        <p className="text-slate-500 text-sm mb-10 max-w-lg mx-auto leading-relaxed font-medium">This examination is monitored by an Edge AI system. Your behavior will be analyzed locally to ensure academic integrity.</p>
                        <button 
                          onClick={() => startExam()} 
                          disabled={!selectedQuiz.questions || selectedQuiz.questions.length === 0 || !isFaceDetected} 
                          className={cn(
                            "btn-primary px-12 py-4 text-sm uppercase tracking-widest transition-all",
                            !isFaceDetected && "opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400"
                          )}
                        >
                          {isFaceDetected ? "Start Examination" : "Face Required to Start"}
                        </button>
                      </motion.div>
                    )}
                    {isSettingUp && selectedQuiz && (
                      <PreExamSetup 
                        quizTitle={selectedQuiz.title}
                        isModelsLoaded={true}
                        onJoin={(stream) => {
                          setIsSettingUp(false);
                          setIsFaceDetected(true);
                          startExam(stream);
                        }}
                        onLeave={() => {
                          setIsSettingUp(false);
                          setSelectedQuiz(null);
                          setIsCameraActive(false);
                        }}
                      />
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
                          <button 
                            disabled={isSubmitting}
                            onClick={() => { if (currentQuestion < selectedQuiz!.questions.length - 1) setCurrentQuestion(prev => prev + 1); else handleQuizSubmission(); }} 
                            className="btn-primary px-8 py-3 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {currentQuestion === selectedQuiz!.questions.length - 1 ? (isSubmitting ? "Submitting..." : "Finish Exam") : "Next Question"}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </button>
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
                      <WebcamMonitor 
                        onDetection={handleDetection} 
                        onFaceStatusChange={setIsFaceDetected}
                        isCameraActive={isCameraActive} 
                        isDetectionActive={isMonitoring} 
                        showIdentityVerified={examState.status === 'idle'}
                        isExamRunning={false}
                        submissionId={currentSubmissionId}
                        token={token}
                      />
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
            </div>
          )}
        </div>
      </>
    )}
  </div>
</main>
  <BottomNav activeTab={activeTab} onTabChange={handleTabChange} userRole={user.role} />

        {user.role === 'TEACHER' && viewingStudentScores && (
          <StudentScoresView 
            teacherId={user.id} 
            onClose={() => setViewingStudentScores(false)} 
            authenticatedFetch={authenticatedFetch}
          />
        )}

        <AnimatePresence>
          {examState.status === 'finished' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl max-w-lg w-full text-center shadow-2xl overflow-hidden">
                <div className="portal-card-header flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="portal-header-icon-box">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="portal-header-title">Examination Completed</h3>
                      <p className="portal-header-subtitle">Your submission has been received</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setExamState(prev => ({ ...prev, status: 'idle' })); setSelectedQuiz(null); setIsCameraActive(false); setIsMonitoring(false); setAnswers({}); setCurrentQuestion(0); setEvents([]); navigate('/'); }}
                    className="portal-close-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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

        {/* Course Details Modal */}
        <AnimatePresence>
            {selectedCourseForDetails && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedCourseForDetails(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="portal-card-header flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="portal-header-icon-box">
                        <BookOpen className="w-6 h-6 text-veritas-indigo" />
                      </div>
                      <div>
                        <h3 className="portal-header-title">Course Details</h3>
                        <p className="portal-header-subtitle">{selectedCourseForDetails.courseCode}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedCourseForDetails(null)} className="portal-close-button">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Course Name</label>
                      <p className="text-xl font-black text-slate-800 tracking-tight">{selectedCourseForDetails.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Teacher</label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{selectedCourseForDetails.teacherName}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">School</label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{selectedCourseForDetails.schoolName || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedCourseForDetails.description && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedCourseForDetails.description}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      {selectedCourseForDetails.requestStatus === 'PENDING' ? (
                        <div className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center gap-3">
                          <Clock className="w-5 h-5 animate-pulse" />
                          <span className="text-xs font-black uppercase tracking-widest">Enrollment Request Pending</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            handleJoinRequest(selectedCourseForDetails.id);
                            setSelectedCourseForDetails(null);
                          }}
                          className="w-full py-4 bg-slate-900 text-white hover:bg-veritas-indigo rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                        >
                          Request to Join This Course
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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
                  authenticatedFetch={authenticatedFetch}
                />
              </motion.div>
            </div>
          )}

          {reviewingSubmission && (
            <SubmissionReview 
              quiz={{ id: reviewingSubmission.quizId, title: reviewingSubmission.quizTitle }} 
              onClose={() => setReviewingSubmission(null)} 
              authenticatedFetch={authenticatedFetch}
              initialSubmissionId={reviewingSubmission.id}
            />
          )}

          {user.role === 'TEACHER' && (
            <>
              {(isCreatingQuiz || editingQuiz) && (
                <QuizCreator 
                  teacherId={user.id} 
                  initialData={editingQuiz} 
                  onClose={() => { setIsCreatingQuiz(false); setEditingQuiz(null); navigate('/'); }} 
                  onSave={handleSaveQuiz} 
                  authenticatedFetch={authenticatedFetch}
                />
              )}
              {reviewingQuiz && (
                <SubmissionReview 
                  quiz={reviewingQuiz} 
                  onClose={() => setReviewingQuiz(null)} 
                  authenticatedFetch={authenticatedFetch}
                />
              )}
              {isManagingClasses && (
                <ManageClasses 
                  teacherId={user.id} 
                  teacherName={user.full_name || user.username} 
                  onClose={() => setIsManagingClasses(false)} 
                  authenticatedFetch={authenticatedFetch}
                />
              )}
            </>
          )}
        </div>
      </div>
    )
  } />
</Routes>
</ErrorBoundary>
  );
}
