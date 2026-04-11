import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserPlus, GraduationCap, Users, BookOpen, ArrowRight, Settings, Info, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../ui/NotificationProvider';
import { CreateClassModal } from './CreateClassModal';
import { InviteStudentModal } from './InviteStudentModal';
import { cn } from '../../../lib/utils';

export const ManageClasses: React.FC = () => {
  const { notify, confirm } = useNotifications();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (err) {
      notify.error('Failed to fetch classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Class',
      message: 'Are you sure you want to delete this class? This will remove all enrollments and quizzes.',
      type: 'danger',
      confirmLabel: 'Delete'
    });

    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify.success('Class deleted successfully');
        fetchClasses();
      } else {
        notify.error('Failed to delete class');
      }
    } catch (err) {
      notify.error('An error occurred');
    }
  };

  const filteredClasses = classes.filter(c => 
    c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.course_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-mono">Manage Classes</h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              Teacher Dashboard / Course Management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-portal-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-portal-400 outline-none transition-all w-64 font-medium"
              />
            </div>
            
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewMode('GRID')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'GRID' ? "bg-white text-portal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'LIST' ? "bg-white text-portal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-portal-600 text-white rounded-lg hover:bg-portal-700 transition-all text-xs font-black uppercase tracking-widest font-mono shadow-lg shadow-portal-200 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Class
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl border border-slate-200" />
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4 bg-white border border-slate-200 rounded-2xl border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest font-mono text-slate-900">No classes found</p>
              <p className="text-xs font-medium">Get started by creating your first course</p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-6 py-2 bg-portal-50 text-portal-600 rounded-lg hover:bg-portal-100 transition-all text-xs font-black uppercase tracking-widest font-mono"
            >
              Create Class Now
            </button>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'GRID' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredClasses.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "bg-white border border-slate-200 rounded-xl overflow-hidden group hover:border-portal-300 hover:shadow-xl hover:shadow-portal-50 transition-all",
                    viewMode === 'LIST' && "flex items-center p-4 gap-6"
                  )}
                >
                  {/* Card Content */}
                  <div className={cn(
                    "p-6 space-y-4",
                    viewMode === 'LIST' ? "flex-1 flex items-center gap-8 space-y-0" : ""
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-portal-50 rounded-lg flex items-center justify-center text-portal-600 group-hover:bg-portal-600 group-hover:text-white transition-all">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight font-mono">{c.course_name}</h3>
                          <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{c.course_code}</p>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "grid grid-cols-2 gap-4",
                      viewMode === 'LIST' ? "flex gap-8" : ""
                    )}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-300" />
                        <span className="text-xs font-black font-mono text-slate-600">{c.student_count || 0} Students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-300" />
                        <span className="text-xs font-black font-mono text-slate-600">{c.quiz_count || 0} Quizzes</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={cn(
                    "bg-slate-50 p-4 flex items-center justify-between border-t border-slate-100",
                    viewMode === 'LIST' ? "bg-transparent border-t-0 border-l p-6 flex-col gap-2" : ""
                  )}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setSelectedClass(c); setIsInviteModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-portal-600 hover:bg-portal-50 rounded-lg transition-all"
                        title="Invite Students"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Class Settings"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteClass(c.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Class"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest font-mono text-slate-600 hover:border-portal-300 hover:text-portal-600 transition-all">
                        View Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateClassModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchClasses}
      />
      
      {selectedClass && (
        <InviteStudentModal 
          isOpen={isInviteModalOpen}
          onClose={() => { setIsInviteModalOpen(false); setSelectedClass(null); }}
          courseId={selectedClass.id}
          courseName={selectedClass.course_name}
        />
      )}
    </div>
  );
};
