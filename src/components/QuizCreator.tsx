import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Save, X, ChevronRight, Search, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Question {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  options: string[];
  correctAnswer: number | null;
  points: number;
}

interface QuizCreatorProps {
  teacherId: number;
  initialData?: any;
  onClose: () => void;
  onSave: (quiz: any) => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ teacherId, initialData, onClose, onSave }) => {
  const formatForInput = (dateStr: string) => {
    if (!dateStr) return '2026-06-20T23:59';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2026-06-20T23:59';
    // Format to YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [duration, setDuration] = useState(initialData?.duration || 30);
  const [classId, setClassId] = useState(initialData?.classId || '');
  const [deadline, setDeadline] = useState(formatForInput(initialData?.deadline));
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT');
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [
    { text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctAnswer: 0, points: 1 }
  ]);

  const [classes, setClasses] = useState<any[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classError, setClassError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Error fetching classes:", err);
        setClasses([]);
      });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClassDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClasses = classes.filter(c => 
    (String(c.id || '').toLowerCase()).includes(String(classId || '').toLowerCase()) || 
    (String(c.courseCode || '').toLowerCase()).includes(String(classId || '').toLowerCase()) || 
    (String(c.name || '').toLowerCase()).includes(String(classId || '').toLowerCase())
  );

  const handleClassSelect = (c: any) => {
    setClassId(String(c.id));
    setShowClassDropdown(false);
    setClassError('');
  };

  const validateClass = () => {
    if (!classId) return false;
    const exists = classes.some(c => String(c.id) === String(classId));
    if (!exists) {
      setClassError('No course found with this code.');
      return false;
    }
    setClassError('');
    return true;
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctAnswer: 0, points: 1 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  const handleSave = (newStatus?: 'DRAFT' | 'PUBLISHED') => {
    console.log("[QuizCreator] handleSave called with status:", newStatus || status);
    if (!title || !classId) {
      console.warn("[QuizCreator] Missing title or classId:", { title, classId });
      alert("Please fill in title and course ID");
      return;
    }
    if (!validateClass()) {
      console.warn("[QuizCreator] Class validation failed for classId:", classId);
      return;
    }

    const finalStatus = newStatus || status;
    const totalScore = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    
    const quiz = {
      ...initialData,
      title,
      duration,
      classId,
      teacherId,
      deadline,
      questions,
      status: finalStatus,
      totalScore
    };
    console.log("[QuizCreator] Calling onSave with quiz data:", quiz);
    onSave(quiz);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="portal-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="portal-card-header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              {initialData ? <Save className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{initialData ? 'Edit Quiz' : 'Create New Quiz'}</h2>
              <div className="flex items-center gap-3">
                <p className="text-[10px] text-portal-100 font-mono uppercase tracking-widest font-bold">
                  {initialData ? `Editing: ${initialData.title}` : 'Design your examination'}
                </p>
                <div className="w-px h-3 bg-portal-400" />
                <p className="text-[10px] font-black text-emerald-100 font-mono uppercase">
                  TOTAL: {questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0).toFixed(1)} PTS
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Quiz Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Final Exam"
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Duration (mins)</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="input-field"
              />
            </div>
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Assign to Course</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setShowClassDropdown(true);
                    setClassError('');
                  }}
                  onFocus={() => setShowClassDropdown(true)}
                  placeholder="Search course code..."
                  className={cn(
                    "input-field pl-10",
                    classError && "border-rose-500 focus:border-rose-500"
                  )}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              
              {classError && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1 font-bold uppercase">
                  <AlertCircle className="w-3 h-3" /> {classError}
                </p>
              )}

              {showClassDropdown && filteredClasses.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-portal-200 rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                  {filteredClasses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleClassSelect(c)}
                      className="w-full text-left px-4 py-3 hover:bg-portal-50 transition-colors border-b border-portal-100 last:border-0"
                    >
                      <div className="text-sm font-bold text-slate-900">{c.courseCode}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{c.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Deadline</label>
              <input 
                type="datetime-local" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Questions List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Questions</h3>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 text-xs font-bold text-portal-600 hover:text-portal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 relative group transition-all hover:border-portal-300 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-white border border-slate-200 rounded-md flex items-center justify-center text-xs font-black text-slate-400 font-mono">
                    {qIndex + 1}
                  </span>
                  <select 
                    value={q.type}
                    onChange={(e) => updateQuestion(qIndex, { type: e.target.value as any, options: e.target.value === 'ESSAY' ? [] : ['', ''] })}
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
                        value={q.points}
                        onChange={(e) => updateQuestion(qIndex, { points: parseFloat(e.target.value) || 0 })}
                        className="w-16 bg-white border border-slate-200 rounded-md p-2 text-xs text-portal-600 font-black outline-none focus:border-portal-500 transition-all font-mono"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    
                    <button 
                      onClick={() => removeQuestion(qIndex)}
                      className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all hover:scale-110 active:scale-95 group/del"
                      title="Delete Question"
                    >
                      <Trash2 className="w-5 h-5 transition-transform group-hover/del:rotate-12" />
                    </button>
                  </div>
                </div>

                <textarea 
                  value={q.text}
                  onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                  placeholder="Enter question text..."
                  className="w-full bg-white border border-slate-200 rounded-md p-4 text-slate-900 focus:border-portal-400 outline-none transition-all min-h-[100px] text-sm font-medium"
                />

                {q.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Options (Select correct one)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuestion(qIndex, { correctAnswer: oIndex })}
                            className={cn(
                              "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                              q.correctAnswer === oIndex ? "bg-portal-500 border-portal-500" : "bg-white border-slate-200 hover:border-slate-400"
                            )}
                          >
                            {q.correctAnswer === oIndex && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                          <input 
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[oIndex] = e.target.value;
                              updateQuestion(qIndex, { options: newOpts });
                            }}
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1 bg-white border border-slate-200 rounded-md p-2 text-sm text-slate-600 outline-none focus:border-portal-400 font-medium"
                          />
                          {q.options.length > 2 && (
                            <button 
                              onClick={() => removeOption(qIndex, oIndex)} 
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all hover:scale-110"
                              title="Remove Option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        onClick={() => addOption(qIndex)}
                        className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-200 rounded-md text-slate-400 hover:text-portal-600 hover:border-portal-200 transition-all text-[10px] font-mono uppercase font-bold bg-white/50"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("badge", status === 'DRAFT' ? "badge-slate" : "badge-teal")}>
              Status: {status}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave('DRAFT')}
              className="btn-secondary px-6 py-2 text-xs"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button 
              onClick={() => handleSave('PUBLISHED')}
              className="btn-primary px-8 py-2.5 text-xs"
            >
              <Send className="w-4 h-4" />
              {initialData?.status === 'PUBLISHED' ? 'Update Quiz' : 'Publish Quiz'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
