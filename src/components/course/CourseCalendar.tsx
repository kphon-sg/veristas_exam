import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CourseCalendarProps {
  courseId: number;
  events: {
    id: string | number;
    title: string;
    date: Date;
    type: 'DEADLINE' | 'EXAM' | 'SESSION';
  }[];
}

const CourseCalendar: React.FC<CourseCalendarProps> = ({ events }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-veritas-indigo" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Course Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={nextMonth}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={idx} 
              className={cn(
                "min-h-[80px] p-2 border-r border-b border-slate-50 last:border-r-0 relative transition-colors",
                !isCurrentMonth && "bg-slate-50/30",
                isToday && "bg-indigo-50/30",
                dayEvents.some(e => e.type === 'DEADLINE') && "bg-rose-50/10"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-bold",
                  !isCurrentMonth ? "text-slate-300" : "text-slate-500",
                  isToday && "text-veritas-indigo"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.some(e => e.type === 'DEADLINE') && (
                  <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                )}
              </div>

              <div className="mt-1 space-y-1">
                {dayEvents.map((event, eIdx) => (
                  <div 
                    key={eIdx}
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-sm font-bold truncate border shadow-sm transition-transform hover:scale-105",
                      event.type === 'DEADLINE' && "bg-rose-50 text-rose-700 border-rose-200",
                      event.type === 'EXAM' && "bg-amber-50 text-amber-700 border-amber-100",
                      event.type === 'SESSION' && "bg-teal-50 text-teal-700 border-teal-100"
                    )}
                    title={event.title}
                  >
                    {event.type === 'DEADLINE' && "● "}{event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Deadline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Exam</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Session</span>
        </div>
      </div>
    </div>
  );
};

export default CourseCalendar;
