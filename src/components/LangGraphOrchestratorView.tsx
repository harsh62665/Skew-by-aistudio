import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  RotateCcw, 
  Play, 
  Sliders, 
  Code2, 
  Database, 
  Monitor, 
  Mic, 
  Copy, 
  Check,
  Zap,
  Activity,
  Workflow,
  Settings2,
  Terminal,
  Sparkles
} from 'lucide-react';
import { 
  StrictLangGraphResponse, 
  LangGraphNode, 
  ToTCandidatePath, 
  DAGPlanStep 
} from '../types';

interface LangGraphOrchestratorViewProps {
  initialState?: StrictLangGraphResponse;
  onRunCycle?: (goal: string) => void;
}

const STATE_NODES: Array<{
  id: LangGraphNode;
  shortName: string;
  stepNum: number;
  icon: React.ElementType;
}> = [
  { id: 'node_plan', shortName: 'plan', stepNum: 1, icon: Workflow },
  { id: 'node_tool_route', shortName: 'tool_route', stepNum: 2, icon: Zap },
  { id: 'node_evaluate', shortName: 'eval', stepNum: 3, icon: Activity },
  { id: 'node_replan', shortName: 'replan', stepNum: 4, icon: AlertTriangle },
  { id: 'node_respond', shortName: 'respond', stepNum: 5, icon: CheckCircle2 }
];

