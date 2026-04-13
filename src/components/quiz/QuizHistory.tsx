import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  ArrowLeft,
  Calendar,
  Award,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuizHistoryProps {
  userId: number;
  courseId?: number | null;
  onClose?: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface Submission {
  id: number;
  quizId: number;
  quizName: string;
  quizTitle?: string;
  teacherName?: string;
  className?: string;
  score: number;
  totalScore: number;
  status: 'SUBMITTED' | 'GRADED' | 'IN_PROGRESS' | 'PENDING';
  timestamp: string;
  evaluationTimestamp?: string;
  teacherFeedback?: string;
  answers: {
    questionId: number;
    questionText: string;
    studentAnswer: any;
    selectedOption?: number | null;
    correctAnswer: any;
    pointsEarned: number;
    maxPoints: number;
    type: 'MULTIPLE_CHOICE' | 'ESSAY';
    options?: string[];
  }[];
}

export function QuizHistory({ userId, courseId, onClose, authenticatedFetch }: QuizHistoryProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'GRADED'>('GRADED');

  useEffect(() => {
    fetchSubmissions();
  }, [courseId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let url = `/api/quiz-history?studentId=${userId}`;
      if (courseId) {
        url += `&classId=${courseId}`;
      }
      const response = await authenticatedFetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (activeTab === 'PENDING') {
      return sub.status === 'PENDING' || sub.status === 'SUBMITTED';
    }
    return sub.status === 'GRADED';
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedSubmission) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        {/* Review Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedSubmission(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedSubmission.quizName}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Submitted on {formatDate(selectedSubmission.timestamp)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-black mb-1">Final Score</div>
            <div className="text-2xl font-black text-veritas-indigo font-mono">
              {selectedSubmission.status === 'GRADED' 
                ? `${selectedSubmission.score}/${selectedSubmission.totalScore}`
                : "PENDING"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Feedback Section */}
            {selectedSubmission.status === 'GRADED' && selectedSubmission.teacherFeedback && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-veritas-indigo" />
                  <h3 className="font-bold text-veritas-indigo uppercase tracking-widest text-xs">Teacher's Feedback</h3>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed font-medium italic">
                  "{selectedSubmission.teacherFeedback}"
                </p>
              </div>
            )}

            {/* Questions Review */}
            <div className="space-y-6">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Submission Review
              </h3>
              
              {selectedSubmission.answers.map((ans, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-black mb-1">Question {idx + 1}</div>
                      <h4 className="text-slate-800 font-bold leading-relaxed">{ans.questionText}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        ans.pointsEarned === ans.maxPoints ? "bg-emerald-50 text-emerald-600" : 
                        ans.pointsEarned > 0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {selectedSubmission.status === 'GRADED' ? `${ans.pointsEarned}/${ans.maxPoints} pts` : `Max: ${ans.maxPoints} pts`}
                      </div>
                    </div>
                  </div>

                  {ans.type === 'MULTIPLE_CHOICE' ? (
                    <div className="space-y-2 mt-4">
                      {ans.options?.map((opt, optIdx) => {
                        const isStudentChoice = ans.selectedOption === optIdx;
                        const isCorrectChoice = Number(ans.correctAnswer) === optIdx;
                        
                        return (
                          <div 
                            key={optIdx}
                            className={cn(
                              "p-4 rounded-xl border-2 text-sm font-medium flex items-center justify-between transition-all",
                              isCorrectChoice ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                              isStudentChoice && !isCorrectChoice ? "bg-rose-50 border-rose-200 text-rose-800" :
                              "bg-slate-50 border-slate-100 text-slate-600"
                            )}
                          >
                            <span>{opt}</span>
                            <div className="flex items-center gap-2">
                              {isStudentChoice && (
                                <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">Your Answer</span>
                              )}
                              {isCorrectChoice && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              {isStudentChoice && !isCorrectChoice && (
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-mono text-slate-400 uppercase font-black mb-2">Your Response</div>
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{ans.studentAnswer || "No answer provided."}</p>
                      </div>
                      {selectedSubmission.status === 'GRADED' && ans.correctAnswer && (
                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                          <div className="text-[10px] font-mono text-emerald-500 uppercase font-black mb-2">Model Answer / Key Points</div>
                          <p className="text-emerald-800 text-sm leading-relaxed whitespace-pre-wrap">{ans.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="portal-card-header flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="portal-header-icon-box">
            <Award className="w-6 h-6 text-veritas-indigo" />
          </div>
          <div>
            <h2 className="portal-header-title">Quiz History</h2>
            <p className="portal-header-subtitle">Review your performance and feedback</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="portal-close-button"
          title="Back to Dashboard"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
        <div className="mb-8">
          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('GRADED')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
                activeTab === 'GRADED' 
                  ? "bg-white text-veritas-indigo shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Graded
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
                activeTab === 'PENDING' 
                  ? "bg-white text-veritas-indigo shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Pending
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-4 border-veritas-indigo/20 border-t-veritas-indigo rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading History...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No {activeTab.toLowerCase()} quizzes</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {activeTab === 'GRADED' 
                ? "You don't have any graded quizzes yet." 
                : "All your submissions have been graded or you haven't submitted any quizzes."}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quiz Title</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Attempt Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Final Score</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center border",
                              sub.status === 'GRADED' ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-amber-50 border-amber-100 text-amber-500"
                            )}>
                              {sub.status === 'GRADED' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <span className="font-bold text-slate-800 group-hover:text-veritas-indigo transition-colors">{sub.quizTitle || sub.quizName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-600 font-medium">{sub.className || 'General'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-600 font-medium">{sub.teacherName || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Calendar className="w-4 h-4 text-slate-300" />
                            {formatDate(sub.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {sub.status === 'GRADED' ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-sm font-black text-veritas-indigo font-mono">{sub.score}/{sub.totalScore}</span>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Completed</span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-sm font-black text-amber-500 font-mono italic">Waiting</span>
                              <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">Reviewing</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-veritas-indigo hover:text-white text-slate-600 text-xs font-black rounded-xl transition-all"
                          >
                            View Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
