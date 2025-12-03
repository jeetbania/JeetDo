import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Task, Priority } from '../types';
import TaskDetail from './TaskDetail';
import { Plus, Filter, Calendar, Trash2, CheckCircle, PlusCircle, RotateCcw, FileText, Star, MoreHorizontal, Edit3, Type, Smile } from 'lucide-react';
import { playPop, playSuccess } from '../utils/sound';
import { format, isToday, isFuture, parseISO } from 'date-fns';

// Helper: Pill-style Native Date Picker
const DatePill: React.FC<{
  date?: string;
  onChange: (date?: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ date, onChange, className, placeholder = "Date" }) => {
  const formatDateDisplay = (d?: string) => {
    if (!d) return null;
    try {
        const dateObj = new Date(d);
        if(isNaN(dateObj.getTime())) return null;
        return format(dateObj, 'MMM d');
    } catch(e) { return null; }
  };
  
  const display = formatDateDisplay(date);

  return (
      <div className={`relative group/date-pill inline-flex items-center ${className}`}>
          {/* Visual Badge */}
          <div className={`
             flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer
             ${date 
               ? 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 group-hover/date-pill:bg-gray-200 dark:group-hover/date-pill:bg-slate-600' 
               : 'text-transparent hover:text-gray-400' /* Hide unless hover/set if needed, but here we usually show if set */
             }
          `}>
             {display || (date ? "Invalid" : placeholder)}
          </div>

          {/* Hidden Input for Functionality */}
          <input 
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            value={date ? date.split('T')[0] : ''}
            onChange={(e) => {
                 const val = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                 onChange(val);
            }}
            onClick={(e) => e.stopPropagation()} 
          />
      </div>
  );
};

