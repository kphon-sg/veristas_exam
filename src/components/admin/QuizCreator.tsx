import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Save, X, ChevronRight, Search, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useNotifications } from '../ui/NotificationProvider';

import { QuestionEditor } from './QuizCreator/QuestionEditor';

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
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ teacherId, initialData, onClose, onSave, authenticatedFetch }) => {
  const { notify } = useNotifications();
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
  const [openAt, setOpenAt] = useState(formatForInput(initialData?.openAt || new Date().toISOString()));
  const [closeAt, setCloseAt] = useState(formatForInput(initialData?.closeAt || initialData?.deadline));
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT');
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [
    { text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctAnswer: 0, points: 1 }
  ]);

  const [classes, setClasses] = useState<any[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classError, setClassError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authenticatedFetch('/api/classes')
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

  const handleSave = (newStatus?: 'DRAFT' | 'PUBLISHED') => {
    console.log("[QuizCreator] handleSave called with status:", newStatus || status);
    if (!title || !classId) {
      console.warn("[QuizCreator] Missing title or classId:", { title, classId });
      notify.error("Please fill in title and course ID");
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
      openAt,
      closeAt,
      deadline: closeAt, // Keep deadline in sync with closeAt for compatibility
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
            <div className="portal-header-icon-box">
              {initialData ? <Save className="w-6 h-6 text-slate-800" /> : <Plus className="w-6 h-6 text-slate-800" />}
            </div>
            <div>
              <h2 className="portal-header-title">{initialData ? 'Edit Quiz' : 'Create New Quiz'}</h2>
              <div className="flex items-center gap-3">
                <p className="portal-header-subtitle">
                  {initialData ? `Editing: ${initialData.title}` : 'Design your examination'}
                </p>
                <div className="w-px h-3 bg-white/10" />
                <p className="text-[10px] font-black text-emerald-400 font-mono uppercase tracking-widest">
                  TOTAL: {questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0).toFixed(1)} PTS
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="portal-close-button">
            <X className="w-6 h-6" />
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
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Open Date/Time</label>
              <input 
                type="datetime-local" 
                value={openAt}
                onChange={(e) => setOpenAt(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Deadline (Close Date/Time)</label>
              <input 
                type="datetime-local" 
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
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
              <QuestionEditor
                key={qIndex}
                index={qIndex}
                question={q}
                onUpdate={(updates) => updateQuestion(qIndex, updates)}
                onRemove={() => removeQuestion(qIndex)}
              />
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
