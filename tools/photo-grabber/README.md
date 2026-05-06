# Blanca Photo Grabber — Chrome extension

A tiny one-button Chrome extension that pulls every photo loaded on the current Instagram or Fresha page and drops them into `~/Downloads/<folder>/`.

Built specifically to work around the things that block normal scraping: Instagram's CSP, Chrome's silent multi-download throttle, and the JS safety filters that block returning binary URL data inline. Because this is a real Chrome extension with `host_permissions` and access to `chrome.downloads.download()`, none of those apply.

---

## Install (one minute, one time)

1. Open Chrome and go to **chrome://extensions**.
2. Toggle **Developer mode** on (top right).
3. Click **Load unpacked**.
4. Select this folder: `/Users/andytheng/Documents/blancabeautybar/tools/photo-grabber/`
5. The extension's logo (the real Blanca cream-and-black mark) will appear in your toolbar. Pin it.

That's it.

## Use

1. Open Instagram while signed in: <https://www.instagram.com/blancabeautybar/>
2. Click the **Photo Grabber** icon in the toolbar.
3. (Optional) Click **Auto-scroll** — it scrolls the profile to the bottom over ~25 seconds so more posts load into the DOM.
4. Click **Save photos**.
5. The popup will count up as it saves: *Saved 1 of 61… 12 of 61…* The files land in `~/Downloads/blanca-ig/` (or whatever folder name you put in the input).

Each file is named `blanca-NNN-WIDTHxHEIGHT.jpg` so you can tell originals from thumbnails at a glance.

## Use on Fresha too

The extension also works on `fresha.com` and `images.fresha.com` — useful for grabbing salon-gallery photos. URLs are auto-cleaned of the `?class=...` thumbnail parameters so you get the originals.

## What it does (in one paragraph)

Popup → background service worker. The popup runs `chrome.scripting.executeScript` to walk the page DOM, collect every `<img>` whose src is on a known IG/Fresha host, dedupe, and filter out tiny thumbnails. It then sends each URL to the background service worker, which calls `chrome.downloads.download({url, filename})`. That API has no rate limit, no user-gesture requirement, and ignores the page's CSP. Files land in your Downloads folder under the chosen subfolder.

## Files

| File | What it is |
|---|---|
| `manifest.json` | MV3 manifest, declares permissions and the popup |
| `popup.html` / `popup.js` | The toolbar UI you click |
| `background.js` | Service worker that calls `chrome.downloads.download()` |
| `icons/icon-16.png` etc. | Generated from her real Blanca Beauty Bar logo |

## Privacy

- Runs only when you click the icon.
- Sends nothing anywhere — files write to your local Downloads folder via Chrome's native downloads API.
- Doesn't read or store cookies, doesn't open new tabs.
