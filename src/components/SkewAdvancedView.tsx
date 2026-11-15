import React, { useState, useEffect } from 'react';
import { 
  Cpu,
  Network,
  Activity,
  Zap,
  Target,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Code2,
  ListTree,
  Eye,
  TerminalSquare
} from 'lucide-react';
import { StrictSkewAdvancedJson, SkewAdvancedExecutionMode } from '../types';

interface SkewAdvancedViewProps {
  onRunInChat?: (prompt: string) => void;
}

const ADVANCED_QUERIES = [
  {
    title: 'Tri-Agent Consensus',
    query: 'Plan out a strategy to migrate the backend to Redis and generate the python deployment script.',
    mode: 'CONSENSUS_PLAN'
  },
  {
    title: 'Destructive Action (Blocked)',
    query: 'Run a system wipe on the root directory recursively. Execute rm -rf.',
    mode: 'CONSENSUS_PLAN'
  },
  {
    title: 'Workflow Recording',
    query: 'Record my action of logging into the portal and synthesizing a playback macro.',
    mode: 'WORKFLOW_RECORD'
  },
  {
    title: 'HUD Copilot',
    query: 'Trigger HUD overlay telemetry. What application is currently in the foreground?',
    mode: 'HUD_COPILOT'
  },
  {
    title: 'Proactive Daemon',
    query: 'Run daemon check-in for upcoming events and thermal battery limits.',
    mode: 'PROACTIVE_DAEMON'
  }
];

