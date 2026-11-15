import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Activity, 
  BatteryCharging, 
  Battery, 
  Cpu, 
  Radio, 
  Bell, 
  BellRing, 
  Copy, 
  Check, 
  Play, 
  Code2, 
  Terminal, 
  Sparkles, 
  Zap, 
  Volume2, 
  Layers, 
  Clock, 
  Calendar, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Mic, 
  FileText, 
  Sliders, 
  Send,
  Download,
  Flame,
  Globe,
  CornerDownRight,
  Database
} from 'lucide-react';
import { StrictSkewDaemonJson, SkewDaemonTriggerType, SkewDaemonTaskType } from '../types';

interface SkewDemonViewProps {
  onRunInChat?: (prompt: string) => void;
}

const PYTHON_DAEMON_SCRIPT = `import os
import time
import threading
import pyperclip
import psutil
from plyer import notification
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "YOUR_API_KEY"))

# Shared Daemon State
last_clipboard_text = ""

def trigger_desktop_notification(title: str, message: str):
    """Sends native Windows/macOS/Linux notification"""
    notification.notify(
        title=title,
        message=message,
        app_name="SKEW AI",
        timeout=5
    )

def monitor_clipboard():
    """Monitors clipboard silently in background for errors or URLs"""
    global last_clipboard_text
    while True:
        try:
            current_text = pyperclip.paste().strip()
            if current_text and current_text != last_clipboard_text:
                last_clipboard_text = current_text
                
                # Check if user copied an error stack trace
                if "Traceback" in current_text or "Error:" in current_text:
                    trigger_desktop_notification(
                        "SKEW Error Detector",
                        "Code error detected in clipboard. Click to analyze."
                    )
            time.sleep(1.0)
        except Exception:
            pass

def monitor_system_telemetry():
    """Monitors battery and hardware state periodically"""
    while True:
        battery = psutil.sensors_battery()
        if battery and not battery.power_plugged and battery.percent < 20:
            trigger_desktop_notification(
                "SKEW Battery Warning",
                f"Battery is critically low ({battery.percent}%). Connect charger."
            )
            time.sleep(300)  # Alert once every 5 minutes
        time.sleep(30)

def start_skew_background_daemon():
    # Thread 1: Clipboard Watcher
    t_clip = threading.Thread(target=monitor_clipboard, daemon=True)
    t_clip.start()

    # Thread 2: System Telemetry Watcher
    t_system = threading.Thread(target=monitor_system_telemetry, daemon=True)
    t_system.start()

    print("[SKEW Demon]: Ambient Background Daemon Active.")

if __name__ == "__main__":
    start_skew_background_daemon()
    
    # Keeps main thread alive
    while True:
        time.sleep(1)
`;

