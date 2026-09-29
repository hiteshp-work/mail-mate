import React from 'react';
import { Send, Eye, MousePointerClick, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { AnalyticsSummary } from '../types';

interface StatsCardsProps {
  analytics: AnalyticsSummary | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ analytics }) => {
  if (!analytics) return null;

  const stats = [
    {
      title: 'Total Sent',
      value: analytics.totalSent,
      sub: 'All dispatched campaigns',
      icon: Send,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
      badge: 'Active',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Open Rate',
      value: `${analytics.openRate}%`,
      sub: `${analytics.uniqueOpens} of ${analytics.totalSent} recipients opened`,
      icon: Eye,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      badge: `${analytics.totalOpens} Total Opens`,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Click-Through Rate',
      value: `${analytics.clickRate}%`,
      sub: `${analytics.uniqueClicks} unique clicked links`,
      icon: MousePointerClick,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
      badge: `${analytics.totalClicks} Total Clicks`,
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Avg. Time to Open',
      value: `${analytics.avgMinutesToOpen}m`,
      sub: 'Speed of first recipient engagement',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
      badge: 'Super Responsive',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700/80 hover:bg-slate-900/80 shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-gradient-to-br ${stat.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {stat.value}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${stat.badgeColor}`}
              >
                {stat.badge}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">{stat.sub}</p>

            {/* Subtle glow highlight */}
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          </div>
        );
      })}
    </div>
  );
};
