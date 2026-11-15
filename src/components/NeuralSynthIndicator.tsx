import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sliders, Waves, Activity } from 'lucide-react';
import { SystemState, AssistantVisualState } from '../types';
import { useAudioEngine } from '../context/AudioEngineContext';

interface NeuralSynthIndicatorProps {
  systemState: SystemState;
  visualState: AssistantVisualState;
}

export const NeuralSynthIndicator: React.FC<NeuralSynthIndicatorProps> = ({
  systemState,
  visualState
}) => {
  const {
    isAudioActive,
    volume,
    lfoIntensity,
    lfoFrequency,
    carrierFreq,
    filterCutoff,
    toggleAudio,
    setVolume
  } = useAudioEngine();

  const [showVolumePopup, setShowVolumePopup] = useState<boolean>(false);

  const handleToggle = async () => {
    await toggleAudio();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const getStateInfo = () => {
    switch (systemState) {
      case 'PERCEIVE':
        return {
          title: 'Perceive Pulse',
          hz: `${carrierFreq.toFixed(0)} Hz • ${lfoFrequency.toFixed(1)}Hz Binaural`,
          glowClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40'
        };
      case 'PLAN':
        return {
          title: 'Theta Wave Deliberation',
          hz: `${carrierFreq.toFixed(0)} Hz • ${lfoFrequency.toFixed(2)}Hz Schumann`,
          glowClass: 'text-purple-300 bg-purple-950/40 border-purple-500/40'
        };
      case 'SYNTHESIZE':
        return {
          title: 'AST Cyber Modulation',
          hz: `${carrierFreq.toFixed(1)} Hz • ${lfoFrequency.toFixed(0)}Hz Shimmer`,
          glowClass: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40'
        };
      case 'ACT':
        return {
          title: 'Actuator Sub-Pulse',
          hz: `${carrierFreq.toFixed(0)} Hz • ${lfoFrequency.toFixed(0)}Hz Sub-Bass`,
          glowClass: 'text-pink-300 bg-pink-950/40 border-pink-500/40'
        };
      case 'HEAL':
        return {
          title: 'Solfeggio 528 Harmonic',
          hz: `${carrierFreq.toFixed(0)} Hz • ${lfoFrequency.toFixed(2)}Hz Restorative`,
          glowClass: 'text-rose-300 bg-rose-950/40 border-rose-500/40'
        };
      case 'EVALUATE':
      default:
        return {
          title: 'Ambient Deep Drone',
          hz: `${carrierFreq.toFixed(0)} Hz • ${lfoFrequency.toFixed(1)}Hz Carrier`,
          glowClass: 'text-slate-300 bg-slate-900/60 border-white/10'
        };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <div className="relative inline-flex items-center select-none font-sans">
      {/* Synth Toggle Pill */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowVolumePopup(!showVolumePopup);
        }}
        title={isAudioActive ? `Neural-Pulse Audio Active (${stateInfo.hz}) - Click to Mute, Right Click for Volume` : 'Enable Ambient Neural-Pulse Audio Synthesizer'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer border ${
          isAudioActive
            ? 'bg-slate-900/90 border-[#00F5A0]/50 text-[#00F5A0] shadow-md shadow-[#00F5A0]/20'
            : 'glass-pill text-slate-400 hover:text-slate-200 border-white/10'
        }`}
      >
        {/* Animated Sound Wave Bars */}
        <div className="flex items-center gap-0.5 h-3.5 px-0.5">
          <span 
            className={`w-0.5 rounded-full transition-all duration-300 ${
              isAudioActive ? 'bg-[#00F5A0] animate-[pulse_1s_ease-in-out_infinite]' : 'bg-slate-600 h-1'
            }`} 
            style={{ height: isAudioActive ? (systemState === 'PERCEIVE' ? '12px' : '7px') : '4px' }}
          />
          <span 
            className={`w-0.5 rounded-full transition-all duration-300 ${
              isAudioActive ? 'bg-cyan-400 animate-[pulse_0.7s_ease-in-out_infinite]' : 'bg-slate-600 h-1.5'
            }`}
            style={{ height: isAudioActive ? (systemState === 'SYNTHESIZE' ? '14px' : '10px') : '6px' }}
          />
          <span 
            className={`w-0.5 rounded-full transition-all duration-300 ${
              isAudioActive ? 'bg-purple-400 animate-[pulse_1.2s_ease-in-out_infinite]' : 'bg-slate-600 h-1'
            }`}
            style={{ height: isAudioActive ? (systemState === 'PLAN' ? '13px' : '8px') : '4px' }}
          />
        </div>

        {isAudioActive ? (
          <Volume2 className="w-3.5 h-3.5 text-[#00F5A0]" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
        )}

        <span className="hidden sm:inline text-[11px] font-sans">
          {isAudioActive ? 'Neural Sound' : 'Synth Off'}
        </span>

        {isAudioActive && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowVolumePopup(!showVolumePopup);
            }}
            className="ml-0.5 p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            title="Adjust Ambient Synth Volume"
          >
            <Sliders className="w-2.5 h-2.5" />
          </span>
        )}
      </motion.button>

      {/* Volume & Neural Wave Detail Popover */}
      <AnimatePresence>
        {showVolumePopup && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 glass-dock rounded-2xl p-3.5 shadow-2xl border border-white/15 z-50 text-xs font-sans space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Waves className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Neural Synthesizer</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${stateInfo.glowClass}`}>
                {systemState}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-300 font-medium">{stateInfo.title}</div>
              <div className="text-[10px] text-slate-400 font-mono">{stateInfo.hz}</div>
              <div className="text-[10px] text-slate-500 font-mono">
                LFO Modulation: {(lfoIntensity * 100).toFixed(0)}% • Cutoff: {filterCutoff.toFixed(0)} Hz
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Sub-bass Volume</span>
                <span className="font-mono text-white">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-[#00F5A0] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="text-[10px] text-slate-500 font-mono italic">
              Modulates low-frequency oscillator intensity and carrier frequency dynamically on systemState fluctuations.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
