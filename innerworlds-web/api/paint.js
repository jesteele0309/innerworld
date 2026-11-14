// Makes one painting from a person's prompt, palette and style.
// The prompt passes through to the image model and is not stored or logged here.
// The page asks four times, once per variation, so each answer stays small.

export const config = { maxDuration: 60 };

const MODEL = 'bfl/flux-3-image-klein';
const GATEWAY = 'https://ai-gateway.vercel.sh/v1/images/generations';
const MAX_BODY = 6000;
const PER_HOUR = 24; // six presses of four

const STYLES = {
  painterly: 'An oil painting with visible, confident brushwork and layered colour',
  watercolour: 'A watercolour painting with soft washes, wet edges and bare paper showing through',
  ink: 'An ink and line drawing with sparse, deliberate marks and a little flat colour',
  abstract: 'An abstract painting of shape, colour and texture, with nothing drawn literally',
  dream: 'A dreamlike, surreal painting with soft light and unexpected scale',
  photo: 'A photograph with natural light and shallow depth of field',
  none: '',
};

// Best effort only: each server instance keeps its own count. Set a spend
// budget on the AI Gateway as the real limit.
const seen = new Map();

function allowed(ip) {
  const now = Date.now();
  const hits = (seen.get(ip) || []).filter((t) => now - t < 3600000);
  if (hits.length >= PER_HOUR) return false;
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 5000) seen.clear();
  return true;
}

const reply = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const text = (value, max) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export async function POST(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  let sameSite = false;
  try {
    sameSite = Boolean(origin) && new URL(origin).host === host;
  } catch {
    sameSite = false;
  }
  if (!sameSite) return reply(403, { error: 'forbidden' });
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) return reply(415, { error: 'bad_type' });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply(413, { error: 'too_large' });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: 'bad_json' });
  }

  const words = text(body && body.prompt, 600);
  if (!words) return reply(400, { error: 'no_prompt' });
  const style = Object.hasOwn(STYLES, body.style) ? body.style : 'painterly';
  const colours = (Array.isArray(body.palette) ? body.palette : [])
    .slice(0, 5)
    .map((c) => {
      const name = text(c && c.name, 30);
      const hex = /^#[0-9a-f]{6}$/i.test((c && c.hex) || '') ? c.hex : '';
      return name ? `${name}${hex ? ` (${hex})` : ''}` : '';
    })
    .filter(Boolean);

  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (!allowed(ip)) return reply(429, { error: 'rate_limited' });

  const key = process.env.AI_GATEWAY_API_KEY || request.headers.get('x-vercel-oidc-token') || process.env.VERCEL_OIDC_TOKEN;
  if (!key) return reply(503, { error: 'not_configured' });

  const prompt = [
    STYLES[style],
    words,
    colours.length ? `Colour palette, used as the dominant colours: ${colours.join(', ')}` : '',
    'No text, lettering, signature, watermark or frame in the image',
  ]
    .filter(Boolean)
    .join('. ');

  let upstream;
  try {
    upstream = await fetch(GATEWAY, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
        providerOptions: { blackForestLabs: { outputFormat: 'jpeg' } },
      }),
      signal: AbortSignal.timeout(55000),
    });
  } catch {
    return reply(502, { error: 'upstream' });
  }
  if (!upstream.ok) {
    // The gateway's own error message, never the prompt.
    const why = await upstream.text().catch(() => '');
    console.error(`ai gateway image ${upstream.status}: ${why.slice(0, 300)}`);
    if (upstream.status === 429) return reply(429, { error: 'rate_limited' });
    if (upstream.status === 400 || upstream.status === 422) return reply(422, { error: 'refused' });
    if (upstream.status === 402) return reply(503, { error: 'no_credit' });
    return reply(502, { error: 'upstream', status: upstream.status });
  }

  const data = await upstream.json().catch(() => null);
  const image = data && Array.isArray(data.data) && data.data[0];
  const b64 = image && typeof image.b64_json === 'string' ? image.b64_json : '';
  if (!b64) {
    console.error(`ai gateway image empty answer: keys=${Object.keys((image || data || {})).join(',').slice(0, 120)}`);
    return reply(502, { error: 'empty' });
  }
  const type = b64.startsWith('/9j/') ? 'image/jpeg' : b64.startsWith('iVBOR') ? 'image/png' : b64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
  return reply(200, { image: `data:${type};base64,${b64}`, model: MODEL });
}
