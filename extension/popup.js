// MailMate Popup script

document.addEventListener('DOMContentLoaded', async () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const trackDefaultInput = document.getElementById('trackDefault');
  const saveBtn = document.getElementById('saveBtn');
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const savedMsg = document.getElementById('savedMsg');

  // Load saved settings
  chrome.storage.local.get(['mailmateServerUrl', 'mailmateTrackDefault'], async (data) => {
    const url = data.mailmateServerUrl || 'http://localhost:5000';
    serverUrlInput.value = url;
    trackDefaultInput.checked = data.mailmateTrackDefault !== false;
    checkServerHealth(url);
  });

  async function checkServerHealth(url) {
    try {
      const cleanUrl = url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/api/analytics`, { method: 'GET' });
      if (res.ok) {
        statusBadge.className = 'status-badge online';
        statusText.textContent = 'Server Online';
      } else {
        throw new Error('Not OK');
      }
    } catch {
      statusBadge.className = 'status-badge offline';
      statusText.textContent = 'Server Offline';
    }
  }

  saveBtn.addEventListener('click', () => {
    const url = serverUrlInput.value.trim() || 'http://localhost:5000';
    const trackDefault = trackDefaultInput.checked;

    chrome.storage.local.set(
      {
        mailmateServerUrl: url,
        mailmateTrackDefault: trackDefault,
      },
      () => {
        savedMsg.style.display = 'block';
        setTimeout(() => {
          savedMsg.style.display = 'none';
        }, 2000);
        checkServerHealth(url);
      }
    );
  });

  openDashboardBtn.addEventListener('click', () => {
    const url = serverUrlInput.value.trim() || 'http://localhost:5000';
    window.open(url, '_blank');
  });
});
