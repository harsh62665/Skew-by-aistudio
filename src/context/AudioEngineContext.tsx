import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SystemState, AssistantVisualState } from '../types';

export interface AudioEngineContextType {
  isAudioActive: boolean;
  volume: number;
  lfoIntensity: number;
  lfoFrequency: number;
  filterCutoff: number;
  carrierFreq: number;
  systemState: SystemState;
  toggleAudio: () => Promise<boolean>;
  setVolume: (vol: number) => void;
  setLfoIntensity: (intensity: number) => void;
  playChime: (type?: 'bell' | 'ping' | 'success' | 'alert') => void;
  syncSystemState: (state: SystemState, visual?: AssistantVisualState) => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const AudioEngineProvider: React.FC<{ 
  children: React.ReactNode; 
  systemState?: SystemState;
  visualState?: AssistantVisualState;
}> = ({ children, systemState = 'PERCEIVE', visualState = 'IDLE' }) => {
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.35);
  const [lfoIntensity, setLfoIntensityState] = useState<number>(0.65);
  const [lfoFrequency, setLfoFrequency] = useState<number>(7.83);
  const [filterCutoff, setFilterCutoff] = useState<number>(140);
  const [carrierFreq, setCarrierFreq] = useState<number>(55);
  const [activeState, setActiveState] = useState<SystemState>(systemState);

