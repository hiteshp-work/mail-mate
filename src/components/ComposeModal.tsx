import React, { useState } from 'react';
import {
  X,
  Send,
  Eye,
  MousePointerClick,
  Sparkles,
  Link,
  Bold,
  Italic,
  List,
  CheckCircle,
  FileText,
  Inbox,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createEmail } from '../api';
import { TrackedEmail } from '../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent: (email: TrackedEmail) => void;
}

const TEMPLATES = [
  {
    name: 'Product Demo & Architecture Deck',
    subject: 'MailMate Demo & Interactive Architecture Deck',
    body: `<p>Hi there,</p>
<p>Thanks for expressing interest in our real-time email tracking telemetry platform!</p>
<p>You can test our interactive architecture review here: <a href="https://github.com/features">MailMate Architecture Deck</a>.</p>
<p>Feel free to check our public release notes as well: <a href="https://stripe.com">Product Traction & Releases</a>.</p>
<p>Looking forward to your feedback!</p>
<p>Best regards,<br>MailMate Team</p>`,
    tags: ['Product Demo', 'Outreach'],
  },
  {
    name: 'Investor Memo & Traction Metrics',
    subject: 'MailMate Q3 Traction Metrics & Series A Deck',
    body: `<p>Dear Investor,</p>
<p>Following up on our discussion, here is the confidential deck and live customer traction report.</p>
<p>Review the memo here: <a href="https://techcrunch.com">Q3 Financials & Traction</a>.</p>
<p>Let me know if you would like to schedule a 15-minute follow-up call this Thursday.</p>
<p>Warm regards,<br>Founding Team</p>`,
    tags: ['Investor', 'Confidential'],
  },
  {
    name: 'Sales Follow-Up & Pricing Proposal',
    subject: 'Proposal & Custom Enterprise SLA for your team',
    body: `<p>Hi Alex,</p>
<p>Great speaking with you earlier! Based on our discussion, we prepared a custom enterprise tier for your engineering team.</p>
<p>Here is your tailored pricing document: <a href="https://google.com">Enterprise Proposal & SLA</a>.</p>
<p>Let me know if you have any questions before signing!</p>
<p>Cheers,<br>Enterprise Sales</p>`,
    tags: ['Sales', 'Enterprise'],
  },
];

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onEmailSent }) => {
  const [recipientEmail, setRecipientEmail] = useState('sarah.connor@cyberdyne.io');
  const [recipientName, setRecipientName] = useState('Sarah Connor');
  const [subject, setSubject] = useState('Q3 Partnership Proposal & Technical Roadmap Review');
  const [bodyHtml, setBodyHtml] = useState(
    `<p>Hi Sarah,</p><p>Great catching up yesterday! Attached is the revised roadmap for our Q3 integration.</p><p>You can review the interactive architecture deck here: <a href="https://github.com/features">Q3 Architecture Deck</a>.</p><p>Looking forward to your thoughts!</p><p>Best,<br>Alex</p>`
  );
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [sendMethod, setSendMethod] = useState<'simulator' | 'smtp'>('simulator');
  const [tagInput, setTagInput] = useState('Partnership, VIP');
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSubject(tpl.subject);
    setBodyHtml(tpl.body);
    setTagInput(tpl.tags.join(', '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !subject || !bodyHtml) {
      alert('Please fill in recipient email, subject, and message content.');
      return;
    }

    setSending(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const email = await createEmail({
        recipientEmail,
        recipientName: recipientName || recipientEmail.split('@')[0],
        subject,
        bodyHtml,
        trackOpens,
        trackClicks,
        tags,
        sendMethod,
      });

      // Confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onEmailSent(email);
      onClose();
    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Compose Tracked Email</h3>
              <p className="text-[11px] text-slate-400">Stealth pixel injection & link wrapping</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                previewMode
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {previewMode ? 'Edit Mode' : 'Live Preview'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Templates Picker Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 bg-slate-950/30 px-5 py-2.5 overflow-x-auto text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-400 whitespace-nowrap">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Templates:
          </span>
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {previewMode ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-2 text-xs">
                <p><strong className="text-slate-400">To:</strong> {recipientName} &lt;{recipientEmail}&gt;</p>
                <p><strong className="text-slate-400">Subject:</strong> {subject}</p>
                <p><strong className="text-slate-400">Tracking:</strong> {trackOpens ? '1x1 Pixel Active' : 'No Open Tracking'}, {trackClicks ? 'Auto Link Wrapping Active' : 'Direct Links'}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-200">
                <div
                  className="prose prose-invert max-w-none text-xs sm:text-sm"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="Sarah Connor"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="Subject of your message"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Sales, High Priority, Follow-up"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Body HTML */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Message Content (HTML & Links)</label>
                  <span className="text-[11px] text-slate-500">Supports HTML tags &lt;p&gt;, &lt;a&gt;, &lt;b&gt;</span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tracking & Delivery Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
                {/* Left: Tracking Toggles */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Tracking Engine</span>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={trackOpens}
                      onChange={(e) => setTrackOpens(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Track Opens (1x1 Transparent Pixel)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={trackClicks}
                      onChange={(e) => setTrackClicks(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                    />
                    <MousePointerClick className="h-3.5 w-3.5 text-purple-400" />
                    <span>Track Clicks (Wrap all &lt;a&gt; links)</span>
                  </label>
                </div>

                {/* Right: Sending Method */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Dispatch Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSendMethod('simulator')}
                      className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-semibold border transition-all ${
                        sendMethod === 'simulator'
                          ? 'border-indigo-500 bg-indigo-600/20 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Inbox className="h-4 w-4 mb-1 text-indigo-400" />
                      <span>Sandbox Mailbox</span>
                      <span className="text-[9px] text-slate-500 font-normal">Instant Demo Testing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSendMethod('smtp')}
                      className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-semibold border transition-all ${
                        sendMethod === 'smtp'
                          ? 'border-indigo-500 bg-indigo-600/20 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Globe className="h-4 w-4 mb-1 text-purple-400" />
                      <span>Real SMTP</span>
                      <span className="text-[9px] text-slate-500 font-normal">Send over Internet</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer CTA */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Dispatching...' : 'Send Tracked Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
