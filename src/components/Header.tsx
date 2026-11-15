import React from 'react';
import { 
  Sparkles, 
  Terminal, 
  Settings, 
  Laptop, 
  CheckCircle2, 
  Zap, 
  Brain, 
  ShieldCheck,
  Radio,
  Workflow,
  MessageSquare,
  Compass,
  BrainCircuit,
  Cpu
} from 'lucide-react';
import { SystemMode, SystemState } from '../types';

interface HeaderProps {
  onOpenConnectModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
  connectedDevice: string | null;
  cognitiveMode: SystemMode;
  onToggleCognitiveMode: (mode: SystemMode) => void;
  currentState: SystemState;
  activeView?: 'ASSISTANT' | 'LANGGRAPH' | 'AUDIT' | 'DUAL_ROUTER' | 'JARVIS_EXEC' | 'SKEW_ENGINE' | 'SKEW_ADVANCED';
  onToggleView?: (view: 'ASSISTANT' | 'LANGGRAPH' | 'AUDIT' | 'DUAL_ROUTER' | 'JARVIS_EXEC' | 'SKEW_ENGINE' | 'SKEW_ADVANCED') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConnectModal,
  onOpenSettingsModal,
  onToggleDrawer,
  isDrawerOpen,
  connectedDevice,
  cognitiveMode,
  onToggleCognitiveMode,
  currentState,
  activeView = 'ASSISTANT',
  onToggleView
}) => {
  const isDeepThink = cognitiveMode === 'SYSTEM_2_DELIBERATIVE';

  return (
    <header className="sticky top-0 z-40 w-full glass-header px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo & Status Pill */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-cyan-300 shadow-md shadow-pink-200/50">
            <Sparkles className="w-4 h-4 text-white drop-shadow-sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-800">
              ULTRON
            </span>
            
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-[11px] font-medium text-emerald-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Core: Ready</span>
            </div>
          </div>
        </div>

        {/* Center / View Selector & Cognitive Mode */}
        <div className="flex items-center gap-2">
          {onToggleView && (
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-slate-100/90 border border-slate-200/70 text-xs text-slate-600 font-medium">
              <button
                onClick={() => onToggleView('ASSISTANT')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'ASSISTANT'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
                <span>Assistant</span>
              </button>
              <button
                onClick={() => onToggleView('LANGGRAPH')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'LANGGRAPH'
                    ? 'bg-slate-900 text-cyan-300 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-cyan-500" />
                <span className="hidden sm:inline">LangGraph DAG</span>
                <span className="sm:hidden">DAG</span>
              </button>
              <button
                onClick={() => onToggleView('DUAL_ROUTER')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'DUAL_ROUTER'
                    ? 'bg-gradient-to-r from-indigo-900 to-slate-900 text-pink-300 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">Dual-Router</span>
                <span className="sm:hidden">Router</span>
              </button>
              <button
                onClick={() => onToggleView('JARVIS_EXEC')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'JARVIS_EXEC'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-pink-300" />
                <span className="hidden sm:inline">JARVIS-Exec</span>
                <span className="sm:hidden">Exec</span>
              </button>
              <button
                onClick={() => onToggleView('SKEW_ENGINE')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'SKEW_ENGINE'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">SKEW Engine</span>
                <span className="sm:hidden">SKEW</span>
              </button>
              <button
                onClick={() => onToggleView('SKEW_ADVANCED')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'SKEW_ADVANCED'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Advanced</span>
                <span className="sm:hidden">Adv</span>
              </button>
              <button
                onClick={() => onToggleView('AUDIT')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeView === 'AUDIT'
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Production Audit</span>
                <span className="sm:hidden">Audit</span>
              </button>
            </div>
          )}

          {/* Deep Think switch */}
          <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs text-slate-600 font-medium">
            <button
              onClick={() => onToggleCognitiveMode('SYSTEM_1_FAST')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                !isDeepThink
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Fast</span>
            </button>
            <button
              onClick={() => onToggleCognitiveMode('SYSTEM_2_DELIBERATIVE')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                isDeepThink
                  ? 'bg-white text-violet-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-violet-500" />
              <span>ToT (Deep)</span>
            </button>
          </div>
        </div>

        {/* Right Side: Connect Device, Terminal Drawer Toggle, Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connect Device Pill */}
          <button
            id="connect-device-header-btn"
            onClick={onOpenConnectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-medium text-slate-700 hover:text-slate-900 transition-all border border-slate-200/70"
          >
            <Laptop className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {connectedDevice ? connectedDevice : 'Connect Device'}
            </span>
            {connectedDevice && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Developer Drawer / Terminal Logs Toggle */}
          <button
            id="toggle-developer-drawer-btn"
            onClick={onToggleDrawer}
            title={isDrawerOpen ? 'Close Developer Drawer' : 'Open Developer Logs & AST Sandbox'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isDrawerOpen
                ? 'bg-slate-900 text-white shadow-sm'
                : 'glass-pill text-slate-700 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logs & Code</span>
          </button>

          {/* Settings Button */}
          <button
            id="settings-header-btn"
            onClick={onOpenSettingsModal}
            title="System Settings"
            className="p-1.5 rounded-full glass-pill text-slate-600 hover:text-slate-900 border border-slate-200/70"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
