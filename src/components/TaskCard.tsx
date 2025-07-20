import { ChevronDown, ChevronRight, Clock, Tag, Calendar, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: () => void;
}

export const TaskCard = ({ task, onToggle, onToggleSubtask, onDelete, onSelect }: TaskCardProps) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const getTagColor = (tag: string) => {
    const colors = {
      'Reports': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Leadership': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'High Priority': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Personal': 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div 
      className={`glow-card group cursor-pointer ${task.completed ? 'opacity-60' : ''}`} 
      onClick={onSelect}
    >
      <div className="grid grid-cols-5 gap-4 items-center">
        {/* Task Content */}
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            className={`w-5 h-5 rounded border-2 transition-all duration-300 flex items-center justify-center ${
              task.completed
                ? 'bg-primary border-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {task.completed && (
              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Title and subtasks indicator */}
          <div className="flex items-center gap-2">
            <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </h3>
            {task.subTasks.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Est time */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock size={14} />
          <span>{task.estimatedTime}</span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-1 rounded-full text-xs border ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Due date */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar size={14} />
          <span>{task.dueDate}</span>
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(task.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="p-1 hover:bg-muted rounded"
          >
            <MoreHorizontal size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};