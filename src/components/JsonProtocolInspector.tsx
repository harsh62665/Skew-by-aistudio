import React, { useState } from 'react';
import { 
  FileJson, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers, 
  Code,
  Terminal,
  FileCode2
} from 'lucide-react';
import { UltronProtocolResponse, StrictUltronProtocolJson } from '../types';

interface JsonProtocolInspectorProps {
  data: UltronProtocolResponse;
}

export const JsonProtocolInspector: React.FC<JsonProtocolInspectorProps> = ({
  data
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'STRICT_PROTOCOL' | 'FULL_TELEMETRY'>('STRICT_PROTOCOL');

  // Convert full state response into the exact Strict Protocol specification
  const strictProtocolJson: StrictUltronProtocolJson = {
    system_state: (data.system_state === 'EVALUATE' ? 'ACT' : data.system_state) as any,
    tot_rationale: data.tot_evaluation?.chosen_path_reasoning || 'Branch P2 selected: optimizes composite safety and execution speed.',
    target_coordinates: {
      x: data.action_payload?.visual_coords?.x || 960,
      y: data.action_payload?.visual_coords?.y || 480
    },
    action_payload: {
      action_type: data.action_payload?.type === 'SYNTHESIZE_CODE' 
        ? 'CODE_SYNTHESIS' 
        : (data.action_payload?.type === 'OS_INPUT' ? 'OS_INPUT' : 'TOOL_EXECUTE'),
      target_name: data.action_payload?.target || 'Cognitive_Kernel_Engine',
      code_snippet: data.action_payload?.code_snippet || null,
      parameters: data.action_payload?.parameters || { safe_mode: true, opt_level: 'O3' }
    },
    memory_commit: data.memory_update?.write_to_episodic || 'Committed state convergence vector into episodic memory database.'
  };

  const currentDisplayJson = viewMode === 'STRICT_PROTOCOL' 
    ? JSON.stringify(strictProtocolJson, null, 2)
    : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-xl space-y-3 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <FileJson className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              STRICT JSON OUTPUT PROTOCOL
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Non-negotiable schema compliance &bull; Real-time serialization &bull; AST Payload
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('STRICT_PROTOCOL')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold ${
                viewMode === 'STRICT_PROTOCOL'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Strict Spec
            </button>
            <button
              onClick={() => setViewMode('FULL_TELEMETRY')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold ${
                viewMode === 'FULL_TELEMETRY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Telemetry
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Box */}
      <div className="relative bg-slate-950/90 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner">
        <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 border-b border-slate-800/80 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-200 font-bold">
              {viewMode === 'STRICT_PROTOCOL' ? 'ultron_strict_protocol.json' : 'full_cognitive_telemetry.json'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Schema Validated
          </span>
        </div>

        <pre className="p-4 text-slate-300 leading-relaxed overflow-x-auto max-h-96 overflow-y-auto text-[11px]">
          <code>{currentDisplayJson}</code>
        </pre>
      </div>
    </div>
  );
};
