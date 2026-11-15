import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Volume2, 
  RefreshCw, 
  User, 
  Tags, 
  CheckCircle2, 
  AlertTriangle,
  Smile,
  Code2,
  Play,
  VolumeX,
  FileText,
  MessageSquare,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import { StrictSkewEngineJson } from '../types';

interface SkewEngineViewProps {
  onRunInChat?: (prompt: string) => void;
}

const PRESET_QUERIES = [
  {
    title: 'General Interaction',
    query: 'Initialize all systems. My name is Alex, and I prefer Python and FastAPI.',
    tone: 'CONFIDENT'
  },
  {
    title: 'Emergency State',
    query: 'There is a critical error in the system! Stop execution immediately.',
    tone: 'EMERGENCY'
  },
  {
    title: 'Witty Persona',
    query: 'Tell me a joke about code bugs. Something funny please.',
    tone: 'WITTY'
  },
  {
    title: 'Technical Discussion',
    query: 'Explain the API architecture for the React frontend communicating with the Python backend.',
    tone: 'TECHNICAL'
  }
];

export const SkewEngineView: React.FC<SkewEngineViewProps> = ({ onRunInChat }) => {
  const [queryInput, setQueryInput] = useState<string>('Initialize all systems. My name is Alex, and I prefer Python and FastAPI.');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [enginePayload, setEnginePayload] = useState<StrictSkewEngineJson | null>(null);
  
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
  const [activeTtsChunkIndex, setActiveTtsChunkIndex] = useState<number>(-1);

  useEffect(() => {
    handleRunQuery(queryInput);
  }, []);

  const handleRunQuery = async (inputQuery: string) => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/skew/rag-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputQuery })
      });
      const data = await res.json();
      setEnginePayload(data);
    } catch (err) {
      console.error('Failed to execute SKEW engine:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePlayTTS = () => {
    if (!enginePayload || !enginePayload.tts_chunks || enginePayload.tts_chunks.length === 0) return;
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis API is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    setIsTtsPlaying(true);
    setActiveTtsChunkIndex(0);

    const chunks = enginePayload.tts_chunks;
    let index = 0;

    const speakNext = () => {
      if (index >= chunks.length) {
        setIsTtsPlaying(false);
        setActiveTtsChunkIndex(-1);
        return;
      }

      setActiveTtsChunkIndex(index);
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      
      // Adjust pitch/rate slightly based on tone
      const tone = enginePayload.personality_state.tone;
      if (tone === 'EMERGENCY') {
        utterance.rate = 1.15;
        utterance.pitch = 0.9;
      } else if (tone === 'WITTY') {
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
      } else if (tone === 'TECHNICAL') {
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
      } else {
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
      }

      utterance.onend = () => {
        index++;
        speakNext();
      };
      utterance.onerror = () => {
        setIsTtsPlaying(false);
        setActiveTtsChunkIndex(-1);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const handleStopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTtsPlaying(false);
    setActiveTtsChunkIndex(-1);
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'EMERGENCY': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'WITTY': return <Smile className="w-5 h-5 text-amber-500" />;
      case 'TECHNICAL': return <Code2 className="w-5 h-5 text-cyan-500" />;
      default: return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'EMERGENCY': return 'bg-rose-500 text-white';
      case 'WITTY': return 'bg-amber-500 text-white';
      case 'TECHNICAL': return 'bg-cyan-600 text-white';
      default: return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold tracking-wide uppercase">
              PROMPT 4 MODULE &bull; SKEW ENGINE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-semibold">
              Voice Personality Matrix
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
            RAG Knowledge Ingestion & Voice Personality
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Dynamic identity matrix with contextual RAG extraction, automated entity grounding, and low-latency chunked text-to-speech output.
          </p>
        </div>
      </div>

      {/* Preset Queries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESET_QUERIES.map((scenario, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQueryInput(scenario.query);
              handleRunQuery(scenario.query);
            }}
            className="text-left p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                  {scenario.tone}
                </span>
                {getToneIcon(scenario.tone)}
              </div>
              <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{scenario.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                "{scenario.query}"
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Query Dispatch Bar */}
      <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200/80 space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
            SKEW Engine Command
          </span>
          <span className="text-[11px] text-slate-400 font-mono font-normal">
            POST /api/skew/rag-ingest
          </span>
        </label>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isExecuting) {
                handleRunQuery(queryInput);
              }
            }}
            placeholder="Type a message to trigger RAG entity extraction and dynamic TTS..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
          />
          <button
            onClick={() => handleRunQuery(queryInput)}
            disabled={isExecuting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Processing...' : 'Evaluate'}</span>
          </button>
          {onRunInChat && (
            <button
              onClick={() => onRunInChat(queryInput)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Send to Chat</span>
            </button>
          )}
        </div>
      </div>

      {enginePayload && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RAG Knowledge Ingestion Panel */}
          <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">RAG Knowledge Ingestion</h3>
                  <p className="text-xs text-slate-500">Context relevance and entity extraction mapping</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                {enginePayload.rag_ingestion.relevance_score > 0.8 ? 'ACCEPTED' : 'REJECTED'} ({(enginePayload.rag_ingestion.relevance_score * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <User className="w-3 h-3" /> Identity Fact
                  </span>
                  <div className="text-sm font-bold text-indigo-700 truncate">
                    {enginePayload.rag_ingestion.extracted_entities.user_identity || 'Not Detected'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Tags className="w-3 h-3" /> Context Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {enginePayload.rag_ingestion.extracted_entities.context_tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Files Processed
                </span>
                <div className="space-y-1">
                  {enginePayload.rag_ingestion.files_processed.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personality Matrix & TTS Audio Panel */}
          <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-200/80 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getToneIcon(enginePayload.personality_state.tone)}
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Voice Personality Matrix</h3>
                  <p className="text-xs text-slate-500">Identity: <span className="font-bold font-mono text-indigo-600">{enginePayload.personality_state.active_name}</span></p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${getToneColor(enginePayload.personality_state.tone)} shadow-sm`}>
                {enginePayload.personality_state.tone}
              </span>
            </div>

            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-purple-500" /> TTS Speech Chunks
                </span>
                <div className="flex items-center gap-2">
                  {isTtsPlaying ? (
                    <button
                      onClick={handleStopTTS}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <VolumeX className="w-3 h-3" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={handlePlayTTS}
                      className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" /> Synthesize Audio
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-2 max-h-[300px]">
                {enginePayload.tts_chunks.map((chunk, idx) => {
                  const isActive = activeTtsChunkIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-purple-50 border-purple-300 shadow-md ring-2 ring-purple-400/20' 
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          Chunk {idx + 1}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {chunk.split(/\s+/).length} words
                        </span>
                      </div>
                      <p className={`text-sm ${isActive ? 'text-purple-900 font-medium' : 'text-slate-700'}`}>
                        "{chunk}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
