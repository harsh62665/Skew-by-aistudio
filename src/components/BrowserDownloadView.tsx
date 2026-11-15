import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Search,
  Download,
  Play,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Film,
  ExternalLink,
  FolderDown,
  Link2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bookmark,
  Video,
  FileVideo,
  PauseCircle
} from 'lucide-react';
import { executeOpenUrl } from '../utils/commandInterceptor';

interface MovieItem {
  identifier: string;
  title: string;
  description: string;
  year: string;
  downloads: number;
  runtime?: string;
  creator?: string;
  posterUrl: string;
  pageUrl: string;
}

interface MovieFile {
  name: string;
  format: string;
  sizeBytes: number;
  length?: string;
  width?: string;
  height?: string;
  directUrl: string;
  streamUrl: string;
  downloadUrl: string;
}

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface NavigatedPage {
  finalUrl: string;
  title: string;
  description: string;
  isDirectMedia: boolean;
  contentType: string;
  mediaItems: Array<{ url: string; type: string; label: string; sizeBytes?: number }>;
  links: Array<{ title: string; url: string }>;
  textSummary: string;
  htmlPreview: string;
}

interface DownloadTask {
  id: string;
  filename: string;
  sourceUrl: string;
  status: 'DOWNLOADING' | 'COMPLETED' | 'NATIVE_HANDOFF' | 'FAILED' | 'CANCELLED';
  loadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  startedAt: string;
  error?: string;
}

interface BrowserDownloadViewProps {
  initialQuery?: string;
}

const GENRE_FILTERS = [
  { label: 'Popular Classics', query: 'feature_films' },
  { label: 'Sci-Fi', query: 'sci-fi full movie' },
  { label: 'Action', query: 'action adventure movie' },
  { label: 'Comedy', query: 'charlie chaplin comedy movie' },
  { label: 'Horror', query: 'horror classic full movie' },
  { label: 'Hindi / Indian', query: 'hindi indian classic movie' },
  { label: 'Documentary', query: 'nature space documentary' },
];

