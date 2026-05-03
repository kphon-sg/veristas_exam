import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Save, Send, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Answer {
  question_id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  points: number;
  earned_points: number;
  correct_answer: number | null;
  options: string[];
}

interface GradingSectionProps {
  answers: Answer[];
  onUpdatePoints: (idx: number, points: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const GradingSection: React.FC<GradingSectionProps> = ({ answers, onUpdatePoints, onSave, isSaving }) => {
  const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
  const earnedPoints = answers.reduce((sum, a) => sum + a.earned_points, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase font-mono">Grading & Review</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">Total Score:</span>
            <span className="text-lg font-black font-mono text-emerald-600">{earnedPoints} / {totalPoints}</span>
          </div>
          
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-portal-600 text-white rounded-lg hover:bg-portal-700 transition-all text-xs font-black uppercase tracking-widest font-mono shadow-lg shadow-portal-200 disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Finalize Grades'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {answers.map((ans, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 relative group transition-all hover:border-portal-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white border border-slate-200 rounded-md flex items-center justify-center text-xs font-black text-slate-400 font-mono">
                  {idx + 1}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold border",
                  ans.type === 'ESSAY' ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-sky-50 text-sky-600 border-sky-200"
                )}>
                  {ans.type.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Earned Points</label>
                  <input 
                    type="number" 
                    value={ans.earned_points}
                    onChange={(e) => onUpdatePoints(idx, parseFloat(e.target.value) || 0)}
                    className="w-16 bg-white border border-slate-200 rounded-md p-2 text-xs text-portal-600 font-black outline-none focus:border-portal-500 transition-all font-mono"
                    min="0"
                    max={ans.points}
                    step="0.5"
                  />
                  <span className="text-xs font-mono text-slate-400 font-bold">/ {ans.points}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-100 rounded-lg">
                <p className="text-sm font-bold text-slate-900 leading-relaxed">{ans.text}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Student Answer</label>
                <div className={cn(
                  "p-4 rounded-lg border text-sm font-medium leading-relaxed",
                  ans.type === 'MULTIPLE_CHOICE' 
                    ? (parseInt(ans.text) === ans.correct_answer ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700")
                    : "bg-white border-slate-200 text-slate-700"
                )}>
                  {ans.type === 'MULTIPLE_CHOICE' ? (
                    <div className="flex items-center gap-3">
                      {parseInt(ans.text) === ans.correct_answer ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      <span>{ans.options[parseInt(ans.text)] || 'No Answer'}</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{ans.text || 'No Answer Provided'}</p>
                  )}
                </div>
              </div>

              {ans.type === 'MULTIPLE_CHOICE' && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 font-bold uppercase">
                  <Info className="w-3 h-3" />
                  Correct Answer: <span className="text-emerald-600 ml-1">{ans.options[ans.correct_answer!] || 'N/A'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
