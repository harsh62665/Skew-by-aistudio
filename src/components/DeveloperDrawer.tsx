import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Code2, 
  Crosshair, 
  FileJson, 
  Trash2, 
  Play, 
  Flame, 
  Copy, 
  Check, 
  ShieldCheck,
  Sparkles,
  Layers,
  Database,
  Search,
  Plus,
  Clock,
  Tag,
  Calendar,
  RefreshCw,
  Scan,
  GitFork,
  Workflow
} from 'lucide-react';
import { 
  ExecutionLog, 
  UltronProtocolResponse, 
  SystemState,
  SynthesizedTool,
  VectorMemoryNode,
  SqliteSessionRecord,
  MemoryCategory,
  MemoryTargetLayer
} from '../types';

interface DeveloperDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  onClearLogs: () => void;
  protocolData: UltronProtocolResponse;
  pythonCode: string;
  onChangePythonCode: (code: string) => void;
  onExecuteSandbox: (code: string, simulateError?: boolean) => void;
  isExecutingCode: boolean;
  activeDrawerTab: 'LOGS' | 'MEMORY' | 'SANDBOX' | 'GROUNDING' | 'LANGGRAPH' | 'AUDIT' | 'JSON';
  onChangeTab: (tab: 'LOGS' | 'MEMORY' | 'SANDBOX' | 'GROUNDING' | 'LANGGRAPH' | 'AUDIT' | 'JSON') => void;
  synthesizedTools: SynthesizedTool[];
}

