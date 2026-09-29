import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { parseUserAgent, resolveLocation } from './geo';
import { sendEmailViaSmtp, verifySmtpConnection } from './mailer';
import { TrackedEmail, TrackingEvent, TrackedLink } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1x1 Transparent GIF buffer (43 bytes)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// Active SSE client connections
const sseClients = new Set<Response>();

function broadcastSse(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`event: ${eventType}\ndata: ${data}\n\n`);
    } catch (err) {
      console.error('SSE send error, removing client:', err);
      sseClients.delete(client);
    }
  }
}

export function resolveBaseUrl(req?: Request): string {
  const settings = db.getSettings();
  if (settings.serverBaseUrl && !settings.serverBaseUrl.includes('localhost') && !settings.serverBaseUrl.includes('127.0.0.1')) {
    return settings.serverBaseUrl.replace(/\/$/, '');
  }
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`;
    }
  }
  return settings.serverBaseUrl || `http://localhost:${PORT}`;
}

// -------------------------------------------------------------
// TRACKING ENDPOINTS
// -------------------------------------------------------------

// 1. Open Tracking Pixel
app.get(['/api/track/pixel/:trackingId', '/api/track/pixel/:trackingId.png'], (req: Request, res: Response) => {
  const trackingId = req.params.trackingId.replace(/\.png$/, '');
  const userAgent = req.headers['user-agent'] || '';
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Prevent browser caching of tracking pixel
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Immediately serve image
  res.send(TRANSPARENT_GIF_BUFFER);

  // Asynchronously record event
  setImmediate(async () => {
    try {
      const email = db.getEmailByTrackingId(trackingId);
      if (!email) {
        console.warn(`[Pixel] Unknown trackingId: ${trackingId}`);
        return;
      }

      const { client, os, device } = parseUserAgent(userAgent);
      const location = resolveLocation(clientIp);
      const now = new Date().toISOString();

      const event: TrackingEvent = {
        id: `ev_${uuidv4().slice(0, 8)}`,
        trackingId,
        emailId: email.id,
        type: 'open',
        timestamp: now,
        ip: clientIp,
        userAgent,
        client,
        os,
        device,
        location,
      };

      db.recordEvent(event);

      // Update email stats
      db.updateEmail(email.id, {
        openCount: (email.openCount || 0) + 1,
        lastOpenedAt: now,
        firstOpenedAt: email.firstOpenedAt || now,
        status: email.status === 'sent' ? 'opened' : email.status,
      });

      console.log(`[Pixel] Open recorded for "${email.subject}" (${email.recipientEmail}) from ${location.city}, ${location.country}`);

      // Broadcast via SSE
      broadcastSse('email_opened', {
        event,
        email: db.getEmailById(email.id),
      });

      // Fire webhook if configured
      const settings = db.getSettings();
      if (settings.webhookUrl && settings.notifyOnOpen) {
        fetch(settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'email.opened', data: event, email }),
        }).catch((err) => console.error('Webhook dispatch failed:', err.message));
      }
    } catch (err) {
      console.error('Error handling pixel open:', err);
    }
  });
});

// 2. Click Tracking Redirect
app.get('/api/track/click/:trackingId', (req: Request, res: Response) => {
  const trackingId = req.params.trackingId;
  const targetUrl = (req.query.url as string) || 'https://google.com';
  const userAgent = req.headers['user-agent'] || '';
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Sanitize destination URL
  let safeDestination = targetUrl;
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      safeDestination = 'https://google.com';
    }
  } catch {
    safeDestination = 'https://google.com';
  }

  // Redirect immediately
  res.redirect(302, safeDestination);

  // Record click event
  setImmediate(async () => {
    try {
      const email = db.getEmailByTrackingId(trackingId);
      if (!email) {
        console.warn(`[Click] Unknown trackingId: ${trackingId}`);
        return;
      }

      const { client, os, device } = parseUserAgent(userAgent);
      const location = resolveLocation(clientIp);
      const now = new Date().toISOString();

      const event: TrackingEvent = {
        id: `ev_${uuidv4().slice(0, 8)}`,
        trackingId,
        emailId: email.id,
        type: 'click',
        timestamp: now,
        ip: clientIp,
        userAgent,
        client,
        os,
        device,
        location,
        targetUrl: safeDestination,
      };

      db.recordEvent(event);

      // Update link click counts
      const updatedLinks = (email.links || []).map((lnk) => {
        if (lnk.originalUrl === safeDestination || lnk.trackingUrl.includes(encodeURIComponent(safeDestination))) {
          return { ...lnk, clickCount: (lnk.clickCount || 0) + 1 };
        }
        return lnk;
      });

      // Update email stats
      db.updateEmail(email.id, {
        clickCount: (email.clickCount || 0) + 1,
        lastClickedAt: now,
        status: 'clicked',
        links: updatedLinks,
      });

      console.log(`[Click] Click recorded on "${safeDestination}" for "${email.subject}" (${email.recipientEmail})`);

      // Broadcast via SSE
      broadcastSse('email_clicked', {
        event,
        email: db.getEmailById(email.id),
      });

      // Webhook dispatch
      const settings = db.getSettings();
      if (settings.webhookUrl && settings.notifyOnClick) {
        fetch(settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'email.clicked', data: event, email }),
        }).catch((err) => console.error('Webhook dispatch failed:', err.message));
      }
    } catch (err) {
      console.error('Error handling click:', err);
    }
  });
});

