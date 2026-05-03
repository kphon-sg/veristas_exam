import React, { useEffect, useState } from 'react';
import { X, User, Clock, CheckCircle2, AlertCircle, ChevronRight, Save, Activity, ShieldAlert, ShieldCheck, ShieldX, History, Play, Image as ImageIcon, Eye, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useNotifications } from '../ui/NotificationProvider';

interface SubmissionReviewProps {
  quiz: any;
  onClose: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  initialSubmissionId?: number | null;
  studentId?: number | null;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({ quiz: initialQuiz, onClose, authenticatedFetch, initialSubmissionId, studentId }) => {
  const { notify, confirm } = useNotifications();
  const [quiz, setQuiz] = useState<any>(initialQuiz);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'ANALYSIS' | 'EVIDENCE'>('ANALYSIS');
  const [evidenceLogs, setEvidenceLogs] = useState<any[]>([]);
  const [fetchingEvidence, setFetchingEvidence] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const isGraded = selectedSubmission?.status === 'GRADED';

  useEffect(() => {
    if (selectedSubmission?.id) {
      setFetchingEvidence(true);
      // Reset evidence state to prevent stale data from previous student
      setEvidenceLogs([]);
      setSelectedEvidence(null);
      setVideoError(null);

      // Fetch evidence logs (images/videos)
      authenticatedFetch(`/api/submissions/${selectedSubmission.id}/evidence`)
        .then(res => res.json())
        .then(data => {
          const logs = Array.isArray(data) ? data : [];
          setEvidenceLogs(logs);
          // Auto-select first video if available
          const firstVideo = logs.find(l => l.evidence_type === 'VIDEO');
          if (firstVideo) {
            setSelectedEvidence(firstVideo);
          }
          setFetchingEvidence(false);
        })
        .catch(err => {
          console.error("Error fetching evidence logs:", err);
          setFetchingEvidence(false);
        });

      // Fetch full analysis including proctoring logs
      authenticatedFetch(`/api/submissions/${selectedSubmission.id}/analysis`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id === selectedSubmission.id) {
            setSelectedSubmission((prev: any) => ({
              ...prev,
              ...data,
              violations: data.proctoringLogs || data.violations || []
            }));
          }
        })
        .catch(err => console.error("Error fetching submission analysis:", err));
    }
  }, [selectedSubmission?.id]);

  useEffect(() => {
    if (!quiz.questions || quiz.questions.length === 0) {
      console.log("[SubmissionReview] Quiz questions missing, fetching full quiz data...");
      authenticatedFetch(`/api/quizzes`)
        .then(res => res.json())
        .then(data => {
          const fullQuiz = data.find((q: any) => q.id === quiz.id);
          if (fullQuiz) {
            setQuiz(fullQuiz);
          }
        })
        .catch(err => console.error("Error fetching quiz details:", err));
    }
  }, [quiz.id]);

  const handleSaveGrades = async (finalize: boolean = false) => {
    if (!selectedSubmission || isGraded) {
      console.warn("[SubmissionReview] Cannot save grades: submission is null or already graded");
      return;
    }

    if (finalize) {
      const isConfirmed = await confirm({
        title: 'Confirm & Finalize Grades',
        message: "Are you sure you want to finalize these grades? This will notify the student and you won't be able to change them again.",
        type: 'warning',
        confirmLabel: 'Confirm & Finalize'
      });
      if (!isConfirmed) return;
    }

    setSaving(true);
    console.log(`[SubmissionReview] ${finalize ? 'Finalizing' : 'Saving'} grades for submission:`, selectedSubmission.id);
    try {
      const res = await authenticatedFetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          score: selectedSubmission.score,
          answers: selectedSubmission.answers,
          finalize: finalize
        })
      });
      if (res.ok) {
        const updated = await res.json();
        console.log("[SubmissionReview] Grades saved successfully:", updated);
        // Ensure the updated object has totalScore mapped correctly if backend returns total_score
        const mappedUpdated = {
          ...updated,
          totalScore: updated.total_score !== undefined ? updated.total_score : updated.totalScore
        };
        setSubmissions((prev: any[]) => prev.map(s => s.id === mappedUpdated.id ? mappedUpdated : s));
        setSelectedSubmission(mappedUpdated);
        
        if (finalize) {
          notify.success("Grades finalized successfully! Student has been notified.");
        } else {
          notify.success("Draft grades saved successfully.");
        }
      } else {
        const errData = await res.json();
        console.error("[SubmissionReview] Failed to save grades:", errData);
        notify.error(`Failed to save grades: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("[SubmissionReview] Network error while saving grades:", err);
      notify.error("Network error while saving grades.");
    } finally {
      setSaving(false);
    }
  };

  const updatePoints = (questionId: number, points: number) => {
    if (!selectedSubmission || isGraded) return;
    
    // Create a copy of answers and update or add the specific answer
    const existingAnswerIndex = selectedSubmission.answers.findIndex((a: any) => a.questionId === questionId);
    let newAnswers = [...selectedSubmission.answers];
    
    if (existingAnswerIndex !== -1) {
      newAnswers[existingAnswerIndex] = { ...newAnswers[existingAnswerIndex], pointsEarned: points };
    } else {
      newAnswers.push({
        questionId: questionId,
        pointsEarned: points,
        answerText: "",
        selectedOption: null
      });
    }
    
    // Calculate new total score ensuring all points are treated as numbers
    const newScore = newAnswers.reduce((acc: number, a: any) => acc + Number(a.pointsEarned || 0), 0);
    
    setSelectedSubmission({ 
      ...selectedSubmission, 
      answers: newAnswers, 
      score: newScore 
    });
  };

  const totalPossiblePoints = (quiz.questions || []).reduce((acc: number, q: any) => acc + Number(q.points || 1), 0);

  useEffect(() => {
    const url = studentId 
      ? `/api/submissions?quizId=${quiz.id}&studentId=${studentId}`
      : `/api/submissions?quizId=${quiz.id}`;
      
    authenticatedFetch(url)
      .then(res => res.json())
      .then(data => {
        const mapped = (Array.isArray(data) ? data : []).map((s: any) => ({
          ...s,
          totalScore: s.total_score !== undefined ? s.total_score : s.totalScore
        }));
        setSubmissions(mapped);
        setLoading(false);
        
        if (initialSubmissionId) {
          const sub = mapped.find(s => s.id === initialSubmissionId);
          if (sub) setSelectedSubmission(sub);
        }
      })
      .catch(err => {
        console.error("Error fetching submissions:", err);
        setLoading(false);
      });
  }, [quiz.id]);

  const getCheatingBadge = (status: string) => {
    const score = Number(selectedSubmission?.riskScore || 0);
    
    // Use score for more precise classification if available, otherwise fallback to status
    if (score > 70 || status === 'CHEATING') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-500 uppercase tracking-widest">
          <ShieldX className="w-3 h-3" /> Cheating Detected
        </div>
      );
    }
    if (score > 30 || status === 'SUSPICIOUS') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest">
          <ShieldAlert className="w-3 h-3" /> Suspicious
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
        <ShieldCheck className="w-3 h-3" /> No Cheating
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="portal-card w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="portal-card-header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="portal-header-icon-box">
              <User className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <h2 className="portal-header-title">Submissions: {quiz.title}</h2>
              <p className="portal-header-subtitle">{submissions.length} students submitted</p>
            </div>
          </div>
          <button onClick={onClose} className="portal-close-button">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Sidebar: List of Submissions */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto p-4 space-y-2 bg-slate-50 custom-scrollbar">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs font-mono uppercase font-bold">Loading...</div>
            ) : (Array.isArray(submissions) ? submissions : []).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-mono uppercase font-bold">No submissions yet</div>
            ) : (
              (Array.isArray(submissions) ? submissions : []).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`w-full p-4 rounded-lg border text-left transition-all group ${
                    selectedSubmission?.id === sub.id 
                      ? "bg-portal-50 border-portal-500 shadow-sm" 
                      : "bg-white border-slate-200 hover:border-portal-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-800">{sub.studentName || sub.studentId}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedSubmission?.id === sub.id ? "translate-x-1 text-portal-600" : "text-slate-300"}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "N/A"}
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === 'GRADED' && (
                        <div className="badge badge-emerald text-[8px]">Graded</div>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        sub.cheatingStatus === 'CHEATING' ? "bg-rose-500" :
                        sub.cheatingStatus === 'SUSPICIOUS' ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Main Content: Review Answers & Behavior Logs */}
          <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
            {selectedSubmission ? (
              <div className="space-y-8">
                {/* Global Header Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Reviewing: {selectedSubmission.studentName || selectedSubmission.studentId}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Score:</span>
                          <span className="text-xl font-black text-portal-600 font-mono">
                            {Number(selectedSubmission.score || 0).toFixed(1)} <span className="text-slate-400 text-sm font-normal">/ {Number(selectedSubmission.totalScore || totalPossiblePoints || 0).toFixed(1)}</span>
                          </span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                        {getCheatingBadge(selectedSubmission.cheatingStatus)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isGraded ? (
                        <div className="badge badge-emerald py-2 px-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Finalized
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleSaveGrades(false)}
                            disabled={saving}
                            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save Draft"}
                          </button>
                          <button 
                            onClick={() => handleSaveGrades(true)}
                            disabled={saving}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {saving ? "Finalizing..." : <><CheckCircle2 className="w-4 h-4" /> Confirm & Finalize</>}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                      <button 
                        onClick={() => setActiveRightTab('ANALYSIS')}
                        className={cn(
                          "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeRightTab === 'ANALYSIS' ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <Activity className="w-3 h-3" /> Analysis
                      </button>
                      <button 
                        onClick={() => setActiveRightTab('EVIDENCE')}
                        className={cn(
                          "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeRightTab === 'EVIDENCE' ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <ImageIcon className="w-3 h-3" /> Evidence
                        {evidenceLogs.length > 0 && (
                          <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                            {evidenceLogs.length}
                          </span>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest">Risk Score</span>
                        <span className={`text-sm font-black font-mono ${
                          Number(selectedSubmission.riskScore || 0) > 70 ? "text-rose-600" :
                          Number(selectedSubmission.riskScore || 0) > 30 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {Number(selectedSubmission.riskScore || 0).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {activeRightTab === 'ANALYSIS' ? (
                  <div className="grid grid-cols-12 gap-8">
                    {/* Left Side: Answers */}
                    <div className="col-span-12 xl:col-span-7 space-y-8">
                      {/* Session Info */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">Started At</div>
                          <div className="text-xs text-slate-600 font-bold">
                            {selectedSubmission.startTime ? new Date(selectedSubmission.startTime).toLocaleTimeString() : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">Duration</div>
                          <div className="text-xs text-slate-600 font-bold">
                            {selectedSubmission.durationSeconds ? `${Math.floor(selectedSubmission.durationSeconds / 60)}m ${selectedSubmission.durationSeconds % 60}s` : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">IP Address</div>
                          <div className="text-xs text-slate-600 font-bold">{selectedSubmission.ipAddress || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">Browser</div>
                          <div className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]" title={selectedSubmission.browserInfo}>
                            {selectedSubmission.browserInfo || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 font-bold">
                          <History className="w-4 h-4" /> Student Responses
                        </h4>
                        {quiz.questions && quiz.questions.map((q: any, idx: number) => {
                          const studentAns = selectedSubmission.answers.find((a: any) => a.questionId === q.id);
                          return (
                            <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-portal-300 transition-colors shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Question {idx + 1}</span>
                                  <span className="badge badge-slate text-[9px]">
                                    {q.type}
                                  </span>
                                </div>
                              </div>
                              <p className="text-slate-800 font-bold leading-relaxed">{q.text}</p>
                              
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-3 font-bold">Student Answer</label>
                                {q.type === 'MULTIPLE_CHOICE' ? (
                                  <div className="space-y-2">
                                    {q.options.map((opt: string, oIdx: number) => (
                                      <div key={oIdx} className={`flex items-center gap-3 text-sm p-3 rounded-lg border transition-all ${
                                        studentAns?.selectedOption === oIdx 
                                          ? (oIdx === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600")
                                          : (oIdx === q.correctAnswer ? "bg-emerald-50/50 border-emerald-100 text-emerald-600/60" : "border-transparent text-slate-500")
                                      }`}>
                                        {studentAns?.selectedOption === oIdx ? (
                                          oIdx === q.correctAnswer ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-current opacity-20" />
                                        )}
                                        <span className="font-bold">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-slate-200 font-medium">
                                    {studentAns?.answerText || "No answer provided"}
                                  </p>
                                )}
                              </div>

                              <div className="flex justify-end">
                                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shadow-inner">
                                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Assign Score</span>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      value={studentAns?.pointsEarned || 0}
                                      onChange={(e) => updatePoints(q.id, parseFloat(e.target.value) || 0)}
                                      disabled={isGraded}
                                      className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-sm text-portal-600 font-black text-center focus:outline-none focus:border-portal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      step="0.5"
                                      min="0"
                                      max={q.points || 1}
                                    />
                                    <span className="text-slate-400 text-xs font-mono font-bold">/ {q.points || 1}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Side: Analysis Sidebar */}
                    <div className="col-span-12 xl:col-span-5 space-y-6">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sticky top-8">
                        {/* Violation Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">High</div>
                            <div className={`text-lg font-black font-mono ${selectedSubmission.highViolationCount > 0 ? "text-rose-600" : "text-slate-300"}`}>
                              {selectedSubmission.highViolationCount || 0}
                            </div>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Med</div>
                            <div className={`text-lg font-black font-mono ${selectedSubmission.mediumViolationCount > 0 ? "text-amber-600" : "text-slate-300"}`}>
                              {selectedSubmission.mediumViolationCount || 0}
                            </div>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Low</div>
                            <div className={`text-lg font-black font-mono ${selectedSubmission.lowViolationCount > 0 ? "text-portal-600" : "text-slate-300"}`}>
                              {selectedSubmission.lowViolationCount || 0}
                            </div>
                          </div>
                        </div>

                        {/* Chronological Logs */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedSubmission.violations && selectedSubmission.violations.length > 0 ? (
                            selectedSubmission.violations.map((v: any, vIdx: number) => (
                              <div key={v.id} className="relative pl-6 pb-4 border-l border-slate-200 last:pb-0">
                                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  String(v.severity || '').toLowerCase() === 'high' ? "bg-rose-500" :
                                  String(v.severity || '').toLowerCase() === 'medium' ? "bg-amber-500" : "bg-portal-500"
                                }`} />
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                                    {v.timestamp ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                                  </span>
                                  <span className={cn("badge text-[8px]", 
                                    String(v.severity || '').toLowerCase() === 'high' ? "badge-rose" :
                                    String(v.severity || '').toLowerCase() === 'medium' ? "badge-amber" :
                                    "badge-teal"
                                  )}>
                                    {v.severity}
                                  </span>
                                </div>
                                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{String(v.type || '').replace(/_/g, ' ')}</div>
                                    {v.duration > 0 && (
                                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                                        {v.duration}s
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{v.message}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 text-slate-300">
                              <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-20" />
                              <p className="text-[10px] font-mono uppercase tracking-widest font-bold">No suspicious behavior recorded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8" key={`evidence-container-${selectedSubmission.id}`}>
                    {/* Main Preview Player Section */}
                    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 relative group">
                      <div className="aspect-video w-full relative">
                        {fetchingEvidence ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-xs font-mono uppercase tracking-widest font-bold">Loading Evidence...</p>
                          </div>
                        ) : videoError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 space-y-4 p-8 text-center">
                            <AlertCircle className="w-16 h-16 opacity-20" />
                            <p className="text-sm font-black uppercase tracking-widest">{videoError}</p>
                            <button 
                              onClick={() => {
                                setVideoError(null);
                                const current = selectedEvidence;
                                setSelectedEvidence(null);
                                setTimeout(() => setSelectedEvidence(current), 100);
                              }}
                              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Retry Playback
                            </button>
                          </div>
                        ) : selectedEvidence ? (
                          <video 
                            key={`main-player-${selectedEvidence.id}`}
                            src={selectedEvidence.file_url} 
                            controls 
                            autoPlay
                            className="w-full h-full object-contain"
                            poster={selectedEvidence.thumbnail_url}
                            onError={() => setVideoError("Playback failed. The video file may be corrupted or still uploading.")}
                            onLoadedData={() => setVideoError(null)}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Play className="w-16 h-16 opacity-20" />
                            <p className="text-xs font-mono uppercase tracking-widest font-bold">No snippets available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evidence Grid Header */}
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          <Play className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800 tracking-tight">Video Evidence Grid</h4>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                            {evidenceLogs.filter(l => l.evidence_type === 'VIDEO').length} snippets captured
                          </p>
                        </div>
                      </div>
                      <div className="badge badge-rose py-2 px-4 text-[10px] font-black uppercase tracking-widest">
                        Video-Only Mode Active
                      </div>
                    </div>

                    {/* Evidence Grid */}
                    <div className="min-h-[400px]">
                      {fetchingEvidence ? (
                        <div className="h-[400px] flex flex-col items-center justify-center">
                          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
                          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Synchronizing Evidence...</p>
                        </div>
                      ) : evidenceLogs.filter(l => l.evidence_type === 'VIDEO').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                          {evidenceLogs.filter(l => l.evidence_type === 'VIDEO').map((log, idx) => (
                            <motion.div 
                              key={log.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => setSelectedEvidence(log)}
                              className={cn(
                                "bg-white border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col cursor-pointer",
                                selectedEvidence?.id === log.id ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-200 hover:border-emerald-500/30"
                              )}
                            >
                              {/* Card Header: Media Preview (Video Player) */}
                              <div className="aspect-video relative bg-slate-900 group-hover:bg-black transition-colors overflow-hidden">
                                <video 
                                  src={log.file_url} 
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  poster={log.thumbnail_url}
                                  muted
                                  onMouseOver={(e) => {
                                    const v = e.target as HTMLVideoElement;
                                    v.play().catch(() => console.warn("Preview playback failed"));
                                  }}
                                  onMouseOut={(e) => {
                                    const v = e.target as HTMLVideoElement;
                                    v.pause();
                                    v.currentTime = 0;
                                  }}
                                  onError={(e) => {
                                    const v = e.target as HTMLVideoElement;
                                    v.style.display = 'none';
                                    // Show fallback icon if video fails
                                    const parent = v.parentElement;
                                    if (parent && !parent.querySelector('.video-error-fallback')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'video-error-fallback absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500';
                                      fallback.innerHTML = '<span class="text-[8px] font-black uppercase">Preview Unavailable</span>';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                                
                                {/* Overlay Badge */}
                                <div className="absolute top-4 right-4">
                                  <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2">
                                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                      VIDEO
                                    </span>
                                  </div>
                                </div>

                                {/* Selection Indicator */}
                                {selectedEvidence?.id === log.id && (
                                  <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Card Body: Structured Info Bar */}
                              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="px-3 py-1 bg-rose-500 text-[10px] font-black text-white uppercase tracking-widest rounded-lg shadow-sm">
                                    {log.violation_type?.replace(/_/g, ' ') || 'UNKNOWN'}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 font-bold">
                                    <Clock className="w-3 h-3" />
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-tighter">
                                      Confidence: {Math.round((log.confidence_score || 0) * 100)}%
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                                    Source: Camera
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-slate-300">
                          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                            <ShieldCheck className="w-12 h-12 opacity-20 text-emerald-500" />
                          </div>
                          <p className="text-sm font-mono uppercase tracking-widest font-bold text-slate-400">No video evidence available</p>
                          <p className="text-xs text-slate-300 mt-2">All static images have been filtered out in Video-Only mode</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                <User className="w-16 h-16 opacity-10" />
                <p className="text-sm font-mono uppercase tracking-widest opacity-40 font-bold">Select a student submission to begin review</p>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Modal Removed for Direct In-App Preview */}
      </motion.div>
    </div>
  );
};
