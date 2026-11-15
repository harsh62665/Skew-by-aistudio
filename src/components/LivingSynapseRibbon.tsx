import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Brain, 
  Database, 
  Zap, 
  Terminal, 
  Layers, 
  CheckCircle2,
  Radio,
  ShieldAlert,
  Cpu,
  Workflow,
  Compass,
  Laptop,
  Smartphone,
  ShieldCheck,
  Settings,
  ChevronDown,
  Activity,
  FileText,
  Globe,
  Phone,
  Package
} from 'lucide-react';
import { SystemMode, SystemState, AssistantVisualState } from '../types';
import { NeuralSynthIndicator } from './NeuralSynthIndicator';
import { PWAInstallButton } from './PWAInstallButton';

export type MainStudioView =
  | 'ASSISTANT'
  | 'BROWSER'
  | 'VOICE_CALL'
  | 'APK_STUDIO'
  | 'LANGGRAPH'
  | 'AUDIT'
  | 'DUAL_ROUTER'
  | 'JARVIS_EXEC'
  | 'SKEW_ENGINE'
  | 'SKEW_ADVANCED'
  | 'SKEW_DEMON'
  | 'ANDROID_TOUCH';

interface LivingSynapseRibbonProps {
  systemState: SystemState;
  cognitiveMode: SystemMode;
  onToggleCognitiveMode: (mode: SystemMode) => void;
  visualState?: AssistantVisualState;
  isProcessing?: boolean;
  activeView: MainStudioView;
  onToggleView: (view: MainStudioView) => void;
  onOpenConnectModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
  connectedDevice: string | null;
  latencyMs?: number;
  onOpenScratchpad?: () => void;
}

