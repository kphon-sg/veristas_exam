import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ScanFace, 
  ChevronRight, 
  Brain, 
  Camera, 
  FileEdit, 
  BarChart3,
  UserCircle,
  GraduationCap,
  User,
  School,
  Globe,
  HelpCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../ui/NotificationProvider';

interface LoginPortalProps {
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent, regData: any) => void;
  loginData: { studentId: string; password: '' };
  setLoginData: (data: any) => void;
  loginType: 'TEACHER' | 'STUDENT';
  setLoginType: (type: 'TEACHER' | 'STUDENT') => void;
  isLoading?: boolean;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ 
  onLogin, 
  onRegister,
  loginData, 
  setLoginData,
  loginType,
  setLoginType,
  isLoading = false
}) => {
  const { notify } = useNotifications();
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    school: '',
    country: '',
    reason: '',
    role: 'STUDENT'
  });

  const features = [
    { icon: <Brain className="w-5 h-5" />, text: "AI Behavior Detection" },
    { icon: <Camera className="w-5 h-5" />, text: "Live Webcam Monitoring" },
    { icon: <ScanFace className="w-5 h-5" />, text: "Secure Exam Environment" },
    { icon: <FileEdit className="w-5 h-5" />, text: "Test Creation for Teachers" },
    { icon: <BarChart3 className="w-5 h-5" />, text: "Real-time Reports" },
  ];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      notify.error("Passwords do not match!");
      return;
    }
    onRegister(e, { ...regData, role: loginType });
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* 🔵 Left Column: Branding Section (45%) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-veritas-deep to-emerald-600 relative overflow-hidden flex-col p-16 text-white">
        {/* Dot Pattern Overlay */}
        <div className="absolute inset-0 dot-pattern opacity-20" />
        
        {/* Abstract Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-20">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-2xl">
              <ScanFace className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight uppercase">VeritasExam</span>
          </div>

          {/* Title */}
          <div className="mb-16">
            <h1 className="text-5xl font-black leading-tight tracking-tight mb-6">
              Smart Proctoring & <br /> Exam Platform
            </h1>
            <p className="text-teal-100/70 text-lg font-medium max-w-md">
              The next generation of academic integrity, powered by advanced AI behavior analysis and real-time monitoring.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-6 mt-auto">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/5 group-hover:bg-white/20 transition-all">
                  {feature.icon}
                </div>
                <span className="text-sm font-bold tracking-wide text-teal-50">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Footer Branding */}
          <div className="mt-20 pt-8 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-teal-200/50">
            <span>© 2026 VeritasExam Inc.</span>
            <span>v2.4.0 Stable</span>
          </div>
        </div>
      </div>

      {/* ⚪ Right Column: Login Section (55%) */}
      <div className="w-full lg:w-[55%] bg-white flex items-center justify-center p-8 relative overflow-y-auto">
        {/* Mobile Logo (only visible on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-emerald-600" />
          <span className="text-lg font-black tracking-tight uppercase text-slate-900">VeritasExam</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[520px] py-12"
        >
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[4px] text-slate-900 font-black">
              {isRegistering ? 'Create Your Account' : 'Welcome To'}
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-2 leading-tight">
              <span className="text-slate-900">VERITAS</span>
              <span className="text-emerald-500">EXAM</span>
            </h2>

            <div className="w-14 h-1 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
          </div>

          {/* Login/Register Card */}
          <div className="bg-slate-50 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Tabs / Segmented Control */}
            <div className="p-2 bg-slate-100 border-b border-slate-200 flex gap-1">
              <button 
                onClick={() => setLoginType('STUDENT')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  loginType === 'STUDENT' 
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${loginType === 'STUDENT' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Student {isRegistering ? 'Sign Up' : 'Login'}
              </button>
              <button 
                onClick={() => setLoginType('TEACHER')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  loginType === 'TEACHER' 
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <UserCircle className={`w-4 h-4 ${loginType === 'TEACHER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Teacher {isRegistering ? 'Sign Up' : 'Login'}
              </button>
            </div>

            <div className="p-8 md:p-10">
              <AnimatePresence mode="wait">
                {!isRegistering ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <form onSubmit={onLogin} className="space-y-6">
                      {/* Email Field */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] ml-1">Email Address</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            required 
                            placeholder="Email, Username or ID"
                            value={loginData.studentId}
                            onChange={(e) => setLoginData({ ...loginData, studentId: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em]">Password</label>
                          <a href="#" className="text-[10px] text-emerald-600 hover:underline font-black uppercase tracking-wider">Forgot?</a>
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type="password" 
                            required 
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                          />
                        </div>
                      </div>

                      {/* Remember Me */}
                      <div className="flex items-center gap-2 px-1">
                        <input 
                          type="checkbox" 
                          id="remember" 
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer" 
                        />
                        <label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Remember this device</label>
                      </div>

                      {/* Submit Button */}
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group text-xs mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login to Portal'}
                        {!isLoading && <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                      </button>

                      <div className="text-center mt-6">
                        <p className="text-xs font-bold text-slate-400">
                          Don't have an account?{' '}
                          <button 
                            type="button"
                            onClick={() => setIsRegistering(true)}
                            className="text-emerald-600 hover:underline uppercase tracking-wider"
                          >
                            Sign Up Now
                          </button>
                        </p>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <button 
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-emerald-600 transition-colors mb-4"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Login
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Full Name</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="text" 
                              required 
                              placeholder="John Doe"
                              value={regData.fullName}
                              onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-all text-xs font-bold"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Email</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors">
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="email" 
                              required 
                              placeholder="john@edu.com"
                              value={regData.email}
                              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-all text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Password */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Password</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="password" 
                              required 
                              placeholder="Min 8 chars"
                              value={regData.password}
                              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-all text-xs font-bold"
                            />
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Confirm</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="password" 
                              required 
                              placeholder="Repeat password"
                              value={regData.confirmPassword}
                              onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-all text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {/* Age */}
                         <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Age</label>
                          <input 
                            type="number" 
                            placeholder="20"
                            value={regData.age}
                            onChange={(e) => setRegData({ ...regData, age: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-veritas-indigo transition-all text-xs font-bold"
                          />
                        </div>

                        {/* Country */}
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Country</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-veritas-indigo transition-colors">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="text" 
                              placeholder="United States"
                              value={regData.country}
                              onChange={(e) => setRegData({ ...regData, country: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-veritas-indigo transition-all text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* School */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">School / Institution</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-veritas-indigo transition-colors">
                            <School className="w-3.5 h-3.5" />
                          </div>
                          <input 
                            type="text" 
                            placeholder="University of Science"
                            value={regData.school}
                            onChange={(e) => setRegData({ ...regData, school: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-veritas-indigo transition-all text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Usage Reason */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Usage Reason</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-veritas-indigo transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Online certification exams"
                            value={regData.reason}
                            onChange={(e) => setRegData({ ...regData, reason: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-veritas-indigo transition-all text-xs font-bold"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group text-xs mt-4 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create ${loginType.toLowerCase()} Account`}
                        {!isLoading && <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-10 flex items-center justify-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">
            <Link to="/privacy" className="hover:text-veritas-indigo transition-colors">Privacy Policy</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <Link to="/terms" className="hover:text-veritas-indigo transition-colors">Terms of Service</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <Link to="/help" className="hover:text-veritas-indigo transition-colors">Help Center</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
