# INNERWORLD

**Your inner life, made visible.**

A daily question, a colour, and a small painting of the day you actually had.
Independent development MVP. No affiliation with any other app.

---

## The daily loop

**Notice → Reflect → Make → Keep.**

1. **Notice.** One question arrives each day — *Why does autumn light feel
   different?* — with a pigment of the day and three ways in: something to
   **Read**, a **Drift** sequence to read slowly, and a **Wander** to do
   outside.
2. **Reflect.** One prompt, one private answer, and up to two feeling words.
   The writing is saved as you type and never leaves the device.
3. **Make.** Those feeling words choose the pigments you paint with, and the
   screen says in plain words which colour came from where. You pick the mark
   style; the app paints.
4. **Keep.** The portrait goes into a chapter you can name. Days with nothing
   kept are drawn as quiet days. Nothing counts a run.

## Run it

Node 22 or later. No dependencies to install.

```sh
npm start          # http://localhost:3000
npm start -- --host  # also on your LAN, so you can open it on a phone
npm test           # 41 unit and server tests
```

Painting works immediately, with no key and no network: the portrait is drawn
on your device from your palette and mark style.

To paint with an image model instead, copy `.env.example` to `.env`, set
`OPENAI_API_KEY` and `OPENAI_IMAGE_MODEL`, and restart. The key stays on the
server. Provider calls cost money. On-device painting remains the default and
the fallback.

## What is made by a person, and what is not

Every question, essay, drift sequence and walk in this repository is written by
hand, in `src/content.js`. Nothing you read or hear is generated.

The painting is the one generated thing, and the app says so where you make it.
By default it is drawn on your device. If a model is configured, it receives
the question, the palette and the mark style — never your reflection. The
server enforces that with an allow-list of exactly one field, and a test holds
it there.

## Privacy

- Reflections, feeling words, preferences and paintings live in this browser,
  on this device. No account, no sync, no analytics, no notifications.
- Device storage is not encrypted or password-protected. Anyone using this
  browser profile can reach it, and clearing browser data removes it.
- **Sharing** sends the title and the day's question. Never your reflection,
  never your feeling words.
- **Printing** a chapter includes titles and questions, not reflections.
- **A backup export does include your reflections in plain text.** The button
  says so before it writes the file.

## What is implemented

- The full daily loop, offline, with no key.
- Eight authored questions with reading, drift and wander content, cycling by
  date. Everyone gets the same question on the same day; nothing is inferred
  about anyone.
- A seeded on-device painter. The same day, palette and mark always redraw the
  same picture, so a portrait you kept is never lost to randomness; Repaint
  moves to the next variation.
- Chapters with a day grid, a colour-proportion bar, renaming, printing and a
  private JSON backup.
- Per-piece Blob storage, so saving one portrait writes one record and one
  image rather than rewriting the whole collection.
- A strict Content-Security-Policy, a path-traversal-safe static server, and a
  LAN mode for testing on a real phone.

## What is not implemented

No accounts, cloud storage, cross-device sync or backup **restore** (export
only). No narrated audio for Drift — it is written to be read slowly. No
shared chapters, printed books, payments or subscriptions. No birth charts,
astrology or prediction of any kind. No streaks, no reminders, no analytics.

The artwork credit lines in Read are placeholders: a real public-domain image
and its accession details have not been chosen yet, and a wrong credit would be
worse than a visible blank.

Before this is served to anyone else, it needs authentication, per-user
authorisation, durable quotas, abuse prevention, billing controls and a
reviewed provider-data policy. Do not expose the included server publicly.

## Repository

```
index.html            shell and the privacy dialog
styles.css            one token set; the Reflect screen swaps the ground
src/
  app.js              state, router, actions
  core.js             dates, colour maths, palette derivation, sharing
  content.js          every authored question, essay, drift and walk
  pigments.js         pigments, feeling→pigment map, ways, mark styles
  painter.js          the seeded painter (pure plan + canvas renderer)
  store.js            IndexedDB: metadata, per-piece blobs
  ui.js               shared chrome, icons, tab bar
  views/              today, read, reflect, make, portrait, world, explore, practice
server.js             static server, CSP, host allow-list, model adapter
assets/               original concept artwork, kept for reference (unused by the app)
tests/                core, painter and server tests, plus the browser check
docs/PRODUCT.md       product scope and what comes next
docs/CHANGELOG.md     what changed in this version, and why
```

Type is set in system stacks rather than fetched from a font host, because the
app claims nothing leaves your machine and that should stay true on every load.