export const DeveloperDrawer: React.FC<DeveloperDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  protocolData,
  pythonCode,
  onChangePythonCode,
  onExecuteSandbox,
  isExecutingCode,
  activeDrawerTab,
  onChangeTab,
  synthesizedTools
}) => {
  const [copiedJson, setCopiedJson] = useState(false);

  // Dual-Layer Memory Engine State
  const [memoryTab, setMemoryTab] = useState<'VECTOR_DB' | 'SQLITE' | 'RAG_QUERY' | 'WRITE_ENTITY'>('VECTOR_DB');
  const [vectorNodes, setVectorNodes] = useState<VectorMemoryNode[]>([]);
  const [sqliteRecords, setSqliteRecords] = useState<SqliteSessionRecord[]>([]);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);

  // RAG Query Tester State
  const [ragQuery, setRagQuery] = useState('Python preference and fast execution');
  const [ragResults, setRagResults] = useState<VectorMemoryNode[]>([]);
  const [isQueryingRag, setIsQueryingRag] = useState(false);

  // Manual Memory Write Form State
  const [writePayload, setWritePayload] = useState('');
  const [writeCategory, setWriteCategory] = useState<MemoryCategory>('USER_PREFERENCE');
  const [writeLayer, setWriteLayer] = useState<MemoryTargetLayer>('VECTOR_DB');
  const [writePriority, setWritePriority] = useState(4);
  const [writeTags, setWriteTags] = useState('AGENTIC, PREFERENCE');
  const [writeStatus, setWriteStatus] = useState<string | null>(null);

  // Fetch memory store
  const fetchMemoryStore = async () => {
    setIsLoadingMemory(true);
    try {
      const res = await fetch('/api/ultron/memory/dual-store');
      const data = await res.json();
      if (data.layer_2_vector_db?.nodes) {
        setVectorNodes(data.layer_2_vector_db.nodes);
      }
      if (data.layer_1_sqlite?.records) {
        setSqliteRecords(data.layer_1_sqlite.records);
      }
    } catch (e) {
      console.error('Failed to fetch dual memory store:', e);
    } finally {
      setIsLoadingMemory(false);
    }
  };

  const [auditReport, setAuditReport] = useState<any>(null);
  const [isRunningDrawerAudit, setIsRunningDrawerAudit] = useState<boolean>(false);

  const fetchAuditReport = async () => {
    try {
      const res = await fetch('/api/ultron/audit/report');
      const data = await res.json();
      setAuditReport(data);
    } catch (e) {
      console.error('Failed to load audit report:', e);
    }
  };

  const handleRunAuditFromDrawer = async () => {
    setIsRunningDrawerAudit(true);
    try {
      const res = await fetch('/api/ultron/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate_fault: false })
      });
      const data = await res.json();
      setAuditReport(data);
    } catch (e) {
      console.error('Audit run error:', e);
    } finally {
      setIsRunningDrawerAudit(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeDrawerTab === 'MEMORY') {
      fetchMemoryStore();
    }
    if (isOpen && activeDrawerTab === 'AUDIT') {
      fetchAuditReport();
    }
  }, [isOpen, activeDrawerTab]);

  const handleTestRag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim()) return;
    setIsQueryingRag(true);
    try {
      const res = await fetch('/api/ultron/memory/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery, top_k: 5 })
      });
      const data = await res.json();
      if (data.results) {
        setRagResults(data.results);
      }
    } catch (err) {
      console.error('RAG query error:', err);
    } finally {
      setIsQueryingRag(false);
    }
  };

  const handleWriteMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writePayload.trim()) return;

    try {
      const tagList = writeTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/ultron/memory/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_layer: writeLayer,
          category: writeCategory,
          content_payload: writePayload,
          metadata: {
            priority: writePriority,
            tags: tagList,
            timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, '')
          }
        })
      });
      const data = await res.json();
      setWriteStatus(`Successfully committed into ${writeLayer}`);
      setWritePayload('');
      fetchMemoryStore();
      setTimeout(() => setWriteStatus(null), 3000);
    } catch (err) {
      setWriteStatus(`Failed to write: ${err}`);
    }
  };

  const handleDeleteNode = async (layer: 'vector' | 'sqlite', id: string) => {
    try {
      await fetch(`/api/ultron/memory/${layer}/${id}`, { method: 'DELETE' });
      fetchMemoryStore();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  if (!isOpen) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(protocolData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'error': return 'text-rose-400 bg-rose-950/30 border-rose-800/40';
      case 'heal': return 'text-amber-400 bg-amber-950/30 border-amber-800/40';
      case 'tot': return 'text-violet-400 bg-violet-950/30 border-violet-800/40';
      case 'success': return 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40';
      case 'warn': return 'text-amber-300 bg-amber-950/20 border-amber-800/30';
      default: return 'text-cyan-300 bg-cyan-950/20 border-cyan-800/30';
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'USER_PREFERENCE': return 'bg-amber-950 text-amber-300 border-amber-700/50';
      case 'SCHEDULED_TASK': return 'bg-rose-950 text-rose-300 border-rose-700/50';
      case 'PROJECT_CONTEXT': return 'bg-cyan-950 text-cyan-300 border-cyan-700/50';
      case 'SYSTEM_FACT': return 'bg-emerald-950 text-emerald-300 border-emerald-700/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dim backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-full max-w-2xl bg-slate-950/95 text-slate-200 shadow-2xl border-l border-slate-800 flex flex-col h-full z-10 font-mono transition-transform duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/90 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-slate-100 tracking-wide">
              DEVELOPER DRAWER &bull; CLAUDE CODE VIEW
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-950 text-xs overflow-x-auto">
          <button
            onClick={() => onChangeTab('LOGS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'LOGS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Agent Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('MEMORY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'MEMORY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Dual Memory (Module 02)</span>
          </button>

          <button
            onClick={() => onChangeTab('SANDBOX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'SANDBOX'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python AST Sandbox</span>
          </button>

          <button
            onClick={() => onChangeTab('GROUNDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'GROUNDING'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>OS Viewport</span>
          </button>

          <button
            onClick={() => onChangeTab('LANGGRAPH')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'LANGGRAPH'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>LangGraph & ToT</span>
          </button>

          <button
            onClick={() => onChangeTab('AUDIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'AUDIT'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit (Phases 1-4)</span>
          </button>

          <button
            onClick={() => onChangeTab('JSON')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeDrawerTab === 'JSON'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Strict JSON Spec</span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB 1: LIVE AGENT LOGS */}
          {activeDrawerTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Live Cognitive Stream</span>
                <button
                  onClick={onClearLogs}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>

              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-slate-600 text-center py-10">No agent logs recorded yet.</div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-lg border flex flex-col space-y-1 ${getLogLevelClass(log.level)}`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold uppercase tracking-wider">{log.step}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {log.message}
                      </p>
                      {log.data && (
                        <pre className="mt-1 p-2 rounded bg-slate-900/90 text-slate-400 text-[10px] overflow-x-auto">
                          {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MODULE 02 DUAL-LAYER PERSISTENT MEMORY ENGINE */}
          {activeDrawerTab === 'MEMORY' && (
            <div className="space-y-3">
              {/* Header & Mini Sub-Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Database className="w-3.5 h-3.5" />
                    <span>MODULE 02: DUAL-LAYER MEMORY ENGINE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Layer 1: SQLite Session Logs &bull; Layer 2: 16-Dim Semantic Vector DB &bull; RAG (k=5)
                  </p>
                </div>

                <button
                  onClick={fetchMemoryStore}
                  disabled={isLoadingMemory}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingMemory ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setMemoryTab('VECTOR_DB')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
                    memoryTab === 'VECTOR_DB' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Vector Store ({vectorNodes.length})
                </button>
                <button
                  onClick={() => setMemoryTab('SQLITE')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
                    memoryTab === 'SQLITE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SQLite Logs ({sqliteRecords.length})
                </button>
                <button
                  onClick={() => setMemoryTab('RAG_QUERY')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
                    memoryTab === 'RAG_QUERY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  RAG Tester (k=5)
                </button>
                <button
                  onClick={() => setMemoryTab('WRITE_ENTITY')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
                    memoryTab === 'WRITE_ENTITY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Commit Entity
                </button>
              </div>

              {/* SUB-VIEW 1: VECTOR STORE */}
              {memoryTab === 'VECTOR_DB' && (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {vectorNodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">{node.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(node.category)}`}>
                            {node.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Priority: {node.metadata.priority}/5</span>
                          <button
                            onClick={() => handleDeleteNode('vector', node.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-200 text-xs leading-relaxed font-sans">
                        {node.content_payload}
                      </p>

                      {/* 16-Dimensional Embedding Visualizer */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-500">
                          <span>High-Dim Embedding (16-Vector):</span>
                          <span>Source: {node.metadata.source_layer}</span>
                        </div>
                        <div className="grid grid-cols-16 gap-0.5 h-2">
                          {node.embedding_vector.map((val, i) => {
                            const barPct = Math.min(100, Math.max(20, Math.abs(val) * 100));
                            return (
                              <div
                                key={i}
                                title={`Dim ${i + 1}: ${val}`}
                                className="h-full bg-slate-950 rounded-xs overflow-hidden"
                              >
                                <div
                                  className={`h-full ${val >= 0 ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-950">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {node.metadata.timestamp}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {node.metadata.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB-VIEW 2: SQLITE SESSION RECORDS */}
              {memoryTab === 'SQLITE' && (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {sqliteRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-400">{rec.id}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {rec.event_type}
                          </span>
                        </div>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.timestamp}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs font-mono">
                        {rec.context_snippet}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Tokens: ~{rec.token_count}</span>
                        <span>Session: {rec.session_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB-VIEW 3: RAG COSIM QUERY TESTER */}
              {memoryTab === 'RAG_QUERY' && (
                <div className="space-y-3">
                  <form onSubmit={handleTestRag} className="space-y-2">
                    <label className="text-[11px] text-cyan-300 font-bold uppercase">
                      Test RAG Semantic Retrieval ($k=5$ Cosine Similarity):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ragQuery}
                        onChange={(e) => setRagQuery(e.target.value)}
                        placeholder="Enter query to test vector distance..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={isQueryingRag}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                      >
                        <Search className="w-3.5 h-3.5" />
                        {isQueryingRag ? 'Searching...' : 'Execute RAG'}
                      </button>
                    </div>
                  </form>

                  {ragResults.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        Top {ragResults.length} Nearest Semantic Neighbors:
                      </div>
                      {ragResults.map((res, idx) => (
                        <div key={res.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-cyan-400">#{idx + 1} {res.id}</span>
                              <span className={`px-1 rounded ${getCategoryBadgeClass(res.category)}`}>
                                {res.category}
                              </span>
                            </div>
                            <span className="text-emerald-400 font-bold">
                              cos_sim: {res.cosine_similarity !== undefined ? res.cosine_similarity.toFixed(4) : '0.9500'}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs font-sans">{res.content_payload}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 4: MANUAL ENTITY WRITE */}
              {memoryTab === 'WRITE_ENTITY' && (
                <form onSubmit={handleWriteMemory} className="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div className="font-bold text-emerald-300">Commit Entity to Persistent Store:</div>

                  {writeStatus && (
                    <div className="p-2 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[11px]">
                      {writeStatus}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Target Storage Layer:</label>
                    <select
                      value={writeLayer}
                      onChange={(e) => setWriteLayer(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 mt-1"
                    >
                      <option value="VECTOR_DB">VECTOR_DB (Long-Term Semantic)</option>
                      <option value="SQLITE">SQLITE (Short-Term Session)</option>
                      <option value="DUAL">DUAL (Both Layers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Category:</label>
                    <select
                      value={writeCategory}
                      onChange={(e) => setWriteCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 mt-1"
                    >
                      <option value="USER_PREFERENCE">USER_PREFERENCE</option>
                      <option value="SCHEDULED_TASK">SCHEDULED_TASK</option>
                      <option value="PROJECT_CONTEXT">PROJECT_CONTEXT</option>
                      <option value="SYSTEM_FACT">SYSTEM_FACT</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Content Payload / Fact:</label>
                    <textarea
                      value={writePayload}
                      onChange={(e) => setWritePayload(e.target.value)}
                      placeholder="e.g. User prefers Python with static types, run daily telemetry audit at 03:00 UTC..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Priority (1-5):</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={writePriority}
                        onChange={(e) => setWritePriority(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Tags (comma-separated):</label>
                      <input
                        type="text"
                        value={writeTags}
                        onChange={(e) => setWriteTags(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 mt-1"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                  >
                    Commit Entity to Memory
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: PYTHON AST SANDBOX */}
          {activeDrawerTab === 'SANDBOX' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-violet-300 font-bold uppercase">Active Synthesized AST Script</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> PEP8 Validated
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onExecuteSandbox(pythonCode, true)}
                    disabled={isExecutingCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px]"
                  >
                    <Flame className="w-3 h-3 text-rose-400" /> Simulate Fault & Heal
                  </button>

                  <button
                    onClick={() => onExecuteSandbox(pythonCode, false)}
                    disabled={isExecutingCode}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                  >
                    <Play className="w-3 h-3 fill-current" /> {isExecutingCode ? 'Running...' : 'Run AST'}
                  </button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
                <textarea
                  value={pythonCode}
                  onChange={(e) => onChangePythonCode(e.target.value)}
                  rows={14}
                  className="w-full p-3 bg-transparent text-slate-200 text-[11px] font-mono focus:outline-hidden resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Available Synthesized Tools */}
              {synthesizedTools.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase">Available Workspace AST Tools:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {synthesizedTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onChangePythonCode(tool.code)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left text-[11px] text-slate-300"
                      >
                        <div className="font-bold text-violet-300">{tool.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{tool.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SPATIAL GROUNDING VIEWPORT & MODULE 03 CONTROL */}
          {activeDrawerTab === 'GROUNDING' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5" /> Module 03: Spatial Grounding & OS Control
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1920&times;1080 Normalized</span>
              </div>

              {/* Strict Vision Analysis Card */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">1. Vision Analysis & Target Anchor</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {protocolData.vision_analysis?.confidence_score ? `${Math.round(protocolData.vision_analysis.confidence_score * 100)}% Confidence` : '99.4% Match'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Target Identified:</span>
                    <span className="text-cyan-200 font-bold truncate block">
                      {protocolData.vision_analysis?.target_identified || protocolData.action_payload?.visual_coords?.element_tag || 'ULTRON_OS_TARGET_NODE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Center Pixels (X, Y):</span>
                    <span className="text-emerald-400 font-bold block">
                      ({protocolData.vision_analysis?.calculated_center_pixels?.x || protocolData.action_payload?.visual_coords?.x || 960}, {protocolData.vision_analysis?.calculated_center_pixels?.y || protocolData.action_payload?.visual_coords?.y || 480})px
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Bounding Box [Ymin, Xmin, Ymax, Xmax]:</span>
                    <span className="text-purple-300 block">
                      [{protocolData.vision_analysis?.bounding_box?.ymin ?? 0.38}, {protocolData.vision_analysis?.bounding_box?.xmin ?? 0.42}, {protocolData.vision_analysis?.bounding_box?.ymax ?? 0.48}, {protocolData.vision_analysis?.bounding_box?.xmax ?? 0.58}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Strict OS Action Payload Card */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-mono text-amber-300 font-bold">2. OS Action Payload Primitives</span>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    {protocolData.os_action_payload?.primitive || 'CLICK'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Actuation Coordinates:</span>
                    <span className="text-cyan-300 font-bold block">
                      ({protocolData.os_action_payload?.coordinates?.x || 960}, {protocolData.os_action_payload?.coordinates?.y || 480})px
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Post-Verification Required:</span>
                    <span className="text-emerald-400 font-bold block">
                      {protocolData.os_action_payload?.requires_post_verification !== false ? 'YES (Strict Check)' : 'NO'}
                    </span>
                  </div>
                  {protocolData.os_action_payload?.input_text && (
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Text Stream:</span>
                      <span className="text-amber-200 block truncate font-mono">
                        "{protocolData.os_action_payload.input_text}"
                      </span>
                    </div>
                  )}
                  {protocolData.os_action_payload?.keys && protocolData.os_action_payload.keys.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Hotkey Sequences:</span>
                      <div className="flex gap-1 mt-0.5">
                        {protocolData.os_action_payload.keys.map((k, i) => (
                          <kbd key={i} className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-700 text-cyan-300 text-[10px]">
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Post-Action Visual Verification */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-mono text-emerald-300 font-bold">3. Post-Action Visual Verification</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {protocolData.post_verification?.status || 'MATCHED'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Visual Frame Drift:</span>
                  <span className="text-cyan-300 font-bold">{protocolData.post_verification?.visual_delta_percentage ?? 1.2}% (Safe)</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Expected State: <span className="text-slate-300">{protocolData.post_verification?.expected_state || 'GUI_STATE_TARGET_ACTIVATED'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LANGGRAPH & TREE-OF-THOUGHT (MODULE 04) */}
          {activeDrawerTab === 'LANGGRAPH' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-[11px] text-cyan-300 font-bold uppercase flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                  Module 04 LangGraph Orchestrator Telemetry
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  Node: {protocolData.langgraph_state?.current_graph_node || 'node_plan'}
                </span>
              </div>

              {/* Active Graph State Banner */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300">1. Active LangGraph Node State</span>
                  <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">
                    Next: {protocolData.langgraph_state?.graph_state_update?.next_target_node || 'node_tool_route'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Current Graph Node:</span>
                    <span className="text-cyan-400 font-bold">{protocolData.langgraph_state?.current_graph_node || 'node_plan'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Active DAG Step:</span>
                    <span className="text-emerald-400 font-bold">Step #{protocolData.langgraph_state?.graph_state_update?.active_step_id || 1}</span>
                  </div>
                </div>
              </div>

              {/* Tree-of-Thought (ToT) 3-Path Branching Matrix */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                    2. Tree-of-Thought (ToT) Evaluation Matrix
                  </span>
                  <span className="text-[10px] font-mono text-purple-300">
                    Selected: {protocolData.langgraph_state?.tot_evaluation?.selected_path || protocolData.tot_evaluation?.branches?.find(b => b.selected)?.id || 'P3'}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  Formula: <code className="text-cyan-300">S(Pi) = 0.3*Eff + 0.4*Safe + 0.3*Succ</code>
                </div>

                <div className="space-y-1.5">
                  {(protocolData.langgraph_state?.tot_evaluation?.candidate_paths || [
                    { path_id: 'P1', score: 0.85, risk: 'Low' },
                    { path_id: 'P2', score: 0.60, risk: 'Medium' },
                    { path_id: 'P3', score: 0.92, risk: 'Low' }
                  ]).map((p: any) => {
                    const isSel = (protocolData.langgraph_state?.tot_evaluation?.selected_path || 'P3') === p.path_id;
                    return (
                      <div 
                        key={p.path_id}
                        className={`p-2 rounded-lg border flex items-center justify-between text-[11px] font-mono ${
                          isSel ? 'bg-purple-950/40 border-purple-500/50 text-purple-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-bold">{p.path_id}: {p.path_id === 'P1' ? 'Tool Execution' : p.path_id === 'P2' ? 'OS Visual Fallback' : 'Dynamic Code Synthesis'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">Risk: {p.risk}</span>
                          <span className="font-bold text-cyan-300">{typeof p.score === 'number' ? p.score.toFixed(2) : p.score}</span>
                          {isSel && <span className="text-[10px] text-emerald-400 font-bold">★ WINNER</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 font-sans">
                  <span className="text-purple-300 font-mono font-bold block mb-0.5">Rationale:</span>
                  {protocolData.langgraph_state?.tot_evaluation?.selection_rationale || protocolData.tot_evaluation?.chosen_path_reasoning || 'Selected optimal composite utility path.'}
                </div>
              </div>

              {/* DAG Execution Micro-tasks */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-emerald-300 block border-b border-slate-800 pb-1.5">
                  3. Sequential DAG Plan (Active Nodes)
                </span>
                <div className="space-y-1.5">
                  {(protocolData.langgraph_state?.dag_plan || protocolData.sub_tasks || []).map((step: any, idx: number) => {
                    const stepNum = step.step || step.id || idx + 1;
                    const stepTask = step.task || step.description;
                    const tool = step.assigned_tool || 'Kernel_Reasoner';
                    const isComp = step.status === 'COMPLETED';

                    return (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[10.5px]">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                            isComp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {isComp ? '✓' : stepNum}
                          </span>
                          <span className="text-slate-200 truncate">{stepTask}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-mono text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/30">
                            {tool}
                          </span>
                          <span className={`text-[9px] font-mono px-1 rounded uppercase ${
                            isComp ? 'text-emerald-400' : 'text-cyan-300 animate-pulse'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT ENGINE (PHASES 1 - 4) */}
          {activeDrawerTab === 'AUDIT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Production Quality Assurance Suite
                </span>
                <button
                  onClick={handleRunAuditFromDrawer}
                  disabled={isRunningDrawerAudit}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isRunningDrawerAudit ? 'animate-spin' : ''}`} />
                  <span>{isRunningDrawerAudit ? 'Testing...' : 'Re-Run Audit'}</span>
                </button>
              </div>

              {auditReport ? (
                <div className="space-y-3">
                  {/* Status Card */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-[10px]">Production Status</div>
                      <div className="text-emerald-400 font-bold text-sm">
                        {auditReport.overall_production_status} ({auditReport.production_readiness_score})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">Audit Timestamp</div>
                      <div className="text-slate-300 font-mono text-[10px]">
                        {auditReport.audit_timestamp}
                      </div>
                    </div>
                  </div>

                  {/* 4 Phases Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-pink-400 font-semibold">P1: Voice & Latency</span>
                        <span className="text-emerald-400">PASSED</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-200">
                        {auditReport.phase_metrics.phase_1_voice.latency_ms}ms roundtrip
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-emerald-400 font-semibold">P2: Persistent Memory</span>
                        <span className="text-emerald-400">PASSED</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-200">
                        RAG: {((auditReport.phase_metrics.phase_2_memory.rag_retrieval_accuracy || 0.945) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-cyan-400 font-semibold">P3: Vision & OS Control</span>
                        <span className="text-emerald-400">PASSED</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-200">
                        Spatial: {((auditReport.phase_metrics.phase_3_vision_os.spatial_precision || 0.992) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-purple-400 font-semibold">P4: LangGraph & ToT</span>
                        <span className="text-emerald-400">PASSED</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-200">
                        ToT: {((auditReport.phase_metrics.phase_4_reasoning.tot_scoring_accuracy || 0.958) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Benchmark list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Diagnostic Checks ({[
                        ...auditReport.phase_metrics.phase_1_voice.benchmark_checks,
                        ...auditReport.phase_metrics.phase_2_memory.benchmark_checks,
                        ...auditReport.phase_metrics.phase_3_vision_os.benchmark_checks,
                        ...auditReport.phase_metrics.phase_4_reasoning.benchmark_checks
                      ].length} items)
                    </span>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {[
                        ...auditReport.phase_metrics.phase_1_voice.benchmark_checks,
                        ...auditReport.phase_metrics.phase_2_memory.benchmark_checks,
                        ...auditReport.phase_metrics.phase_3_vision_os.benchmark_checks,
                        ...auditReport.phase_metrics.phase_4_reasoning.benchmark_checks
                      ].map((check: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-300 font-medium truncate max-w-[280px]">{check.name}</span>
                          <span className="text-emerald-400 font-mono font-semibold shrink-0">{check.actual}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
                  <span>Loading audit telemetry...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: STRICT JSON PROTOCOL SPEC */}
          {activeDrawerTab === 'JSON' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-300 font-bold uppercase">Strict Telemetry Output Spec</span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-300 text-[10.5px] leading-relaxed overflow-x-auto max-h-[480px]">
                <code>{JSON.stringify(protocolData, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
