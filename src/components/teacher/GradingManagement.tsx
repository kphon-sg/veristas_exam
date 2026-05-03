import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Award,
  FileText,
  User,
  BookOpen,
  Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface GradingManagementProps {
  teacherId: number;
  onClose: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReviewSubmission: (submission: any) => void;
}

export function GradingManagement({ teacherId, onClose, authenticatedFetch, onReviewSubmission }: GradingManagementProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'GRADED'>('PENDING');

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const url = `/api/teacher/submissions?teacherId=${teacherId}&status=${activeTab === 'PENDING' ? 'PENDING' : 'GRADED'}`;
      const response = await authenticatedFetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching submissions for grading:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="portal-card-header flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="portal-header-icon-box">
            <Award className="w-6 h-6 text-veritas-indigo" />
          </div>
          <div>
            <h2 className="portal-header-title">Grading Management</h2>
            <p className="portal-header-subtitle">Review and grade student submissions</p>
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

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="w-full space-y-8">
          {/* Filter Switch */}
          <div className="flex items-center justify-between">
            <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit shadow-inner">
              <button
                onClick={() => setActiveTab('PENDING')}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                  activeTab === 'PENDING' 
                    ? "bg-white text-veritas-indigo shadow-md" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Clock className={cn("w-4 h-4", activeTab === 'PENDING' ? "text-veritas-indigo" : "text-slate-400")} />
                Pending
              </button>
              <button
                onClick={() => setActiveTab('GRADED')}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                  activeTab === 'GRADED' 
                    ? "bg-white text-veritas-indigo shadow-md" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <CheckCircle2 className={cn("w-4 h-4", activeTab === 'GRADED' ? "text-veritas-indigo" : "text-slate-400")} />
                Graded
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Filter className="w-4 h-4" />
              Showing {submissions.length} {activeTab.toLowerCase()} items
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-veritas-indigo/20 border-t-veritas-indigo rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-12 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No {activeTab.toLowerCase()} submissions</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                {activeTab === 'PENDING' 
                  ? "Great job! All submissions have been graded." 
                  : "You haven't graded any submissions yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-veritas-indigo/30 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                        <User className="w-6 h-6 text-slate-400 group-hover:text-veritas-indigo" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-veritas-indigo transition-colors">{sub.studentName}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <BookOpen className="w-3.5 h-3.5 text-slate-300" />
                            {sub.classCode} - {sub.className}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <FileText className="w-3.5 h-3.5 text-slate-300" />
                            {sub.quizTitle}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-4">
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400 uppercase font-black mb-0.5">Submitted On</div>
                          <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                            {formatDate(sub.submitted_at)}
                          </div>
                        </div>
                        
                        <div className="text-right min-w-[80px]">
                          <div className="text-[10px] font-mono text-slate-400 uppercase font-black mb-0.5">Score</div>
                          <div className={cn(
                            "text-lg font-black font-mono",
                            sub.status === 'GRADED' ? "text-emerald-600" : "text-amber-500 italic"
                          )}>
                            {sub.status === 'GRADED' ? `${sub.score}/${sub.total_questions || sub.total_score || 0}` : 'Pending'}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onReviewSubmission(sub)}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                          activeTab === 'PENDING'
                            ? "bg-veritas-indigo text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {activeTab === 'PENDING' ? 'Grade Now' : 'Review Grade'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
