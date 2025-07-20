import { useState } from "react";
import { X, Plus, Calendar, Clock, Tag, MessageSquare, Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
}

export const TaskDetailPanel = ({ task, onClose, onUpdateTask }: TaskDetailPanelProps) => {
  const [newSubtask, setNewSubtask] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiSuggestions] = useState([
    "Break this down into smaller steps",
    "Set a deadline for this task",
    "Add relevant tags",
    "Estimate time needed"
  ]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const newTask = {
      ...task,
      subTasks: [
        ...task.subTasks,
        {
          id: Date.now().toString(),
          title: newSubtask,
          completed: false
        }
      ]
    };
    
    onUpdateTask(newTask);
    setNewSubtask("");
  };

  const toggleSubtask = (subtaskId: string) => {
    const newTask = {
      ...task,
      subTasks: task.subTasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    };
    onUpdateTask(newTask);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addSubtask();
    }
  };

  return (
    <div className="w-96 bg-card border-l border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Task Details</h2>
            <h3 className="text-sm font-medium text-muted-foreground">{task.title}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Task Info */}
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Due:</span>
            <span>{task.dueDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Estimated:</span>
            <span>{task.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Tags:</span>
            <div className="flex gap-1">
              {task.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-secondary/20 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      <div className="flex-1 p-4 space-y-4">
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            Sub tasks
            <span className="text-xs text-muted-foreground">
              ({task.subTasks.filter(st => st.completed).length}/{task.subTasks.length})
            </span>
          </h4>
          
          <div className="space-y-2 mb-4">
            {task.subTasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                <button
                  onClick={() => toggleSubtask(subtask.id)}
                  className={`w-4 h-4 rounded border transition-all ${
                    subtask.completed
                      ? 'bg-primary border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {subtask.completed && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>

          {/* Add new subtask */}
          <div className="flex gap-2">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a subtask..."
              className="flex-1 p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            />
            <Button size="sm" onClick={addSubtask} disabled={!newSubtask.trim()}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="border-t border-border pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Bot size={16} className="text-primary" />
            AI Assistant
          </h4>
          
          {/* AI Suggestions */}
          <div className="space-y-2 mb-4">
            {aiSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left p-2 text-sm bg-secondary/10 hover:bg-secondary/20 rounded transition-colors border border-secondary/20"
                onClick={() => setAiMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* AI Chat Input */}
          <div className="space-y-2">
            <textarea
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="Ask AI about this task..."
              className="w-full p-2 text-sm bg-input border border-border rounded resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              rows={2}
            />
            <Button size="sm" className="w-full gap-2" disabled={!aiMessage.trim()}>
              <Send size={14} />
              Send to AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};