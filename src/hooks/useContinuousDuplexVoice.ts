import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantVisualState } from '../types';
import { 
  AssistantVoiceId, 
  getSelectedVoiceId, 
  setSelectedVoiceId, 
  findSystemVoice, 
  ASSISTANT_VOICES, 
  testVoice 
} from '../utils/voiceSelector';

interface UseContinuousDuplexVoiceOptions {
  assistantName?: string;
  onUserMessageSubmit?: (text: string) => Promise<string | void>;
  onStateChange?: (state: AssistantVisualState) => void;
}

export interface ContinuousDuplexVoiceState {
  isDuplexActive: boolean;
  voiceOrbState: AssistantVisualState;
  userLiveTranscript: string;
  skewLiveResponse: string;
  isSupported: boolean;
  permissionError: string | null;
  selectedVoice: AssistantVoiceId;
  recognitionLang: 'en-IN' | 'hi-IN' | 'en-US';
  setRecognitionLang: (lang: 'en-IN' | 'hi-IN' | 'en-US') => void;
  setVoiceSelection: (voiceId: AssistantVoiceId) => void;
  testCurrentVoice: () => void;
  toggleDuplexMode: () => void;
  stopDuplexMode: () => void;
  startDuplexMode: () => Promise<void>;
  simulateUserVoiceInput: (mockText: string) => void;
}

/**
 * Play futuristic acoustic feedback chime for listening start/stop
 */
function playAudioChime(type: 'START' | 'STOP') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    if (type === 'START') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    } else {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Web Audio blocked or unsupported
  }
}