const QUICK_BOOKMARKS = [
  { label: 'Archive.org Movies', url: 'https://archive.org/details/feature_films' },
  { label: 'Wikimedia Videos', url: 'https://commons.wikimedia.org/wiki/Category:Videos' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' },
  { label: 'Open Culture Movies', url: 'https://www.openculture.com/freemoviesonline' },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx >= 2 ? 1 : 0)} ${units[idx]}`;
}

export const BrowserDownloadView: React.FC<BrowserDownloadViewProps> = ({ initialQuery }) => {
  const [activeTab, setActiveTab] = useState<'MOVIES' | 'BROWSER' | 'DOWNLOADS' | 'DIRECT'>('MOVIES');
  const [addressInput, setAddressInput] = useState<string>(initialQuery || 'sci-fi full movie');

  // Movie Finder state
  const [selectedGenre, setSelectedGenre] = useState<string>('Popular Classics');
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(false);
  const [movieError, setMovieError] = useState<string | null>(null);

  // Selected Movie Files Drawer
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [movieFiles, setMovieFiles] = useState<MovieFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // Video Preview Player
  const [previewVideo, setPreviewVideo] = useState<{ title: string; streamUrl: string; downloadUrl: string; filename: string } | null>(null);

  // Web Browser State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [navigatedPage, setNavigatedPage] = useState<NavigatedPage | null>(null);
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResult[]>([]);

  // Direct URL downloader
  const [directMediaUrl, setDirectMediaUrl] = useState<string>('');
  const [directFilename, setDirectFilename] = useState<string>('');

  // Downloads state
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const searchMovies = useCallback(async (query: string) => {
    setIsLoadingMovies(true);
    setMovieError(null);
    try {
      const resp = await fetch(`/api/browser/search?type=movies&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to search movies');
      }
      setMovies(data.movies || []);
    } catch (err: any) {
      setMovieError(err?.message || 'Could not reach movie archive.');
    } finally {
      setIsLoadingMovies(false);
    }
  }, []);

  const navigateToUrl = useCallback(async (url: string, pushHistory = true) => {
    setActiveTab('BROWSER');
    setIsNavigating(true);
    setBrowserError(null);
    setWebSearchResults([]);
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    setAddressInput(normalized);

    try {
      const resp = await fetch('/api/browser/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to load URL');
      }
      setNavigatedPage(data);
      setAddressInput(data.finalUrl || normalized);
      if (pushHistory) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIdx + 1);
          const next = [...sliced, data.finalUrl || normalized];
          setHistoryIdx(next.length - 1);
          return next;
        });
      }
    } catch (err: any) {
      setBrowserError(err?.message || 'Unable to render page.');
    } finally {
      setIsNavigating(false);
    }
  }, [historyIdx]);

  const searchWeb = useCallback(async (query: string) => {
    setActiveTab('BROWSER');
    setIsNavigating(true);
    setBrowserError(null);
    setNavigatedPage(null);
    try {
      const resp = await fetch(`/api/browser/search?type=web&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Web search failed');
      }
      setWebSearchResults(data.results || []);
    } catch (err: any) {
      setBrowserError(err?.message || 'Web search error.');
    } finally {
      setIsNavigating(false);
    }
  }, []);

  // Listen for clicks inside the sandboxed browser iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'skew-browser-navigate' && typeof e.data.url === 'string') {
        navigateToUrl(e.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigateToUrl]);

  // Initial load
  useEffect(() => {
    const q = initialQuery?.trim();
    if (q && /^https?:\/\//i.test(q)) {
      navigateToUrl(q);
    } else if (q) {
      setAddressInput(q);
      searchMovies(q);
    } else {
      searchMovies('feature_films');
    }
  }, [initialQuery]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = addressInput.trim();
    if (!val) return;
    if (/^https?:\/\//i.test(val) || (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(val) && !val.includes(' '))) {
      navigateToUrl(val);
    } else if (activeTab === 'BROWSER') {
      searchWeb(val);
    } else {
      setActiveTab('MOVIES');
      searchMovies(val);
    }
  };

  const handleSelectMovie = async (movie: MovieItem) => {
    setSelectedMovie(movie);
    setMovieFiles([]);
    setIsLoadingFiles(true);
    try {
      const resp = await fetch(`/api/browser/archive-files?identifier=${encodeURIComponent(movie.identifier)}`);
      const data = await resp.json();
      if (resp.ok) {
        setMovieFiles(data.files || []);
      }
    } catch {
      // handled by empty state
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const startRealDownload = async (remoteUrl: string, filename: string, sizeBytes?: number) => {
    const cleanName = (filename || 'movie_download.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    const proxyUrl = `/api/browser/download?url=${encodeURIComponent(remoteUrl)}&filename=${encodeURIComponent(cleanName)}`;
    const taskId = `DL-${Date.now()}`;

    // For large files (>= 200 MB) or unknown size > 200 MB, hand off directly to native browser / Android DownloadManager
    if (!sizeBytes || sizeBytes > 200 * 1024 * 1024) {
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloads((prev) => [
        {
          id: taskId,
          filename: cleanName,
          sourceUrl: remoteUrl,
          status: 'NATIVE_HANDOFF',
          loadedBytes: sizeBytes || 0,
          totalBytes: sizeBytes || 0,
          speedBytesPerSec: 0,
          startedAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setActiveTab('DOWNLOADS');
      return;
    }

    // Tracked streaming download with live MB/s progress + Blob save
    const controller = new AbortController();
    abortControllersRef.current.set(taskId, controller);

    setDownloads((prev) => [
      {
        id: taskId,
        filename: cleanName,
        sourceUrl: remoteUrl,
        status: 'DOWNLOADING',
        loadedBytes: 0,
        totalBytes: sizeBytes,
        speedBytesPerSec: 0,
        startedAt: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    setActiveTab('DOWNLOADS');

    try {
      const resp = await fetch(proxyUrl, { signal: controller.signal });
      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const contentLength = Number(resp.headers.get('content-length') || sizeBytes || 0);
      const reader = resp.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.byteLength;
          const elapsedSec = Math.max(0.2, (Date.now() - startTime) / 1000);
          const speed = loaded / elapsedSec;
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === taskId
                ? { ...d, loadedBytes: loaded, totalBytes: contentLength || loaded, speedBytesPerSec: speed }
                : d
            )
          );
        }
      }

      const blob = new Blob(chunks as BlobPart[]);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setDownloads((prev) =>
        prev.map((d) =>
          d.id === taskId ? { ...d, status: 'COMPLETED', loadedBytes: loaded, totalBytes: loaded } : d
        )
      );
    } catch (err: any) {
      const isCancelled = err?.name === 'AbortError';
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === taskId
            ? {
                ...d,
                status: isCancelled ? 'CANCELLED' : 'FAILED',
                error: isCancelled ? 'Cancelled by user' : err?.message || 'Download interrupted',
              }
            : d
        )
      );
    } finally {
      abortControllersRef.current.delete(taskId);
    }
  };

  const cancelDownload = (taskId: string) => {
    const controller = abortControllersRef.current.get(taskId);
    if (controller) {
      controller.abort();
    }
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prevUrl = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      navigateToUrl(prevUrl, false);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const nextUrl = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      navigateToUrl(nextUrl, false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-10">
      {/* Top Browser Chrome & Unified Search Bar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Cloud Browser &amp; Movie Downloader
            </h2>
            <p className="text-xs text-slate-400">
              Browse live websites, search full-length open archive movies, stream previews, and download MP4 files directly to your device.
            </p>
          </div>

          {/* Segmented Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('MOVIES')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'MOVIES'
                  ? 'bg-[#00F5A0] text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BROWSER')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'BROWSER'
                  ? 'bg-[#00F5A0] text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Real Browser</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DOWNLOADS')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'DOWNLOADS'
                  ? 'bg-[#00F5A0] text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Downloads ({downloads.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DIRECT')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'DIRECT'
                  ? 'bg-[#00F5A0] text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Direct URL</span>
            </button>
          </div>
        </div>

        {/* Navigation & Address Bar */}
        <form onSubmit={handleAddressSubmit} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBack}
              disabled={historyIdx <= 0}
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleForward}
              disabled={historyIdx >= history.length - 1}
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'BROWSER' && navigatedPage?.finalUrl) {
                  navigateToUrl(navigatedPage.finalUrl, false);
                } else {
                  searchMovies(addressInput || 'feature_films');
                }
              }}
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${isNavigating || isLoadingMovies ? 'animate-spin text-[#00F5A0]' : ''}`} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2 px-3.5 min-h-[42px] rounded-xl bg-slate-950 border border-white/15 focus-within:border-[#00F5A0]/60">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Search movie name OR paste website URL (https://...)..."
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="min-h-[42px] px-5 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-sm whitespace-nowrap cursor-pointer transition-colors"
          >
            {activeTab === 'BROWSER' ? 'Go / Search' : 'Find Movies'}
          </button>
        </form>

        {/* Quick Bookmarks Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
            <Bookmark className="w-3 h-3" />
            Bookmarks:
          </span>
          {QUICK_BOOKMARKS.map((bm) => (
            <button
              key={bm.url}
              type="button"
              onClick={() => navigateToUrl(bm.url)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {bm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Stream Video Player Modal / Bar */}
      {previewVideo && (
        <div className="glass-card rounded-2xl p-4 space-y-3 border border-[#00F5A0]/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Video className="w-4 h-4 text-[#00F5A0] shrink-0" />
              <span className="text-sm font-semibold text-white truncate">{previewVideo.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={previewVideo.downloadUrl}
                download={previewVideo.filename}
                className="px-3 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save MP4</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <video
            key={previewVideo.streamUrl}
            src={previewVideo.streamUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[420px] rounded-xl bg-black"
          />
        </div>
      )}

      {/* TAB 1: MOVIES FINDER & DOWNLOADER */}
      {activeTab === 'MOVIES' && (
        <div className="space-y-4">
          {/* Genre Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {GENRE_FILTERS.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => {
                  setSelectedGenre(g.label);
                  setAddressInput(g.query);
                  searchMovies(g.query);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
                  selectedGenre === g.label
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                    : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {movieError && (
            <div className="glass-card rounded-xl p-4 border border-rose-500/40 text-rose-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{movieError}</span>
            </div>
          )}

          {isLoadingMovies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-4 h-56 animate-pulse bg-slate-900/50" />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center space-y-2">
              <Film className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">No movies found for this search. Try another title or genre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map((movie) => (
                <div
                  key={movie.identifier}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-white/10 hover:border-[#00F5A0]/40 transition-colors"
                >
                  <div>
                    <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <h3 className="text-sm font-semibold text-white line-clamp-1">{movie.title}</h3>
                        <div className="text-[11px] text-slate-300 tabular-nums">
                          {movie.year} · {movie.downloads.toLocaleString()} downloads{movie.runtime ? ` · ${movie.runtime}` : ''}
                        </div>
                      </div>
                    </div>

                    <p className="p-3.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {typeof movie.description === 'string'
                        ? movie.description.replace(/<[^>]+>/g, '')
                        : 'Open-archive full video available for streaming and download.'}
                    </p>
                  </div>

                  <div className="px-3.5 pb-3.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectMovie(movie)}
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Stream / Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToUrl(movie.pageUrl)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs cursor-pointer"
                      title="Open page in SKEW Browser"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Movie Files Modal */}
          {selectedMovie && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-950 border border-white/15 shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{selectedMovie.title}</h3>
                    <p className="text-xs text-slate-400">Select video format to stream or download to your device</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
                  {isLoadingFiles ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00F5A0]" />
                      <span>Fetching downloadable MP4 &amp; video files...</span>
                    </div>
                  ) : movieFiles.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-sm text-slate-300">No direct MP4 files listed for this item.</p>
                      <button
                        type="button"
                        onClick={() => executeOpenUrl(selectedMovie.pageUrl)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Archive Page Externally</span>
                      </button>
                    </div>
                  ) : (
                    movieFiles.map((file) => (
                      <div
                        key={file.name}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <FileVideo className="w-5 h-5 text-cyan-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{file.name}</p>
                            <p className="text-xs text-slate-400 tabular-nums">
                              {file.format} · {formatBytes(file.sizeBytes)}
                              {file.width && file.height ? ` · ${file.width}×${file.height}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!/\.srt$/i.test(file.name) && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewVideo({
                                  title: `${selectedMovie.title} — ${file.name}`,
                                  streamUrl: file.streamUrl,
                                  downloadUrl: file.downloadUrl,
                                  filename: file.name,
                                });
                                setSelectedMovie(null);
                              }}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 text-[#00F5A0]" />
                              <span>Watch</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              startRealDownload(file.directUrl, file.name, file.sizeBytes);
                              setSelectedMovie(null);
                            }}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REAL WEB BROWSER & MEDIA SNIFFER */}
      {activeTab === 'BROWSER' && (
        <div className="space-y-4">
          {browserError && (
            <div className="glass-card rounded-xl p-4 border border-rose-500/40 text-rose-200 text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{browserError}</span>
              </div>
              {addressInput.startsWith('http') && (
                <button
                  type="button"
                  onClick={() => executeOpenUrl(addressInput)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white whitespace-nowrap cursor-pointer"
                >
                  Open in System Browser
                </button>
              )}
            </div>
          )}

          {isNavigating && (
            <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center gap-2 text-slate-300">
              <Loader2 className="w-7 h-7 animate-spin text-[#00F5A0]" />
              <span className="text-sm">Loading webpage &amp; scanning downloadable media...</span>
            </div>
          )}

          {/* Web Search Results List */}
          {!isNavigating && webSearchResults.length > 0 && (
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Live Web Search Results</h3>
              <div className="divide-y divide-white/10">
                {webSearchResults.map((res, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => navigateToUrl(res.url)}
                        className="text-sm font-semibold text-[#00F5A0] hover:underline text-left cursor-pointer"
                      >
                        {res.title}
                      </button>
                      <p className="text-xs text-slate-400 truncate">{res.url}</p>
                      {res.snippet && <p className="text-xs text-slate-300 mt-1 line-clamp-2">{res.snippet}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigateToUrl(res.url)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => executeOpenUrl(res.url)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                        title="Open in external tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rendered Webpage + Sniffed Media Bar */}
          {!isNavigating && navigatedPage && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/10">
                <div className="px-4 py-2.5 bg-slate-950/90 border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{navigatedPage.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{navigatedPage.finalUrl}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => executeOpenUrl(navigatedPage.finalUrl)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>External Tab</span>
                  </button>
                </div>

                {navigatedPage.isDirectMedia ? (
                  <div className="p-6 text-center space-y-4">
                    <FileVideo className="w-10 h-10 text-[#00F5A0] mx-auto" />
                    <div>
                      <h4 className="text-base font-semibold text-white">{navigatedPage.title}</h4>
                      <p className="text-xs text-slate-400">{navigatedPage.contentType}</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVideo({
                            title: navigatedPage.title,
                            streamUrl: `/api/browser/stream?url=${encodeURIComponent(navigatedPage.finalUrl)}`,
                            downloadUrl: `/api/browser/download?url=${encodeURIComponent(navigatedPage.finalUrl)}&filename=${encodeURIComponent(navigatedPage.title)}`,
                            filename: navigatedPage.title,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#00F5A0]" />
                        <span>Stream Video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startRealDownload(navigatedPage.finalUrl, navigatedPage.title)}
                        className="px-4 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Now</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    title={navigatedPage.title}
                    sandbox="allow-scripts"
                    srcDoc={navigatedPage.htmlPreview}
                    className="w-full h-[540px] bg-[#0d1017] border-0"
                  />
                )}
              </div>

              {/* Right Sidebar: Detected Downloadable Videos & Page Links */}
              <div className="glass-card rounded-2xl p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Detected Videos &amp; Files ({navigatedPage.mediaItems.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Media streams sniffed automatically from this page
                  </p>
                </div>

                {navigatedPage.mediaItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No direct MP4/video tags found on this page. Click a link inside the page or search Archive.org in the Movies tab.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {navigatedPage.mediaItems.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                        <div className="text-xs font-medium text-white truncate">{m.label}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewVideo({
                                title: m.label,
                                streamUrl: `/api/browser/stream?url=${encodeURIComponent(m.url)}`,
                                downloadUrl: `/api/browser/download?url=${encodeURIComponent(m.url)}&filename=${encodeURIComponent(m.label)}`,
                                filename: m.label,
                              })
                            }
                            className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-[#00F5A0]" />
                            <span>Play</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startRealDownload(m.url, m.label, m.sizeBytes)}
                            className="flex-1 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-white/10">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">
                    Page Links ({navigatedPage.links.length})
                  </h4>
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {navigatedPage.links.slice(0, 25).map((lk, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => navigateToUrl(lk.url)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs text-cyan-300 truncate cursor-pointer"
                      >
                        {lk.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isNavigating && !navigatedPage && webSearchResults.length === 0 && (
            <div className="glass-card rounded-2xl p-10 text-center space-y-3">
              <Globe className="w-8 h-8 text-[#00F5A0] mx-auto" />
              <p className="text-sm text-slate-300">
                Enter any URL above (e.g. <span className="text-white font-mono">https://archive.org</span>) or click a bookmark to browse live pages and extract movie downloads.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REAL DOWNLOAD MANAGER */}
      {activeTab === 'DOWNLOADS' && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Download Manager</h3>
              <p className="text-xs text-slate-400">Real streamed MP4 &amp; file downloads saved directly to your device</p>
            </div>
            {downloads.length > 0 && (
              <button
                type="button"
                onClick={() => setDownloads([])}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
              >
                Clear List
              </button>
            )}
          </div>

          {downloads.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FolderDown className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">No downloads yet. Pick any movie or paste a direct video link to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((dl) => {
                const pct = dl.totalBytes > 0 ? Math.min(100, Math.round((dl.loadedBytes / dl.totalBytes) * 100)) : 0;
                return (
                  <div key={dl.id} className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{dl.filename}</p>
                        <p className="text-xs text-slate-400 tabular-nums">
                          {dl.startedAt} · {formatBytes(dl.loadedBytes)}
                          {dl.totalBytes > 0 ? ` / ${formatBytes(dl.totalBytes)}` : ''}
                          {dl.status === 'DOWNLOADING' && dl.speedBytesPerSec > 0
                            ? ` · ${formatBytes(dl.speedBytesPerSec)}/s`
                            : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {dl.status === 'DOWNLOADING' && (
                          <button
                            type="button"
                            onClick={() => cancelDownload(dl.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                        {(dl.status === 'COMPLETED' || dl.status === 'NATIVE_HANDOFF') && (
                          <span className="text-xs font-medium text-[#00F5A0] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{dl.status === 'NATIVE_HANDOFF' ? 'Browser Downloading' : 'Saved'}</span>
                          </span>
                        )}
                        {dl.status === 'FAILED' && (
                          <span className="text-xs text-rose-400">{dl.error || 'Failed'}</span>
                        )}
                      </div>
                    </div>

                    {dl.status === 'DOWNLOADING' && (
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[#00F5A0] transition-all duration-200"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DIRECT MEDIA / MOVIE URL DOWNLOADER */}
      {activeTab === 'DIRECT' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">Direct Video / Movie URL Downloader</h3>
            <p className="text-xs text-slate-400">
              Paste any direct <span className="font-mono text-slate-200">.mp4</span>, <span className="font-mono text-slate-200">.mkv</span>, <span className="font-mono text-slate-200">.webm</span>, or <span className="font-mono text-slate-200">.pdf</span> URL to stream or download via SKEW proxy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="url"
              value={directMediaUrl}
              onChange={(e) => setDirectMediaUrl(e.target.value)}
              placeholder="https://example.com/movie.mp4"
              className="md:col-span-2 min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5A0]"
            />
            <input
              type="text"
              value={directFilename}
              onChange={(e) => setDirectFilename(e.target.value)}
              placeholder="Custom filename (optional)"
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5A0]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!directMediaUrl.trim()}
              onClick={() => {
                const name = directFilename.trim() || directMediaUrl.split('/').pop()?.split('?')[0] || 'video.mp4';
                setPreviewVideo({
                  title: name,
                  streamUrl: `/api/browser/stream?url=${encodeURIComponent(directMediaUrl.trim())}`,
                  downloadUrl: `/api/browser/download?url=${encodeURIComponent(directMediaUrl.trim())}&filename=${encodeURIComponent(name)}`,
                  filename: name,
                });
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-[#00F5A0]" />
              <span>Stream Preview</span>
            </button>

            <button
              type="button"
              disabled={!directMediaUrl.trim()}
              onClick={() => {
                const name = directFilename.trim() || directMediaUrl.split('/').pop()?.split('?')[0] || 'movie_download.mp4';
                startRealDownload(directMediaUrl.trim(), name);
              }}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] disabled:opacity-40 text-slate-950 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download to Device</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
