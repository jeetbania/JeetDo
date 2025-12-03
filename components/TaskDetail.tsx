import React, { useRef, useState } from 'react';
import { Task, Priority } from '../types';
import { X, Calendar, Flag, Trash2, CheckSquare, List, Type, Folder, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import DatePickerModal from './DatePickerModal';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose }) => {
  const { updateTask, deleteTask, projects } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
  // Date Picker States
  const [showDoDatePicker, setShowDoDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const handlePriorityChange = (p: Priority) => {
    updateTask(task.id, { priority: p });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTask(task.id, { notes: e.target.value });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const insertMarkdown = (syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Switch to edit mode if not already
    if (!isEditingNotes) setIsEditingNotes(true);

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = task.notes || '';
    const before = currentText.substring(0, start);
    const selection = currentText.substring(start, end);
    const after = currentText.substring(end);

    let newText = '';
    let newCursorPos = 0;

    if (wrap) {
        newText = before + syntax + selection + syntax + after;
        newCursorPos = start + syntax.length + selection.length + syntax.length;
    } else {
        newText = before + syntax + after;
        newCursorPos = start + syntax.length;
    }

    updateTask(task.id, { notes: newText });
    
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
        // If has time (not 00:00), show it
        const d = new Date(dateStr);
        if (d.getHours() !== 0 || d.getMinutes() !== 0) {
            return format(d, 'MMM d, h:mm a');
        }
        return format(d, 'MMM d, yyyy');
    } catch {
        return null;
    }
  };

  // --- Markdown Renderer ---
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return <span className="text-gray-400 italic">Add details, notes, or subtasks...</span>;

    return text.split('\n').map((line, index) => {
       // Headers
       if (line.startsWith('# ')) return <h3 key={index} className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-1">{parseInline(line.slice(2))}</h3>;
       if (line.startsWith('## ')) return <h4 key={index} className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-2 mb-1">{parseInline(line.slice(3))}</h4>;
       
       // Lists
       if (line.startsWith('- ')) return (
         <div key={index} className="flex items-start gap-2 ml-1 mb-1 text-gray-700 dark:text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
            <span>{parseInline(line.slice(2))}</span>
         </div>
       );

       // Checkboxes
       if (line.startsWith('[ ] ')) return (
         <div key={index} className="flex items-start gap-2 my-1 text-gray-700 dark:text-gray-300">
             <div className="mt-1 w-4 h-4 border border-gray-300 dark:border-slate-500 rounded bg-white dark:bg-slate-800"></div>
             <span>{parseInline(line.slice(4))}</span>
         </div>
       );
       if (line.startsWith('[x] ')) return (
         <div key={index} className="flex items-start gap-2 my-1 text-gray-500">
             <div className="mt-1 w-4 h-4 bg-blue-500 border border-blue-500 rounded flex items-center justify-center">
                 <Check size={10} className="text-white" />
             </div>
             <span className="line-through">{parseInline(line.slice(4))}</span>
         </div>
       );

       return <p key={index} className="mb-1 min-h-[1.2em] text-gray-700 dark:text-gray-300 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  return (
    <>
    {/* Container that handles positioning */}
    <div className="fixed inset-0 z-50 flex justify-end items-end md:items-stretch pointer-events-none">
        
        {/* Backdrop - Fades In */}
        <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto animate-fade-in" 
            onClick={onClose}
        ></div>

        {/* Card - Animates Up on Mobile, Left on Desktop */}
        <div className="
            pointer-events-auto
            flex flex-col
            w-full h-[85vh] md:h-full md:w-[480px]
            bg-white dark:bg-slate-800 
            shadow-2xl 
            
            /* Shapes */
            rounded-t-[32px] md:rounded-none
            
            /* Animations */
            animate-slide-up md:animate-slide-left
            
            /* Border Coloring for Foreground Separation */
            border-t border-x md:border-t-0 md:border-x-0 md:border-l
            border-indigo-500/30 dark:border-indigo-400/20
        ">
            
            {/* Mobile Drag Handle Indicator */}
            <div className="md:hidden w-full flex justify-center pt-4 pb-1 cursor-grab active:cursor-grabbing" onClick={onClose}>
                 <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 py-4 md:pt-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-[32px] md:rounded-none">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                    Created {format(task.createdAt, 'MMM d')}
                </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                        <Trash2 size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-300">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title & Checkbox */}
                <div className="flex items-start gap-3">
                    <div className="relative flex items-center mt-1.5">
                        <input 
                            type="checkbox" 
                            checked={task.isCompleted} 
                            onChange={() => updateTask(task.id, { isCompleted: !task.isCompleted })}
                            className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 hover:border-gray-400 checked:bg-gray-500 checked:border-gray-500 transition-all cursor-pointer bg-transparent"
                        />
                        <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                    </div>
                    <textarea
                        value={task.title}
                        onChange={(e) => updateTask(task.id, { title: e.target.value })}
                        className="flex-1 text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white resize-none leading-tight"
                        placeholder="Task title"
                        rows={1}
                        style={{ minHeight: '1.5em', height: 'auto' }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                        }}
                    />
                </div>

                {/* Properties Grid */}
                <div className="space-y-4">
                    {/* Project */}
                    <div className="flex items-center gap-4 group">
                        <div className="w-6 flex justify-center text-gray-400"><Folder size={16} /></div>
                        <div className="flex-1">
                            <select 
                                value={task.projectId}
                                onChange={(e) => updateTask(task.id, { projectId: e.target.value })}
                                className="w-full bg-transparent border-b border-gray-100 dark:border-slate-700 py-1 text-sm focus:border-blue-500 focus:outline-none dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded px-1 transition-colors"
                            >
                                <option value="inbox">Inbox</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-start gap-4 group">
                        <div className="w-6 flex justify-center text-gray-400 mt-2"><Calendar size={16} /></div>
                        <div className="flex-1 flex gap-3">
                        {/* Do Date */}
                        <div className="flex-1 group/date" onClick={() => setShowDoDatePicker(true)}>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1 cursor-pointer">Do Date</label>
                            <div className="relative w-full bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md transition-colors overflow-hidden h-9 flex items-center cursor-pointer">
                                <span className={`flex-1 px-2 text-sm truncate ${!task.workingDate ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {formatDateDisplay(task.workingDate) || "Set date"}
                                </span>
                                <Calendar size={14} className="mr-2 text-gray-400 opacity-60 group-hover/date:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        {/* Deadline */}
                        <div className="flex-1 group/date" onClick={() => setShowDeadlinePicker(true)}>
                            <label className="block text-[10px] uppercase font-bold text-red-400 mb-1 ml-1 cursor-pointer">Deadline</label>
                            <div className="relative w-full bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-md transition-colors overflow-hidden h-9 flex items-center cursor-pointer">
                                <span className={`flex-1 px-2 text-sm truncate ${!task.deadlineDate ? 'text-red-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {formatDateDisplay(task.deadlineDate) || "Set deadline"}
                                </span>
                                <Calendar size={14} className="mr-2 text-red-300 opacity-60 group-hover/date:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-4 group">
                        <div className="w-6 flex justify-center text-gray-400"><Flag size={16} /></div>
                        <div className="flex gap-2">
                            {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePriorityChange(p)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                                        task.priority === p 
                                        ? p === Priority.HIGH ? 'bg-red-100 text-red-700 border-red-200' : p === Priority.MEDIUM ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-white dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>

                {/* Notes Section */}
                <div className="flex flex-col mt-2 pb-24 md:pb-10">
                {isEditingNotes ? (
                    <div className="flex flex-col min-h-[400px] bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 relative group animate-in fade-in duration-200 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                        {/* Toolbar */}
                        <div className="flex items-center gap-1 mb-2 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700 pb-2">
                            <button onMouseDown={(e) => { e.preventDefault(); insertMarkdown('# '); }} className="p-1.5 hover:text-gray-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-800 transition-colors" title="Headline"><Type size={14} /></button>
                            <button onMouseDown={(e) => { e.preventDefault(); insertMarkdown('**', true); }} className="p-1.5 hover:text-gray-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-800 transition-colors" title="Bold"><strong className="font-bold font-serif text-sm">B</strong></button>
                            <button onMouseDown={(e) => { e.preventDefault(); insertMarkdown('- '); }} className="p-1.5 hover:text-gray-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-800 transition-colors" title="List"><List size={14} /></button>
                            <button onMouseDown={(e) => { e.preventDefault(); insertMarkdown('[ ] '); }} className="p-1.5 hover:text-gray-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-800 transition-colors" title="Checklist"><CheckSquare size={14} /></button>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={task.notes}
                            onChange={handleNotesChange}
                            placeholder="Type something..."
                            autoFocus
                            className="w-full flex-1 bg-transparent resize-none border-none focus:ring-0 text-sm leading-relaxed text-gray-800 dark:text-gray-200 p-0"
                        />
                        <div className="flex justify-end mt-3">
                            <button 
                                onClick={() => setIsEditingNotes(false)} 
                                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => setIsEditingNotes(true)}
                        className="flex-1 bg-transparent rounded-lg p-2 cursor-text text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700 min-h-[100px]"
                    >
                        {renderMarkdown(task.notes)}
                    </div>
                )}
                </div>
            </div>
        </div>

        {/* Date Picker Modals */}
        <DatePickerModal 
            isOpen={showDoDatePicker}
            onClose={() => setShowDoDatePicker(false)}
            value={task.workingDate}
            initialRepeat={task.repeat}
            onChange={(d, r) => updateTask(task.id, { workingDate: d, repeat: r })}
        />
        <DatePickerModal 
            isOpen={showDeadlinePicker}
            onClose={() => setShowDeadlinePicker(false)}
            value={task.deadlineDate}
            // Deadline usually doesn't have separate repeat from the main task loop, 
            // but we can allow it or just sync it. For now, let's just set the date.
            onChange={(d) => updateTask(task.id, { deadlineDate: d })}
        />
    </div>
    </>
  );
};

export default TaskDetail;