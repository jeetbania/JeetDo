import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { Menu } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { playPop } from './utils/sound';

const MainLayout: React.FC = () => {
  const { user, tasks, activeFilter, projects, reorderTasks, updateTask } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (filter change) on mobile
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(false); 
        }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Case 1: Reordering within the list
    if (source.droppableId === 'tasks-list' && destination.droppableId === 'tasks-list') {
        // Find indices in the global list
        // Note: This naive index implementation assumes the filtered view matches the source indices passed by dnd.
        // For strict correctness with filters, we would find the task object and re-insert it.
        // However, standard dnd implementation usually requires managing the sorted list.
        // Here we will use the index from the filtered list in TaskList to reorder global tasks is tricky.
        // A simplified approach for this snippet: We let TaskList handle reordering internally if possible, 
        // OR we map the filtered indices back to global indices.
        
        // Since we lifted state, we need to replicate the filter logic or pass the reorder responsibility back.
        // To simplify for this specific request: We will assume reordering happens via the context method which expects global indices.
        // See TaskList.tsx implementation where we calculate global indices.
        
        // Actually, to avoid complexity here, we can pass a handler down to TaskList or handle it here if we reconstruct the list.
        // BETTER APPROACH: Only handle "Move to Project" here. Reordering within 'tasks-list' can be ignored here 
        // and handled in TaskList if we didn't remove DragDropContext there? 
        // No, DragDropContext must be top level. 
        
        // Let's implement global index finding:
        const currentList = getFilteredTasks();
        const sourceTask = currentList[source.index];
        const destTask = currentList[destination.index];
        
        if (sourceTask && destTask) {
             const globalSourceIndex = tasks.findIndex(t => t.id === sourceTask.id);
             const globalDestIndex = tasks.findIndex(t => t.id === destTask.id);
             reorderTasks(globalSourceIndex, globalDestIndex);
        }
        return;
    }

    // Case 2: Dropping onto a Project or Inbox in Sidebar
    if (destination.droppableId.startsWith('project-') || destination.droppableId === 'inbox-droppable') {
        const targetProjectId = destination.droppableId === 'inbox-droppable' 
            ? 'inbox' 
            : destination.droppableId.replace('project-', '');
        
        if (targetProjectId) {
            updateTask(draggableId, { projectId: targetProjectId });
            playPop(); // Feedback sound
        }
    }
  };

  // Helper to reconstruct current view for index mapping
  const getFilteredTasks = () => {
      let result = tasks;
      if (activeFilter === 'inbox') result = result.filter(t => !t.isCompleted);
      else if (activeFilter === 'today') result = result.filter(t => !t.isCompleted && t.deadlineDate && new Date(t.deadlineDate).toDateString() === new Date().toDateString());
      else if (activeFilter === 'upcoming') result = result.filter(t => !t.isCompleted && t.deadlineDate && new Date(t.deadlineDate) > new Date());
      else if (activeFilter === 'completed') result = [];
      else result = result.filter(t => !t.isCompleted && t.projectId === activeFilter);
      return result.sort((a, b) => a.order - b.order);
  };

  if (!user.isOnboarded) {
    return <Onboarding />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-white dark:bg-slate-900 transition-colors overflow-hidden">
        <Sidebar isOpen={sidebarOpen} toggleOpen={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 flex flex-col h-full min-w-0 relative">
          <div className="md:hidden p-4 flex items-center border-b border-gray-100 dark:border-slate-800">
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
                 <Menu size={24} />
             </button>
             <span className="ml-2 font-semibold text-gray-800 dark:text-white">JeetDo</span>
          </div>
          <TaskList />
        </main>
      </div>
    </DragDropContext>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
       <MainLayout />
    </AppProvider>
  );
};

export default App;