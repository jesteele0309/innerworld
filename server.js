// Local development server for INNERWORLD.
//
// It serves the app and, when a key is configured, proxies painting requests
// so the provider key never reaches the browser. It is a development server:
// there is no authentication, no per-user authorisation and no durable quota.
// Do not expose it to the internet.
//
//   node server.js                 loopback only (default)
//   node server.js --host          also answer on this machine's LAN address,
//                                  so you can open the app on a phone
//
// The LAN mode exists because the app has to be tested on a real phone, and
// the previous version made that impossible: it bound loopback *and* rejected
// every Host header that was not localhost.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = path.dirname(fileURLToPath(import.meta.url));

// Only these paths are reachable. Everything else — .env, server.js,
// package.json, tests — is not served at all.
const PUBLIC_FILES = new Set(['/index.html', '/styles.css', '/favicon.svg']);
const PUBLIC_DIRS = ['/src/', '/assets/'];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

// Everything the app needs is same-origin, so the policy can be strict.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
// Private ranges only, even in LAN mode: a public hostname pointed at this
// machine is still refused, which keeps DNS rebinding out.
const PRIVATE_HOST =
  /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|[a-z0-9-]+\.local)(:\d+)?$/i;

const MAX_PROMPT_CHARS = 2500;
const MAX_BODY_BYTES = 16_000;
const MAX_IMAGE_BYTES = 12_000_000;
const HOURLY_LIMIT = 10;
const PROVIDER_TIMEOUT_MS = 210_000;

export function createApp({
  key = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  providerFetch = fetch,
  openToLan = false,
  hourlyLimit = HOURLY_LIMIT,
} = {}) {
  let painting = false;
  let attempts = [];

  return http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Security-Policy': CSP,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(body));
    };

    const host = req.headers.host || '';
    const allowHost = openToLan ? PRIVATE_HOST : LOOPBACK_HOST;
    if (!allowHost.test(host)) {
      send(403, {
        error: openToLan
          ? 'This development server answers only on localhost and private network addresses.'
          : 'Local access only. Restart with --host to reach this server from another device on your network.',
      });
      return;
    }

    let route;
    try {
      route = new URL(req.url, `http://${host}`).pathname;
    } catch {
      send(400, { error: 'Could not read that request path.' });
      return;
    }

    if (req.method === 'GET' && route === '/api/status') {
      send(200, { configured: Boolean(key), model: key ? model : null, painter: key ? 'model' : 'local' });
      return;
    }

    if (route === '/api/paint') {
      if (req.method !== 'POST') {
        send(405, { error: 'Send a POST to request a painting.' });
        return;
      }
      await handlePaint(req, send, {
        host,
        key,
        model,
        providerFetch,
        hourlyLimit,
        isPainting: () => painting,
        setPainting: (value) => {
          painting = value;
        },
        attempts,
        setAttempts: (next) => {
          attempts = next;
        },
      });
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(405, { error: 'Method not allowed.' });
      return;
    }

    await serveFile(route, res, send);
  });
}

async function serveFile(route, res, send) {
  const requested = route === '/' ? '/index.html' : route;
  const isPublic =
    PUBLIC_FILES.has(requested) || PUBLIC_DIRS.some((dir) => requested.startsWith(dir));
  if (!isPublic) {
    send(404, { error: 'Not found.' });
    return;
  }

  const type = CONTENT_TYPES[path.extname(requested)];
  if (!type) {
    send(404, { error: 'Not found.' });
    return;
  }

  // Resolve and confirm the result is still inside the project, so ".." in a
  // path cannot climb out of it.
  const resolved = path.resolve(root, `.${requested}`);
  if (resolved !== path.normalize(resolved) || !resolved.startsWith(root + path.sep)) {
    send(404, { error: 'Not found.' });
    return;
  }

  try {
    const info = await stat(resolved);
    if (!info.isFile()) {
      send(404, { error: 'Not found.' });
      return;
    }
    const bytes = await readFile(resolved);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    });
    res.end(bytes);
  } catch {
    send(404, { error: 'Not found.' });
  }
}