const TaskList: React.FC = () => {
  const { 
    tasks, projects, logs, activeFilter, priorityFilter,
    addTask, toggleTaskCompletion, 
    setPriorityFilter, updateTask, updateProject
  } = useApp();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const activeProject = projects.find(p => p.id === activeFilter);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
     if(isEditingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
     if(isEditingDesc && descInputRef.current) {
         descInputRef.current.focus();
         descInputRef.current.style.height = 'auto';
         descInputRef.current.style.height = descInputRef.current.scrollHeight + 'px';
     }
  }, [isEditingDesc]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (activeFilter === 'inbox') result = result.filter(t => !t.isCompleted);
    else if (activeFilter === 'today') result = result.filter(t => !t.isCompleted && t.deadlineDate && isToday(new Date(t.deadlineDate)));
    else if (activeFilter === 'upcoming') result = result.filter(t => !t.isCompleted && t.deadlineDate && isFuture(new Date(t.deadlineDate)) && !isToday(new Date(t.deadlineDate)));
    else if (activeFilter === 'completed') result = []; 
    else result = result.filter(t => !t.isCompleted && t.projectId === activeFilter);

    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter);

    return result.sort((a, b) => a.order - b.order);
  }, [tasks, activeFilter, priorityFilter]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      playPop();
      addTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleToggle = (id: string, isCompleted: boolean) => {
    if (!isCompleted) {
        playSuccess();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
        });
    }
    toggleTaskCompletion(id);
  };

  const renderHeader = () => {
      if (!activeProject) {
        let title = 'Tasks';
        if (activeFilter === 'inbox') title = 'Inbox';
        if (activeFilter === 'today') title = 'Today';
        if (activeFilter === 'upcoming') title = 'Upcoming';
        if (activeFilter === 'completed') title = 'Logbook';

        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                    {title}
                </h1>
            </div>
        );
      }

      return (
        <div className="relative group/header">
            <div className="flex items-center gap-2 mb-1">
                {activeProject.icon && (
                    <span 
                        className="text-3xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 rounded p-1 transition-colors"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                    >
                        {activeProject.icon}
                    </span>
                )}
                
                {isEditingTitle ? (
                    <input 
                        ref={titleInputRef}
                        className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none w-full"
                        value={activeProject.name}
                        onChange={(e) => updateProject(activeProject.id, { name: e.target.value })}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    />
                ) : (
                    <h1 
                        className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight cursor-text"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {activeProject.name}
                    </h1>
                )}

                <div className="relative ml-2" ref={headerMenuRef}>
                    <button 
                        onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                        className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="font-bold text-xl pb-2 block leading-3">...</span>
                    </button>

                    {isHeaderMenuOpen && (
                        <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-100 dark:border-slate-700 z-20 py-1 animate-in fade-in zoom-in-95">
                            <button 
                                onClick={() => { setIsEditingTitle(true); setIsHeaderMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Edit3 size={14} /> Rename
                            </button>
                            <button 
                                onClick={() => { setIsEditingDesc(true); setIsHeaderMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Type size={14} /> {activeProject.description ? 'Edit Description' : 'Add Description'}
                            </button>
                            <button 
                                onClick={() => { setShowIconPicker(!showIconPicker); setIsHeaderMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Smile size={14} /> {activeProject.icon ? 'Change Icon' : 'Add Icon'}
                            </button>
                        </div>
                    )}

                    {showIconPicker && (
                         <div className="absolute left-0 top-full mt-1 p-2 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-100 dark:border-slate-700 z-30 animate-in fade-in zoom-in-95 grid grid-cols-5 gap-1 w-48">
                            {['📊', '🏠', '🚀', '🎨', '🎓', '💼', '✈️', '🛒', '💡', '🔥', '⭐', '❤️', '✅', '📁', '📝'].map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => { updateProject(activeProject.id, { icon }); setShowIconPicker(false); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-xl flex justify-center"
                                >
                                    {icon}
                                </button>
                            ))}
                            <button 
                                onClick={() => { updateProject(activeProject.id, { icon: undefined }); setShowIconPicker(false); }}
                                className="col-span-5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-1 rounded mt-1"
                            >
                                Remove Icon
                            </button>
                         </div>
                    )}
                </div>
            </div>

            <div className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-2xl">
                {isEditingDesc ? (
                     <textarea 
                        ref={descInputRef}
                        className="w-full bg-transparent border border-blue-200 dark:border-blue-800 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-sm text-gray-700 dark:text-gray-300"
                        placeholder="Add a description..."
                        value={activeProject.description || ''}
                        onChange={(e) => {
                             updateProject(activeProject.id, { description: e.target.value });
                             e.target.style.height = 'auto';
                             e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={() => setIsEditingDesc(false)}
                        rows={2}
                    />
                ) : (
                    <p 
                        className={`min-h-[1.5em] ${!activeProject.description ? 'hidden' : 'cursor-text hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => setIsEditingDesc(true)}
                    >
                        {activeProject.description}
                    </p>
                )}
            </div>
        </div>
      );
  };

  if (activeFilter === 'completed') {
      return (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full h-full">
            <div className="px-6 py-8 md:pt-12">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    Logbook
                    <span className="text-sm font-normal text-gray-400 ml-2 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full">{logs.length}</span>
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-slate-800/50">
                             <div className={`p-1.5 rounded-full ${
                                 log.action === 'complete' ? 'bg-green-50 text-green-600' : 
                                 log.action === 'create' ? 'bg-blue-50 text-blue-600' :
                                 log.action === 'delete' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                             }`}>
                                 {log.action === 'complete' && <CheckCircle size={14} />}
                                 {log.action === 'create' && <PlusCircle size={14} />}
                                 {log.action === 'delete' && <Trash2 size={14} />}
                                 {log.action === 'uncomplete' && <RotateCcw size={14} />}
                             </div>
                             <div>
                                 <p className="text-sm text-gray-900 dark:text-white">
                                     <span className="capitalize text-gray-500">{log.action === 'uncomplete' ? 'Uncompleted' : log.action + 'd'}</span> {log.taskTitle}
                                 </p>
                                 <p className="text-[10px] text-gray-300 dark:text-gray-500 mt-0.5">
                                     {format(log.timestamp, 'MMM d, h:mm a')}
                                 </p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex-1 h-full flex relative">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="px-6 py-8 md:pt-12 flex justify-between items-start">
            <div className="flex-1">
                {renderHeader()}
            </div>
            
            <div className="relative pt-1">
                {activeFilter !== 'presentation' && activeFilter !== 'inbox' && !projects.find(p=>p.id===activeFilter) ? null : (
                    <button 
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className={`p-2 rounded-lg transition-colors ${priorityFilter ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400'}`}
                    >
                        <Filter size={18} />
                    </button>
                )}
                {isFilterMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-100 dark:border-slate-700 z-10 overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-1">
                            <button onClick={() => setPriorityFilter(null)} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-gray-300">All</button>
                            {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => (
                                <button key={p} onClick={() => setPriorityFilter(p)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="px-6 mb-2">
            <form onSubmit={handleCreateTask} className="flex items-center gap-3">
                <Plus className="text-gray-300" size={20} />
                <input 
                    type="text" 
                    placeholder="Add a task" 
                    className="flex-1 bg-transparent outline-none text-gray-600 dark:text-gray-300 placeholder-gray-300 text-base"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
            </form>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-20 pt-2">
            <Droppable droppableId="tasks-list">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0">
                        {filteredTasks.map((task, index) => {
                            const project = projects.find(p => p.id === task.projectId);
                            const hasNotes = task.notes && task.notes.trim().length > 0;
                            
                            return (
                                <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!!priorityFilter}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`
                                                group flex items-start gap-3 py-2.5 bg-white dark:bg-slate-900 
                                                transition-all border-b border-transparent hover:border-gray-50 dark:hover:border-slate-800
                                                active:scale-[0.98] transform origin-center
                                                ${snapshot.isDragging ? 'shadow-lg rotate-1 z-10 rounded-lg' : ''}
                                                ${task.isCompleted ? 'opacity-40' : ''}
                                            `}
                                            onClick={() => setSelectedTaskId(task.id)}
                                        >
                                            <div onClick={(e) => e.stopPropagation()} className="relative flex items-center justify-center mt-0.5">
                                                <input 
                                                    type="checkbox" 
                                                    checked={task.isCompleted}
                                                    onChange={() => handleToggle(task.id, task.isCompleted)}
                                                    className="peer appearance-none w-4 h-4 border border-gray-300 dark:border-slate-600 rounded-[4px] checked:bg-gray-500 checked:border-gray-500 transition-colors cursor-pointer"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 text-white">
                                                    <CheckCircle size={10} fill="white" className="text-gray-500" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                {task.priority === Priority.HIGH && !task.isCompleted && (
                                                    <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                                )}

                                                <span className={`text-[15px] ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {task.title}
                                                </span>

                                                {hasNotes && (
                                                    <FileText size={12} className="text-gray-400" />
                                                )}

                                                {task.deadlineDate && (
                                                    <DatePill 
                                                        date={task.deadlineDate}
                                                        onChange={(d) => updateTask(task.id, { deadlineDate: d })}
                                                    />
                                                )}

                                                {task.priority === Priority.HIGH && (
                                                    <span className="inline-flex px-1.5 py-0.5 bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded text-[10px] font-medium">Important</span>
                                                )}
                                                
                                                {project && activeFilter !== project.id && (
                                                    <span 
                                                        className="px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-slate-800"
                                                    >
                                                        {project.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {filteredTasks.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p>No tasks found.</p>
                </div>
            )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};

export default TaskList;