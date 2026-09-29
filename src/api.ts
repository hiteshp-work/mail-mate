import { TrackedEmail, TrackingEvent, AnalyticsSummary, AppSettings } from './types';

const BASE_URL = ''; // Relative path leverages Vite dev proxy `/api` or production origin

export async function getEmails(): Promise<TrackedEmail[]> {
  const res = await fetch(`${BASE_URL}/api/emails`);
  if (!res.ok) throw new Error('Failed to fetch emails');
  return res.json();
}

export async function getEmail(id: string): Promise<{ email: TrackedEmail; events: TrackingEvent[] }> {
  const res = await fetch(`${BASE_URL}/api/emails/${id}`);
  if (!res.ok) throw new Error('Failed to fetch email details');
  return res.json();
}

export async function createEmail(payload: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
  sendMethod?: 'simulator' | 'smtp';
}): Promise<TrackedEmail> {
  const res = await fetch(`${BASE_URL}/api/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to send email' }));
    throw new Error(err.error || 'Failed to send email');
  }
  return res.json();
}

export async function deleteEmail(id: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/emails/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function simulateOpen(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/emails/${id}/simulate-open`, {
    method: 'POST',
  });
  return res.json();
}

export async function simulateClick(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/emails/${id}/simulate-click`, {
    method: 'POST',
  });
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${BASE_URL}/api/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function getEvents(limit = 50): Promise<TrackingEvent[]> {
  const res = await fetch(`${BASE_URL}/api/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function generateStandalonePixel(payload: {
  recipientEmail?: string;
  subject?: string;
}): Promise<{ trackingId: string; pixelUrl: string; pixelHtml: string; emailId: string }> {
  const res = await fetch(`${BASE_URL}/api/tools/generate-pixel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate tracking pixel');
  return res.json();
}

export async function wrapLink(url: string, trackingId: string): Promise<{ originalUrl: string; trackedUrl: string }> {
  const res = await fetch(`${BASE_URL}/api/tools/wrap-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, trackingId }),
  });
  if (!res.ok) throw new Error('Failed to wrap link');
  return res.json();
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${BASE_URL}/api/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${BASE_URL}/api/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function testSmtp(smtp: AppSettings['smtp']): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/settings/test-smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(smtp),
  });
  return res.json();
}

export async function seedDemoData(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/seed`, {
    method: 'POST',
  });
  return res.json();
}
