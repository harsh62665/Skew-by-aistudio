import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Zap, 
  Brain, 
  Terminal, 
  Flame, 
  Crosshair, 
  Database,
  Radio
} from 'lucide-react';
import { SystemMode } from '../types';

interface AutonomousMissionBarProps {
  onDispatchMission: (goal: string, mode: SystemMode) => void;
  isRunning: boolean;
  currentGoal: string;
}

const PRESET_MISSIONS = [
  {
    title: 'Visual OS Actuation & OCR Bounding Box',
    goal: 'Ground spatial visual screen at (1920x1080), calculate normalized anchor bounding boxes, and actuate mouse clicks on primary target node.',
    mode: 'SYSTEM_2_DELIBERATIVE' as SystemMode,
    icon: Crosshair,
    accent: 'cyan'
  },
  {
    title: 'Self-Evolving Tool Synthesis & AST Sandbox',
    goal: 'Synthesize a modular PEP8 Python arbitrage rate calculator with strict type hints and execute in isolated AST sandbox.',
    mode: 'SYSTEM_2_DELIBERATIVE' as SystemMode,
    icon: Zap,
    accent: 'purple'
  },
  {
    title: 'Tree-of-Thought Multi-Branch DAG Evaluation',
    goal: 'Deconstruct high-concurrency decentralized order execution into 3 ToT branches (P1, P2, P3) and score composite utility across safety and speed.',
    mode: 'SYSTEM_2_DELIBERATIVE' as SystemMode,
    icon: Brain,
    accent: 'blue'
  },
  {
    title: 'State 6 (HEAL): Stack Trace & Auto-Patch',
    goal: 'Simulate runtime memory boundary violation, analyze Python stack trace, synthesize AST patch, and execute 3-iteration recovery loop.',
    mode: 'SYSTEM_2_DELIBERATIVE' as SystemMode,
    icon: Flame,
    accent: 'rose'
  }
];

export const AutonomousMissionBar: React.FC<AutonomousMissionBarProps> = ({
  onDispatchMission,
  isRunning,
  currentGoal
}) => {
  const [inputGoal, setInputGoal] = useState('');
  const [selectedMode, setSelectedMode] = useState<SystemMode>('SYSTEM_2_DELIBERATIVE');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGoal.trim() || isRunning) return;
    onDispatchMission(inputGoal.trim(), selectedMode);
  };

  const handleSelectPreset = (preset: typeof PRESET_MISSIONS[0]) => {
    setInputGoal(preset.goal);
    setSelectedMode(preset.mode);
    onDispatchMission(preset.goal, preset.mode);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            AUTONOMOUS COGNITIVE OBJECTIVE DISPATCH
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Level 4 Agentic Goal Processor
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            id="mission-input"
            type="text"
            value={inputGoal}
            onChange={(e) => setInputGoal(e.target.value)}
            placeholder="Enter autonomous objective (e.g. Synthesize tool, ground visual OS viewport, evaluate ToT branches...)"
            disabled={isRunning}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs md:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner disabled:opacity-50"
          />
        </div>

        <button
          id="dispatch-mission-btn"
          type="submit"
          disabled={isRunning || !inputGoal.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-cyan-950/60 transition-all disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>{isRunning ? 'Synthesizing...' : 'Dispatch Objective'}</span>
        </button>
      </form>

      {/* Preset Missions Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
        <span className="text-[11px] font-mono text-slate-500 shrink-0">Preset Vectors:</span>
        {PRESET_MISSIONS.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              onClick={() => handleSelectPreset(preset)}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors shrink-0 disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{preset.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
