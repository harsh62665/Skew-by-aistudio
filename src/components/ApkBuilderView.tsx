import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Package,
  Terminal,
  ShieldCheck,
  Globe,
  Mic,
  Phone,
  Film
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const ApkBuilderView: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [appName, setAppName] = useState<string>('SKEW OS');
  const [appId, setAppId] = useState<string>('com.skew.ultron');
  const [appUrl, setAppUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'
  );
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setSwRegistered(regs.length > 0);
      }).catch(() => {});
    }
  }, []);

  const bubblewrapCmd = `npx @bubblewrap/cli init --manifest ${appUrl}/manifest.webmanifest && npx @bubblewrap/cli build`;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const downloadZipUrl = `/api/apk/export-zip?appName=${encodeURIComponent(appName)}&appId=${encodeURIComponent(appId)}&appUrl=${encodeURIComponent(appUrl)}`;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-10">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Android App &amp; APK Build Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Install directly on your Android phone as a standalone WebAPK right now, or export the complete Capacitor Android Studio project (.zip) with GitHub Actions auto-APK builder.
            </p>
          </div>

          {isInstalled ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-[#00F5A0]/40 text-xs font-semibold text-[#00F5A0] flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Installed as Standalone App</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Install App Now (WebAPK)</span>
            </button>
          ) : null}
        </div>

        {/* Android Permission & Capability Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Film className="w-4 h-4 text-[#00F5A0]" />
              <span>Movie Downloader</span>
            </div>
            <p className="text-[11px] text-slate-400">Native Android DownloadManager &amp; streamed MP4 saving</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Live Voice &amp; WebRTC</span>
            </div>
            <p className="text-[11px] text-slate-400">RECORD_AUDIO &amp; WebChromeClient permission auto-grant</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Phone className="w-4 h-4 text-purple-400" />
              <span>Native Phone Dialer</span>
            </div>
            <p className="text-[11px] text-slate-400">CALL_PHONE &amp; tel: intent bridge for real calls</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PWA Ready</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {swRegistered ? 'Service Worker & PNG Icons active' : 'Manifest & 512px icons bundled'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Options: Instant Install vs Export Capacitor APK Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Option 1: Export Capacitor Android APK Project (.zip) */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-[#00F5A0]" />
              <div>
                <h3 className="text-base font-semibold text-white">1. Download Android APK Project (.zip)</h3>
                <p className="text-xs text-slate-400">Includes Capacitor config, AndroidManifest.xml, MainActivity.java &amp; Cloud GitHub Actions APK builder</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">App Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-[#00F5A0]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Android Package ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-[#00F5A0]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Live App Server URL</label>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-slate-950 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#00F5A0]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <a
              href={downloadZipUrl}
              download="SKEW-OS-Android-APK-Project.zip"
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00d88c] text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK Project (.zip)</span>
            </a>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tip: Extract this zip &amp; push to GitHub. The included <span className="font-mono text-slate-200">.github/workflows/build-apk.yml</span> automatically compiles <span className="font-mono text-[#00F5A0]">app-debug.apk</span> in ~2 minutes for free without needing Android Studio on your PC.
            </p>
          </div>
        </div>

        {/* Option 2: Instant WebAPK on Phone + Bubblewrap TWA CLI */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-semibold text-white">2. Instant Phone Install &amp; TWA APK</h3>
                <p className="text-xs text-slate-400">Install on Android Chrome in 1 tap or compile a Trusted Web Activity APK</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-white">How to install directly on Android Phone (30 seconds):</p>
              <p>1. Open the Shared App URL in <strong>Google Chrome</strong> on your Android phone.</p>
              <p>2. Tap <strong>&ldquo;Install App&rdquo;</strong> in the top bar (or Chrome menu <span className="text-white">⋮ → Add to Home screen → Install app</span>).</p>
              <p>3. Android Chrome automatically packages and installs it as a standalone app with its own icon, fullscreen window, mic, calling, and download support.</p>
              {isIOS && (
                <p className="text-cyan-300 pt-1">
                  On iPhone/iPad Safari: Tap Share → Add to Home Screen.
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#00F5A0]" />
                  <span>One-Line Bubblewrap APK Command</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('bubblewrap', bubblewrapCmd)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd === 'bubblewrap' ? <Check className="w-3 h-3 text-[#00F5A0]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'bubblewrap' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
                {bubblewrapCmd}
              </pre>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Manifest: <span className="font-mono text-slate-200">/manifest.webmanifest</span></span>
            </span>
            <a
              href="/manifest.webmanifest"
              target="_blank"
              rel="noreferrer"
              className="text-[#00F5A0] hover:underline"
            >
              Verify Manifest
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
