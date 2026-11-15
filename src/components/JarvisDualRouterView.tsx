import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Search, 
  Database, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Globe, 
  Terminal, 
  Activity,
  X,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  CloudSun,
  Newspaper,
  BrainCircuit,
  Zap,
  ExternalLink
} from 'lucide-react';
import { StrictJarvisInteractionJson, JarvisSearchResultItem } from '../types';

interface JarvisDualRouterViewProps {
  onRunQueryInChat?: (query: string) => void;
}

export const JarvisDualRouterView: React.FC<JarvisDualRouterViewProps> = ({ onRunQueryInChat }) => {
  const [queryInput, setQueryInput] = useState('What is the current NVIDIA NVDA stock price and market cap today?');
  const [isLoading, setIsLoading] = useState(false);
  const [routerResult, setRouterResult] = useState<StrictJarvisInteractionJson | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [latencyMs, setLatencyMs] = useState(135);
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'JSON' | 'SOURCES'>('JSON');

  // Quick Action Chips
  const quickActions = [
    { label: 'Stock Quote', icon: TrendingUp, query: 'What is the current NVIDIA NVDA stock price and market cap today?' },
    { label: 'Weather', icon: CloudSun, query: 'Check live weather forecast and temperature in Tokyo right now' },
    { label: 'Tech News', icon: Newspaper, query: 'Search live news for LangGraph autonomous AI agent benchmarks' },
    { label: 'Memory Recall', icon: BrainCircuit, query: 'Recall my user profile, tech stack preferences and project specifications' }
  ];

  useEffect(() => {
    handleEvaluateRoute('What is the current NVIDIA NVDA stock price and market cap today?');
  }, []);

  const handleEvaluateRoute = async (textToRoute?: string) => {
    const q = textToRoute || queryInput;
    if (!q.trim()) return;

    setIsLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/jarvis/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data: StrictJarvisInteractionJson = await res.json();
      setRouterResult(data);
    } catch (e) {
      console.error('Route evaluation error:', e);
    } finally {
      setLatencyMs(Math.round(performance.now() - start) || 135);
      setIsLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (!routerResult) return;
    navigator.clipboard.writeText(JSON.stringify(routerResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const isRealtime = routerResult?.mode_selected === 'REALTIME';
  const confidenceScore = isRealtime ? 99 : (routerResult ? 96 : 98);

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-start p-2 sm:p-4 text-slate-200 font-sans">
      {/* Max 480px Centered Container */}
      <div className="w-full max-w-[480px] space-y-4">
        
        {/* A. Sleek Header Bar */}
        <div className="bg-[#08090D]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                SKEW <span className="text-slate-500">//</span> <span className="text-cyan-400">Cognitive Router</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status: Online */}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
            {/* Active Engine */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-slate-400">
              Auto-Switch
            </span>
          </div>
        </div>

        {/* B. Streamlined Query & Intent Section */}
        <div className="bg-[#08090D]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
          {/* Modern Unified Glassmorphic Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEvaluateRoute()}
              placeholder="Ask anything or test cognitive routing..."
              className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/60 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {queryInput && (
              <button
                onClick={() => setQueryInput('')}
                className="absolute right-2.5 p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 4 Compact Quick-Action Horizontal Micro-Pills */}
          <div className="grid grid-cols-2 gap-1.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isSelected = queryInput === action.query;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    setQueryInput(action.query);
                    handleEvaluateRoute(action.query);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all text-left cursor-pointer truncate ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Single High-Contrast Gradient Route Button */}
          <button
            onClick={() => handleEvaluateRoute()}
            disabled={isLoading || !queryInput.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-500 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-semibold font-mono tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'fill-current'}`} />
            <span>{isLoading ? 'Routing & Synthesizing...' : '⚡ Route & Execute'}</span>
          </button>
        </div>

        {/* C. Active Decision & Response Card (Central Focus) */}
        {routerResult && (
          <div className="bg-[#08090D]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Top Bar: Mode Indicator Pill & Category */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isRealtime
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                {isRealtime ? <Globe className="w-3 h-3" /> : <BrainCircuit className="w-3 h-3" />}
                {isRealtime ? 'REALTIME WEB' : 'INTERNAL MEMORY'}
              </span>

              <span className="text-[11px] font-mono text-slate-400">
                {routerResult.query_intent_category}
              </span>
            </div>

            {/* Synthesized Response Container */}
            <div className="text-xs text-slate-200 leading-relaxed font-sans bg-black/40 border border-white/5 rounded-xl p-3.5">
              <p className="whitespace-pre-wrap">{routerResult.response_text}</p>
            </div>

            {/* Source & Latency Micro-Footer */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
              <span className="truncate pr-2">
                Source: <strong className="text-slate-200">{isRealtime ? 'Tavily / Google Search' : 'Vector Memory Store'}</strong>
              </span>
              <span className="shrink-0 text-[10px]">
                Latency: <strong className="text-cyan-400">{latencyMs}ms</strong> • Conf: <strong className="text-emerald-400">{confidenceScore}%</strong>
              </span>
            </div>
          </div>
        )}

        {/* D. Collapsible "Developer Inspector" Drawer */}
        {routerResult && (
          <div className="space-y-2">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                {showInspector ? '▼ Hide Telemetry & JSON Payload' : '▶ View Telemetry & JSON Payload'}
              </span>
              <span className="text-[10px] text-slate-500">
                {showInspector ? 'Expanded' : 'Collapsed'}
              </span>
            </button>

            {showInspector && (
              <div className="bg-[#08090D] border border-white/10 rounded-2xl p-3.5 shadow-xl space-y-2.5">
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setInspectorTab('JSON')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                        inspectorTab === 'JSON'
                          ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      JSON Payload
                    </button>
                    <button
                      onClick={() => setInspectorTab('SOURCES')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                        inspectorTab === 'SOURCES'
                          ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      Sources & Chunks ({routerResult.search_results?.length || 0})
                    </button>
                  </div>

                  <button
                    onClick={handleCopyJSON}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Tab Content */}
                {inspectorTab === 'JSON' ? (
                  <pre className="p-2.5 bg-black/80 text-emerald-400 text-[10px] font-mono rounded-xl overflow-x-auto max-h-48 border border-white/5 leading-tight">
                    <code>{JSON.stringify(routerResult, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {routerResult.search_results && routerResult.search_results.length > 0 ? (
                      routerResult.search_results.map((src, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-black/50 border border-white/5 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-300 font-medium truncate">
                            <span className="truncate text-cyan-300">{src.title}</span>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">{src.domain}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">{src.snippet}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[10px] font-mono text-slate-500">
                        No external web sources queried for this internal memory execution.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
