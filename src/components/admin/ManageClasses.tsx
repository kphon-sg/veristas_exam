import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  Info, 
  X, 
  ChevronLeft,
  BookOpen,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  PlusCircle,
  School,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useNotifications } from '../ui/NotificationProvider';

interface Student {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
  enrolledAt?: string;
  isEnrolled?: boolean;
}

interface Course {
  id: number;
  courseCode: string;
  name: string;
  description: string;
  schoolName?: string;
  educationLevel?: string;
  teacherId: number;
}

interface ManageClassesProps {
  teacherId: number;
  teacherName: string;
  onClose: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const ManageClasses: React.FC<ManageClassesProps> = ({ teacherId, teacherName, onClose, authenticatedFetch }) => {
  const { confirm, notify } = useNotifications();
  const [classes, setClasses] = useState<Course[]>([]);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({ 
    courseCode: '', 
    name: '', 
    description: '',
    schoolName: '',
    educationLevel: 'UNIVERSITY'
  });
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const schoolSuggestionsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (schoolSuggestionsRef.current && !schoolSuggestionsRef.current.contains(event.target as Node)) {
        setShowSchoolSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<Student[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<Student | null>(null);

  // Fetch teacher's classes
  const fetchClasses = () => {
    authenticatedFetch(`/api/classes`)
      .then(res => res.json())
      .then(data => {
        const classList = Array.isArray(data) ? data : [];
        setClasses(classList);
      })
      .catch(err => console.error("Error fetching classes:", err));
  };

  const fetchSchoolSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSchoolSuggestions([]);
      return;
    }
    try {
      const res = await authenticatedFetch(`/api/schools?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSchoolSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching school suggestions:", err);
    }
  };

  useEffect(() => {
    if (newClassData.schoolName) {
      const timer = setTimeout(() => {
        fetchSchoolSuggestions(newClassData.schoolName);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSchoolSuggestions([]);
    }
  }, [newClassData.schoolName]);

  useEffect(() => {
    fetchClasses();
  }, [teacherId]);

  // Fetch students when a class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchStudents = async (classId: number) => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/classes/${classId}/students`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time global search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (globalSearchQuery.length >= 2) {
        performGlobalSearch();
      } else {
        setGlobalSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearchQuery, selectedClass]);

  const performGlobalSearch = async () => {
    setSearchingGlobal(true);
    try {
      const courseIdParam = selectedClass ? `&courseId=${selectedClass.id}` : '';
      const res = await authenticatedFetch(`/api/students/search?query=${encodeURIComponent(globalSearchQuery)}${courseIdParam}`);
      const data = await res.json();
      setGlobalSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error searching students:", err);
    } finally {
      setSearchingGlobal(false);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performGlobalSearch();
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      notify.error("Teacher ID is missing. Please log in again.");
      return;
    }

    try {
      const payload = {
        ...newClassData,
        description: newClassData.description || null,
        teacherId,
        teacherName: teacherName || null
      };

      const res = await authenticatedFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCreateClassModalOpen(false);
        setNewClassData({ 
          courseCode: '', 
          name: '', 
          description: '',
          schoolName: '',
          educationLevel: 'UNIVERSITY'
        });
        notify.success("Course created successfully!");
        fetchClasses();
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to create course");
      }
    } catch (err) {
      console.error("Error creating course:", err);
      notify.error("Network error while creating course");
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: number, courseCode: string) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete course ${courseCode}? This will remove all students and quizzes.`,
      type: 'danger',
      confirmLabel: 'Delete'
    });

    if (!isConfirmed) return;

    try {
      const res = await authenticatedFetch(`/api/classes/${classId}?teacherId=${teacherId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        notify.success("Course deleted successfully!");
        fetchClasses();
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to delete class");
      }
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  const handleInviteStudent = async (student: Student) => {
    if (!selectedClass) return;
    
    const isConfirmed = await confirm({
      title: 'Invite Student',
      message: `Are you sure you want to invite ${student.fullName} to this course?`,
      type: 'info',
      confirmLabel: 'Invite'
    });

    if (!isConfirmed) return;

    try {
      const res = await authenticatedFetch(`/api/classes/${selectedClass.id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ 
          studentId: student.id,
          teacherId: teacherId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        notify.success("Invitation sent successfully!");
        setIsAddModalOpen(false);
        setGlobalSearchQuery('');
        setGlobalSearchResults([]);
      } else {
        notify.error(data.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Error inviting student:", err);
      notify.error("Network error");
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!selectedClass) return;
    
    const isConfirmed = await confirm({
      title: 'Remove Student',
      message: `Are you sure you want to remove ${studentName} from this course?`,
      type: 'danger',
      confirmLabel: 'Remove'
    });

    if (!isConfirmed) return;

    try {
      const res = await authenticatedFetch(`/api/classes/${selectedClass.id}/unenroll/${studentId}?teacherId=${teacherId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        notify.success("Student removed successfully!");
        fetchStudents(selectedClass.id);
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to remove student");
      }
    } catch (err) {
      console.error("Error removing student:", err);
      notify.error("Network error");
    }
  };

  const filteredStudents = students.filter(s => {
    const nameMatch = (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const codeMatch = (s.studentCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || codeMatch;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-[90vw] h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="portal-card-header flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4 relative z-10">
            {selectedClass && (
              <button 
                onClick={() => setSelectedClass(null)}
                className="portal-close-button bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-4">
              <div className="portal-header-icon-box">
                <School className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="portal-header-title">
                  {selectedClass ? `Manage: ${selectedClass.courseCode}` : 'Manage Courses'}
                </h2>
                <p className="portal-header-subtitle">
                  {selectedClass ? selectedClass.name : 'Select a course to manage students'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            {!selectedClass && (
              <button 
                onClick={() => setIsCreateClassModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20 transition-all shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Create Class
              </button>
            )}
            <button 
              onClick={onClose}
              className="portal-close-button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedClass ? (
            /* Class List View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map(course => (
                <motion.div 
                  key={course.id}
                  whileHover={{ translateY: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  onClick={() => setSelectedClass(course)}
                  className="p-6 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-veritas-indigo transition-all shadow-sm group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-[100px] -mr-12 -mt-12 group-hover:bg-indigo-100/50 transition-colors" />
                  
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 mb-5 group-hover:scale-110 transition-transform relative z-10">
                    <BookOpen className="w-6 h-6 text-veritas-indigo" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-slate-800 mb-1 tracking-tight group-hover:text-veritas-indigo transition-colors">{course.courseCode}</h3>
                    <p className="text-slate-500 text-[11px] font-bold mb-6 uppercase tracking-[0.15em] font-mono line-clamp-1">{course.name}</p>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 text-slate-400 group-hover:text-veritas-indigo transition-colors relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Manage Students</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteClass(e, course.id, course.courseCode)}
                      className="p-2.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all active:scale-90"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
                  {classes.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold mb-6">No classes found.</p>
                  <button 
                    onClick={async () => {
                      const isConfirmed = await confirm({
                        title: 'Seed Database',
                        message: 'Do you want to seed the database with 200+ students and 25 courses? This is for testing purposes.',
                        type: 'warning',
                        confirmLabel: 'Seed Data'
                      });

                      if(isConfirmed) {
                        const res = await authenticatedFetch('/api/admin/seed', { method: 'POST' });
                        const data = await res.json();
                        notify.success(data.message || "Seeding completed!");
                        window.location.reload();
                      }
                    }}
                    className="px-6 py-2 bg-veritas-indigo text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all"
                  >
                    Seed Test Data
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Student List View */
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search student by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-veritas-indigo/20 focus:border-veritas-indigo transition-all"
                  />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="hidden lg:flex flex-col items-center mr-4">
                          <span className="text-[10px] font-mono uppercase font-black text-slate-400 leading-none mb-1">
                            Total Students
                          </span>
                          <span className="text-xl font-black text-slate-800">
                            {students.length}
                          </span>
                        </div>
                                          <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-base font-bold transition-all shadow-lg active:scale-95"
                  >
                    <UserPlus className="w-5 h-5" />
                    Invite Student
                  </button>
                </div>
              </div>

              {/* Student Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[11px] font-mono uppercase tracking-widest font-black text-slate-400">Student ID</th>
                      <th className="px-8 py-5 text-[11px] font-mono uppercase tracking-widest font-black text-slate-400">Full Name</th>
                      <th className="px-8 py-5 text-[11px] font-mono uppercase tracking-widest font-black text-slate-400">Email Address</th>
                      <th className="px-8 py-5 text-[11px] font-mono uppercase tracking-widest font-black text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-sm font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            {student.studentCode}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-lg font-black text-slate-800 tracking-tight">{student.fullName}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-base text-slate-500 font-medium">{student.email}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => setSelectedStudentInfo(student)}
                              className="p-3 hover:bg-teal-50 text-slate-400 hover:text-veritas-indigo rounded-xl transition-all border border-transparent hover:border-teal-100"
                              title="Information"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleRemoveStudent(student.id, student.fullName)}
                              className="p-3 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100"
                              title="Remove from class"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <p className="text-slate-400 text-sm font-medium">No students found in this class.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreateClassModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateClassModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="portal-card-header flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="portal-header-icon-box">
                    <PlusCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="portal-header-title">Create New Course</h3>
                    <p className="portal-header-subtitle">Add a new class to your dashboard</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateClassModalOpen(false)} className="portal-close-button relative z-10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Teacher Name</label>
                  <input 
                    disabled
                    type="text"
                    value={teacherName}
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-600 cursor-not-allowed outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Course Code</label>
                    <input 
                      required
                      type="text"
                      value={newClassData.courseCode}
                      onChange={e => setNewClassData({...newClassData, courseCode: e.target.value.toUpperCase()})}
                      placeholder="e.g. CS101"
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Course Name</label>
                    <input 
                      required
                      type="text"
                      value={newClassData.name}
                      onChange={e => setNewClassData({...newClassData, name: e.target.value})}
                      placeholder="e.g. Intro to CS"
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Education Level</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <select
                      required
                      value={newClassData.educationLevel}
                      onChange={(e) => setNewClassData({ ...newClassData, educationLevel: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none appearance-none"
                    >
                      <option value="PRIMARY_SCHOOL">Primary School</option>
                      <option value="SECONDARY_SCHOOL">Secondary School</option>
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="UNIVERSITY">University</option>
                    </select>
                  </div>
                </div>

                <div className="relative" ref={schoolSuggestionsRef}>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">School Name</label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      required
                      type="text"
                      value={newClassData.schoolName}
                      onChange={(e) => {
                        setNewClassData({ ...newClassData, schoolName: e.target.value });
                        setShowSchoolSuggestions(true);
                      }}
                      onFocus={() => setShowSchoolSuggestions(true)}
                      placeholder="Type school name..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto"
                      >
                        {schoolSuggestions.map((school, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewClassData({ ...newClassData, schoolName: school });
                              setShowSchoolSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                          >
                            {school}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Description (Optional)</label>
                  <textarea 
                    value={newClassData.description}
                    onChange={e => setNewClassData({...newClassData, description: e.target.value})}
                    placeholder="Optional description..."
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none min-h-[80px] resize-none placeholder:text-slate-400"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-veritas-indigo text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Create Course
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="portal-card-header flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="portal-header-icon-box">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="portal-header-title">Invite Student</h3>
                    <p className="portal-header-subtitle">Add students to {selectedClass?.courseCode}</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="portal-close-button relative z-10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <form onSubmit={handleGlobalSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text"
                    placeholder="Search by Name or Student ID..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-veritas-indigo/20 focus:border-veritas-indigo transition-all placeholder:text-slate-400"
                  />
                  <button 
                    type="submit"
                    disabled={globalSearchQuery.length < 2 || searchingGlobal}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-md disabled:opacity-50"
                  >
                    {searchingGlobal ? '...' : 'Find'}
                  </button>
                </form>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {globalSearchResults.map(student => (
                    <div key={student.id} className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all",
                      student.isEnrolled 
                        ? "bg-slate-50 border-slate-100 opacity-80 cursor-default" 
                        : "bg-white border-slate-100 hover:border-veritas-indigo/30 group"
                    )}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{student.fullName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{student.studentCode}</span>
                      </div>
                      
                      {student.isEnrolled ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Enrolled</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleInviteStudent(student)}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-veritas-indigo hover:bg-teal-50 hover:border-teal-100 transition-all shadow-sm active:scale-90"
                          title="Send Invitation"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {globalSearchResults.length === 0 && globalSearchQuery.length >= 2 && !searchingGlobal && (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400 font-bold">No students found matching your search.</p>
                    </div>
                  )}
                  {globalSearchQuery.length < 2 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400 font-bold">Enter at least 2 characters to search.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Info Modal */}
      <AnimatePresence>
        {selectedStudentInfo && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentInfo(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-24 bg-slate-800 relative">
                <div className="absolute -bottom-10 left-6 w-20 h-20 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
                <button 
                  onClick={() => setSelectedStudentInfo(null)}
                  className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="pt-14 p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedStudentInfo.fullName}</h3>
                  <p className="text-xs font-mono font-bold text-veritas-indigo uppercase tracking-widest mt-1">Student Account</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase font-black text-slate-400 leading-none mb-1">Student ID</p>
                      <p className="text-sm font-bold text-slate-700">{selectedStudentInfo.studentCode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase font-black text-slate-400 leading-none mb-1">Email Address</p>
                      <p className="text-sm font-bold text-slate-700">{selectedStudentInfo.email}</p>
                    </div>
                  </div>

                  {selectedStudentInfo.enrolledAt && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase font-black text-slate-400 leading-none mb-1">Enrolled Since</p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(selectedStudentInfo.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedStudentInfo(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  Close Information
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
