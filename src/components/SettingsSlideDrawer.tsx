import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  MessageSquare, 
  RotateCcw, 
  Bot, 
  Key, 
  Sliders, 
  History, 
  ShieldAlert,
  Volume2,
  Play
} from 'lucide-react';
import { SystemMode } from '../types';
import { 
  AssistantVoiceId, 
  getSelectedVoiceId, 
  setSelectedVoiceId, 
  testVoice 
} from '../utils/voiceSelector';

interface SettingsSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cognitiveMode?: SystemMode;
  onToggleCognitiveMode?: (mode: SystemMode) => void;
  assistantName?: string;
  onUpdateAssistantName?: (name: string) => void;
  onLoadSession?: (sessionId: string) => void;
}

interface StoredConfig {
  assistantName: string;
  primaryEngine: string;
  geminiKey: string;
  groqKey: string;
  ambientDaemon: boolean;
  voiceLowLatency: boolean;
  dockerSandbox: boolean;
}

const DEFAULT_CONFIG: StoredConfig = {
  assistantName: 'SKEW',
  primaryEngine: 'Gemini 2.5 Flash',
  geminiKey: '',
  groqKey: '',
  ambientDaemon: true,
  voiceLowLatency: true,
  dockerSandbox: true,
};

interface ChatSession {
  id: string;
  title: string;
  time: string;
}

const INITIAL_SESSIONS: ChatSession[] = [
  { id: '1', title: 'OS Automation Task & Click', time: '2h ago' },
  { id: '2', title: 'Real-Time Stock Query (NVDA)', time: 'Yesterday' },
  { id: '3', title: 'Macro Synthesis & Python Tool', time: '2 days ago' },
  { id: '4', title: 'Tri-Agent Self-Debate Plan', time: '4 days ago' },
];

