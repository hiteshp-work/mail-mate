import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { EmailsView } from './components/EmailsView';
import { ActivityFeedView } from './components/ActivityFeedView';
import { RecipientSandboxView } from './components/RecipientSandboxView';
import { PixelGeneratorView } from './components/PixelGeneratorView';
import { EmailDetailModal } from './components/EmailDetailModal';
import { ComposeModal } from './components/ComposeModal';
import { SettingsModal } from './components/SettingsModal';
import { LiveToast } from './components/LiveToast';
import { soundEffects } from './utils/audio';
import { TrackedEmail, TrackingEvent, AnalyticsSummary } from './types';
import {
  getEmails,
  getEmail,
  getEvents,
  getAnalytics,
  deleteEmail,
  simulateOpen,
  simulateClick,
} from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [emails, setEmails] = useState<TrackedEmail[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Modals & views
  const [selectedEmail, setSelectedEmail] = useState<TrackedEmail | null>(null);
  const [selectedEmailEvents, setSelectedEmailEvents] = useState<TrackingEvent[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sandboxSelectedEmailId, setSandboxSelectedEmailId] = useState<string | null>(null);

  // Live SSE connection & audio
  const [sseConnected, setSseConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveToastEvent, setLiveToastEvent] = useState<TrackingEvent | null>(null);

  // Sync sound setting
  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial Data Fetch
  const loadAllData = async () => {
    try {
      const [fetchedEmails, fetchedEvents, fetchedAnalytics] = await Promise.all([
        getEmails(),
        getEvents(50),
        getAnalytics(),
      ]);
      setEmails(fetchedEmails);
      setEvents(fetchedEvents);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // SSE Real-Time Listener
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSse = () => {
      es = new EventSource('/api/events/stream');

      es.addEventListener('connected', () => {
        setSseConnected(true);
      });

      es.addEventListener('email_opened', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const newEvent: TrackingEvent = payload.data.event;
          const updatedEmail: TrackedEmail = payload.data.email;

          // Sound Chime
          soundEffects.playOpenChime();

          // Show Toast
          setLiveToastEvent(newEvent);

          // Update local state
          setEvents((prev) => [newEvent, ...prev]);
          setEmails((prev) =>
            prev.map((em) => (em.id === updatedEmail.id ? updatedEmail : em))
          );

          // If detail modal is open for this email, refresh its events
          if (selectedEmail && selectedEmail.id === updatedEmail.id) {
            setSelectedEmail(updatedEmail);
            setSelectedEmailEvents((prev) => [newEvent, ...prev]);
          }

          // Refresh analytics
          getAnalytics().then(setAnalytics).catch(console.error);
        } catch (err) {
          console.error('Failed to parse SSE open event:', err);
        }
      });

      es.addEventListener('email_clicked', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const newEvent: TrackingEvent = payload.data.event;
          const updatedEmail: TrackedEmail = payload.data.email;

          // Sound Click Ping
          soundEffects.playClickPing();

          // Show Toast
          setLiveToastEvent(newEvent);

          // Update local state
          setEvents((prev) => [newEvent, ...prev]);
          setEmails((prev) =>
            prev.map((em) => (em.id === updatedEmail.id ? updatedEmail : em))
          );

          if (selectedEmail && selectedEmail.id === updatedEmail.id) {
            setSelectedEmail(updatedEmail);
            setSelectedEmailEvents((prev) => [newEvent, ...prev]);
          }

          // Refresh analytics
          getAnalytics().then(setAnalytics).catch(console.error);
        } catch (err) {
          console.error('Failed to parse SSE click event:', err);
        }
      });

      es.addEventListener('email_sent', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setEmails((prev) => [payload.data.email, ...prev]);
          getAnalytics().then(setAnalytics).catch(console.error);
        } catch (err) {
          console.error('Failed to parse SSE email_sent event:', err);
        }
      });

      es.addEventListener('data_reset', () => {
        loadAllData();
      });

      es.onerror = () => {
        setSseConnected(false);
        es?.close();
        reconnectTimeout = setTimeout(connectSse, 4000);
      };
    };

    connectSse();

    return () => {
      es?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [selectedEmail]);

  // Handle Email Selection for Deep Dive Modal
  const handleSelectEmail = async (email: TrackedEmail) => {
    setSelectedEmail(email);
    try {
      const details = await getEmail(email.id);
      setSelectedEmailEvents(details.events);
    } catch {
      setSelectedEmailEvents([]);
    }
  };

  const handleSelectEmailById = (emailId: string) => {
    const em = emails.find((e) => e.id === emailId);
    if (em) {
      handleSelectEmail(em);
    }
  };

  // Actions
  const handleSimulateOpen = async (id: string) => {
    try {
      await simulateOpen(id);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const handleSimulateClick = async (id: string) => {
    try {
      await simulateClick(id);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (confirm('Delete this tracked email and all associated events?')) {
      try {
        await deleteEmail(id);
        setEmails((prev) => prev.filter((e) => e.id !== id));
        if (selectedEmail?.id === id) setSelectedEmail(null);
        getAnalytics().then(setAnalytics);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleOpenSandbox = (emailId?: string) => {
    if (emailId) setSandboxSelectedEmailId(emailId);
    setActiveTab('sandbox');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        openCompose={() => setComposeOpen(true)}
        sseConnected={sseConnected}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        openCount={events.filter((e) => e.type === 'open').length}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            analytics={analytics}
            recentEmails={emails}
            recentEvents={events}
            onSelectEmail={handleSelectEmail}
            onOpenCompose={() => setComposeOpen(true)}
            onOpenSandbox={() => handleOpenSandbox()}
            onOpenPixelGen={() => setActiveTab('pixel-gen')}
            onViewAllEmails={() => setActiveTab('emails')}
            onViewAllFeed={() => setActiveTab('feed')}
          />
        )}

        {activeTab === 'emails' && (
          <EmailsView
            emails={emails}
            onSelectEmail={handleSelectEmail}
            onSimulateOpen={handleSimulateOpen}
            onSimulateClick={handleSimulateClick}
            onDeleteEmail={handleDeleteEmail}
            onOpenSandbox={handleOpenSandbox}
            onCompose={() => setComposeOpen(true)}
          />
        )}

        {activeTab === 'feed' && (
          <ActivityFeedView
            events={events}
            sseConnected={sseConnected}
            onSelectEmailId={handleSelectEmailById}
          />
        )}

        {activeTab === 'sandbox' && (
          <RecipientSandboxView
            emails={emails}
            selectedEmailId={sandboxSelectedEmailId}
            onSelectEmailId={(id) => setSandboxSelectedEmailId(id)}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'pixel-gen' && <PixelGeneratorView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MailMate Tracker • Stealth 1x1 Pixel & Hyperlink Telemetry Platform</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setSettingsOpen(true)} className="hover:text-slate-200">
              Settings & SMTP
            </button>
            <span>•</span>
            <button onClick={() => handleOpenSandbox()} className="hover:text-amber-400">
              Recipient Sandbox
            </button>
            <span>•</span>
            <a href="/api/export?format=csv" className="hover:text-indigo-400">
              Export CSV
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onEmailSent={(email) => {
          setEmails((prev) => [email, ...prev]);
          setSandboxSelectedEmailId(email.id);
          getAnalytics().then(setAnalytics);
        }}
      />

      <EmailDetailModal
        email={selectedEmail}
        events={selectedEmailEvents}
        onClose={() => setSelectedEmail(null)}
        onSimulateOpen={handleSimulateOpen}
        onSimulateClick={handleSimulateClick}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDataReset={loadAllData}
      />

      {/* Real-time Toast Pop-up */}
      <LiveToast
        event={liveToastEvent}
        onClose={() => setLiveToastEvent(null)}
        onClick={() => {
          if (liveToastEvent) {
            handleSelectEmailById(liveToastEvent.emailId);
            setLiveToastEvent(null);
          }
        }}
      />
    </div>
  );
}

export default App;
