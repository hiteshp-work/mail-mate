import React, { useState } from 'react';
import {
  Activity,
  Eye,
  MousePointerClick,
  Laptop,
  Smartphone,
  Tablet,
  Globe2,
  Clock,
  ExternalLink,
  Flame,
  Radio,
} from 'lucide-react';
import { TrackingEvent } from '../types';

interface ActivityFeedViewProps {
  events: TrackingEvent[];
  sseConnected: boolean;
  onSelectEmailId: (emailId: string) => void;
}

export const ActivityFeedView: React.FC<ActivityFeedViewProps> = ({
  events,
  sseConnected,
  onSelectEmailId,
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'click'>('all');

  const filtered = events.filter((ev) => {
    if (filter === 'all') return true;
    return ev.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Live Activity Stream</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
              Live Telemetry
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Real-time feed of email opens, re-reads, and link interactions across the globe
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: `All Events (${events.length})` },
            { id: 'open', label: `Opens (${events.filter((e) => e.type === 'open').length})` },
            { id: 'click', label: `Clicks (${events.filter((e) => e.type === 'click').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl shadow-black/20 p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">No activity recorded yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Send a tracked email or simulate recipient interactions to watch events stream live!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ev) => {
              const isOpen = ev.type === 'open';
              const DevIcon =
                ev.device === 'mobile' ? Smartphone : ev.device === 'tablet' ? Tablet : Laptop;

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEmailId(ev.emailId)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isOpen
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      }`}
                    >
                      {isOpen ? <Eye className="h-5 w-5" /> : <MousePointerClick className="h-5 w-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            isOpen ? 'bg-emerald-500/15 text-emerald-300' : 'bg-purple-500/15 text-purple-300'
                          }`}
                        >
                          {isOpen ? 'Opened' : 'Clicked Link'}
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {ev.subject || 'Tracked Email'}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400">
                        Recipient:{' '}
                        <span className="font-semibold text-slate-300">{ev.recipientName || 'Recipient'}</span>{' '}
                        <span className="text-slate-500">({ev.recipientEmail || ev.ip})</span>
                      </p>

                      {ev.targetUrl && (
                        <p className="text-[11px] text-purple-400 truncate max-w-md flex items-center gap-1 font-mono">
                          <ExternalLink className="h-3 w-3 inline shrink-0" />
                          {ev.targetUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Technical Device, Location, Time */}
                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 text-xs text-slate-400 shrink-0">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-base" role="img" aria-label="country">
                        {ev.location?.flag || '🌐'}
                      </span>
                      <span>
                        {ev.location?.city ? `${ev.location.city}, ${ev.location.country}` : 'Global Origin'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <DevIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.client}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