export const SkewDemonView: React.FC<SkewDemonViewProps> = ({ onRunInChat }) => {
  // Daemon Live State
  const [isDaemonActive, setIsDaemonActive] = useState<boolean>(true);
  const [selectedTrigger, setSelectedTrigger] = useState<SkewDaemonTriggerType>('CLIPBOARD_TELEMETRY');
  const [clipboardInput, setClipboardInput] = useState<string>(
    "Traceback (most recent call last):\n  File 'main.py', line 42, in <module>\nTypeError: 'NoneType' object is not subscriptable"
  );
  const [activeApp, setActiveApp] = useState<string>('VS Code (Python Workspace)');
  const [batteryLevel, setBatteryLevel] = useState<number>(18);
  const [cpuLoad, setCpuLoad] = useState<number>(94);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Active Toast Alert State
  const [activeToast, setActiveToast] = useState<{
    title: string;
    body: string;
    type: 'URGENT' | 'INFO' | 'SUCCESS';
    time: string;
  } | null>(null);

  // JSON Dispatch Response
  const [dispatchData, setDispatchData] = useState<StrictSkewDaemonJson>({
    daemon_telemetry: {
      active_identity: 'SKEW',
      trigger_type: 'CLIPBOARD_TELEMETRY',
      proaction_threshold: 0.88,
      should_interrupt_user: true
    },
    background_action: {
      task_type: 'SYSTEM_NOTIFY',
      notification_title: 'SKEW Error Detector',
      notification_body: 'Code error detected in clipboard. Click to analyze.',
      target_command: 'python -m skew.diagnostics --clipboard-traceback'
    },
    tts_voice_chime: [
      'Stack trace error detected in clipboard. AST repair routine ready.'
    ]
  });

  // Synthesize crisp audio chime via Web Audio API
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Bell 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Bell 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.08);
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio chime error', e);
    }
  };

  // Dispatch trigger event to backend
  const handleDispatchTrigger = async (typeOverride?: SkewDaemonTriggerType) => {
    const trigger = typeOverride || selectedTrigger;
    setIsProcessing(true);

    let payloadToSend = clipboardInput;
    if (trigger === 'WAKE_WORD_AUDIO') {
      payloadToSend = 'Hey SKEW, inspect current IDE error and run git status';
    } else if (trigger === 'PROACTIVE_SCHEDULER') {
      payloadToSend = 'Calendar Alarm: Architecture Review in 10 minutes';
    } else if (trigger === 'OS_TELEMETRY_ALERT') {
      payloadToSend = `Battery: ${batteryLevel}%, CPU: ${cpuLoad}%`;
    }

    try {
      const res = await fetch('/api/skew/daemon-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_type: trigger,
          payload: payloadToSend,
          active_app: activeApp,
          battery_level: batteryLevel,
          cpu_load: cpuLoad
        })
      });

      const data: StrictSkewDaemonJson = await res.json();
      setDispatchData(data);

      // If proaction threshold >= 0.70, trigger chime and toast!
      if (data.daemon_telemetry.should_interrupt_user && data.background_action.notification_title) {
        playChime();
        setActiveToast({
          title: data.background_action.notification_title,
          body: data.background_action.notification_body || 'Action required',
          type: data.daemon_telemetry.proaction_threshold > 0.85 ? 'URGENT' : 'INFO',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.error('Daemon dispatch error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Try reading real clipboard if allowed
  const handleReadLiveClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setClipboardInput(text);
          setSelectedTrigger('CLIPBOARD_TELEMETRY');
          handleDispatchTrigger('CLIPBOARD_TELEMETRY');
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unsupported:', e);
    }
  };

  const sampleClipboardPresets = [
    {
      label: 'Python Stack Trace',
      text: "Traceback (most recent call last):\n  File 'actuator.py', line 54, in <module>\n    target = nodes[anchor_id]\nKeyError: 'anchor_id_04'"
    },
    {
      label: 'API GitHub URL',
      text: 'https://github.com/google-gemini/generative-ai-python'
    },
    {
      label: 'Casual Note (Low Threshold)',
      text: 'Remember to pick up groceries after sprint planning.'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 select-none font-sans">
      {/* Top Banner: SKEW-DEMON Ambient Interceptor Header */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-[#00F5A0]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-rose-600 to-[#00F5A0] text-slate-950 shadow-lg shadow-rose-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                SKEW-DEMON <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-sans font-medium">Ambient Daemon</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-normal">
              Non-blocking OS interceptor, clipboard buffer monitor, proaction threshold evaluator, and background scheduler.
            </p>
          </div>

          {/* Daemon Status Toggle & Proaction Mode Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDaemonActive(!isDaemonActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono transition-all cursor-pointer border ${
                isDaemonActive
                  ? 'bg-emerald-950/80 border-[#00F5A0]/50 text-[#00F5A0] shadow-lg shadow-[#00F5A0]/20'
                  : 'bg-slate-900 border-white/10 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDaemonActive ? 'bg-[#00F5A0] animate-ping' : 'bg-slate-600'}`} />
              <span>{isDaemonActive ? 'DAEMON RUNNING' : 'DAEMON PAUSED'}</span>
            </button>

            <button
              onClick={playChime}
              title="Test Ambient Voice Chime"
              className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white border border-white/10"
            >
              <Volume2 className="w-4 h-4 text-[#00F5A0]" />
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs font-mono">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Thread Count</span>
            <span className="text-white font-semibold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> 2 Background
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Proaction Gate</span>
            <span className="text-[#00F5A0] font-semibold">&ge; 0.70 Threshold</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Active App</span>
            <span className="text-purple-300 font-semibold truncate max-w-[110px]">{activeApp.split(' ')[0]}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Battery Status</span>
            <span className={`font-semibold flex items-center gap-1 ${batteryLevel < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <Battery className="w-3.5 h-3.5" /> {batteryLevel}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Trigger Simulator + Proaction Threshold Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Ingestion Streams & Trigger Testing */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Module 1: 4 Multi-Modal Ingestion Streams */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
                <Radio className="w-4 h-4 text-[#00F5A0]" />
                <span>1. MULTI-MODAL TRIGGER INGESTION</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Select Stream</span>
            </div>

            {/* 4 Trigger Category Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'CLIPBOARD_TELEMETRY', label: 'Clipboard', icon: Copy, desc: 'URL/Error watch' },
                { id: 'WAKE_WORD_AUDIO', label: 'Wake Audio', icon: Mic, desc: 'Voice Hotword' },
                { id: 'PROACTIVE_SCHEDULER', label: 'Scheduler', icon: Calendar, desc: 'Alarms/Meetings' },
                { id: 'OS_TELEMETRY_ALERT', label: 'OS Alerts', icon: AlertTriangle, desc: 'Battery & CPU' }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isSelected = selectedTrigger === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedTrigger(tab.id as SkewDaemonTriggerType);
                      handleDispatchTrigger(tab.id as SkewDaemonTriggerType);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-[#00F5A0]/60 text-white shadow-md shadow-[#00F5A0]/10'
                        : 'glass-pill text-slate-400 hover:text-slate-200 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#00F5A0]' : 'text-slate-500'}`} />
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />}
                    </div>
                    <div className="font-semibold text-xs text-white">{tab.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{tab.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Stream-Specific Input Area */}
            {selectedTrigger === 'CLIPBOARD_TELEMETRY' && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">SIMULATED CLIPBOARD BUFFER:</span>
                  <button
                    onClick={handleReadLiveClipboard}
                    className="text-[#00F5A0] hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <Copy className="w-3 h-3" /> Ingest Real Clipboard
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={clipboardInput}
                  onChange={(e) => setClipboardInput(e.target.value)}
                  className="w-full rounded-2xl bg-black/60 border border-white/10 p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00F5A0]/50"
                  placeholder="Paste traceback error, URL, or plain text..."
                />

                <div className="flex flex-wrap gap-1.5">
                  {sampleClipboardPresets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setClipboardInput(preset.text);
                        handleDispatchTrigger('CLIPBOARD_TELEMETRY');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/5 font-mono"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTrigger === 'OS_TELEMETRY_ALERT' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Battery Level</span>
                      <span className={batteryLevel < 20 ? 'text-rose-400 font-bold' : 'text-[#00F5A0]'}>{batteryLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">CPU Load Spike</span>
                      <span className={cpuLoad > 90 ? 'text-rose-400 font-bold' : 'text-cyan-400'}>{cpuLoad}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={cpuLoad}
                      onChange={(e) => setCpuLoad(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedTrigger === 'WAKE_WORD_AUDIO' && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono text-[#00F5A0]">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> Hotword Stream Listening: "Hey SKEW"
                  </span>
                  <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">Low Latency</span>
                </div>
                <p className="text-slate-400">
                  When the hotword phrase is recognized, SKEW immediately brings up a low-volume voice listener and pre-ingests active window context.
                </p>
              </div>
            )}

            {selectedTrigger === 'PROACTIVE_SCHEDULER' && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Next Calendar Event in 10 mins
                  </span>
                  <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">Auto-Alert</span>
                </div>
                <p className="text-slate-400">
                  "Sprint Architecture Review (Room 4A)" starting at 10:00 AM. Daemon pre-warms browser workspace tabs.
                </p>
              </div>
            )}

            {/* Foreground Application Context Selector */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-mono">ACTIVE APP FOCUS:</span>
              <select
                value={activeApp}
                onChange={(e) => setActiveApp(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
              >
                <option value="VS Code (Python Workspace)">VS Code (Python Workspace)</option>
                <option value="Google Chrome (Gemini API Docs)">Google Chrome (Gemini API Docs)</option>
                <option value="iTerm2 (Docker Cluster)">iTerm2 (Docker Cluster)</option>
                <option value="Slack (Engineering Channel)">Slack (Engineering Channel)</option>
              </select>
            </div>

            {/* Fire Trigger Evaluation Button */}
            <button
              onClick={() => handleDispatchTrigger()}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-[#00F5A0] to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>{isProcessing ? 'Evaluating Ambient Context...' : 'Evaluate Proactive Trigger'}</span>
            </button>
          </div>

          {/* Module 2: Proaction Reasoning & Output Dispatch Schema */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>2. BACKGROUND DISPATCH JSON OUTPUT</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(dispatchData, null, 2));
                  setCopiedJson(true);
                  setTimeout(() => setCopiedJson(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
              >
                {copiedJson ? <Check className="w-3 h-3 text-[#00F5A0]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-2xl bg-black/80 text-emerald-400 text-xs font-mono overflow-x-auto max-h-60 border border-white/10 leading-relaxed">
              <code>{JSON.stringify(dispatchData, null, 2)}</code>
            </pre>

            {/* Quick Action Button to Pass to Chat Assistant */}
            {onRunInChat && dispatchData.background_action.notification_title && (
              <button
                onClick={() => onRunInChat(`Execute SKEW Daemon recommendation: ${dispatchData.background_action.notification_title} - ${dispatchData.background_action.notification_body}`)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center justify-center gap-2 transition-colors font-mono cursor-pointer"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Pass Daemon Action to Conversational Assistant &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Proaction Threshold Gauge, Python Daemon Code & HUD Alert */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Proaction Threshold Status Card */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>PROACTION THRESHOLD</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                dispatchData.daemon_telemetry.should_interrupt_user
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  : 'bg-slate-900 border-white/10 text-slate-400'
              }`}>
                {dispatchData.daemon_telemetry.should_interrupt_user ? 'PROACTIVE INTERVENTION' : 'PASSIVE SILENT CACHE'}
              </span>
            </div>

            {/* Visual Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Calculated Score</span>
                <span className="text-white font-bold text-base">
                  {(dispatchData.daemon_telemetry.proaction_threshold * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dispatchData.daemon_telemetry.proaction_threshold >= 0.70
                      ? 'bg-gradient-to-r from-[#00F5A0] via-cyan-400 to-rose-500'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${dispatchData.daemon_telemetry.proaction_threshold * 100}%` }}
                />
                {/* 0.70 Cutoff Marker */}
                <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-rose-400 z-10" title="Proaction Cutoff (0.70)" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>0.00 (Silent)</span>
                <span className="text-rose-400 font-semibold">&uarr; 0.70 Trigger Line</span>
                <span>1.00 (Urgent)</span>
              </div>
            </div>

            {/* Threshold Rules Description */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500">&bull;</span>
                <div>
                  <span className="font-semibold text-slate-200">Passive Mode (&lt; 0.70):</span> Caches silently in SQLite/Vector DB. No voice or intrusive popups.
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-rose-400">&bull;</span>
                <div>
                  <span className="font-semibold text-rose-300">Proactive Mode (&ge; 0.70):</span> Dispatches notification toast, audio chime, and optional voice reminder.
                </div>
              </div>
            </div>
          </div>

          {/* Live In-App Notification Toast Preview */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
                <BellRing className="w-4 h-4 text-[#00F5A0]" />
                <span>DESKTOP NOTIFICATION TOAST</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">HUD Glass</span>
            </div>

            {activeToast ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-900 border border-rose-500/40 shadow-2xl space-y-1.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold text-white font-mono">{activeToast.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{activeToast.time}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeToast.body}
                </p>
                {dispatchData.background_action.target_command && (
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#00F5A0]">
                    <span className="truncate max-w-[200px]">{dispatchData.background_action.target_command}</span>
                    <button 
                      onClick={playChime}
                      className="px-2 py-0.5 rounded bg-[#00F5A0]/20 text-[#00F5A0] hover:bg-[#00F5A0]/30"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-black/30 border border-dashed border-white/10 text-center text-xs text-slate-500 font-mono">
                No active notification. Trigger an event with threshold &ge; 0.70.
              </div>
            )}
          </div>

          {/* Module 3: Python Daemon Code Viewer */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
                <Code2 className="w-4 h-4 text-[#00F5A0]" />
                <span>PYTHON DAEMON SCRIPT</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(PYTHON_DAEMON_SCRIPT);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
              >
                {copiedCode ? <Check className="w-3 h-3 text-[#00F5A0]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Thread 1: Clipboard Watcher &bull; Thread 2: System Telemetry Watcher
            </div>

            <pre className="p-3.5 rounded-2xl bg-black/80 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-56 border border-white/10 leading-relaxed">
              <code>{PYTHON_DAEMON_SCRIPT}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
