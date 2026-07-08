# Agent notes — tommasocostanza.space

Static portfolio site (plain HTML/CSS/JS, no build step) deployed on Vercel.
3D solar-system homepage built with Three.js r128 loaded from CDN.
All site text must be in English (`lang="en"`).

## Architecture

- `index.html` — home: 3D galaxy of category planets; clicking one zooms into
  its "system" where moons are the projects of that category
- `project.html` — project detail page, driven by `?id=<project-id>`
- `explorations.html` — list page for the "Explorations" category
- `404.html` — space-themed 404 page, ALSO acts as fallback router (see below)
- `main.js` — all logic for every page (routed via `<body data-page="...">`)
- `projects/projects.json` — single source of truth for projects/categories,
  edited via the custom admin panel at `/admin` (GitHub API, token in localStorage).
  The admin derives each project's id from its name (`slugify`, collision-safe),
  so public URLs stay readable; ids are part of public URLs — do not rename
  ids of already-published projects casually
- `vercel.json` — cleanUrls + rewrites + cache headers

## Deep-link routing — DO NOT BREAK

Typed URLs like `/design` (category) and `/design/<project-id>` must work.
Two cooperating mechanisms:

1. `vercel.json` rewrites: `/:category` → `index.html`,
   `/:category/:id` → `project.html`. **In production these rewrites have NOT
   been observed to match** (cause unknown), so they are only the happy path.
2. Fallback router in `404.html`: an inline `<script>` (must stay FIRST in
   `<head>` and lightweight) sets `window.__stay404`. It fetches
   `projects.json`; if the path matches a category it redirects to
   `/?goto=<category>`, if it matches a project id to `project.html?id=<id>`.
   Real 404s resolve `__stay404 = true`.
3. `index.html`/`main.js` accept `?goto=<category>` (and a one-segment path)
   as a deep link: skip the intro, zoom straight to that category, then
   `history.replaceState` restores the pretty `/<category>` URL.

Rules that follow from this design:
- Internal navigation (moon clicks, mobile explore button, explorations cards)
  deliberately uses `/project.html?id=<id>` — reliable everywhere. Do not
  switch internal links to the pretty `/<category>/<id>` form. Once the
  project loads, `loadProjectDetail` rewrites the visible URL to
  `/<category>/<id>` via `history.replaceState` (refreshing that URL
  round-trips through the fallback router back to the project).
- `404.html` loads Three.js/GLTFLoader/`main.js` ONLY after `__stay404`
  resolves true (script injection at the bottom of `<body>`). Never add them
  back as static/deferred tags and never re-add a `Voyager.glb` preload there:
  deep-link redirects must not download heavy assets (Lighthouse regression).
- `main.js` init uses `onDocumentReady()` instead of a bare DOMContentLoaded
  listener because the 404 page injects it after the event has fired.

## Performance rules

- `assets/Voyager.glb` is ~3 MB. Only `index.html` may preload it.
  `project.html` and `explorations.html` must NOT preload or load it.
- Homepage Lighthouse baseline is ~90; measure `/` (not `/design`, which
  goes through the 404 fallback redirect by design).

## Known issues / deliberately left as-is (July 2026)

- "Contact me" button is a placeholder (`href="#"`), footer hidden on mobile —
  intentional for now
- `projects.json` currently holds throwaway test projects; one entry has
  mojibake (`ÃÂ...` = double-encoded em dash) — fix is editing the JSON text
- Dead code in `main.js` (`loadProjectsGrid`, `loadLatestProjects`,
  `buildPostitCard`, `notFoundHtml`) and post-it CSS: leftovers from a removed
  `projects.html` board page; kept on purpose for now
- Orbit counting (`globalPlanetState[cat].totalOrbits`) is computed but no
  longer displayed in the center label — keep the logic
- e2e tests (`tests/e2e`, Playwright vs `python3 -m http.server 8000`) predate
  several changes; the local server has no Vercel rewrites, so pretty-URL
  navigation cannot be tested locally without emulating them
