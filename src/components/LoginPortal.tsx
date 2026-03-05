import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  ChevronRight, 
  Brain, 
  Camera, 
  FileEdit, 
  BarChart3,
  UserCircle,
  GraduationCap
} from 'lucide-react';

interface LoginPortalProps {
  onLogin: (e: React.FormEvent) => void;
  loginData: { studentId: string; password: '' };
  setLoginData: (data: any) => void;
  loginType: 'TEACHER' | 'STUDENT';
  setLoginType: (type: 'TEACHER' | 'STUDENT') => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ 
  onLogin, 
  loginData, 
  setLoginData,
  loginType,
  setLoginType
}) => {
  const features = [
    { icon: <Brain className="w-5 h-5" />, text: "AI Behavior Detection" },
    { icon: <Camera className="w-5 h-5" />, text: "Live Webcam Monitoring" },
    { icon: <ShieldCheck className="w-5 h-5" />, text: "Secure Exam Environment" },
    { icon: <FileEdit className="w-5 h-5" />, text: "Test Creation for Teachers" },
    { icon: <BarChart3 className="w-5 h-5" />, text: "Real-time Reports" },
  ];

  return (
    <div className="min-h-screen flex font-sans selection:bg-veritas-indigo/30 overflow-hidden">
      {/* 🔵 Left Column: Branding Section (45%) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-veritas-deep to-veritas-indigo relative overflow-hidden flex-col p-16 text-white">
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
              <ShieldCheck className="w-7 h-7 text-white" />
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
      <div className="w-full lg:w-[55%] bg-slate-50 flex items-center justify-center p-8 relative">
        {/* Mobile Logo (only visible on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-veritas-indigo" />
          <span className="text-lg font-black tracking-tight uppercase text-slate-900">VeritasExam</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[480px]"
        >
         <div className="mb-10 text-center">
  <p className="text-sm uppercase tracking-[4px] text-slate-400 font-semibold">
    Welcome To
  </p>

  <h2 className="text-4xl md:text-5xl font-black mt-2 leading-tight">
    <span className="text-slate-900">VERITAS</span>
    <span className="text-emerald-500">EXAM</span>
  </h2>

  <div className="w-14 h-1 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
</div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            {/* Tabs / Segmented Control */}
            <div className="p-2 bg-slate-50 border-b border-slate-100 flex gap-1">
              <button 
                onClick={() => setLoginType('STUDENT')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  loginType === 'STUDENT' 
                  ? 'bg-white text-veritas-indigo shadow-sm border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${loginType === 'STUDENT' ? 'text-veritas-indigo' : 'text-slate-300'}`} />
                Student Login
              </button>
              <button 
                onClick={() => setLoginType('TEACHER')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  loginType === 'TEACHER' 
                  ? 'bg-white text-veritas-indigo shadow-sm border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <UserCircle className={`w-4 h-4 ${loginType === 'TEACHER' ? 'text-veritas-indigo' : 'text-slate-300'}`} />
                Teacher Login
              </button>
            </div>

            <div className="p-10">
              <form onSubmit={onLogin} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-veritas-indigo transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email" 
                      required 
                      placeholder="name@institution.edu"
                      value={loginData.studentId}
                      onChange={(e) => setLoginData({ ...loginData, studentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-veritas-indigo focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Password</label>
                    <a href="#" className="text-[10px] text-veritas-indigo hover:underline font-black uppercase tracking-wider">Forgot?</a>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-veritas-indigo transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-veritas-indigo focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 px-1">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="w-4 h-4 rounded border-slate-300 text-veritas-indigo focus:ring-veritas-indigo cursor-pointer" 
                  />
                  <label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Remember this device</label>
                </div>

                {/* Submit Button */}
                  <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-veritas-deep to-veritas-indigo hover:opacity-90 active:scale-[0.98] text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 group text-xs mt-4"
                >
                  Login to Portal
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-10 flex items-center justify-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">
            <a href="#" className="hover:text-veritas-indigo transition-colors">Privacy Policy</a>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href="#" className="hover:text-veritas-indigo transition-colors">Terms of Service</a>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href="#" className="hover:text-veritas-indigo transition-colors">Help Center</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
