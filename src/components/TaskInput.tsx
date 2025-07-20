import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";

export const TaskInput = ({ onAddTask }: { onAddTask: (task: string) => void }) => {
  const [task, setTask] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      onAddTask(task.trim());
      setTask("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-4 p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-3 flex-1">
          <Sparkles className="text-primary" size={20} />
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Type new task details here. Onyx will decode..."
            className="terminal-input flex-1 bg-transparent border-0 text-lg focus:ring-0 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!task.trim()}
          className="neon-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus size={20} />
        </button>
      </div>
    </form>
  );
};