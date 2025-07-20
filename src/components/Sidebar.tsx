import { Calendar, Clock, Archive, Plus, Bot } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { id: "today", label: "Today", icon: Calendar, active: true },
  { id: "future", label: "Future", icon: Clock, active: false },
  { id: "archive", label: "Archive", icon: Archive, active: false },
  { id: "ai-chat", label: "AI Assistant", icon: Bot, active: false },
];

export const Sidebar = ({ onItemSelect }: { onItemSelect?: (item: string) => void }) => {
  const [activeItem, setActiveItem] = useState("today");
  
  const handleItemClick = (id: string) => {
    setActiveItem(id);
    onItemSelect?.(id);
  };

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="ai-orb"></div>
          <h1 className="text-xl font-bold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Onyx
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome to your personal AI to-do list. I will help you analyze your daily tasks.
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                activeItem === item.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Add new section */}
        <button className="w-full flex items-center gap-3 px-4 py-3 mt-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 border border-border/50">
          <Plus size={18} />
          <span className="font-medium">Add new</span>
        </button>
      </nav>

      {/* AI Assistant Status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
          <div>
            <p className="text-sm font-medium text-secondary">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Online & Learning</p>
          </div>
        </div>
      </div>
    </div>
  );
};