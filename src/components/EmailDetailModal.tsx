import React, { useState } from 'react';
import {
  X,
  Mail,
  Eye,
  MousePointerClick,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Globe2,
  ExternalLink,
  Play,
  Copy,
  Check,
  Code,
} from 'lucide-react';
import { TrackedEmail, TrackingEvent } from '../types';

interface EmailDetailModalProps {
  email: TrackedEmail | null;
  events: TrackingEvent[];
  onClose: () => void;
  onSimulateOpen: (id: string) => void;
  onSimulateClick: (id: string) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  events,
  onClose,
  onSimulateOpen,
  onSimulateClick,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'preview' | 'links' | 'raw'>('timeline');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!email) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const emailEvents = events.filter((ev) => ev.emailId === email.id || ev.trackingId === email.trackingId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 bg-slate-950/50 p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  email.status === 'clicked'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : email.status === 'opened'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-700/30 text-slate-300 border-slate-700/50'
                }`}
              >
                {email.status.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">ID: {email.trackingId}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{email.subject}</h2>
            <p className="text-xs text-slate-300">
              To: <span className="font-semibold text-white">{email.recipientName}</span> ({email.recipientEmail})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSimulateOpen(email.id)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
              title="Trigger simulated open event"
            >
              <Eye className="h-3.5 w-3.5" />
              Simulate Open
            </button>
            {email.links?.length > 0 && (
              <button
                onClick={() => onSimulateClick(email.id)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all"
                title="Trigger simulated link click"
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                Simulate Click
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 border-b border-slate-800/60 bg-slate-950/20 px-6 py-3 text-xs">
          <div>
            <span className="text-slate-400">Sent:</span>
            <p className="font-semibold text-slate-200">
              {new Date(email.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Total Opens:</span>
            <p className="font-bold text-emerald-400">{email.openCount} opens</p>
          </div>
          <div>
            <span className="text-slate-400">Total Clicks:</span>
            <p className="font-bold text-purple-400">{email.clickCount} clicks</p>
          </div>
          <div>
            <span className="text-slate-400">Last Activity:</span>
            <p className="font-semibold text-slate-200">
              {email.lastClickedAt
                ? new Date(email.lastClickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : email.lastOpenedAt
                ? new Date(email.lastOpenedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'None yet'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          {[
            { id: 'timeline', label: `Activity Timeline (${emailEvents.length})` },
            { id: 'links', label: `Tracked Links (${email.links?.length || 0})` },
            { id: 'preview', label: 'Email Content Preview' },
            { id: 'raw', label: 'Technical Telemetry' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 1. TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {emailEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-400">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-white">No reads or interactions yet</h4>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    This email was sent with tracking enabled. Once the recipient opens it or clicks a link, events will populate here.
                  </p>
                  <button
                    onClick={() => onSimulateOpen(email.id)}
                    className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Simulate First Open Now
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2.5 before:w-0.5 before:bg-slate-800">
                  {emailEvents.map((ev, index) => {
                    const isOpen = ev.type === 'open';
                    const DevIcon =
                      ev.device === 'mobile' ? Smartphone : ev.device === 'tablet' ? Tablet : Laptop;
                    return (
                      <div key={ev.id || index} className="relative flex items-start gap-4">
                        {/* Dot */}
                        <div
                          className={`absolute -left-6 mt-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 ${
                            isOpen ? 'bg-emerald-500' : 'bg-purple-500'
                          }`}
                        >
                          {isOpen ? <Eye className="h-2.5 w-2.5 text-white" /> : <MousePointerClick className="h-2.5 w-2.5 text-white" />}
                        </div>

                        {/* Content Box */}
                        <div className="flex-1 rounded-xl border border-slate-800/80 bg-slate-800/30 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                                }`}
                              >
                                {isOpen ? 'Email Opened' : 'Link Clicked'}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {isOpen
                                  ? index === emailEvents.length - 1
                                    ? 'First Open'
                                    : `Read #${emailEvents.length - index}`
                                  : 'Target Link Accessed'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(ev.timestamp).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>

                          {ev.targetUrl && (
                            <div className="mt-2 rounded-lg bg-slate-900/80 p-2.5 border border-slate-800 text-xs">
                              <span className="text-slate-400">Destination: </span>
                              <a
                                href={ev.targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:underline break-all"
                              >
                                {ev.targetUrl}
                              </a>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1 text-slate-300">
                              <DevIcon className="h-3.5 w-3.5 text-slate-400" />
                              {ev.client} ({ev.os})
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span>{ev.location?.flag || '🌐'}</span>
                              <span>{ev.location?.city ? `${ev.location.city}, ${ev.location.country}` : 'Global Location'}</span>
                            </span>
                            <span className="text-slate-500 text-[11px]">IP: {ev.ip}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. TRACKED LINKS TAB */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              {email.links?.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No hyperlinks were tracked in this email.</p>
              ) : (
                email.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{link.label || 'Link'}</span>
                        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-400 border border-purple-500/20">
                          {link.clickCount} clicks
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate max-w-md">{link.originalUrl}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(link.trackingUrl, link.id)}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                      >
                        {copiedLink === link.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        Copy Tracked Link
                      </button>
                      <a
                        href={link.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Test Click
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. EMAIL PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm">
                <div className="mb-4 border-b border-slate-800/80 pb-3 text-xs text-slate-400 space-y-1">
                  <p><strong className="text-slate-300">From:</strong> MailMate Dispatcher &lt;tracker@mailmate.io&gt;</p>
                  <p><strong className="text-slate-300">To:</strong> {email.recipientName} &lt;{email.recipientEmail}&gt;</p>
                  <p><strong className="text-slate-300">Subject:</strong> {email.subject}</p>
                </div>
                <div
                  className="prose prose-invert max-w-none text-slate-200"
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                />
              </div>
            </div>
          )}

          {/* 4. RAW TELEMETRY */}
          {activeTab === 'raw' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify({ email, events: emailEvents }, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
