# Blanca Beauty Bar — preview site

Static, single-file design preview for [Blanca Beauty Bar](https://www.fresha.com/a/blanca-beauty-bar-london-392-clarence-street-zkvszbqf), a luxury Russian-manicure / laser / lash studio at 392 Clarence Street, London ON.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or just double-click `index.html`.

## Stack

- One static `index.html` — markup, inline CSS, inline JS
- Tailwind via CDN
- [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll
- Fonts: Fraunces + Inter (Google Fonts)

## Sections

1. Hero — editorial display + her real storefront photo
2. Trust bar
3. Chapter 01 — The Russian E-File
4. Chapter 02 — Six-card service menu (per-card Book on Fresha)
5. Chapter 03 — Laser, "best in city" specialty
6. Chapter 04 — Why Blanca (3 reasons)
7. Chapter 05 — Studio (4 real photos)
8. Chapter 06 — Visit (address, hours, parking, map)
9. Chapter 07 — Reviews
10. Final CTA + Footer

## Design system (locked to her real brand)

Pulled from her actual storefront, interior, and Instagram logo:

- `paper` `#FAFAF7` — primary background
- `paperwarm` `#F4F0E8` — section warmth
- `cream` `#EDE5D3` — chair upholstery / soft surfaces
- `ink` `#0F0E0C` — body text + Fresha-aligned primary CTA
- `gold` `#B89248` — accent (matches her storefront signage)
- `stone` `#7A6F5F` — tertiary text

## Photography status

| Asset | Source | Status |
|---|---|---|
| Storefront, interior, hand-soap, espresso bar | Pulled from her **public Fresha gallery** | ✅ Real |
| Logo (header) | Pulled from her **Instagram profile** | ✅ Real |
| Service-card images (6) | — | ⛔ Typographic placeholders |
| Hero / Russian section / Studio gallery | — | ✅ Using her real photos |

## What's still needed from the client

Instagram blocks programmatic scraping (CSP + download blocks); only her profile-pic logo could be retrieved. To finish the preview with all real photography:

- 8–12 nail close-ups (Russian E-File examples in different shades / lengths)
- 2–3 laser-treatment shots (clinical / dewy / non-clinical)
- 1–2 lash lift before/after
- Headshots of B and Maryam (optional)

Drop them into `/media/client/` and I'll wire them in. For any animated artwork moments we'd use **fal.ai Flux Kontext** image-to-video (Option C — approved) on the real stills.

## Booking

All booking CTAs route to her live Fresha listing:
`https://www.fresha.com/a/blanca-beauty-bar-london-392-clarence-street-zkvszbqf`

The website does not handle bookings, payments, or account creation — Fresha is the source of truth.
