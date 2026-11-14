// Makes four pictures from a prompt the person has read and approved, or four
// variations of one picture they chose. The prompt and pictures pass through
// to the image model and back; nothing is stored or logged here.

export const config = { maxDuration: 60 };

const MODEL = 'bfl/flux-3-image-klein';
const GATEWAY = 'https://ai-gateway.vercel.sh/v1/images';
const COUNT = 4;
const MAX_BODY = 1_400_000; // room for one picture sent back for variations
const MAX_PROMPT = 900;
const PER_HOUR = 8;

// What each style adds to the person's own words.
const STYLES = {
  painterly: 'Oil paint on canvas, visible brushwork, layered pigment, museum lighting.',
  watercolour: 'Watercolour on cold-pressed paper, soft washes, bleeding edges, paper showing through.',
  ink: 'Ink and brush on paper, few confident marks, generous empty space.',
  abstract: 'Abstract colour-field painting, large flat shapes, tactile uneven surface, no recognisable objects.',
  collage: 'Cut-paper collage, torn edges, matte layered shapes, hand-made.',
  photograph: 'Fine-art photograph, natural light, shallow depth of field, film grain.',
};

const SHAPES = {
  square: '768x768',
  portrait: '768x1024',
  landscape: '1024x768',
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

const text = (value, max) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').slice(0, max).trim() : '');

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

  const prompt = text(body && body.prompt, MAX_PROMPT);
  if (prompt.length < 3) return reply(400, { error: 'no_prompt' });
  const style = STYLES[body.style] ? body.style : 'painterly';
  const shape = SHAPES[body.shape] ? body.shape : 'square';
  const from = typeof body.from === 'string' && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(body.from) ? body.from : null;

  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (!allowed(ip)) return reply(429, { error: 'rate_limited' });

  const key = process.env.AI_GATEWAY_API_KEY || request.headers.get('x-vercel-oidc-token') || process.env.VERCEL_OIDC_TOKEN;
  if (!key) return reply(503, { error: 'not_configured' });

  const full = `${prompt}\n${STYLES[style]}\nNo text, letters, numerals, watermarks or logos.`;
  const shared = {
    model: MODEL,
    n: COUNT,
    size: SHAPES[shape],
    response_format: 'b64_json',
    providerOptions: { blackForestLabs: { outputFormat: 'jpeg', safetyTolerance: 2 } },
  };
  const payload = from
    ? {
        ...shared,
        prompt: `A variation of this picture: the same subject, palette and handling, with a different composition.\n${full}`,
        images: [{ image_url: from }],
      }
    : { ...shared, prompt: full };

  let upstream;
  try {
    upstream = await fetch(`${GATEWAY}/${from ? 'edits' : 'generations'}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55000),
    });
  } catch {
    return reply(502, { error: 'upstream' });
  }
  if (!upstream.ok) {
    // The gateway's own error message, never the prompt.
    const why = await upstream.text().catch(() => '');
    console.error(`ai gateway images ${upstream.status}: ${why.slice(0, 300)}`);
    const refused = upstream.status === 400 || upstream.status === 422;
    return reply(upstream.status === 429 ? 429 : refused ? 422 : 502, {
      error: upstream.status === 429 ? 'rate_limited' : refused ? 'refused' : 'upstream',
      status: upstream.status,
    });
  }

  const data = await upstream.json().catch(() => null);
  const images = (data && Array.isArray(data.data) ? data.data : [])
    .map((item) => (item && typeof item.b64_json === 'string' ? item.b64_json : ''))
    .filter((b64) => b64.length > 1000 && /^[A-Za-z0-9+/=\s]+$/.test(b64.slice(0, 200)))
    .slice(0, COUNT)
    .map((b64) => `data:image/jpeg;base64,${b64.replace(/\s/g, '')}`);
  if (!images.length) {
    console.error(`ai gateway images empty answer: keys=${data ? Object.keys(data).join(',') : 'none'}`);
    return reply(502, { error: 'empty' });
  }
  return reply(200, { images, style, shape });
}
