import React, { useState } from 'react';
import {
  Inbox,
  Star,
  Send,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Mail,
  User,
  Info,
} from 'lucide-react';
import { TrackedEmail } from '../types';

interface RecipientSandboxViewProps {
  emails: TrackedEmail[];
  selectedEmailId?: string | null;
  onSelectEmailId: (id: string) => void;
  onRefresh: () => void;
}

export const RecipientSandboxView: React.FC<RecipientSandboxViewProps> = ({
  emails,
  selectedEmailId,
  onSelectEmailId,
  onRefresh,
}) => {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'starred' | 'archive'>('inbox');
  const [imagesLoadedMap, setImagesLoadedMap] = useState<Record<string, boolean>>({});
  const [autoLoadImages, setAutoLoadImages] = useState(false);

  // Active email
  const activeEmail = emails.find((e) => e.id === selectedEmailId) || emails[0] || null;

  const isImageLoaded = activeEmail ? imagesLoadedMap[activeEmail.id] || autoLoadImages : false;

  const handleLoadImages = (emailId: string) => {
    setImagesLoadedMap((prev) => ({ ...prev, [emailId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Interactive Recipient Mailbox Simulator</h3>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl">
              Experience the email from the recipient's perspective. Click <strong>"Display Images"</strong> to trigger the 1x1 tracking pixel, or click any link inside the email to test click tracking. Watch your dashboard update in real time!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoLoadImages}
              onChange={(e) => setAutoLoadImages(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-load images
          </label>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Check Mail
          </button>
        </div>
      </div>

      {/* Virtual Mail Client UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl shadow-black/40 min-h-[580px]">
        {/* Left Sidebar (2 cols) */}
        <div className="lg:col-span-3 border-r border-slate-800/80 bg-slate-900/40 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Inbox className="h-4 w-4 text-indigo-400" />
              <span>Recipient Folders</span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.length },
                { id: 'starred', label: 'Starred', icon: Star, count: 0 },
                { id: 'archive', label: 'All Mail', icon: Mail, count: emails.length },
              ].map((folder) => {
                const Icon = folder.icon;
                const isActive = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id as any)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{folder.label}</span>
                    </div>
                    {folder.count > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                          isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Recipient Profile */}
          {activeEmail && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 mt-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <User className="h-3.5 w-3.5 text-indigo-400" />
                <span>Simulated Mailbox:</span>
              </div>
              <p className="text-xs font-bold text-white truncate">{activeEmail.recipientName}</p>
              <p className="text-[11px] text-slate-400 truncate">{activeEmail.recipientEmail}</p>
            </div>
          )}
        </div>

        {/* Middle Column: Email Inbox Items (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800/80 bg-slate-950/60 overflow-y-auto max-h-[580px]">
          <div className="p-3 border-b border-slate-800/80 text-xs font-semibold text-slate-400">
            Incoming Messages ({emails.length})
          </div>

          <div className="divide-y divide-slate-800/60">
            {emails.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500">No emails in inbox yet</p>
            ) : (
              emails.map((email) => {
                const isSelected = activeEmail?.id === email.id;
                const isRead = email.openCount > 0;

                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      onSelectEmailId(email.id);
                      if (autoLoadImages) handleLoadImages(email.id);
                    }}
                    className={`p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        {!isRead && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                        <p className={`text-xs truncate ${!isRead ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                          MailMate Dispatcher
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h5 className={`mt-1 text-xs truncate ${!isRead ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>
                      {email.subject}
                    </h5>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>To: {email.recipientName}</span>
                      {email.openCount > 0 && (
                        <span className="text-emerald-400 font-medium">Read {email.openCount}x</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Reading Pane (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/20 p-5 overflow-y-auto max-h-[580px]">
          {activeEmail ? (
            <div className="space-y-4">
              {/* Email Header */}
              <div className="border-b border-slate-800/80 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{activeEmail.subject}</h3>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    ID: {activeEmail.trackingId}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      M
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">MailMate Sender &lt;dispatcher@mailmate.io&gt;</p>
                      <p className="text-[11px] text-slate-400">
                        To: {activeEmail.recipientName} &lt;{activeEmail.recipientEmail}&gt;
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(activeEmail.sentAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Privacy / Tracking Pixel Banner */}
              {activeEmail.trackOpens && (
                <div>
                  {!isImageLoaded ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>Images & tracking pixels are hidden.</span>
                      </div>
                      <button
                        onClick={() => handleLoadImages(activeEmail.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Display Images (Trigger Open)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Images & Stealth 1x1 Pixel Active! Open Telemetry logged.</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Open #{activeEmail.openCount}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Rendered Email Body */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-200">
                <div
                  className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm [&_a]:text-indigo-400 [&_a]:underline hover:[&_a]:text-indigo-300"
                  dangerouslySetInnerHTML={{ __html: activeEmail.bodyHtml }}
                />

                {/* If images loaded, render the actual 1x1 image so browser executes real HTTP GET */}
                {isImageLoaded && activeEmail.trackOpens && (
                  <img
                    src={`/api/track/pixel/${activeEmail.trackingId}.png?t=${Date.now()}`}
                    alt=""
                    className="inline h-1 w-1 opacity-0 pointer-events-none"
                  />
                )}
              </div>

              {/* Interactive Links Quick Tester */}
              {activeEmail.links?.length > 0 && (
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
                    <span>Tracked Hyperlinks in this message ({activeEmail.links.length}):</span>
                  </div>

                  <div className="space-y-1.5">
                    {activeEmail.links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 p-2 text-xs border border-slate-800"
                      >
                        <span className="truncate text-slate-300 font-medium">{link.label || link.originalUrl}</span>
                        <a
                          href={link.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-500 transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Click Link ({link.clickCount}x)
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Mail className="h-8 w-8 text-slate-600" />
              <p className="mt-2 text-xs text-slate-400">Select an email to view in the sandbox</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
