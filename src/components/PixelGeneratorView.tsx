import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Code,
  Link,
  Mail,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { generateStandalonePixel, wrapLink } from '../api';

export const PixelGeneratorView: React.FC = () => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedPixel, setGeneratedPixel] = useState<{
    trackingId: string;
    pixelUrl: string;
    pixelHtml: string;
    emailId: string;
  } | null>(null);

  const [destinationUrl, setDestinationUrl] = useState('');
  const [trackedLink, setTrackedLink] = useState<string | null>(null);

  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await generateStandalonePixel({
        recipientEmail: recipientEmail.trim() || undefined,
        subject: subject.trim() || undefined,
      });
      setGeneratedPixel(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWrapLink = async () => {
    if (!destinationUrl || !generatedPixel) return;
    try {
      const res = await wrapLink(destinationUrl, generatedPixel.trackingId);
      setTrackedLink(res.trackedUrl);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Standalone Tracking Pixel Generator</h2>
        <p className="text-xs text-slate-400">
          Generate stealth 1x1 tracking pixels and click-redirect links to paste into Gmail, Outlook, Apple Mail, or any custom client.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Step 1: Generate Tracking Pixel</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Email (Optional, for dashboard identification)
                </label>
                <input
                  type="email"
                  placeholder="e.g. prospect@enterprise.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Subject / Campaign Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Proposal sent via Gmail"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? 'Generating...' : 'Generate 1x1 Stealth Pixel'}
              </button>
            </form>

            {/* Generated Output */}
            {generatedPixel && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                {/* 1. Direct Image URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300">1x1 Pixel URL</span>
                    <button
                      onClick={() => copyToClipboard(generatedPixel.pixelUrl, 'url')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedType === 'url' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedType === 'url' ? 'Copied URL!' : 'Copy URL'}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 break-all select-all">
                    {generatedPixel.pixelUrl}
                  </div>
                </div>

                {/* 2. HTML Embed Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300">HTML Embed Snippet</span>
                    <button
                      onClick={() => copyToClipboard(generatedPixel.pixelHtml, 'html')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedType === 'html' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedType === 'html' ? 'Copied HTML!' : 'Copy HTML'}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-400 break-all select-all">
                    {generatedPixel.pixelHtml}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Link Wrapping */}
          {generatedPixel && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Link className="h-4 w-4 text-purple-400" />
                <span>Step 2: Wrap Click-Tracked Links (Optional)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Want to know when they click a link? Wrap any link to be automatically redirected through MailMate!
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://yourproduct.com/demo"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleWrapLink}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-all shrink-0"
                >
                  Wrap Link
                </button>
              </div>

              {trackedLink && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300">Tracked Redirect URL</span>
                    <button
                      onClick={() => copyToClipboard(trackedLink, 'link')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300"
                    >
                      {copiedType === 'link' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedType === 'link' ? 'Copied Tracked Link!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-purple-300 break-all select-all">
                    {trackedLink}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions Guide Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              <span>How To Paste In Email Clients</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                <h4 className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  In Gmail Compose
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>In Gmail, click <strong>"Insert photo"</strong> (or paste HTML via developer console).</li>
                  <li>Select <strong>"Web Address (URL)"</strong> and paste your 1x1 Pixel URL.</li>
                  <li>Click Insert. The pixel is 100% invisible!</li>
                  <li>When recipient opens, you will get an instant alert on this dashboard.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                <h4 className="font-bold text-purple-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  In Outlook or Apple Mail
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>In Outlook compose, choose <strong>"Insert Picture" &gt; "From URL"</strong>.</li>
                  <li>Paste the generated Pixel URL.</li>
                  <li>Resize to 1x1 if needed, or leave hidden.</li>
                  <li>Send email normally.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-300">Stealth & Spam Safe</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    MailMate's 1x1 transparent GIF uses lightweight zero-footprint caching headers that bypass standard spam heuristics while accurately capturing reads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
