# HEINEKEN Ethiopia — E-Boiler Unveiling RSVP (v2)

A warm, editorial RSVP site for the unveiling of HEINEKEN Ethiopia's first-ever
E-Boiler at Kilinto Brewery, Tuesday July 28, 2026.

Static site — no build step, no dependencies.

## Files
- `index.html` — the page
- `styles.css` — all styling (responsive at 860px)
- `script.js` — RSVP form logic (validation + accept/decline confirmation)
- `assets/heineken-ethiopia-logo.png` — logo
- `vercel.json` — deploy config

## Deploy to Vercel
1. vercel.com -> Add New -> Project
2. Import this repo (or drag this folder in)
3. Framework preset: **Other**, Root Directory: **/** (or `site` if kept nested)
4. Deploy.

The RSVP form is front-end only — submissions are validated and confirmed
on-screen but not persisted anywhere yet.
