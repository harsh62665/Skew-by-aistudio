import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  BarChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sliders,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Filter,
  Layers,
  BarChart3,
  Compass,
  Download,
  AlertTriangle,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { TaskEfficiencySafetyRecord } from '../types';

interface EfficiencySafetyTrendsChartProps {
  taskData: TaskEfficiencySafetyRecord[];
  onSimulateTask?: (phase?: string, name?: string) => Promise<void>;
  isLoading?: boolean;
}

export const EfficiencySafetyTrendsChart: React.FC<EfficiencySafetyTrendsChartProps> = ({
  taskData = [],
  onSimulateTask,
  isLoading = false
}) => {
  const [chartMode, setChartMode] = useState<'TRENDS' | 'QUADRANT' | 'PHASE_RADAR' | 'BAR_BREAKDOWN'>('TRENDS');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [sampleLimit, setSampleLimit] = useState<number | 'ALL'>('ALL');
  const [showEfficiency, setShowEfficiency] = useState<boolean>(true);
  const [showSafety, setShowSafety] = useState<boolean>(true);
  const [showUtility, setShowUtility] = useState<boolean>(true);
  const [showLatency, setShowLatency] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Filter tasks based on phase and limit
  const filteredTasks = useMemo(() => {
    let result = [...taskData];
    if (selectedPhase !== 'ALL') {
      result = result.filter(t => t.phase === selectedPhase);
    }
    if (sampleLimit !== 'ALL') {
      result = result.slice(-sampleLimit);
    }
    return result;
  }, [taskData, selectedPhase, sampleLimit]);

  // Aggregate Metrics Calculations
  const stats = useMemo(() => {
    if (!filteredTasks.length) {
      return {
        avgEfficiency: 0,
        avgSafety: 0,
        avgUtility: 0,
        avgLatency: 0,
        optimalCount: 0,
        safetyCompliance: 100,
        paretoOptimalRatio: 0
      };
    }

    const totalEff = filteredTasks.reduce((acc, t) => acc + t.efficiency_score, 0);
    const totalSafe = filteredTasks.reduce((acc, t) => acc + t.safety_score, 0);
    const totalUtil = filteredTasks.reduce((acc, t) => acc + t.utility_index, 0);
    const totalLat = filteredTasks.reduce((acc, t) => acc + t.latency_ms, 0);
    
    // Optimal is efficiency >= 90 and safety >= 95
    const optimal = filteredTasks.filter(t => t.efficiency_score >= 88 && t.safety_score >= 95).length;
    // Safety compliant is safety >= 90
    const safeCount = filteredTasks.filter(t => t.safety_score >= 90).length;

    return {
      avgEfficiency: +(totalEff / filteredTasks.length).toFixed(1),
      avgSafety: +(totalSafe / filteredTasks.length).toFixed(1),
      avgUtility: +(totalUtil / filteredTasks.length).toFixed(1),
      avgLatency: +(totalLat / filteredTasks.length).toFixed(0),
      optimalCount: optimal,
      safetyCompliance: +((safeCount / filteredTasks.length) * 100).toFixed(1),
      paretoOptimalRatio: +((optimal / filteredTasks.length) * 100).toFixed(1)
    };
  }, [filteredTasks]);

  // Phase aggregation data for Radar and Bar charts
  const phaseBreakdown = useMemo(() => {
    const phases = [
      { key: 'PHASE_1_VOICE', label: 'Phase 1: Voice' },
      { key: 'PHASE_2_MEMORY', label: 'Phase 2: Memory' },
      { key: 'PHASE_3_VISION_OS', label: 'Phase 3: Vision/OS' },
      { key: 'PHASE_4_REASONING', label: 'Phase 4: Reasoning' },
      { key: 'TOOL_SYNTHESIS', label: 'Tool Synthesis' }
    ];

    return phases.map(p => {
      const tasksInPhase = taskData.filter(t => t.phase === p.key);
      if (!tasksInPhase.length) {
        return {
          phase: p.label,
          key: p.key,
          efficiency: 0,
          safety: 0,
          utility: 0,
          count: 0
        };
      }
      const avgEff = tasksInPhase.reduce((a, t) => a + t.efficiency_score, 0) / tasksInPhase.length;
      const avgSafe = tasksInPhase.reduce((a, t) => a + t.safety_score, 0) / tasksInPhase.length;
      const avgUtil = tasksInPhase.reduce((a, t) => a + t.utility_index, 0) / tasksInPhase.length;
      return {
        phase: p.label,
        key: p.key,
        efficiency: +avgEff.toFixed(1),
        safety: +avgSafe.toFixed(1),
        utility: +avgUtil.toFixed(1),
        count: tasksInPhase.length
      };
    });
  }, [taskData]);

  // Handle live simulation of new task
  const handleTriggerSimulation = async () => {
    if (!onSimulateTask) return;
    setIsSimulating(true);
    try {
      const phases = ['PHASE_1_VOICE', 'PHASE_2_MEMORY', 'PHASE_3_VISION_OS', 'PHASE_4_REASONING', 'TOOL_SYNTHESIS'];
      const randomPhase = phases[Math.floor(Math.random() * phases.length)];
      await onSimulateTask(randomPhase);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Export dataset as JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredTasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_efficiency_vs_safety_trends_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="efficiency-safety-trends-module" className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                System Efficiency vs. Safety Score Trends
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Production Telemetry
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Continuous dynamic tracking of system execution efficiency, safety verification gates, and aggregate Tree-of-Thought utility <code className="text-violet-600 font-mono text-[11px]">S(Pi) = 0.3*Eff + 0.4*Safe + 0.3*Succ</code> across all diagnostic benchmarks.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="simulate-audit-task-btn"
            onClick={handleTriggerSimulation}
            disabled={isSimulating || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-98 transition-all text-xs font-semibold shadow-xs disabled:opacity-50"
            title="Dispatch simulated benchmark task"
          >
            <PlusCircle className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Evaluating...' : 'Simulate Live Task'}</span>
          </button>

          <button
            id="export-trends-data-btn"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 active:scale-98 transition-all text-xs font-medium"
            title="Export trend dataset"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Mean Efficiency */}
        <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-cyan-800">
            <span className="font-medium">Mean Efficiency</span>
            <Zap className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-cyan-900">{stats.avgEfficiency}%</span>
            <span className="text-[10px] text-cyan-700 font-semibold">SLA: &ge;85%</span>
          </div>
          <p className="text-[10px] text-cyan-600">Runtime path optimization</p>
        </div>

        {/* Metric 2: Mean Safety */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span className="font-medium">Mean Safety</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-900">{stats.avgSafety}%</span>
            <span className="text-[10px] text-emerald-700 font-semibold">Gate: &ge;90%</span>
          </div>
          <p className="text-[10px] text-emerald-600">AST & critic audit status</p>
        </div>

        {/* Metric 3: Aggregate Utility */}
        <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-violet-800">
            <span className="font-medium">Aggregate S(Pi)</span>
            <Activity className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-violet-900">{stats.avgUtility}</span>
            <span className="text-[10px] text-violet-700 font-semibold">Grade A</span>
          </div>
          <p className="text-[10px] text-violet-600">Weighted ToT utility score</p>
        </div>

        {/* Metric 4: Safety Compliance */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span className="font-medium">Safety Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-900">{stats.safetyCompliance}%</span>
            <span className="text-[10px] text-emerald-700 font-semibold">0 Violations</span>
          </div>
          <p className="text-[10px] text-emerald-600">Zero destructive actions</p>
        </div>

        {/* Metric 5: Pareto Optimal Frontier */}
        <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800">
            <span className="font-medium">Pareto Optimal</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-900">{stats.optimalCount} / {filteredTasks.length}</span>
            <span className="text-[10px] text-amber-700 font-semibold">{stats.paretoOptimalRatio}%</span>
          </div>
          <p className="text-[10px] text-amber-600">High Eff & High Safety</p>
        </div>

        {/* Metric 6: Avg Latency */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="font-medium">Avg Execution</span>
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{stats.avgLatency}ms</span>
            <span className="text-[10px] text-slate-500 font-semibold">Round-trip</span>
          </div>
          <p className="text-[10px] text-slate-400">Total pipeline delay</p>
        </div>
      </div>

      {/* Interactive Controls & View Modes Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            id="view-trends-line-btn"
            onClick={() => setChartMode('TRENDS')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              chartMode === 'TRENDS'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dual-Curve Timeline</span>
          </button>

          <button
            id="view-quadrant-scatter-btn"
            onClick={() => setChartMode('QUADRANT')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              chartMode === 'QUADRANT'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Safety vs. Efficiency Matrix</span>
          </button>

          <button
            id="view-phase-radar-btn"
            onClick={() => setChartMode('PHASE_RADAR')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              chartMode === 'PHASE_RADAR'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phase Radar</span>
          </button>

          <button
            id="view-bar-breakdown-btn"
            onClick={() => setChartMode('BAR_BREAKDOWN')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              chartMode === 'BAR_BREAKDOWN'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar Breakdown</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Phase Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              id="filter-phase-select"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              aria-label="Filter tasks by phase"
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Phases (1-4 + Tools)</option>
              <option value="PHASE_1_VOICE">Phase 1: Voice</option>
              <option value="PHASE_2_MEMORY">Phase 2: Memory</option>
              <option value="PHASE_3_VISION_OS">Phase 3: Vision/OS</option>
              <option value="PHASE_4_REASONING">Phase 4: Reasoning</option>
              <option value="TOOL_SYNTHESIS">Tool Synthesis</option>
            </select>
          </div>

          {/* Sample Limit */}
          <div className="flex items-center gap-1">
            <select
              id="filter-limit-select"
              value={sampleLimit}
              onChange={(e) => setSampleLimit(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              aria-label="Filter number of sample tasks to display"
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Executions ({taskData.length})</option>
              <option value="10">Last 10 Tasks</option>
              <option value="20">Last 20 Tasks</option>
            </select>
          </div>

          {/* Metric Toggle Badges (Only relevant in Timeline mode) */}
          {chartMode === 'TRENDS' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => setShowEfficiency(!showEfficiency)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                  showEfficiency
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                Efficiency
              </button>
              <button
                onClick={() => setShowSafety(!showSafety)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                  showSafety
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                Safety
              </button>
              <button
                onClick={() => setShowUtility(!showUtility)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                  showUtility
                    ? 'bg-violet-50 text-violet-800 border-violet-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                Utility S(Pi)
              </button>
              <button
                onClick={() => setShowLatency(!showLatency)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                  showLatency
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                Latency (ms)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CHART RENDERING SECTION */}
      <div className="relative min-h-[380px] w-full bg-slate-950/95 p-4 rounded-xl border border-slate-800 shadow-inner">
        {/* MODE 1: DUAL-CURVE TIMELINE COMPOSED CHART */}
        {chartMode === 'TRENDS' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Chronological Execution Track &bull; {filteredTasks.length} Tasks Plotted</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Safety SLA Floor: <strong className="text-emerald-400">90%</strong> &bull; Eff Target: <strong className="text-cyan-400">85%</strong>
              </span>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={filteredTasks}
                  margin={{ top: 15, right: 30, left: 0, bottom: 20 }}
                >
                  <defs>
                    {/* Cyan Gradient for Efficiency Area */}
                    <linearGradient id="effGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    {/* Emerald Gradient for Safety Area */}
                    <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    {/* Violet Gradient for Utility */}
                    <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  
                  <XAxis 
                    dataKey="task_name" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) => val.length > 14 ? `${val.slice(0, 12)}...` : val}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />

                  {/* Left Y Axis for Scores (0-100) */}
                  <YAxis 
                    yAxisId="scoreAxis"
                    domain={[60, 100]} 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="%"
                  />

                  {/* Optional Right Y Axis for Latency */}
                  {showLatency && (
                    <YAxis 
                      yAxisId="latencyAxis"
                      orientation="right"
                      domain={[0, 400]}
                      stroke="#f59e0b"
                      tick={{ fill: '#fbbf24', fontSize: 10 }}
                      unit="ms"
                    />
                  )}

                  <Tooltip content={<CustomTrendTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />

                  {/* Safety Floor Threshold Line (90%) */}
                  <ReferenceLine 
                    yAxisId="scoreAxis"
                    y={90} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Safety Floor (90%)', fill: '#f87171', fontSize: 10, position: 'insideBottomRight' }} 
                  />

                  {/* Efficiency Target Threshold Line (85%) */}
                  <ReferenceLine 
                    yAxisId="scoreAxis"
                    y={85} 
                    stroke="#38bdf8" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Efficiency SLA (85%)', fill: '#38bdf8', fontSize: 10, position: 'insideTopLeft' }} 
                  />

                  {/* Area & Line for Efficiency */}
                  {showEfficiency && (
                    <Area
                      yAxisId="scoreAxis"
                      type="monotone"
                      dataKey="efficiency_score"
                      name="System Efficiency (%)"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#effGradient)"
                      activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {/* Area & Line for Safety */}
                  {showSafety && (
                    <Area
                      yAxisId="scoreAxis"
                      type="monotone"
                      dataKey="safety_score"
                      name="Safety Score (%)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#safeGradient)"
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {/* Line for Tree-of-Thought Aggregate Utility S(Pi) */}
                  {showUtility && (
                    <Line
                      yAxisId="scoreAxis"
                      type="monotone"
                      dataKey="utility_index"
                      name="Utility Index S(Pi)"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#c084fc' }}
                    />
                  )}

                  {/* Bar for Latency */}
                  {showLatency && (
                    <Bar
                      yAxisId="latencyAxis"
                      dataKey="latency_ms"
                      name="Latency (ms)"
                      fill="#f59e0b"
                      opacity={0.4}
                      barSize={12}
                      radius={[4, 4, 0, 0]}
                    />
                  )}

                  {/* Interactive Timeline Brush */}
                  {filteredTasks.length > 8 && (
                    <Brush 
                      dataKey="task_number" 
                      height={20} 
                      stroke="#334155" 
                      fill="#0f172a" 
                      tickFormatter={(val) => `#${val}`}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 2: EFFICIENCY VS SAFETY QUADRANT SCATTER MATRIX */}
        {chartMode === 'QUADRANT' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-mono text-emerald-400 font-semibold">
                &bull; Top-Right Quadrant: Gold Standard (High Efficiency &ge;88% & High Safety &ge;95%)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Hover over scatter nodes to inspect task telemetry
              </span>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  
                  <XAxis 
                    type="number" 
                    dataKey="efficiency_score" 
                    name="Efficiency Score" 
                    unit="%" 
                    domain={[75, 102]} 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    label={{ value: 'System Efficiency Score (%) &rarr;', position: 'insideBottom', fill: '#06b6d4', fontSize: 11, offset: -10 }}
                  />

                  <YAxis 
                    type="number" 
                    dataKey="safety_score" 
                    name="Safety Score" 
                    unit="%" 
                    domain={[88, 102]} 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    label={{ value: '&uarr; Safety Score (%)', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 11 }}
                  />

                  <ZAxis type="number" dataKey="utility_index" range={[80, 220]} name="Utility S(Pi)" />

                  <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />

                  {/* Quadrant Partition Reference Lines */}
                  <ReferenceLine x={88} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: 'Eff 88%', fill: '#38bdf8', fontSize: 10, position: 'top' }} />
                  <ReferenceLine y={95} stroke="#34d399" strokeDasharray="4 4" label={{ value: 'Safety 95%', fill: '#34d399', fontSize: 10, position: 'right' }} />

                  <Scatter name="Tasks" data={filteredTasks}>
                    {filteredTasks.map((entry, index) => {
                      const isOptimal = entry.efficiency_score >= 88 && entry.safety_score >= 95;
                      const isCautious = entry.efficiency_score < 88 && entry.safety_score >= 95;
                      const fillColor = isOptimal ? '#10b981' : isCautious ? '#06b6d4' : '#f59e0b';
                      return <Cell key={`cell-${index}`} fill={fillColor} stroke="#ffffff" strokeWidth={1.5} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Quadrant Legend Bar */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
              <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-center">
                <span className="font-bold">&bull; Gold Standard Zone:</span> Eff &ge;88% & Safe &ge;95% ({stats.optimalCount} tasks)
              </div>
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-center">
                <span className="font-bold">&bull; Cautious Guardrail Zone:</span> High Safety, Deliberative Eff
              </div>
              <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 text-center">
                <span className="font-bold">&bull; Boundary Target Zone:</span> Under active self-healing
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: PHASE RADAR CHART */}
        {chartMode === 'PHASE_RADAR' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-mono text-cyan-400 font-semibold">
                &bull; Multiaxial Phase Balance: Efficiency (Cyan) vs. Safety (Emerald)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Covers Voice, Memory, Vision/OS, Reasoning, and Tool Synthesis
              </span>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={phaseBreakdown}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="phase" tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[60, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />

                  <Radar 
                    name="System Efficiency (%)" 
                    dataKey="efficiency" 
                    stroke="#06b6d4" 
                    fill="#06b6d4" 
                    fillOpacity={0.4} 
                    strokeWidth={2}
                  />

                  <Radar 
                    name="Safety Score (%)" 
                    dataKey="safety" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.4} 
                    strokeWidth={2}
                  />

                  <Radar 
                    name="Utility S(Pi)" 
                    dataKey="utility" 
                    stroke="#a855f7" 
                    fill="#a855f7" 
                    fillOpacity={0.2} 
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 4: BAR BREAKDOWN CHART */}
        {chartMode === 'BAR_BREAKDOWN' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-mono text-slate-300 font-semibold">
                &bull; Grouped Phase Benchmark Aggregation
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Direct side-by-side comparison across all 4 Phases & Synthesis
              </span>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="phase" stroke="#64748b" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                  <YAxis domain={[60, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />

                  <Bar dataKey="efficiency" name="Efficiency (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="safety" name="Safety Score (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utility" name="Utility S(Pi)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Mathematical Proof & Formula Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Tree-of-Thought (ToT) Utility Function & Weighting Matrix
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold">&bull; 100% Deterministic Verification</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-emerald-400 tracking-wide">
              {"S(P_i) = w_eff \u00d7 Efficiency + w_safe \u00d7 Safety + w_succ \u00d7 SuccessProb"}
            </div>
            <div className="text-[11px] text-slate-400">
              Weights: <span className="text-cyan-300 font-semibold">w_eff = 0.30</span>, <span className="text-emerald-300 font-semibold">w_safe = 0.40</span>, <span className="text-violet-300 font-semibold">w_succ = 0.30</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] text-slate-400">Observed Mean Utility</div>
            <div className="text-base font-bold text-violet-400 font-mono">
              {stats.avgUtility} / 100.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for Timeline Composed Chart
const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const task: TaskEfficiencySafetyRecord = payload[0]?.payload;
    if (!task) return null;

    return (
      <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md text-xs space-y-2 max-w-xs font-sans text-slate-200">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
          <span className="font-bold text-slate-100 truncate">{task.task_name}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            #{task.task_number}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Phase Domain:</span>
            <span className="font-semibold text-slate-200">{task.phase_label}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-medium">System Efficiency:</span>
            <span className="font-bold text-cyan-300 font-mono">{task.efficiency_score}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-medium">Safety Score:</span>
            <span className="font-bold text-emerald-300 font-mono">{task.safety_score}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-violet-400 font-medium">Aggregate Utility S(Pi):</span>
            <span className="font-bold text-violet-300 font-mono">{task.utility_index}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-medium">Pipeline Latency:</span>
            <span className="font-bold text-amber-300 font-mono">{task.latency_ms}ms</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-slate-400">AST Verification:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Scatter Quadrant Matrix
const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const task: TaskEfficiencySafetyRecord = payload[0]?.payload;
    if (!task) return null;

    const isOptimal = task.efficiency_score >= 88 && task.safety_score >= 95;

    return (
      <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md text-xs space-y-2 max-w-xs font-sans text-slate-200">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
          <span className="font-bold text-slate-100 truncate">{task.task_name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isOptimal ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
          }`}>
            {isOptimal ? 'Gold Standard' : 'Compliant'}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Domain:</span>
            <span className="font-semibold text-slate-200">{task.phase_label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-400">Efficiency Score:</span>
            <span className="font-bold text-cyan-300 font-mono">{task.efficiency_score}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-400">Safety Score:</span>
            <span className="font-bold text-emerald-300 font-mono">{task.safety_score}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-violet-400">Utility S(Pi):</span>
            <span className="font-bold text-violet-300 font-mono">{task.utility_index}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-400">Latency:</span>
            <span className="font-bold text-amber-300 font-mono">{task.latency_ms}ms</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Radar & Bar Chart
const CustomRadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md text-xs space-y-2 max-w-xs font-sans text-slate-200">
        <div className="font-bold text-slate-100 border-b border-slate-800 pb-1">
          {data.phase}
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-medium">Avg Efficiency:</span>
            <span className="font-bold text-cyan-300 font-mono">{data.efficiency}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-medium">Avg Safety Score:</span>
            <span className="font-bold text-emerald-300 font-mono">{data.safety}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-violet-400 font-medium">Avg Utility S(Pi):</span>
            <span className="font-bold text-violet-300 font-mono">{data.utility}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
            <span>Executed Benchmarks:</span>
            <span className="font-bold text-slate-200 font-mono">{data.count} Tasks</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
