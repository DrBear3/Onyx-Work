import { useState } from "react";
import { ChevronDown, ChevronRight, Edit3, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  expanded: boolean;
  lastSaved?: string;
}

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'This week',
    content: '- Completed project X\n- Met with team lead\n- Found new optimization',
    expanded: false,
    lastSaved: new Date().toLocaleString()
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Discussed quarterly goals and deliverables for Q4',
    expanded: false,
    lastSaved: new Date().toLocaleString()
  }
];

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleNote = (id: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, expanded: !note.expanded } : note
    ));
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, content } : note
    ));
    setUnsavedChanges(prev => new Set(prev).add(id));
  };

  const updateTitle = (id: string, title: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, title } : note
    ));
    setUnsavedChanges(prev => new Set(prev).add(id));
  };

  const saveNote = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, lastSaved: new Date().toLocaleString() } : note
    ));
    setUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast({
      title: "Note saved",
      description: "Your note has been saved successfully.",
    });
  };

  const addNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      expanded: true,
      lastSaved: undefined
    };
    setNotes([newNote, ...notes]);
    setEditingNote(newNote.id);
    setUnsavedChanges(prev => new Set(prev).add(newNote.id));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    setUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast({
      title: "Note deleted",
      description: "The note has been removed.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Notes
            </h1>
            <p className="text-muted-foreground mt-2">
              Keep track of your thoughts and ideas
            </p>
          </div>
          <Button onClick={addNewNote} className="gap-2">
            <Plus size={16} />
            New Note
          </Button>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note) => {
            const hasUnsavedChanges = unsavedChanges.has(note.id);
            
            return (
              <div key={note.id} className="bg-card border border-border rounded-xl p-6 hover:border-border/80 transition-colors">
                {/* Note header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleNote(note.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {note.expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    
                    {editingNote === note.id ? (
                      <input
                        value={note.title}
                        onChange={(e) => updateTitle(note.id, e.target.value)}
                        onBlur={() => setEditingNote(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingNote(null)}
                        className="text-lg font-semibold bg-transparent border-b border-primary focus:outline-none flex-1"
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors flex-1"
                        onClick={() => setEditingNote(note.id)}
                      >
                        {note.title}
                        {hasUnsavedChanges && <span className="text-destructive ml-2">*</span>}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={() => saveNote(note.id)}
                        className="gap-2"
                      >
                        <Save size={14} />
                        Save
                      </Button>
                    )}
                    
                    <button
                      onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit3 size={16} className="text-muted-foreground hover:text-foreground" />
                    </button>
                    
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive/70 hover:text-destructive transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Last saved info */}
                {note.lastSaved && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Last saved: {note.lastSaved}
                  </p>
                )}

                {/* Note content */}
                {note.expanded && (
                  <div className="mt-4">
                    <textarea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, e.target.value)}
                      placeholder="Start writing your note..."
                      className="w-full p-4 bg-input border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-300 min-h-[200px]"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {notes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No notes yet</p>
              <Button onClick={addNewNote} variant="outline" className="gap-2">
                <Plus size={16} />
                Create your first note
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;