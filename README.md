# 📬 MailMate Tracker — Real-Time Email Tracking & Telemetry System

A fully-functional, production-grade email tracking system inspired by Lovable-style SaaS applications. **MailMate Tracker** provides stealth 1x1 tracking pixel injection, automated hyperlink click wrapping and redirection, real-time Server-Sent Events (SSE) telemetry, instant Web Audio synthesizer chimes on recipient actions, and an **Interactive Recipient Mailbox Sandbox** for instant end-to-end testing without external mail servers.

---

## 🌟 Key Features

1. **Invisible 1x1 Stealth Tracking Pixels (`/api/track/pixel/:id.png`)**:
   - Zero-footprint 43-byte transparent GIF served with anti-caching HTTP headers (`no-store, no-cache, max-age=0, must-revalidate`).
   - Detects recipient IP, resolves approximate geolocation (City, Country, Flag).
   - User-Agent parser identifies device type (Desktop, Mobile, Tablet), client (Chrome, Apple Mail Privacy Protection, Outlook, Gmail Image Proxy), and operating system.
   - Logs unique and total opens, timestamps for first and latest reads.

2. **Automated Hyperlink Wrapping & Redirection (`/api/track/click/:id?url=...`)**:
   - Automatically parses all `<a href="...">` tags in composed emails and wraps them with safe redirect URLs.
   - Accurately tracks per-link click metrics and click heat.
   - Issues clean HTTP 302 redirects to destination targets.

3. **Real-Time Telemetry via Server-Sent Events (SSE)**:
   - Streams live `email_opened` and `email_clicked` events directly to the UI.
   - Includes real-time floating toast notifications and animated pulse heartbeat indicators.
   - Features a built-in Web Audio API synthesizer that plays subtle, high-tech chimes on reads and clicks (zero external asset dependencies).

4. **Interactive Recipient Mailbox Sandbox (Virtual Email Client)**:
   - A realistic virtual email client simulating the recipient's perspective.
   - Allows users to view incoming messages, toggle privacy image loading ("Display Images" triggers the open pixel in real-time!), and click links to test redirects.
   - Watch your MailMate dashboard light up live in side-by-side tabs!

5. **Standalone Pixel & Link Generator Tool**:
   - For users who prefer composing directly in Gmail, Outlook, or Apple Mail.
   - Generates one-click copyable 1x1 Image URLs, HTML embed snippets, and tracked redirect links.
   - Includes clear step-by-step guides for Gmail and Outlook users.

6. **Executive Dashboard & Visual Analytics (Recharts)**:
   - KPI Cards: Total Sent, Total Opens, Unique Opens, Open Rate %, Click Rate %, Avg Time to First Read.
   - Area chart showing daily open and click activity.
   - Donut chart with device breakdown (Desktop vs Mobile vs Tablet).
   - Email client distribution and global geolocation leaderboards.

7. **Email Composer & Audit Trail**:
   - Built-in templates: Product Demo, Investor Memo, Sales Proposal.
   - Full chronological audit trail drawer for every email (Sent ➡️ 1st Open ➡️ Link Clicked ➡️ Re-read).
   - Real SMTP server support (via Nodemailer) with credential testing, or instant Sandbox simulation.
   - Webhook integration (dispatching POST payloads to Slack, Zapier, etc.).
   - Data export in CSV and JSON formats.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Application
Run both backend and frontend together:
```bash
npm run dev
```

Or run the production server directly:
```bash
npm run build
npm start
```
The application will be live at:
👉 **http://localhost:5000** (Full-stack server with frontend static bundle)
👉 **http://localhost:5173** (Vite frontend with hot reload during dev)

---

