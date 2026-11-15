import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Grid,
  Users,
  UserPlus,
  Copy,
  Check,
  Radio,
  Trash2,
  Send,
  Sparkles,
  Clock
} from 'lucide-react';
import { AssistantVoiceId, findSystemVoice, ASSISTANT_VOICES } from '../utils/voiceSelector';

interface ContactItem {
  id: string;
  name: string;
  number: string;
}

interface CallLogItem {
  id: string;
  target: string;
  mode: 'AI_CALL' | 'P2P_WEBRTC' | 'MOBILE_DIAL';
  durationSec: number;
  timestamp: string;
}

interface VoiceCallViewProps {
  initialTarget?: string;
  selectedVoice?: AssistantVoiceId;
  onToggleVoiceSelection?: () => void;
}

const CONTACTS_STORAGE_KEY = 'skew_phone_contacts_v1';
const CALLLOG_STORAGE_KEY = 'skew_call_history_v1';

const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

function playDtmfTone(digit: string) {
  const freqs = DTMF_FREQS[digit];
  if (!freqs || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore Web Audio failure
  }
}

function playRingbackTone() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.frequency.value = 440;
    osc2.frequency.value = 480;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.72);
    osc2.stop(ctx.currentTime + 0.72);
  } catch {
    // ignore
  }
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const VoiceCallView: React.FC<VoiceCallViewProps> = ({
  initialTarget,
  selectedVoice = 'VOICE_1',
  onToggleVoiceSelection,
}) => {
  const [callTab, setCallTab] = useState<'AI_CALL' | 'P2P_ROOM' | 'DIALER'>('AI_CALL');

  // AI Phone Call State
  const [aiCallStatus, setAiCallStatus] = useState<'IDLE' | 'RINGING' | 'CONNECTED'>('IDLE');
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(true);
  const [showInCallKeypad, setShowInCallKeypad] = useState<boolean>(false);
  const [callLang, setCallLang] = useState<'en-IN' | 'hi-IN' | 'en-US'>('en-IN');
  const [aiStatusText, setAiStatusText] = useState<string>('Ready to connect');
  const [liveCaptions, setLiveCaptions] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [typedFallback, setTypedFallback] = useState<string>('');
  const [micBars, setMicBars] = useState<number[]>([15, 25, 20, 30, 18, 28, 16]);

  // P2P WebRTC Room Call State
  const [roomIdInput, setRoomIdInput] = useState<string>('');
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [p2pStatus, setP2pStatus] = useState<'IDLE' | 'WAITING' | 'CONNECTED'>('IDLE');
  const [p2pMuted, setP2pMuted] = useState<boolean>(false);
  const [p2pError, setP2pError] = useState<string | null>(null);
  const [copiedRoom, setCopiedRoom] = useState<boolean>(false);
  const [p2pSeconds, setP2pSeconds] = useState<number>(0);

  // Mobile Dialer & Contacts State
  const [dialNumber, setDialNumber] = useState<string>('');
  const [contacts, setContacts] = useState<ContactItem[]>(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'c1', name: 'SKEW AI Assistant', number: 'AI-DIRECT' },
      { id: 'c2', name: 'Emergency Helpline', number: '112' },
    ];
  });
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactNumber, setNewContactNumber] = useState<string>('');
  const [showAddContact, setShowAddContact] = useState<boolean>(false);

  // Call History
  const [callHistory, setCallHistory] = useState<CallLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(CALLLOG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Refs for AI call speech + audio analyzer
  const aiStatusRef = useRef<'IDLE' | 'RINGING' | 'CONNECTED'>('IDLE');
  const isMutedRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vadTimerRef = useRef<any>(null);
  const pendingTranscriptRef = useRef<string>('');
  const isAiSpeakingRef = useRef<boolean>(false);
  const callLangRef = useRef(callLang);
  const selectedVoiceRef = useRef(selectedVoice);
  const liveCaptionsRef = useRef(liveCaptions);

  // Refs for P2P WebRTC
  const peerIdRef = useRef<string>(`PEER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const p2pLocalStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { aiStatusRef.current = aiCallStatus; }, [aiCallStatus]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { callLangRef.current = callLang; }, [callLang]);
  useEffect(() => { selectedVoiceRef.current = selectedVoice; }, [selectedVoice]);
  useEffect(() => { liveCaptionsRef.current = liveCaptions; }, [liveCaptions]);

  useEffect(() => {
    try { localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts)); } catch {}
  }, [contacts]);

  useEffect(() => {
    try { localStorage.setItem(CALLLOG_STORAGE_KEY, JSON.stringify(callHistory)); } catch {}
  }, [callHistory]);

  // Handle initialTarget if launched via voice/text command
  useEffect(() => {
    if (!initialTarget) return;
    const clean = initialTarget.replace(/[^\d+]/g, '');
    if (clean.length >= 3) {
      setCallTab('DIALER');
      setDialNumber(clean);
    }
  }, [initialTarget]);

  const recordCallLog = useCallback((target: string, mode: CallLogItem['mode'], durationSec: number) => {
    setCallHistory((prev) => [
      {
        id: `LOG-${Date.now()}`,
        target,
        mode,
        durationSec,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 14),
    ]);
  }, []);

  // Active AI Call timer
  useEffect(() => {
    if (aiCallStatus !== 'CONNECTED') return;
    const timer = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [aiCallStatus]);

  // Active P2P Call timer
  useEffect(() => {
    if (p2pStatus !== 'CONNECTED') return;
    const timer = setInterval(() => setP2pSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [p2pStatus]);

  const stopSpeechRecognition = useCallback(() => {
    if (vadTimerRef.current) clearTimeout(vadTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const speakCallReply = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isSpeaker) {
      onDone?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voiceCfg = ASSISTANT_VOICES[selectedVoiceRef.current] || ASSISTANT_VOICES.VOICE_1;
      utter.rate = voiceCfg.defaultRate;
      utter.pitch = voiceCfg.defaultPitch;
      const sysVoice = findSystemVoice(selectedVoiceRef.current);
      if (sysVoice) utter.voice = sysVoice;

      isAiSpeakingRef.current = true;
      setAiStatusText('SKEW speaking...');

      utter.onend = () => {
        isAiSpeakingRef.current = false;
        if (aiStatusRef.current === 'CONNECTED') {
          setAiStatusText('Listening on call...');
          onDone?.();
        }
      };
      utter.onerror = () => {
        isAiSpeakingRef.current = false;
        onDone?.();
      };
      window.speechSynthesis.speak(utter);
    } catch {
      isAiSpeakingRef.current = false;
      onDone?.();
    }
  }, [isSpeaker]);

  const sendUtteranceToCallAI = useCallback(async (spokenText: string) => {
    const clean = spokenText.trim();
    if (!clean) return;

    setLiveCaptions((prev) => [...prev.slice(-10), { sender: 'user', text: clean }]);
    setAiStatusText('SKEW thinking...');

    try {
      const resp = await fetch('/api/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          history: liveCaptionsRef.current.slice(-6),
          persona: 'SKEW',
          language: callLangRef.current,
        }),
      });
      const data = await resp.json();
      const reply = data?.reply || 'Ji, main sun raha hoon. Aage bataiye.';
      setLiveCaptions((prev) => [...prev.slice(-10), { sender: 'ai', text: reply }]);
      speakCallReply(reply, () => {
        if (aiStatusRef.current === 'CONNECTED' && !isMutedRef.current) {
          startCallSpeechRecognition();
        }
      });
    } catch {
      const fallback = 'Network thoda slow hai, par main call par hoon. Dobara boliye.';
      setLiveCaptions((prev) => [...prev.slice(-10), { sender: 'ai', text: fallback }]);
      speakCallReply(fallback);
    }
  }, [speakCallReply]);

  const startCallSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec || aiStatusRef.current !== 'CONNECTED' || isMutedRef.current) return;

    stopSpeechRecognition();
    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = callLangRef.current;

      rec.onresult = (event: any) => {
        if (aiStatusRef.current !== 'CONNECTED' || isMutedRef.current) return;

        // Barge-in: interrupt AI speech if caller starts talking
        if (isAiSpeakingRef.current) {
          window.speechSynthesis?.cancel();
          isAiSpeakingRef.current = false;
        }

        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += chunk;
          else interim += chunk;
        }

        const text = (final || interim).trim();
        if (text) {
          pendingTranscriptRef.current = text;
          setAiStatusText(`You: "${text}"`);
          if (vadTimerRef.current) clearTimeout(vadTimerRef.current);
          vadTimerRef.current = setTimeout(() => {
            const toSend = pendingTranscriptRef.current;
            pendingTranscriptRef.current = '';
            if (toSend) {
              try { rec.stop(); } catch {}
              sendUtteranceToCallAI(toSend);
            }
          }, 1100);
        }
      };

      rec.onend = () => {
        if (aiStatusRef.current === 'CONNECTED' && !isMutedRef.current && !isAiSpeakingRef.current) {
          setTimeout(() => {
            if (aiStatusRef.current === 'CONNECTED' && !isMutedRef.current && !isAiSpeakingRef.current) {
              startCallSpeechRecognition();
            }
          }, 250);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch {
      // SpeechRecognition unsupported or blocked
    }
  }, [sendUtteranceToCallAI, stopSpeechRecognition]);

  const startAiCall = async () => {
    setCallSeconds(0);
    setLiveCaptions([]);
    setAiCallStatus('RINGING');
    setAiStatusText('Calling SKEW...');
    playRingbackTone();

    // Capture mic for live waveform visualization
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 32;
          src.connect(analyser);
          const dataArr = new Uint8Array(analyser.frequencyBinCount);
          const updateBars = () => {
            if (aiStatusRef.current === 'IDLE') return;
            analyser.getByteFrequencyData(dataArr);
            const bars = Array.from({ length: 7 }, (_, i) =>
              isMutedRef.current ? 8 : Math.max(12, Math.min(100, Math.round((dataArr[i] || 10) / 2.2)))
            );
            setMicBars(bars);
            animFrameRef.current = requestAnimationFrame(updateBars);
          };
          updateBars();
        }
      } catch {
        setAiStatusText('Mic unavailable — you can type messages below');
      }
    }

    setTimeout(() => {
      if (aiStatusRef.current !== 'RINGING') return;
      setAiCallStatus('CONNECTED');
      const greeting = callLangRef.current === 'hi-IN'
        ? 'Namaste! Main SKEW bol raha hoon. Bataiye kaise madad karun?'
        : callLangRef.current === 'en-IN'
        ? 'Hello! SKEW here on call. Bataiye, kya help chahiye aaj?'
        : 'Hello! SKEW connected on live voice call. How can I help you?';
      setLiveCaptions([{ sender: 'ai', text: greeting }]);
      speakCallReply(greeting, () => {
        startCallSpeechRecognition();
      });
    }, 1200);
  };

  const endAiCall = () => {
    const dur = callSeconds;
    setAiCallStatus('IDLE');
    setAiStatusText('Call ended');
    stopSpeechRecognition();
    window.speechSynthesis?.cancel();
    isAiSpeakingRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (dur > 0) {
      recordCallLog('SKEW AI Voice Call', 'AI_CALL', dur);
    }
  };

  const toggleAiMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
    if (next) {
      stopSpeechRecognition();
      setAiStatusText('Microphone muted');
    } else if (aiCallStatus === 'CONNECTED') {
      setAiStatusText('Listening on call...');
      startCallSpeechRecognition();
    }
  };

  // ============================================================================
  // P2P WEBRTC ROOM CALL LOGIC
  // ============================================================================
  const endP2pCall = useCallback(() => {
    if (activeRoomId) {
      fetch(`/api/call/room/${activeRoomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: peerIdRef.current, type: 'hangup' }),
      }).catch(() => {});
    }
    if (p2pSeconds > 0 && activeRoomId) {
      recordCallLog(`Room ${activeRoomId}`, 'P2P_WEBRTC', p2pSeconds);
    }
    sseRef.current?.close();
    sseRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    p2pLocalStreamRef.current?.getTracks().forEach((t) => t.stop());
    p2pLocalStreamRef.current = null;
    setP2pStatus('IDLE');
    setActiveRoomId('');
    setP2pSeconds(0);
  }, [activeRoomId, p2pSeconds, recordCallLog]);

  const joinOrCreateP2pRoom = async (customRoomId?: string) => {
    setP2pError(null);
    try {
      const resp = await fetch('/api/call/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: customRoomId || '' }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.roomId) throw new Error(data.error || 'Could not create room');
      const roomId = data.roomId as string;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      p2pLocalStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
        setP2pStatus('CONNECTED');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`/api/call/room/${roomId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: peerIdRef.current,
              type: 'ice-candidate',
              payload: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      const sse = new EventSource(`/api/call/room/${roomId}/events?peerId=${encodeURIComponent(peerIdRef.current)}`);
      sseRef.current = sse;

      sse.onmessage = async (msg) => {
        try {
          const evt = JSON.parse(msg.data);
          if (evt.type === 'peer-joined') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await fetch(`/api/call/room/${roomId}/signal`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: peerIdRef.current, type: 'offer', payload: offer }),
            });
          } else if (evt.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(evt.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await fetch(`/api/call/room/${roomId}/signal`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: peerIdRef.current, type: 'answer', payload: answer }),
            });
            setP2pStatus('CONNECTED');
          } else if (evt.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(evt.payload));
            setP2pStatus('CONNECTED');
          } else if (evt.type === 'ice-candidate' && evt.payload) {
            await pc.addIceCandidate(new RTCIceCandidate(evt.payload));
          } else if (evt.type === 'hangup' || evt.type === 'peer-left') {
            setP2pStatus('WAITING');
          }
        } catch (err) {
          console.warn('WebRTC signaling event error:', err);
        }
      };

      setActiveRoomId(roomId);
      setRoomIdInput(roomId);
      setP2pStatus('WAITING');
    } catch (err: any) {
      setP2pError(err?.message || 'Microphone access or WebRTC setup failed.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      window.speechSynthesis?.cancel();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      sseRef.current?.close();
      pcRef.current?.close();
      p2pLocalStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopSpeechRecognition]);

  const handleDialMobile = (num: string, name?: string) => {
    const clean = num.trim();
    if (!clean) return;
    if (clean === 'AI-DIRECT') {
      setCallTab('AI_CALL');
      startAiCall();
      return;
    }
    recordCallLog(name ? `${name} (${clean})` : clean, 'MOBILE_DIAL', 0);
    window.location.href = `tel:${clean}`;
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactNumber.trim()) return;
    setContacts((prev) => [
      { id: `c-${Date.now()}`, name: newContactName.trim(), number: newContactNumber.trim() },
      ...prev,
    ]);
    setNewContactName('');
    setNewContactNumber('');
    setShowAddContact(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-10">
      {/* Header & Mode Switcher */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Voice Call &amp; Live Comms
          </h2>
          <p className="text-xs text-slate-400">
            Live duplex phone call with SKEW AI, 2-person WebRTC internet audio call, or native mobile dialer.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-white/10">
          <button
            type="button"
            onClick={() => setCallTab('AI_CALL')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              callTab === 'AI_CALL' ? 'bg-[#00F5A0] text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>AI Voice Call</span>
          </button>
          <button
            type="button"
            onClick={() => setCallTab('P2P_ROOM')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              callTab === 'P2P_ROOM' ? 'bg-[#00F5A0] text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2-Person Call</span>
          </button>
          <button
            type="button"
            onClick={() => setCallTab('DIALER')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              callTab === 'DIALER' ? 'bg-[#00F5A0] text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Phone Dialer</span>
          </button>
        </div>
      </div>

      {/* MODE 1: LIVE AI PHONE CALL */}
      {callTab === 'AI_CALL' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
          {/* Phone Call Screen */}
          <div className="lg:col-span-3 glass-card rounded-3xl p-6 flex flex-col items-center justify-between min-h-[460px] text-center border border-white/10">
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <select
                value={callLang}
                onChange={(e) => setCallLang(e.target.value as any)}
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="en-IN">Hinglish / English (IN)</option>
                <option value="hi-IN">Hindi (hi-IN)</option>
                <option value="en-US">English (US)</option>
              </select>

              {onToggleVoiceSelection && (
                <button
                  type="button"
                  onClick={onToggleVoiceSelection}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 cursor-pointer"
                >
                  {selectedVoice === 'VOICE_2' ? 'Voice: FRIDAY (Female)' : 'Voice: JARVIS (Male)'}
                </button>
              )}
            </div>

            {/* Caller Avatar & Timer */}
            <div className="my-6 flex flex-col items-center space-y-3">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all ${
                  aiCallStatus === 'CONNECTED'
                    ? 'bg-[#00F5A0]/15 border-[#00F5A0] shadow-[0_0_35px_rgba(0,245,160,0.3)]'
                    : aiCallStatus === 'RINGING'
                    ? 'bg-cyan-500/15 border-cyan-400 animate-pulse'
                    : 'bg-slate-900 border-white/15'
                }`}
              >
                <Sparkles className="w-10 h-10 text-[#00F5A0]" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white">SKEW Voice Line</h3>
                <p className="text-sm text-[#00F5A0] font-mono tabular-nums mt-0.5">
                  {aiCallStatus === 'CONNECTED'
                    ? formatDuration(callSeconds)
                    : aiCallStatus === 'RINGING'
                    ? 'Ringing...'
                    : 'Tap Call to Talk'}
                </p>
                <p className="text-xs text-slate-400 mt-1">{aiStatusText}</p>
              </div>

              {/* Live Mic Waveform */}
              {aiCallStatus === 'CONNECTED' && (
                <div className="flex items-end justify-center gap-1.5 h-10 pt-2">
                  {micBars.map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-[#00F5A0] transition-all duration-100"
                      style={{ height: `${Math.max(6, Math.round(h * 0.36))}px` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* In-Call DTMF Keypad */}
            {showInCallKeypad && aiCallStatus === 'CONNECTED' && (
              <div className="grid grid-cols-3 gap-2 mb-4 max-w-[220px] w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => playDtmfTone(d)}
                    className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm font-semibold cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Call Controls */}
            {aiCallStatus === 'IDLE' ? (
              <button
                type="button"
                onClick={startAiCall}
                className="min-h-[52px] px-8 py-3 rounded-full bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#00F5A0]/20 cursor-pointer transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Start Voice Call</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleAiMute}
                  className={`min-h-[48px] min-w-[48px] p-3.5 rounded-full border cursor-pointer transition-colors ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowInCallKeypad((v) => !v)}
                  className={`min-h-[48px] min-w-[48px] p-3.5 rounded-full border cursor-pointer transition-colors ${
                    showInCallKeypad
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                  }`}
                  title="Keypad"
                >
                  <Grid className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpeaker((v) => !v)}
                  className={`min-h-[48px] min-w-[48px] p-3.5 rounded-full border cursor-pointer transition-colors ${
                    isSpeaker
                      ? 'bg-white/15 border-white/25 text-[#00F5A0]'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                  title="Speakerphone"
                >
                  {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={endAiCall}
                  className="min-h-[52px] min-w-[52px] p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 cursor-pointer transition-colors"
                  title="End Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Live Call Transcript & Quick Text Inject */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-5 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Live Call Captions</h3>
                <span className="text-[11px] text-slate-400">Hindi · Hinglish · English</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[320px]">
                {liveCaptions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    Start the voice call and speak naturally. Live call conversation appears here.
                  </p>
                ) : (
                  liveCaptions.map((c, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        c.sender === 'user'
                          ? 'bg-white/10 text-white ml-6'
                          : 'bg-[#00F5A0]/10 border border-[#00F5A0]/25 text-emerald-100 mr-6'
                      }`}
                    >
                      <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        {c.sender === 'user' ? 'You' : 'SKEW'}
                      </span>
                      {c.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Type-in-call fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!typedFallback.trim()) return;
                if (aiCallStatus === 'IDLE') {
                  setAiCallStatus('CONNECTED');
                }
                const txt = typedFallback.trim();
                setTypedFallback('');
                sendUtteranceToCallAI(txt);
              }}
              className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={typedFallback}
                onChange={(e) => setTypedFallback(e.target.value)}
                placeholder="Type in call if mic unavailable..."
                className="flex-1 min-h-[40px] px-3 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5A0]"
              />
              <button
                type="submit"
                className="min-h-[40px] px-3 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODE 2: 2-PERSON REAL WEBRTC VOICE CALL ROOM */}
      {callTab === 'P2P_ROOM' && (
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">2-Person Live Audio Call (WebRTC)</h3>
              <p className="text-xs text-slate-400">
                Create a Room Code and share it with another phone or browser tab to talk live over peer-to-peer audio.
              </p>
            </div>
            {p2pStatus !== 'IDLE' && (
              <div className="text-sm font-mono text-[#00F5A0] tabular-nums">
                {p2pStatus === 'CONNECTED' ? `Connected · ${formatDuration(p2pSeconds)}` : `Waiting in Room ${activeRoomId}...`}
              </div>
            )}
          </div>

          {p2pError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
              {p2pError}
            </div>
          )}

          {p2pStatus === 'IDLE' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                <h4 className="text-sm font-semibold text-white">Create New Call Room</h4>
                <p className="text-xs text-slate-400">Generates a private 6-character code for instant voice call.</p>
                <button
                  type="button"
                  onClick={() => joinOrCreateP2pRoom()}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Create Room &amp; Start Call</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                <h4 className="text-sm font-semibold text-white">Join Existing Call Room</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    placeholder="Enter Room Code (e.g. SKW-482)"
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5A0]"
                  />
                  <button
                    type="button"
                    disabled={!roomIdInput.trim()}
                    onClick={() => joinOrCreateP2pRoom(roomIdInput.trim())}
                    className="min-h-[44px] px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    Join Call
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-[#00F5A0]/30 flex flex-col items-center text-center space-y-4">
              <Radio className={`w-10 h-10 ${p2pStatus === 'CONNECTED' ? 'text-[#00F5A0]' : 'text-cyan-400 animate-pulse'}`} />
              <div>
                <p className="text-xs text-slate-400">Share this Room Code with your caller:</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-white tracking-wider">{activeRoomId}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(activeRoomId);
                      setCopiedRoom(true);
                      setTimeout(() => setCopiedRoom(false), 1800);
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 cursor-pointer"
                    title="Copy Room Code"
                  >
                    {copiedRoom ? <Check className="w-4 h-4 text-[#00F5A0]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = !p2pMuted;
                    setP2pMuted(next);
                    p2pLocalStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next; });
                  }}
                  className={`min-h-[44px] px-4 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                    p2pMuted ? 'bg-rose-500/20 border-rose-400 text-rose-200' : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  {p2pMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{p2pMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  onClick={endP2pCall}
                  className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Hang Up</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: NATIVE MOBILE PHONE DIALER & CONTACTS */}
      {callTab === 'DIALER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Numeric Keypad */}
          <div className="glass-card rounded-3xl p-6 flex flex-col items-center space-y-4">
            <input
              type="tel"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full text-center text-2xl font-mono font-semibold text-white bg-slate-950/80 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-[#00F5A0]"
            />

            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    playDtmfTone(digit);
                    setDialNumber((prev) => prev + digit);
                  }}
                  className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-lg font-mono font-semibold text-white cursor-pointer transition-colors"
                >
                  {digit}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full max-w-[280px]">
              <button
                type="button"
                onClick={() => handleDialMobile(dialNumber)}
                disabled={!dialNumber.trim()}
                className="flex-1 min-h-[48px] rounded-2xl bg-[#00F5A0] hover:bg-[#00d88c] disabled:opacity-40 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call on Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                className="min-h-[48px] px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm cursor-pointer"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* Contacts & Recent Call History */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Saved Contacts</h3>
              <button
                type="button"
                onClick={() => setShowAddContact((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Add Contact</span>
              </button>
            </div>

            {showAddContact && (
              <form onSubmit={addContact} className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Contact Name"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white"
                />
                <input
                  type="tel"
                  value={newContactNumber}
                  onChange={(e) => setNewContactNumber(e.target.value)}
                  placeholder="Phone Number (+91...)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#00F5A0] text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  Save Contact
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{c.number}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDialMobile(c.number, c.name)}
                      className="min-h-[38px] px-3 rounded-lg bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                    {c.number !== 'AI-DIRECT' && (
                      <button
                        type="button"
                        onClick={() => setContacts((prev) => prev.filter((item) => item.id !== c.id))}
                        className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {callHistory.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent Calls</span>
                </h4>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {callHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1 text-slate-300">
                      <span className="truncate">{item.target}</span>
                      <span className="text-slate-500 font-mono tabular-nums shrink-0">
                        {item.durationSec > 0 ? `${formatDuration(item.durationSec)} · ` : ''}{item.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
