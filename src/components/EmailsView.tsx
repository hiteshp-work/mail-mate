import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  MousePointerClick,
  MoreVertical,
  Trash2,
  ExternalLink,
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Flame,
} from 'lucide-react';
import { TrackedEmail } from '../types';

interface EmailsViewProps {
  emails: TrackedEmail[];
  onSelectEmail: (email: TrackedEmail) => void;
  onSimulateOpen: (id: string) => void;
  onSimulateClick: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  onOpenSandbox: (emailId?: string) => void;
  onCompose: () => void;
}

export const EmailsView: React.FC<EmailsViewProps> = ({
  emails,
  onSelectEmail,
  onSimulateOpen,
  onSimulateClick,
  onDeleteEmail,
  onOpenSandbox,
  onCompose,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'opened' | 'clicked' | 'unopened'>('all');

  const filtered = emails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(search.toLowerCase()) ||
      email.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
      email.recipientName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'opened') return email.openCount > 0;
    if (statusFilter === 'clicked') return email.clickCount > 0;
    if (statusFilter === 'unopened') return email.openCount === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Tracked Campaigns & Messages</h2>
          <p className="text-xs text-slate-400">
            Real-time status of all {emails.length} tracked emails and recipient engagement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCompose}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Track New Email
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipient, subject, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `All (${emails.length})` },
            { id: 'opened', label: `Opened (${emails.filter((e) => e.openCount > 0).length})` },
            { id: 'clicked', label: `Clicked (${emails.filter((e) => e.clickCount > 0).length})` },
            { id: 'unopened', label: `Unopened (${emails.filter((e) => e.openCount === 0).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emails Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl shadow-black/20">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">No matching emails found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria or compose a new email.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Subject & Preview</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Reads / Clicks</th>
                  <th className="px-6 py-3.5">Sent / Last Active</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((email) => {
                  const hasOpened = email.openCount > 0;
                  const hasClicked = email.clickCount > 0;

                  return (
                    <tr
                      key={email.id}
                      className="group transition-colors hover:bg-slate-800/40 cursor-pointer"
                      onClick={() => onSelectEmail(email)}
                    >
                      {/* Recipient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 font-bold text-indigo-400">
                            {email.recipientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                              {email.recipientName}
                            </p>
                            <p className="text-[11px] text-slate-400">{email.recipientEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-medium text-slate-200 truncate">{email.subject}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {email.tags?.map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded px-1.5 py-0.2 text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60"
                            >
                              {tag}
                            </span>
                          ))}
                          {email.trackOpens && (
                            <span className="text-[10px] text-emerald-400/80 font-mono">1x1 Pixel</span>
                          )}
                          {email.trackClicks && email.links?.length > 0 && (
                            <span className="text-[10px] text-purple-400/80 font-mono">
                              {email.links.length} Links
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasClicked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-400 border border-purple-500/20">
                            <Flame className="h-3 w-3 text-purple-400" />
                            Clicked ({email.clickCount}x)
                          </span>
                        ) : hasOpened ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Opened ({email.openCount}x)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-700/60">
                            <Clock className="h-3 w-3 text-slate-400" />
                            Unopened
                          </span>
                        )}
                      </td>

                      {/* Reads & Clicks */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              hasOpened ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {email.openCount}
                          </span>
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              hasClicked ? 'text-purple-400' : 'text-slate-500'
                            }`}
                          >
                            <MousePointerClick className="h-3.5 w-3.5" />
                            {email.clickCount}
                          </span>
                        </div>
                      </td>

                      {/* Sent Time */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        <p className="text-slate-200">
                          {new Date(email.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px]">
                          {email.lastOpenedAt
                            ? `Read ${new Date(email.lastOpenedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'No read yet'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sandbox View */}
                          <button
                            onClick={() => onOpenSandbox(email.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                            title="Open in Recipient Mailbox Simulator"
                          >
                            <Inbox className="h-4 w-4" />
                          </button>

                          {/* Quick Simulate Open */}
                          <button
                            onClick={() => onSimulateOpen(email.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                            title="Simulate recipient opening email"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Quick Simulate Click */}
                          {email.links?.length > 0 && (
                            <button
                              onClick={() => onSimulateClick(email.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                              title="Simulate recipient clicking link"
                            >
                              <MousePointerClick className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteEmail(email.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            title="Delete tracked email"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
