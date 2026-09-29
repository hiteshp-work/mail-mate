import React from 'react';
import { StatsCards } from './StatsCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsSummary, TrackedEmail, TrackingEvent } from '../types';
import {
  Sparkles,
  Send,
  Eye,
  MousePointerClick,
  Activity,
  ArrowRight,
  Inbox,
  Flame,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
} from 'lucide-react';

interface DashboardViewProps {
  analytics: AnalyticsSummary | null;
  recentEmails: TrackedEmail[];
  recentEvents: TrackingEvent[];
  onSelectEmail: (email: TrackedEmail) => void;
  onOpenCompose: () => void;
  onOpenSandbox: () => void;
  onOpenPixelGen: () => void;
  onViewAllEmails: () => void;
  onViewAllFeed: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  recentEmails,
  recentEvents,
  onSelectEmail,
  onOpenCompose,
  onOpenSandbox,
  onOpenPixelGen,
  onViewAllEmails,
  onViewAllFeed,
}) => {
  return (
    <div className="space-y-8">
      {/* Hero Quick Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-gradient-to-r from-indigo-900/20 via-purple-900/10 to-slate-900/60 p-6 backdrop-blur-xl shadow-xl shadow-black/20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Stealth Tracking Engine Online</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Email Engagement Telemetry
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Track recipient reads, multi-open patterns, geolocation, and click behavior with zero delivery friction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCompose}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Send className="h-4 w-4" />
            Track New Email
          </button>

          <button
            onClick={onOpenSandbox}
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <Inbox className="h-4 w-4 text-amber-400" />
            Recipient Sandbox
          </button>

          <button
            onClick={onOpenPixelGen}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            Pixel Generator
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatsCards analytics={analytics} />

      {/* Interactive Analytics Charts */}
      <AnalyticsCharts analytics={analytics} />

      {/* Two Column Grid: Recent Tracked Emails & Live Event Ticker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Tracked Emails (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
              <div>
                <h3 className="text-base font-bold text-white">Recent Tracked Messages</h3>
                <p className="text-xs text-slate-400">Latest dispatched campaigns and current read states</p>
              </div>
              <button
                onClick={onViewAllEmails}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <span>View All ({recentEmails.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentEmails.slice(0, 4).map((email) => {
                const hasOpened = email.openCount > 0;
                const hasClicked = email.clickCount > 0;

                return (
                  <div
                    key={email.id}
                    onClick={() => onSelectEmail(email)}
                    className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5 transition-all hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-400">
                        {email.recipientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="max-w-[200px] sm:max-w-xs truncate">
                        <p className="font-semibold text-xs text-white truncate">{email.subject}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          To: {email.recipientName} ({email.recipientEmail})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {hasClicked ? (
                        <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-400 border border-purple-500/20">
                          <Flame className="h-3 w-3" />
                          {email.clickCount} Clicks
                        </span>
                      ) : hasOpened ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                          <Eye className="h-3 w-3" />
                          {email.openCount} Opens
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                          <Clock className="h-3 w-3" />
                          Unopened
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Activity Stream Snippet (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live Activity</h3>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <button
                onClick={onViewAllFeed}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <span>Live Feed</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No live events captured yet</p>
              ) : (
                recentEvents.slice(0, 4).map((ev) => {
                  const isOpen = ev.type === 'open';
                  const DevIcon =
                    ev.device === 'mobile' ? Smartphone : ev.device === 'tablet' ? Tablet : Laptop;

                  return (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                            isOpen
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          }`}
                        >
                          {isOpen ? <Eye className="h-3 w-3" /> : <MousePointerClick className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {ev.recipientName || 'Recipient'}{' '}
                            <span className="text-slate-400 font-normal">
                              {isOpen ? 'opened email' : 'clicked link'}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                            {ev.location?.city ? `${ev.location.city}, ${ev.location.country}` : 'Global Origin'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-400">
                        <p>{ev.location?.flag || '🌐'}</p>
                        <p className="mt-0.5">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
