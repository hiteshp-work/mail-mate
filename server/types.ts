export interface TrackedEmail {
  id: string;
  trackingId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  status: 'draft' | 'sent' | 'opened' | 'clicked';
  trackOpens: boolean;
  trackClicks: boolean;
  openCount: number;
  clickCount: number;
  sentAt: string;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  links: TrackedLink[];
  tags?: string[];
  sendMethod: 'simulator' | 'smtp';
}

export interface TrackedLink {
  id: string;
  originalUrl: string;
  trackingUrl: string;
  label?: string;
  clickCount: number;
}

export interface TrackingEvent {
  id: string;
  trackingId: string;
  emailId: string;
  type: 'open' | 'click';
  timestamp: string;
  ip: string;
  userAgent: string;
  client: string;
  os: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  location: {
    city: string;
    region: string;
    country: string;
    countryCode: string;
    flag: string;
  };
  targetUrl?: string;
}

export interface AppSettings {
  serverBaseUrl: string;
  notifyOnOpen: boolean;
  notifyOnClick: boolean;
  soundAlerts: boolean;
  webhookUrl: string;
  filterOwnOpens: boolean;
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  };
}

export interface AnalyticsSummary {
  totalSent: number;
  totalOpens: number;
  uniqueOpens: number;
  openRate: number;
  totalClicks: number;
  uniqueClicks: number;
  clickRate: number;
  avgMinutesToOpen: number;
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  clientBreakdown: { client: string; count: number; percentage: number }[];
  locationBreakdown: { country: string; countryCode: string; flag: string; count: number }[];
  timeline: { date: string; opens: number; clicks: number; sent: number }[];
}
