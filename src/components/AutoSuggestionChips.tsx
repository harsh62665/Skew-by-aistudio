import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  CheckCircle2, 
  Terminal, 
  Edit3, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AutoSuggestionChip } from '../types';

interface AutoSuggestionChipsProps {
  suggestions: AutoSuggestionChip[];
  isLoading: boolean;
  isIdle: boolean;
  overallTopic?: string;
  onlineSearchSummary?: string;
  onSelectPrompt: (prompt: string) => void;
  onInsertPrompt: (prompt: string) => void;
  onRefresh: () => void;
}

export const AutoSuggestionChips: React.FC<AutoSuggestionChipsProps> = ({
  suggestions,
  isLoading,
  isIdle,
  overallTopic,
  onlineSearchSummary,
  onSelectPrompt,
  onInsertPrompt,
  onRefresh
}) => {
  const [expandedSnippetId, setExpandedSnippetId] = useState<string | null>(null);

  // Render only when system is IDLE
  if (!isIdle || !suggestions || suggestions.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ONLINE_SEARCH':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'EXECUTE':
        return <Terminal className="w-3.5 h-3.5 text-[#00F5A0]" />;
      case 'DEEPEN':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'ONLINE_SEARCH':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
      case 'EXECUTE':
        return 'text-[#00F5A0] bg-emerald-950/40 border-emerald-500/30';
      case 'DEEPEN':
        return 'text-amber-300 bg-amber-950/40 border-amber-500/30';
      default:
        return 'text-slate-300 bg-white/5 border-white/10';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        id="auto-suggestion-engine-container"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mb-2.5 w-full select-none"
      >
        {/* Header Bar: Google Search Grounding Status + Refresh */}
        <div className="flex items-center justify-between px-2 mb-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-medium">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Google Search Online Check</span>
            </div>
            {overallTopic && (
              <span className="hidden sm:inline-block text-[10px] text-slate-400 max-w-[200px] truncate border-l border-white/10 pl-1.5">
                Topic: {overallTopic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onlineSearchSummary && (
              <span className="hidden md:inline-block text-[10px] text-slate-400 truncate max-w-[280px]">
                {onlineSearchSummary}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh online auto-suggestions"
              className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="text-[10px] font-mono hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 3 Follow-up Prompt Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {suggestions.slice(0, 3).map((chip, index) => {
            const isSnippetOpen = expandedSnippetId === chip.id;

            return (
              <div
                key={chip.id || index}
                className="group relative flex flex-col justify-between rounded-xl bg-slate-900/85 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/95 transition-all shadow-lg hover:shadow-cyan-950/20 p-2.5"
              >
                {/* Top Row: Category icon & Label + Action icons */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div 
                    onClick={() => onSelectPrompt(chip.prompt)}
                    className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
                  >
                    <span className="shrink-0 p-1 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                      {getCategoryIcon(chip.category)}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                      {chip.label}
                    </span>
                  </div>

                  {/* Actions: Insert text into dock vs Send immediately */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInsertPrompt(chip.prompt);
                      }}
                      title="Insert text into command dock"
                      className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPrompt(chip.prompt)}
                      title="Send prompt directly"
                      className="p-1 rounded-md hover:bg-[#00F5A0]/20 text-slate-400 hover:text-[#00F5A0] transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Preview Snippet (Click to send) */}
                <p 
                  onClick={() => onSelectPrompt(chip.prompt)}
                  className="text-[11px] text-slate-400 hover:text-slate-300 line-clamp-2 leading-relaxed cursor-pointer font-sans mb-2"
                >
                  {chip.prompt}
                </p>

                {/* Bottom Row: Google Search online check badge & verified snippet trigger */}
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded-md font-mono border text-[9px] flex items-center gap-1 ${getCategoryBadgeClass(chip.category)}`}>
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    <span>Online Checked</span>
                  </span>

                  {chip.onlineCheckSnippet && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSnippetId(isSnippetOpen ? null : chip.id);
                      }}
                      className="text-slate-500 hover:text-cyan-300 transition-colors flex items-center gap-0.5 cursor-pointer font-mono"
                    >
                      <span>Web fact</span>
                      {isSnippetOpen ? (
                        <ChevronUp className="w-2.5 h-2.5" />
                      ) : (
                        <ChevronDown className="w-2.5 h-2.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expandable Online Check Fact Details */}
                {isSnippetOpen && chip.onlineCheckSnippet && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 p-2 rounded-lg bg-slate-950/90 border border-cyan-500/20 text-[10px] text-slate-300 font-mono space-y-1"
                  >
                    <div className="flex items-center gap-1 text-cyan-400">
                      <Search className="w-2.5 h-2.5" />
                      <span className="font-semibold">Query Checked:</span>
                      <span className="truncate">{chip.searchQueryUsed || chip.label}</span>
                    </div>
                    <div className="text-slate-400 leading-tight">
                      {chip.onlineCheckSnippet}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
