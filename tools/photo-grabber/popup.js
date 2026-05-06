// popup.js — UI for the Blanca Photo Grabber extension.
// Talks to background.js via chrome.runtime.sendMessage to scrape and download.

const $ = (id) => document.getElementById(id);

function setStatus(html, cls = '') {
  const el = $('status');
  el.innerHTML = `<span class="${cls}">${html}</span>`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureSupportedTab(tab) {
  if (!tab || !tab.url) return false;
  return /^https:\/\/(www\.)?(instagram\.com|fresha\.com|images\.fresha\.com)/.test(tab.url);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Restore saved folder
  const { folder } = await chrome.storage.local.get('folder');
  if (folder) $('folder').value = folder;

  $('folder').addEventListener('change', () =>
    chrome.storage.local.set({ folder: $('folder').value || 'blanca-ig' })
  );

  $('btnScroll').addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!(await ensureSupportedTab(tab))) {
      setStatus('Open Instagram or Fresha first.', 'err');
      return;
    }
    setStatus('Scrolling — loading more posts…', 'gold');
    $('btnScroll').disabled = true;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        let last = -1;
        for (let i = 0; i < 25; i++) {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((r) => setTimeout(r, 900));
          const h = document.body.scrollHeight;
          if (h === last) break;
          last = h;
        }
        // back to top so the user can see what was loaded
        window.scrollTo(0, 0);
      },
    });

    $('btnScroll').disabled = false;
    setStatus('Done. Now click <b>Save photos</b>.', 'ok');
  });

  $('btnGo').addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!(await ensureSupportedTab(tab))) {
      setStatus('Open Instagram or Fresha first.', 'err');
      return;
    }
    const folder = ($('folder').value || 'blanca-ig').replace(/[^a-z0-9_\-]/gi, '');
    const optHd = $('optHd').checked;
    const optSkipPin = $('optSkipPin').checked;

    setStatus('Scraping image URLs from page…', 'gold');
    $('btnGo').disabled = true;

    // 1. Collect URLs from the page DOM
    let urls;
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [{ optHd, optSkipPin }],
        func: ({ optHd, optSkipPin }) => {
          const all = [...document.querySelectorAll('img')];
          const seen = new Set();
          const out = [];
          for (const im of all) {
            // Skip pinned indicator parent
            if (optSkipPin) {
              const closest = im.closest('a');
              if (closest && closest.querySelector('svg[aria-label="Pinned post icon"]')) continue;
            }
            // Filter to IG/Fresha image hosts only
            const isIg = /(cdninstagram|fbcdn)\.com|fbcdn\.net/.test(im.src);
            const isFresha = /images\.fresha\.com/.test(im.src);
            if (!isIg && !isFresha) continue;
            // Filter out tiny thumbnails (avatars, story rings)
            if (im.naturalWidth && optHd && im.naturalWidth < 480) continue;
            if (seen.has(im.src)) continue;
            seen.add(im.src);
            out.push({
              url: im.src,
              w: im.naturalWidth || 0,
              h: im.naturalHeight || 0,
              alt: (im.alt || '').slice(0, 60),
            });
          }
          // Also try Fresha original URLs (strip ?class=)
          const cleaned = out.map((x) => {
            if (/images\.fresha\.com/.test(x.url)) {
              const base = x.url.split('?')[0];
              return { ...x, url: base };
            }
            return x;
          });
          return cleaned;
        },
      });
      urls = result?.[0]?.result || [];
    } catch (e) {
      setStatus(`Scraping error: ${e.message}`, 'err');
      $('btnGo').disabled = false;
      return;
    }

    if (!urls.length) {
      setStatus('No images found on this page. Try scrolling first.', 'err');
      $('btnGo').disabled = false;
      return;
    }

    setStatus(`Found <b>${urls.length}</b> images. Downloading to <b>~/Downloads/${folder}/</b> …`, 'gold');

    // 2. Tell background to download each — chrome.downloads.download in MV3 service worker
    let saved = 0,
      errs = 0;
    for (let i = 0; i < urls.length; i++) {
      const { url, w, h } = urls[i];
      const name = `${folder}/blanca-${String(i + 1).padStart(3, '0')}-${w || 'x'}x${h || 'x'}.jpg`;
      try {
        await chrome.runtime.sendMessage({ kind: 'download', url, name });
        saved++;
      } catch (e) {
        errs++;
      }
      if (i % 4 === 0 || i === urls.length - 1) {
        setStatus(`Saved <b>${saved}</b> of ${urls.length}${errs ? ` · errors ${errs}` : ''}`, 'gold');
      }
    }

    setStatus(
      `Done — saved <b>${saved}</b> file${saved === 1 ? '' : 's'} to <b>~/Downloads/${folder}/</b>${
        errs ? ` · ${errs} failed` : ''
      }`,
      saved ? 'ok' : 'err'
    );
    $('btnGo').disabled = false;
  });
});
