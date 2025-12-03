import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Priority, Project, Task, UserSettings, LogEntry, AppContextType, Section } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { playNotification } from '../utils/sound';

const defaultProjects: Project[] = [
  { 
    id: 'todos', 
    name: 'To-Dos', 
    color: '#3b82f6', 
    icon: '📝',
    description: 'General tasks and daily reminders.' 
  },
  { 
    id: 'shopping', 
    name: 'Shopping', 
    color: '#f59e0b', 
    icon: '🛒',
    description: 'Groceries and wishlists.'
  },
];

const defaultUser: UserSettings = {
  name: '',
  isOnboarded: false,
  theme: 'light',
  enableSound: true,
};

// Dummy Data Generation (Feature Showcase)
const generateDummyTasks = (projectId: string): Task[] => {
  const now = new Date();
  const getDaysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(now.getDate() + days);
    return d.toISOString();
  };

  // If the projectId passed isn't one of our defaults, default to 'todos'
  const targetProject = projectId === 'presentation' ? 'todos' : projectId;

  return [
    {
      id: uuidv4(),
      title: "Welcome to JeetDo! 👋",
      isCompleted: false,
      priority: Priority.HIGH,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "This is a minimalistic to-do app designed to help you focus.\n\n- [x] Clean design\n- [x] Fluid animations\n- [ ] You being productive!",
      order: 0,
      color: '#3b82f6'
    },
    {
      id: uuidv4(),
      title: "Click me to see task details 📝",
      isCompleted: false,
      priority: Priority.MEDIUM,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "# Rich Notes\nYou can add details here using **markdown**.\n\n- create lists\n- add links\n- write thoughts",
      order: 1,
      color: '#f59e0b'
    },
    {
      id: uuidv4(),
      title: "Try marking this task as Important ⭐",
      isCompleted: false,
      priority: Priority.LOW,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "Click the flag icon inside the task detail view, or right here in the list if available.",
      order: 2
    },
    {
      id: uuidv4(),
      title: "Complete a task to see confetti 🎉",
      isCompleted: false,
      priority: Priority.MEDIUM,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "",
      order: 3
    },
    {
      id: uuidv4(),
      title: "Add a deadline to this task 📅",
      isCompleted: false,
      priority: Priority.MEDIUM,
      projectId: targetProject,
      createdAt: Date.now(),
      deadlineDate: getDaysFromNow(2),
      notes: "",
      order: 4,
      color: '#10b981'
    },
    {
      id: uuidv4(),
      title: "Organize tasks into Projects 📁",
      isCompleted: false,
      priority: Priority.LOW,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "Use the sidebar to create new projects like 'Work' or 'Personal'.",
      order: 5
    },
    {
      id: uuidv4(),
      title: "Switch to Dark Mode in Settings 🌙",
      isCompleted: false,
      priority: Priority.LOW,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "",
      order: 6
    },
  ];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [sections, setSections] = useState<Section[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Initialize user state lazily to detect system theme preference
  const [user, setUser] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined') {
        const loadedUser = localStorage.getItem('zentask-user');
        if (loadedUser) {
            return JSON.parse(loadedUser);
        }
        // Fallback to system preference if no user data found
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return { ...defaultUser, theme: 'black' };
        }
    }
    return defaultUser;
  });

  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

  // Load from local storage
  useEffect(() => {
    const loadedTasks = localStorage.getItem('zentask-tasks');
    const loadedProjects = localStorage.getItem('zentask-projects');
    const loadedSections = localStorage.getItem('zentask-sections');
    const loadedLogs = localStorage.getItem('zentask-logs');
    
    // User is loaded via lazy init in useState above

    if (loadedProjects) {
        setProjects(JSON.parse(loadedProjects));
    }

    if (loadedSections) {
        setSections(JSON.parse(loadedSections));
    }

    if (loadedTasks) {
        setTasks(JSON.parse(loadedTasks));
    } else {
        // First Load / Empty State: Inject Dummy Data
        const dummy = generateDummyTasks('todos');
        setTasks(dummy);
        // Also ensure project exists if not loaded
        if (!loadedProjects) {
            setProjects(defaultProjects);
        }
    }

    if (loadedLogs) setLogs(JSON.parse(loadedLogs));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('zentask-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('zentask-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('zentask-sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('zentask-logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('zentask-user', JSON.stringify(user));
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-black');
    
    if (user.theme === 'dark') {
      root.classList.add('dark');
    } else if (user.theme === 'black') {
      root.classList.add('dark', 'theme-black');
    }
  }, [user]);

  // Reminder Check (Simple Polling)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.isCompleted && task.deadlineDate) {
           const deadline = new Date(task.deadlineDate);
           const diff = deadline.getTime() - now.getTime();
           // 30 mins in ms = 30 * 60 * 1000 = 1800000
           if (diff > 0 && diff < 1800000 && diff > 1740000) {
              if (Notification.permission === 'granted') {
                new Notification('Task Reminder', { body: `${task.title} is due in 30 minutes!` });
                playNotification();
              }
           }
        }
      });
    }, 60000); 
    return () => clearInterval(interval);
  }, [tasks]);

  const addLog = (action: LogEntry['action'], taskTitle: string) => {
    const newLog: LogEntry = {
      id: uuidv4(),
      action,
      taskTitle,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const setUserName = (name: string) => {
    setUser(prev => ({ ...prev, name, isOnboarded: true }));
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const setTheme = (theme: 'light' | 'dark' | 'black') => {
    setUser(prev => ({ ...prev, theme }));
  };

  const addTask = (title: string, workingDate?: string, deadlineDate?: string, sectionId?: string): string => {
    const isProjectView = projects.some(p => p.id === activeFilter);
    const targetProjectId = isProjectView ? activeFilter : 'inbox';
    const newId = uuidv4();

    // Calculate next order in the target section
    const relevantTasks = tasks.filter(t => t.projectId === targetProjectId && t.sectionId === sectionId);
    const maxOrder = relevantTasks.length > 0 ? Math.max(...relevantTasks.map(t => t.order)) : -1;

    const newTask: Task = {
      id: newId,
      title,
      isCompleted: false,
      priority: Priority.MEDIUM,
      projectId: targetProjectId,
      sectionId: sectionId,
      createdAt: Date.now(),
      notes: '',
      order: maxOrder + 1,
      workingDate,
      deadlineDate,
      color: '#3b82f6' // Default blue
    };
    setTasks(prev => [...prev, newTask]);
    addLog('create', title);
    return newId;
  };

  const toggleTaskCompletion = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const isNowCompleted = !task.isCompleted;
        setTasks(prev => prev.map(t => t.id === id ? { 
            ...t, 
            isCompleted: isNowCompleted,
            completedAt: isNowCompleted ? Date.now() : undefined 
        } : t));
        addLog(task.isCompleted ? 'uncomplete' : 'complete', task.title);
    }
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        addLog('delete', task.title);
        setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Legacy simple reorder for flat lists (still used in non-section views if needed, though we will move to moveTask)
  const reorderTasks = (startIndex: number, endIndex: number) => {
    const result = [...tasks];
    const [removed] = result.splice(startIndex, 1);
    if (!removed) return;
    result.splice(endIndex, 0, removed);
    const reordered = result.map((t, idx) => ({ ...t, order: idx }));
    setTasks(reordered);
  };

  // New robust mover function for sections and lists
  const moveTask = (taskId: string, targetSectionId: string | undefined, newIndex: number) => {
    setTasks(prev => {
        const taskToMove = prev.find(t => t.id === taskId);
        if (!taskToMove) return prev;

        // Current view tasks (in the same project)
        // We only care about reordering relative to other tasks in the SAME destination context
        // Context = Project + Section
        
        // 1. Remove task from current list
        let newTasks = prev.filter(t => t.id !== taskId);

        // 2. Identify target peers (Tasks in the same project and target section)
        // Note: projectId shouldn't change here usually, unless dragging to sidebar, but this function handles section moves primarily.
        // If we want to change project, we should update task.projectId before calling this or inside this.
        // For now assume Project ID is constant or provided? 
        // Actually, dragging between sections implies same project.
        
        const peers = newTasks.filter(t => 
            t.projectId === taskToMove.projectId && 
            t.sectionId === targetSectionId && 
            !t.isCompleted
        ).sort((a, b) => a.order - b.order);

        // 3. Insert at new index
        peers.splice(newIndex, 0, { ...taskToMove, sectionId: targetSectionId });

        // 4. Re-calculate orders for these peers
        const updatedPeers = peers.map((t, index) => ({ ...t, order: index }));

        // 5. Merge back into the main list
        // Remove old versions of peers from newTasks, then add updatedPeers
        const peerIds = new Set(updatedPeers.map(t => t.id));
        newTasks = newTasks.filter(t => !peerIds.has(t.id));
        
        return [...newTasks, ...updatedPeers];
    });
  };

  const addProject = (name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      icon: '📁',
      description: ''
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    // Also delete sections for this project
    setSections(prev => prev.filter(s => s.projectId !== id));
    // Move tasks to Inbox
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: 'inbox', sectionId: undefined } : t));
    if (activeFilter === id) setActiveFilter('inbox');
  };

  const addSection = (projectId: string, title: string) => {
      const projectSections = sections.filter(s => s.projectId === projectId);
      const maxOrder = projectSections.length > 0 ? Math.max(...projectSections.map(s => s.order)) : -1;
      
      const newSection: Section = {
          id: uuidv4(),
          projectId,
          title,
          order: maxOrder + 1
      };
      setSections(prev => [...prev, newSection]);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
      setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSection = (id: string) => {
      // When deleting a section, move its tasks to undefined section (top of list)
      setTasks(prev => prev.map(t => t.sectionId === id ? { ...t, sectionId: undefined } : t));
      setSections(prev => prev.filter(s => s.id !== id));
  };

  const resetData = () => {
      localStorage.clear();
      window.location.reload();
  }

  return (
    <AppContext.Provider value={{
      tasks, projects, sections, logs, user, activeFilter, priorityFilter,
      setUserName, setTheme, toggleTaskCompletion, addTask, deleteTask,
      updateTask, reorderTasks, moveTask, addProject, updateProject, setActiveFilter, setPriorityFilter,
      deleteProject, addSection, updateSection, deleteSection, resetData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};