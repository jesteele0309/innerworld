# Changelog

## v2 — the daily loop

A rebuild around **Notice → Reflect → Make → Keep**, replacing the
theme-and-prompt studio of v1.

### What the app does now

- **A daily question** instead of a theme picker. Eight authored questions
  cycle by date, each with a pigment of the day and three ways in: **Read**
  (illustrated sections), **Drift** (a guided sequence read slowly) and
  **Wander** (a walk done outside). Each way keeps one accent colour from the
  Today tile through to its own screen.
- **Reflect** is a private screen on its own indigo ground, with a lock note
  that says only you see this. The writing autosaves as you type.
- **Make** derives the palette from the day's question and the feeling words,
  and states which colour came from where. Mark style — Wash, Grain, Line —
  is a separate, taste-only choice.
- **An on-device painter.** The portrait is drawn with Canvas 2D from a seeded
  plan, so the app works with no key, no network and no provider. The same
  day, palette, mark and variant always redraw the same picture; Repaint moves
  to the next variation. A painting model is now opt-in rather than required.
- **My World** holds chapters: a day grid, a colour-proportion bar over
  everything kept, renaming, printing and a private backup. Days with nothing
  kept are drawn as quiet days; today is drawn as still open.
- **Explore** and **Practice** are real screens, so no tab is a dead end.

### Fixes carried over from the v1 audit

| Was | Now |
| --- | --- |
| Source authored as minified one-liners (`app.js` 14.5 KB in 26 lines, longest line 2,453 chars) | Readable modules under `src/`, formatted and commented |
| Server bound loopback *and* rejected every non-localhost `Host`, so the app could not be opened on a phone | `--host` / `INNERWORLD_HOST=lan` answers on private addresses; public hostnames still refused |
| Reflections lost on reload — the field was labelled "kept on this device" but only held in memory | Autosave, a serialised write queue, a synchronous `localStorage` mirror, and a flush on `pagehide` |
| `look`/`fit` feedback collected and never read by anything | Feeling words choose the palette, and the Make screen explains the derivation |
| `alt` was the full 404-character generation prompt, negative-prompt boilerplate included | A short human description; the prompt lives in "Why this?" |
| Only `b64_json` provider responses accepted; a URL response reported "no image was returned" | Both shapes handled; an unusable response names the configured model |
| Whole Folio in one IndexedDB key as base64 data URLs — every save rewrote every image | Per-piece Blobs in their own store, metadata separate |
| 2.23 MB PNG for a 1122×1402 photograph | Converted to WebP, 86 KB (26× smaller). The PNG remains in history at `f6069f5` |
| Piece ids interpolated unescaped into `data-*` attributes | Escaped, ahead of backup restore landing |
| Saving the example on separate days created duplicate entries | There is no example piece; each day has one record |
| No Content-Security-Policy on a UI built from `innerHTML` | `default-src 'none'`, `script-src 'self'`, `style-src 'self'` — no `unsafe-inline` |
| 7 tests, none covering `app.js` (70.6% of the JS) | 41 unit tests plus a 16-step browser check of the whole loop |

### Found and fixed while building

These came out of running the app in a real browser, not from reading it:

- The entrance animation re-ran on every in-place re-render, so paging through
  Read moved the controls under the reader's finger. It now runs on a change of
  screen only.
- Previous and Next shifted between sections because body text length varied.
  A paged screen now scrolls its text and pins its controls.
- A feeling word tapped immediately before navigation could be lost: the
  IndexedDB write had not committed. Writes are queued, mirrored synchronously
  and flushed on hide.
- Dynamic pigment colours were parsed inline styles, which the new CSP blocks.
  They are applied through CSSOM instead, so the policy keeps both `script-src`
  and `style-src` at `'self'`.
- Two pigments failed contrast against any label colour (viridian at 4.42:1,
  malachite at 4.08:1). Both darkened until a label clears AA; a test now holds
  every pigment to it.

### Still not implemented

Accounts, cloud storage, sync, backup **restore**, narrated audio, shared
chapters, printed books, payments. No astrology or prediction of any kind.
Artwork credits in Read are placeholders until real public-domain images are
chosen and verified.

### Breaking

Storage moved to a new database (`innerworld`, version 2). v1 Folio entries in
the old `innerworld-v1` database are not migrated; there is no import path yet.
Anyone with v1 data should export a backup from v1 before upgrading.

The generation endpoint moved from `/api/generate` to `/api/paint`.
