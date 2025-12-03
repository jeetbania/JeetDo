import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, addMonths, addWeeks, addDays, 
  endOfWeek, eachDayOfInterval, endOfYear, 
  eachMonthOfInterval, isSameMonth, isToday, isSameDay, endOfMonth,
  isValid
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, ChevronDown, AlignJustify } from 'lucide-react';
import { Task, Priority } from '../types';

// Helper functions for missing date-fns exports
const startOfMonth = (date: Date | number): Date => {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const startOfWeek = (date: Date | number): Date => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day;
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const startOfYear = (date: Date | number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear(), 0, 1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onCreateTask: (date: string) => void;
}

type ViewMode = 'year' | 'month' | 'week' | 'day';

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask, onCreateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showViewMenu, setShowViewMenu] = useState(false);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- Data Preparation ---
  const tasksByDate = useMemo(() => {
      const map = new Map<string, Task[]>();
      tasks.filter(t => !t.isCompleted && t.deadlineDate).forEach(task => {
          if (!isValid(new Date(task.deadlineDate!))) return;
          const dateKey = format(new Date(task.deadlineDate!), 'yyyy-MM-dd');
          if (!map.has(dateKey)) map.set(dateKey, []);
          map.get(dateKey)!.push(task);
      });
      return map;
  }, [tasks]);

  // --- Navigation Handlers ---
  const navigate = (direction: 'prev' | 'next') => {
      const factor = direction === 'next' ? 1 : -1;
      switch (viewMode) {
          case 'year': setCurrentDate(d => new Date(d.getFullYear() + factor, d.getMonth(), 1)); break;
          case 'month': setCurrentDate(d => addMonths(d, factor)); break;
          case 'week': setCurrentDate(d => addWeeks(d, factor)); break;
          case 'day': setCurrentDate(d => addDays(d, factor)); break;
      }
  };

  const goToToday = () => setCurrentDate(new Date());

  // --- Renderers ---

  // 1. Year View - Responsive Grid of Months
  const renderYearView = () => {
      const yearStart = startOfYear(currentDate);
      const yearEnd = endOfYear(currentDate);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      return (
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl pb-20">
                 {months.map(month => {
                     const mStart = startOfMonth(month);
                     const mEnd = endOfMonth(month);
                     const wStart = startOfWeek(mStart);
                     const wEnd = endOfWeek(mEnd);
                     const days = eachDayOfInterval({ start: wStart, end: wEnd });

                     return (
                         <div key={month.toString()} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 break-inside-avoid">
                             <div 
                                className="text-sm font-bold text-gray-900 dark:text-white mb-3 text-left cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => { setCurrentDate(month); setViewMode('month'); }}
                             >
                                 {format(month, 'MMMM')}
                             </div>
                             <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                                 {['S','M','T','W','T','F','S'].map((d, i) => (
                                     <div key={`${d}-${i}`} className="text-[10px] text-center text-gray-400 font-medium">{d}</div>
                                 ))}
                                 {days.map(day => {
                                     const isCurrentMonth = isSameMonth(day, month);
                                     if (!isCurrentMonth) return <div key={day.toString()} />; 

                                     const dateKey = format(day, 'yyyy-MM-dd');
                                     const dayTasks = tasksByDate.get(dateKey) || [];
                                     const isTodayDate = isToday(day);
                                     const hasTasks = dayTasks.length > 0;

                                     return (
                                         <div 
                                            key={day.toString()} 
                                            onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                                            className={`
                                                flex flex-col items-center justify-center h-7 cursor-pointer rounded-full transition-all relative
                                                ${isTodayDate ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'}
                                                ${hasTasks && !isTodayDate ? 'font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800/50' : ''}
                                            `}
                                         >
                                             <span className="text-xs">{format(day, 'd')}</span>
                                             {hasTasks && !isTodayDate && (
                                                 <div className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-1"></div>
                                             )}
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     )
                 })}
             </div>
          </div>
      );
  };

  // 2. Month View
  const renderMonthView = () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

      return (
        <div className="flex-1 overflow-y-auto px-4 pb-4 bg-gray-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] mb-20">
                {/* Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                {/* Grid */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                    {calendarDays.map((day, i) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasksByDate.get(dateKey) || [];
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isTodayDate = isToday(day);

                        return (
                            <div 
                                key={dateKey}
                                onClick={() => onCreateTask(format(day, 'yyyy-MM-dd'))}
                                className={`
                                    min-h-[100px] border-b border-r border-gray-100 dark:border-slate-800/50 p-2 
                                    transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/30 
                                    flex flex-col gap-1 cursor-pointer group relative
                                    ${!isCurrentMonth ? 'bg-gray-50/30 dark:bg-slate-950/30' : ''}
                                    ${i % 7 === 6 ? 'border-r-0' : ''}
                                `}
                            >
                                <div className={`flex justify-between items-start ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}`}>
                                    <span className={`
                                        text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                                        ${isTodayDate 
                                            ? 'bg-blue-600 text-white shadow-sm' 
                                            : 'text-gray-500 dark:text-gray-400'
                                        }
                                    `}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                                        <Plus size={14} />
                                    </div>
                                </div>

                                <div className={`flex-1 flex flex-col gap-1 overflow-hidden ${!isCurrentMonth ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                                    {dayTasks.slice(0, 4).map(task => {
                                        const bgColor = task.color ? `${task.color}20` : undefined;
                                        const textColor = task.color ? task.color : undefined;
                                        const borderColor = task.color ? `${task.color}40` : undefined;

                                        return (
                                            <button 
                                                key={task.id}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onSelectTask(task.id); }}
                                                className={`
                                                    text-[10px] text-left px-1.5 py-1 rounded truncate transition-transform active:scale-95 border
                                                    ${!task.color && task.priority === Priority.HIGH 
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/30' 
                                                        : !task.color ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30' : ''}
                                                `}
                                                style={task.color ? { backgroundColor: bgColor, color: textColor, borderColor: borderColor } : undefined}
                                            >
                                                {task.title}
                                            </button>
                                        );
                                    })}
                                    {dayTasks.length > 4 && (
                                        <span className="text-[9px] text-gray-400 pl-1">
                                            + {dayTasks.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      );
  };

  // 3. Week View (Vertical Scroll)
  const renderWeekView = () => {
      const start = startOfWeek(currentDate);
      const days = Array.from({length: 7}).map((_, i) => addDays(start, i));

      return (
          <div className="flex-1 overflow-y-auto px-4 pb-20 bg-gray-50 dark:bg-slate-950">
              <div className="max-w-3xl mx-auto space-y-4 pt-4">
                  {days.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const dayTasks = tasksByDate.get(dateKey) || [];
                      const isTodayDate = isToday(day);

                      return (
                          <div key={dateKey} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                              {/* Day Header */}
                              <div className={`
                                  px-4 py-3 flex items-center justify-between border-b border-gray-50 dark:border-slate-800/50
                                  ${isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                              `}>
                                  <div className="flex items-center gap-3">
                                      <span className={`text-xl font-bold ${isTodayDate ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                                          {format(day, 'd')}
                                      </span>
                                      <div className="flex flex-col">
                                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                              {format(day, 'EEEE')}
                                          </span>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => onCreateTask(dateKey)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                                  >
                                      <Plus size={16} />
                                  </button>
                              </div>

                              {/* Day Content */}
                              <div className="p-2 min-h-[60px]">
                                  {dayTasks.length === 0 ? (
                                      <div className="text-center py-4 text-xs text-gray-400 italic">No tasks planned</div>
                                  ) : (
                                      <div className="space-y-2">
                                          {dayTasks.map(task => (
                                              <div 
                                                  key={task.id}
                                                  onClick={() => onSelectTask(task.id)}
                                                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950/50 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-700 cursor-pointer transition-all group"
                                              >
                                                  <div className={`w-1 h-8 rounded-full ${task.isCompleted ? 'bg-gray-300' : (task.color ? '' : 'bg-blue-500')}`} style={task.color ? { backgroundColor: task.color } : {}}></div>
                                                  <div className="flex-1 min-w-0">
                                                      <div className={`text-sm font-medium truncate ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                                                          {task.title}
                                                      </div>
                                                  </div>
                                                  {task.priority === Priority.HIGH && !task.isCompleted && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  // 4. Day View
  const renderDayView = () => {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const dayTasks = tasksByDate.get(dateKey) || [];
      const isTodayDate = isToday(currentDate);

      return (
          <div className="flex-1 overflow-y-auto px-4 pb-20 bg-gray-50 dark:bg-slate-950">
              <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 min-h-[500px] flex flex-col mt-4">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                      <div>
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{format(currentDate, 'EEEE')}</h2>
                          <p className={`text-lg mt-1 ${isTodayDate ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>{format(currentDate, 'MMMM d, yyyy')}</p>
                      </div>
                      <button 
                          onClick={() => onCreateTask(dateKey)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95"
                      >
                          <Plus size={24} />
                      </button>
                  </div>

                  <div className="p-6 flex-1">
                      {dayTasks.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                              <CalendarIcon size={48} className="mb-4 opacity-20" />
                              <p>No tasks for this day.</p>
                              <button onClick={() => onCreateTask(dateKey)} className="text-blue-500 text-sm mt-2 hover:underline">Add one?</button>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {dayTasks.map(task => (
                                  <div 
                                      key={task.id}
                                      onClick={() => onSelectTask(task.id)}
                                      className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-slate-700"
                                  >
                                      <div 
                                        className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center ${task.isCompleted ? 'bg-gray-400 border-gray-400' : 'border-gray-300 dark:border-gray-500'}`}
                                      >
                                          {task.isCompleted && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                      </div>
                                      <div className="flex-1">
                                          <h3 className={`text-base font-medium ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
                                          {task.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.notes}</p>}
                                      </div>
                                      {task.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} />}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 dark:bg-slate-950/50">
      
      {/* Calendar Header - Removed z-20 to fix overlap with sidebar/modals */}
      <div className="flex items-center justify-between px-6 py-6 md:pt-10">
        <div className="relative">
            <button 
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
                <CalendarIcon className="text-blue-500" />
                <span className="capitalize">{viewMode === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy')}</span>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${showViewMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showViewMenu && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewMenu(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {(['year', 'month', 'week', 'day'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => { setViewMode(mode); setShowViewMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium capitalize transition-colors flex items-center justify-between
                                ${viewMode === mode ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'}
                            `}
                        >
                            {mode} View
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Today
            </button>
            <button onClick={() => navigate('next')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'year' && renderYearView()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

    </div>
  );
};

export default CalendarView;