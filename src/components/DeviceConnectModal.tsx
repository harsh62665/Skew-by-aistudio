import React, { useState } from 'react';
import { 
  X, 
  Laptop, 
  Check, 
  Sparkles, 
  Cpu, 
  Radio, 
  ShieldCheck, 
  HardDrive,
  Monitor,
  Smartphone
} from 'lucide-react';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedDevice: string | null;
  onConnectDevice: (deviceName: string | null) => void;
}

export const DeviceConnectModal: React.FC<DeviceConnectModalProps> = ({
  isOpen,
  onClose,
  connectedDevice,
  onConnectDevice
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(connectedDevice);

  if (!isOpen) return null;

  const devices = [
    {
      id: 'Android Device (ADB & GitHub API Relay)',
      type: 'Mobile Touch Actuator',
      icon: Smartphone,
      resolution: '1080x2400 (Human Touch Physics)',
      status: 'Connected (ADB Port 5037)',
      latency: '1.8ms'
    },
    {
      id: 'MacBook Pro (M3 Max - Local Display)',
      type: 'Desktop Host',
      icon: Monitor,
      resolution: '1920x1080 (Spatial OS)',
      status: 'Online (Ready to ground)',
      latency: '2.4ms'
    },
    {
      id: 'Linux Cloud Kernel (Isolated Sandbox)',
      type: 'AST Executor',
      icon: Cpu,
      resolution: 'Python 3.12 (PEP8 AST)',
      status: 'Active (Zero trust)',
      latency: '8.1ms'
    },
    {
      id: 'Vision & Microphone Telemetry Stream',
      type: 'WebRTC Sensor',
      icon: Radio,
      resolution: '1080p 60fps / 48kHz',
      status: 'Connected',
      latency: '1.2ms'
    }
  ];

  const handleSelect = (id: string) => {
    if (selectedDevice === id) {
      setSelectedDevice(null);
      onConnectDevice(null);
    } else {
      setSelectedDevice(id);
      onConnectDevice(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="glass-dock rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Connect Device & Host</h3>
              <p className="text-xs text-slate-500">Pair ULTRON-ZERO with OS display or AST kernel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device List */}
        <div className="space-y-2.5">
          {devices.map((dev) => {
            const Icon = dev.icon;
            const isSelected = selectedDevice === dev.id;

            return (
              <div
                key={dev.id}
                onClick={() => handleSelect(dev.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-rose-50/70 border-rose-200/90 shadow-2xs'
                    : 'bg-white/80 hover:bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{dev.id}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{dev.resolution}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 font-medium">{dev.latency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 hover:text-slate-700 font-medium">Connect</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted WebRTC Channel</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
