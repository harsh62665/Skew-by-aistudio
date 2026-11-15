import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Flame, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  ShieldCheck,
  FileCode,
  Wrench
} from 'lucide-react';
import { SynthesizedTool } from '../types';

interface ToolSynthesisSandboxProps {
  currentCode: string;
  onChangeCode: (code: string) => void;
  onExecuteCode: (code: string, simulateError?: boolean) => void;
  onSynthesizeNew: () => void;
  synthesizedTools: SynthesizedTool[];
  onSelectTool: (tool: SynthesizedTool) => void;
  executionResult?: {
    success: boolean;
    stdout: string;
    stderr: string;
    execution_time_ms: number;
    return_code: number;
    ast_status: string;
    auto_heal_recommended?: boolean;
  } | null;
  isExecuting: boolean;
  onAutoHealTrigger: () => void;
}

export const ToolSynthesisSandbox: React.FC<ToolSynthesisSandboxProps> = ({
  currentCode,
  onChangeCode,
  onExecuteCode,
  onSynthesizeNew,
  synthesizedTools,
  onSelectTool,
  executionResult,
  isExecuting,
  onAutoHealTrigger
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
              SELF-EVOLVING TOOL SYNTHESIS PROTOCOL
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Dynamic Python Generation &bull; PEP8 AST Parsing &bull; Isolated Execution Sandbox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="synthesize-tool-btn"
            onClick={onSynthesizeNew}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synthesize Tool</span>
          </button>

          <button
            id="exec-sandbox-btn"
            onClick={() => onExecuteCode(currentCode, false)}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Executing AST...' : 'Run in Sandbox'}</span>
          </button>

          <button
            id="test-fail-heal-btn"
            onClick={() => onExecuteCode(currentCode, true)}
            disabled={isExecuting}
            title="Inject simulated Python exception to trigger AST auto-healing"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors disabled:opacity-50"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Fault</span>
          </button>
        </div>
      </div>

      {/* Synthesized Tools Quick Switcher */}
      {synthesizedTools.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-500 shrink-0 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Vector Tools:
          </span>
          {synthesizedTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 shrink-0 hover:border-slate-700 transition-colors"
            >
              <FileCode className="w-3 h-3 text-purple-400" />
              <span>{tool.name}</span>
              <span className="text-[10px] text-slate-500 font-bold">v{tool.version}</span>
            </button>
          ))}
        </div>
      )}

      {/* Code Editor Container */}
      <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs shadow-inner">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-200 font-bold">dynamic_tool_runtime.py</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">
              Python 3.12 AST
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Strict Types Enforced
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Code Input */}
        <textarea
          id="python-code-editor"
          value={currentCode}
          onChange={(e) => onChangeCode(e.target.value)}
          rows={11}
          spellCheck={false}
          className="w-full bg-slate-950 p-3.5 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-y"
          placeholder="# Synthesized Python code will appear here..."
        />
      </div>

      {/* Sandbox Execution Console */}
      {executionResult && (
        <div className={`border rounded-xl p-3.5 font-mono text-xs space-y-2 ${
          executionResult.success
            ? 'bg-slate-950 border-emerald-800/60 shadow-lg'
            : 'bg-rose-950/20 border-rose-800/80 shadow-lg'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              {executionResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className={`font-bold ${executionResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                {executionResult.success ? 'AST EXECUTION SUCCESS' : 'EXECUTION EXCEPTION CAPTURED'}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                Return Code: {executionResult.return_code}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {executionResult.execution_time_ms}ms
              </span>
              <span className="text-purple-400">AST: {executionResult.ast_status}</span>
            </div>
          </div>

          {/* Stdout Log */}
          {executionResult.stdout && (
            <pre className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-32 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800">
              {executionResult.stdout}
            </pre>
          )}

          {/* Stderr & Auto-Heal Trigger */}
          {executionResult.stderr && (
            <div className="space-y-2">
              <pre className="text-rose-300 text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-32 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
                {executionResult.stderr}
              </pre>
              
              <div className="flex items-center justify-between bg-rose-950/50 border border-rose-800 p-2.5 rounded-lg">
                <div className="text-[11px] text-rose-200">
                  <strong>State 6 (HEAL) Available:</strong> Run stack trace analysis and generate AST patch.
                </div>
                <button
                  id="trigger-auto-heal-action"
                  onClick={onAutoHealTrigger}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs shadow-md transition-colors"
                >
                  Apply Auto-Patch (Iteration 1/3)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
