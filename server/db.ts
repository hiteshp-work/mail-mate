import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TrackedEmail, TrackingEvent, AppSettings, AnalyticsSummary } from './types';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  emails: TrackedEmail[];
  events: TrackingEvent[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  serverBaseUrl: 'http://localhost:5000',
  notifyOnOpen: true,
  notifyOnClick: true,
  soundAlerts: true,
  webhookUrl: '',
  filterOwnOpens: false,
  smtp: {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: 'MailMate Tracker',
  },
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      emails: [],
      events: [],
      settings: DEFAULT_SETTINGS,
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          emails: parsed.emails || [],
          events: parsed.events || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
      } catch (err) {
        console.error('Failed to read db.json, initializing fresh data', err);
        this.seedDemoData();
      }
    } else {
      this.seedDemoData();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // Emails
  public getEmails(): TrackedEmail[] {
    return [...this.data.emails].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }

  public getEmailById(id: string): TrackedEmail | undefined {
    return this.data.emails.find((e) => e.id === id || e.trackingId === id);
  }

  public getEmailByTrackingId(trackingId: string): TrackedEmail | undefined {
    return this.data.emails.find((e) => e.trackingId === trackingId);
  }

  public createEmail(email: TrackedEmail): TrackedEmail {
    this.data.emails.unshift(email);
    this.save();
    return email;
  }

  public updateEmail(id: string, updates: Partial<TrackedEmail>): TrackedEmail | undefined {
    const index = this.data.emails.findIndex((e) => e.id === id || e.trackingId === id);
    if (index === -1) return undefined;

    this.data.emails[index] = { ...this.data.emails[index], ...updates };
    this.save();
    return this.data.emails[index];
  }

  public deleteEmail(id: string): boolean {
    const beforeCount = this.data.emails.length;
    this.data.emails = this.data.emails.filter((e) => e.id !== id && e.trackingId !== id);
    this.data.events = this.data.events.filter((ev) => ev.emailId !== id && ev.trackingId !== id);
    this.save();
    return this.data.emails.length < beforeCount;
  }

  // Events
  public getEvents(limit = 100): TrackingEvent[] {
    return [...this.data.events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public getEventsForEmail(emailId: string): TrackingEvent[] {
    return this.data.events
      .filter((ev) => ev.emailId === emailId || ev.trackingId === emailId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordEvent(event: TrackingEvent): TrackingEvent {
    this.data.events.unshift(event);
    this.save();
    return event;
  }

  // Settings
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }

  // Analytics
  public getAnalytics(): AnalyticsSummary {
    const emails = this.data.emails;
    const events = this.data.events;

    const totalSent = emails.length;
    const openedEmails = emails.filter((e) => e.openCount > 0);
    const clickedEmails = emails.filter((e) => e.clickCount > 0);

    const totalOpens = events.filter((e) => e.type === 'open').length;
    const uniqueOpens = openedEmails.length;
    const openRate = totalSent > 0 ? Math.round((uniqueOpens / totalSent) * 100) : 0;

    const totalClicks = events.filter((e) => e.type === 'click').length;
    const uniqueClicks = clickedEmails.length;
    const clickRate = totalSent > 0 ? Math.round((uniqueClicks / totalSent) * 100) : 0;

    // Average minutes to first open
    let totalMinutes = 0;
    let countedFirstOpens = 0;
    for (const email of openedEmails) {
      if (email.firstOpenedAt && email.sentAt) {
        const diff = (new Date(email.firstOpenedAt).getTime() - new Date(email.sentAt).getTime()) / 60000;
        if (diff >= 0 && diff < 10000) {
          totalMinutes += diff;
          countedFirstOpens++;
        }
      }
    }
    const avgMinutesToOpen = countedFirstOpens > 0 ? Math.round(totalMinutes / countedFirstOpens) : 12;

    // Device breakdown
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    events.forEach((ev) => {
      const dev = ev.device === 'bot' || ev.device === 'unknown' ? 'desktop' : ev.device;
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });
    const totalDevEvents = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
    const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
      device: device.charAt(0).toUpperCase() + device.slice(1),
      count,
      percentage: Math.round((count / totalDevEvents) * 100),
    }));

    // Client breakdown
    const clientCounts: Record<string, number> = {};
    events.forEach((ev) => {
      const client = ev.client || 'Other';
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });
    const totalClientEvents = Object.values(clientCounts).reduce((a, b) => a + b, 0) || 1;
    const clientBreakdown = Object.entries(clientCounts)
      .map(([client, count]) => ({
        client,
        count,
        percentage: Math.round((count / totalClientEvents) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Location breakdown
    const locationCounts: Record<string, { country: string; countryCode: string; flag: string; count: number }> = {};
    events.forEach((ev) => {
      const key = ev.location.countryCode || 'US';
      if (!locationCounts[key]) {
        locationCounts[key] = {
          country: ev.location.country || 'United States',
          countryCode: key,
          flag: ev.location.flag || '🇺🇸',
          count: 0,
        };
      }
      locationCounts[key].count++;
    });
    const locationBreakdown = Object.values(locationCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Timeline: last 7 days
    const timelineMap: Record<string, { date: string; opens: number; clicks: number; sent: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timelineMap[dateStr] = { date: dateStr, opens: 0, clicks: 0, sent: 0 };
    }

    emails.forEach((em) => {
      const d = new Date(em.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (timelineMap[d]) {
        timelineMap[d].sent++;
      }
    });

    events.forEach((ev) => {
      const d = new Date(ev.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (timelineMap[d]) {
        if (ev.type === 'open') timelineMap[d].opens++;
        if (ev.type === 'click') timelineMap[d].clicks++;
      }
    });

    return {
      totalSent,
      totalOpens,
      uniqueOpens,
      openRate,
      totalClicks,
      uniqueClicks,
      clickRate,
      avgMinutesToOpen,
      deviceBreakdown,
      clientBreakdown,
      locationBreakdown,
      timeline: Object.values(timelineMap),
    };
  }

  // Seed Demo Data
  public seedDemoData() {
    const now = Date.now();
    const demoEmails: TrackedEmail[] = [
      {
        id: 'em_seed_1',
        trackingId: 'tk_alpha_741',
        recipientEmail: 'sarah.connor@cyberdyne.io',
        recipientName: 'Sarah Connor',
        subject: 'Q3 Partnership Proposal & Technical Roadmap Review',
        bodyHtml: `<p>Hi Sarah,</p><p>Great catching up yesterday! Attached is the revised roadmap for our Q3 integration.</p><p>You can review the interactive architecture deck here: <a href="https://github.com/features">Q3 Architecture Deck</a>.</p><p>Looking forward to your thoughts!</p><p>Best,<br>Alex</p>`,
        status: 'clicked',
        trackOpens: true,
        trackClicks: true,
        openCount: 4,
        clickCount: 2,
        sentAt: new Date(now - 4 * 3600 * 1000).toISOString(),
        firstOpenedAt: new Date(now - 3.8 * 3600 * 1000).toISOString(),
        lastOpenedAt: new Date(now - 0.4 * 3600 * 1000).toISOString(),
        lastClickedAt: new Date(now - 0.3 * 3600 * 1000).toISOString(),
        links: [
          {
            id: 'lnk_1',
            originalUrl: 'https://github.com/features',
            trackingUrl: 'http://localhost:5000/api/track/click/tk_alpha_741?url=https%3A%2F%2Fgithub.com%2Ffeatures',
            label: 'Q3 Architecture Deck',
            clickCount: 2,
          },
        ],
        tags: ['Partnership', 'VIP'],
        sendMethod: 'simulator',
      },
      {
        id: 'em_seed_2',
        trackingId: 'tk_beta_882',
        recipientEmail: 'elena.rostova@techventure.vc',
        recipientName: 'Elena Rostova',
        subject: 'MailMate Series A Memo & Live Metrics Dashboard',
        bodyHtml: `<p>Dear Elena,</p><p>Following our conversation, please find the investor memo and live customer traction report.</p><p>Check the traction metrics: <a href="https://stripe.com">Live Metrics Report</a></p><p>Warm regards,<br>MailMate Team</p>`,
        status: 'opened',
        trackOpens: true,
        trackClicks: true,
        openCount: 2,
        clickCount: 0,
        sentAt: new Date(now - 12 * 3600 * 1000).toISOString(),
        firstOpenedAt: new Date(now - 11.2 * 3600 * 1000).toISOString(),
        lastOpenedAt: new Date(now - 5 * 3600 * 1000).toISOString(),
        lastClickedAt: null,
        links: [
          {
            id: 'lnk_2',
            originalUrl: 'https://stripe.com',
            trackingUrl: 'http://localhost:5000/api/track/click/tk_beta_882?url=https%3A%2F%2Fstripe.com',
            label: 'Live Metrics Report',
            clickCount: 0,
          },
        ],
        tags: ['Investor', 'Outreach'],
        sendMethod: 'simulator',
      },
      {
        id: 'em_seed_3',
        trackingId: 'tk_gamma_933',
        recipientEmail: 'david.kim@acmelabs.com',
        recipientName: 'David Kim',
        subject: 'Quick question regarding your API integration pipeline',
        bodyHtml: `<p>Hey David,</p><p>Saw your recent post on distributed webhook processing. We solved a very similar latency issue using lightweight edge proxies.</p><p>Would love to exchange notes if you have 10 mins this week!</p><p>Cheers,<br>Alex</p>`,
        status: 'opened',
        trackOpens: true,
        trackClicks: true,
        openCount: 1,
        clickCount: 0,
        sentAt: new Date(now - 26 * 3600 * 1000).toISOString(),
        firstOpenedAt: new Date(now - 25 * 3600 * 1000).toISOString(),
        lastOpenedAt: new Date(now - 25 * 3600 * 1000).toISOString(),
        lastClickedAt: null,
        links: [],
        tags: ['Cold Outreach'],
        sendMethod: 'simulator',
      },
      {
        id: 'em_seed_4',
        trackingId: 'tk_delta_104',
        recipientEmail: 'maya.patel@designstudio.co',
        recipientName: 'Maya Patel',
        subject: 'Contract Agreement & Project Scope Confirmation',
        bodyHtml: `<p>Hi Maya,</p><p>Here is the signed scope of work document for our branding redesign.</p><p>You can sign electronically via <a href="https://docusign.com">DocuSign Agreement</a>.</p><p>Thanks!</p>`,
        status: 'sent',
        trackOpens: true,
        trackClicks: true,
        openCount: 0,
        clickCount: 0,
        sentAt: new Date(now - 30 * 60 * 1000).toISOString(),
        firstOpenedAt: null,
        lastOpenedAt: null,
        lastClickedAt: null,
        links: [
          {
            id: 'lnk_3',
            originalUrl: 'https://docusign.com',
            trackingUrl: 'http://localhost:5000/api/track/click/tk_delta_104?url=https%3A%2F%2Fdocusign.com',
            label: 'DocuSign Agreement',
            clickCount: 0,
          },
        ],
        tags: ['Contract', 'Client'],
        sendMethod: 'simulator',
      },
      {
        id: 'em_seed_5',
        trackingId: 'tk_epsilon_505',
        recipientEmail: 'marcus.vance@cloudscale.net',
        recipientName: 'Marcus Vance',
        subject: 'Enterprise SLA & Custom Onboarding Package',
        bodyHtml: `<p>Hi Marcus,</p><p>Thanks for selecting MailMate. Here is the custom onboarding portal link: <a href="https://google.com">Customer Portal</a>.</p>`,
        status: 'clicked',
        trackOpens: true,
        trackClicks: true,
        openCount: 6,
        clickCount: 3,
        sentAt: new Date(now - 48 * 3600 * 1000).toISOString(),
        firstOpenedAt: new Date(now - 47 * 3600 * 1000).toISOString(),
        lastOpenedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        lastClickedAt: new Date(now - 1.8 * 3600 * 1000).toISOString(),
        links: [
          {
            id: 'lnk_4',
            originalUrl: 'https://google.com',
            trackingUrl: 'http://localhost:5000/api/track/click/tk_epsilon_505?url=https%3A%2F%2Fgoogle.com',
            label: 'Customer Portal',
            clickCount: 3,
          },
        ],
        tags: ['Enterprise'],
        sendMethod: 'simulator',
      },
    ];

    const demoEvents: TrackingEvent[] = [
      {
        id: 'ev_1',
        trackingId: 'tk_alpha_741',
        emailId: 'em_seed_1',
        type: 'open',
        timestamp: new Date(now - 3.8 * 3600 * 1000).toISOString(),
        ip: '198.51.100.24',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        client: 'Chrome 124',
        os: 'macOS 10.15',
        device: 'desktop',
        location: { city: 'San Francisco', region: 'California', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
      },
      {
        id: 'ev_2',
        trackingId: 'tk_alpha_741',
        emailId: 'em_seed_1',
        type: 'open',
        timestamp: new Date(now - 2.5 * 3600 * 1000).toISOString(),
        ip: '198.51.100.24',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        client: 'Apple Mail (Privacy Protection)',
        os: 'iOS 17.4',
        device: 'mobile',
        location: { city: 'San Francisco', region: 'California', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
      },
      {
        id: 'ev_3',
        trackingId: 'tk_alpha_741',
        emailId: 'em_seed_1',
        type: 'click',
        timestamp: new Date(now - 0.3 * 3600 * 1000).toISOString(),
        ip: '198.51.100.24',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        client: 'Chrome 124',
        os: 'macOS 10.15',
        device: 'desktop',
        location: { city: 'San Francisco', region: 'California', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
        targetUrl: 'https://github.com/features',
      },
      {
        id: 'ev_4',
        trackingId: 'tk_beta_882',
        emailId: 'em_seed_2',
        type: 'open',
        timestamp: new Date(now - 11.2 * 3600 * 1000).toISOString(),
        ip: '203.0.113.88',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
        client: 'Microsoft Outlook',
        os: 'Windows 11',
        device: 'desktop',
        location: { city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧' },
      },
      {
        id: 'ev_5',
        trackingId: 'tk_gamma_933',
        emailId: 'em_seed_3',
        type: 'open',
        timestamp: new Date(now - 25 * 3600 * 1000).toISOString(),
        ip: '192.0.2.140',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) GoogleImageProxy',
        client: 'Gmail Proxy',
        os: 'macOS',
        device: 'desktop',
        location: { city: 'New York', region: 'New York', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
      },
      {
        id: 'ev_6',
        trackingId: 'tk_epsilon_505',
        emailId: 'em_seed_5',
        type: 'open',
        timestamp: new Date(now - 47 * 3600 * 1000).toISOString(),
        ip: '198.51.100.99',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        client: 'Chrome 122',
        os: 'Windows 10',
        device: 'desktop',
        location: { city: 'Toronto', region: 'Ontario', country: 'Canada', countryCode: 'CA', flag: '🇨🇦' },
      },
      {
        id: 'ev_7',
        trackingId: 'tk_epsilon_505',
        emailId: 'em_seed_5',
        type: 'click',
        timestamp: new Date(now - 1.8 * 3600 * 1000).toISOString(),
        ip: '198.51.100.99',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        client: 'Chrome 122',
        os: 'Windows 10',
        device: 'desktop',
        location: { city: 'Toronto', region: 'Ontario', country: 'Canada', countryCode: 'CA', flag: '🇨🇦' },
        targetUrl: 'https://google.com',
      },
    ];

    this.data = {
      emails: demoEmails,
      events: demoEvents,
      settings: DEFAULT_SETTINGS,
    };
    this.save();
  }
}

export const db = new Database();
