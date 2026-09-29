// MailMate Tracker - Gmail Content Script

const DEFAULT_SERVER_URL = 'http://localhost:5000';

function getServerUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mailmateServerUrl', 'mailmateTrackDefault'], (data) => {
      resolve({
        serverUrl: (data.mailmateServerUrl || DEFAULT_SERVER_URL).replace(/\/$/, ''),
        trackDefault: data.mailmateTrackDefault !== false,
      });
    });
  });
}

function showToast(message, isSuccess = true) {
  const existing = document.getElementById('mailmate-toast-container');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'mailmate-toast-container';
  toast.className = 'mailmate-toast';
  toast.innerHTML = `
    <span style="font-size: 16px;">${isSuccess ? '⚡' : '⚠️'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Attach MailMate button to Gmail compose windows
async function attachToComposeWindow(composeWindow) {
  if (composeWindow.dataset.mailmateAttached === 'true') return;

  // Locate the toolbar row containing the Send button
  const sendBtn =
    composeWindow.querySelector('div[role="button"][data-tooltip*="Send"]') ||
    composeWindow.querySelector('div[role="button"][aria-label*="Send"]') ||
    composeWindow.querySelector('.aoO');

  if (!sendBtn) return;

  const toolbarParent = sendBtn.closest('tr') || sendBtn.parentElement;
  if (!toolbarParent) return;

  composeWindow.dataset.mailmateAttached = 'true';

  const { trackDefault } = await getServerUrl();

  // Create Toggle Button
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `mailmate-compose-btn ${trackDefault ? 'active' : ''}`;
  btn.innerHTML = `
    <span class="mailmate-dot"></span>
    <span class="mailmate-label">${trackDefault ? 'Tracked with MailMate' : 'Tracking Off'}</span>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isNowActive);
    btn.querySelector('.mailmate-label').textContent = isNowActive
      ? 'Tracked with MailMate'
      : 'Tracking Off';
  });

  // Insert after the send button
  sendBtn.parentElement.appendChild(btn);

  // Intercept Send action
  const handleSend = async (e) => {
    if (!btn.classList.contains('active')) return; // Tracking disabled for this email

    const bodyEl =
      composeWindow.querySelector('div[aria-label*="Message Body"]') ||
      composeWindow.querySelector('div[role="textbox"]');

    if (!bodyEl) return;

    // Check if pixel already injected to prevent double-injection
    if (bodyEl.innerHTML.includes('/api/track/pixel/')) return;

    const { serverUrl } = await getServerUrl();

    // Extract recipient
    const recipientChips = composeWindow.querySelectorAll('span[email], div[email]');
    let recipientEmail = 'Recipient';
    if (recipientChips.length > 0) {
      recipientEmail = recipientChips[0].getAttribute('email') || recipientChips[0].textContent.trim();
    } else {
      const toField = composeWindow.querySelector('input[name="to"], div[aria-label="To"] input');
      if (toField && toField.value) recipientEmail = toField.value.trim();
    }

    // Extract subject
    const subjectField = composeWindow.querySelector('input[name="subjectbox"]');
    const subject = subjectField ? subjectField.value.trim() : 'Email via Gmail';

    try {
      // Call backend to register email and get tracking tags
      const response = await fetch(`${serverUrl}/api/extension/register-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          subject,
          bodyHtml: bodyEl.innerHTML,
          trackOpens: true,
          trackClicks: true,
        }),
      });

      if (!response.ok) throw new Error('MailMate server returned error');

      const data = await response.json();
      if (data.processedHtml) {
        bodyEl.innerHTML = data.processedHtml;
      }

      showToast(`MailMate: Tracking active for "${subject}" (${recipientEmail})!`);
    } catch (err) {
      console.error('[MailMate] Failed to inject tracker:', err);
      showToast('MailMate Server unreachable. Ensure server is online.', false);
    }
  };

  // Add click listener to send button
  sendBtn.addEventListener('click', handleSend, true);
}

// Observe Gmail DOM for newly opened compose dialogs
const observer = new MutationObserver(() => {
  const composeDialogs = document.querySelectorAll('div[role="dialog"], .M9, .AD');
  for (const dialog of composeDialogs) {
    attachToComposeWindow(dialog);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

console.log('🚀 MailMate Gmail Tracker extension active on mail.google.com');
