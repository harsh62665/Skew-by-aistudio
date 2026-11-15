import React from 'react';
import { 
  Eye, 
  GitPullRequest, 
  Code2, 
  MousePointerClick, 
  CheckCircle2, 
  LifeBuoy,
  Play,
  FastForward,
  Flame,
  Activity
} from 'lucide-react';
import { SystemState } from '../types';

interface StateMachineViewerProps {
  currentState: SystemState;
  onSelectState: (state: SystemState) => void;
  onExecuteCycle: (stepOnly?: boolean) => void;
  isRunning: boolean;
  onTriggerFault: () => void;
}

const STATES_INFO: Array<{
  state: SystemState;
  num: number;
  label: string;
  icon: React.ElementType;
}> = [
  { state: 'PERCEIVE', num: 1, label: 'Perceive', icon: Eye },
  { state: 'PLAN', num: 2, label: 'Plan', icon: GitPullRequest },
  { state: 'SYNTHESIZE', num: 3, label: 'Synthesize', icon: Code2 },
  { state: 'ACT', num: 4, label: 'Act', icon: MousePointerClick },
  { state: 'EVALUATE', num: 5, label: 'Evaluate', icon: CheckCircle2 },
  { state: 'HEAL', num: 6, label: 'Heal', icon: LifeBuoy }
];

export const StateMachineViewer: React.FC<StateMachineViewerProps> = ({
  currentState,
  onSelectState,
  onExecuteCycle,
  isRunning,
  onTriggerFault
}) => {
  return (
    <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-3.5 shadow-xl font-mono text-slate-200">
      {/* 1-Line Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            STATE MACHINE
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-400">
            CORE // v4.2
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            State: <strong className="text-white">{currentState}</strong>
          </span>
        </div>

        {/* Minimalist Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="step-state-btn"
            onClick={() => onExecuteCycle(true)}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            title="Step Next State"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>Step</span>
          </button>
          
          <button
            id="full-cycle-btn"
            onClick={() => onExecuteCycle(false)}
            disabled={isRunning}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isRunning ? 'Running...' : '▶ Run Cycle'}</span>
          </button>

          <button
            id="trigger-fault-btn"
            onClick={onTriggerFault}
            disabled={isRunning}
            title="Trigger fault to test state 6: HEAL"
            className="flex items-center gap-1 px-2 py-1 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>Fault</span>
          </button>
        </div>
      </div>

      {/* Compact State Transition Breadcrumb */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STATES_INFO.map((item) => {
          const Icon = item.icon;
          const isActive = currentState === item.state;
          
          return (
            <button
              key={item.state}
              id={`state-node-${item.state.toLowerCase()}`}
              onClick={() => onSelectState(item.state)}
              className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/30'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold shrink-0 ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.num}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span className="font-semibold text-slate-200 truncate">{item.label}</span>
              </div>

              <span className={`text-[9px] px-1 py-0.2 rounded uppercase font-semibold shrink-0 ${
                isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse' : 'text-slate-500'
              }`}>
                {isActive ? 'Active' : 'Idle'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
