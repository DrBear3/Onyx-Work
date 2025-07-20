import { Bell, Settings } from "lucide-react";

const getToday = () => {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const Header = () => (
  <header className="w-full flex items-center justify-between px-8 py-4 bg-background/70 backdrop-blur-md shadow-lg border-b border-border">
    {/* Left: Onyx orb and name */}
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg animate-pulse" />
      <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">Onyx</span>
    </div>
    {/* Center: Date */}
    <div className="text-base font-medium text-muted-foreground select-none">
      {getToday()}
    </div>
    {/* Right: Icons and avatar */}
    <div className="flex items-center gap-4">
      <button className="p-2 rounded-full hover:bg-muted transition-colors">
        <Bell size={20} />
      </button>
      <button className="p-2 rounded-full hover:bg-muted transition-colors">
        <Settings size={20} />
      </button>
      <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center font-bold text-white shadow-md cursor-pointer">
        B
      </div>
    </div>
  </header>
);