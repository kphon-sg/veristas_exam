import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { MonitoringEvent } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EventLogProps {
  events: MonitoringEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  return (
    <div className="flex flex-col h-full bg-white border border-portal-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b border-portal-100 bg-portal-50 flex items-center justify-between">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-portal-600 flex items-center gap-2 font-black">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          Behavior Log
        </h3>
        <span className="text-[11px] font-mono text-portal-400 uppercase tracking-tighter font-bold">{events.length} Events</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Info className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 font-bold">No suspicious activity</p>
            </div>
          ) : (
            events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-3 rounded-lg border flex gap-3 items-start transition-all shadow-sm",
                  event.severity === 'high' ? "bg-rose-50 border-rose-100" : 
                  event.severity === 'medium' ? "bg-amber-50 border-amber-100" : 
                  "bg-slate-50 border-slate-100"
                )}
              >
                <AlertTriangle className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  event.severity === 'high' ? "text-rose-500" : 
                  event.severity === 'medium' ? "text-amber-500" : 
                  "text-slate-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-tighter",
                      event.severity === 'high' ? "text-rose-700" : 
                      event.severity === 'medium' ? "text-amber-700" : 
                      "text-slate-700"
                    )}>
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      {event.endTime ? ` → ${new Date(event.endTime).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : " → Ongoing"}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 leading-tight font-medium">{event.message}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
