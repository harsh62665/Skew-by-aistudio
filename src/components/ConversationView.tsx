import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Play, 
  Crosshair, 
  Calendar, 
  Code2, 
  Flame, 
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Database,
  Layers,
  ArrowRight,
  Workflow,
  Compass,
  Globe,
  Volume2,
  VolumeX,
  Zap,
  Cpu,
  Target,
  TerminalSquare,
  Activity,
  ShieldAlert,
  BellRing,
  Loader2,
  Terminal,
  Trash2,
  ExternalLink,
  Search,
  ArrowUpRight,
  Youtube,
  Shield,
  Bot,
  Smartphone,
  Calculator
} from 'lucide-react';
import { AssistantMessage, SystemMode } from '../types';
import { executeOpenUrl, speakTextAloud } from '../utils/commandInterceptor';
import { AssistantVoiceId } from '../utils/voiceSelector';
import { MainStudioView } from './LivingSynapseRibbon';

interface ConversationViewProps {
  messages: AssistantMessage[];
  isProcessing?: boolean;
  onOpenDrawer: (tab?: 'LOGS' | 'MEMORY' | 'SANDBOX' | 'GROUNDING' | 'LANGGRAPH' | 'JSON') => void;
  onExecuteCode?: (code: string) => void;
  onTriggerFault?: () => void;
  onDeleteMessage?: (id: string) => void;
  onClearAllMessages?: () => void;
  onSendMessage?: (text: string) => void;
  onNavigateView?: (view: MainStudioView) => void;
  selectedPersona?: 'JARVIS_PRIME' | 'SKEW_AUTONOMOUS' | 'HUMAN_REALISTIC';
  onSelectPersona?: (persona: 'JARVIS_PRIME' | 'SKEW_AUTONOMOUS' | 'HUMAN_REALISTIC') => void;
  selectedVoice?: AssistantVoiceId;
  onToggleVoiceSelection?: () => void;
  onOpenScratchpad?: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  isProcessing = false,
  onOpenDrawer,
  onExecuteCode,
  onTriggerFault,
  onDeleteMessage,
  onClearAllMessages,
  onSendMessage,
  onNavigateView,
  selectedPersona = 'JARVIS_PRIME',
  onSelectPersona,
  selectedVoice = 'VOICE_1',
  onToggleVoiceSelection,
  onOpenScratchpad
}) => {
  const [expandedTraceIds, setExpandedTraceIds] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth auto-scroll whenever new messages arrive or processing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const toggleTrace = (id: string) => {
    setExpandedTraceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyMessageText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleSpeak = (text: string, id: string) => {
    if (speakingMsgId === id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
    } else {
      speakTextAloud(text);
      setSpeakingMsgId(id);
      // Automatically reset speech indicator after realistic speech time
      const estimatedDurationMs = Math.min(Math.max((text.length / 14) * 1000, 3000), 20000);
      setTimeout(() => {
        setSpeakingMsgId(curr => (curr === id ? null : curr));
      }, estimatedDurationMs);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 px-4 py-3">
      {/* Sleek Minimalist JARVIS HUD Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-[#00F5A0] via-cyan-400 to-purple-600 flex items-center justify-center text-slate-950 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono tracking-wider text-white">SKEW // COGNITIVE CORE</span>
            <span className="flex items-center gap-1 text-[10.5px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Minimalist Persona Pill & Clear */}
        <div className="flex items-center gap-2">
          {onSelectPersona && (
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-slate-900/90 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => onSelectPersona('JARVIS_PRIME')}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                  selectedPersona === 'JARVIS_PRIME'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tactical British-toned Stark AI Butler"
              >
                JARVIS
              </button>
              <button
                type="button"
                onClick={() => onSelectPersona('SKEW_AUTONOMOUS')}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                  selectedPersona === 'SKEW_AUTONOMOUS'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cybernetic OS Grounding & Terminal Execution"
              >
                SKEW
              </button>
              <button
                type="button"
                onClick={() => onSelectPersona('HUMAN_REALISTIC')}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                  selectedPersona === 'HUMAN_REALISTIC'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ultra-realistic human conversational co-pilot"
              >
                Human
              </button>
            </div>
          )}

          {/* Quick Voice 1 / Voice 2 Toggle */}
          {onToggleVoiceSelection && (
            <button
              type="button"
              onClick={onToggleVoiceSelection}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 transition-all cursor-pointer"
              title="Click to toggle Voice 1 (JARVIS Male) vs Voice 2 (FRIDAY Female)"
            >
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span className={selectedVoice === 'VOICE_2' ? 'text-purple-300 font-medium' : 'text-cyan-300 font-medium'}>
                {selectedVoice === 'VOICE_2' ? 'Voice 2' : 'Voice 1'}
              </span>
            </button>
          )}

          {onClearAllMessages && messages.length > 0 && (
            <button
              onClick={onClearAllMessages}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer text-[11px]"
              title="Clear all chat history"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {messages.map((msg, index) => {
          const isAssistant = msg.sender === 'assistant';
          const isTraceOpen = !!expandedTraceIds[msg.id];

          // Determine whether this message has technical execution traces to disclose
          const hasTechnicalTrace = isAssistant && (
            (msg.ragContextSources && msg.ragContextSources.length > 0) ||
            (msg.memoryCommit && msg.memoryCommit.memory_action !== 'NONE') ||
            msg.jarvisProtocol ||
            msg.jarvisExec ||
            msg.skewEngine ||
            msg.skewAdvanced ||
            (msg.totBranches && msg.totBranches.length > 0) ||
            msg.spatialAction ||
            msg.codeSnippet ||
            msg.scheduledTask
          );

          return (
            <motion.div 
              key={msg.id} 
              layout
              initial={{ opacity: 0, y: 14, scale: 0.99, height: 'auto' }}
              animate={{ opacity: 1, y: 0, scale: 1, height: 'auto', marginBottom: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 0.96,
                y: -6,
                height: 0,
                marginBottom: 0,
                marginTop: 0,
                paddingTop: 0,
                paddingBottom: 0,
                overflow: 'hidden',
                transition: {
                  opacity: { duration: 0.18, ease: 'easeOut' },
                  scale: { duration: 0.2, ease: 'easeOut' },
                  y: { duration: 0.2 },
                  height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  marginTop: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  marginBottom: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
              }}
              transition={{ 
                duration: 0.35, 
                ease: [0.16, 1, 0.3, 1], 
                delay: index === messages.length - 1 ? 0.05 : 0,
                layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              }}
              className={`flex flex-col space-y-2 group origin-top ${
                isAssistant ? 'items-start' : 'items-end'
              }`}
            >
              {/* Micro-Meta Header with Delete Button */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 font-mono tracking-tight w-full justify-between">
                <div className={`flex items-center gap-2 ${!isAssistant ? 'ml-auto' : ''}`}>
                  {isAssistant ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#00F5A0] to-cyan-500 flex items-center justify-center text-slate-950">
                        {msg.assistantPersona === 'HUMAN_REALISTIC' ? (
                          <Bot className="w-2 h-2 text-slate-950" />
                        ) : msg.assistantPersona === 'SKEW_AUTONOMOUS' ? (
                          <Zap className="w-2 h-2 text-slate-950" />
                        ) : (
                          <Shield className="w-2 h-2 text-slate-950" />
                        )}
                      </div>
                      <span className="text-slate-200 font-semibold font-sans">
                        {msg.assistantPersona === 'HUMAN_REALISTIC' 
                          ? 'SKEW (Human Mode)' 
                          : msg.assistantPersona === 'SKEW_AUTONOMOUS'
                          ? 'SKEW Core'
                          : 'SKEW (JARVIS)'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono">
                        Level-4
                      </span>
                      {msg.mode === 'SYSTEM_2_DELIBERATIVE' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[9px]">
                          ToT DAG
                        </span>
                      )}
                      {msg.memoryCommit && msg.memoryCommit.memory_action !== 'NONE' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[9px] flex items-center gap-1">
                          <Database className="w-2.5 h-2.5" /> Vector Synced
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400 font-sans">You</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <User className="w-2 h-2" />
                      </div>
                    </>
                  )}
                  <span className="text-slate-600">&bull; {msg.timestamp}</span>
                </div>

                {/* Individual Message Delete Button on Hover */}
                {onDeleteMessage && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-600 transition-opacity p-1 rounded-md hover:bg-white/5 cursor-pointer"
                    title="Delete this message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* User Attachment Pill */}
              {msg.attachment && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium">{msg.attachment.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({msg.attachment.size})</span>
                </div>
              )}

              {/* Main Content Fluid Card */}
              <div 
                className={`w-full max-w-2xl text-[14px] sm:text-[14.5px] leading-relaxed transition-all ${
                  isAssistant
                    ? 'glass-card rounded-2xl p-5 text-slate-200 border border-white/10 shadow-xl'
                    : 'bg-gradient-to-r from-slate-900 to-slate-800/90 text-white p-4 sm:p-5 rounded-2xl rounded-tr-sm border border-white/10 shadow-md ml-auto max-w-xl'
                }`}
              >
                {/* Clean Conversational Text */}
                <div className="whitespace-pre-line font-sans leading-relaxed text-slate-200">
                  {msg.text}
                </div>

                {/* Assistant Message Quick Toolbar: Copy & Speak */}
                {isAssistant && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      {/* Copy message text */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessageText(msg.text, msg.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-all text-[11px] cursor-pointer"
                        title="Copy answer to clipboard"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#00F5A0]" />
                            <span className="text-[#00F5A0] font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Listen aloud / text-to-speech */}
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(msg.text, msg.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-[11px] cursor-pointer ${
                          speakingMsgId === msg.id
                            ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 animate-pulse'
                            : 'bg-white/5 hover:bg-white/10 hover:text-white border-white/5'
                        }`}
                        title={speakingMsgId === msg.id ? "Stop reading aloud" : "Read aloud with voice"}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-cyan-400" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      {msg.omniCoreTelemetry?.engineTier || 'Level-4'}
                    </span>
                  </div>
                )}

                {/* Smart Client-Side Quick Action Button (YouTube, Google, Search, Mobile Actuator, etc.) */}
                {isAssistant && msg.quickAction && (
                  <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2">
                    {msg.quickAction.type === 'VIEW_SWITCH' && msg.quickAction.viewTarget ? (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-cyan-950/40 to-slate-900 border border-[#00F5A0]/30 shadow-lg shadow-[#00F5A0]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00F5A0]/20 border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-sm">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span>{msg.quickAction.label}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Target Stage: {msg.quickAction.viewTarget}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateView && msg.quickAction?.viewTarget) {
                              onNavigateView(msg.quickAction.viewTarget as any);
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00F5A0] hover:bg-[#00e092] text-slate-950 transition-all shadow-md shadow-[#00F5A0]/20 cursor-pointer group"
                        >
                          <span>Launch Stage</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    ) : msg.quickAction.type === 'SEARCH' && msg.quickAction.targetUrl ? (
                      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                            <Search className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span>Google Search Ready</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                              {msg.quickAction.label}
                            </div>
                          </div>
                        </div>

                        <a
                          href={msg.quickAction.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00F5A0] hover:bg-[#00e092] text-slate-950 transition-all shadow-md shadow-[#00F5A0]/20 cursor-pointer"
                        >
                          <span>Open Google</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : msg.quickAction.targetUrl ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={msg.quickAction.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:via-teal-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer group"
                        >
                          {msg.quickAction.targetUrl.includes('youtube.com') ? (
                            <Youtube className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          )}
                          <span>↗ {msg.quickAction.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400/70 ml-1 opacity-70 group-hover:opacity-100" />
                        </a>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Native Math & Unit Conversion Calculation Card */}
                {isAssistant && msg.calculationResult && (
                  <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-emerald-950/30 border border-cyan-500/40 shadow-lg shadow-cyan-950/20">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        <Calculator className="w-4 h-4 text-cyan-400" />
                        <span>Native Calculation Engine</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] font-mono border border-[#00F5A0]/40">
                        100% In-App Evaluator
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div className="text-xs text-slate-400 font-mono">
                        {msg.calculationResult.expression} =
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-[#00F5A0] tracking-tight">
                        {msg.calculationResult.result}
                      </div>
                    </div>
                    {msg.calculationResult.steps && msg.calculationResult.steps.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] text-slate-400 font-mono space-y-1">
                        {msg.calculationResult.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Native Working Scratchpad Note Confirmation Card */}
                {isAssistant && msg.scratchpadNoteSaved && (
                  <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-500/40 shadow-lg shadow-purple-950/20">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Working Scratchpad Note Stored</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/40">
                        Local Persistent
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      {msg.scratchpadNoteSaved.title}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                      {msg.scratchpadNoteSaved.content}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Saved: {msg.scratchpadNoteSaved.timestamp}
                      </span>
                      {onOpenScratchpad && (
                        <button
                          type="button"
                          onClick={onOpenScratchpad}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <span>Open Scratchpad</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* YouTube Semantic Memory Search Card */}
                {isAssistant && msg.youtubeSemanticSearch && (
                  <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-rose-950/30 border border-red-500/40 shadow-xl shadow-red-950/20">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                        <Youtube className="w-4 h-4 text-red-500 fill-red-500/20" />
                        <span>YouTube Semantic Video Retrieval</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-rose-300 font-mono border border-red-500/40">
                        {msg.youtubeSemanticSearch.identifiedElements?.category || 'Memory Decoded'}
                      </span>
                    </div>

                    {/* Vague Memory & Elements Breakdown */}
                    <div className="mb-3 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-red-400" />
                        <span>Decoded from your memory cues:</span>
                        <span className="text-slate-300 italic font-sans">&quot;{msg.youtubeSemanticSearch.originalDescription}&quot;</span>
                      </div>

                      {/* Identified Elements Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {msg.youtubeSemanticSearch.identifiedElements?.actors?.map((actor, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300">
                            👤 {actor}
                          </span>
                        ))}
                        {msg.youtubeSemanticSearch.identifiedElements?.action?.map((act, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-emerald-300">
                            ⚡ {act}
                          </span>
                        ))}
                        {msg.youtubeSemanticSearch.identifiedElements?.setting?.map((set, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-purple-300">
                            📍 {set}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Synthesized Query Display Box */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Synthesized Search Query</span>
                        <div className="text-sm font-bold font-mono text-[#00F5A0] truncate">
                          {msg.youtubeSemanticSearch.synthesizedQuery}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <a
                          href={msg.youtubeSemanticSearch.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Open on YouTube</span>
                          <ExternalLink className="w-3 h-3 opacity-75" />
                        </a>
                      </div>
                    </div>

                    {/* Alternative Search Angles */}
                    {msg.youtubeSemanticSearch.alternativeQueries && msg.youtubeSemanticSearch.alternativeQueries.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/5">
                        <span className="text-[10px] font-mono text-slate-400 block mb-1.5">Alternative Search Angles:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {msg.youtubeSemanticSearch.alternativeQueries.map((altQuery, idx) => (
                            <a
                              key={idx}
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(altQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{altQuery}</span>
                              <ArrowUpRight className="w-2.5 h-2.5 text-slate-500" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Better-Than-Thinking: Elegant Collapsible Neural Thought Process */}
                {isAssistant && hasTechnicalTrace && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTrace(msg.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                        isTraceOpen
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs font-semibold'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <Brain className={`w-3.5 h-3.5 ${isTraceOpen ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{isTraceOpen ? 'Hide Thought Process' : 'View Thought Process'}</span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        ({msg.reasoningSteps?.length || (msg.codeSnippet ? 3 : 2)} steps)
                      </span>
                      {isTraceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Critic Approved</span>
                    </span>
                  </div>
                )}

                {/* Progressive Disclosure: Clean Holographic Thought Box */}
                {isAssistant && isTraceOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3 font-sans text-xs shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold text-white">SKEW NEURAL DELIBERATION</span>
                        </div>
                        <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          Consensus Verified
                        </span>
                      </div>

                      {/* Clean Sequential Deliberation Steps */}
                      <div className="space-y-1.5 text-xs text-slate-300">
                        {msg.reasoningSteps && msg.reasoningSteps.length > 0 ? (
                          msg.reasoningSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 py-0.5">
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="text-slate-300 leading-snug">{step}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-start gap-2 py-0.5">
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="text-slate-300">Deconstructed user intent and verified system state.</span>
                            </div>
                            <div className="flex items-start gap-2 py-0.5">
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="text-slate-300">Audited via Critic Safety Agent with zero execution violations.</span>
                            </div>
                            <div className="flex items-start gap-2 py-0.5">
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="text-slate-300">Synthesized contextual natural language response.</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Python Code Box if Synthesized */}
                      {msg.codeSnippet && (
                        <div className="p-3 rounded-xl bg-[#07090e] border border-white/10 space-y-2 font-mono">
                          <div className="flex items-center justify-between text-emerald-300 font-semibold text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-[#00F5A0]" />
                              Synthesized Python Script
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopy(msg.codeSnippet!.code, msg.id)}
                                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                              >
                                {copiedCodeId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedCodeId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>
                              {onExecuteCode && (
                                <button
                                  onClick={() => onExecuteCode(msg.codeSnippet!.code)}
                                  className="px-2 py-0.5 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 text-[10px] flex items-center gap-1 hover:bg-[#00F5A0]/30 cursor-pointer"
                                >
                                  <Play className="w-2.5 h-2.5" /> Run Sandbox
                                </button>
                              )}
                            </div>
                          </div>
                          <pre className="p-2.5 rounded-lg bg-black/60 text-slate-300 text-[11px] overflow-x-auto max-h-40 leading-relaxed">
                            <code>{msg.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}

                      {/* Spatial Actuation Target */}
                      {msg.spatialAction && (
                        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between text-cyan-300 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Crosshair className="w-3 h-3 text-cyan-400" />
                            Target: {msg.spatialAction.elementName} ({msg.spatialAction.coordinates.x}, {msg.spatialAction.coordinates.y})
                          </span>
                          <button
                            onClick={() => onOpenDrawer('GROUNDING')}
                            className="text-cyan-400 hover:underline text-[10.5px] cursor-pointer"
                          >
                            Inspect Viewport &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Better Than Thinking: Live Holographic JARVIS Deliberation Card */}
        {isProcessing && (
          <motion.div
            key="processing-indicator"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-start space-y-2 max-w-xl"
          >
            <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400 font-mono">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#00F5A0] via-cyan-400 to-purple-600 flex items-center justify-center text-slate-950 animate-spin">
                <Loader2 className="w-2 h-2" />
              </div>
              <span className="text-white font-semibold font-sans">SKEW</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#00F5A0]" />
                JARVIS Thinking
              </span>
            </div>

            <div className="w-full glass-card rounded-2xl p-4 text-sm border border-cyan-500/30 shadow-2xl space-y-3 relative overflow-hidden bg-slate-950/85">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-purple-500/5 animate-pulse pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white font-sans">
                    Deliberating response...
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Tri-Agent consensus &bull; RAG verification &bull; Safety audit
                  </div>
                </div>
              </div>

              {/* Shimmer Progress Line */}
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00F5A0] via-cyan-400 to-purple-500 w-3/4 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Suggestion Chips for Rapid Testing & Questions */}
      {onSendMessage && !isProcessing && (
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00F5A0]" />
            Quick:
          </span>
          {[
            { label: '🤖 Namaste JARVIS', prompt: 'Namaste! Aap kya kya kar sakte ho?' },
            { label: '⚡ Chat Reply Check', prompt: 'Bhai chat ka message ka reply check karo' },
            { label: '🐍 Python AST Tool', prompt: 'Synthesize a Python tool for high-performance memory profiling' },
            { label: '🌐 Open YouTube', prompt: 'Open YouTube' },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(chip.prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-cyan-300 transition-all cursor-pointer whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Auto-Scroll Sentinel Element */}
      <div ref={messagesEndRef} className="h-4 pointer-events-none" />
    </div>
  );
};
