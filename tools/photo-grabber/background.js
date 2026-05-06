// background.js — service worker for Blanca Photo Grabber.
// Listens for download requests from the popup and saves via chrome.downloads.download.
// Runs in extension context, so no multi-download blocker and no IG CSP issues.

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.kind === 'download') {
    chrome.downloads.download(
      {
        url: msg.url,
        filename: msg.name || 'blanca/photo.jpg',
        conflictAction: 'uniquify',
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, err: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, id: downloadId });
        }
      }
    );
    return true; // keep channel open for async sendResponse
  }
});