## 🔌 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/track/pixel/:trackingId.png` | `GET` | Serves 1x1 transparent GIF & records open telemetry |
| `/api/track/click/:trackingId?url=...` | `GET` | Records link click & redirects (HTTP 302) to destination |
| `/api/events/stream` | `GET` | Server-Sent Events (SSE) real-time event pipeline |
| `/api/emails` | `GET` | List all tracked emails with statuses & metrics |
| `/api/emails` | `POST` | Create & dispatch tracked email (Simulator or SMTP) |
| `/api/emails/:id` | `GET` | Get single email + complete chronological event trail |
| `/api/emails/:id` | `DELETE` | Delete email and associated events |
| `/api/emails/:id/simulate-open` | `POST` | Trigger simulated open event for testing |
| `/api/emails/:id/simulate-click` | `POST` | Trigger simulated click event for testing |
| `/api/analytics` | `GET` | Aggregated analytics & chart breakdown data |
| `/api/events` | `GET` | Recent activity stream (last 50 events) |
| `/api/tools/generate-pixel` | `POST` | Generate standalone pixel snippet for Gmail/Outlook |
| `/api/tools/wrap-link` | `POST` | Wrap any destination URL into a tracked link |
| `/api/settings` | `GET / POST` | Get or update app settings (SMTP, Webhooks) |
| `/api/settings/test-smtp` | `POST` | Test SMTP credentials |
| `/api/seed` | `POST` | Re-seed realistic sample data |
| `/api/export?format=csv\|json` | `GET` | Download tracking logs in CSV or JSON |

---

## 🧪 Testing the Flow in 30 Seconds

1. Open **http://localhost:5000** in your browser.
2. Click **"+ Track Email"** in the top navigation bar and send a message using the default template.
3. Switch to the **"Recipient Sandbox"** tab in the navbar.
4. Click on the newly received email.
5. Click **"Display Images"** — listen to the crystal sound chime and observe your Open counter increment instantly!
6. Click any hyperlink in the message — watch the Click counter and real-time live toast notify you immediately.
7. Return to the **"Dashboard"** or **"Live Feed"** to view the updated charts, device breakdown, and location logs.

---

## 🌍 Going Live: How to Track Your Real Gmail

To track real emails sent through Gmail, your tracking pixels and redirect links must be accessible over a **public HTTPS URL** (because Google's image servers and recipient phones cannot connect to `localhost`).

### Step 1: Give your Server a Public HTTPS URL

Choose either quick testing or permanent hosting:

* **Option A: Quick Public Tunnel (Instant)**
  Open a new terminal and run:
  ```powershell
  ssh -p 443 -R0:localhost:5000 a.pinggy.io
  ```
  *(Or if you use Ngrok: `ngrok http 5000`)*
  Copy the HTTPS URL provided (e.g., `https://xyz.a.pinggy.link`).

* **Option B: 100% Free 24/7 Cloud Hosting (Render / Railway)**
  1. Push this folder to a GitHub repository.
  2. Go to [Render.com](https://render.com) ➔ **New Web Service** ➔ Select your repository.
  3. Render will auto-detect `render.yaml` or use:
     * Build Command: `npm install && npm run build`
     * Start Command: `npm start`
  4. You will get a permanent 24/7 HTTPS URL (e.g. `https://mailmate-tracker.onrender.com`).

Then, open **MailMate Settings** (`/settings`) and paste this URL into **"Tracking Server Base URL"**.

---

### Step 2: Track Emails in Gmail

You have 3 easy ways to track emails:

#### Method A: MailMate Chrome Extension for Gmail (Recommended)
1. Open Google Chrome and go to `chrome://extensions/`.
2. Toggle on **"Developer mode"** in the top-right corner.
3. Click **"Load unpacked"** and select the [`extension/`](file:///f:/Antigravity/extension/) folder inside this project.
4. Click the MailMate extension icon in Chrome's toolbar and enter your Public Server URL.
5. Open [mail.google.com](https://mail.google.com) and click **Compose**.
6. You will see a **"⚡ Tracked with MailMate"** button right next to the blue Send button!
7. Every email you send will automatically have the invisible pixel and click tracking links attached.

#### Method B: Send directly from MailMate with Gmail SMTP
1. Open MailMate ➔ **Settings** ➔ **Custom SMTP Server**.
2. Enter:
   * **Host:** `smtp.gmail.com`
   * **Port:** `587` (or `465`)
   * **Username:** `your-email@gmail.com`
   * **Password:** 16-character Google App Password (generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
3. In MailMate's Compose modal, select **"Real SMTP"** to dispatch real tracked emails from your Gmail account!

#### Method C: 1-Click Pixel Generator
1. In MailMate, navigate to **Pixel Generator**.
2. Enter your recipient and subject, click **Generate 1x1 Stealth Pixel**.
3. Copy the URL or HTML code and insert it into Gmail's compose window.

