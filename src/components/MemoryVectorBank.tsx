import React, { useState } from 'react';
import { 
  Database, 
  Tag, 
  Clock, 
  Plus, 
  BrainCircuit, 
  Sparkles, 
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { EpisodicMemoryItem } from '../types';

interface MemoryVectorBankProps {
  memories: EpisodicMemoryItem[];
  onAddMemory: (content: string, trigger: string, tags: string[]) => void;
}

export const MemoryVectorBank: React.FC<MemoryVectorBankProps> = ({
  memories,
  onAddMemory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTrigger, setNewTrigger] = useState('SCHEDULE_DAILY_0300');
  const [newTags, setNewTags] = useState('AGENTIC, KERNEL, ADAPTIVE');

  const filtered = memories.filter(m => 
    m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const tagList = newTags.split(',').map(t => t.trim()).filter(Boolean);
    onAddMemory(newContent.trim(), newTrigger.trim(), tagList);
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
              LONG-TERM EPISODIC MEMORY &amp; VECTOR STORE
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Continuous Semantic Persistence &bull; Vector Embeddings &bull; Proactive Scheduled Triggers
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Cancel' : 'Write Memory'}</span>
        </button>
      </div>

      {/* Add Memory Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
          <div className="font-bold text-cyan-300">Commit New Episodic Vector:</div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Describe episodic observation, strategy convergence, or long-term system rule..."
            rows={2}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Proactive Schedule Trigger:</label>
              <input
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                placeholder="e.g. EVENT_DAILY_SYNC"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Semantic Tags (comma-separated):</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                placeholder="e.g. MEMORY, OS, STATE"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Commit to Vector Store
          </button>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter memories by vector keyword, tags, or state..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Memories List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {filtered.map((mem) => (
          <div
            key={mem.id}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 p-3 rounded-lg font-mono text-xs space-y-2 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400">{mem.id}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                  State: {mem.source_state}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(mem.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              {mem.content}
            </p>

            {/* Vector Dimensions Visualizer */}
            {mem.vector_preview && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Normalized Embedding Vector (8-Dim):</span>
                  <span>cos_sim: 0.984</span>
                </div>
                <div className="grid grid-cols-8 gap-1 h-2">
                  {mem.vector_preview.map((val, idx) => {
                    const normalizedHeight = Math.min(100, Math.max(15, Math.abs(val) * 100));
                    return (
                      <div
                        key={idx}
                        title={`Dim ${idx}: ${val}`}
                        className="h-full bg-slate-800 rounded-xs overflow-hidden"
                      >
                        <div
                          className={`h-full ${val >= 0 ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                          style={{ width: `${normalizedHeight}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags & Proactive Trigger */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-900 text-[10px]">
              <div className="flex items-center gap-1 flex-wrap">
                {mem.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-0.5 bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
              {mem.schedule_trigger && (
                <div className="text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {mem.schedule_trigger}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
