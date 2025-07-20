import { Clock, Plus, Sparkles, TrendingUp } from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  type: 'task' | 'reminder' | 'insight';
  timestamp: string;
  confidence: number;
}

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    text: 'Go on a run',
    type: 'task',
    timestamp: '12:14:25',
    confidence: 95
  },
  {
    id: '2',
    text: 'Finish pleasure reading book',
    type: 'task',
    timestamp: '12:14:25',
    confidence: 88
  },
  {
    id: '3',
    text: 'Call two family members',
    type: 'reminder',
    timestamp: '12:14:25',
    confidence: 92
  },
  {
    id: '4',
    text: 'Review quarterly goals',
    type: 'insight',
    timestamp: '12:15:30',
    confidence: 85
  }
];

export const AISuggestions = ({ onAddSuggestion }: { onAddSuggestion: (text: string) => void }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Clock size={14} className="text-secondary" />;
      case 'insight':
        return <TrendingUp size={14} className="text-green-400" />;
      default:
        return <Sparkles size={14} className="text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'Reminder';
      case 'insight':
        return 'Insight';
      default:
        return 'Task';
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-primary" size={20} />
          <h2 className="text-lg font-semibold">Suggestions</h2>
        </div>
        <p className="text-sm text-muted-foreground">Click on text to edit</p>
      </div>

      {/* AI Status */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 text-sm">
          <div className="ai-orb"></div>
          <span className="text-muted-foreground">Why are these recommended?</span>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {mockSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="ai-suggestion group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getIcon(suggestion.type)}
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {getTypeLabel(suggestion.type)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddSuggestion(suggestion.text)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                >
                  <Plus size={12} className="text-primary" />
                </button>
              </div>
            </div>
            
            <p className="text-sm font-medium text-foreground mb-2 cursor-pointer hover:text-primary transition-colors">
              {suggestion.text}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={10} />
                {suggestion.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Learning Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-full">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-xs text-secondary font-medium">AI is learning your patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
};