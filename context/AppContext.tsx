import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Priority, Project, Task, UserSettings, LogEntry, AppContextType } from '../types';
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
      order: 0
    },
    {
      id: uuidv4(),
      title: "Click me to see task details 📝",
      isCompleted: false,
      priority: Priority.MEDIUM,
      projectId: targetProject,
      createdAt: Date.now(),
      notes: "# Rich Notes\nYou can add details here using **markdown**.\n\n- create lists\n- add links\n- write thoughts",
      order: 1
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
      order: 4
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
    const loadedLogs = localStorage.getItem('zentask-logs');
    
    // User is loaded via lazy init in useState above

    if (loadedProjects) {
        setProjects(JSON.parse(loadedProjects));
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

  const addTask = (title: string, workingDate?: string, deadlineDate?: string) => {
    const isProjectView = projects.some(p => p.id === activeFilter);
    const targetProjectId = isProjectView ? activeFilter : 'inbox';

    const newTask: Task = {
      id: uuidv4(),
      title,
      isCompleted: false,
      priority: Priority.MEDIUM,
      projectId: targetProjectId,
      createdAt: Date.now(),
      notes: '',
      order: tasks.length,
      workingDate,
      deadlineDate,
    };
    setTasks(prev => [...prev, newTask]);
    addLog('create', title);
  };

  const toggleTaskCompletion = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
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

  const reorderTasks = (startIndex: number, endIndex: number) => {
    const result = [...tasks];
    const [removed] = result.splice(startIndex, 1);
    if (!removed) return;
    result.splice(endIndex, 0, removed);
    const reordered = result.map((t, idx) => ({ ...t, order: idx }));
    setTasks(reordered);
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
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: 'inbox' } : t));
    if (activeFilter === id) setActiveFilter('inbox');
  };

  const resetData = () => {
      localStorage.clear();
      window.location.reload();
  }

  return (
    <AppContext.Provider value={{
      tasks, projects, logs, user, activeFilter, priorityFilter,
      setUserName, setTheme, toggleTaskCompletion, addTask, deleteTask,
      updateTask, reorderTasks, addProject, updateProject, setActiveFilter, setPriorityFilter,
      deleteProject, resetData
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