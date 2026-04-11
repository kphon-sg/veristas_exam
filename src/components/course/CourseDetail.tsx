import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  GraduationCap, 
  Layout, 
  ExternalLink, 
  ChevronRight, 
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  Lightbulb,
  Download,
  PlayCircle,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import CourseCalendar from './CourseCalendar';
import GradeTrendChart from './GradeTrendChart';
import { QuizHistory } from '../quiz/QuizHistory';

interface CourseMaterial {
  id: number;
  title: string;
  url: string;
  type: 'PDF' | 'SLIDES' | 'VIDEO' | 'LINK' | 'OTHER';
  created_at: string;
}

interface CourseDetailProps {
  courseId: number;
  user: any;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onBack: () => void;
  onStartQuiz: (quiz: any) => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ 
  courseId, 
  user, 
  authenticatedFetch, 
  onBack,
  onStartQuiz
}) => {
  const [course, setCourse] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'quizzes' | 'history' | 'calendar'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, quizzesRes, submissionsRes, materialsRes] = await Promise.all([
          authenticatedFetch(`/api/classes`),
          authenticatedFetch(`/api/quizzes?courseId=${courseId}`),
          authenticatedFetch(`/api/submissions?studentId=${user.id}`),
          authenticatedFetch(`/api/classes/${courseId}/materials`)
        ]);

        if (courseRes.ok && quizzesRes.ok && submissionsRes.ok && materialsRes.ok) {
          const [courseData, quizzesData, submissionsData, materialsData] = await Promise.all([
            courseRes.json(),
            quizzesRes.json(),
            submissionsRes.json(),
            materialsRes.json()
          ]);

          const selectedCourse = courseData.find((c: any) => c.id === courseId);
          setCourse(selectedCourse);
          setQuizzes(quizzesData);
          setSubmissions(submissionsData.filter((s: any) => s.courseId === courseId || s.course_id === courseId));
          setMaterials(materialsData);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user.id]);

  const gradeTrendData = useMemo(() => {
    return submissions
      .filter(s => s.status === 'GRADED')
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
      .map(s => ({
        date: new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Number(s.score),
        quizName: s.quiz_name || s.quizName
      }));
  }, [submissions]);

  const nextAction = useMemo(() => {
    const now = new Date();
    const upcomingQuizzes = quizzes
      .filter(q => q.status === 'PUBLISHED' && new Date(q.deadline) > now)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    
    return upcomingQuizzes.length > 0 ? upcomingQuizzes[0] : null;
  }, [quizzes]);

  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    
    // Add quiz deadlines
    quizzes.forEach(q => {
      if (q.deadline) {
        events.push({
          id: `quiz-${q.id}`,
          title: `Deadline: ${q.title}`,
          date: new Date(q.deadline),
          type: 'DEADLINE'
        });
      }
    });

    // Add sessions (mocked for now)
    const now = new Date();
    events.push({
      id: 'session-1',
      title: 'Weekly Review Session',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0),
      type: 'SESSION'
    });

    return events;
  }, [quizzes]);

  if (loading) {
    return (
      <div className="col-span-12 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-veritas-indigo rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Course Details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="col-span-12 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800">Course Not Found</h2>
        <button onClick={onBack} className="mt-6 text-veritas-indigo font-bold flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="col-span-12 space-y-6">
      {/* Course Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10">
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-veritas-indigo transition-colors text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-indigo-100 text-veritas-indigo text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200">
                  {course.courseCode}
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  {course.educationLevel}
                </span>
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                {course.name}
              </h1>
              <p className="text-slate-500 font-medium max-w-2xl">
                {course.description || "No description provided for this course."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Instructor</p>
                <p className="text-sm font-bold text-slate-800">{course.teacherName}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                <GraduationCap className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-10 border-b border-slate-100">
          {[
            { id: 'overview', label: 'Overview', icon: Layout },
            { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
            { id: 'history', label: 'My Progress', icon: Clock },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
                activeTab === tab.id ? "text-veritas-indigo" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-veritas-indigo rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Left Column: Stats & Trends */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +12%
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Grade</p>
                  <p className="text-2xl font-black text-slate-800">
                    {submissions.length > 0 
                      ? (submissions.reduce((acc, s) => acc + Number(s.score), 0) / submissions.length).toFixed(1) 
                      : "0.0"}
                    <span className="text-sm text-slate-400 ml-1">/ 10</span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                      <BookOpen className="w-5 h-5 text-veritas-indigo" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quizzes Completed</p>
                  <p className="text-2xl font-black text-slate-800">
                    {submissions.filter(s => s.status === 'GRADED' || s.status === 'SUBMITTED').length}
                    <span className="text-sm text-slate-400 ml-1">/ {quizzes.length}</span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Tasks</p>
                  <p className="text-2xl font-black text-slate-800">
                    {quizzes.filter(q => !submissions.some(s => s.quiz_id === q.id || s.quizId === q.id)).length}
                  </p>
                </div>
              </div>

              {/* Grade Progress Tracker */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Grade Progress Tracker</h3>
                    <p className="text-xs text-slate-500 font-medium">Visualizing your performance trend over time</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <TrendingUp className="w-3.5 h-3.5 text-veritas-indigo" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Performance Trend</span>
                  </div>
                </div>
                <div className="h-[300px]">
                  <GradeTrendChart data={gradeTrendData} />
                </div>
              </div>
            </div>

            {/* Right Column: Utilities */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Smart Study Reminder */}
              <div className="bg-gradient-to-br from-veritas-deep to-veritas-indigo p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                      <Lightbulb className="w-4 h-4 text-teal-200" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-100">Smart Study Reminder</span>
                  </div>

                  {nextAction ? (
                    <>
                      <h4 className="text-lg font-black mb-2 leading-tight">Next Action: {nextAction.title}</h4>
                      <p className="text-xs text-teal-100/80 mb-6 font-medium">
                        Deadline: {new Date(nextAction.deadline).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <button 
                        onClick={() => onStartQuiz(nextAction)}
                        className="w-full py-3 bg-white text-veritas-indigo rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-50 transition-colors shadow-sm"
                      >
                        Start Now
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-black mb-2 leading-tight">You're All Caught Up!</h4>
                      <p className="text-xs text-teal-100/80 mb-6 font-medium">
                        No upcoming deadlines for this course. Great job staying on track!
                      </p>
                      <div className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest text-center">
                        Keep it up
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Resource Quick-Access */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-veritas-indigo" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Course Materials</h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{materials.length} Items</span>
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {materials.length > 0 ? (
                    materials.map((material) => (
                      <a 
                        key={material.id}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
                          material.type === 'PDF' && "bg-rose-50 border-rose-100 text-rose-500",
                          material.type === 'SLIDES' && "bg-amber-50 border-amber-100 text-amber-500",
                          material.type === 'VIDEO' && "bg-indigo-50 border-indigo-100 text-veritas-indigo",
                          material.type === 'LINK' && "bg-teal-50 border-teal-100 text-teal-500",
                          material.type === 'OTHER' && "bg-slate-50 border-slate-100 text-slate-500"
                        )}>
                          {material.type === 'PDF' && <Download className="w-5 h-5" />}
                          {material.type === 'SLIDES' && <FileText className="w-5 h-5" />}
                          {material.type === 'VIDEO' && <PlayCircle className="w-5 h-5" />}
                          {material.type === 'LINK' && <LinkIcon className="w-5 h-5" />}
                          {material.type === 'OTHER' && <FileText className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{material.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{material.type}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-veritas-indigo transition-colors" />
                      </a>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No materials posted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'quizzes' && (
          <motion.div 
            key="quizzes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => {
                const submission = submissions.find(s => s.quiz_id === quiz.id || s.quizId === quiz.id);
                const isCompleted = !!submission;
                const isGraded = submission?.status === 'GRADED';

                return (
                  <div 
                    key={quiz.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-veritas-indigo transition-all"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border",
                          isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-indigo-50 border-indigo-100 text-veritas-indigo"
                        )}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {isCompleted && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-veritas-indigo transition-colors">{quiz.title}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">{quiz.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {quiz.duration_minutes} Minutes
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          Due: {new Date(quiz.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      {isCompleted ? (
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Score</p>
                            <p className="text-sm font-black text-slate-800">
                              {isGraded ? `${submission.score} / ${submission.total_score}` : "Pending Grading"}
                            </p>
                          </div>
                          <button className="text-veritas-indigo text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                            View Details <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => onStartQuiz(quiz)}
                          className="w-full py-2.5 bg-veritas-indigo text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-veritas-deep transition-all shadow-sm active:scale-95"
                        >
                          Start Quiz
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-12 p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Quizzes Available</h3>
                <p className="text-sm text-slate-400 mt-2">Check back later for new assignments.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[70vh]"
          >
            <QuizHistory 
              userId={user.id}
              courseId={courseId}
              authenticatedFetch={authenticatedFetch}
            />
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CourseCalendar courseId={courseId} events={calendarEvents} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseDetail;
