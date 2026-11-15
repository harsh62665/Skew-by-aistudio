import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Brain, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  Zap, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { SystemMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cognitiveMode: SystemMode;
  onToggleCognitiveMode: (mode: SystemMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cognitiveMode,
  onToggleCognitiveMode
}) => {
  const [modelChoice, setModelChoice] = useState('Gemini 3.7 Flash (Low-Latency Reactive)');
  const [maxHealRetries, setMaxHealRetries] = useState(3);
  const [safetyGuard, setSafetyGuard] = useState(true);
  const [spatialOcrPrecision, setSpatialOcrPrecision] = useState('High (1080p)');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="glass-dock rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Agentic Core Settings</h3>
              <p className="text-xs text-slate-500">Tune cognitive deliberative reasoning and AST sandbox</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-4 text-xs text-slate-700">
          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Foundation Model Orchestrator</span>
            </label>
            <select
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-hidden font-medium"
            >
              <option>Gemini 3.7 Flash (Low-Latency Reactive)</option>
              <option>Gemini 3.1 Flash-Lite (Ultra-Fast Lightweight)</option>
              <option>SKEW Specialized Cognitive Model</option>
            </select>
          </div>

          {/* Cognitive Reasoning Mode */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-violet-500" />
              <span>Reasoning Architecture</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleCognitiveMode('SYSTEM_1_FAST')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  cognitiveMode === 'SYSTEM_1_FAST'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>System 1 (Fast)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Direct single-pass execution</div>
              </button>

              <button
                onClick={() => onToggleCognitiveMode('SYSTEM_2_DELIBERATIVE')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  cognitiveMode === 'SYSTEM_2_DELIBERATIVE'
                    ? 'bg-violet-50 border-violet-300 text-violet-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <Brain className="w-3.5 h-3.5 text-violet-500" />
                  <span>System 2 (ToT)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">3-branch DAG evaluation</div>
              </button>
            </div>
          </div>

          {/* State 6 Auto-Heal Max Attempts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                <span>State 6 Auto-Heal Max Retries</span>
              </label>
              <span className="font-bold text-slate-800">{maxHealRetries} attempts</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={maxHealRetries}
              onChange={(e) => setMaxHealRetries(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Safety Sandbox Strict Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PEP8 AST Isolation Sandbox</span>
              </div>
              <div className="text-[11px] text-slate-500">Deny unauthorized syscalls & unbonded recursion</div>
            </div>
            <input
              type="checkbox"
              checked={safetyGuard}
              onChange={(e) => setSafetyGuard(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
