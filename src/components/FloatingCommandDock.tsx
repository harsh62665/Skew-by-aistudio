import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  ArrowUp, 
  Mic, 
  MicOff, 
  Brain, 
  Crosshair, 
  Calendar, 
  Code2, 
  X, 
  FileText, 
  Sparkles,
  Upload,
  Zap,
  Layers,
  Monitor,
  Image as ImageIcon
} from 'lucide-react';
import { SystemMode } from '../types';

interface FloatingCommandDockProps {
  onSendMessage: (text: string, mode: SystemMode, attachment?: { name: string; type: string; size: string }) => void;
  isProcessing: boolean;
  cognitiveMode: SystemMode;
  onToggleCognitiveMode: (mode: SystemMode) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
}

export const FloatingCommandDock: React.FC<FloatingCommandDockProps> = ({
  onSendMessage,
  isProcessing,
  cognitiveMode,
  onToggleCognitiveMode,
  isVoiceActive,
  onToggleVoice
}) => {
  const [inputVal, setInputVal] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; type: string; size: string } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onToggleVoiceRef = useRef(onToggleVoice);
  const onSendMessageRef = useRef(onSendMessage);
  const isProcessingRef = useRef(isProcessing);
  const cognitiveModeRef = useRef(cognitiveMode);
  const attachmentRef = useRef(attachment);

  const isDeepThink = cognitiveMode === 'SYSTEM_2_DELIBERATIVE';

  const appendToHistory = (cmd: string) => {
    if (!cmd) return;
    setCommandHistory(prev => {
      const newHistory = [cmd, ...prev.filter(c => c !== cmd)].slice(0, 10);
      try {
        localStorage.setItem('skew_omega_command_history', JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save command history', e);
      }
      return newHistory;
    });
    setHistoryIndex(-1);
  };

  const appendToHistoryRef = useRef(appendToHistory);

  useEffect(() => {
    onToggleVoiceRef.current = onToggleVoice;
    onSendMessageRef.current = onSendMessage;
    isProcessingRef.current = isProcessing;
    cognitiveModeRef.current = cognitiveMode;
    attachmentRef.current = attachment;
    appendToHistoryRef.current = appendToHistory;
  }, [onToggleVoice, onSendMessage, isProcessing, cognitiveMode, attachment]);

  // Load command history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('skew_omega_command_history');
      if (stored) {
        setCommandHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load command history', e);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp' && inputVal === '' && commandHistory.length > 0) {
      e.preventDefault();
      const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      if (prevIdx < 0) {
        setInputVal('');
      } else {
        setInputVal(commandHistory[prevIdx]);
      }
    }
  };

  const handleSend = () => {
    if ((!inputVal.trim() && !attachment) || isProcessing) return;
    const textToSend = inputVal.trim();
    onSendMessage(textToSend, cognitiveMode, attachment || undefined);
    appendToHistory(textToSend);
    setInputVal('');
    setAttachment(null);
    setShowAttachmentMenu(false);
    if (isVoiceActive) onToggleVoice();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      setAttachment({
        name: file.name,
        type: file.type || 'document',
        size: sizeStr
      });
      setShowAttachmentMenu(false);
    }
  };

  const handleCaptureScreen = async () => {
    setShowAttachmentMenu(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setAttachment({
          name: 'display_viewport_1080p.png',
          type: 'image/png',
          size: '1.2 MB'
        });
        if (!inputVal.trim()) {
          setInputVal('Screen par kya hai dekho aur analyze karo.');
        }
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      stream.getTracks().forEach(track => track.stop());

      setAttachment({
        name: `Active_Screen_${new Date().toLocaleTimeString().replace(/:/g, '')}.png`,
        type: 'image/png',
        size: `${canvas.width}x${canvas.height}`
      });

      if (!inputVal.trim()) {
        setInputVal('Screen par kya hai dekho aur explain karo.');
      }
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        setAttachment({
          name: 'display_viewport_1080p.png',
          type: 'image/png',
          size: '1.2 MB'
        });
        if (!inputVal.trim()) {
          setInputVal('Screen par kya hai dekho aur explain karo.');
        }
      }
    }
  };

  const sampleAttachments = [
    { name: 'workspace_telemetry_dump.json', type: 'application/json', size: '24 KB' },
    { name: 'display_viewport_1080p.png', type: 'image/png', size: '1.2 MB' },
    { name: 'arbitrage_kernel_spec.py', type: 'text/x-python', size: '8 KB' }
  ];

  return (
    <div className="sticky bottom-4 z-30 w-full max-w-3xl px-4 mx-auto">
      {/* Attachment Chip if active */}
      {attachment && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-200 w-fit backdrop-blur-xl shadow-lg">
          <FileText className="w-3.5 h-3.5 text-[#00F5A0]" />
          <span className="font-medium">{attachment.name}</span>
          <span className="text-[10px] text-slate-500 font-mono">({attachment.size})</span>
          <button 
            onClick={() => setAttachment(null)}
            className="ml-1 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating 2029 Pill Bar */}
      <div className="glass-dock rounded-2xl p-2 sm:p-2.5 transition-all shadow-2xl border border-white/10">
        <div className="flex items-center gap-2">
          {/* Multimodal Paperclip Trigger */}
          <div className="relative">
            <button
              id="dock-attachment-btn"
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              title="Add file or screen attachment"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />

            {/* Attachment Dropdown Popup */}
            {showAttachmentMenu && (
              <div className="absolute bottom-full left-0 mb-3 w-64 glass-dock rounded-2xl p-3 shadow-2xl border border-white/10 space-y-2 z-50 text-xs">
                <div className="flex items-center justify-between px-1 text-slate-400 text-[11px] font-mono">
                  <span>ATTACH CONTEXT</span>
                  <button onClick={() => setShowAttachmentMenu(false)} className="hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleCaptureScreen}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer text-left"
                >
                  <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-white">Capture Active Screen</div>
                    <div className="text-[10px] text-cyan-400/80">Inspect live window, tab, or display</div>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                  <span>Upload local file / frame</span>
                </button>

                <div className="pt-1.5 border-t border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono px-1">QUICK CONTEXT SAMPLES:</span>
                  {sampleAttachments.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setAttachment(item);
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/5 text-[11px] text-slate-300 text-left font-mono"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.size}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Auto-expanding Input Area */}
          <textarea
            ref={textareaRef}
            id="dock-main-textarea"
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask or command AGI Core..."
            disabled={isProcessing}
            className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-slate-500 focus:outline-hidden py-1 px-1 resize-none max-h-32 leading-relaxed font-sans"
          />

          {/* Right Controls: Voice Waveform + Deep Think Spark + Cyber-Emerald Pill */}
          <div className="flex items-center gap-1.5">
            {/* Real-time Voice Wave Visualizer */}
            <button
              id="dock-voice-wave-btn"
              type="button"
              onClick={onToggleVoice}
              title={isVoiceActive ? 'Deactivate Voice Telemetry' : 'Real-time Voice Telemetry'}
              className={`p-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                isVoiceActive
                  ? 'bg-emerald-950/80 border border-[#00F5A0]/50 text-[#00F5A0] shadow-md shadow-[#00F5A0]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-0.5 h-4 px-0.5">
                <span className={`w-0.5 rounded-full bg-[#00F5A0] ${isVoiceActive ? 'audio-bar' : 'h-1'}`} style={{ animationDelay: '0ms' }} />
                <span className={`w-0.5 rounded-full bg-cyan-400 ${isVoiceActive ? 'audio-bar' : 'h-2.5'}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-0.5 rounded-full bg-purple-400 ${isVoiceActive ? 'audio-bar' : 'h-1.5'}`} style={{ animationDelay: '300ms' }} />
              </div>
              {isVoiceActive ? <MicOff className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Minimalist Cyber-Emerald Send Button */}
            <button
              id="dock-send-btn"
              type="button"
              onClick={handleSend}
              disabled={(!inputVal.trim() && !attachment) || isProcessing}
              className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                inputVal.trim() || attachment
                  ? 'bg-[#00F5A0] hover:bg-[#00e092] text-slate-950 shadow-lg shadow-[#00F5A0]/25 hover:scale-105 active:scale-95 cursor-pointer font-bold'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
