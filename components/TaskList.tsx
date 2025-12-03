import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Task, Priority } from '../types';
import TaskDetail from './TaskDetail';
import DatePickerModal from './DatePickerModal';
import { Plus, Filter, Calendar, Trash2, CheckCircle, PlusCircle, RotateCcw, FileText, Star, MoreHorizontal, Edit3, Type, Smile, X } from 'lucide-react';
import { playPop, playSuccess } from '../utils/sound';
import { format, isToday, isFuture } from 'date-fns';

// Helper: DatePill using the new Modal
const DatePill: React.FC<{
  date?: string;
  onChange: (date?: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ date, onChange, className, placeholder = "Date" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
      <>
      <div 
        className={`relative group/date-pill inline-flex items-center ${className}`}
        onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
      >
          {/* Visual Badge */}
          <div className={`
             flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer
             ${date 
               ? 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 group-hover/date-pill:bg-gray-200 dark:group-hover/date-pill:bg-slate-600' 
               : 'text-transparent hover:text-gray-400'
             }
          `}>
             {display || (date ? "Invalid" : placeholder)}
          </div>
      </div>
      <DatePickerModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          value={date} 
          onChange={(d) => onChange(d)}
      />
      </>
  );
};

const TaskList: React.FC = () => {
  const { 
    tasks, projects, sections, logs, activeFilter, priorityFilter,
    addTask, toggleTaskCompletion, 
    setPriorityFilter, updateTask, updateProject, 
    addSection, updateSection, deleteSection
  } = useApp();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [addingSectionName, setAddingSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  
  // Section Menu State
  const [activeSectionMenu, setActiveSectionMenu] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  const activeProject = projects.find(p => p.id === activeFilter);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
        setShowIconPicker(false);
      }
      // Close section menus
      if (activeSectionMenu && !(event.target as Element).closest('.section-menu-container')) {
          setActiveSectionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSectionMenu]);

  useEffect(() => {
     if(isEditingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
     if(editingSectionId && sectionInputRef.current) {
         sectionInputRef.current.focus();
     }
  }, [editingSectionId]);

  useEffect(() => {
     if(isEditingDesc && descInputRef.current) {
         descInputRef.current.focus();
         descInputRef.current.style.height = 'auto';
         descInputRef.current.style.height = descInputRef.current.scrollHeight + 'px';
     }
  }, [isEditingDesc]);

  // Determine if we support sections in the current view
  // Sections are supported in 'inbox' and specific projects
  const supportsSections = activeFilter === 'inbox' || !!activeProject;

  const currentSections = useMemo(() => {
    if (!supportsSections) return [];
    return sections
      .filter(s => s.projectId === activeFilter)
      .sort((a, b) => a.order - b.order);
  }, [sections, activeFilter, supportsSections]);

  const tasksBySection = useMemo(() => {
    let relevantTasks = tasks;

    // Filter by Context
    if (activeFilter === 'inbox') relevantTasks = relevantTasks.filter(t => !t.isCompleted);
    else if (activeFilter === 'today') relevantTasks = relevantTasks.filter(t => !t.isCompleted && t.deadlineDate && isToday(new Date(t.deadlineDate)));
    else if (activeFilter === 'upcoming') relevantTasks = relevantTasks.filter(t => !t.isCompleted && t.deadlineDate && isFuture(new Date(t.deadlineDate)) && !isToday(new Date(t.deadlineDate)));
    else if (activeFilter === 'completed') relevantTasks = []; 
    else relevantTasks = relevantTasks.filter(t => !t.isCompleted && t.projectId === activeFilter);

    if (priorityFilter) relevantTasks = relevantTasks.filter(t => t.priority === priorityFilter);

    // Grouping
    const grouped: Record<string, Task[]> = { 'undefined': [] };
    currentSections.forEach(s => grouped[s.id] = []);

    relevantTasks.forEach(t => {
       const key = t.sectionId && grouped[t.sectionId] ? t.sectionId : 'undefined';
       grouped[key].push(t);
    });

    // Sort within groups
    Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [tasks, activeFilter, priorityFilter, currentSections]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      playPop();
      // Add to 'undefined' section (Uncategorized) by default from the top input
      addTask(newTaskTitle.trim(), undefined, undefined, undefined);
      setNewTaskTitle('');
    }
  };

  const handleAddSection = (e: React.FormEvent) => {
      e.preventDefault();
      if(addingSectionName.trim()) {
          addSection(activeFilter, addingSectionName.trim());
          setAddingSectionName('');
          setIsAddingSection(false);
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

  const renderTask = (task: Task, index: number) => {
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

        {/* Input for new task (Default to Uncategorized) */}
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

        {/* Tasks List Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 pt-2">
            
            {/* Uncategorized Tasks (Or Flat List if sections not supported) */}
            <Droppable droppableId="section-undefined">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0 mb-8 min-h-[10px]">
                        {tasksBySection['undefined']?.map((task, index) => renderTask(task, index))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {/* Sections */}
            {supportsSections && currentSections.map(section => (
                <div key={section.id} className="mb-8 group/section">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 mb-3 pb-1 group/section-header mt-6">
                        <input
                            ref={editingSectionId === section.id ? sectionInputRef : null}
                            className="font-bold text-blue-600 dark:text-blue-400 bg-transparent border-none outline-none focus:ring-0 p-0 text-lg w-full"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            onBlur={() => setEditingSectionId(null)}
                            readOnly={editingSectionId !== section.id}
                            placeholder="Section Name"
                            onClick={() => setEditingSectionId(section.id)}
                        />
                        
                        <div className="relative section-menu-container">
                            <button 
                                onClick={() => setActiveSectionMenu(activeSectionMenu === section.id ? null : section.id)}
                                className={`text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded p-1 transition-all ${activeSectionMenu === section.id ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover/section-header:opacity-100'}`}
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {activeSectionMenu === section.id && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-100 dark:border-slate-700 z-20 py-1 animate-in fade-in zoom-in-95 origin-top-right">
                                    <button 
                                        onClick={() => { setEditingSectionId(section.id); setActiveSectionMenu(null); }}
                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <Edit3 size={12} /> Rename
                                    </button>
                                    <button 
                                        onClick={() => { if(confirm("Delete section? Tasks will move to top.")) deleteSection(section.id); }}
                                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <Droppable droppableId={`section-${section.id}`}>
                        {(provided, snapshot) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef} 
                                className={`space-y-0 min-h-[40px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-gray-50/50 dark:bg-slate-800/30' : ''}`}
                            >
                                {tasksBySection[section.id]?.map((task, index) => renderTask(task, index))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            ))}

            {/* Add Section Button - Ghost Style */}
            {supportsSections && (
                <div className="mt-8 mb-12 group/section-btn">
                    {isAddingSection ? (
                        <form onSubmit={handleAddSection} className="animate-in fade-in slide-in-from-top-2">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="New Section Name" 
                                className="font-bold text-sm bg-transparent border-b-2 border-blue-500 text-gray-900 dark:text-white w-full outline-none py-1"
                                value={addingSectionName}
                                onChange={e => setAddingSectionName(e.target.value)}
                                onBlur={() => !addingSectionName && setIsAddingSection(false)}
                            />
                        </form>
                    ) : (
                        <button 
                            onClick={() => setIsAddingSection(true)}
                            className="
                                w-full py-2 rounded-lg 
                                border border-dashed border-gray-200 dark:border-slate-700 
                                text-gray-400 dark:text-gray-500 text-sm font-medium
                                hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50
                                transition-all flex items-center justify-center gap-2
                                opacity-60 hover:opacity-100
                            "
                        >
                            <PlusCircle size={14} /> Add Section
                        </button>
                    )}
                </div>
            )}

            {Object.keys(tasksBySection).every(k => tasksBySection[k].length === 0) && !isAddingSection && (
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