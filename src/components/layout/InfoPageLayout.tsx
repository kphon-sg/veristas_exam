import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ScanFace } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, subtitle, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-veritas-indigo/20">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-veritas-indigo rounded-xl flex items-center justify-center shadow-lg">
              <ScanFace className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight uppercase text-slate-900">VeritasExam</span>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-veritas-indigo transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-veritas-deep to-veritas-indigo py-20 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{title}</h1>
          <p className="text-teal-100/70 text-lg font-medium">{subtitle}</p>
        </motion.div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-16 px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/60 border border-slate-100 prose prose-slate max-w-none"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          © 2026 VeritasExam Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