  // Web Audio Nodes Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const detuneOscRef = useRef<OscillatorNode | null>(null);
  const harmonicOscRef = useRef<OscillatorNode | null>(null);
  const lfoOscRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  // Initialize or resume Web Audio Context
  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API not supported.');
        return null;
      }
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  }, []);

  // Modulate Audio Nodes on SystemState Fluctuations
  const applyModulation = useCallback((state: SystemState, visual: AssistantVisualState = 'IDLE') => {
    setActiveState(state);
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const transitionTime = 0.5;

    let targetCarrier = 55;
    let targetLFOFreq = 6.0;
    let targetLFOIntensity = 0.65;
    let targetFilterCutoff = 140;
    let targetQ = 3.0;

    switch (state) {
      case 'PERCEIVE':
        targetCarrier = 62;
        targetLFOFreq = 8.5; // High-alert binaural
        targetLFOIntensity = 0.82;
        targetFilterCutoff = 180;
        targetQ = 4.2;
        break;
      case 'PLAN':
        targetCarrier = 52;
        targetLFOFreq = 7.83; // Schumann theta resonance
        targetLFOIntensity = 0.65;
        targetFilterCutoff = 120;
        targetQ = 3.0;
        break;
      case 'SYNTHESIZE':
        targetCarrier = 65.4;
        targetLFOFreq = 12.0; // High-frequency cyber shimmer
        targetLFOIntensity = 0.90;
        targetFilterCutoff = 220;
        targetQ = 5.0;
        break;
      case 'ACT':
        targetCarrier = 48; // Deep sub-bass throb
        targetLFOFreq = 4.0;
        targetLFOIntensity = 0.78;
        targetFilterCutoff = 95;
        targetQ = 2.5;
        break;
      case 'HEAL':
        targetCarrier = 66; // Solfeggio 528 resonance
        targetLFOFreq = 5.28;
        targetLFOIntensity = 0.85;
        targetFilterCutoff = 160;
        targetQ = 3.5;
        break;
      case 'EVALUATE':
      default:
        targetCarrier = 55;
        targetLFOFreq = 1.2;
        targetLFOIntensity = 0.50;
        targetFilterCutoff = 130;
        targetQ = 2.8;
        break;
    }

    setCarrierFreq(targetCarrier);
    setLfoFrequency(targetLFOFreq);
    setLfoIntensityState(targetLFOIntensity);
    setFilterCutoff(targetFilterCutoff);

    // Smoothly ramp AudioParam parameters
    try {
      if (carrierOscRef.current) {
        carrierOscRef.current.frequency.cancelScheduledValues(now);
        carrierOscRef.current.frequency.linearRampToValueAtTime(targetCarrier, now + transitionTime);
      }
      if (detuneOscRef.current) {
        detuneOscRef.current.frequency.cancelScheduledValues(now);
        detuneOscRef.current.frequency.linearRampToValueAtTime(targetCarrier * 1.075, now + transitionTime);
      }
      if (harmonicOscRef.current) {
        harmonicOscRef.current.frequency.cancelScheduledValues(now);
        harmonicOscRef.current.frequency.linearRampToValueAtTime(targetCarrier * 2, now + transitionTime);
      }
      if (lfoOscRef.current) {
        lfoOscRef.current.frequency.cancelScheduledValues(now);
        lfoOscRef.current.frequency.linearRampToValueAtTime(targetLFOFreq, now + transitionTime);
      }
      if (lfoGainRef.current) {
        lfoGainRef.current.gain.cancelScheduledValues(now);
        lfoGainRef.current.gain.linearRampToValueAtTime(targetLFOIntensity * 60, now + transitionTime);
      }
      if (filterRef.current) {
        filterRef.current.frequency.cancelScheduledValues(now);
        filterRef.current.frequency.exponentialRampToValueAtTime(Math.max(20, targetFilterCutoff), now + transitionTime);
        filterRef.current.Q.setValueAtTime(targetQ, now + transitionTime);
      }
    } catch (e) {
      console.warn('Audio parameter ramp adjustment warning:', e);
    }
  }, []);

  // Sync when props change
  useEffect(() => {
    if (isAudioActive) {
      applyModulation(systemState, visualState);
    }
  }, [systemState, visualState, isAudioActive, applyModulation]);

  // Start synthesis pipeline
  const startAudio = async (): Promise<boolean> => {
    const ctx = ensureAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // Master Output Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume * 0.16, now + 0.5);
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Resonant Lowpass Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.Q.setValueAtTime(3.0, now);
    filter.connect(masterGain);
    filterRef.current = filter;

    // Low-Frequency Oscillator (LFO) for pulse modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(lfoFrequency, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(lfoIntensity * 50, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency); // Modulate filter cutoff dynamically
    lfo.start(now);
    lfoOscRef.current = lfo;
    lfoGainRef.current = lfoGain;

    // Carrier Oscillator (Sub-bass warmth)
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(carrierFreq, now);
    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0.5, now);
    carrier.connect(carrierGain);
    carrierGain.connect(filter);
    carrier.start(now);
    carrierOscRef.current = carrier;

    // Detune Oscillator (Binaural pulse delta)
    const detune = ctx.createOscillator();
    detune.type = 'triangle';
    detune.frequency.setValueAtTime(carrierFreq * 1.075, now);
    const detuneGain = ctx.createGain();
    detuneGain.gain.setValueAtTime(0.3, now);
    detune.connect(detuneGain);
    detuneGain.connect(filter);
    detune.start(now);
    detuneOscRef.current = detune;

    // Harmonic Shimmer Oscillator
    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(carrierFreq * 2, now);
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.12, now);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(filter);
    harmonic.start(now);
    harmonicOscRef.current = harmonic;

    setIsAudioActive(true);
    applyModulation(systemState, visualState);
    return true;
  };

  // Stop synthesis pipeline
  const stopAudio = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    if (masterGainRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.3);
    }

    setTimeout(() => {
      try {
        carrierOscRef.current?.stop();
        detuneOscRef.current?.stop();
        harmonicOscRef.current?.stop();
        lfoOscRef.current?.stop();
        carrierOscRef.current?.disconnect();
        detuneOscRef.current?.disconnect();
        harmonicOscRef.current?.disconnect();
        lfoOscRef.current?.disconnect();
      } catch (e) {
        // Ignored
      }
      setIsAudioActive(false);
    }, 350);
  };

  const toggleAudio = async (): Promise<boolean> => {
    if (isAudioActive) {
      stopAudio();
      return false;
    } else {
      return await startAudio();
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.linearRampToValueAtTime(val * 0.16, now + 0.1);
    }
  };

  const setLfoIntensity = (intensity: number) => {
    setLfoIntensityState(intensity);
    if (lfoGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      lfoGainRef.current.gain.cancelScheduledValues(now);
      lfoGainRef.current.gain.linearRampToValueAtTime(intensity * 60, now + 0.1);
    }
  };

  const playChime = useCallback((type: 'bell' | 'ping' | 'success' | 'alert' = 'bell') => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    let freq1 = 659.25; // E5
    let freq2 = 987.77; // B5

    if (type === 'success') {
      freq1 = 523.25; // C5
      freq2 = 1046.50; // C6
    } else if (type === 'alert') {
      freq1 = 440.0;
      freq2 = 880.0;
    }

    osc.frequency.setValueAtTime(freq1, now);
    osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.15);

    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }, [ensureAudioContext, volume]);

  return (
    <AudioEngineContext.Provider
      value={{
        isAudioActive,
        volume,
        lfoIntensity,
        lfoFrequency,
        filterCutoff,
        carrierFreq,
        systemState: activeState,
        toggleAudio,
        setVolume,
        setLfoIntensity,
        playChime,
        syncSystemState: applyModulation
      }}
    >
      {children}
    </AudioEngineContext.Provider>
  );
};

export const useAudioEngine = (): AudioEngineContextType => {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  }
  return context;
};
