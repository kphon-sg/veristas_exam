import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, CheckCircle2, User, Mail, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../ui/NotificationProvider';
import { cn } from '../../../lib/utils';

interface InviteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
}

export const InviteStudentModal: React.FC<InviteStudentModalProps> = ({ isOpen, onClose, courseId, courseName }) => {
  const { notify } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/classes/search-students?query=${searchQuery}&courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      notify.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (studentId: number) => {
    try {
      const res = await fetch(`/api/classes/${courseId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });

      if (res.ok) {
        notify.success('Invitation sent!');
        setInvitedIds(prev => new Set(prev).add(studentId));
      } else {
        const err = await res.json();
        notify.error(err.message || 'Failed to send invitation');
      }
    } catch (err) {
      notify.error('An error occurred');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-portal-100 rounded-lg flex items-center justify-center text-portal-600">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-mono">Invite Students</h2>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Course: {courseName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-portal-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, student code, or email..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 text-sm font-medium text-slate-900 focus:bg-white focus:border-portal-400 outline-none transition-all"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching || searchQuery.length < 2}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-portal-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest font-mono hover:bg-portal-700 transition-all disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest font-bold">Search for students to invite</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-portal-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-portal-500 transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 font-mono uppercase tracking-tight">{student.full_name}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 font-bold uppercase">
                            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {student.student_code}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleInvite(student.id)}
                        disabled={invitedIds.has(student.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest font-mono transition-all flex items-center gap-2",
                          invitedIds.has(student.id) 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                            : "bg-white border border-slate-200 text-slate-600 hover:border-portal-300 hover:text-portal-600"
                        )}
                      >
                        {invitedIds.has(student.id) ? (
                          <><CheckCircle2 className="w-4 h-4" /> Invited</>
                        ) : (
                          'Invite'
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-all text-xs font-black uppercase tracking-widest font-mono"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
