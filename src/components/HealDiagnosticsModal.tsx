import React from 'react';
import { 
  LifeBuoy, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  X, 
  Code2,
  ShieldAlert
} from 'lucide-react';

interface HealDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: number;
  maxAttempts: number;
  errorStack: string;
  rootCause: string;
  patchApplied: string;
  onApplyPatch: () => void;
  isHealing: boolean;
}

export const HealDiagnosticsModal: React.FC<HealDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  attempt,
  maxAttempts,
  errorStack,
  rootCause,
  patchApplied,
  onApplyPatch,
  isHealing
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-400">
              <LifeBuoy className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                STATE 6 (HEAL): RECURSIVE RECOVERY ENGINE
              </h3>
              <p className="text-xs text-slate-400">
                Automated Stack Trace Analysis &bull; AST Code Patch &bull; Iteration {attempt}/{maxAttempts}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stack Trace Box */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
            <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Captured Exception Stack:</span>
            <span className="text-[10px] text-slate-400">Traceback Depth: 2</span>
          </div>
          <pre className="bg-slate-950 p-3 rounded-xl border border-rose-900/40 text-[11px] text-rose-300 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
            {errorStack || 'ZeroDivisionError: division by zero in autonomous rate calculator\nException: OSGroundingException at (0.95, 1.2) - target outside valid screen viewport.'}
          </pre>
        </div>

        {/* Root Cause Analysis */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
          <span className="text-amber-400 font-bold">Root Cause Analysis:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {rootCause || 'Unchecked division by zero during rate metric derivation, combined with out-of-bounds normalized coordinate overflow (x_max=1.04 > 1.0).'}
          </p>
        </div>

        {/* Applied AST Patch Code */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span className="flex items-center gap-1"><Code2 className="w-3.5 h-3.5" /> Synthesized AST Patch (PEP8 Clean):</span>
            <span className="text-[10px] text-emerald-500">Security Verified</span>
          </div>
          <pre className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-[11px] text-emerald-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
            {patchApplied || `def execute_safe(coords: tuple[float, float], divisor: float = 1.0):\n    # Clamped coordinate bounds [0.0, 1.0]\n    norm_x = min(1.0, max(0.0, coords[0]))\n    norm_y = min(1.0, max(0.0, coords[1]))\n    safe_divisor = divisor if abs(divisor) > 1e-9 else 1e-6\n    return {"status": "HEALED", "coords": (norm_x, norm_y), "val": (norm_x + norm_y) / safe_divisor}`}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Auto-retry limit: <strong>{maxAttempts - attempt} iterations remaining</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={onApplyPatch}
              disabled={isHealing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg shadow-lg transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isHealing ? 'animate-spin' : ''}`} />
              <span>{isHealing ? 'Compiling Patch...' : 'Apply Patch & Re-evaluate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
