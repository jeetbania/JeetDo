export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Section {
  id: string;
  projectId: string; // 'inbox' or project UUID
  title: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: Priority;
  projectId: string; // 'inbox' or specific project UUID
  sectionId?: string; // ID of the section this task belongs to
  createdAt: number;
  workingDate?: string; // ISO Date string
  deadlineDate?: string; // ISO Date string
  notes: string;
  order: number;
  repeat?: string; // 'daily', 'weekly', 'monthly', 'yearly'
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface LogEntry {
  id: string;
  action: 'create' | 'complete' | 'uncomplete' | 'delete';
  taskTitle: string;
  timestamp: number;
}

export interface UserSettings {
  name: string;
  isOnboarded: boolean;
  theme: 'light' | 'dark' | 'black';
  enableSound: boolean;
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  sections: Section[];
  logs: LogEntry[];
  user: UserSettings;
  activeFilter: 'inbox' | 'today' | 'upcoming' | 'completed' | string; // string can be projectId
  priorityFilter: Priority | null;
}

export interface AppContextType extends AppState {
  setUserName: (name: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'black') => void;
  toggleTaskCompletion: (id: string) => void;
  addTask: (title: string, workingDate?: string, deadlineDate?: string, sectionId?: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void; // Deprecated for sections? We'll update usage.
  moveTask: (taskId: string, targetSectionId: string | undefined, newIndex: number) => void;
  addProject: (name: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setActiveFilter: (filter: string) => void;
  setPriorityFilter: (priority: Priority | null) => void;
  deleteProject: (id: string) => void;
  addSection: (projectId: string, title: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  resetData: () => void;
}