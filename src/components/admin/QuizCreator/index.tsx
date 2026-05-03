import React, { useState, useEffect } from 'react';
import { Plus, Save, Send, ArrowLeft, LayoutGrid, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../ui/NotificationProvider';
import { QuizSettings } from './QuizSettings';
import { QuestionEditor } from './QuestionEditor';
import { cn } from '../../../lib/utils';

interface Question {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  options: string[];
  correctAnswer: number | null;
  points: number;
}

interface QuizCreatorProps {
  onBack: () => void;
  initialData?: any;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ onBack, initialData }) => {
  const { notify } = useNotifications();
  const [title, setTitle] = useState(initialData?.title || '');
  const [duration, setDuration] = useState(initialData?.duration || 60);
  const [courseId, setCourseId] = useState<number | null>(initialData?.course_id || null);
  const [openTime, setOpenTime] = useState(initialData?.open_time || '');
  const [closeTime, setCloseTime] = useState(initialData?.close_time || '');
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [
    { text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctAnswer: 0, points: 1 }
  ]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctAnswer: 0, points: 1 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !courseId || !openTime || !closeTime) {
      notify.error('Please fill in all required fields');
      return;
    }

    if (questions.some(q => !q.text.trim())) {
      notify.error('All questions must have text');
      return;
    }

    setIsSaving(true);
    try {
      const url = initialData ? `/api/quizzes/${initialData.id}` : '/api/quizzes';
      const method = initialData ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          duration,
          course_id: courseId,
          open_time: openTime,
          close_time: closeTime,
          status,
          questions
        })
      });

      if (res.ok) {
        notify.success(`Quiz ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`);
        onBack();
      } else {
        const err = await res.json();
        notify.error(err.message || 'Failed to save quiz');
      }
    } catch (err) {
      notify.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

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
                {initialData ? 'Edit Quiz' : 'Create New Quiz'}
              </h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                Teacher Dashboard / Quiz Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSave('DRAFT')}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-black uppercase tracking-widest font-mono disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button 
              onClick={() => handleSave('PUBLISHED')}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-portal-600 text-white rounded-lg hover:bg-portal-700 transition-all text-xs font-black uppercase tracking-widest font-mono shadow-lg shadow-portal-200 disabled:opacity-50 active:scale-95"
            >
              <Send className="w-4 h-4" /> Publish Quiz
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Settings Section */}
        <QuizSettings 
          title={title} setTitle={setTitle}
          duration={duration} setDuration={setDuration}
          courseId={courseId} setCourseId={setCourseId}
          courses={courses}
          openTime={openTime} setOpenTime={setOpenTime}
          closeTime={closeTime} setCloseTime={setCloseTime}
        />

        {/* Questions Section Header */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-portal-100 rounded-lg flex items-center justify-center text-portal-600">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-mono">Questions</h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                {questions.length} Questions • {totalPoints} Total Points
              </p>
            </div>
          </div>
          
          <button 
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-portal-200 text-portal-600 rounded-lg hover:bg-portal-50 transition-all text-xs font-black uppercase tracking-widest font-mono"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {questions.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <QuestionEditor 
                  question={q}
                  index={idx}
                  onUpdate={(updates) => updateQuestion(idx, updates)}
                  onRemove={() => removeQuestion(idx)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom Action */}
        <div className="flex justify-center pt-8">
          <button 
            onClick={addQuestion}
            className="group flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-portal-300 hover:text-portal-600 hover:bg-portal-50/30 transition-all w-full max-w-md"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-portal-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest font-mono">Add Another Question</span>
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 border border-slate-800">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-portal-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">Total Points:</span>
          <span className="text-sm font-black font-mono text-portal-400">{totalPoints}</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">Questions:</span>
          <span className="text-sm font-black font-mono text-portal-400">{questions.length}</span>
        </div>
      </div>
    </div>
  );
};