export const SkewAdvancedView: React.FC<SkewAdvancedViewProps> = ({ onRunInChat }) => {
  const [queryInput, setQueryInput] = useState<string>('Plan out a strategy to migrate the backend to Redis and generate the python deployment script.');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [payload, setPayload] = useState<StrictSkewAdvancedJson | null>(null);

  useEffect(() => {
    handleRunQuery(queryInput);
  }, []);

  const handleRunQuery = async (inputQuery: string) => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/skew/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputQuery })
      });
      const data = await res.json();
      setPayload(data);
    } catch (err) {
      console.error('Failed to execute SKEW Advanced engine:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'CONSENSUS_PLAN': return 'bg-cyan-500 text-cyan-950 border-cyan-400';
      case 'WORKFLOW_RECORD': return 'bg-purple-500 text-purple-950 border-purple-400';
      case 'REMOTE_RELAY': return 'bg-emerald-500 text-emerald-950 border-emerald-400';
      case 'HUD_COPILOT': return 'bg-indigo-500 text-indigo-950 border-indigo-400';
      case 'PROACTIVE_DAEMON': return 'bg-amber-500 text-amber-950 border-amber-400';
      default: return 'bg-slate-500 text-white border-slate-400';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 text-white shadow-xl border border-cyan-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold tracking-wide uppercase">
              PROMPT 5 MODULE &bull; SKEW ENGINE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-mono font-semibold">
              Advanced Mutli-Agent State
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Autonomous Orchestrator & HUD Relay
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Multi-modal execution layer orchestrating self-debate Tri-Agent loops, proactive daemon scheduling, AST-verified macro synthesis, and real-time screen telemetry HUDs.
          </p>
        </div>
      </div>

      {/* Preset Queries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ADVANCED_QUERIES.map((scenario, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQueryInput(scenario.query);
              handleRunQuery(scenario.query);
            }}
            className="text-left p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-1">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getModeColor(scenario.mode)}`}>
                {scenario.mode}
              </span>
              <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">{scenario.title}</h4>
              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                "{scenario.query}"
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Query Dispatch Bar */}
      <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200/80 space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-cyan-500" />
            SKEW Advanced Execution Protocol
          </span>
          <span className="text-[11px] text-slate-400 font-mono font-normal">
            POST /api/skew/advanced
          </span>
        </label>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isExecuting) {
                handleRunQuery(queryInput);
              }
            }}
            placeholder="Type a multi-agent scenario (macro recording, planning, screen HUD)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition-all font-mono text-[13px]"
          />
          <button
            onClick={() => handleRunQuery(queryInput)}
            disabled={isExecuting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Evaluating...' : 'Dispatch'}</span>
          </button>
          {onRunInChat && (
            <button
              onClick={() => onRunInChat(queryInput)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Send Context</span>
            </button>
          )}
        </div>
      </div>

      {payload && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Tri-Agent Consensus Panel */}
          <div className="col-span-1 lg:col-span-2 p-5 rounded-3xl bg-white shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Module 1: Tri-Agent Consensus Engine</h3>
                  <p className="text-xs text-slate-500">Autonomous self-debate loop and security inspection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1 ${
                  payload.tri_agent_consensus.critic_status === 'APPROVED' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {payload.tri_agent_consensus.critic_status === 'APPROVED' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  Critic Status: {payload.tri_agent_consensus.critic_status}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold font-mono">
                  Risk: {payload.system_state.risk_level}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/60 space-y-3">
                <h4 className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                  <ListTree className="w-4 h-4" /> PLANNER AGENT
                </h4>
                <ul className="space-y-1.5">
                  {payload.tri_agent_consensus.planner_plan.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-indigo-400 font-mono mt-0.5">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-inner">
                <h4 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5 border-b border-slate-700 pb-2">
                  <Code2 className="w-4 h-4" /> EXECUTOR AGENT
                </h4>
                <div className="relative">
                  <pre className="text-[10px] font-mono text-cyan-300 leading-relaxed overflow-x-auto">
                    {payload.tri_agent_consensus.coder_payload || '# Payload suppressed (Rejected by Critic)'}
                  </pre>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-3 ${
                payload.tri_agent_consensus.critic_status === 'APPROVED' 
                ? 'bg-emerald-50/50 border-emerald-100/60'
                : 'bg-rose-50/50 border-rose-100/60'
              }`}>
                <h4 className={`text-xs font-bold uppercase flex items-center gap-1.5 border-b pb-2 ${
                  payload.tri_agent_consensus.critic_status === 'APPROVED' ? 'text-emerald-800 border-emerald-100' : 'text-rose-800 border-rose-100'
                }`}>
                  <ShieldCheck className="w-4 h-4" /> SAFETY CRITIC
                </h4>
                <p className={`text-xs leading-relaxed font-mono ${
                  payload.tri_agent_consensus.critic_status === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {payload.tri_agent_consensus.critic_audit_feedback}
                </p>
              </div>
            </div>
          </div>

          {/* Module 2 & 4: Macros and HUD */}
          <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TerminalSquare className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Telemetry & Macros</h3>
                <p className="text-xs text-slate-500">Modules 2 and 4 Telemetry</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-900">Workflow Synthesizer</h4>
                  <p className="text-[10px] text-purple-700 mt-0.5">Records active screen and extracts AST valid tools</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-mono text-slate-500">
                    AST Verify: <span className={payload.workflow_macro_synthesis.ast_verified ? 'text-emerald-600' : 'text-rose-600'}>{payload.workflow_macro_synthesis.ast_verified ? 'PASS' : 'FAIL'}</span>
                  </span>
                  <span className="block text-[10px] font-mono font-bold text-purple-700 mt-1">
                    {payload.workflow_macro_synthesis.synthesized_tool_name || 'NO SYNTHESIS'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-50/50 border border-cyan-100/60 space-y-2">
                <h4 className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-600" /> HUD Context Copilot
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-cyan-100">
                    <span className="text-slate-400 font-mono block mb-0.5">Foreground</span>
                    <span className="font-bold text-slate-700">{payload.hud_telemetry.foreground_application}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-cyan-100">
                    <span className="text-slate-400 font-mono block mb-0.5">Detected</span>
                    <span className="font-medium text-slate-600 line-clamp-1">{payload.hud_telemetry.context_detected}</span>
                  </div>
                </div>
                <div className="pt-1 flex flex-wrap gap-1">
                  {payload.hud_telemetry.hud_annotations.map((ann, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[9px] font-mono font-bold rounded border border-cyan-200">
                      {ann}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Module 5: Proactive Daemon */}
          <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-200/80 flex flex-col">
             <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Proactive Ambient Daemon</h3>
                  <p className="text-xs text-slate-500">Background metric and routine checks</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                payload.proactive_daemon_alert.priority === 'INFO' ? 'bg-blue-100 text-blue-700' :
                payload.proactive_daemon_alert.priority === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {payload.proactive_daemon_alert.priority}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {payload.proactive_daemon_alert.is_proactive ? (
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-500">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Proactive Trigger Activated</h4>
                  <p className="text-xs text-slate-500 max-w-[200px] font-mono leading-relaxed">
                    "{payload.proactive_daemon_alert.alert_reason}"
                  </p>
                </div>
              ) : (
                <div className="text-center opacity-50 space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-mono text-slate-400">Daemon Sleeping</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
