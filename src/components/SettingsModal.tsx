import React, { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  Server,
  Bell,
  Volume2,
  Webhook,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { AppSettings } from '../types';
import { getSettings, updateSettings, testSmtp, seedDemoData } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onDataReset }) => {
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettingsState(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await updateSettings(settings);
      setStatusMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!settings) return;
    setTestingSmtp(true);
    setStatusMessage(null);
    try {
      const res = await testSmtp(settings.smtp);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'SMTP Connection Verified!' });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'SMTP Test Failed' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to re-seed all sample emails and analytics data?')) {
      try {
        await seedDemoData();
        onDataReset();
        setStatusMessage({ type: 'success', text: 'Demo data re-seeded!' });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err.message });
      }
    }
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Settings & Integrations</h3>
              <p className="text-[11px] text-slate-400">SMTP Server, Webhooks, Telemetry, and Export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Status banner */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-b border-rose-500/20'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Tracking Domain */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-indigo-400" />
              Tracking Server Base URL
            </h4>
            <input
              type="text"
              value={settings.serverBaseUrl}
              onChange={(e) => setSettingsState({ ...settings, serverBaseUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              placeholder="http://localhost:5000"
            />
            <p className="text-[11px] text-slate-500">
              Used when generating pixel and click tracking URLs injected into emails.
            </p>
          </div>

          {/* Real SMTP Configuration */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-purple-400" />
                Custom SMTP Server (Optional)
              </h4>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smtp.enabled}
                  onChange={(e) =>
                    setSettingsState({
                      ...settings,
                      smtp: { ...settings.smtp, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                Enable Real Sending
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com or smtp.resend.com"
                  value={settings.smtp.host}
                  onChange={(e) =>
                    setSettingsState({ ...settings, smtp: { ...settings.smtp, host: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  placeholder="587"
                  value={settings.smtp.port}
                  onChange={(e) =>
                    setSettingsState({
                      ...settings,
                      smtp: { ...settings.smtp, port: parseInt(e.target.value) || 587 },
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={settings.smtp.user}
                  onChange={(e) =>
                    setSettingsState({ ...settings, smtp: { ...settings.smtp, user: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Password / App Key</label>
                <input
                  type="password"
                  value={settings.smtp.pass}
                  onChange={(e) =>
                    setSettingsState({ ...settings, smtp: { ...settings.smtp, pass: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={testingSmtp || !settings.smtp.host}
              onClick={handleTestSmtp}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-50 transition-colors"
            >
              {testingSmtp ? 'Testing...' : 'Verify SMTP Connection'}
            </button>
          </div>

          {/* Webhook Notifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Webhook className="h-3.5 w-3.5 text-emerald-400" />
              Webhook Integration
            </h4>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/... or https://your-server.com/webhook"
              value={settings.webhookUrl}
              onChange={(e) => setSettingsState({ ...settings, webhookUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Dispatches POST payloads containing event data whenever an email is opened or clicked.
            </p>
          </div>

          {/* Data Export & Reset */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href="/api/export?format=csv"
                download="mailmate-tracking.csv"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </a>
              <a
                href="/api/export?format=json"
                download="mailmate-tracking.json"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </a>
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-seed Demo Data
            </button>
          </div>

          {/* Footer Save */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
