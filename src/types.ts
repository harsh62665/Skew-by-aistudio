export type SystemState = 'PERCEIVE' | 'PLAN' | 'SYNTHESIZE' | 'ACT' | 'HEAL' | 'EVALUATE';

export type SystemMode = 'SYSTEM_1_FAST' | 'SYSTEM_2_DELIBERATIVE';

export type AssistantVisualState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'THINKING' | 'SPEAKING';

export interface MessageAttachment {
  name: string;
  type: string;
  size: string;
  url?: string;
}

export type OSPrimitive = 'MOVE_TO' | 'CLICK' | 'RIGHT_CLICK' | 'DOUBLE_CLICK' | 'TYPE_TEXT' | 'KEY_COMBO' | 'KEY_COMBINATION' | 'DRAG' | 'DRAG_AND_DROP';

export interface BoundingBoxNormalized {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface StrictVisionAnalysis {
  target_identified: string;
  bounding_box: BoundingBoxNormalized;
  calculated_center_pixels: { x: number; y: number };
  confidence_score: number;
}

export interface StrictOSActionPayload {
  primitive: OSPrimitive;
  coordinates: { x: number; y: number };
  drag_end_coordinates?: { x: number; y: number };
  input_text: string | null;
  keys: string[];
  requires_post_verification: boolean;
}

export interface PostActionVerification {
  verified: boolean;
  expected_state: string;
  observed_state: string;
  visual_delta_percentage: number;
  status: 'MATCHED' | 'SELF_CORRECTION_TRIGGERED';
  retry_count?: number;
}

export interface StrictOSActionResponse {
  vision_analysis: StrictVisionAnalysis;
  os_action_payload: StrictOSActionPayload;
  verification?: PostActionVerification;
}

export type LangGraphNode = 'node_plan' | 'node_tool_route' | 'node_evaluate' | 'node_replan' | 'node_respond';

export interface ToTCandidatePath {
  path_id: 'P1' | 'P2' | 'P3' | string;
  name?: string;
  score: number; // 0.0 - 1.0
  risk: 'Low' | 'Medium' | 'High';
  efficiency?: number; // 0 - 100
  safety?: number; // 0 - 100
  success_prob?: number; // 0 - 100
  description?: string;
}

export interface DAGPlanStep {
  step: number;
  task: string;
  assigned_tool: 'Memory_Store' | 'Dynamic_Code_Engine' | 'OS_Visual_Actuator' | 'Voice_Stream' | 'Kernel_Reasoner' | string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface GraphStateUpdate {
  active_step_id: number;
  input_payload: Record<string, any>;
  next_target_node: LangGraphNode;
}

export interface StrictLangGraphResponse {
  current_graph_node: LangGraphNode;
  tot_evaluation: {
    candidate_paths: ToTCandidatePath[];
    selected_path: 'P1' | 'P2' | 'P3' | string;
    selection_rationale: string;
  };
  dag_plan: DAGPlanStep[];
  graph_state_update: GraphStateUpdate;
}

export interface BenchmarkCheck {
  name: string;
  target: string;
  actual: string | number;
  passed: boolean;
  duration_ms: number;
  details?: string;
}

export interface PhaseAuditMetric {
  status: 'PASSED' | 'FAILED' | 'WARNING';
  latency_ms?: number;
  score: number;
  rag_retrieval_accuracy?: number;
  spatial_precision?: number;
  tot_scoring_accuracy?: number;
  benchmark_checks: BenchmarkCheck[];
}

export interface TaskEfficiencySafetyRecord {
  id: string;
  task_number: number;
  task_name: string;
  phase: 'PHASE_1_VOICE' | 'PHASE_2_MEMORY' | 'PHASE_3_VISION_OS' | 'PHASE_4_REASONING' | 'TOOL_SYNTHESIS';
  phase_label: string;
  efficiency_score: number; // 0 - 100
  safety_score: number; // 0 - 100
  success_prob: number; // 0 - 100
  utility_index: number; // 0.3 * eff + 0.4 * safe + 0.3 * succ
  latency_ms: number;
  ast_verified: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING';
  execution_timestamp: string;
}

export interface StrictAuditReportJson {
  audit_timestamp: string;
  overall_production_status: 'PASSED' | 'FAILED' | 'WARNING';
  phase_metrics: {
    phase_1_voice: PhaseAuditMetric;
    phase_2_memory: PhaseAuditMetric;
    phase_3_vision_os: PhaseAuditMetric;
    phase_4_reasoning: PhaseAuditMetric;
  };
  bottleneck_reports: string[];
  production_readiness_score: string;
  task_trend_history?: TaskEfficiencySafetyRecord[];
}

export type SkewAdvancedExecutionMode = 'CONSENSUS_PLAN' | 'WORKFLOW_RECORD' | 'REMOTE_RELAY' | 'HUD_COPILOT' | 'PROACTIVE_DAEMON';
export type SkewRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SkewProtocolV240 {
  protocol_version: string;
  session_id: string;
  timestamp_utc: string;
  system_state: {
    active_assistant_name: string;
    execution_mode: string;
    execution_status?: string;
    risk_level: string;
    safety_guard?: {
      kill_switch_engaged: boolean;
      rate_limit_hz: number;
      enforce_active_window_lock: boolean;
      allowed_targets: string[];
    };
  };
  tri_agent_consensus: {
    consensus_id?: string;
    status: string;
    confidence_score?: number;
    planner_plan?: string[];
    coder_payload?: string;
    critic_status?: 'APPROVED' | 'REJECTED' | string;
    critic_audit_feedback?: string;
    agents?: {
      planner: {
        status: string;
        plan_steps: Array<{ id: number; action: string; target: string }>;
      };
      coder: {
        status: string;
        payload_ref: string;
        ast_safe: boolean;
      };
      critic: {
        status: string;
        audit_code: string;
        feedback: string;
      };
    };
  };
  spatial_viewport?: {
    display_index: number;
    resolution: { width: number; height: number; scale_factor: number };
    target_bounding_box: {
      format: string;
      coordinates: number[];
      absolute_pixels: { x: number; y: number; w: number; h: number };
    };
  };
  workflow_macro_synthesis: {
    is_recording: boolean;
    synthesized_tool_name: string | null;
    ast_verified?: boolean;
    security?: {
      ast_verified: boolean;
      sha256: string;
      allowed_primitives: string[];
      blocked_calls_detected: string[];
    };
  };
  hud_telemetry: {
    theme?: string;
    fps?: number;
    foreground_application: string;
    context_detected?: string;
    active_overlay_layer?: string;
    hud_annotations?: string[];
    annotations?: Array<{ id: string; type: string; text: string }>;
  };
  proactive_daemon_alert?: {
    is_proactive: boolean;
    priority: 'INFO' | 'WARNING' | 'URGENT';
    alert_reason: string | null;
  };
  tts_chunks?: string[];
}

export type StrictSkewAdvancedJson = SkewProtocolV240;

export type SkewDaemonTriggerType = 'WAKE_WORD_AUDIO' | 'CLIPBOARD_TELEMETRY' | 'PROACTIVE_SCHEDULER' | 'OS_TELEMETRY_ALERT';
export type SkewDaemonTaskType = 'SILENT_CACHE' | 'SYSTEM_NOTIFY' | 'VOICE_ALERT' | 'ASYNC_EXECUTE';

export interface StrictSkewDaemonJson {
  daemon_telemetry: {
    active_identity: 'SKEW';
    trigger_type: SkewDaemonTriggerType;
    proaction_threshold: number;
    should_interrupt_user: boolean;
  };
  background_action: {
    task_type: SkewDaemonTaskType;
    notification_title: string | null;
    notification_body: string | null;
    target_command: string | null;
  };
  tts_voice_chime: string[];
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  mode?: SystemMode;
  attachment?: MessageAttachment;
  reasoningSteps?: string[];
  totBranches?: ToTBranch[];
  codeSnippet?: {
    language: string;
    code: string;
    output?: string;
    status?: 'success' | 'healed' | 'error';
  };
  spatialAction?: {
    elementName: string;
    coordinates: { x: number; y: number };
    confidence: number;
    actionType: string;
  };
  osActionResponse?: StrictOSActionResponse;
  langgraphState?: StrictLangGraphResponse;
  scheduledTask?: {
    title: string;
    trigger: string;
    frequency: string;
    status: 'scheduled' | 'running' | 'completed';
    isoTimestamp?: string;
  };
  memoryCommit?: StrictMemoryProtocolJson;
  ragContextSources?: VectorMemoryNode[];
  jarvisProtocol?: StrictJarvisInteractionJson;
  jarvisExec?: StrictJarvisExecJson;
  skewEngine?: StrictSkewEngineJson;
  skewAdvanced?: StrictSkewAdvancedJson;
  skewDaemon?: StrictSkewDaemonJson;
  quickAction?: {
    type: 'URL_OPEN' | 'SEARCH' | 'NAVIGATE' | 'VIEW_SWITCH' | 'NONE';
    label: string;
    targetUrl?: string;
    viewTarget?: string;
    cleanResponseText: string;
    isQuickAction: boolean;
  };
  calculationResult?: {
    expression: string;
    result: string | number;
    category?: 'MATH' | 'UNIT_CONVERT' | 'CURRENCY' | 'TIME';
    steps?: string[];
  };
  scratchpadNoteSaved?: {
    title: string;
    content: string;
    category: string;
    timestamp: string;
  };
  youtubeSemanticSearch?: {
    originalDescription: string;
    synthesizedQuery: string;
    likelyVideoTitle?: string;
    searchUrl: string;
    alternativeQueries: string[];
    identifiedElements?: {
      actors?: string[];
      action?: string[];
      setting?: string[];
      category?: string;
    };
    explanation: string;
  };
  assistantPersona?: 'JARVIS_PRIME' | 'SKEW_AUTONOMOUS' | 'HUMAN_REALISTIC';
  omniCoreTelemetry?: {
    engineTier: string;
    deliberationPath?: string;
    consensusStatus?: 'APPROVED' | 'AUDITED' | 'REJECTED' | 'REFINING';
    sandboxReturnCode?: number;
    vectorSync?: boolean;
    activePersona?: 'JARVIS_PRIME' | 'SKEW_AUTONOMOUS' | 'HUMAN_REALISTIC';
  };
}

export type SkewPersonalityTone = 'CONFIDENT' | 'WITTY' | 'TECHNICAL' | 'EMERGENCY';

export interface StrictSkewEngineJson {
  rag_ingestion: {
    files_processed: string[];
    extracted_entities: {
      user_identity?: string;
      context_tags: string[];
    };
    relevance_score: number;
  };
  personality_state: {
    active_name: string;
    tone: SkewPersonalityTone;
  };
  tts_chunks: string[];
}

export type JarvisOperationalMode = 'GENERAL' | 'REALTIME';

export interface JarvisMemoryPayload {
  save_to_vector_db: boolean;
  extracted_facts: string[];
  namespace?: 'learning_data/' | 'chats_data/' | string;
}

export interface JarvisSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source: 'Tavily' | 'Google Search' | 'Live Scraping Engine';
  published_date?: string;
}

export interface JarvisRAGSourceItem {
  id: string;
  namespace: 'learning_data/' | 'chats_data/' | string;
  content: string;
  similarity: number;
  tags?: string[];
}

export interface StrictJarvisInteractionJson {
  mode_selected: JarvisOperationalMode;
  search_required: boolean;
  search_query: string | null;
  memory_payload: JarvisMemoryPayload;
  response_chunks: string[];
  action_trigger: string;
  search_results?: JarvisSearchResultItem[];
  retrieved_context_sources?: JarvisRAGSourceItem[];
  routing_rationale?: string;
  latency_breakdown_ms?: {
    router_eval_ms: number;
    search_scraper_ms?: number;
    rag_retrieval_ms: number;
    tts_chunking_ms: number;
    total_ms: number;
  };
}

export type JarvisExecMode = 'PARALLEL_ASYNC' | 'SINGLE_TASK' | 'VISION_INSPECT';
export type JarvisExecActionType = 'OPEN_APP' | 'BROWSE_URL' | 'MEDIA_CONTROL' | 'SYSTEM_MUTE' | 'VOLUME_SET' | 'FILE_OPERATION' | 'SYSTEM_COMMAND';

export interface JarvisExecTaskItem {
  action: JarvisExecActionType | string;
  target: string;
  async_priority: number;
  status?: 'PENDING' | 'EXECUTING' | 'RESOLVED' | 'FAILED';
  duration_ms?: number;
  result_summary?: string;
}

export interface JarvisVisionInspection {
  required: boolean;
  target_element: string | null;
  spatial_coordinates?: { x: number; y: number };
  confidence?: number;
  frame_timestamp?: string;
  status?: 'ACTIVE' | 'CONVERGED' | 'BYPASSED';
}

export interface StrictJarvisExecJson {
  execution_mode: JarvisExecMode;
  task_queue: JarvisExecTaskItem[];
  vision_inspection: JarvisVisionInspection;
  tts_stream_chunks: string[];
  parallel_gather_metrics?: {
    tasks_count: number;
    wall_clock_saved_ms: number;
    total_async_duration_ms: number;
  };
}

export interface StrictUltronProtocolJson {
  system_state: 'PERCEIVE' | 'PLAN' | 'SYNTHESIZE' | 'ACT' | 'HEAL';
  tot_rationale: string;
  target_coordinates: { x: number; y: number };
  action_payload: {
    action_type: 'TOOL_EXECUTE' | 'CODE_SYNTHESIS' | 'OS_INPUT' | 'RESPONSE';
    target_name: string;
    code_snippet: string | null;
    parameters: Record<string, any>;
  };
  memory_commit: string;
}

export type MemoryAction = 'WRITE' | 'QUERY' | 'UPDATE' | 'NONE';
export type MemoryTargetLayer = 'VECTOR_DB' | 'SQLITE' | 'DUAL';
export type MemoryCategory = 'USER_PREFERENCE' | 'SCHEDULED_TASK' | 'PROJECT_CONTEXT' | 'SYSTEM_FACT';

export interface StrictMemoryProtocolJson {
  memory_action: MemoryAction;
  target_layer: MemoryTargetLayer;
  memory_data: {
    category: MemoryCategory;
    content_payload: string;
    metadata: {
      timestamp: string; // Standardized ISO 8601 (YYYY-MM-DDTHH:MM:SS)
      priority: number; // 1-5
      tags: string[];
    };
  };
}

export interface SqliteSessionRecord {
  id: string;
  session_id: string;
  timestamp: string;
  event_type: 'USER_INPUT' | 'AGENT_OUTPUT' | 'SYSTEM_LOG' | 'STATE_CHANGE' | 'AST_EXECUTION';
  context_snippet: string;
  token_count: number;
}

export interface VectorMemoryNode {
  id: string;
  category: MemoryCategory;
  content_payload: string;
  embedding_vector: number[]; // High-dimensional embedding representation
  cosine_similarity?: number;
  metadata: {
    timestamp: string;
    priority: number;
    tags: string[];
    source_layer: MemoryTargetLayer;
  };
}

export interface DualLayerMemoryState {
  sqlite_records_count: number;
  vector_nodes_count: number;
  recent_sqlite_events: SqliteSessionRecord[];
  vector_nodes: VectorMemoryNode[];
  rag_active_context_window: string[];
}

export interface ToTBranch {
  id: 'P1' | 'P2' | 'P3' | string;
  name: string;
  path_description: string;
  efficiency_score: number; // 0 - 100
  safety_score: number; // 0 - 100
  success_prob: number; // 0 - 100
  aggregate_score: number;
  risk_factors: string[];
  selected: boolean;
}

export interface ToTEvaluation {
  branches_evaluated: number;
  chosen_path_reasoning: string;
  branches?: ToTBranch[];
}

export interface SubTask {
  id: number;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  dependencies?: number[];
  duration_ms?: number;
  output_summary?: string;
}

export interface VisualCoords {
  x: number;
  y: number;
  x_min?: number;
  y_min?: number;
  x_max?: number;
  y_max?: number;
  element_tag?: string;
  confidence?: number;
}

export interface ActionPayload {
  type: 'EXECUTE_TOOL' | 'SYNTHESIZE_CODE' | 'OS_INPUT' | 'RESPONSE';
  target: string;
  parameters: Record<string, any>;
  code_snippet?: string | null;
  visual_coords?: VisualCoords;
}

export interface MemoryUpdate {
  write_to_episodic: string;
  schedule_trigger: string;
  tags?: string[];
  confidence?: number;
}

export interface PerceptionSnapshot {
  screen_focus: string;
  active_window: string;
  mouse_pos: { x: number; y: number };
  detected_elements: Array<{
    id: string;
    label: string;
    bbox: [number, number, number, number]; // [xmin, ymin, xmax, ymax] (0-100%)
    interactive: boolean;
  }>;
  system_metrics: {
    cpu_usage_pct: number;
    ram_usage_gb: number;
    token_rate_sec: number;
    active_threads: number;
    entropy: number;
  };
}

export interface UltronProtocolResponse {
  system_state: SystemState;
  cognitive_mode?: SystemMode;
  tot_evaluation: ToTEvaluation;
  langgraph_state?: StrictLangGraphResponse;
  sub_tasks: SubTask[];
  action_payload: ActionPayload;
  vision_analysis?: StrictVisionAnalysis;
  os_action_payload?: StrictOSActionPayload;
  post_verification?: PostActionVerification;
  memory_update: MemoryUpdate;
  memory_protocol?: StrictMemoryProtocolJson;
  jarvis_protocol?: StrictJarvisInteractionJson;
  jarvis_exec?: StrictJarvisExecJson;
  skew_engine?: StrictSkewEngineJson;
  skew_advanced?: StrictSkewAdvancedJson;
  skew_daemon?: StrictSkewDaemonJson;
  rag_retrieved_context?: VectorMemoryNode[];
  perception_snapshot?: PerceptionSnapshot;
  healing_context?: {
    attempt: number;
    max_attempts: number;
    error_stack?: string;
    root_cause?: string;
    patch_applied?: string;
  };
  conversational_response?: string;
  response_text?: string;
  raw_reasoning_summary?: string;
  omni_telemetry?: {
    engineTier: string;
    deliberationPath?: string;
    consensusStatus?: 'APPROVED' | 'REJECTED' | 'REFINING';
    sandboxReturnCode?: number;
    vectorSync?: boolean;
    activePersona?: 'JARVIS_PRIME' | 'SKEW_AUTONOMOUS' | 'HUMAN_REALISTIC';
  };
  _api_model_used?: string;
  _api_status?: string;
  _api_note?: string;
}

export interface SynthesizedTool {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'bash' | 'rust';
  code: string;
  ast_status: 'VALID' | 'SYNTAX_ERROR' | 'SANDBOX_VERIFIED';
  test_results?: {
    success: boolean;
    stdout: string;
    stderr: string;
    execution_time_ms: number;
    return_code: number;
  };
  created_at: string;
  version: number;
  tags: string[];
}

export interface EpisodicMemoryItem {
  id: string;
  timestamp: string;
  content: string;
  source_state: SystemState;
  vector_preview: number[];
  tags: string[];
  schedule_trigger?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  step: SystemState | 'BOOT' | 'SYSTEM' | 'TELEMETRY' | 'VOICE' | 'SANDBOX';
  message: string;
  data?: any;
  level: 'info' | 'warn' | 'error' | 'success' | 'heal' | 'tot';
}

export interface AutoSuggestionChip {
  id: string;
  prompt: string;
  label: string;
  category: 'ONLINE_SEARCH' | 'DEEPEN' | 'EXECUTE' | 'CLARIFY';
  searchQueryUsed?: string;
  onlineCheckSnippet?: string;
  sourceTitle?: string;
  sourceUrl?: string;
}

export interface AutoSuggestionsResponse {
  success: boolean;
  suggestions: AutoSuggestionChip[];
  overallTopic?: string;
  onlineSearchSummary?: string;
  isOnlineChecked: boolean;
  searchQueriesPerformed?: string[];
  timestamp: string;
}

