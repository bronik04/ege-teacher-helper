# Offline PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the built scoring app, expanded reference, and locally saved work usable after the first successful online visit without a network connection.

**Architecture:** Generate a manifest and versioned service worker during Vite production builds. Precache only app assets; keep assessment records in the existing browser storage, and keep FIPI PDFs as online links.

**Tech Stack:** Vite 7, `vite-plugin-pwa` 1.3.x, Workbox, React 19, Node.js build check, browser offline smoke test.

**Spec:** `docs/superpowers/specs/2026-09-27-offline-and-teacher-reference-design.md`

## Global Constraints

- Phone offline use starts after the app was fully opened on an HTTPS origin while online. `localhost` is suitable for desktop development; plain LAN HTTP is not the phone installation target.
- Precache built HTML, JS, CSS and local icons. Do not cache FIPI PDFs, user JSON imports/exports, or student records.
- Existing `localStorage` records and autosaved draft formats remain unchanged. Do not forcibly reload an open assessment during an update.
- Full scales and examples from the reference plan must be in the app bundle before offline acceptance testing.
- Hosting, accounts and cross-device synchronization are outside scope.

## File Map

- `vite.config.ts`: PWA manifest and service-worker build configuration.
- `package.json`, `package-lock.json`: PWA build dependency and validation script.
- `public/icons/`: local install icons for 192 and 512 px, plus source SVG if used.
- `scripts/check-pwa-build.mjs`: assert production artifacts exist and source PDFs are not precached.
- `README.md`: offline setup, limits and phone HTTPS requirement.

## Review Focus

1. First visit with no network: no false claim that offline is ready; Task 1 browser smoke starts online before disconnecting.
2. Offline reload followed by navigation to the reference and saved records: cached HTML loads and navigation still works; Task 1 browser smoke covers it.
3. Existing record and autosaved draft: no deletion or format change after service-worker registration or offline reload; Task 1 browser smoke covers both.
4. Reconnection while an assessment is open: no forced page reload and no lost marks; Task 1 browser smoke covers it.
5. External FIPI link without network: app remains responsive and local reference remains readable; Task 1 browser smoke covers it.

---

### Task 1: Installable Production Build and Offline Flow

**Files:** Modify `vite.config.ts`, `package.json`, `package-lock.json`, `README.md`; create `public/icons/icon-192.png`, `public/icons/icon-512.png`, `scripts/check-pwa-build.mjs` and, if useful, `public/icons/source.svg`.

**Interfaces:** Vite's production build emits `dist/manifest.webmanifest`, `dist/sw.js`, `dist/index.html` and precached JS/CSS/icons. `npm run check:pwa` executes the build-artifact assertions after `npm run build`.

- [ ] **Step 1: Write a failing build check.** In `scripts/check-pwa-build.mjs`, assert manifest name/start URL/display, 192/512 icon entries and files, service-worker presence, a cached navigation fallback and built asset references; assert `doc.fipi.ru` and assessment storage keys are absent. Add `check:pwa` in `package.json`.
- [ ] **Step 2: Confirm failure.** Run `npm run build && npm run check:pwa`; expect the check to fail because the PWA artifacts do not exist.
- [ ] **Step 3: Configure PWA.** Install `vite-plugin-pwa@^1.3.0`; add the manifest and Workbox precache via `VitePWA` in `vite.config.ts`, with update activation deferred until the current page closes. Add local, legible 192/512 icons. Keep external PDF URLs out of runtime and precache rules. Document first-online-visit and HTTPS requirements in README.
- [ ] **Step 4: Verify artifacts and offline behavior.** Run `npm test`, `npm run build`, `npm run check:pwa`, then serve `dist` with `npm run preview -- --host 127.0.0.1`. In a browser, load online, save a record and create an unsaved draft, set network offline, reload, and confirm check/reference/records/export/print all work. Reconnect with the draft open and confirm no forced reload or data loss. Repeat a 320 CSS px view.
- [ ] **Step 5: Commit.** `git add vite.config.ts package.json package-lock.json README.md public/icons scripts/check-pwa-build.mjs && git commit -m "feat: make scoring app available offline"`.
