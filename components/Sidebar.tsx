import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Inbox, Calendar, CheckCircle, Settings, 
  Plus, Moon, Sun, LogOut, Check, Trophy 
} from 'lucide-react';
import { isToday, startOfWeek, isAfter } from 'date-fns';
import confetti from 'canvas-confetti';
import { playSuccess } from '../utils/sound';
import { Droppable } from '@hello-pangea/dnd';

const Sidebar: React.FC<{ isOpen: boolean, toggleOpen: () => void }> = ({ isOpen, toggleOpen }) => {
  const { 
    projects, activeFilter, setActiveFilter, addProject, 
    tasks, logs, user, setTheme, resetData, deleteProject
  } = useApp();
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const prevCountRef = useRef(0);

  const inboxCount = tasks.filter(t => !t.isCompleted).length;
  
  const todayCount = tasks.filter(t => {
      if(t.isCompleted) return false;
      if(!t.deadlineDate) return false;
      return isToday(new Date(t.deadlineDate));
  }).length;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const completedThisWeek = logs
    .filter(log => log.action === 'complete' && isAfter(log.timestamp, weekStart))
    .map(log => log.taskTitle);
  
  const uniqueCompletedCount = new Set(completedThisWeek).size;
  const weeklyGoal = 5;
  const progressPercentage = Math.min(100, (uniqueCompletedCount / weeklyGoal) * 100);

  useEffect(() => {
    if (uniqueCompletedCount >= weeklyGoal && prevCountRef.current < weeklyGoal && prevCountRef.current !== 0) {
        playSuccess(0.2);
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }
    prevCountRef.current = uniqueCompletedCount;
  }, [uniqueCompletedCount]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if(newProjectName.trim()) {
        addProject(newProjectName.trim());
        setNewProjectName('');
        setIsAddingProject(false);
    }
  };

  const getMotivationalText = () => {
      if (uniqueCompletedCount === 0) return "Let's get this bread! 🍞";
      if (uniqueCompletedCount < 3) return "Warming up! 🔥";
      if (uniqueCompletedCount < 5) return "Almost there! 🚀";
      return "You are a machine! 🤖";
  };

  const navItemClass = (id: string, isDraggingOver: boolean) => `
    flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
    ${isDraggingOver 
        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400 dark:ring-blue-500 text-blue-700 dark:text-blue-300' 
        : activeFilter === id 
            ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
    }
  `;

  return (
    <>
    <div 
        className={`fixed inset-0 bg-black/20 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={toggleOpen}
    ></div>

    <aside className={`
      fixed md:static inset-y-0 left-0 z-30
      w-64 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-gray-200 dark:border-slate-800
      transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 
      flex flex-col
    `}>
      <div className="p-4 flex items-center justify-between">
         <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Check size={20} strokeWidth={3} />
            </div>
            <span>JeetDo</span>
         </div>
         <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md transition-colors">
            <Settings size={18} className="text-gray-500" />
         </button>
      </div>

      {showSettings && (
          <div className="px-4 py-2 mb-2 bg-white dark:bg-slate-800 mx-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
              <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">Settings</div>
              <div className="mb-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 block mb-2">Theme</span>
                  <div className="flex bg-gray-100 dark:bg-slate-700 rounded p-1">
                      <button onClick={() => setTheme('light')} className={`flex-1 text-xs py-1 rounded flex justify-center items-center gap-1 ${user.theme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                         <Sun size={12}/> Light
                      </button>
                      <button onClick={() => setTheme('dark')} className={`flex-1 text-xs py-1 rounded flex justify-center items-center gap-1 ${user.theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                         <Moon size={12}/> Dark
                      </button>
                      <button onClick={() => setTheme('black')} className={`flex-1 text-xs py-1 rounded flex justify-center items-center gap-1 ${user.theme === 'black' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                         <div className="w-3 h-3 bg-black border border-gray-500 rounded-full"></div> Black
                      </button>
                  </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-slate-700 mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Reset App</span>
                  <button 
                    onClick={() => {
                        if (confirm('Are you sure you want to reset all app data? This action cannot be undone.')) {
                            resetData();
                        }
                    }} 
                    className="p-2 -mr-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors active:scale-95"
                    aria-label="Reset Data"
                  >
                      <LogOut size={16} />
                  </button>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <nav className="mb-6">
            <Droppable droppableId="inbox-droppable">
                {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <button onClick={() => setActiveFilter('inbox')} className={navItemClass('inbox', snapshot.isDraggingOver)}>
                            <div className="flex items-center gap-2"><Inbox size={18} /> Inbox</div>
                            {inboxCount > 0 && <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{inboxCount}</span>}
                        </button>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

          <button onClick={() => setActiveFilter('today')} className={navItemClass('today', false)}>
            <div className="flex items-center gap-2"><Calendar size={18} className="text-yellow-500" /> Today</div>
            {todayCount > 0 && <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{todayCount}</span>}
          </button>
          <button onClick={() => setActiveFilter('upcoming')} className={navItemClass('upcoming', false)}>
            <div className="flex items-center gap-2"><Calendar size={18} className="text-red-500" /> Upcoming</div>
          </button>
          <button onClick={() => setActiveFilter('completed')} className={navItemClass('completed', false)}>
            <div className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Logbook</div>
          </button>
        </nav>

        <div className="mb-2 flex items-center justify-between group">
             <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2">Projects</span>
             <button onClick={() => setIsAddingProject(!isAddingProject)} className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Plus size={16} />
             </button>
        </div>

        {isAddingProject && (
            <form onSubmit={handleAddProject} className="mb-2 px-2">
                <input 
                    autoFocus
                    type="text" 
                    className="w-full text-sm bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 outline-none text-gray-800 dark:text-white"
                    placeholder="Project name..."
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    onBlur={() => !newProjectName && setIsAddingProject(false)}
                />
            </form>
        )}

        <nav className="space-y-1">
            {projects.map(project => (
                <Droppable key={project.id} droppableId={`project-${project.id}`}>
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="group flex items-center">
                            <button 
                                onClick={() => setActiveFilter(project.id)} 
                                className={navItemClass(project.id, snapshot.isDraggingOver)}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }}></span>
                                    <span className="truncate">{project.name}</span>
                                </div>
                            </button>
                            {/* Hidden placeholder to avoid layout shift when dragging over */}
                            <div className="hidden">{provided.placeholder}</div>
                        </div>
                    )}
                </Droppable>
            ))}
            
            <button 
                onClick={() => setIsAddingProject(true)}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg border border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800/50 hover:text-blue-500 dark:hover:text-blue-400 transition-all flex items-center gap-2 group mt-2"
            >
                <Plus size={14} className="group-hover:scale-110 transition-transform" />
                <span>New Project</span>
            </button>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-slate-800">
         <div className="mb-5 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                        <Trophy size={14} className="text-yellow-500" />
                        <span>Weekly Goal</span>
                     </div>
                     <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {uniqueCompletedCount}/{weeklyGoal}
                     </span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium h-4">
                    {getMotivationalText()}
                </p>

                <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out relative" 
                        style={{ width: `${progressPercentage}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 w-full h-full animate-shimmer" style={{ transform: 'skewX(-20deg)' }}></div>
                    </div>
                </div>
            </div>
         </div>

        <div className="text-xs text-gray-400 text-center">
            Hello, <span className="font-medium text-gray-600 dark:text-gray-300">{user.name}</span>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;