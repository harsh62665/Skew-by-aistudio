// Web Audio API Neural-Pulse Synthesizer
// Generates subtle, low-frequency ambient neural pulses that dynamically modulate with systemState

import { SystemState, AssistantVisualState } from '../types';

export interface NeuralSynthConfig {
  volume: number; // 0.0 to 1.0
  muted: boolean;
}

class NeuralPulseSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private detuneOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  private isRunning: boolean = false;
  private currentVolume: number = 0.35;
  private isMuted: boolean = true;
  private currentState: SystemState = 'PERCEIVE';
  private currentVisualState: AssistantVisualState = 'IDLE';

  constructor() {
    // Lazy AudioContext initialization on user gesture
  }

  private initAudioContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }
    this.ctx = new AudioCtx();
  }

  public async start(): Promise<boolean> {
    try {
      this.initAudioContext();
      if (!this.ctx) return false;

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (this.isRunning) return true;

      const now = this.ctx.currentTime;

      // 1. Master Output Gain
      this.masterGain = this.ctx.createGain();
      const targetGain = this.isMuted ? 0 : this.currentVolume * 0.18; // Soft, ambient headroom
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.8);
      this.masterGain.connect(this.ctx.destination);

      // 2. Resonant Lowpass Filter for Warmth and Modulation
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(140, now);
      this.filterNode.Q.setValueAtTime(3.0, now);
      this.filterNode.connect(this.masterGain);

      // 3. Carrier Oscillator (Sub-bass warmth)
      this.carrierOsc = this.ctx.createOscillator();
      this.carrierOsc.type = 'sine';
      this.carrierOsc.frequency.setValueAtTime(55, now); // A1 note (55 Hz)

      // 4. Detune Oscillator (Binaural neural pulse beat frequency)
      this.detuneOsc = this.ctx.createOscillator();
      this.detuneOsc.type = 'triangle';
      this.detuneOsc.frequency.setValueAtTime(59.5, now); // 4.5 Hz theta wave delta

      // 5. Harmonic Overtone Oscillator (Richness & Cyber Shimmer)
      this.harmonicOsc = this.ctx.createOscillator();
      this.harmonicOsc.type = 'sine';
      this.harmonicOsc.frequency.setValueAtTime(110, now); // A2 note

      const carrierGain = this.ctx.createGain();
      carrierGain.gain.setValueAtTime(0.5, now);

      const detuneGain = this.ctx.createGain();
      detuneGain.gain.setValueAtTime(0.35, now);

      const harmonicGain = this.ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.15, now);

      // 6. LFO for Rhythmic Neural Breathing / Pulse
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(0.6, now); // 0.6 Hz breathing

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(0.18, now); // Amplitude modulation depth

      // Modulate carrier amplitude
      const pulseAmpGain = this.ctx.createGain();
      pulseAmpGain.gain.setValueAtTime(0.8, now);
      this.lfoOsc.connect(this.lfoGain);
      this.lfoGain.connect(pulseAmpGain.gain);

      // Route oscillators
      this.carrierOsc.connect(carrierGain);
      this.detuneOsc.connect(detuneGain);
      this.harmonicOsc.connect(harmonicGain);

      carrierGain.connect(pulseAmpGain);
      detuneGain.connect(pulseAmpGain);
      harmonicGain.connect(pulseAmpGain);

      pulseAmpGain.connect(this.filterNode);

      // 7. Soft Pink/Brown Noise Floor (Deep Synapse Ambient Hiss)
      this.setupNoiseFloor(now);

      // Start all sound generators
      this.carrierOsc.start(now);
      this.detuneOsc.start(now);
      this.harmonicOsc.start(now);
      this.lfoOsc.start(now);

      this.isRunning = true;
      this.applyStateModulation(this.currentState, this.currentVisualState);

      return true;
    } catch (e) {
      console.error('Failed to start Neural Synthesizer:', e);
      return false;
    }
  }

  private setupNoiseFloor(now: number) {
    if (!this.ctx || !this.masterGain) return;

    // Generate 3 seconds of brown/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.setValueAtTime(320, now);
    this.noiseFilter.Q.setValueAtTime(1.2, now);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.025, now); // Very quiet organic floor

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    this.noiseNode.start(now);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = muted ? 0 : this.currentVolume * 0.18;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.3);
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(this.currentVolume * 0.18, now + 0.1);
  }

  // Dynamic modulation according to SystemState and VisualState
  public applyStateModulation(state: SystemState, visualState: AssistantVisualState = 'IDLE') {
    this.currentState = state;
    this.currentVisualState = visualState;

    if (!this.ctx || !this.isRunning || !this.filterNode || !this.carrierOsc || !this.detuneOsc || !this.lfoOsc || !this.lfoGain) {
      return;
    }

    const now = this.ctx.currentTime;
    const rampTime = 0.6; // Smooth transition duration in seconds

    // Parameters for each cognitive state
    let carrierFreq = 55; // Base Hz
    let detuneOffset = 4.0; // Hz beat (Binaural pulse)
    let filterCutoff = 140; // Hz filter opening
    let filterQ = 3.0; // Resonance
    let lfoRate = 0.6; // Hz modulation breathing speed
    let lfoDepth = 0.18; // Depth
    let noiseFloorFreq = 300;

    // Visual state multiplier (Processing increases intensity, Listening sharpens harmonics)
    const isProcessing = visualState === 'PROCESSING';
    const isListening = visualState === 'LISTENING';

    switch (state) {
      case 'PERCEIVE':
        // High intensity scanning, sharp lowpass filter, fast theta pulse
        carrierFreq = isProcessing ? 68 : 62;
        detuneOffset = 8.5; // Fast alpha-beta pulse
        filterCutoff = isProcessing ? 340 : 280; // Bright, open sound
        filterQ = 4.2;
        lfoRate = 2.4; // Rapid scanning pulse
        lfoDepth = 0.28;
        noiseFloorFreq = 480;
        break;

      case 'PLAN':
        // Deep deliberative resonance, theta wave rhythm (7.83Hz Schumann resonance)
        carrierFreq = 52;
        detuneOffset = 7.83; // Schumann resonance beat
        filterCutoff = 190;
        filterQ = 3.8;
        lfoRate = isProcessing ? 1.8 : 1.1;
        lfoDepth = 0.22;
        noiseFloorFreq = 340;
        break;

      case 'SYNTHESIZE':
        // Cyber-emerald generative shimmer, rhythmic harmonic pulses
        carrierFreq = 65.4; // C2 note
        detuneOffset = 12.0; // Cybernetic rhythm
        filterCutoff = 260;
        filterQ = 4.5;
        lfoRate = isProcessing ? 3.0 : 1.8;
        lfoDepth = 0.32;
        noiseFloorFreq = 520;
        break;

      case 'ACT':
        // Punchy, low-end actuator pulse
        carrierFreq = 48; // Deep sub-bass (G1)
        detuneOffset = 6.0;
        filterCutoff = 310;
        filterQ = 3.5;
        lfoRate = 2.8;
        lfoDepth = 0.35;
        noiseFloorFreq = 420;
        break;

      case 'HEAL':
        // Harmonic soothing 528Hz-derivative sub (66Hz) slow wave
        carrierFreq = 66; // C2+ harmonic
        detuneOffset = 3.0; // Slow, restorative delta wave
        filterCutoff = 160;
        filterQ = 2.5;
        lfoRate = 0.4; // Slow diaphragmatic breathing
        lfoDepth = 0.15;
        noiseFloorFreq = 250;
        break;

      case 'EVALUATE':
        // Resolution harmony, stabilizing drone
        carrierFreq = 55;
        detuneOffset = 4.5;
        filterCutoff = 150;
        filterQ = 2.8;
        lfoRate = 0.8;
        lfoDepth = 0.16;
        noiseFloorFreq = 280;
        break;

      default:
        // IDLE: Low, dark, subtle whisper
        carrierFreq = 50;
        detuneOffset = 3.5;
        filterCutoff = 120;
        filterQ = 2.0;
        lfoRate = 0.45;
        lfoDepth = 0.12;
        noiseFloorFreq = 220;
        break;
    }

    if (isListening) {
      filterCutoff += 60;
      carrierFreq += 4;
      lfoRate = 1.4;
    }

    // Apply exponential & linear ramps safely
    try {
      this.carrierOsc.frequency.cancelScheduledValues(now);
      this.carrierOsc.frequency.linearRampToValueAtTime(carrierFreq, now + rampTime);

      this.detuneOsc.frequency.cancelScheduledValues(now);
      this.detuneOsc.frequency.linearRampToValueAtTime(carrierFreq + detuneOffset, now + rampTime);

      if (this.harmonicOsc) {
        this.harmonicOsc.frequency.cancelScheduledValues(now);
        this.harmonicOsc.frequency.linearRampToValueAtTime(carrierFreq * 2, now + rampTime);
      }

      this.filterNode.frequency.cancelScheduledValues(now);
      this.filterNode.frequency.linearRampToValueAtTime(Math.max(40, filterCutoff), now + rampTime);

      this.filterNode.Q.cancelScheduledValues(now);
      this.filterNode.Q.linearRampToValueAtTime(filterQ, now + rampTime);

      this.lfoOsc.frequency.cancelScheduledValues(now);
      this.lfoOsc.frequency.linearRampToValueAtTime(lfoRate, now + rampTime);

      this.lfoGain.gain.cancelScheduledValues(now);
      this.lfoGain.gain.linearRampToValueAtTime(lfoDepth, now + rampTime);

      if (this.noiseFilter) {
        this.noiseFilter.frequency.cancelScheduledValues(now);
        this.noiseFilter.frequency.linearRampToValueAtTime(noiseFloorFreq, now + rampTime);
      }
    } catch (err) {
      console.warn('Ramp error in Neural Synthesizer:', err);
    }
  }

  public stop() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    setTimeout(() => {
      try {
        this.carrierOsc?.stop();
        this.detuneOsc?.stop();
        this.harmonicOsc?.stop();
        this.lfoOsc?.stop();
        this.noiseNode?.stop();
      } catch (e) {}
      this.isRunning = false;
    }, 350);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      isMuted: this.isMuted,
      volume: this.currentVolume,
      state: this.currentState,
      visualState: this.currentVisualState
    };
  }
}

// Singleton export
export const neuralSynth = new NeuralPulseSynthesizer();
