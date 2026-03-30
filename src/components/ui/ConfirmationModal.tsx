import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, Info, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'warning': return <HelpCircle className="w-6 h-6 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-50 border-rose-100';
      case 'warning': return 'bg-amber-50 border-amber-100';
      case 'success': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200';
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200';
      default: return 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-xl border shrink-0", getColorClass())}>
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {message}
                  </p>
                </div>
                <button 
                  onClick={onCancel}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={cn(
                    "px-6 py-2 text-sm font-black rounded-xl shadow-lg transition-all active:scale-95",
                    getButtonClass()
                  )}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
