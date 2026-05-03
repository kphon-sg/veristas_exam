import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  BookOpen, 
  User as UserIcon, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search,
  ArrowLeft,
  X
} from 'lucide-react';
import { SubmissionReview } from '../admin/SubmissionReview';
import { cn } from '../../lib/utils';

interface StudentScoresViewProps {
  teacherId: number;
  onClose: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

type ViewState = 'CLASSES' | 'STUDENTS' | 'QUIZZES';

export const StudentScoresView: React.FC<StudentScoresViewProps> = ({ teacherId, onClose, authenticatedFetch }) => {
  const [viewState, setViewState] = useState<ViewState>('CLASSES');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<any>(null);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentQuizzes, setStudentQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Teacher's Classes
  useEffect(() => {
    console.log(`[StudentScoresView] useEffect triggered. viewState: ${viewState}, teacherId: ${teacherId}`);
    if (viewState === 'CLASSES') {
      setLoading(true);
      setError(null);
      console.log(`[StudentScoresView] Fetching classes for teacherId: ${teacherId}`);
      authenticatedFetch(`/api/teacher/courses?teacherId=${teacherId}`)
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log(`[StudentScoresView] Classes fetched:`, data);
          setClasses(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error("[StudentScoresView] Error fetching teacher courses:", err);
          setError(err.message || "Failed to load classes");
          setLoading(false);
        });
    }
  }, [teacherId, viewState]);

