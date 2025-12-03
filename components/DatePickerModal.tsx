import React, { useState, useEffect } from 'react';
import { 
  format, addDays, addMonths, endOfMonth, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, 
  isToday, getHours, getMinutes, isValid 
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Sun, Sunset, Calendar as CalendarIcon, 
  Clock, Bell, Repeat, ChevronRight as ChevronRightSmall, CalendarDays 
} from 'lucide-react';

// Local helpers for missing date-fns exports
const startOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const startOfWeek = (date: Date): Date => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day; // Adjust to Sunday
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const setHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(hours);
  return newDate;
};

const setMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(minutes);
  return newDate;
};

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value?: string;
  onChange: (date?: string, repeat?: string) => void;
  initialRepeat?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ 
  isOpen, onClose, value, onChange, initialRepeat 
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [repeat, setRepeat] = useState<string | undefined>(initialRepeat);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
        let d = new Date();
        if (value && isValid(new Date(value))) {
            d = new Date(value);
            setSelectedDate(d);
            // Enable time if not midnight, or if specifically wanted. 
            // For simplicity, we assume if it's set to something specific (not 00:00), time is enabled.
            const h = d.getHours();
            const m = d.getMinutes();
            setTimeEnabled(h !== 0 || m !== 0);
        } else {
            setSelectedDate(null);
            setTimeEnabled(false);
        }
        setViewDate(d);
        setRepeat(initialRepeat);
        setShowTimePicker(false);
        setShowRepeatPicker(false);
    }
  }, [isOpen, value, initialRepeat]);

  if (!isOpen) return null;

  const handleDayClick = (day: Date) => {
    let newDate = day;
    // Preserve time if already selected or time enabled
    if (selectedDate && timeEnabled) {
        newDate = setHours(newDate, getHours(selectedDate));
        newDate = setMinutes(newDate, getMinutes(selectedDate));
    } else if (timeEnabled) {
         // Default to 9:00 AM if time enabled but no previous date selected
         newDate = setHours(newDate, 9);
         newDate = setMinutes(newDate, 0);
    } else {
         newDate = setHours(newDate, 0);
         newDate = setMinutes(newDate, 0);
    }
    setSelectedDate(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    const baseDate = selectedDate || new Date(); 
    let newDate = setHours(baseDate, h);
    newDate = setMinutes(newDate, m);
    setSelectedDate(newDate);
    if (!selectedDate) {
        // If date wasn't selected, assume today/viewDate
        setViewDate(newDate);
    }
  };

  const handlePreset = (type: 'today' | 'tomorrow' | 'next-week' | 'next-month') => {
      const now = new Date();
      let d = now;
      
      switch(type) {
          case 'today': d = now; break;
          case 'tomorrow': d = addDays(now, 1); break;
          case 'next-week': d = addDays(now, 7); break;
          case 'next-month': d = addMonths(now, 1); break;
      }
      
      // Preserve time or reset to 00:00
      if (selectedDate && timeEnabled) {
         d = setHours(d, getHours(selectedDate));
         d = setMinutes(d, getMinutes(selectedDate));
      } else {
         d = setHours(d, 0);
         d = setMinutes(d, 0);
      }
      
      setViewDate(d);
      setSelectedDate(d);
  };

  const handleOk = () => {
    if (selectedDate) {
        let finalDate = selectedDate;
        if (!timeEnabled) {
             finalDate = setHours(finalDate, 0);
             finalDate = setMinutes(finalDate, 0);
        }
        onChange(finalDate.toISOString(), repeat);
    } else {
        onChange(undefined, repeat);
    }
    onClose();
  };

  const handleClear = () => {
      onChange(undefined, undefined);
      onClose();
  };

  // Calendar Grid Generation
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Quick Presets Row */}
        <div className="flex justify-between px-6 mt-6 mb-4">
            <button onClick={() => handlePreset('today')} className="flex flex-col items-center gap-1 group">
                <Sun size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                <span className="text-[10px] text-gray-400 font-medium group-hover:text-orange-500">Today</span>
            </button>
            <button onClick={() => handlePreset('tomorrow')} className="flex flex-col items-center gap-1 group">
                <Sunset size={24} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Tomorrow</span>
            </button>
            <button onClick={() => handlePreset('next-week')} className="flex flex-col items-center gap-1 group">
                <div className="relative">
                    <CalendarIcon size={24} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                    <span className="absolute -right-2 -top-1 bg-gray-100 dark:bg-slate-700 text-[8px] font-bold px-0.5 rounded text-gray-600 dark:text-gray-300 group-hover:text-purple-500">+7</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium group-hover:text-purple-500">Next Week</span>
            </button>
            <button onClick={() => handlePreset('next-month')} className="flex flex-col items-center gap-1 group">
                <div className="relative">
                    <CalendarDays size={24} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                     <span className="absolute -right-2 -top-1 bg-gray-100 dark:bg-slate-700 text-[8px] font-bold px-0.5 rounded text-gray-600 dark:text-gray-300 group-hover:text-indigo-400">+30</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium group-hover:text-indigo-400">Next Month</span>
            </button>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 mb-3">
            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                {format(viewDate, 'MMMM yyyy')}
            </span>
            <div className="flex gap-2">
                <button onClick={() => setViewDate(addMonths(viewDate, -1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500"><ChevronLeft size={20} /></button>
                <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500"><ChevronRight size={20} /></button>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-6 mb-4">
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-400">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, i) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const isTodayDate = isToday(day);

                    return (
                        <div key={i} className="flex justify-center">
                            <button
                                onClick={() => handleDayClick(day)}
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                    ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}
                                    ${isSelected ? 'bg-blue-600 text-white shadow-md !font-bold' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}
                                    ${!isSelected && isTodayDate ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Options List */}
        <div className="px-4 space-y-1 mb-6">
            {/* Time Toggle */}
            <div className="px-2 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowTimePicker(!showTimePicker)}
                >
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {timeEnabled && selectedDate && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                {format(selectedDate, 'h:mm a')}
                            </span>
                        )}
                        <ChevronRightSmall size={16} className={`text-gray-400 transition-transform ${showTimePicker ? 'rotate-90' : ''}`} />
                    </div>
                </div>

                {showTimePicker && (
                    <div className="mt-3 pl-8 pr-2 animate-in slide-in-from-top-2">
                        <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Enable Time</span>
                                <button 
                                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${timeEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newVal = !timeEnabled;
                                        setTimeEnabled(newVal);
                                        if(newVal && !selectedDate) {
                                            const now = new Date();
                                            now.setHours(9, 0, 0, 0);
                                            setSelectedDate(now);
                                            setViewDate(now);
                                        } else if (newVal && selectedDate) {
                                            if (getHours(selectedDate) === 0 && getMinutes(selectedDate) === 0) {
                                                const d = setHours(selectedDate, 9);
                                                setSelectedDate(d);
                                            }
                                        }
                                    }}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${timeEnabled ? 'translate-x-5' : ''}`}></div>
                                </button>
                            </div>
                            {timeEnabled && (
                                <div className="relative">
                                    <input 
                                        type="time" 
                                        className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center font-medium text-gray-700 dark:text-gray-200"
                                        value={selectedDate ? format(selectedDate, 'HH:mm') : '09:00'}
                                        onChange={handleTimeChange}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Reminder (Static for now) */}
            <div className="px-2 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                    <Bell size={18} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Reminder</span>
                </div>
                <ChevronRightSmall size={16} className="text-gray-400" />
            </div>

            {/* Repeat */}
            <div className="px-2 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => setShowRepeatPicker(!showRepeatPicker)}
                >
                    <div className="flex items-center gap-3">
                        <Repeat size={18} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Repeat</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {repeat && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded capitalize">
                                {repeat}
                            </span>
                        )}
                        <ChevronRightSmall size={16} className={`text-gray-400 transition-transform ${showRepeatPicker ? 'rotate-90' : ''}`} />
                    </div>
                </div>
                
                {showRepeatPicker && (
                    <div className="mt-3 pl-8 pr-2 animate-in slide-in-from-top-2">
                        <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-2 border border-gray-100 dark:border-slate-700 shadow-sm">
                            <div className="grid grid-cols-2 gap-1.5">
                                {['daily', 'weekly', 'monthly', 'yearly'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={(e) => { e.stopPropagation(); setRepeat(repeat === opt ? undefined : opt); setShowRepeatPicker(false); }}
                                        className={`
                                            text-xs font-medium px-3 py-2 rounded-xl transition-all duration-200 capitalize
                                            ${repeat === opt 
                                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-bold' 
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-600/50 hover:text-gray-700 dark:hover:text-gray-200'
                                            }
                                        `}
                                    >
                                        {opt}
                                    </button>
                                ))}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setRepeat(undefined); setShowRepeatPicker(false); }} 
                                    className="col-span-2 text-xs font-medium px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-1"
                                >
                                    No Repeat
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
            <button 
                onClick={handleClear}
                className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 shadow-sm"
            >
                Clear
            </button>
            <button 
                onClick={handleOk}
                className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-200 dark:shadow-none transition-all active:scale-95"
            >
                OK
            </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;