export const useContinuousDuplexVoice = ({
  assistantName = 'SKEW',
  onUserMessageSubmit,
  onStateChange
}: UseContinuousDuplexVoiceOptions): ContinuousDuplexVoiceState => {
  const [isDuplexActive, setIsDuplexActive] = useState<boolean>(false);
  const [voiceOrbState, setVoiceOrbState] = useState<AssistantVisualState>('IDLE');
  const [userLiveTranscript, setUserLiveTranscript] = useState<string>('');
  const [skewLiveResponse, setSkewLiveResponse] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoiceState] = useState<AssistantVoiceId>(() => getSelectedVoiceId());
  const [recognitionLang, setRecognitionLangState] = useState<'en-IN' | 'hi-IN' | 'en-US'>('en-IN');

  const recognitionRef = useRef<any>(null);
  const vadTimeoutRef = useRef<any>(null);
  const restartDebounceRef = useRef<any>(null);
  const isDuplexActiveRef = useRef<boolean>(false);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const voiceOrbStateRef = useRef<AssistantVisualState>('IDLE');
  const currentTranscriptRef = useRef<string>('');
  const isSpeakingRef = useRef<boolean>(false);
  const selectedVoiceRef = useRef<AssistantVoiceId>(selectedVoice);
  const recognitionLangRef = useRef<'en-IN' | 'hi-IN' | 'en-US'>('en-IN');

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    recognitionLangRef.current = recognitionLang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = recognitionLang;
    }
  }, [recognitionLang]);

  useEffect(() => {
    const handleVoiceChange = (e: any) => {
      const newVoiceId = e.detail?.voiceId;
      if (newVoiceId && (newVoiceId === 'VOICE_1' || newVoiceId === 'VOICE_2')) {
        setSelectedVoiceState(newVoiceId);
      }
    };
    window.addEventListener('skew:voice-changed', handleVoiceChange);
    return () => window.removeEventListener('skew:voice-changed', handleVoiceChange);
  }, []);

  const setVoiceSelection = useCallback((voiceId: AssistantVoiceId) => {
    setSelectedVoiceId(voiceId);
    setSelectedVoiceState(voiceId);
  }, []);

  const setRecognitionLang = useCallback((lang: 'en-IN' | 'hi-IN' | 'en-US') => {
    setRecognitionLangState(lang);
  }, []);

  const testCurrentVoice = useCallback(() => {
    testVoice(selectedVoiceRef.current);
  }, []);

  // Sync ref with state
  useEffect(() => {
    isDuplexActiveRef.current = isDuplexActive;
  }, [isDuplexActive]);

  useEffect(() => {
    voiceOrbStateRef.current = voiceOrbState;
    if (onStateChange) onStateChange(voiceOrbState);
  }, [voiceOrbState, onStateChange]);

  const isSupported = typeof window !== 'undefined' && 
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).speechSynthesis);

  // Stop Speech Synthesis safely
  const cancelSpeechSynthesis = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    isSpeakingRef.current = false;
  }, []);

  // Safe Speech Recognition starter with state guard
  const startRecognitionSafely = useCallback(() => {
    if (!recognitionRef.current || !isDuplexActiveRef.current) return;
    if (isRecognitionActiveRef.current) return;

    try {
      recognitionRef.current.lang = recognitionLangRef.current;
      recognitionRef.current.start();
      isRecognitionActiveRef.current = true;
    } catch (e: any) {
      // If already started or aborting, ignore InvalidStateError
      if (e?.name !== 'InvalidStateError') {
        console.warn('Recognition start warning:', e);
      }
    }
  }, []);

  // Safe Speech Synthesis with barge-in support and onend auto-listening trigger
  const speakResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceOrbState('LISTENING');
      return;
    }

    cancelSpeechSynthesis();

    // Clean text of markdown artifacts for voice output
    const cleanText = text
      .replace(/[*_#`~\[\]]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) {
      if (isDuplexActiveRef.current) {
        setVoiceOrbState('LISTENING');
        startRecognitionSafely();
      } else {
        setVoiceOrbState('IDLE');
      }
      return;
    }

    setVoiceOrbState('SPEAKING');
    setSkewLiveResponse(text);
    isSpeakingRef.current = true;

    const activeVoiceConfig = ASSISTANT_VOICES[selectedVoiceRef.current] || ASSISTANT_VOICES.VOICE_1;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = activeVoiceConfig.defaultRate;
    utterance.pitch = activeVoiceConfig.defaultPitch;

    // Pick targeted voice matching Voice 1 or Voice 2
    const targetVoice = findSystemVoice(selectedVoiceRef.current);
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setVoiceOrbState('SPEAKING');
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (isDuplexActiveRef.current) {
        setVoiceOrbState('LISTENING');
        setUserLiveTranscript('');
        startRecognitionSafely();
      } else {
        setVoiceOrbState('IDLE');
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      isSpeakingRef.current = false;
      if (isDuplexActiveRef.current) {
        setVoiceOrbState('LISTENING');
        startRecognitionSafely();
      } else {
        setVoiceOrbState('IDLE');
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to invoke speech synthesis:', err);
      if (isDuplexActiveRef.current) {
        setVoiceOrbState('LISTENING');
      }
    }
  }, [cancelSpeechSynthesis, startRecognitionSafely]);

  // Execute processing of finalized user speech
  const processFinalTranscript = useCallback(async (transcript: string) => {
    const trimmed = transcript.trim();
    if (!trimmed) {
      if (isDuplexActiveRef.current) {
        setVoiceOrbState('LISTENING');
      }
      return;
    }

    // Check for voice exit triggers
    const lower = trimmed.toLowerCase();
    if (
      lower === 'exit voice mode' || 
      lower === 'stop voice' || 
      lower === 'exit' || 
      lower === 'quit voice' || 
      lower === 'bye' || 
      lower === 'goodbye' ||
      lower === 'band karo'
    ) {
      stopDuplexMode();
      speakResponse('Live voice session closed. Returning to standby.');
      return;
    }

    setVoiceOrbState('THINKING');
    setSkewLiveResponse('Thinking...');

    try {
      let reply = '';
      if (onUserMessageSubmit) {
        const res = await onUserMessageSubmit(trimmed);
        if (typeof res === 'string' && res) {
          reply = res;
        }
      }

      if (!reply) {
        if (lower.includes('youtube') || lower.includes('video') || lower.includes('play')) {
          reply = "Synthesizing YouTube video search from your memory cues, Sir.";
        } else if (lower.includes('who are you') || lower.includes('identity')) {
          reply = `I am ${assistantName}, your Level-4 autonomous cognitive OS agent with continuous duplex voice control.`;
        } else {
          reply = `Acknowledged: "${trimmed}". Processing through SKEW neural routing.`;
        }
      }

      speakResponse(reply);
    } catch (err) {
      console.error('Failed to process voice query:', err);
      setVoiceOrbState('IDLE');
      speakResponse('Pardon me, I encountered a temporary processing interruption.');
    }
  }, [assistantName, onUserMessageSubmit, speakResponse]);

  // Initialize Speech Recognition once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPermissionError('Speech recognition is not supported in this browser. You can use text input.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Default to en-IN for optimal English, Hinglish, and Hindi phonetics
      recognition.lang = recognitionLangRef.current || 'en-IN';

      recognition.onstart = () => {
        isRecognitionActiveRef.current = true;
        setPermissionError(null);
        if (voiceOrbStateRef.current !== 'THINKING' && voiceOrbStateRef.current !== 'SPEAKING') {
          setVoiceOrbState('LISTENING');
        }
      };

      recognition.onresult = (event: any) => {
        if (!isDuplexActiveRef.current) return;

        // BARGE-IN HANDLING: If SKEW is currently speaking and user speaks, cancel TTS immediately!
        if (isSpeakingRef.current || voiceOrbStateRef.current === 'SPEAKING') {
          cancelSpeechSynthesis();
          setVoiceOrbState('LISTENING');
          setSkewLiveResponse('(Interrupted)');
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }

        const activeText = final || interim;
        if (activeText) {
          currentTranscriptRef.current = activeText;
          setUserLiveTranscript(activeText);
          setVoiceOrbState('LISTENING');

          // Reset VAD timer: when user pauses for >= 1.2s, dispatch to assistant
          if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
          vadTimeoutRef.current = setTimeout(() => {
            if (isDuplexActiveRef.current && currentTranscriptRef.current.trim()) {
              const textToProcess = currentTranscriptRef.current;
              currentTranscriptRef.current = '';
              try {
                recognition.stop();
                isRecognitionActiveRef.current = false;
              } catch (e) {}
              processFinalTranscript(textToProcess);
            }
          }, 1200);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal silence interval; maintain listening
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          isRecognitionActiveRef.current = false;
          setPermissionError('Microphone permission blocked. Please allow microphone access in your browser.');
        } else if (event.error === 'aborted') {
          isRecognitionActiveRef.current = false;
        } else {
          console.warn('Speech recognition status:', event.error);
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;
        // Debounced Auto-reconnect if duplex mode is still active
        if (isDuplexActiveRef.current && !isSpeakingRef.current && voiceOrbStateRef.current !== 'THINKING') {
          clearTimeout(restartDebounceRef.current);
          restartDebounceRef.current = setTimeout(() => {
            if (isDuplexActiveRef.current && !isSpeakingRef.current && !isRecognitionActiveRef.current) {
              startRecognitionSafely();
            }
          }, 250);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          isRecognitionActiveRef.current = false;
        } catch (e) {}
      }
      if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
      if (restartDebounceRef.current) clearTimeout(restartDebounceRef.current);
      cancelSpeechSynthesis();
    };
  }, [cancelSpeechSynthesis, processFinalTranscript, startRecognitionSafely]);

  // Explicit User Trigger for Starting Continuous Duplex Voice
  const startDuplexMode = useCallback(async () => {
    setPermissionError(null);
    setUserLiveTranscript('');
    setSkewLiveResponse('Listening... Speak in Hindi or English (Voice Active)');
    setIsDuplexActive(true);
    isDuplexActiveRef.current = true;
    setVoiceOrbState('LISTENING');
    playAudioChime('START');

    // 1. Explicitly request microphone stream from user gesture to guarantee browser permission prompt
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close prompt test stream so SpeechRecognition has sole handle
        stream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        console.warn('Microphone permission or hardware access note:', err);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setPermissionError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          setIsDuplexActive(false);
          isDuplexActiveRef.current = false;
          setVoiceOrbState('IDLE');
          return;
        }
      }
    }

    // 2. Start speech recognition safely
    startRecognitionSafely();
  }, [startRecognitionSafely]);

  const stopDuplexMode = useCallback(() => {
    setIsDuplexActive(false);
    isDuplexActiveRef.current = false;
    setVoiceOrbState('IDLE');
    setUserLiveTranscript('');
    setSkewLiveResponse('');
    playAudioChime('STOP');

    if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
    if (restartDebounceRef.current) clearTimeout(restartDebounceRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
      } catch (e) {}
    }
    cancelSpeechSynthesis();
  }, [cancelSpeechSynthesis]);

  const toggleDuplexMode = useCallback(() => {
    if (isDuplexActive) {
      stopDuplexMode();
    } else {
      startDuplexMode();
    }
  }, [isDuplexActive, startDuplexMode, stopDuplexMode]);

  // Fallback simulator for sandboxed or text-only environments
  const simulateUserVoiceInput = useCallback((mockText: string) => {
    if (!isDuplexActive) {
      setIsDuplexActive(true);
      isDuplexActiveRef.current = true;
    }
    setUserLiveTranscript(mockText);
    setVoiceOrbState('LISTENING');
    if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
    vadTimeoutRef.current = setTimeout(() => {
      processFinalTranscript(mockText);
    }, 600);
  }, [isDuplexActive, processFinalTranscript]);

  return {
    isDuplexActive,
    voiceOrbState,
    userLiveTranscript,
    skewLiveResponse,
    isSupported,
    permissionError,
    selectedVoice,
    recognitionLang,
    setRecognitionLang,
    setVoiceSelection,
    testCurrentVoice,
    toggleDuplexMode,
    stopDuplexMode,
    startDuplexMode,
    simulateUserVoiceInput
  };
};
