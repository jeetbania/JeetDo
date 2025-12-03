import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { Menu } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { playPop } from './utils/sound';

const MainLayout: React.FC = () => {
  const { user, updateTask, moveTask } = useApp();
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

    // Case 1: Reordering within lists/sections or moving between sections
    // Droppable IDs for task lists are formatted as "section-[ID]" or "section-undefined"
    if (source.droppableId.startsWith('section-') && destination.droppableId.startsWith('section-')) {
        const targetSectionIdString = destination.droppableId.replace('section-', '');
        const targetSectionId = targetSectionIdString === 'undefined' ? undefined : targetSectionIdString;
        
        moveTask(draggableId, targetSectionId, destination.index);
        return;
    }

    // Case 2: Dropping onto a Project or Inbox in Sidebar
    if (destination.droppableId.startsWith('project-') || destination.droppableId === 'inbox-droppable') {
        const targetProjectId = destination.droppableId === 'inbox-droppable' 
            ? 'inbox' 
            : destination.droppableId.replace('project-', '');
        
        if (targetProjectId) {
            updateTask(draggableId, { projectId: targetProjectId, sectionId: undefined });
            playPop(); // Feedback sound
        }
    }
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