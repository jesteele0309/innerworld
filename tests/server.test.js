import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';

import { createApp } from '../server.js';

async function withServer(options, run) {
  const server = createApp(options);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    await run(`http://127.0.0.1:${port}`, port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// fetch refuses to set Host, so the allow-list has to be driven over a socket.
function rawGet(port, host, path = '/api/status') {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => {
      socket.write(`GET ${path} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);
    });
    let raw = '';
    socket.on('data', (chunk) => {
      raw += chunk;
    });
    socket.on('error', reject);
    socket.on('end', () => resolve({ status: Number(raw.split(' ')[1]), raw }));
  });
}

const paint = (origin, body, headers = {}) =>
  fetch(`${origin}/api/paint`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('status reports on-device painting when no model is configured', async () =>
  withServer({ key: '' }, async (origin) => {
    const status = await (await fetch(`${origin}/api/status`)).json();
    assert.deepEqual(status, { configured: false, model: null, painter: 'local' });
  }));

test('status names the model when one is configured', async () =>
  withServer({ key: 'k', model: 'gpt-image-1' }, async (origin) => {
    const status = await (await fetch(`${origin}/api/status`)).json();
    assert.deepEqual(status, { configured: true, model: 'gpt-image-1', painter: 'model' });
  }));

test('the app is served and nothing else is', async () =>
  withServer({ key: '' }, async (origin) => {
    for (const path of ['/', '/index.html', '/styles.css', '/src/app.js', '/src/core.js', '/favicon.svg']) {
      assert.equal((await fetch(origin + path)).status, 200, `${path} is served`);
    }
    for (const path of [
      '/.env',
      '/server.js',
      '/package.json',
      '/tests/core.test.js',
      '/src/../server.js',
      '/src/../../etc/passwd',
      '/assets/../server.js',
    ]) {
      assert.equal((await fetch(origin + path)).status, 404, `${path} is not served`);
    }
  }));

test('every response carries the security headers', async () =>
  withServer({ key: '' }, async (origin) => {
    for (const path of ['/index.html', '/api/status']) {
      const response = await fetch(origin + path);
      const csp = response.headers.get('content-security-policy');
      assert.match(csp, /default-src 'none'/);
      assert.match(csp, /script-src 'self'/);
      assert.match(csp, /frame-ancestors 'none'/);
      assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    }
  }));

test('by default only loopback is answered', async () =>
  withServer({ key: '' }, async (origin, port) => {
    assert.equal((await rawGet(port, `127.0.0.1:${port}`)).status, 200);
    assert.equal((await rawGet(port, `localhost:${port}`)).status, 200);
    assert.equal((await rawGet(port, `192.168.1.50:${port}`)).status, 403);
  }));

// The previous version bound loopback *and* rejected every non-localhost Host,
// so the app could not be opened on a phone at all.
test('--host answers on private addresses so a phone can reach it', async () =>
  withServer({ key: '', openToLan: true }, async (origin, port) => {
    for (const host of [`192.168.1.50:${port}`, `10.0.0.4:${port}`, `172.16.3.9:${port}`, `studio.local:${port}`]) {
      assert.equal((await rawGet(port, host)).status, 200, `${host} is answered in LAN mode`);
    }
    // A public hostname pointed at this machine is still refused, so DNS
    // rebinding does not get in with it.
    assert.equal((await rawGet(port, 'evil.example.com')).status, 403);
    assert.equal((await rawGet(port, `8.8.8.8:${port}`)).status, 403);
  }));

test('without a model, painting says so without calling it an error', async () =>
  withServer({ key: '' }, async (origin) => {
    const response = await paint(origin, { prompt: 'a field' });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /paints on your device/);
  }));

test('a painting request carries the prompt and nothing else', async () => {
  let sent;
  await withServer(
    {
      key: 'test-key',
      providerFetch: async (url, options) => {
        sent = JSON.parse(options.body);
        return Response.json({ data: [{ b64_json: 'YWJj' }] });
      },
    },
    async (origin) => {
      const response = await paint(origin, { prompt: 'One ochre field' });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).image, 'data:image/png;base64,YWJj');
      assert.equal(sent.prompt, 'One ochre field');
      assert.deepEqual(Object.keys(sent).sort(), ['model', 'n', 'prompt', 'quality', 'size']);
    },
  );
});

test('anything beyond the prompt is refused, not quietly forwarded', async () =>
  withServer({ key: 'test-key' }, async (origin) => {
    for (const body of [
      { prompt: 'a field', response: 'my private reflection' },
      { prompt: 'a field', feelings: ['calm'] },
      { prompt: 'a field', note: 'private' },
      { prompt: '' },
      { prompt: 'a'.repeat(2501) },
    ]) {
      assert.equal((await paint(origin, body)).status, 400, `${Object.keys(body)} is refused`);
    }
  }));

test('cross-origin and non-JSON requests are refused', async () =>
  withServer({ key: 'test-key' }, async (origin) => {
    assert.equal((await paint(origin, { prompt: 'x' }, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await paint(origin, { prompt: 'x' }, { 'Content-Type': 'text/plain' })).status, 403);
    assert.equal((await fetch(`${origin}/api/paint`)).status, 405);
  }));

// A model that answers with a URL instead of base64 used to report
// "no image was returned", which read as an outage rather than a mismatch.
test('a model that returns a URL works too', async () =>
  withServer(
    {
      key: 'k',
      providerFetch: async (url) => {
        if (url.startsWith('https://api.openai.com')) {
          return Response.json({ data: [{ url: 'https://images.example/abc.png' }] });
        }
        return new Response(Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        });
      },
    },
    async (origin) => {
      const response = await paint(origin, { prompt: 'a field' });
      assert.equal(response.status, 200);
      assert.match((await response.json()).image, /^data:image\/png;base64,/);
    },
  ));

test('an unusable response names the model, so a misconfiguration is findable', async () =>
  withServer(
    { key: 'k', model: 'some-text-model', providerFetch: async () => Response.json({ data: [{}] }) },
    async (origin) => {
      const response = await paint(origin, { prompt: 'a field' });
      assert.equal(response.status, 502);
      assert.match((await response.json()).error, /some-text-model/);
    },
  ));

test('provider failures never leak the key or the raw error', async () =>
  withServer(
    {
      key: 'SECRET-KEY',
      providerFetch: async () => new Response('SECRET-KEY is invalid', { status: 401 }),
    },
    async (origin) => {
      const response = await paint(origin, { prompt: 'a field' });
      assert.equal(response.status, 502);
      assert.doesNotMatch(await response.text(), /SECRET/);
    },
  ));

test('the hourly limit holds and explains the alternative', async () =>
  withServer(
    {
      key: 'k',
      hourlyLimit: 2,
      providerFetch: async () => Response.json({ data: [{ b64_json: 'YWJj' }] }),
    },
    async (origin) => {
      assert.equal((await paint(origin, { prompt: 'one' })).status, 200);
      assert.equal((await paint(origin, { prompt: 'two' })).status, 200);
      const third = await paint(origin, { prompt: 'three' });
      assert.equal(third.status, 429);
      assert.match((await third.json()).error, /on your device/);
    },
  ));
