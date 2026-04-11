import React, { useState, useEffect } from 'react';
import { Search, BookOpen, User, Globe, ArrowRight, Loader2, CheckCircle2, Clock, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../components/ui/NotificationProvider';
import { cn } from '../lib/utils';

interface Course {
  id: number;
  courseCode: string;
  name: string;
  description?: string;
  teacherName?: string;
  schoolName?: string;
  requestStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
}

interface JoinCourseProps {
  user: { id: number; role: string };
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const JoinCourse: React.FC<JoinCourseProps> = ({ user, authenticatedFetch }) => {
  const { notify } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    courseName: '',
    courseCode: '',
    teacherName: '',
    schoolName: ''
  });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery && !filters.courseName && !filters.courseCode && !filters.teacherName && !filters.schoolName) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (filters.courseName) params.append('courseName', filters.courseName);
      if (filters.courseCode) params.append('courseCode', filters.courseCode);
      if (filters.teacherName) params.append('teacherName', filters.teacherName);
      if (filters.schoolName) params.append('schoolName', filters.schoolName);
      params.append('studentId', user.id.toString());

      const res = await authenticatedFetch(`/api/classes/search-available?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Error searching courses:", err);
      notify.error("Failed to search courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (courseId: number) => {
    try {
      const res = await authenticatedFetch(`/api/classes/${courseId}/join-request`, {
        method: 'POST',
        body: JSON.stringify({ studentId: user.id })
      });
      if (res.ok) {
        notify.success("Join request sent successfully!");
        // Update local state
        setResults(prev => prev.map(c => c.id === courseId ? { ...c, requestStatus: 'PENDING' } : c));
        if (selectedCourse?.id === courseId) {
          setSelectedCourse({ ...selectedCourse, requestStatus: 'PENDING' });
        }
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to send join request");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
      notify.error("An error occurred while sending the request");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Join a Course</h1>
          <p className="text-slate-500 font-medium">Search and request enrollment in academic courses</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by course name, code, or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-veritas-indigo focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all flex items-center gap-2",
                showFilters ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
              )}
            >
              <Filter className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Filters</span>
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="btn-primary px-8 py-4 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="text-xs font-black uppercase tracking-widest">Search</span>
            </button>
          </div>
        </form>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Course Name</label>
                  <input 
                    type="text"
                    value={filters.courseName}
                    onChange={(e) => setFilters({ ...filters, courseName: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-veritas-indigo focus:bg-white rounded-xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Course Code</label>
                  <input 
                    type="text"
                    value={filters.courseCode}
                    onChange={(e) => setFilters({ ...filters, courseCode: e.target.value })}
                    placeholder="e.g. MATH101"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-veritas-indigo focus:bg-white rounded-xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Teacher Name</label>
                  <input 
                    type="text"
                    value={filters.teacherName}
                    onChange={(e) => setFilters({ ...filters, teacherName: e.target.value })}
                    placeholder="e.g. Dr. Smith"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-veritas-indigo focus:bg-white rounded-xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">School Name</label>
                  <input 
                    type="text"
                    value={filters.schoolName}
                    onChange={(e) => setFilters({ ...filters, schoolName: e.target.value })}
                    placeholder="e.g. Veritas High"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-veritas-indigo focus:bg-white rounded-xl text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        !isLoading && searchQuery && (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No courses found</h3>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              We couldn't find any courses matching your search. Try different keywords or filters.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center group-hover:bg-veritas-indigo transition-colors duration-300">
                  <BookOpen className="w-7 h-7 text-veritas-indigo group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {course.courseCode}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-veritas-indigo transition-colors">
                {course.name}
              </h3>
              
              <div className="flex items-center gap-2 text-slate-500 mb-8">
                <User className="w-4 h-4" />
                <span className="text-sm font-bold">{course.teacherName}</span>
              </div>

              <button 
                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-veritas-indigo transition-all flex items-center justify-center gap-2"
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourse(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="portal-card-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="portal-header-icon-box">
                    <BookOpen className="w-6 h-6 text-veritas-indigo" />
                  </div>
                  <div>
                    <h3 className="portal-header-title">Course Details</h3>
                    <p className="portal-header-subtitle">{selectedCourse.courseCode}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="portal-close-button">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Course Name</label>
                  <p className="text-xl font-black text-slate-800 tracking-tight">{selectedCourse.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Teacher</label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{selectedCourse.teacherName}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">School</label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{selectedCourse.schoolName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedCourse.description}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  {selectedCourse.requestStatus === 'PENDING' ? (
                    <div className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center gap-3">
                      <Clock className="w-5 h-5 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest">Enrollment Request Pending</span>
                    </div>
                  ) : selectedCourse.requestStatus === 'ACCEPTED' ? (
                    <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">Already Enrolled</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleJoinRequest(selectedCourse.id)}
                      className="w-full py-4 bg-slate-900 text-white hover:bg-veritas-indigo rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                    >
                      Request to Join This Course
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinCourse;
