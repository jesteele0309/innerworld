// The painter. Two halves on purpose: `planPainting` is pure and testable in
// Node, `paint` only knows how to put a plan onto a 2D context.
//
// It is seeded, so the same day, palette, mark and variant always produce the
// same picture. "Repaint" bumps the variant rather than rolling dice, which
// means a portrait a person kept can always be redrawn exactly.

import { pigments } from './pigments.js';

// mulberry32 — small, fast, good enough for arranging paint.
function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(parts) {
  const text = parts.filter((p) => p != null).join('|');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const CANVAS = { width: 1024, height: 1280 };

export function planPainting({ day, palette, mark = 'wash', variant = 0 }) {
  const keys = palette.map((p) => (typeof p === 'string' ? p : p.key));
  const colours = keys.map((key) => (pigments[key] ? pigments[key].hex : '#5A5247'));
  const seed = seedFrom([day, keys.join(','), mark, variant]);
  const random = makeRandom(seed);
  const { width: w, height: h } = CANVAS;

  const between = (lo, hi) => lo + random() * (hi - lo);
  const pick = (list) => list[Math.floor(random() * list.length)];

  // The darkest pigment becomes the ground, so there is always something for
  // the rest to sit on.
  const ground = colours.reduce((darkest, hex) => (relativeDark(hex) > relativeDark(darkest) ? hex : darkest), colours[0]);
  const paints = colours.filter((hex) => hex !== ground);
  const marks = [];

  if (mark === 'wash') {
    for (let i = 0; i < 5; i += 1) {
      marks.push({
        kind: 'blob',
        hex: pick(paints.length ? paints : colours),
        x: between(-0.15, 0.85) * w,
        y: between(-0.05, 0.8) * h,
        rx: between(0.3, 0.8) * w,
        ry: between(0.18, 0.5) * h,
        rotate: between(-0.4, 0.4),
        alpha: between(0.35, 0.8),
        blur: between(0.04, 0.12) * w,
      });
    }
    marks.push({
      kind: 'band',
      hex: pick(colours),
      y: between(0.3, 0.75) * h,
      height: between(0.04, 0.12) * h,
      rotate: between(-0.08, 0.08),
      alpha: between(0.4, 0.7),
      blur: between(0.01, 0.04) * w,
    });
  }

  if (mark === 'grain') {
    for (let i = 0; i < 3; i += 1) {
      marks.push({
        kind: 'blob',
        hex: pick(paints.length ? paints : colours),
        x: between(0, 0.8) * w,
        y: between(0, 0.8) * h,
        rx: between(0.35, 0.7) * w,
        ry: between(0.25, 0.55) * h,
        rotate: between(-0.3, 0.3),
        alpha: between(0.25, 0.5),
        blur: between(0.08, 0.16) * w,
      });
    }
    const count = Math.round(between(2600, 4200));
    for (let i = 0; i < count; i += 1) {
      marks.push({
        kind: 'speck',
        hex: pick(colours),
        x: random() * w,
        y: random() * h,
        r: between(1, 4.5),
        alpha: between(0.08, 0.5),
      });
    }
  }

  if (mark === 'line') {
    marks.push({
      kind: 'blob',
      hex: pick(paints.length ? paints : colours),
      x: between(0.05, 0.5) * w,
      y: between(0.1, 0.5) * h,
      rx: between(0.3, 0.55) * w,
      ry: between(0.2, 0.4) * h,
      rotate: between(-0.2, 0.2),
      alpha: between(0.18, 0.35),
      blur: between(0.1, 0.18) * w,
    });
    for (let i = 0; i < 7; i += 1) {
      marks.push({
        kind: 'stroke',
        hex: pick(colours),
        x1: between(-0.05, 0.6) * w,
        y1: between(0.05, 0.9) * h,
        x2: between(0.4, 1.05) * w,
        y2: between(0.05, 0.95) * h,
        bend: between(-0.22, 0.22) * h,
        lineWidth: between(1.5, 7),
        alpha: between(0.4, 0.95),
      });
    }
  }

  return { seed, ground, colours, mark, marks, width: w, height: h };
}

function relativeDark(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 255 - (r * 0.299 + g * 0.587 + b * 0.114);
}

export function paint(ctx, plan) {
  const { width: w, height: h } = plan;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = plan.ground;
  ctx.fillRect(0, 0, w, h);

  for (const m of plan.marks) {
    ctx.save();
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = m.hex;
    ctx.strokeStyle = m.hex;
    if (m.blur) ctx.filter = `blur(${m.blur}px)`;

    if (m.kind === 'blob') {
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rotate);
      ctx.beginPath();
      ctx.ellipse(0, 0, m.rx / 2, m.ry / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.kind === 'band') {
      ctx.translate(0, m.y);
      ctx.rotate(m.rotate);
      ctx.fillRect(-w * 0.1, 0, w * 1.2, m.height);
    } else if (m.kind === 'speck') {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.kind === 'stroke') {
      ctx.lineWidth = m.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x1, m.y1);
      ctx.quadraticCurveTo((m.x1 + m.x2) / 2, (m.y1 + m.y2) / 2 + m.bend, m.x2, m.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // A faint vignette, so the edges read as a painted surface rather than a
  // screenshot of a gradient.
  const vignette = ctx.createRadialGradient(w / 2, h * 0.45, w * 0.2, w / 2, h * 0.5, w * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// A short, human description for `alt`. The full generation prompt belongs in
// "Why this?", never in alt text.
export function describePainting(plan, palette) {
  const names = palette.map((p) => (typeof p === 'string' ? pigments[p].name : p.name).toLowerCase());
  const handling = {
    wash: 'broad overlapping washes',
    grain: 'scattered dry pigment over soft fields',
    line: 'a few drawn lines over a pale field',
  }[plan.mark] || 'painted fields';
  return `An abstract painting: ${handling} in ${names.slice(0, 3).join(', ')}.`;
}

export async function renderToBlob(plan, createCanvas) {
  const canvas = createCanvas(plan.width, plan.height);
  paint(canvas.getContext('2d'), plan);
  if (canvas.convertToBlob) return canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
}