// 3. Real-Time Server-Sent Events (SSE) Stream
app.get('/api/events/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clients: sseClients.size + 1 })}\n\n`);

  sseClients.add(res);
  console.log(`[SSE] Client connected. Total active clients: ${sseClients.size}`);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(':keepalive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(res);
    console.log(`[SSE] Client disconnected. Total active clients: ${sseClients.size}`);
  });
});

// -------------------------------------------------------------
// EMAIL API ENDPOINTS
// -------------------------------------------------------------

// List all emails
app.get('/api/emails', (req: Request, res: Response) => {
  const emails = db.getEmails();
  res.json(emails);
});

// Get single email with associated events
app.get('/api/emails/:id', (req: Request, res: Response) => {
  const email = db.getEmailById(req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  const events = db.getEventsForEmail(email.id);
  res.json({ email, events });
});

// Create & Send Tracked Email
app.post('/api/emails', async (req: Request, res: Response) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      trackOpens = true,
      trackClicks = true,
      tags = [],
      sendMethod = 'simulator',
    } = req.body;

    if (!recipientEmail || !subject || !bodyHtml) {
      return res.status(400).json({ error: 'recipientEmail, subject, and bodyHtml are required.' });
    }

    const trackingId = `tk_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
    const emailId = `em_${uuidv4().slice(0, 8)}`;
    const baseUrl = resolveBaseUrl(req);

    // Link wrapping logic
    const trackedLinks: TrackedLink[] = [];
    let processedHtml = bodyHtml;

    if (trackClicks) {
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+)["']([^>]*)>(.*?)<\/a>/gi;
      let linkIndex = 1;

      processedHtml = processedHtml.replace(linkRegex, (match, url, restAttrs, innerText) => {
        const linkId = `lnk_${linkIndex++}`;
        const trackingUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;

        trackedLinks.push({
          id: linkId,
          originalUrl: url,
          trackingUrl,
          label: innerText.replace(/<[^>]*>?/gm, '').trim() || url,
          clickCount: 0,
        });

        return `<a href="${trackingUrl}" data-tracked-link="${linkId}" ${restAttrs}>${innerText}</a>`;
      });
    }

    // Tracking pixel injection
    if (trackOpens) {
      const pixelUrl = `${baseUrl}/api/track/pixel/${trackingId}.png`;
      const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none !important; min-height:1px !important; width:1px !important; border:0 !important; outline:none !important;" />`;
      processedHtml += `\n${pixelTag}`;
    }

    const newEmail: TrackedEmail = {
      id: emailId,
      trackingId,
      recipientEmail,
      recipientName: recipientName || recipientEmail.split('@')[0],
      subject,
      bodyHtml: processedHtml,
      status: 'sent',
      trackOpens,
      trackClicks,
      openCount: 0,
      clickCount: 0,
      sentAt: new Date().toISOString(),
      firstOpenedAt: null,
      lastOpenedAt: null,
      lastClickedAt: null,
      links: trackedLinks,
      tags: tags.length ? tags : ['Direct'],
      sendMethod,
    };

    // If real SMTP is requested
    if (sendMethod === 'smtp' && settings.smtp.enabled) {
      try {
        await sendEmailViaSmtp(settings, {
          to: `"${newEmail.recipientName}" <${newEmail.recipientEmail}>`,
          subject: newEmail.subject,
          html: newEmail.bodyHtml,
        });
      } catch (smtpErr: any) {
        console.error('SMTP sending failed:', smtpErr);
        return res.status(500).json({ error: `SMTP Send Failed: ${smtpErr.message}` });
      }
    }

    db.createEmail(newEmail);

    broadcastSse('email_sent', { email: newEmail });

    res.status(201).json(newEmail);
  } catch (err: any) {
    console.error('Failed to create tracked email:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete email
app.delete('/api/emails/:id', (req: Request, res: Response) => {
  const deleted = db.deleteEmail(req.params.id);
  if (deleted) {
    broadcastSse('email_deleted', { id: req.params.id });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Email not found' });
  }
});

// Simulate Open (Direct trigger for testing)
app.post('/api/emails/:id/simulate-open', (req: Request, res: Response) => {
  const email = db.getEmailById(req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  const { city, country, countryCode, flag } = resolveLocation('127.0.0.1');
  const userAgents = [
    { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0', client: 'Chrome 124', os: 'macOS', device: 'desktop' as const },
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) AppleWebKit/605.1.15 Mobile/15E148', client: 'Apple Mail', os: 'iOS 17.4', device: 'mobile' as const },
    { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Outlook/16.0', client: 'Microsoft Outlook', os: 'Windows 11', device: 'desktop' as const },
  ];
  const chosen = userAgents[Math.floor(Math.random() * userAgents.length)];
  const now = new Date().toISOString();

  const event: TrackingEvent = {
    id: `ev_${uuidv4().slice(0, 8)}`,
    trackingId: email.trackingId,
    emailId: email.id,
    type: 'open',
    timestamp: now,
    ip: '127.0.0.1',
    userAgent: chosen.ua,
    client: chosen.client,
    os: chosen.os,
    device: chosen.device,
    location: { city, region: 'Simulation', country, countryCode, flag },
  };

  db.recordEvent(event);
  const updatedEmail = db.updateEmail(email.id, {
    openCount: (email.openCount || 0) + 1,
    lastOpenedAt: now,
    firstOpenedAt: email.firstOpenedAt || now,
    status: email.status === 'sent' ? 'opened' : email.status,
  });

  broadcastSse('email_opened', { event, email: updatedEmail });

  res.json({ success: true, event, email: updatedEmail });
});

// Simulate Click (Direct trigger for testing)
app.post('/api/emails/:id/simulate-click', (req: Request, res: Response) => {
  const email = db.getEmailById(req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  const targetLink = email.links?.[0] || { originalUrl: 'https://github.com/features' };
  const { city, country, countryCode, flag } = resolveLocation('127.0.0.1');
  const now = new Date().toISOString();

  const event: TrackingEvent = {
    id: `ev_${uuidv4().slice(0, 8)}`,
    trackingId: email.trackingId,
    emailId: email.id,
    type: 'click',
    timestamp: now,
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0',
    client: 'Chrome 124',
    os: 'macOS',
    device: 'desktop',
    location: { city, region: 'Simulation', country, countryCode, flag },
    targetUrl: targetLink.originalUrl,
  };

  db.recordEvent(event);

  const updatedLinks = (email.links || []).map((lnk) => {
    if (lnk.originalUrl === targetLink.originalUrl) {
      return { ...lnk, clickCount: (lnk.clickCount || 0) + 1 };
    }
    return lnk;
  });

  const updatedEmail = db.updateEmail(email.id, {
    clickCount: (email.clickCount || 0) + 1,
    lastClickedAt: now,
    status: 'clicked',
    links: updatedLinks,
  });

  broadcastSse('email_clicked', { event, email: updatedEmail });

  res.json({ success: true, event, email: updatedEmail });
});

// -------------------------------------------------------------
// ANALYTICS & EVENTS
// -------------------------------------------------------------

// Analytics Overview
app.get('/api/analytics', (req: Request, res: Response) => {
  const analytics = db.getAnalytics();
  res.json(analytics);
});

// Recent Events Activity Stream
app.get('/api/events', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const events = db.getEvents(limit);
  // Join email details
  const enriched = events.map((ev) => {
    const email = db.getEmailById(ev.emailId);
    return {
      ...ev,
      recipientEmail: email?.recipientEmail || 'Unknown recipient',
      recipientName: email?.recipientName || 'Unknown',
      subject: email?.subject || 'Untracked Subject',
    };
  });
  res.json(enriched);
});

// -------------------------------------------------------------
// STANDALONE TOOLS & GENERATORS
// -------------------------------------------------------------

// Generate Standalone Tracking Pixel & Link (for Gmail/Outlook)
app.post('/api/tools/generate-pixel', (req: Request, res: Response) => {
  const { recipientEmail = '', subject = 'External Email' } = req.body;
  const trackingId = `tk_ext_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  const emailId = `em_ext_${uuidv4().slice(0, 8)}`;
  const baseUrl = resolveBaseUrl(req);

  const pixelUrl = `${baseUrl}/api/track/pixel/${trackingId}.png`;
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none !important; min-height:1px !important; width:1px !important; border:0 !important; outline:none !important;" />`;

  const newEmail: TrackedEmail = {
    id: emailId,
    trackingId,
    recipientEmail: recipientEmail || 'External Recipient',
    recipientName: recipientEmail ? recipientEmail.split('@')[0] : 'External Recipient',
    subject: subject || 'Direct Pixel Tracking',
    bodyHtml: `<p>Pixel generated for external email client (Gmail/Outlook).</p>`,
    status: 'sent',
    trackOpens: true,
    trackClicks: false,
    openCount: 0,
    clickCount: 0,
    sentAt: new Date().toISOString(),
    firstOpenedAt: null,
    lastOpenedAt: null,
    lastClickedAt: null,
    links: [],
    tags: ['External / Gmail'],
    sendMethod: 'simulator',
  };

  db.createEmail(newEmail);

  res.json({
    trackingId,
    pixelUrl,
    pixelHtml,
    emailId,
  });
});

// Wrap Custom Link
app.post('/api/tools/wrap-link', (req: Request, res: Response) => {
  const { url, trackingId } = req.body;
  if (!url || !trackingId) {
    return res.status(400).json({ error: 'url and trackingId are required.' });
  }

  const baseUrl = resolveBaseUrl(req);
  const trackedUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;

  res.json({
    originalUrl: url,
    trackedUrl,
  });
});

// Register and wrap email for Chrome Extension (Gmail)
app.post('/api/extension/register-email', (req: Request, res: Response) => {
  const {
    recipientEmail = 'Direct Recipient',
    recipientName = '',
    subject = 'Email sent via Gmail Extension',
    bodyHtml = '',
    trackOpens = true,
    trackClicks = true,
  } = req.body;

  const trackingId = `tk_ext_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  const emailId = `em_ext_${uuidv4().slice(0, 8)}`;
  const baseUrl = resolveBaseUrl(req);

  const trackedLinks: TrackedLink[] = [];
  let processedHtml = bodyHtml;

  if (trackClicks) {
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+)["']([^>]*)>(.*?)<\/a>/gi;
    let linkIndex = 1;

    processedHtml = processedHtml.replace(linkRegex, (match, url, restAttrs, innerText) => {
      const linkId = `lnk_${linkIndex++}`;
      const trackingUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;

      trackedLinks.push({
        id: linkId,
        originalUrl: url,
        trackingUrl,
        label: innerText.replace(/<[^>]*>?/gm, '').trim() || url,
        clickCount: 0,
      });

      return `<a href="${trackingUrl}" data-tracked-link="${linkId}" ${restAttrs}>${innerText}</a>`;
    });
  }

  const pixelUrl = `${baseUrl}/api/track/pixel/${trackingId}.png`;
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none !important; min-height:1px !important; width:1px !important; border:0 !important; outline:none !important;" />`;

  if (trackOpens) {
    processedHtml += `\n${pixelHtml}`;
  }

  const newEmail: TrackedEmail = {
    id: emailId,
    trackingId,
    recipientEmail,
    recipientName: recipientName || recipientEmail.split('@')[0],
    subject,
    bodyHtml: processedHtml,
    status: 'sent',
    trackOpens,
    trackClicks,
    openCount: 0,
    clickCount: 0,
    sentAt: new Date().toISOString(),
    firstOpenedAt: null,
    lastOpenedAt: null,
    lastClickedAt: null,
    links: trackedLinks,
    tags: ['Gmail Extension'],
    sendMethod: 'simulator',
  };

  db.createEmail(newEmail);
  broadcastSse('email_sent', { email: newEmail });

  res.json({
    success: true,
    trackingId,
    emailId,
    pixelUrl,
    pixelHtml,
    processedHtml,
    email: newEmail,
  });
});

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------

app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

app.post('/api/settings/test-smtp', async (req: Request, res: Response) => {
  try {
    const currentSettings = db.getSettings();
    const testConfig = { ...currentSettings, smtp: { ...currentSettings.smtp, ...req.body } };
    await verifySmtpConnection(testConfig);
    res.json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'SMTP connection failed' });
  }
});

// Seed data
app.post('/api/seed', (req: Request, res: Response) => {
  db.seedDemoData();
  broadcastSse('data_reset', {});
  res.json({ success: true, message: 'Demo data re-seeded successfully' });
});

// Export data
app.get('/api/export', (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const emails = db.getEmails();
  const events = db.getEvents(500);

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="mailmate-tracking-export.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({ emails, events }, null, 2));
  }

  // CSV format
  const csvHeaders = 'ID,TrackingId,Recipient,Subject,Status,OpenCount,ClickCount,SentAt,FirstOpenedAt,LastOpenedAt\n';
  const csvRows = emails.map((e) =>
    `"${e.id}","${e.trackingId}","${e.recipientEmail}","${e.subject.replace(/"/g, '""')}","${e.status}",${e.openCount},${e.clickCount},"${e.sentAt}","${e.firstOpenedAt || ''}","${e.lastOpenedAt || ''}"`
  ).join('\n');

  res.setHeader('Content-Disposition', 'attachment; filename="mailmate-emails.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csvHeaders + csvRows);
});

// Serve frontend static files if built
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req: Request, res: Response, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🚀 MailMate Tracker backend running at http://localhost:${PORT}`);
});