  // 2. Fetch Students in Class
  useEffect(() => {
    console.log(`[StudentScoresView] useEffect triggered. viewState: ${viewState}, selectedClass:`, selectedClass);
    if (viewState === 'STUDENTS' && selectedClass) {
      setLoading(true);
      setError(null);
      console.log(`[StudentScoresView] Fetching students for classId: ${selectedClass.id}`);
      authenticatedFetch(`/api/teacher/courses/${selectedClass.id}/students`)
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setStudents(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error("[StudentScoresView] Error fetching class students:", err);
          setError(err.message || "Failed to load students");
          setLoading(false);
        });
    }
  }, [selectedClass, viewState]);

  // 3. Fetch Student's Quizzes in Class
  const fetchStudentQuizzes = useCallback(() => {
    if (viewState === 'QUIZZES' && selectedClass && selectedStudent) {
      setLoading(true);
      setError(null);
      console.log(`[StudentScoresView] Fetching quizzes for studentId: ${selectedStudent.id} in classId: ${selectedClass.id}`);
      authenticatedFetch(`/api/teacher/courses/${selectedClass.id}/students/${selectedStudent.id}/quizzes`)
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setStudentQuizzes(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error("[StudentScoresView] Error fetching student quizzes:", err);
          setError(err.message || "Failed to load quiz data");
          setLoading(false);
        });
    }
  }, [selectedClass, selectedStudent, viewState]);

  useEffect(() => {
    fetchStudentQuizzes();
  }, [fetchStudentQuizzes]);

  const handleBack = () => {
    if (viewState === 'QUIZZES') setViewState('STUDENTS');
    else if (viewState === 'STUDENTS') setViewState('CLASSES');
    else onClose();
  };

  const getCheatingBadge = (status: string) => {
    switch (status) {
      case 'CHEATING':
        return <ShieldX className="w-4 h-4 text-red-500" />;
      case 'SUSPICIOUS':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'NO_CHEATING':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#f4f7f9] flex flex-col">
      {/* Header */}
      <div className="portal-card-header flex items-center justify-between px-8 py-6 sticky top-0 z-50">
        <div className="flex items-center gap-6 relative z-10">
          <button 
            onClick={handleBack}
            className="portal-close-button bg-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="portal-header-icon-box">
              {viewState === 'CLASSES' && <BookOpen className="w-6 h-6 text-indigo-600" />}
              {viewState === 'STUDENTS' && <Users className="w-6 h-6 text-indigo-600" />}
              {viewState === 'QUIZZES' && <UserIcon className="w-6 h-6 text-indigo-600" />}
            </div>
            <div>
              <h2 className="portal-header-title">
                {viewState === 'CLASSES' && "My Classes"}
                {viewState === 'STUDENTS' && `Class: ${selectedClass?.courseCode}`}
                {viewState === 'QUIZZES' && selectedStudent?.fullName}
              </h2>
              <p className="portal-header-subtitle">
                {viewState === 'CLASSES' && "Select a class to view students"}
                {viewState === 'STUDENTS' && `${selectedClass?.name} • ${students.length} Students`}
                {viewState === 'QUIZZES' && `${selectedStudent?.studentCode || selectedStudent?.username} • ${selectedClass?.courseCode}`}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="portal-close-button relative z-10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto">
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-600 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
              <p className="text-sm font-bold">{error}</p>
              <button 
                onClick={() => {
                  if (viewState === 'CLASSES') setViewState('CLASSES'); // Trigger re-fetch
                  else if (viewState === 'STUDENTS') setViewState('STUDENTS');
                  else setViewState('QUIZZES');
                }}
                className="ml-auto px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
              <div className="w-12 h-12 border-4 border-portal-100 border-t-portal-600 rounded-full animate-spin" />
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest font-bold">Loading Data...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewState === 'CLASSES' && (
                <motion.div 
                  key="classes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {classes.length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-200">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-bold">No Classes Found</h3>
                        <p className="text-slate-500 text-sm mt-1">You are not assigned to any classes yet.</p>
                      </div>
                    </div>
                  ) : (
                    classes.map(cls => (
                      <motion.div 
                        key={cls.id}
                        whileHover={{ scale: 1.02, translateY: -4 }}
                        onClick={() => { setSelectedClass(cls); setViewState('STUDENTS'); }}
                        className="p-8 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-portal-400 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Users className="w-20 h-20 text-portal-500" />
                        </div>
                        <BookOpen className="w-8 h-8 text-portal-500 mb-6" />
                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{cls.courseCode}</h3>
                        <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest font-mono">{cls.name}</p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">{cls.studentCount} Students</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-portal-600 transition-colors" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {viewState === 'STUDENTS' && (
                <motion.div 
                  key="students"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search students by name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-12"
                      />
                    </div>
                  </div>

                  <div className="portal-card shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Student Info</th>
                          <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Student ID</th>
                          <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Quizzes Attempted</th>
                          <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Avg. Score</th>
                          <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <Users className="w-8 h-8 text-slate-200" />
                                <p className="text-slate-400 text-sm font-medium">No students found in this class.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map(student => (
                            <tr 
                              key={student.id}
                              className="hover:bg-portal-50 transition-colors group cursor-pointer"
                              onClick={() => { setSelectedStudent(student); setViewState('QUIZZES'); }}
                            >
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-slate-800">{student.fullName}</div>
                                    <div className="text-xs text-slate-500">{student.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-xs font-mono text-slate-500 font-bold">{student.studentCode || "N/A"}</span>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-slate-300" />
                                  <span className="text-sm font-bold text-slate-700">{student.quizzesAttempted}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                {student.avgScore !== null ? (
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-black text-emerald-600 font-mono">{student.avgScore.toFixed(1)}%</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-300 font-mono">N/A</span>
                                )}
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button className="p-2 bg-white border border-slate-200 rounded-md text-slate-300 group-hover:text-portal-600 group-hover:border-portal-500 transition-all shadow-sm">
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {viewState === 'QUIZZES' && (
                <motion.div 
                  key="quizzes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {studentQuizzes.length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-4">
                      <Activity className="w-12 h-12 text-slate-100" />
                      <p className="text-slate-400 text-sm font-medium">No quizzes found for this student in this class.</p>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {/* Graded Section */}
                      {studentQuizzes.filter(q => q.status === 'GRADED').length > 0 && (
                        <section>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Graded</h3>
                              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Completed evaluations</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studentQuizzes.filter(q => q.status === 'GRADED').map((quiz) => (
                              <motion.div 
                                key={quiz.quizId}
                                whileHover={{ scale: 1.01 }}
                                className="p-6 bg-white border border-slate-200 rounded-lg transition-all shadow-sm group cursor-pointer hover:border-portal-400 hover:shadow-xl"
                                onClick={() => {
                                  if (quiz.submissionId) {
                                    setSelectedQuizSubmission({
                                      id: quiz.quizId,
                                      title: quiz.quizName,
                                      submissionId: quiz.submissionId
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between mb-6">
                                  <div className="space-y-1">
                                    <h4 className="text-lg font-black text-slate-800">{quiz.quizName}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                      <Calendar className="w-3 h-3" />
                                      {quiz.submittedAt ? new Date(quiz.submittedAt).toLocaleDateString() : "Not Submitted"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="badge badge-emerald">GRADED</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
                                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">Score</div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-2xl font-black text-portal-600 font-mono">
                                        {quiz.score !== null ? quiz.score.toFixed(1) : "--"}
                                      </span>
                                      <span className="text-xs text-slate-400 font-mono">/ {quiz.totalScore !== null ? quiz.totalScore.toFixed(1) : "--"}</span>
                                    </div>
                                  </div>
                                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
                                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">Risk Score</div>
                                    <div className="flex items-baseline gap-1">
                                      <span className={`text-2xl font-black font-mono ${
                                        quiz.riskScore >= 80 ? "text-rose-600" :
                                        quiz.riskScore >= 40 ? "text-amber-600" : "text-emerald-600"
                                      }`}>
                                        {quiz.riskScore !== null ? `${quiz.riskScore.toFixed(0)}%` : "--"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {quiz.submissionId && (
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-slate-300 group-hover:text-portal-600 transition-colors">
                                    <span className="text-[10px] font-mono uppercase font-black">Review Submission</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Pending Section */}
                      {studentQuizzes.filter(q => q.submissionId !== null && q.status !== 'GRADED').length > 0 && (
                        <section>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Pending</h3>
                              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Awaiting evaluation</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studentQuizzes.filter(q => q.submissionId !== null && q.status !== 'GRADED').map((quiz) => (
                              <motion.div 
                                key={quiz.quizId}
                                whileHover={{ scale: 1.01 }}
                                className="p-6 bg-white border border-slate-200 rounded-lg border-dashed transition-all shadow-sm group cursor-pointer hover:border-portal-400 hover:shadow-xl"
                                onClick={() => {
                                  if (quiz.submissionId) {
                                    setSelectedQuizSubmission({
                                      id: quiz.quizId,
                                      title: quiz.quizName,
                                      submissionId: quiz.submissionId
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between mb-6">
                                  <div className="space-y-1">
                                    <h4 className="text-lg font-black text-slate-800">{quiz.quizName}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                      <Calendar className="w-3 h-3" />
                                      {quiz.submittedAt ? new Date(quiz.submittedAt).toLocaleDateString() : "In Progress"}
                                    </div>
                                  </div>
                                  <div className="badge bg-amber-100 text-amber-700 border-amber-200">
                                    {quiz.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'PENDING'}
                                  </div>
                                </div>

                                <div className="p-8 bg-amber-50/50 border border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center text-center">
                                  <Clock className={cn("w-6 h-6 text-amber-500 mb-3", quiz.status === 'SUBMITTED' && "animate-pulse")} />
                                  <p className="text-sm font-bold text-amber-700">
                                    {quiz.status === 'IN_PROGRESS' ? 'Student is taking quiz' : 'Waiting for grading'}
                                  </p>
                                  <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mt-1">
                                    {quiz.status === 'IN_PROGRESS' ? 'Active session' : 'Submission received'}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Not Started Section */}
                      {studentQuizzes.filter(q => q.submissionId === null).length > 0 && (
                        <section>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Not Started</h3>
                              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Quizzes yet to be attempted</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studentQuizzes.filter(q => q.submissionId === null).map((quiz) => (
                              <motion.div 
                                key={quiz.quizId}
                                className="p-6 bg-slate-50/50 border border-slate-200 rounded-lg opacity-60"
                              >
                                <div className="flex items-start justify-between mb-6">
                                  <h4 className="text-lg font-black text-slate-800">{quiz.quizName}</h4>
                                  <div className="badge badge-slate text-[10px]">NOT STARTED</div>
                                </div>
                                <div className="p-8 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                                  <Activity className="w-6 h-6 text-slate-300 mb-3" />
                                  <p className="text-sm font-bold text-slate-400 italic">No attempt recorded</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Submission Review Modal Overlay */}
      {selectedQuizSubmission && (
        <SubmissionReview 
          quiz={selectedQuizSubmission} 
          initialSubmissionId={selectedQuizSubmission.submissionId}
          studentId={selectedStudent?.id}
          authenticatedFetch={authenticatedFetch}
          onClose={() => {
            setSelectedQuizSubmission(null);
            fetchStudentQuizzes(); // Refresh quiz list after closing review
          }} 
        />
      )}
    </div>
  );
};
