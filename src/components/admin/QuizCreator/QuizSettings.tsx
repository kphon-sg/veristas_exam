import React from 'react';
import { Calendar, Clock, BookOpen, GraduationCap, Settings2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface QuizSettingsProps {
  title: string;
  setTitle: (t: string) => void;
  duration: number;
  setDuration: (d: number) => void;
  courseId: number | null;
  setCourseId: (id: number) => void;
  courses: any[];
  openTime: string;
  setOpenTime: (t: string) => void;
  closeTime: string;
  setCloseTime: (t: string) => void;
}

export const QuizSettings: React.FC<QuizSettingsProps> = ({
  title, setTitle, duration, setDuration, courseId, setCourseId, courses, openTime, setOpenTime, closeTime, setCloseTime
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <Settings2 className="w-6 h-6 text-portal-500" />
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase font-mono">Quiz Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <BookOpen className="w-3 h-3" /> Quiz Title
          </label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Midterm Exam - Computer Science"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-900 font-bold focus:border-portal-400 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <GraduationCap className="w-3 h-3" /> Select Course
          </label>
          <select 
            value={courseId || ''}
            onChange={(e) => setCourseId(parseInt(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-900 font-bold focus:border-portal-400 focus:bg-white outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="" disabled>Choose a course...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.course_name} ({course.course_code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <Clock className="w-3 h-3" /> Duration (Minutes)
          </label>
          <div className="relative group">
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 pl-12 text-slate-900 font-black focus:border-portal-400 focus:bg-white outline-none transition-all text-sm font-mono"
              min="1"
            />
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-portal-400 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              <Calendar className="w-3 h-3" /> Open Time
            </label>
            <input 
              type="datetime-local" 
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-bold focus:border-portal-400 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              <Calendar className="w-3 h-3" /> Close Time
            </label>
            <input 
              type="datetime-local" 
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-bold focus:border-portal-400 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