export const LangGraphOrchestratorView: React.FC<LangGraphOrchestratorViewProps> = ({
  initialState,
  onRunCycle
}) => {
  const [graphState, setGraphState] = useState<StrictLangGraphResponse>(initialState || {
    current_graph_node: 'node_plan',
    tot_evaluation: {
      candidate_paths: [
        { path_id: 'P1', score: 0.85, risk: 'Low', efficiency: 90, safety: 82, success_prob: 84 },
        { path_id: 'P2', score: 0.60, risk: 'Medium', efficiency: 70, safety: 65, success_prob: 60 },
        { path_id: 'P3', score: 0.92, risk: 'Low', efficiency: 92, safety: 96, success_prob: 95 }
      ],
      selected_path: 'P3',
      selection_rationale: 'P3 selected: 0.92 score with safe execution profile.'
    },
    dag_plan: [
      { step: 1, task: 'Extract target file format requirements', assigned_tool: 'Memory_Store', status: 'COMPLETED' },
      { step: 2, task: 'Synthesize local conversion tool', assigned_tool: 'Dynamic_Code_Engine', status: 'IN_PROGRESS' },
      { step: 3, task: 'Execute sandbox validation unit test', assigned_tool: 'Dynamic_Code_Engine', status: 'PENDING' },
      { step: 4, task: 'Synthesize final multimodal response to user', assigned_tool: 'Kernel_Reasoner', status: 'PENDING' }
    ],
    graph_state_update: {
      active_step_id: 2,
      input_payload: { source_format: 'PNG', target_format: 'PDF', runtime_target: 'SANDBOX_AST' },
      next_target_node: 'node_tool_route'
    }
  });

  const [inputGoal, setInputGoal] = useState<string>('Synthesize dynamic image format conversion tool with AST sandbox validation');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(120);

  // Weights for ToT
  const [weights, setWeights] = useState({ eff: 0.3, safe: 0.4, succ: 0.3 });

  // Sync with prop when updated
  useEffect(() => {
    if (initialState) {
      setGraphState(initialState);
    }
  }, [initialState]);

  const handleOrchestrate = async (nodeTarget?: LangGraphNode) => {
    setIsProcessing(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/ultron/langgraph/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: inputGoal,
          current_node: nodeTarget || graphState.current_graph_node
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGraphState({
          current_graph_node: data.current_graph_node,
          tot_evaluation: data.tot_evaluation,
          dag_plan: data.dag_plan,
          graph_state_update: data.graph_state_update
        });
      }
    } catch (e) {
      console.error('Orchestration error', e);
    } finally {
      setLatencyMs(Math.round(performance.now() - start) || 120);
      setIsProcessing(false);
    }
  };

  const handleTransition = async (targetNode: LangGraphNode) => {
    setIsProcessing(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/ultron/langgraph/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_node: targetNode,
          trigger: `MANUAL_STEP_TO_${targetNode.toUpperCase()}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updated_state) {
          setGraphState(data.updated_state);
        }
      }
    } catch (e) {
      console.error('Transition error', e);
    } finally {
      setLatencyMs(Math.round(performance.now() - start) || 95);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    handleTransition('node_plan');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(graphState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'Memory_Store':
        return <Database className="w-3 h-3 text-purple-400" />;
      case 'Dynamic_Code_Engine':
        return <Code2 className="w-3 h-3 text-emerald-400" />;
      case 'OS_Visual_Actuator':
        return <Monitor className="w-3 h-3 text-blue-400" />;
      case 'Voice_Stream':
        return <Mic className="w-3 h-3 text-amber-400" />;
      default:
        return <Cpu className="w-3 h-3 text-cyan-400" />;
    }
  };

  const activeNodeFormatted = graphState.current_graph_node.replace('node_', '');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 text-slate-200 font-sans">
      
      {/* 1-Line Header Card with Minimalist Controls */}
      <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Title & Subtle Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white font-mono flex items-center gap-2">
              <Workflow className="w-4 h-4 text-cyan-400" />
              DAG Execution Graph
            </h2>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 border border-white/10 text-slate-400">
              CORE // v4.2
            </span>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              Node: <strong className="text-white">{activeNodeFormatted}</strong>
            </span>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 border border-white/10 text-slate-400">
              Latency: <strong className="text-slate-200">{latencyMs}ms</strong>
            </span>

            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
              isProcessing
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
            }`}>
              {isProcessing ? 'RUNNING' : 'IDLE'}
            </span>
          </div>

          {/* Clean Icon-Supported Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOrchestrate()}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Step Orchestrator"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>▶ Run Flow</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
              title="Reset Execution to Plan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↺ Reset</span>
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                showConfig ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300' : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
              title="Graph Configuration"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowJson(!showJson)}
              className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                showJson ? 'bg-purple-950 border-purple-500/50 text-purple-300' : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
              title="Toggle JSON Output"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* State Machine Transition Breadcrumb */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center overflow-x-auto py-1 scrollbar-none gap-1 sm:gap-2">
          {STATE_NODES.map((n, idx) => {
            const isActive = graphState.current_graph_node === n.id;
            const isNext = graphState.graph_state_update.next_target_node === n.id;
            const Icon = n.icon;

            return (
              <React.Fragment key={n.id}>
                <button
                  onClick={() => handleTransition(n.id)}
                  disabled={isProcessing}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-sm font-semibold'
                      : isNext
                      ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{n.shortName}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />}
                </button>
                {idx < STATE_NODES.length - 1 && (
                  <span className="text-slate-600 text-xs px-0.5 select-none font-mono">➔</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Optional Config Bar */}
        {showConfig && (
          <div className="mt-3 p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputGoal}
                onChange={(e) => setInputGoal(e.target.value)}
                placeholder="Decomposition goal..."
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleOrchestrate('node_plan')}
                disabled={isProcessing || !inputGoal.trim()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>Decompose</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
              <span>Weights:</span>
              <label className="flex items-center gap-1">
                Eff: <input type="number" step="0.1" min="0.1" max="0.8" value={weights.eff} onChange={e => setWeights({...weights, eff: parseFloat(e.target.value) || 0.1})} className="w-12 bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-white" />
              </label>
              <label className="flex items-center gap-1">
                Safe: <input type="number" step="0.1" min="0.1" max="0.8" value={weights.safe} onChange={e => setWeights({...weights, safe: parseFloat(e.target.value) || 0.1})} className="w-12 bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-white" />
              </label>
              <label className="flex items-center gap-1">
                Succ: <input type="number" step="0.1" min="0.1" max="0.8" value={weights.succ} onChange={e => setWeights({...weights, succ: parseFloat(e.target.value) || 0.1})} className="w-12 bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-white" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Streamlined Grid: Minimalist Node Cards & DAG Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (6 cols): Streamlined Node Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                EXECUTION PIPELINE
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {STATE_NODES.length} Nodes
              </span>
            </div>

            {/* Minimalist Node Cards: [Step Number] + [Node Name] + [Status Badge] */}
            <div className="space-y-1.5">
              {STATE_NODES.map((node) => {
                const isActive = graphState.current_graph_node === node.id;
                const isNext = graphState.graph_state_update.next_target_node === node.id;
                const Icon = node.icon;

                let statusBadge = { label: 'Idle', color: 'bg-white/5 text-slate-500 border-white/5' };
                if (isActive) {
                  statusBadge = { label: 'Running', color: 'bg-cyan-950 border-cyan-500/50 text-cyan-300 animate-pulse' };
                } else if (isNext) {
                  statusBadge = { label: 'Next Target', color: 'bg-purple-950 border-purple-500/40 text-purple-300' };
                }

                return (
                  <button
                    key={node.id}
                    onClick={() => handleTransition(node.id)}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/20 text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${
                        isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {node.stepNum}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-200">{node.shortName}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tree-of-Thought (ToT) Branching Matrix */}
          <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-4 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                TREE-OF-THOUGHT (ToT)
              </span>
              <span className="text-[11px] font-mono text-purple-400">
                Selected: {graphState.tot_evaluation.selected_path}
              </span>
            </div>

            <div className="space-y-1.5">
              {graphState.tot_evaluation.candidate_paths.map((p) => {
                const isSelected = graphState.tot_evaluation.selected_path === p.path_id;

                return (
                  <div
                    key={p.path_id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/50 text-white'
                        : 'bg-white/5 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.path_id}
                      </span>
                      <span className="font-medium text-slate-200">Score: {p.score.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        p.risk === 'Low' ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                      }`}>
                        {p.risk} Risk
                      </span>
                      {isSelected && (
                        <span className="text-purple-400 text-[11px] font-bold">✓ ACTIVE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): DAG Micro-Task Steps */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                DAG PLAN STEPS
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                Step #{graphState.graph_state_update.active_step_id} Active
              </span>
            </div>

            {/* Streamlined Step Cards: [Step Number] + [Node Name] + [Status Badge] */}
            <div className="space-y-1.5">
              {graphState.dag_plan.map((step) => {
                const isStepActive = graphState.graph_state_update.active_step_id === step.step;

                return (
                  <div
                    key={step.step}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isStepActive
                        ? 'bg-slate-900 border-cyan-500/60 shadow-sm ring-1 ring-cyan-500/20'
                        : step.status === 'COMPLETED'
                        ? 'bg-white/5 border-white/5 opacity-75'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : isStepActive
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {step.status === 'COMPLETED' ? '✓' : step.step}
                      </span>
                      
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">
                          {step.task}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
                          {getToolIcon(step.assigned_tool)}
                          <span className="truncate">{step.assigned_tool}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold shrink-0 border ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                        : step.status === 'IN_PROGRESS'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-500 border-white/5'
                    }`}>
                      {step.status === 'IN_PROGRESS' ? 'Running' : step.status === 'COMPLETED' ? 'Done' : 'Idle'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible JSON Output */}
          {showJson && (
            <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-4 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  GRAPH STATE JSON
                </span>
                <button
                  onClick={handleCopyJSON}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black/80 text-emerald-400 text-[11px] font-mono rounded-xl overflow-x-auto max-h-48 border border-white/5">
                <code>{JSON.stringify(graphState, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
