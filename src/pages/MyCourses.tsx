import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, User, Users, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Course {
  id: number;
  courseCode: string;
  name: string;
  description?: string;
  teacherName?: string;
  studentCount?: number;
}

interface MyCoursesProps {
  user: { id: number; role: string };
  token: string | null;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const MyCourses: React.FC<MyCoursesProps> = ({ user, token, authenticatedFetch }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = user.role === 'STUDENT' 
        ? '/api/student/my-courses' 
        : '/api/teacher/my-classes';
      
      const res = await authenticatedFetch(url);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user.role, authenticatedFetch]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-veritas-indigo animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Courses</h1>
          <p className="text-slate-500 font-medium">Manage and view your academic courses</p>
        </div>
        {user.role === 'TEACHER' && (
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            Create Course
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No courses found</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            {user.role === 'STUDENT' 
              ? "You haven't joined any courses yet. Search for available courses to get started."
              : "You haven't created any courses yet. Start by creating your first course."}
          </p>
          <button 
            onClick={() => navigate(user.role === 'STUDENT' ? '/join-course' : '/dashboard')}
            className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto"
          >
            {user.role === 'STUDENT' ? "Join a Course" : "Create a Course"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
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
              
              {user.role === 'STUDENT' ? (
                <div className="flex items-center gap-2 text-slate-500 mb-8">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-bold">{course.teacherName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 mb-8">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-bold">{course.studentCount} Students Enrolled</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {user.role === 'STUDENT' ? (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-veritas-indigo transition-all"
                  >
                    View Quizzes
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/create-quiz')}
                      className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-veritas-indigo transition-all"
                    >
                      Create Quiz
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="w-full py-3 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-slate-200 transition-all"
                    >
                      Manage Students
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
