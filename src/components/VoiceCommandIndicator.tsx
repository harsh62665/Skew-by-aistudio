import React from 'react';
import { Mic, Activity } from 'lucide-react';

interface VoiceCommandIndicatorProps {
  isActive: boolean;
}

export const VoiceCommandIndicator: React.FC<VoiceCommandIndicatorProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900 border border-slate-700 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400">
        <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
        <Mic className="w-3.5 h-3.5" />
      </div>
      
      <div className="flex items-center gap-0.5 h-4 px-1">
        {[
          { delay: '0ms', color: 'bg-rose-400' },
          { delay: '150ms', color: 'bg-rose-500' },
          { delay: '300ms', color: 'bg-pink-500' },
          { delay: '450ms', color: 'bg-cyan-400' },
          { delay: '200ms', color: 'bg-indigo-400' },
          { delay: '350ms', color: 'bg-purple-400' },
          { delay: '100ms', color: 'bg-rose-400' },
          { delay: '250ms', color: 'bg-pink-500' },
          { delay: '400ms', color: 'bg-cyan-400' },
        ].map((bar, idx) => (
          <span
            key={idx}
            className={`w-1 rounded-full audio-bar ${bar.color}`}
            style={{ animationDelay: bar.delay }}
          />
        ))}
      </div>
      
      <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-widest ml-1 flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-rose-400" />
        Listening...
      </span>
    </div>
  );
};
