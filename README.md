# INNERWORLD

**Your inner life, made visible.**

A standalone daily visual self-portrait app inspired by the combination of generative art and personal reflection. No affiliation with Midjourney or Co–Star. This is an independent development MVP, separate from The Finer Things app.

## Product

Choose an aesthetic, explore a theme, approve a visual scene, and reflect on the resulting artwork. Keep appearance preferences separate from emotional fit. The user supplies the meaning and can disagree, revise, or save a piece to a private device-local Folio.

## Run

Requires Node.js 22 or later. No dependencies to install.

```sh
npm start
```

Open http://localhost:3000. Test with `npm test`.

Optional live generation: copy `.env.example` to `.env`, configure `OPENAI_API_KEY` and a supported `OPENAI_IMAGE_MODEL`, then restart. Keep the key server-side. API requests may incur provider charges. The adapter uses the OpenAI image API, not Midjourney. Without a key, the app shows a clearly labeled pre-made example and supports prompt editing, export, reflections and Folio saving.

## Current implementation

- Visual preference onboarding: medium, palette, recurring motifs.
- Theme-based editable scene prompts with explicit submission consent.
- Separate feedback for appearance and personal resonance.
- Scene revisions through new image generation, not image-to-image editing.
- Device-local IndexedDB Folio, text sharing without notes, print chapters and private JSON backup export.
- Optional symbolic reflection; no calculated astrology.
- Loopback-only development server, same-origin generation requests, request validation and a ten-attempt hourly limit per process.

## What is not implemented

This is not a production-ready app. There are no user accounts, encrypted cloud storage, cross-device sync, automatic daily generations, birth charts, transits, personalization learning, relationship sharing, payments, subscriptions, backup restoration or physical-book ordering. Free-text private notes are not analyzed. Daily content reopens a saved piece for today or the example. Live provider calls and browser end-to-end flows have not been verified.

Before public service deployment, add authentication and per-user authorization, durable quotas, abuse prevention, billing controls, secure storage and a reviewed provider-data policy. Do not expose the included local server via a public tunnel.

## Privacy

Only the scene prompt explicitly approved by the user is sent for image generation. Notes and birth details are not automatically sent. Device storage is not encrypted or account-protected; another person using the same browser profile may access it, and browser clearing or eviction can remove it. Backup exports include private notes. No analytics or background sharing.

## Repository structure

- `index.html`, `styles.css`, `app.js`: interface and device-local state
- `core.js`: theme prompts and privacy-preserving share text
- `server.js`: local static server and image-generation adapter
- `tests/core.test.js`: unit and mocked-provider HTTP tests
- `docs/PRODUCT.md`: product scope and next implementation priorities
- `assets/`: generated concept artwork

## GitHub setup

Suggested repository: `innerworld`, initially private. Description: “Your inner life, made visible. A daily generative-art and reflection app.”

The source archive contains no credentials, prior repository history, Sites credentials or private source-document identifiers. Initialize the repository on GitHub, then import these files. Do not upload a `.env` file.
