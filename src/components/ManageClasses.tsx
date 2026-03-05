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
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
  teacherId: number;
}

interface ManageClassesProps {
  teacherId: number;
  onClose: () => void;
}

export const ManageClasses: React.FC<ManageClassesProps> = ({ teacherId, onClose }) => {
  const [classes, setClasses] = useState<Course[]>([]);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({ courseCode: '', name: '', description: '' });
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<Student[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<Student | null>(null);

  // Fetch teacher's classes
  const fetchClasses = () => {
    fetch(`/api/classes`)
      .then(res => res.json())
      .then(data => {
        const classList = Array.isArray(data) ? data : [];
        const teacherClasses = classList.filter((c: any) => Number(c.teacherId) === Number(teacherId));
        setClasses(teacherClasses);
      })
      .catch(err => console.error("Error fetching classes:", err));
  };

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
      const res = await fetch(`/api/classes/${classId}/students`);
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
      const res = await fetch(`/api/students/search?query=${encodeURIComponent(globalSearchQuery)}${courseIdParam}`);
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
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newClassData, teacherId })
      });
      if (res.ok) {
        setIsCreateClassModalOpen(false);
        setNewClassData({ courseCode: '', name: '', description: '' });
        fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create class");
      }
    } catch (err) {
      console.error("Error creating class:", err);
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: number, courseCode: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete course ${courseCode}? This will remove all students and quizzes.`)) return;

    try {
      const res = await fetch(`/api/classes/${classId}?teacherId=${teacherId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete class");
      }
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  const handleInviteStudent = async (student: Student) => {
    if (!selectedClass) return;
    
    if (!confirm(`Are you sure you want to invite ${student.fullName} to this course?`)) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: student.id,
          teacherId: teacherId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Invitation sent successfully!");
        setIsAddModalOpen(false);
        setGlobalSearchQuery('');
        setGlobalSearchResults([]);
      } else {
        alert(data.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Error inviting student:", err);
      alert("Network error");
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!selectedClass) return;
    
    if (!confirm(`Are you sure you want to remove ${studentName} from this course?`)) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/unenroll/${studentId}?teacherId=${teacherId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert("Student removed successfully!");
        fetchStudents(selectedClass.id);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove student");
      }
    } catch (err) {
      console.error("Error removing student:", err);
      alert("Network error");
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
        <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedClass && (
              <button 
                onClick={() => setSelectedClass(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {selectedClass ? `Manage: ${selectedClass.courseCode}` : 'Manage Courses'}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">
                {selectedClass ? selectedClass.name : 'Select a course to manage students'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!selectedClass && (
              <button 
                onClick={() => setIsCreateClassModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-veritas-indigo text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Create Class
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
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
                  whileHover={{ translateY: -4 }}
                  onClick={() => setSelectedClass(course)}
                  className="p-6 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-veritas-indigo transition-all shadow-sm group"
                >
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100 mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 text-veritas-indigo" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight">{course.courseCode}</h3>
                  <p className="text-slate-500 text-[10px] font-bold mb-4 uppercase tracking-widest font-mono">{course.name}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-slate-300 group-hover:text-veritas-indigo transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-black">Manage Students</span>
                      <Users className="w-4 h-4" />
                    </div>
                    <button 
                      onClick={(e) => handleDeleteClass(e, course.id, course.courseCode)}
                      className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
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
                      if(confirm("Do you want to seed the database with 200+ students and 25 courses?")) {
                        const res = await fetch('/api/admin/seed', { method: 'POST' });
                        const data = await res.json();
                        alert(data.message || "Seeding completed!");
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Create New Course</h3>
                <button onClick={() => setIsCreateClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course Code</label>
                  <input 
                    required
                    type="text"
                    value={newClassData.courseCode}
                    onChange={e => setNewClassData({...newClassData, courseCode: e.target.value})}
                    placeholder="e.g. CS101"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course Name</label>
                  <input 
                    required
                    type="text"
                    value={newClassData.name}
                    onChange={e => setNewClassData({...newClassData, name: e.target.value})}
                    placeholder="e.g. Introduction to Computer Science"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label>
                  <textarea 
                    value={newClassData.description}
                    onChange={e => setNewClassData({...newClassData, description: e.target.value})}
                    placeholder="Optional description..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-veritas-indigo/20 outline-none min-h-[100px] resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-veritas-indigo text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Create Class
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Invite Student to Course</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <form onSubmit={handleGlobalSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search by Name or Student ID..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-veritas-indigo/20 focus:border-veritas-indigo transition-all"
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
