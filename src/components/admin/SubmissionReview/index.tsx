import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, BookOpen, Clock, ShieldAlert, CheckCircle2, AlertTriangle, Info, Send, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../ui/NotificationProvider';
import { ViolationLog } from './ViolationLog';
import { GradingSection } from './GradingSection';
import { cn } from '../../../lib/utils';

interface SubmissionReviewProps {
  submissionId: number;
  onBack: () => void;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({ submissionId, onBack }) => {
  const { notify } = useNotifications();
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'GRADING' | 'VIOLATIONS'>('GRADING');

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
      } else {
        notify.error('Failed to fetch submission');
        onBack();
      }
    } catch (err) {
      notify.error('An error occurred while fetching');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePoints = (idx: number, points: number) => {
    const newAnswers = [...submission.answers];
    newAnswers[idx].earned_points = points;
    setSubmission({ ...submission, answers: newAnswers });
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    try {
      const totalEarned = submission.answers.reduce((sum: number, a: any) => sum + a.earned_points, 0);
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: totalEarned,
          answers: submission.answers,
          status: 'GRADED'
        })
      });

      if (res.ok) {
        notify.success('Grades saved successfully!');
        onBack();
      } else {
        notify.error('Failed to save grades');
      }
    } catch (err) {
      notify.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-portal-200 border-t-portal-600 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest font-mono text-slate-400">Loading Submission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight font-mono">
                Review Submission
              </h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                {submission.quiz_title} • {submission.student_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('GRADING')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest font-mono transition-all",
                activeTab === 'GRADING' ? "bg-portal-100 text-portal-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Grading
            </button>
            <button 
              onClick={() => setActiveTab('VIOLATIONS')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest font-mono transition-all",
                activeTab === 'VIOLATIONS' ? "bg-rose-100 text-rose-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Violations ({submission.violations.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Student Info Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">Student</p>
              <h3 className="text-sm font-black text-slate-900 font-mono">{submission.student_name}</h3>
              <p className="text-[10px] font-mono text-slate-400 font-bold">{submission.student_code}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-portal-50 rounded-full flex items-center justify-center text-portal-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">Quiz</p>
              <h3 className="text-sm font-black text-slate-900 font-mono">{submission.quiz_title}</h3>
              <p className="text-[10px] font-mono text-slate-400 font-bold">{submission.course_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">Submitted At</p>
              <h3 className="text-sm font-black text-slate-900 font-mono">
                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 font-bold">
                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleTimeString() : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'GRADING' ? (
            <motion.div
              key="grading"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <GradingSection 
                answers={submission.answers}
                onUpdatePoints={handleUpdatePoints}
                onSave={handleSaveGrades}
                isSaving={isSaving}
              />
            </motion.div>
          ) : (
            <motion.div
              key="violations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ViolationLog 
                violations={submission.violations}
                riskScore={submission.cheating_risk_score}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