async function handlePaint(req, send, ctx) {
  const { host, key, model, providerFetch, hourlyLimit } = ctx;

  if (req.headers.origin !== `http://${host}` || req.headers['content-type'] !== 'application/json') {
    send(403, { error: 'Same-origin JSON requests only.' });
    return;
  }
  if (!key) {
    send(503, {
      error: 'No painting model is configured. INNERWORLD paints on your device instead — nothing is sent anywhere.',
    });
    return;
  }

  const now = Date.now();
  ctx.setAttempts(ctx.attempts.filter((at) => now - at < 3_600_000));
  if (ctx.isPainting()) {
    send(429, { error: 'A painting is already being made. Wait for it to finish.' });
    return;
  }
  if (ctx.attempts.length >= hourlyLimit) {
    send(429, {
      error: `This development server allows ${hourlyLimit} paintings an hour. Try later, or paint on your device instead.`,
    });
    return;
  }

  let body = '';
  try {
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        send(413, { error: 'That request is too large.' });
        return;
      }
    }
  } catch {
    send(400, { error: 'Could not read that request.' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    send(400, { error: 'Invalid JSON.' });
    return;
  }

  // An allow-list of exactly one field. Anything else — a reflection, a
  // feeling word, a title — is refused rather than quietly forwarded.
  const keys = Object.keys(payload);
  if (
    typeof payload.prompt !== 'string' ||
    !payload.prompt.trim() ||
    payload.prompt.length > MAX_PROMPT_CHARS ||
    keys.some((k) => k !== 'prompt')
  ) {
    send(400, {
      error: `Send only a scene prompt, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters.`,
    });
    return;
  }

  ctx.setPainting(true);
  ctx.setAttempts([...ctx.attempts, now]);
  try {
    const response = await providerFetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: payload.prompt, n: 1, size: '1024x1536', quality: 'medium' }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!response.ok) {
      send(502, {
        error: 'The painting model refused this request. Check account access, billing and limits. Your words were not sent.',
      });
      return;
    }

    const result = await response.json();
    const image = await readProviderImage(result, providerFetch);
    if (!image) {
      send(502, {
        error: `No image came back. If OPENAI_IMAGE_MODEL is set to "${model}", confirm it is an image model that this adapter supports.`,
      });
      return;
    }
    send(200, { image });
  } catch {
    send(502, { error: 'The painting model timed out or is unavailable. Nothing was lost.' });
  } finally {
    ctx.setPainting(false);
  }
}

// Image models disagree about how they hand back a picture: some inline
// base64, others return a URL. The previous version accepted only base64 and
// reported anything else as "no image was returned", which read as an outage
// rather than a configuration mismatch.
async function readProviderImage(result, providerFetch) {
  const first = result && result.data && result.data[0];
  if (!first) return null;

  if (typeof first.b64_json === 'string' && first.b64_json.length) {
    return `data:image/png;base64,${first.b64_json}`;
  }

  if (typeof first.url === 'string' && /^https:\/\//.test(first.url)) {
    try {
      const response = await providerFetch(first.url, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
      const type = response.headers.get('content-type') || 'image/png';
      if (!type.startsWith('image/')) return null;
      return `data:${type};base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }

  return null;
}

export function lanAddress() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return null;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const openToLan = process.argv.includes('--host') || process.env.INNERWORLD_HOST === 'lan';
  const port = Number(process.env.PORT) || 3000;
  const bind = openToLan ? '0.0.0.0' : '127.0.0.1';

  createApp({ openToLan }).listen(port, bind, () => {
    console.log(`INNERWORLD  http://localhost:${port}`);
    if (openToLan) {
      const address = lanAddress();
      console.log(
        address
          ? `            http://${address}:${port}  (this network — for testing on a phone)`
          : '            no LAN address found on this machine',
      );
      console.log('            LAN mode is for development on your own network. Do not expose it publicly.');
    }
    console.log(
      process.env.OPENAI_API_KEY
        ? '            painting: model configured, with on-device painting as the fallback'
        : '            painting: on device, nothing leaves this machine',
    );
  });
}