export const LivingSynapseRibbon: React.FC<LivingSynapseRibbonProps> = ({
  systemState,
  cognitiveMode,
  onToggleCognitiveMode,
  visualState = 'IDLE',
  isProcessing = false,
  activeView,
  onToggleView,
  onOpenConnectModal,
  onOpenSettingsModal,
  onToggleDrawer,
  isDrawerOpen,
  connectedDevice,
  latencyMs = 124,
  onOpenScratchpad
}) => {
  const isDeepThink = cognitiveMode === 'SYSTEM_2_DELIBERATIVE';
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active cognitive phase for the bioluminescent visual cue
  const getSynapsePhase = () => {
    if (isProcessing) {
      return {
        label: 'Deep Deliberation (ToT)',
        glow: 'synapse-glow-violet',
        accentColor: '#7B2CBF',
        textColor: 'text-purple-300',
        borderColor: 'border-purple-500/40',
        bg: 'bg-purple-950/50',
        icon: Brain
      };
    }
    switch (systemState) {
      case 'SYNTHESIZE':
        return {
          label: 'AST Tool Synthesis',
          glow: 'synapse-glow-emerald',
          accentColor: '#00F5A0',
          textColor: 'text-emerald-300',
          borderColor: 'border-emerald-500/40',
          bg: 'bg-emerald-950/40',
          icon: Zap
        };
      case 'ACTUATE':
        return {
          label: 'Spatial Grounding',
          glow: 'synapse-glow-emerald',
          accentColor: '#00E5FF',
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-500/40',
          bg: 'bg-cyan-950/40',
          icon: Cpu
        };
      case 'HEAL':
        return {
          label: 'Auto-Healing Patch',
          glow: 'synapse-glow-violet',
          accentColor: '#F43F5E',
          textColor: 'text-rose-300',
          borderColor: 'border-rose-500/40',
          bg: 'bg-rose-950/40',
          icon: ShieldCheck
        };
      default:
        return {
          label: isDeepThink ? 'Neural Synapse Active' : 'Real-time Fast Route',
          glow: isDeepThink ? 'synapse-glow-violet' : 'synapse-glow-emerald',
          accentColor: isDeepThink ? '#A855F7' : '#00F5A0',
          textColor: isDeepThink ? 'text-purple-300' : 'text-emerald-400',
          borderColor: isDeepThink ? 'border-purple-500/30' : 'border-emerald-500/30',
          bg: isDeepThink ? 'bg-purple-950/30' : 'bg-emerald-950/30',
          icon: Sparkles
        };
    }
  };

  const phase = getSynapsePhase();
  const PhaseIcon = phase.icon;

  return (
    <header className="sticky top-0 z-40 w-full glass-header px-3 sm:px-6 py-2.5 transition-all">
      {/* Living Bioluminescent Sub-Ribbon Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bioluminescent-ribbon opacity-80" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: ✦ AGI CORE & Living Synapse Badge */}
        <div className="flex items-center gap-3">
          <button
            id="btn-profile-trigger"
            onClick={onOpenSettingsModal}
            title="Open SKEW Core Settings & Profile (Slide-Over)"
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-purple-600 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            <Sparkles className="w-4 h-4 text-slate-950 drop-shadow-xs" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00F5A0] border-2 border-[#0A0B10]" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettingsModal}
              className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <span className="text-[#00F5A0]">✦</span>
              <span className="font-extrabold tracking-wider">SKEW</span>
            </button>

            {/* Living Synapse Pulse Aura Badge */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-full ${phase.bg} border ${phase.borderColor} ${phase.textColor} text-[10.5px] font-mono shadow-xs backdrop-blur-md`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-ping" />
              <span className="font-medium tracking-tight">∿ Synapse Online</span>
              <span className="text-slate-500 font-mono">|</span>
              <PhaseIcon className="w-3 h-3" />
              <span className="text-[10px] hidden lg:inline">{phase.label}</span>
            </motion.div>
          </div>
        </div>

        {/* Center: Simple & Clean JARVIS Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-slate-900/90 border border-white/10 text-xs font-medium backdrop-blur-xl">
            {/* Primary Assistant View */}
            <button
              onClick={() => onToggleView('ASSISTANT')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeView === 'ASSISTANT'
                  ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-white border border-[#00F5A0]/40 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Assistant</span>
            </button>

            {/* Real Browser & Movie Downloader */}
            <button
              onClick={() => onToggleView('BROWSER')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeView === 'BROWSER'
                  ? 'bg-emerald-500/20 text-white border border-[#00F5A0]/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Real Cloud Browser & Movie Downloader"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Browser</span>
            </button>

            {/* Live Voice Call & WebRTC Dialer */}
            <button
              onClick={() => onToggleView('VOICE_CALL')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeView === 'VOICE_CALL'
                  ? 'bg-emerald-500/20 text-white border border-[#00F5A0]/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="AI Voice Call, WebRTC Call & Dialer"
            >
              <Phone className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="hidden sm:inline">Call</span>
            </button>

            {/* Compact OS Tools Dropdown */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeView !== 'ASSISTANT' && activeView !== 'BROWSER' && activeView !== 'VOICE_CALL'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="SKEW OS Studio & APK Builder"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">
                  {activeView === 'APK_STUDIO' ? 'APK Studio' :
                   activeView === 'LANGGRAPH' ? 'DAG Graph' :
                   activeView === 'DUAL_ROUTER' ? 'Dual-Router' :
                   activeView === 'SKEW_ADVANCED' ? 'Tri-Agent' :
                   activeView === 'SKEW_DEMON' ? 'Daemon' :
                   activeView === 'AUDIT' ? 'Audit' : 'Studio'}
                </span>
                <span className="sm:hidden">Studio</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showToolsMenu ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
              </button>

              {/* OS Studio Dropdown Menu */}
              <AnimatePresence>
                {showToolsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl glass-dock border border-white/10 p-2 shadow-2xl z-50 space-y-1"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center justify-between">
                      <span>SKEW OS Studio</span>
                      <span className="text-emerald-400">Level-4</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('APK_STUDIO');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'APK_STUDIO'
                          ? 'bg-emerald-950/80 text-[#00F5A0] border border-[#00F5A0]/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Package className="w-4 h-4 text-[#00F5A0]" />
                      <div>
                        <div className="font-medium">Android APK &amp; Install</div>
                        <div className="text-[10px] text-slate-500">WebAPK install &amp; Capacitor .zip export</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('ANDROID_TOUCH');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'ANDROID_TOUCH'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-medium">Android Touch & Gaming</div>
                        <div className="text-[10px] text-slate-500">Human touch, PIN unlock & GitHub relay</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('LANGGRAPH');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'LANGGRAPH'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Workflow className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-medium">LangGraph DAG</div>
                        <div className="text-[10px] text-slate-500">Tree-of-Thought DAG state machine</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('SKEW_ADVANCED');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'SKEW_ADVANCED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-[#00F5A0]" />
                      <div>
                        <div className="font-medium">Tri-Agent Consensus</div>
                        <div className="text-[10px] text-slate-500">Planner &bull; Coder &bull; Critic Safety</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('DUAL_ROUTER');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'DUAL_ROUTER'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-medium">Dual-Router Dispatch</div>
                        <div className="text-[10px] text-slate-500">System-1 Fast &bull; System-2 Deliberative</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('SKEW_DEMON');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'SKEW_DEMON'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-medium">SKEW-DEMON Background</div>
                        <div className="text-[10px] text-slate-500">Proactive ambient system monitor</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleView('AUDIT');
                        setShowToolsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeView === 'AUDIT'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-medium">Production Audit Suite</div>
                        <div className="text-[10px] text-slate-500">Automated verification testbench</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Clean Cognitive Mode Pill */}
          <div className="hidden md:flex items-center gap-1 p-0.5 rounded-full bg-slate-900/90 border border-white/10 text-xs font-medium">
            <button
              onClick={() => onToggleCognitiveMode('SYSTEM_1_FAST')}
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                !isDeepThink
                  ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Real-time fast execution mode"
            >
              <Zap className="w-3 h-3 text-[#00F5A0]" />
              <span>Fast</span>
            </button>
            <button
              onClick={() => onToggleCognitiveMode('SYSTEM_2_DELIBERATIVE')}
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                isDeepThink
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-500/40 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Deliberative multi-step reasoning"
            >
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Deep Reason</span>
            </button>
          </div>
        </div>

        {/* Right: Install App / Audio Synth / Drawer & Settings */}
        <div className="flex items-center gap-2">
          <PWAInstallButton onOpenApkStudio={() => onToggleView('APK_STUDIO')} compact />

          {/* Ambient Neural Pulse Audio Synthesizer */}
          <NeuralSynthIndicator 
            systemState={systemState} 
            visualState={visualState} 
          />

          {onOpenScratchpad && (
            <button
              onClick={onOpenScratchpad}
              title="Open Native Working Scratchpad & Notes (100% offline & persistent)"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full glass-pill text-xs font-medium text-purple-300 hover:text-white hover:border-purple-500/40 transition-all border border-purple-500/20 bg-purple-950/30 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Scratchpad</span>
            </button>
          )}

          <button
            onClick={onOpenConnectModal}
            title={connectedDevice ? `Connected: ${connectedDevice}` : 'Connect Device'}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full glass-pill text-xs font-medium text-slate-300 hover:text-white transition-all border border-white/10"
          >
            <Laptop className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">
              {connectedDevice ? connectedDevice : 'Connect'}
            </span>
            {connectedDevice && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
            )}
          </button>

          <button
            onClick={onToggleDrawer}
            title={isDrawerOpen ? 'Close Developer Drawer' : 'Open Developer Logs & AST Sandbox'}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isDrawerOpen
                ? 'bg-[#00F5A0] text-slate-950 font-bold shadow-md shadow-[#00F5A0]/20'
                : 'glass-pill text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Trace</span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            title="System Settings"
            className="p-1.5 rounded-full glass-pill text-slate-400 hover:text-white border border-white/10"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
