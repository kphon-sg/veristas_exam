import React from 'react';
import { Trash2, CheckCircle2, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Question {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  options: string[];
  correctAnswer: number | null;
  points: number;
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, index, onUpdate, onRemove }) => {
  const addOption = () => {
    onUpdate({ options: [...question.options, ''] });
  };

  const removeOption = (oIndex: number) => {
    onUpdate({ options: question.options.filter((_, i) => i !== oIndex) });
  };

  const updateOption = (oIndex: number, text: string) => {
    const newOptions = [...question.options];
    newOptions[oIndex] = text;
    onUpdate({ options: newOptions });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 relative group transition-all hover:border-portal-300 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="w-8 h-8 bg-white border border-slate-200 rounded-md flex items-center justify-center text-xs font-black text-slate-400 font-mono">
          {index + 1}
        </span>
        <select 
          value={question.type}
          onChange={(e) => onUpdate({ type: e.target.value as any, options: e.target.value === 'ESSAY' ? [] : ['', ''] })}
          className="bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-600 outline-none focus:border-portal-400 transition-colors font-bold"
        >
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="ESSAY">Essay</option>
        </select>
        
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Points</label>
            <input 
              type="number" 
              value={question.points}
              onChange={(e) => onUpdate({ points: parseFloat(e.target.value) || 0 })}
              className="w-16 bg-white border border-slate-200 rounded-md p-2 text-xs text-portal-600 font-black outline-none focus:border-portal-500 transition-all font-mono"
              min="0"
              step="0.5"
            />
          </div>
          
          <div className="w-px h-4 bg-slate-200 mx-1" />
          
          <button 
            onClick={onRemove}
            className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all hover:scale-110 active:scale-95 group/del"
            title="Delete Question"
          >
            <Trash2 className="w-5 h-5 transition-transform group-hover/del:rotate-12" />
          </button>
        </div>
      </div>

      <textarea 
        value={question.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Enter question text..."
        className="w-full bg-white border border-slate-200 rounded-md p-4 text-slate-900 focus:border-portal-400 outline-none transition-all min-h-[100px] text-sm font-medium"
      />

      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Options (Select correct one)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <button 
                  onClick={() => onUpdate({ correctAnswer: oIndex })}
                  className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                    question.correctAnswer === oIndex ? "bg-portal-500 border-portal-500" : "bg-white border-slate-200 hover:border-slate-400"
                  )}
                >
                  {question.correctAnswer === oIndex && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <input 
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(oIndex, e.target.value)}
                  placeholder={`Option ${oIndex + 1}`}
                  className="flex-1 bg-white border border-slate-200 rounded-md p-2 text-sm text-slate-600 outline-none focus:border-portal-400 font-medium"
                />
                {question.options.length > 2 && (
                  <button 
                    onClick={() => removeOption(oIndex)} 
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all hover:scale-110"
                    title="Remove Option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addOption}
              className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-200 rounded-md text-slate-400 hover:text-portal-600 hover:border-portal-200 transition-all text-[10px] font-mono uppercase font-bold bg-white/50"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
