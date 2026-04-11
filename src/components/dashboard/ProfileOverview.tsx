import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Shield, 
  BookOpen, 
  Calendar, 
  Phone, 
  Settings, 
  Lock,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProfileOverviewProps {
  user: any;
  onEditProfile: () => void;
  onClose?: () => void;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({ user, onEditProfile, onClose }) => {
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    day: 'numeric'
  }) : 'N/A';

  const infoFields = [
    { 
      label: 'Email Address', 
      value: user.email, 
      icon: Mail,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    { 
      label: user.role === 'STUDENT' ? 'Student ID' : 'Employee ID', 
      value: user.studentCode || user.username || 'N/A', 
      icon: Shield,
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Department', 
      value: user.department || 'Not Assigned', 
      icon: BookOpen,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    { 
      label: 'Phone Number', 
      value: user.phoneNumber || 'Not Provided', 
      icon: Phone,
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    { 
      label: 'Member Since', 
      value: joinDate, 
      icon: Calendar,
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your personal information and security settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-br from-veritas-indigo to-indigo-600 relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
            </div>
            <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative">
              <div className="w-32 h-32 rounded-full border-8 border-white bg-slate-100 shadow-xl overflow-hidden mb-4">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <User className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 text-center leading-tight">
                {user.full_name || user.username}
              </h2>
              
              <div className="mt-3">
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                  user.role === 'TEACHER' 
                    ? "bg-amber-50 text-amber-600 border border-amber-100" 
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                )}>
                  {user.role}
                </span>
              </div>

              <div className="w-full mt-8 space-y-3">
                <button 
                  onClick={onEditProfile}
                  className="w-full py-3.5 bg-veritas-indigo text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
                
                <button 
                  onClick={onEditProfile}
                  className="w-full py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-md border border-slate-100 p-8"
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-6 bg-veritas-indigo rounded-full" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {infoFields.map((field, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    field.bg
                  )}>
                    <field.icon className={cn("w-5 h-5", field.color)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block mb-1">
                      {field.label}
                    </label>
                    <p className="text-sm font-bold text-slate-900">
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50">
              <div className="bg-slate-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Shield className="w-6 h-6 text-veritas-indigo" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Account Security</h4>
                    <p className="text-xs font-medium text-slate-500">Your account is protected with 256-bit encryption</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Account</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