export const SettingsSlideDrawer: React.FC<SettingsSlideDrawerProps> = ({
  isOpen,
  onClose,
  assistantName = 'SKEW',
  onUpdateAssistantName,
  onLoadSession,
}) => {
  const [config, setConfig] = useState<StoredConfig>(() => {
    try {
      const saved = localStorage.getItem('skew_settings_config');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('skew_recent_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SESSIONS;
  });

  const [selectedVoice, setSelectedVoice] = useState<AssistantVoiceId>(() => getSelectedVoiceId());

  // Listen for voice updates across components
  useEffect(() => {
    const handleVoiceChange = (e: any) => {
      const v = e.detail?.voiceId;
      if (v === 'VOICE_1' || v === 'VOICE_2') {
        setSelectedVoice(v);
      }
    };
    window.addEventListener('skew:voice-changed', handleVoiceChange);
    return () => window.removeEventListener('skew:voice-changed', handleVoiceChange);
  }, []);

  const handleVoiceSelect = (voiceId: AssistantVoiceId) => {
    setSelectedVoice(voiceId);
    setSelectedVoiceId(voiceId);
  };

  // Sync assistant name if changed externally
  useEffect(() => {
    if (assistantName && assistantName !== config.assistantName) {
      setConfig(prev => ({ ...prev, assistantName }));
    }
  }, [assistantName]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateField = <K extends keyof StoredConfig>(key: K, val: StoredConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem('skew_settings_config', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (key === 'assistantName' && onUpdateAssistantName && typeof val === 'string') {
      onUpdateAssistantName(val);
    }
  };

  const handleSaveKeys = () => {
    try {
      localStorage.setItem('skew_settings_config', JSON.stringify(config));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {}
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('skew_recent_sessions', JSON.stringify(filtered));
      } catch (err) {}
      return filtered;
    });
  };

  const handleClearAllSessions = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete all stored session history permanently from browser memory?')) {
      setSessions([]);
      try {
        localStorage.setItem('skew_recent_sessions', JSON.stringify([]));
      } catch (err) {}
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setConfig(DEFAULT_CONFIG);
      setSessions(INITIAL_SESSIONS);
      try {
        localStorage.setItem('skew_settings_config', JSON.stringify(DEFAULT_CONFIG));
        localStorage.setItem('skew_recent_sessions', JSON.stringify(INITIAL_SESSIONS));
      } catch (e) {}
      if (onUpdateAssistantName) onUpdateAssistantName('SKEW');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
          />

          {/* Slide-Over Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[340px] max-w-[85vw] h-full bg-[#0B0D14]/95 backdrop-blur-xl border-r border-white/10 text-slate-200 flex flex-col shadow-2xl font-sans select-none"
          >
            {/* Header: User Profile avatar, SKEW Settings title, Close button */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-purple-600 shadow-sm">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00F5A0] border border-[#0B0D14]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">SKEW Settings</h2>
                  <p className="text-[11px] text-slate-400">Preferences & System Config</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Settings Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* SECTION 1: IDENTITY & ENGINE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Identity & Engine</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Assistant Name</label>
                  <input
                    type="text"
                    value={config.assistantName}
                    onChange={(e) => updateField('assistantName', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                    placeholder="SKEW"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Model Engine</label>
                  <select
                    value={config.primaryEngine}
                    onChange={(e) => updateField('primaryEngine', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Recommended)</option>
                    <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
                    <option value="Groq Llama 3.3 70B">Groq (Llama 3.3 70B Fast)</option>
                  </select>
                </div>
              </div>

              {/* SECTION 2: API VAULT (SIMPLIFIED) */}
              <div className="space-y-3 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>API Keys</span>
                </div>

                <div className="space-y-2">
                  {/* Gemini Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Gemini API Key</span>
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showGeminiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showGeminiKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={config.geminiKey}
                      onChange={(e) => updateField('geminiKey', e.target.value)}
                      placeholder="AIzaSy... (Managed or Custom)"
                      className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none"
                    />
                  </div>

                  {/* Groq Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Groq API Key</span>
                      <button
                        type="button"
                        onClick={() => setShowGroqKey(!showGroqKey)}
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showGroqKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showGroqKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      value={config.groqKey}
                      onChange={(e) => updateField('groqKey', e.target.value)}
                      placeholder="gsk_... (Optional Failover)"
                      className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveKeys}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saveSuccess ? 'Saved to LocalStorage!' : 'Save Keys'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3: RECENT CONVERSATIONS (CHATGPT-STYLE) */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    Recent Sessions
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-normal normal-case">{sessions.length} items</span>
                    {sessions.length > 0 && (
                      <button
                        onClick={handleClearAllSessions}
                        className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase font-mono cursor-pointer"
                        title="Clear all stored sessions"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  {sessions.length > 0 ? (
                    sessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => {
                          if (onLoadSession) onLoadSession(sess.id);
                          onClose();
                        }}
                        className="group flex items-center justify-between p-2 rounded-lg bg-black/30 hover:bg-white/5 border border-white/5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                          <span className="truncate">{sess.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-500">{sess.time}</span>
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                            title="Delete session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-black/20 rounded-lg">
                      No recent conversations
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: DUPLEX VOICE SELECTION (1, 2) */}
              <div className="space-y-2.5 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    Voice Selection
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-medium">
                    {selectedVoice === 'VOICE_1' ? 'Active: Voice 1' : 'Active: Voice 2'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Voice 1: JARVIS */}
                  <button
                    type="button"
                    onClick={() => handleVoiceSelect('VOICE_1')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVoice === 'VOICE_1'
                        ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 shadow-sm shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${selectedVoice === 'VOICE_1' ? 'bg-[#00F5A0] animate-pulse' : 'bg-slate-600'}`} />
                        Voice 1
                      </span>
                      {selectedVoice === 'VOICE_1' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-[11px] font-medium text-cyan-300 mt-1">JARVIS</div>
                    <div className="text-[10px] text-slate-400">British Butler (Male)</div>
                  </button>

                  {/* Voice 2: FRIDAY */}
                  <button
                    type="button"
                    onClick={() => handleVoiceSelect('VOICE_2')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVoice === 'VOICE_2'
                        ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-sm shadow-purple-950/50 ring-1 ring-purple-500/40'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${selectedVoice === 'VOICE_2' ? 'bg-[#00F5A0] animate-pulse' : 'bg-slate-600'}`} />
                        Voice 2
                      </span>
                      {selectedVoice === 'VOICE_2' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <div className="text-[11px] font-medium text-purple-300 mt-1">FRIDAY</div>
                    <div className="text-[10px] text-slate-400">Cybernetic (Female)</div>
                  </button>
                </div>

                {/* Quick Voice Sample Test Button */}
                <button
                  type="button"
                  onClick={() => testVoice(selectedVoice)}
                  className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
                  <span>Test {selectedVoice === 'VOICE_1' ? 'Voice 1 (JARVIS)' : 'Voice 2 (FRIDAY)'} Sample</span>
                </button>
              </div>

              {/* SECTION 5: PREFERENCES & TOGGLES */}
              <div className="space-y-3 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preferences</span>
                </div>

                <div className="space-y-2">
                  {/* Ambient Daemon */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-slate-200">Ambient Daemon</div>
                      <div className="text-[10px] text-slate-500">Background clipboard watcher</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.ambientDaemon}
                      onChange={(e) => updateField('ambientDaemon', e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </label>

                  {/* Voice Low-Latency */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-slate-200">Voice Low-Latency</div>
                      <div className="text-[10px] text-slate-500">Stream 10-15 word chunks</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.voiceLowLatency}
                      onChange={(e) => updateField('voiceLowLatency', e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </label>

                  {/* Docker Sandbox */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-slate-200">Docker Sandbox</div>
                      <div className="text-[10px] text-slate-500">Isolated code AST execution</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.dockerSandbox}
                      onChange={(e) => updateField('dockerSandbox', e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Footer: Reset Config & Wipe All Data */}
            <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">v4.2 • Safe Sandbox</span>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (window.confirm('PERMANENT DATA WIPE: Delete all sessions, chat history, API keys, and memory caches from browser storage?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Purge all local storage data permanently"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>Purge All Data</span>
                </button>

                <button
                  onClick={handleResetConfig}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Config</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
