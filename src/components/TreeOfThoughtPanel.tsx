import React from 'react';
import { 
  GitBranch, 
  Layers,
  Clock
} from 'lucide-react';
import { ToTEvaluation, SubTask, ToTBranch } from '../types';

interface TreeOfThoughtPanelProps {
  totData: ToTEvaluation;
  subTasks: SubTask[];
  onSelectBranch?: (branchId: string) => void;
}

export const TreeOfThoughtPanel: React.FC<TreeOfThoughtPanelProps> = ({
  totData,
  subTasks,
  onSelectBranch
}) => {
  const branches: ToTBranch[] = totData.branches || [
    {
      id: 'P1',
      name: 'Direct Dispatch',
      path_description: 'Immediate cached workflow routing directly to OS system calls.',
      efficiency_score: 95,
      safety_score: 82,
      success_prob: 84,
      aggregate_score: 87.0,
      risk_factors: ['Lower AST isolation'],
      selected: false
    },
    {
      id: 'P2',
      name: 'Deliberative AST Sandbox',
      path_description: '3-stage micro-task DAG deconstruction with isolated sandbox compilation.',
      efficiency_score: 91,
      safety_score: 98,
      success_prob: 97,
      aggregate_score: 95.3,
      risk_factors: ['+18ms compile overhead'],
      selected: true
    },
    {
      id: 'P3',
      name: 'Exploratory Search',
      path_description: 'Heuristic mutation with broad boundary probing.',
      efficiency_score: 65,
      safety_score: 68,
      success_prob: 60,
      aggregate_score: 64.3,
      risk_factors: ['Higher state entropy'],
      selected: false
    }
  ];

  return (
    <div className="bg-[#090a0f] border border-white/10 rounded-2xl p-3.5 shadow-xl font-mono text-slate-200 space-y-3">
      {/* 1-Line Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            TREE-OF-THOUGHT (ToT)
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-400">
            CORE // v4.2
          </span>
        </div>
        <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
          {branches.length} Branches Evaluated
        </span>
      </div>

      {/* Streamlined Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {branches.map((branch) => {
          const isSelected = branch.selected;
          return (
            <button
              key={branch.id}
              onClick={() => onSelectBranch && onSelectBranch(branch.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-950/30 border-purple-500/60 ring-1 ring-purple-500/20 text-white'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                    isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {branch.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{branch.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                  isSelected ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/5 text-slate-500'
                }`}>
                  {branch.aggregate_score?.toFixed(1) || '92.0'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 pt-1.5 border-t border-white/5">
                <div>Eff: <strong className="text-amber-400">{branch.efficiency_score}%</strong></div>
                <div>Safe: <strong className="text-emerald-400">{branch.safety_score}%</strong></div>
                <div>Succ: <strong className="text-cyan-400">{branch.success_prob}%</strong></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* DAG Micro-Tasks */}
      {subTasks && subTasks.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              DAG Micro-Tasks
            </span>
            <span className="text-[10px] text-slate-400">
              {subTasks.filter(t => t.status === 'COMPLETED').length} / {subTasks.length} Done
            </span>
          </div>

          <div className="space-y-1">
            {subTasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-4 h-4 rounded text-[9px] flex items-center justify-center bg-slate-800 text-slate-400 font-bold shrink-0">
                    {task.id}
                  </span>
                  <span className="text-slate-200 truncate">{task.description}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 border ${
                  task.status === 'COMPLETED' ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' :
                  task.status === 'IN_PROGRESS' ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300 animate-pulse' :
                  'bg-slate-900 border-white/5 text-slate-500'
                }`}>
                  {task.status === 'IN_PROGRESS' ? 'Running' : task.status === 'COMPLETED' ? 'Done' : 'Idle'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
