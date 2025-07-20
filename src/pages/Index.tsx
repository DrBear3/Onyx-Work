import { useState } from "react";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { AIChat } from "@/components/AIChat";
import { AISuggestions } from "@/components/AISuggestions";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime: string;
  tags: string[];
  dueDate: string;
  subTasks: SubTask[];
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Write weekly report to Adam',
    completed: false,
    estimatedTime: 'Est. 2 hrs',
    tags: ['Reports', 'Leadership'],
    dueDate: 'Monday 3:00PM',
    subTasks: [
      { id: '1-1', title: 'Follow up with design on marketing site', completed: false },
      { id: '1-2', title: 'Get analytics report from Steve', completed: true }
    ]
  },
  {
    id: '2',
    title: 'Prepare for team standup',
    completed: false,
    estimatedTime: 'Est. 30 min',
    tags: ['Leadership'],
    dueDate: '12.14.25 2:00PM',
    subTasks: []
  },
  {
    id: '3',
    title: 'Review Q4 objectives',
    completed: true,
    estimatedTime: 'Est. 1 hr',
    tags: ['High Priority'],
    dueDate: '12.14.25 5:00PM',
    subTasks: []
  }
];

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeView, setActiveView] = useState("today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      estimatedTime: 'Est. 1 hr',
      tags: ['Personal'],
      dueDate: 'Today',
      subTasks: []
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId 
        ? {
            ...task,
            subTasks: task.subTasks.map(subtask =>
              subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
            )
          }
        : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleSidebarSelect = (item: string) => {
    setActiveView(item);
  };

  const renderMainContent = () => {
    if (activeView === "ai-chat") {
      return (
        <div className="flex-1 flex justify-center items-center">
          <AIChat />
        </div>
      );
    }

    return (
      <div className="flex-1 p-6 space-y-6">
        {/* Task Input */}
        {/* Task Tabs */}
        <div className="flex gap-6 border-b border-border">
          <button className="pb-3 px-1 border-b-2 border-primary text-primary font-medium">
            Tasks
          </button>
          <button className="pb-3 px-1 text-muted-foreground hover:text-foreground transition-colors">
            Archive
          </button>
        </div>

        {/* Task List Header */}
        <div className="grid grid-cols-5 gap-4 text-sm text-muted-foreground font-medium mb-4">
          <div>Task</div>
          <div>Est. time</div>
          <div>Tags</div>
          <div>Due Date</div>
          <div></div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggle={toggleTask}
              onToggleSubtask={toggleSubtask}
              onDelete={deleteTask}
              onSelect={() => setSelectedTask(task)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar onItemSelect={handleSidebarSelect} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Content Area: Main and Sidebar aligned at top */}
        <div className="flex-1 flex flex-col lg:flex-row w-full">
          {/* Main Content (left) */}
          <div className="flex-1 min-w-0 px-4 sm:px-8 md:px-12 lg:px-16 max-w-4xl">
            <div className="py-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg mb-2">Benton's Tasks</h2>
              <p className="text-sm text-muted-foreground mb-6">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <div className="max-w-2xl"><TaskInput onAddTask={addTask} /></div>
            </div>
            {renderMainContent()}
          </div>

          {/* Right Sidebar: Suggestions */}
          <div className="w-full lg:w-[350px] flex-shrink-0 lg:ml-6 flex flex-col items-start pt-12">
            {/* AI Suggestions - only show when not in AI chat mode */}
            {activeView !== "ai-chat" && !selectedTask && <AISuggestions onAddSuggestion={addTask} />}
            
            {/* Task Detail Panel */}
            {selectedTask && (
              <TaskDetailPanel 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)}
                onUpdateTask={updateTask}
              />
            )}
          </div>
        </div>
      </div>

      {/* Removed Floating Action Button */}
    </div>
  );
};

export default Index;
