import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Pin, 
  PinOff, 
  Search, 
  Sparkles, 
  Calendar,
  Send,
  BookOpen,
  Tag,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ScratchpadNote {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Tasks' | 'Research' | 'Code' | 'Ideas';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

const STORAGE_KEY = 'skew_agi_scratchpad_notes';

const INITIAL_NOTES: ScratchpadNote[] = [
  {
    id: 'NOTE-001',
    title: 'Autonomous System Objectives',
    content: '1. Self-contained AGI cognitive pipeline with zero external app dependencies.\n2. Built-in Python sandbox and real-time AST validation.\n3. Continuous hands-free duplex voice with barge-in detection.',
    category: 'Research',
    isPinned: true,
    createdAt: new Date().toLocaleDateString(),
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'NOTE-002',
    title: 'Daily Action Items',
    content: '- Review Tri-Agent consensus safety metrics.\n- Calibrate Android touch actuator Gaussian jitter variance.\n- Monitor SKEW-DEMON thermal alerts.',
    category: 'Tasks',
    isPinned: false,
    createdAt: new Date().toLocaleDateString(),
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({
  isOpen,
  onClose,
  onSendToChat
}) => {
  const [notes, setNotes] = useState<ScratchpadNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Scratchpad storage error:', e);
    }
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to sync scratchpad notes', e);
    }
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const handleCreateNote = () => {
    const newNote: ScratchpadNote = {
      id: `NOTE-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      category: 'General',
      isPinned: false,
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateNote = (id: string, updates: Partial<ScratchpadNote>) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          ...updates,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return n;
    }));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => {
      const filtered = prev.filter(n => n.id !== id);
      if (activeNoteId === id && filtered.length > 0) {
        setActiveNoteId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleTogglePin = (id: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, isPinned: !n.isPinned };
      }
      return n;
    }));
  };

  const handleCopyContent = (note: ScratchpadNote) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl h-[85vh] max-h-[750px] bg-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-xs">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AGI Working Scratchpad & Notes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-mono">
                  100% Native &bull; Offline Persistent
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Self-contained workspace memory. Zero external apps or cloud accounts required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNote}
              className="px-3 py-1.5 rounded-xl bg-[#00F5A0] hover:bg-[#00e092] text-slate-950 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#00F5A0]/20"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950" />
              <span>New Note</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Two-Column Split (Sidebar List + Main Editor) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Note List & Search (35%) */}
          <div className="w-72 sm:w-80 border-r border-white/10 flex flex-col bg-black/40">
            {/* Search Input */}
            <div className="p-3 border-b border-white/5 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes & tasks..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10.5px]">
                {['All', 'General', 'Tasks', 'Research', 'Code', 'Ideas'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-sans">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No notes found in this view.
                </div>
              ) : (
                filteredNotes.map(n => {
                  const isSelected = activeNote?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setActiveNoteId(n.id)}
                      className={`group p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-white/10 border-cyan-500/40 shadow-sm' 
                          : 'bg-white/5 hover:bg-white/[0.08] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                          {n.title || 'Untitled Note'}
                        </span>
                        <div className="flex items-center gap-1">
                          {n.isPinned && (
                            <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400 font-mono">
                            {n.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {n.content || '(Empty content...)'}
                      </p>
                      <div className="text-[9px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                        <span>{n.updatedAt}</span>
                        <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Editor: Active Note (65%) */}
          {activeNote ? (
            <div className="flex-1 flex flex-col bg-slate-950/70">
              {/* Note Action Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <select
                    value={activeNote.category}
                    onChange={(e) => handleUpdateNote(activeNote.id, { category: e.target.value as any })}
                    className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-cyan-300 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Tasks">Tasks</option>
                    <option value="Research">Research</option>
                    <option value="Code">Code</option>
                    <option value="Ideas">Ideas</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleTogglePin(activeNote.id)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      activeNote.isPinned
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                    title={activeNote.isPinned ? 'Unpin Note' : 'Pin to top'}
                  >
                    {activeNote.isPinned ? <Pin className="w-3.5 h-3.5 fill-amber-300" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onSendToChat(`Analyze and expand on this note: "${activeNote.title}"\n\n${activeNote.content}`);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Send this note to SKEW assistant to process or expand"
                    >
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>Ask SKEW</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyContent(activeNote)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Copy note to clipboard"
                  >
                    {copiedId === activeNote.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="px-6 pt-4">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Note Title..."
                  className="w-full text-lg sm:text-xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-slate-600 font-sans"
                />
              </div>

              {/* Content Textarea */}
              <div className="flex-1 px-6 py-4">
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateNote(activeNote.id, { content: e.target.value })}
                  placeholder="Type your notes, ideas, code snippets, or task list here... All entries persist locally."
                  className="w-full h-full bg-transparent border-none focus:outline-none text-slate-200 text-sm leading-relaxed resize-none font-sans placeholder-slate-600"
                />
              </div>

              {/* Status Footer */}
              <div className="px-6 py-2 border-t border-white/5 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Updated: {activeNote.updatedAt} &bull; Created: {activeNote.createdAt}</span>
                <span className="text-emerald-400">Local SQLite / Storage Sync: Active</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-600" />
              <div className="text-sm font-semibold text-slate-300">No Note Selected</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a note from the sidebar or create a new note to start typing.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
