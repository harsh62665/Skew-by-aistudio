import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Mic, 
  MicOff,
  RotateCw, 
  Zap,
  Waves,
  Volume2,
  X,
  Radio,
  AudioWaveform,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { AssistantVisualState, SystemState } from '../types';
import { useAudioEngine } from '../context/AudioEngineContext';
import { AssistantVoiceId } from '../utils/voiceSelector';

interface CentralGlassOrbProps {
  visualState: AssistantVisualState;
  systemState: SystemState;
  onOrbClick?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  isDuplexActive?: boolean;
  userLiveTranscript?: string;
  skewLiveResponse?: string;
  onExitDuplexVoice?: () => void;
  permissionError?: string | null;
  onSimulateVoice?: (text: string) => void;
  selectedVoice?: AssistantVoiceId;
  onToggleVoiceSelection?: () => void;
}

export const CentralGlassOrb: React.FC<CentralGlassOrbProps> = ({
  visualState,
  systemState,
  onOrbClick,
  onSelectSuggestion,
  isDuplexActive = false,
  userLiveTranscript = '',
  skewLiveResponse = '',
  onExitDuplexVoice,
  permissionError = null,
  onSimulateVoice,
  selectedVoice = 'VOICE_1',
  onToggleVoiceSelection
}) => {
  const { 
    isAudioActive, 
    lfoIntensity, 
    lfoFrequency 
  } = useAudioEngine();

  // Dynamic animation frequency synced to audio LFO frequency or voice state
  const pulsePeriodSeconds = isAudioActive 
    ? Math.max(0.4, Math.min(3.0, 1 / (lfoFrequency || 1))) 
    : visualState === 'SPEAKING' 
    ? 0.7 
    : visualState === 'THINKING' || visualState === 'PROCESSING' 
    ? 1.0 
    : visualState === 'LISTENING' 
    ? 1.4 
    : 2.5;

  const glowIntensity = isAudioActive ? Math.max(0.3, lfoIntensity) : 0.35;

  const getOrbStateConfig = () => {
    switch (visualState) {
      case 'LISTENING':
        return {
          containerClass: 'animate-orb-listening',
          innerCoreClass: 'from-[#00F5A0] via-cyan-400 to-[#7B2CBF]',
          accentAura: 'rgba(0, 245, 160, 0.75)',
          outlineGlow: '0 0 45px rgba(0, 245, 160, 0.7), inset 0 0 25px rgba(0, 245, 160, 0.4)',
          borderColor: 'border-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.5)]',
          statusLabel: 'Listening to your voice...',
          statusDotColor: 'bg-[#00F5A0] animate-ping',
          icon: Mic,
          iconClass: 'text-[#00F5A0] animate-pulse',
          badgeText: 'LISTENING',
          badgeColor: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
        };
      case 'THINKING':
      case 'PROCESSING':
        return {
          containerClass: 'animate-spin-slow',
          innerCoreClass: 'from-purple-500 via-pink-500 to-[#00F5A0]',
          accentAura: 'rgba(168, 85, 247, 0.8)',
          outlineGlow: '0 0 50px rgba(168, 85, 247, 0.6), inset 0 0 30px rgba(168, 85, 247, 0.4)',
          borderColor: 'border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.5)]',
          statusLabel: systemState === 'PLAN' ? 'Deliberating (Tree-of-Thought)...' : 'Synthesizing Action...',
          statusDotColor: 'bg-purple-500 animate-pulse',
          icon: RotateCw,
          iconClass: 'text-purple-300 animate-spin',
          badgeText: 'THINKING',
          badgeColor: 'bg-purple-950/80 border-purple-500/50 text-purple-300'
        };
      case 'SPEAKING':
        return {
          containerClass: 'animate-orb-speaking',
          innerCoreClass: 'from-cyan-400 via-blue-500 to-purple-600',
          accentAura: 'rgba(6, 182, 212, 0.85)',
          outlineGlow: '0 0 55px rgba(6, 182, 212, 0.7), inset 0 0 30px rgba(6, 182, 212, 0.5)',
          borderColor: 'border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)]',
          statusLabel: 'SKEW is speaking...',
          statusDotColor: 'bg-cyan-400 animate-bounce',
          icon: Volume2,
          iconClass: 'text-cyan-300 animate-pulse',
          badgeText: 'SPEAKING',
          badgeColor: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
        };
      case 'IDLE':
      default:
        return {
          containerClass: 'animate-orb-idle',
          innerCoreClass: 'from-[#00F5A0]/60 via-[#7B2CBF]/50 to-cyan-500/50',
          accentAura: isAudioActive ? 'rgba(6, 182, 212, 0.55)' : 'rgba(0, 245, 160, 0.25)',
          outlineGlow: isAudioActive 
            ? '0 0 30px rgba(6, 182, 212, 0.45), inset 0 0 15px rgba(0, 245, 160, 0.25)' 
            : '0 0 15px rgba(255, 255, 255, 0.1)',
          borderColor: isAudioActive ? 'border-cyan-400/50' : 'border-white/20',
          statusLabel: 'SKEW JARVIS Core Active',
          statusDotColor: 'bg-[#00F5A0]',
          icon: Sparkles,
          iconClass: 'text-white',
          badgeText: 'ONLINE',
          badgeColor: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
        };
    }
  };

  const config = getOrbStateConfig();
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 select-none w-full max-w-xl mx-auto">
      
      {/* Top Voice Mode Status - subtle and minimal */}
      {isDuplexActive && (
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-mono border backdrop-blur-md flex items-center gap-2 transition-all bg-cyan-950/70 border-cyan-500/40 text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F5A0]"></span>
            </span>
            <span className="font-semibold tracking-wider text-[11px]">VOICE MODE</span>
          </div>

          {onExitDuplexVoice && (
            <button
              onClick={onExitDuplexVoice}
              className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              title="Exit Voice Mode (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Permission Warning Banner if mic blocked */}
      {permissionError && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 max-w-md mx-auto"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{permissionError}</span>
        </motion.div>
      )}

      {/* Background Soft Reactive Glow synced to Audio LFO */}
      <motion.div 
        animate={{
          scale: isAudioActive || isDuplexActive ? [1, 1.12 + glowIntensity * 0.15, 1] : [1, 1.03, 1],
          opacity: isDuplexActive ? [0.45, 0.75, 0.45] : isAudioActive ? [0.35, 0.65 * glowIntensity, 0.35] : [0.2, 0.3, 0.2]
        }}
        transition={{
          duration: pulsePeriodSeconds,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.accentAura} 0%, rgba(123, 44, 191, 0.25) 45%, transparent 70%)`
        }}
      />

      {/* Expanded Reactive Ripple Waves for LISTENING state */}
      {visualState === 'LISTENING' && (
        <div className="absolute w-64 h-64 sm:w-80 sm:h-80 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.45, 1.8], opacity: [0.7, 0.3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1.6], opacity: [0.6, 0.25, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-[#00F5A0]/40 shadow-[0_0_20px_rgba(0,245,160,0.3)]"
          />
        </div>
      )}

      {/* Fluid Ripple Waves for SPEAKING state */}
      {visualState === 'SPEAKING' && (
        <div className="absolute w-64 h-64 sm:w-80 sm:h-80 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
          />
        </div>
      )}

      {/* Floating 3D Obsidian Glass Sphere (#central-orb) */}
      <div 
        id="central-orb"
        role="button"
        tabIndex={0}
        onClick={onOrbClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOrbClick?.();
          }
        }}
        className="relative group cursor-pointer animate-orb-float w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0]"
        title={isDuplexActive ? 'Click to stop continuous voice' : 'Click to start Continuous Real-Time Duplex Voice Mode'}
        aria-label={isDuplexActive ? 'Deactivate continuous voice mode' : 'Activate continuous voice mode'}
      >
        {/* Audio-synced Glowing Neural Outline Ring */}
        <motion.div 
          animate={{
            scale: visualState !== 'IDLE' ? [1, 1.06 + glowIntensity * 0.1, 1] : [1, 1.02, 1],
            opacity: visualState !== 'IDLE' ? [0.6, 0.95, 0.6] : [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: pulsePeriodSeconds,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -inset-3 rounded-full pointer-events-none transition-all duration-300"
          style={{
            boxShadow: config.outlineGlow
          }}
        />

        {/* Concentric Gyroscopic Orbital Ring 1 */}
        <div 
          className={`absolute inset-0 rounded-full border ${visualState === 'THINKING' ? 'border-purple-400/60' : 'border-emerald-500/30'} opacity-70 animate-ring-spin pointer-events-none`}
          style={{
            animationDuration: visualState === 'THINKING' ? '3s' : visualState === 'SPEAKING' ? '6s' : '12s'
          }}
        />

        {/* Concentric Gyroscopic Orbital Ring 2 */}
        <div 
          className={`absolute -inset-2 rounded-full border border-dashed ${visualState === 'THINKING' ? 'border-pink-400/60' : 'border-purple-500/40'} opacity-60 animate-ring-spin-rev pointer-events-none`}
          style={{
            animationDuration: visualState === 'THINKING' ? '4s' : visualState === 'SPEAKING' ? '8s' : '16s'
          }}
        />

        {/* Orbiting Light Node */}
        <div 
          className="absolute inset-0 animate-ring-spin pointer-events-none"
          style={{
            animationDuration: visualState === 'THINKING' ? '3s' : '12s'
          }}
        >
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${visualState === 'SPEAKING' ? 'bg-cyan-400 shadow-cyan-400' : 'bg-[#00F5A0] shadow-[#00F5A0]'} shadow-md`} />
        </div>

        {/* The 3D Refractive Glass Sphere */}
        <motion.div 
          animate={visualState !== 'IDLE' ? {
            scale: visualState === 'LISTENING' ? [1, 1.03, 1] : visualState === 'SPEAKING' ? [1, 1.05, 1] : 1
          } : {}}
          transition={{
            duration: pulsePeriodSeconds,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full ${config.containerClass} flex items-center justify-center backdrop-blur-2xl border-2 ${config.borderColor} overflow-hidden transition-all duration-500 group-hover:scale-105`}
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.22) 0%, rgba(15, 23, 42, 0.75) 50%, rgba(6, 8, 13, 0.98) 100%)'
          }}
        >
          {/* Inner Bioluminescent Core */}
          <motion.div 
            animate={{
              scale: visualState !== 'IDLE' ? [1, 1.15 + glowIntensity * 0.15, 1] : [1, 1.05, 1],
              opacity: visualState !== 'IDLE' ? [0.75, 1.0, 0.75] : [0.65, 0.8, 0.65]
            }}
            transition={{
              duration: pulsePeriodSeconds,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr ${config.innerCoreClass} filter blur-sm transition-all duration-500`}
          />

          {/* Central Holographic Icon */}
          <div className="absolute z-10 text-white drop-shadow-lg flex flex-col items-center justify-center">
            <IconComponent className={`w-8 h-8 sm:w-9 sm:h-9 ${config.iconClass}`} />
          </div>

          {/* Realistic Specular Highlights */}
          <div className="absolute top-2 left-6 w-14 h-7 rounded-full bg-white/35 filter blur-[1px] -rotate-30 pointer-events-none" />
          <div className="absolute bottom-3 right-6 w-8 h-4 rounded-full bg-white/25 filter blur-[1.5px] -rotate-15 pointer-events-none" />
        </motion.div>
      </div>

      {/* Beneath the Orb: Minimalist Clean Text ("niche chota text hoga bilkul clean koi extra chiz nhi") */}
      <div className="mt-8 flex flex-col items-center justify-center text-center px-4 space-y-2 max-w-lg mx-auto">
        {permissionError && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{permissionError}</span>
            <button
              type="button"
              onClick={onOrbClick}
              className="ml-auto underline text-[11px] hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isDuplexActive ? (
          <div className="space-y-1.5 flex flex-col items-center">
            {userLiveTranscript ? (
              <p className="text-sm sm:text-base text-white font-medium max-w-md leading-relaxed tracking-tight">
                &ldquo;{userLiveTranscript}&rdquo;
              </p>
            ) : skewLiveResponse ? (
              <p className="text-sm sm:text-base text-[#00F5A0] font-medium max-w-md leading-relaxed tracking-tight">
                {skewLiveResponse}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-cyan-300/90 font-mono tracking-widest uppercase animate-pulse">
                Listening...
              </p>
            )}

            <p className="text-[11px] text-slate-500 font-mono tracking-wide pt-1">
              Tap orb to stop • Speak naturally
            </p>
          </div>
        ) : (
          <div className="space-y-1 flex flex-col items-center">
            <h1 className="text-lg font-semibold tracking-tight text-white/90 font-sans">
              SKEW
            </h1>
            <p className="text-xs text-slate-500 font-mono tracking-wide">
              Tap orb to speak
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
