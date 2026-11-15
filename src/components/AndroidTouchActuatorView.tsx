import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Lock, 
  Unlock, 
  Gamepad2, 
  Zap, 
  Github, 
  Fingerprint, 
  Play, 
  RotateCcw, 
  Terminal, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Flame, 
  Sparkles, 
  RefreshCw,
  Send,
  Code2,
  Sliders,
  Camera,
  Globe,
  Copy,
  ChevronLeft,
  Target,
  Crosshair,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TouchRipple {
  id: string;
  x: number; // percentage or px
  y: number;
  radius: number;
  pressure: number;
}

interface FloatingCoin {
  id: string;
  x: number;
  y: number;
  text: string;
}

export const AndroidTouchActuatorView: React.FC = () => {
  // Mobile Phone Core State
  const [phoneState, setPhoneState] = useState<'LOCKED_AOD' | 'LOCKSCREEN_SWIPE' | 'PIN_PAD' | 'UNLOCKED_HOME'>('LOCKED_AOD');
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [targetPin, setTargetPin] = useState<string>('2029');
  const [pinError, setPinError] = useState<boolean>(false);
  const [touchRipples, setTouchRipples] = useState<TouchRipple[]>([]);
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  
  // In-Phone Active App
  const [activePhoneApp, setActivePhoneApp] = useState<'HOME' | 'GAME' | 'TERMINAL' | 'CAMERA' | 'BROWSER'>('HOME');
  
  // Actuator Telemetry & ADB Logs
  const [adbLogs, setAdbLogs] = useState<string[]>([
    'ADB Server initialized on 127.0.0.1:5037',
    'Device attached: Android 14 (Pixel 8 Pro - USB Debugging)',
    'Gaussian micro-jitter generator: ACTIVE (variance: ±8px, dwell: 72ms-138ms)',
    'Ready for humanized spatial touch, cyber gaming, and GitHub API relay.'
  ]);
  const [isActuating, setIsActuating] = useState<boolean>(false);

  // Gaming Automation State
  const [gamingMode, setGamingMode] = useState<'BURST_TAP' | 'AIM_DRAG' | 'COMBO_SKILL'>('BURST_TAP');
  const [burstCount, setBurstCount] = useState<number>(12);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<number>(1420);
  const [gameCombo, setGameCombo] = useState<number>(1);
  const [gameCps, setGameCps] = useState<number>(0);
  const [targetHealth, setTargetHealth] = useState<number>(100);

  // In-Phone Terminal State
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string }>>([
    { cmd: 'getprop ro.product.model', out: 'Pixel 8 Pro' },
    { cmd: 'dumpsys battery | grep level', out: '  level: 98%' }
  ]);

  // In-Phone Camera State
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const [photoCount, setPhotoCount] = useState<number>(4);

  // GitHub API Relay State
  const [githubRepo, setGithubRepo] = useState<string>('skew-agent/android-adb-runner');
  const [githubToken, setGithubToken] = useState<string>('');
  const [githubDispatchStatus, setGithubDispatchStatus] = useState<string | null>(null);
  const [isDispatchingGh, setIsDispatchingGh] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'PHONE_STAGE' | 'GAMING_ENGINE' | 'GITHUB_API_RELAY' | 'TOUCH_PHYSICS_LAB'>('PHONE_STAGE');

  // Human Physics Parameters
  const [jitterRange, setJitterRange] = useState<number>(8); // px
  const [touchDwellMs, setTouchDwellMs] = useState<number>(85); // ms
  const [bezierCurvature, setBezierCurvature] = useState<number>(0.85);

  const phoneScreenRef = useRef<HTMLDivElement>(null);

  // Add ripple effect with humanized physics
  const triggerVisualRipple = (x: number, y: number, radius = 32, pressure = 0.85) => {
    const id = Math.random().toString(36).substring(7);
    setTouchRipples(prev => [...prev.slice(-8), { id, x, y, radius, pressure }]);
    setTimeout(() => {
      setTouchRipples(prev => prev.filter(r => r.id !== id));
    }, 650);
  };

  // Add floating coin / combo text in game
  const spawnFloatingText = (x: number, y: number, text: string) => {
    const id = Math.random().toString(36).substring(7);
    setFloatingCoins(prev => [...prev.slice(-6), { id, x, y, text }]);
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(c => c.id !== id));
    }, 900);
  };

  // Check PIN completion
  useEffect(() => {
    if (phoneState === 'PIN_PAD' && pinDigits.length === targetPin.length) {
      const enteredStr = pinDigits.join('');
      if (enteredStr === targetPin) {
        setAdbLogs(prev => [
          `[${new Date().toLocaleTimeString()}] adb shell input keyevent 66 # KEYCODE_ENTER`,
          `[${new Date().toLocaleTimeString()}] VERIFIED: Lockscreen PIN matched. Surface transformed to Launcher!`,
          ...prev
        ]);
        setPhoneState('UNLOCKED_HOME');
        setActivePhoneApp('HOME');
        setPinError(false);
      } else {
        setPinError(true);
        setAdbLogs(prev => [
          `[${new Date().toLocaleTimeString()}] WARNING: PIN mismatch ('${enteredStr}' != '${targetPin}')`,
          ...prev
        ]);
        setTimeout(() => {
          setPinDigits([]);
          setPinError(false);
        }, 700);
      }
    }
  }, [pinDigits, targetPin, phoneState]);

  // Handle direct manual keypad tap
  const handleKeypadPress = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (key === '⌫') {
      setPinDigits(prev => prev.slice(0, -1));
      return;
    }
    if (key === '✓') {
      return;
    }
    if (pinDigits.length < targetPin.length) {
      setPinDigits(prev => [...prev, key]);
      setAdbLogs(prev => [
        `[${new Date().toLocaleTimeString()}] adb shell input tap (keypad '${key}') # Keypad Input`,
        ...prev
      ]);
    }
  };

  // Human Unlock Sequence Simulation
  const handleSimulateHumanUnlock = async () => {
    if (isActuating) return;
    setIsActuating(true);
    setPhoneState('LOCKED_AOD');
    setPinDigits([]);
    setActivePhoneApp('HOME');

    setAdbLogs(prev => [
      `[${new Date().toLocaleTimeString()}] >> Starting Human-Touch Unlock Protocol...`,
      `[${new Date().toLocaleTimeString()}] adb shell input keyevent 224 # WAKEUP SCREEN`,
      ...prev
    ]);

    // 1. Wake screen
    await new Promise(r => setTimeout(r, 400));
    setPhoneState('LOCKSCREEN_SWIPE');

    // 2. Human swipe up with natural curve
    await new Promise(r => setTimeout(r, 550));
    setAdbLogs(prev => [
      `[${new Date().toLocaleTimeString()}] adb shell input swipe 540 1920 540 640 310 # Bezier Human Curved Swipe`,
      ...prev
    ]);
    triggerVisualRipple(150, 420, 36, 0.95);
    await new Promise(r => setTimeout(r, 110));
    triggerVisualRipple(150, 310, 30, 0.88);
    await new Promise(r => setTimeout(r, 110));
    triggerVisualRipple(150, 180, 24, 0.70);

    await new Promise(r => setTimeout(r, 380));
    setPhoneState('PIN_PAD');

    // 3. Keypad PIN tap simulation
    const digits = targetPin.split('');
    const keyCoords: Record<string, { x: number; y: number }> = {
      '1': { x: 75, y: 310 }, '2': { x: 150, y: 310 }, '3': { x: 225, y: 310 },
      '4': { x: 75, y: 360 }, '5': { x: 150, y: 360 }, '6': { x: 225, y: 360 },
      '7': { x: 75, y: 410 }, '8': { x: 150, y: 410 }, '9': { x: 225, y: 410 },
      '0': { x: 150, y: 460 }
    };

    const entered: string[] = [];
    for (const d of digits) {
      await new Promise(r => setTimeout(r, 240 + Math.floor(Math.random() * 80)));
      entered.push(d);
      setPinDigits([...entered]);
      const pos = keyCoords[d] || { x: 150, y: 360 };
      const jitterX = pos.x + (Math.random() - 0.5) * jitterRange;
      const jitterY = pos.y + (Math.random() - 0.5) * jitterRange;
      triggerVisualRipple(jitterX, jitterY, 28, 0.9);
      setAdbLogs(prev => [
        `[${new Date().toLocaleTimeString()}] adb shell input tap ${jitterX * 3.6 | 0} ${jitterY * 3.6 | 0} # Keypad Digit '${d}' (Dwell: ${touchDwellMs}ms)`,
        ...prev
      ]);
    }

    await new Promise(r => setTimeout(r, 450));
    setIsActuating(false);
  };

  // Gaming Rapid Auto-Tap simulation
  const handleTriggerGamingBurst = async () => {
    if (isGameRunning) return;
    setIsGameRunning(true);
    setPhoneState('UNLOCKED_HOME');
    setActivePhoneApp('GAME');

    setAdbLogs(prev => [
      `[${new Date().toLocaleTimeString()}] >> Executing ${burstCount}x Rapid Gaming Burst (Anti-Cheat Gaussian Variance)...`,
      ...prev
    ]);

    setGameCps(15.2);

    for (let i = 0; i < burstCount; i++) {
      const centerX = 150;
      const centerY = 260;
      const jX = centerX + (Math.random() - 0.5) * (jitterRange * 3);
      const jY = centerY + (Math.random() - 0.5) * (jitterRange * 3);
      
      triggerVisualRipple(jX, jY, 24 + Math.random() * 10, 0.98);
      
      const pts = 10 * gameCombo;
      setGameScore(s => s + pts);
      spawnFloatingText(jX, jY, `+${pts}`);
      setTargetHealth(h => Math.max(15, h - 3));

      if (i % 4 === 0) {
        setGameCombo(c => Math.min(5, c + 1));
      }

      const delay = 58 + Math.floor(Math.random() * 32);
      await new Promise(r => setTimeout(r, delay));
    }

    setAdbLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Burst Complete: ${burstCount} taps delivered in ~${burstCount * 75}ms (~14.8 CPS)`,
      ...prev
    ]);
    setTimeout(() => setGameCps(0), 1200);
    setIsGameRunning(false);
  };

  // Direct Screen Click Handler
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!phoneScreenRef.current) return;
    const rect = phoneScreenRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    triggerVisualRipple(x, y, 32, 0.85);

    // If currently in Game, register manual game tap
    if (activePhoneApp === 'GAME') {
      const pts = 10 * gameCombo;
      setGameScore(s => s + pts);
      spawnFloatingText(x, y, `+${pts}`);
      setTargetHealth(h => Math.max(10, h - 2));
      setGameCps(prev => Math.min(prev + 1.2, 16));
      setTimeout(() => setGameCps(prev => Math.max(0, prev - 1.2)), 800);
    }

    // If in locked AOD or swipe, progress state
    if (phoneState === 'LOCKED_AOD') {
      setPhoneState('LOCKSCREEN_SWIPE');
      setTimeout(() => setPhoneState('PIN_PAD'), 350);
    } else if (phoneState === 'LOCKSCREEN_SWIPE') {
      setPhoneState('PIN_PAD');
    }

    setAdbLogs(prev => [
      `[${new Date().toLocaleTimeString()}] adb shell input tap ${(x * 3.6) | 0} ${(y * 3.6) | 0} # Manual Human Contact (x=${x|0}, y=${y|0})`,
      ...prev
    ]);
  };

  // In-Phone Terminal execution
  const handleRunTerminalCmd = (cmdToRun: string) => {
    const cmd = cmdToRun.trim();
    if (!cmd) return;
    let out = '';
    if (cmd.startsWith('adb shell input tap')) {
      const parts = cmd.split(' ');
      const x = parts[4] ? Number(parts[4]) / 3.6 : 150;
      const y = parts[5] ? Number(parts[5]) / 3.6 : 300;
      triggerVisualRipple(x, y, 30, 0.9);
      out = `Event dispatched to /dev/input/event2 [TOUCH_DOWN/UP]`;
    } else if (cmd === 'dumpsys battery') {
      out = `Current Battery: 98%\nHealth: Good\nTemp: 29.4°C\nStatus: Charging (USB OTG)`;
    } else if (cmd.includes('getprop')) {
      out = `ro.build.version.release=14\nro.product.model=Pixel 8 Pro\nro.product.cpu.abi=arm64-v8a`;
    } else if (cmd === 'screencap') {
      out = `/sdcard/screen_${Date.now()}.png saved (1080x2400)`;
    } else if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else {
      out = `Executed successfully in 12ms. (exit_code=0)`;
    }

    setTerminalHistory(prev => [...prev.slice(-6), { cmd, out }]);
    setTerminalInput('');
    setAdbLogs(prev => [`[${new Date().toLocaleTimeString()}] shell: ${cmd}`, ...prev]);
  };

  // Camera Snapshot
  const handleCameraSnap = () => {
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);
    setPhotoCount(c => c + 1);
    setAdbLogs(prev => [
      `[${new Date().toLocaleTimeString()}] adb shell input keyevent 27 # KEYCODE_CAMERA (Snapshot Captured)`,
      ...prev
    ]);
  };

  // GitHub API Dispatch
  const handleDispatchGitHub = async () => {
    setIsDispatchingGh(true);
    setGithubDispatchStatus(null);
    try {
      const resp = await fetch('/api/github/relay-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: githubRepo,
          token: githubToken,
          event_type: 'mobile_touch_action',
          payload: {
            action: 'TOUCH_UNLOCK_OR_GAME_BURST',
            target_pin: targetPin,
            burst_rate: 15,
            jitter_px: jitterRange,
            timestamp: new Date().toISOString()
          }
        })
      });
      const data = await resp.json();
      setGithubDispatchStatus(`Dispatched successfully! Runner: ${data.virtual_runner || data.status}`);
      setAdbLogs(prev => [
        `[${new Date().toLocaleTimeString()}] GitHub API Event 'mobile_touch_action' dispatched to repo ${githubRepo}`,
        ...prev
      ]);
    } catch (err: any) {
      setGithubDispatchStatus('Simulated dispatch sent to local runner.');
    } finally {
      setIsDispatchingGh(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Python ADB script template
  const pythonScriptSnippet = `#!/usr/bin/env python3
# SKEW Level-4 Android Humanized Touch Actuator
# Bypasses bot detection using Gaussian micro-jitter and Bezier curve dynamics

import time
import random
import subprocess

def adb_command(cmd):
    full_cmd = f"adb shell {cmd}"
    subprocess.run(full_cmd, shell=True, check=True)

def human_tap(x, y, variance=8, dwell_ms=85):
    """Taps with Gaussian randomized coordinate offset and human dwell time."""
    jitter_x = int(random.gauss(x, variance / 2))
    jitter_y = int(random.gauss(y, variance / 2))
    dwell_sec = max(0.04, random.gauss(dwell_ms / 1000, 0.015))
    
    print(f">> [HUMAN TAP] ({jitter_x}, {jitter_y}) dwell={dwell_sec*1000:.1f}ms")
    # Send swipe with 0 distance to simulate pressure dwell
    adb_command(f"input swipe {jitter_x} {jitter_y} {jitter_x} {jitter_y} {int(dwell_sec * 1000)}")

def unlock_phone(pin="2029"):
    """Simulates wake, curved swipe, and PIN input."""
    print(">> Waking screen...")
    adb_command("input keyevent 224")
    time.sleep(0.5)
    
    print(">> Performing curved swipe up...")
    adb_command("input swipe 540 1900 540 700 320")
    time.sleep(0.4)
    
    key_coords = {
        '1': (270, 1100), '2': (540, 1100), '3': (810, 1100),
        '4': (270, 1300), '5': (540, 1300), '6': (810, 1300),
        '7': (270, 1500), '8': (540, 1500), '9': (810, 1500),
        '0': (540, 1700)
    }
    
    for digit in pin:
        if digit in key_coords:
            cx, cy = key_coords[digit]
            human_tap(cx, cy, variance=6)
            time.sleep(random.uniform(0.18, 0.28))
    
    adb_command("input keyevent 66") # Enter
    print(">> Phone unlocked successfully!")

def gaming_rapid_burst(center_x=540, center_y=1200, count=15):
    """Executes high-CPS gaming macro without detection."""
    print(f">> Firing {count}x gaming taps...")
    for _ in range(count):
        human_tap(center_x, center_y, variance=14, dwell_ms=45)
        time.sleep(random.uniform(0.05, 0.085))

if __name__ == "__main__":
    unlock_phone("${targetPin}")
    gaming_rapid_burst()
`;

  const githubWorkflowYaml = `name: Mobile Remote Touch Relay
on:
  repository_dispatch:
    types: [mobile_touch_action]
  workflow_dispatch:

jobs:
  actuate_phone:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install Android ADB Tools
        run: sudo apt-get update && sudo apt-get install -y android-tools-adb

      - name: Connect Remote ADB or Self-Hosted Bridge
        run: |
          echo "Connecting to device via ADB Wi-Fi or local bridge..."
          # adb connect \${{ secrets.PHONE_ADB_IP }}:5555

      - name: Execute Humanized Touch Script
        run: python3 android_touch_relay.py
`;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Control Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl glass-dock border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-950/40">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Android Touch & Screen Actuator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-mono">
                Level-4 Grounded
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Human-like finger touch physics, PIN unlock, cyber gaming macros, and GitHub API remote relay
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('PHONE_STAGE')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PHONE_STAGE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Touch & Unlock Stage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('GAMING_ENGINE');
              if (phoneState === 'LOCKED_AOD') setPhoneState('UNLOCKED_HOME');
              setActivePhoneApp('GAME');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'GAMING_ENGINE'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Gaming Macro Bot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GITHUB_API_RELAY')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'GITHUB_API_RELAY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Relay & Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TOUCH_PHYSICS_LAB')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TOUCH_PHYSICS_LAB'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Physics Lab</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Realistic Phone Simulator Stage (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-3">
          {/* Phone Shell */}
          <div className="relative w-[300px] h-[610px] rounded-[48px] bg-[#121820] p-3.5 shadow-2xl border-4 border-slate-700/80 shadow-cyan-950/40 select-none">
            {/* Speaker Earpiece & Camera Punch Hole */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full flex items-center justify-center z-30 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/80" />
              <div className="w-8 h-1 rounded-full bg-slate-800" />
            </div>

            {/* Simulated Phone Screen */}
            <div 
              ref={phoneScreenRef}
              onClick={handleScreenClick}
              className="relative w-full h-full rounded-[38px] bg-black overflow-hidden flex flex-col justify-between p-3 cursor-crosshair border border-white/5"
            >
              {/* Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono px-2 pt-1 z-20">
                <span>10:29</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.5 flex items-center">
                    <div className="w-full h-full bg-[#00F5A0] rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Dynamic Touch Ripple Visuals */}
              {touchRipples.map(ripple => (
                <motion.div
                  key={ripple.id}
                  initial={{ scale: 0.2, opacity: 0.95 }}
                  animate={{ scale: 2.3, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  style={{
                    left: ripple.x - ripple.radius,
                    top: ripple.y - ripple.radius,
                    width: ripple.radius * 2,
                    height: ripple.radius * 2
                  }}
                  className="absolute rounded-full border-2 border-cyan-400 bg-cyan-400/30 pointer-events-none z-50 shadow-lg shadow-cyan-400/60"
                />
              ))}

              {/* Floating Game Points */}
              {floatingCoins.map(coin => (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -45, scale: 1.25 }}
                  transition={{ duration: 0.85, ease: 'easeOut' }}
                  style={{ left: coin.x - 15, top: coin.y - 15 }}
                  className="absolute pointer-events-none z-50 text-amber-300 font-black font-mono text-sm drop-shadow-md"
                >
                  {coin.text}
                </motion.div>
              ))}

              {/* SCREEN CONTENT BASED ON PHONE STATE */}
              {phoneState === 'LOCKED_AOD' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center z-10">
                  <Lock className="w-7 h-7 text-slate-400 mb-1 animate-pulse" />
                  <div className="text-4xl font-light tracking-tight text-white font-mono">10:29</div>
                  <div className="text-xs text-slate-400">Monday, September 7</div>
                  <div className="pt-10 text-[11px] text-slate-500 animate-pulse">
                    Swipe up or tap to unlock
                  </div>
                </div>
              )}

              {phoneState === 'LOCKSCREEN_SWIPE' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center z-10">
                  <Lock className="w-8 h-8 text-cyan-400 animate-bounce" />
                  <div className="text-3xl font-light text-white font-mono">10:29</div>
                  <div className="w-24 h-1 rounded-full bg-cyan-400/60 animate-pulse mt-12" />
                  <div className="text-[11px] text-cyan-300 font-mono">Swiping up to Keypad...</div>
                </div>
              )}

              {phoneState === 'PIN_PAD' && (
                <div className="flex-1 flex flex-col items-center justify-end pb-4 space-y-4 text-center z-10">
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-300 font-medium">
                      Enter Device PIN (Target: {targetPin})
                    </div>
                    {/* PIN dots */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {[0, 1, 2, 3].map(idx => (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${
                            pinError
                              ? 'border-rose-500 bg-rose-500 animate-bounce'
                              : pinDigits.length > idx
                              ? 'border-cyan-400 bg-cyan-400 scale-110 shadow-md shadow-cyan-400/60'
                              : 'border-slate-500 bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 3x4 Numeric Keypad with Interactive Click Handlers */}
                  <div className="grid grid-cols-3 gap-2.5 w-full max-w-[210px] pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={(e) => handleKeypadPress(key, e)}
                        className="h-11 rounded-full flex items-center justify-center text-sm font-medium transition-all bg-white/10 hover:bg-white/25 active:bg-cyan-500/40 text-white border border-white/10 shadow-xs cursor-pointer select-none"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* UNLOCKED HOME & ACTIVE APPS */}
              {phoneState === 'UNLOCKED_HOME' && (
                <div className="flex-1 flex flex-col justify-between py-2 px-1 z-10">
                  {/* APP VIEW: GAME (Cyber Tap 2029) */}
                  {activePhoneApp === 'GAME' ? (
                    <div className="flex-1 flex flex-col justify-between space-y-2 py-1">
                      {/* Game Header with Back to Home */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhoneApp('HOME');
                          }}
                          className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-mono cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Home</span>
                        </button>
                        <span className="text-[10px] font-mono text-purple-300 font-semibold uppercase tracking-wider">
                          Cyber Tap 2029
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          {gameCombo}x COMBO
                        </span>
                      </div>

                      {/* Game Stats */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-1.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-center">
                          <span className="text-slate-400 block text-[9px]">SCORE</span>
                          <span className="text-white text-xs font-bold">{gameScore.toLocaleString()}</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-center">
                          <span className="text-slate-400 block text-[9px]">TAP RATE (CPS)</span>
                          <span className="text-[#00F5A0] text-xs font-bold">{gameCps.toFixed(1)} CPS</span>
                        </div>
                      </div>

                      {/* Interactive Gaming Target Orb */}
                      <div className="flex-1 flex flex-col items-center justify-center relative py-4">
                        <div className="relative flex items-center justify-center">
                          {/* Animated Ripple Rings */}
                          <div className="absolute w-36 h-36 rounded-full border border-purple-500/30 animate-ping pointer-events-none" />
                          <div className="absolute w-28 h-28 rounded-full border border-cyan-500/40 animate-pulse pointer-events-none" />
                          
                          {/* Target Core */}
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex flex-col items-center justify-center shadow-lg shadow-purple-600/50 cursor-pointer active:scale-95 transition-transform border-2 border-white/40">
                            <Target className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '8s' }} />
                            <span className="text-[10px] text-white font-bold tracking-wider mt-0.5 font-mono">
                              TAP TARGET
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-3 font-mono">
                          Target HP: {targetHealth}%
                        </span>
                      </div>

                      {/* AI Rapid Burst Button inside game */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerGamingBurst();
                        }}
                        disabled={isGameRunning}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isGameRunning ? 'Firing 15 CPS Burst...' : 'AI Turbo Burst Tap (15 CPS)'}</span>
                      </button>
                    </div>
                  ) : activePhoneApp === 'TERMINAL' ? (
                    /* APP VIEW: TERMINAL */
                    <div className="flex-1 flex flex-col justify-between space-y-2 py-1">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhoneApp('HOME');
                          }}
                          className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-mono cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Home</span>
                        </button>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                          ADB Shell v14
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">root@sh</span>
                      </div>

                      {/* Terminal History */}
                      <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 p-2 rounded-xl bg-black/60 border border-white/10 text-slate-300">
                        {terminalHistory.map((item, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="text-cyan-300 font-semibold">$ {item.cmd}</div>
                            <div className="text-slate-400 whitespace-pre-wrap pl-2 border-l border-white/10">
                              {item.out}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick run chips */}
                      <div className="flex gap-1 overflow-x-auto text-[9px] font-mono py-1">
                        {['adb shell input tap 150 300', 'dumpsys battery', 'getprop', 'clear'].map(cmd => (
                          <button
                            key={cmd}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunTerminalCmd(cmd);
                            }}
                            className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 whitespace-nowrap cursor-pointer"
                          >
                            {cmd}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : activePhoneApp === 'CAMERA' ? (
                    /* APP VIEW: CAMERA */
                    <div className="flex-1 flex flex-col justify-between space-y-2 py-1 relative">
                      {cameraFlash && (
                        <div className="absolute inset-0 bg-white z-50 rounded-3xl animate-out fade-out" />
                      )}
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhoneApp('HOME');
                          }}
                          className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-mono cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Home</span>
                        </button>
                        <span className="text-[10px] font-mono text-indigo-300 font-semibold">
                          50MP OIS VIEW
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">{photoCount} photos</span>
                      </div>

                      {/* Camera Viewfinder */}
                      <div className="flex-1 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-white/10 relative flex items-center justify-center overflow-hidden">
                        {/* 3x3 Grid */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/20">
                          <div className="border border-white/20" />
                          <div className="border border-white/20" />
                          <div className="border border-white/20" />
                        </div>
                        {/* Center focus reticle */}
                        <div className="w-12 h-12 rounded-lg border-2 border-amber-400/80 animate-pulse flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </div>
                        <span className="absolute bottom-2 text-[9px] font-mono text-slate-400">
                          f/1.68 &bull; ISO 120 &bull; 1/250s
                        </span>
                      </div>

                      {/* Shutter bar */}
                      <div className="flex items-center justify-around py-1">
                        <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCameraSnap();
                          }}
                          className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-90 transition-transform cursor-pointer shadow-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-white" />
                        </button>
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-mono">
                          1x
                        </div>
                      </div>
                    </div>
                  ) : activePhoneApp === 'BROWSER' ? (
                    /* APP VIEW: BROWSER */
                    <div className="flex-1 flex flex-col justify-between space-y-2 py-1">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhoneApp('HOME');
                          }}
                          className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-mono cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Home</span>
                        </button>
                        <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                          Chrome Mobile
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400">SSL</span>
                      </div>

                      {/* URL bar */}
                      <div className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        <span className="truncate">https://github.com/{githubRepo}</span>
                      </div>

                      <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2 text-left">
                        <div className="text-xs font-bold text-white">GitHub ADB Relay Hub</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          Repo connected. Ready to trigger remote Actions webhooks and receive spatial touch telemetry.
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                          STATUS: 200 OK &bull; LATENCY: 34ms
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* APP VIEW: DEFAULT LAUNCHER HOME */
                    <>
                      {/* Weather widget */}
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left space-y-1">
                        <div className="text-[10px] text-slate-400 font-mono">NEW DELHI &bull; 31°C</div>
                        <div className="text-xs font-semibold text-white">Device Unlocked</div>
                        <div className="text-[10px] text-[#00F5A0] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Authenticated via Human Touch
                        </div>
                      </div>

                      {/* App Grid */}
                      <div className="grid grid-cols-4 gap-3 text-center my-auto">
                        {[
                          { name: 'Phone', color: 'bg-emerald-500', icon: '📞', action: () => {} },
                          { name: 'Browser', color: 'bg-cyan-500', icon: '🌐', action: () => setActivePhoneApp('BROWSER') },
                          { name: 'Camera', color: 'bg-indigo-500', icon: '📷', action: () => setActivePhoneApp('CAMERA') },
                          { name: 'Game', color: 'bg-purple-600', icon: '🎮', action: () => setActivePhoneApp('GAME') },
                          { name: 'SKEW', color: 'bg-[#00F5A0] text-slate-950 font-bold', icon: '⚡', action: () => {} },
                          { name: 'Terminal', color: 'bg-slate-800', icon: '💻', action: () => setActivePhoneApp('TERMINAL') },
                          { name: 'GitHub', color: 'bg-emerald-600', icon: '🐙', action: () => setActivePhoneApp('BROWSER') },
                          { name: 'Settings', color: 'bg-amber-500', icon: '⚙️', action: () => {} }
                        ].map((app, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              app.action();
                            }}
                            className="flex flex-col items-center gap-1 group cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center shadow-lg text-white text-base group-hover:scale-110 active:scale-95 transition-transform`}>
                              {app.icon}
                            </div>
                            <span className="text-[9px] text-slate-300 font-sans">{app.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Bottom Dock */}
                      <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-around">
                        <button 
                          type="button" 
                          onClick={() => setActivePhoneApp('HOME')}
                          className="w-8 h-8 rounded-lg bg-emerald-500/80 flex items-center justify-center text-white text-xs cursor-pointer"
                        >
                          📞
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setActivePhoneApp('BROWSER')}
                          className="w-8 h-8 rounded-lg bg-cyan-500/80 flex items-center justify-center text-white text-xs cursor-pointer"
                        >
                          🌐
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setActivePhoneApp('GAME')}
                          className="w-8 h-8 rounded-lg bg-purple-500/80 flex items-center justify-center text-white text-xs cursor-pointer"
                        >
                          🎮
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Gesture Bar */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhoneApp('HOME');
                }}
                className="w-28 h-1.5 rounded-full bg-slate-500/50 hover:bg-white/80 mx-auto z-20 mb-0.5 cursor-pointer transition-colors"
                title="Tap to return to Home"
              />
            </div>
          </div>

          {/* Quick Action Button Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSimulateHumanUnlock}
              disabled={isActuating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00F5A0] hover:bg-[#00e092] text-slate-950 transition-all shadow-lg shadow-[#00F5A0]/20 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isActuating ? 'Unlocking via ADB...' : 'Unlock Phone (Human Touch)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPhoneState('LOCKED_AOD');
                setPinDigits([]);
                setActivePhoneApp('HOME');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Lock Screen</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Controls, Gaming Engine & GitHub API Relay (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'PHONE_STAGE' && (
            <div className="p-5 rounded-3xl glass-dock border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-[#00F5A0]" />
                  <h3 className="text-sm font-semibold text-white">Human Touch & PIN Unlock Engine</h3>
                </div>
                <span className="text-[10px] text-[#00F5A0] font-mono font-semibold">ADB Input Protocol</span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  Yeh actuator insaan ki ungli ke touch jaisa <strong>Gaussian Variance</strong>, micro-jitter, aur curved Bezier swipe produce karta hai taaki detection systems bypass ho saken.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-slate-500 block text-[10px]">DEVICE TARGET PIN:</span>
                    <input
                      type="text"
                      value={targetPin}
                      maxLength={6}
                      onChange={(e) => setTargetPin(e.target.value)}
                      className="w-full bg-transparent border-b border-cyan-500/50 text-cyan-300 font-mono text-sm focus:outline-hidden"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-slate-500 block text-[10px]">CONTACT RADIUS & DWELL:</span>
                    <div className="text-white font-semibold">{touchDwellMs}ms &bull; 28px ~ 36px</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-semibold text-slate-200">Execution Pipeline on Real Android:</div>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>Step 1:</strong> <code className="text-cyan-300 font-mono">adb shell input keyevent 224</code> (Screen wake)</li>
                  <li><strong>Step 2:</strong> <code className="text-cyan-300 font-mono">adb shell input swipe 540 1900 540 700 310</code> (Curved swipe)</li>
                  <li><strong>Step 3:</strong> <code className="text-cyan-300 font-mono">adb shell input tap x y</code> with Gaussian touch jitter</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneState('PIN_PAD');
                    setPinDigits([]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs border border-white/10 cursor-pointer"
                >
                  Test Manual PIN Pad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneState('UNLOCKED_HOME');
                    setActivePhoneApp('GAME');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs border border-purple-500/30 cursor-pointer flex items-center gap-1"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Launch In-Phone Game</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'GAMING_ENGINE' && (
            <div className="p-5 rounded-3xl glass-dock border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Mobile Gaming Touch & Macro Bot</h3>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">15 CPS Max</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Gaming Automation Mode:</span>
                  <div className="flex gap-1 font-mono text-[11px]">
                    {(['BURST_TAP', 'AIM_DRAG', 'COMBO_SKILL'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setGamingMode(mode)}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          gamingMode === mode ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40 font-semibold' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Rapid Burst Auto-Tap</div>
                    <div className="text-[10px] text-purple-300">Humanized variance to bypass anti-cheat checks</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerGamingBurst}
                    disabled={isGameRunning}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white transition-all shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isGameRunning ? 'Firing...' : `Fire ${burstCount}x Burst`}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span>Score Counter: <strong className="text-purple-300">{gameScore} pts</strong></span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span>Burst Duration: <strong className="text-white">~{burstCount * 75}ms</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'GITHUB_API_RELAY' && (
            <div className="p-5 rounded-3xl glass-dock border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">GitHub API Relay & Remote Dispatch</h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">REST API v3</span>
              </div>

              <div className="text-xs text-slate-300 space-y-3">
                <p>
                  Video ke method ke anusar, aap apne GitHub repository me <strong>GitHub Actions</strong> runner ya webhook use karke phone par remote touch commands dispatch kar sakte hain:
                </p>

                <div className="space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block mb-1">GITHUB REPO (owner/repo):</span>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">PERSONAL ACCESS TOKEN (Optional for live GitHub):</span>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional)"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDispatchGitHub}
                  disabled={isDispatchingGh}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatchingGh ? 'Dispatching to GitHub API...' : 'Dispatch Remote Touch to GitHub API'}</span>
                </button>

                {githubDispatchStatus && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{githubDispatchStatus}</span>
                  </div>
                )}

                {/* Ready-to-deploy code snippet exporter */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>Deployable Python ADB Script (`android_touch_relay.py`)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pythonScriptSnippet, 'python')}
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSnippet === 'python' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-36">
                    {pythonScriptSnippet}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TOUCH_PHYSICS_LAB' && (
            <div className="p-5 rounded-3xl glass-dock border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Human Touch Physics & Anti-Cheat Lab</h3>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">Gaussian Engine</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Gaussian Micro-Jitter (Variance):</span>
                    <span className="text-amber-300 font-semibold">±{jitterRange}px</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={jitterRange}
                    onChange={(e) => setJitterRange(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Touch Dwell Duration:</span>
                    <span className="text-amber-300 font-semibold">{touchDwellMs}ms</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={200}
                    value={touchDwellMs}
                    onChange={(e) => setTouchDwellMs(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Bezier Curve Arc Tension:</span>
                    <span className="text-amber-300 font-semibold">{(bezierCurvature * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={1.0}
                    step={0.05}
                    value={bezierCurvature}
                    onChange={(e) => setBezierCurvature(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20">
                    <span className="text-rose-300 font-semibold block">Bot Detection (Naive)</span>
                    <span className="text-slate-400 text-[10px]">Zero variance &bull; Static coordinates &bull; Detected by SafetyNet</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-emerald-300 font-semibold block">SKEW Actuator (Human)</span>
                    <span className="text-slate-400 text-[10px]">Dynamic pressure &bull; Micro-jitter &bull; Natural dwell time envelope</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-time ADB & Actuation Telemetry Console */}
          <div className="p-4 rounded-3xl glass-dock border border-white/10 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200 font-semibold">ADB Spatial Touch Stream</span>
              </div>
              <span className="text-[10px] text-[#00F5A0]">PORT 5037 ACTIVE</span>
            </div>

            <div className="h-36 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-300 pr-1">
              {adbLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed truncate hover:text-white transition-colors">
                  <span className="text-slate-500 select-none">&gt; </span>
                  {log.includes('tap') ? (
                    <span className="text-cyan-300">{log}</span>
                  ) : log.includes('swipe') ? (
                    <span className="text-purple-300">{log}</span>
                  ) : log.includes('SUCCESS') || log.includes('VERIFIED') ? (
                    <span className="text-[#00F5A0] font-semibold">{log}</span>
                  ) : log.includes('WARNING') ? (
                    <span className="text-amber-300">{log}</span>
                  ) : (
                    log
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
