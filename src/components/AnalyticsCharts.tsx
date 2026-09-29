import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { AnalyticsSummary } from '../types';
import { Laptop, Smartphone, Tablet, Globe2, Mail } from 'lucide-react';

interface AnalyticsChartsProps {
  analytics: AnalyticsSummary | null;
}

const DEVICE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Opens & Clicks Over Time (Takes 2 cols on lg) */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg shadow-black/20 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
          <div>
            <h3 className="text-base font-semibold text-white">Engagement Over Time</h3>
            <p className="text-xs text-slate-400">Daily breakdown of email dispatches, opens, and link clicks</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Opens
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Clicks
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Sent
            </span>
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
              />
              <Area type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOpens)" />
              <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Device Breakdown (Pie / Donut) */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="pb-3 border-b border-slate-800/60">
          <h3 className="text-base font-semibold text-white">Device Breakdown</h3>
          <p className="text-xs text-slate-400">Where recipients read your messages</p>
        </div>

        <div className="relative my-2 h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics.deviceBreakdown}
                dataKey="count"
                nameKey="device"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
              >
                {analytics.deviceBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-white">{analytics.totalOpens}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Events</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
          {analytics.deviceBreakdown.map((item, idx) => {
            const Icon =
              item.device.toLowerCase() === 'desktop'
                ? Laptop
                : item.device.toLowerCase() === 'mobile'
                ? Smartphone
                : Tablet;
            return (
              <div key={idx} className="flex flex-col items-center rounded-xl bg-slate-800/40 p-2 text-center">
                <Icon className="h-3.5 w-3.5 mb-1" style={{ color: DEVICE_COLORS[idx % DEVICE_COLORS.length] }} />
                <span className="text-[11px] font-medium text-slate-300">{item.device}</span>
                <span className="text-xs font-bold text-white">{item.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Top Email Clients & Webmail */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div>
            <h3 className="text-base font-semibold text-white">Email Clients</h3>
            <p className="text-xs text-slate-400">Applications used by recipients</p>
          </div>
          <Mail className="h-4 w-4 text-indigo-400" />
        </div>

        <div className="mt-4 space-y-3">
          {analytics.clientBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No client telemetry recorded yet</p>
          ) : (
            analytics.clientBreakdown.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">{item.client}</span>
                  <span className="font-semibold text-slate-200">{item.count} opens ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Geographic Locations (Takes 2 cols on lg) */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg shadow-black/20 lg:col-span-2">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div>
            <h3 className="text-base font-semibold text-white">Geographic Distribution</h3>
            <p className="text-xs text-slate-400">Global locations resolved from open events</p>
          </div>
          <Globe2 className="h-4 w-4 text-emerald-400" />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {analytics.locationBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center col-span-3">No location data yet</p>
          ) : (
            analytics.locationBreakdown.map((loc, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-800/30 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" role="img" aria-label={loc.country}>
                    {loc.flag}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{loc.country}</p>
                    <p className="text-[10px] text-slate-400">{loc.countryCode}</p>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {loc.count} opens
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
