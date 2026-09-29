import React from 'react';
import { Mail, Activity, BarChart3, Inbox, Sparkles, Settings, Plus, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCompose: () => void;
  sseConnected: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  openCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openCompose,
  sseConnected,
  soundEnabled,
  setSoundEnabled,
  openCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'emails', label: 'Tracked Emails', icon: Mail },
    { id: 'feed', label: 'Live Feed', icon: Activity, badge: openCount > 0 ? openCount : undefined },
    { id: 'sandbox', label: 'Recipient Sandbox', icon: Inbox, highlight: true },
    { id: 'pixel-gen', label: 'Pixel Generator', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">MailMate</span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                TRACKER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Stealth Email Intelligence & Analytics</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/60 p-1 border border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${item.highlight && !isActive ? 'text-amber-400' : ''}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SSE Connection Status */}
          <div
            className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
              sseConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
            title={sseConnected ? 'Connected to live tracking telemetry' : 'Reconnecting to stream...'}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">{sseConnected ? 'Live Telemetry' : 'Offline'}</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-500 line-through'
            }`}
            title={soundEnabled ? 'Sound Alerts On' : 'Sound Alerts Muted'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          {/* Compose Button */}
          <button
            onClick={openCompose}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Track Email</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/60 bg-slate-950/90 px-3 py-2 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
