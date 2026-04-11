import React from 'react';
import { AlertTriangle, Clock, Info, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';

interface Violation {
  type: string;
  timestamp: string;
  details: string;
}

interface ViolationLogProps {
  violations: Violation[];
  riskScore: number;
}

export const ViolationLog: React.FC<ViolationLogProps> = ({ violations, riskScore }) => {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 30) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getViolationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TAB_SWITCH': return <ShieldAlert className="w-4 h-4" />;
      case 'FULLSCREEN_EXIT': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase font-mono">Violation Log</h2>
        </div>
        
        <div className={cn(
          "px-4 py-2 rounded-lg border flex items-center gap-3 transition-all",
          getRiskColor(riskScore)
        )}>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-70">Risk Score:</span>
          <span className="text-lg font-black font-mono">{riskScore}%</span>
        </div>
      </div>

      {violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest font-bold">No violations detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {violations.map((v, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg group hover:border-rose-200 transition-all">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-rose-500 group-hover:bg-rose-50 transition-colors">
                {getViolationIcon(v.type)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight font-mono">
                    {v.type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 font-bold uppercase">
                    <Clock className="w-3 h-3" />
                    {format(new Date(v.timestamp), 'HH:mm:ss')}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {v.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
