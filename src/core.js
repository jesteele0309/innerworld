import { pigments, feelings, MAX_FEELINGS, markStyles, ways, defaults } from './pigments.js';
import { dayForDate, days, dayById } from './content.js';

export { pigments, feelings, MAX_FEELINGS, markStyles, ways, defaults, dayForDate, days, dayById };

// ── dates ────────────────────────────────────────────────────────────────
// Local calendar day, so a piece belongs to the day the person actually had,
// not to UTC.

export function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(isoDay, delta) {
  const [y, m, d] = isoDay.split('-').map(Number);
  const at = new Date(y, m - 1, d + delta);
  return localDay(at);
}

export function daysBetween(fromIso, toIso) {
  const [ay, am, ad] = fromIso.split('-').map(Number);
  const [by, bm, bd] = toIso.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

export function formatDay(isoDay, options = { month: 'short', day: 'numeric' }) {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}

// ── colour maths ─────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const value = String(hex).replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

// Pick whichever of two inks is more readable on a given ground. Used for
// pigment chips, so a label is never set in a colour that fails on its swatch.
export function readableInk(groundHex, lightInk = '#F6EFE2', darkInk = '#15120E') {
  return contrastRatio(groundHex, lightInk) >= contrastRatio(groundHex, darkInk)
    ? lightInk
    : darkInk;
}

// ── the palette ──────────────────────────────────────────────────────────
// This is where taste and resonance stop being decoration. The day's question
// contributes one pigment; the feeling words the person picked contribute
// theirs; a grounding pigment is chosen for tonal range. `why` is the
// sentence the Make screen shows, so the derivation is never a black box.

const GROUNDS = ['lead-white', 'bone-black', 'burnt-umber', 'raw-sienna'];

export function derivePalette(day, feelingIds = []) {
  const chosen = [];
  const sources = [];

  const add = (key, source) => {
    if (!key || !pigments[key] || chosen.includes(key)) return false;
    chosen.push(key);
    sources.push({ key, source });
    return true;
  };

  add(day.pigment, 'question');

  const picked = feelingIds.slice(0, MAX_FEELINGS);
  for (const id of picked) {
    const feeling = feelings.find((f) => f.id === id);
    if (feeling) add(feeling.pigment, `feeling:${feeling.id}`);
  }

  // Fill to four, choosing grounds that widen the tonal range rather than
  // repeating what is already there.
  while (chosen.length < 4) {
    const spread = (key) =>
      Math.min(...chosen.map((c) => Math.abs(luminance(pigments[c].hex) - luminance(pigments[key].hex))));
    const candidate = GROUNDS
      .filter((key) => !chosen.includes(key))
      .sort((a, b) => spread(b) - spread(a))[0];
    if (!add(candidate, 'ground')) break;
  }

  return {
    pigments: chosen.map((key) => ({ key, ...pigments[key] })),
    sources,
    why: explainPalette(sources, picked),
  };
}

function explainPalette(sources, pickedFeelings) {
  const named = (keys) => keys.map((k) => pigments[k].name.toLowerCase());
  const fromQuestion = sources.filter((s) => s.source === 'question').map((s) => s.key);
  const fromFeeling = sources.filter((s) => s.source.startsWith('feeling:')).map((s) => s.key);
  const fromGround = sources.filter((s) => s.source === 'ground').map((s) => s.key);

  const sentences = [];
  if (fromQuestion.length) {
    sentences.push(`${sentenceCase(named(fromQuestion).join(' and '))} from today’s question.`);
  }
  if (fromFeeling.length) {
    const words = pickedFeelings
      .map((id) => feelings.find((f) => f.id === id))
      .filter(Boolean)
      .map((f) => f.label.toLowerCase());
    sentences.push(
      `${sentenceCase(joinList(named(fromFeeling)))} from the ${words.length === 1 ? 'word' : 'words'} you picked: ${joinList(words)}.`,
    );
  } else {
    sentences.push('You picked no feeling words, so the rest is tonal range only.');
  }
  if (fromGround.length) {
    sentences.push(`${sentenceCase(joinList(named(fromGround)))} added for light and dark.`);
  }
  return sentences.join(' ');
}

function joinList(items) {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function sentenceCase(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

// ── the daily loop ───────────────────────────────────────────────────────

export const LOOP_STEPS = ['notice', 'reflect', 'make', 'keep'];

// How far through today's loop the person has got. Drives the four bars in
// the Today header and nothing else — there is no streak and no score.
export function loopProgress(piece) {
  if (!piece) return { step: 'notice', done: [] };
  const done = [];
  if (piece.visited && piece.visited.length) done.push('notice');
  if ((piece.response && piece.response.trim()) || (piece.feelings && piece.feelings.length)) done.push('reflect');
  if (piece.image || piece.painting) done.push('make');
  if (piece.kept) done.push('keep');
  const next = LOOP_STEPS.find((s) => !done.includes(s)) || 'keep';
  return { step: next, done };
}

// ── chapters ─────────────────────────────────────────────────────────────
// A chapter is a stretch of days, not a target. Days without a portrait are
// shown as themselves — "quiet", never "missed".

export function chapterDays(chapter, pieces, today = localDay()) {
  const start = chapter.start;
  const span = Math.max(daysBetween(start, today) + 1, 1);
  const byDay = new Map(pieces.filter((p) => p.chapter === chapter.id).map((p) => [p.day, p]));
  const out = [];
  const length = Math.ceil(span / 7) * 7;
  for (let i = 0; i < length; i += 1) {
    const day = addDays(start, i);
    const ahead = daysBetween(day, today) < 0;
    const isToday = day === today;
    // Today is still open. Calling it quiet before it is over would be a
    // judgement the app has no business making.
    const state = byDay.has(day) ? 'portrait' : ahead ? 'upcoming' : isToday ? 'open' : 'quiet';
    out.push({ day, piece: byDay.get(day) || null, state, isToday });
  }
  return out;
}

export function chapterPalette(pieces) {
  const tally = new Map();
  for (const piece of pieces) {
    for (const key of piece.palette || []) {
      tally.set(key, (tally.get(key) || 0) + 1);
    }
  }
  const total = [...tally.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({
      key,
      name: pigments[key] ? pigments[key].name : key,
      hex: pigments[key] ? pigments[key].hex : '#5A5247',
      share: Math.round((count / total) * 100),
    }));
}

export function chapterSummary(chapter, pieces) {
  const mine = pieces.filter((p) => p.chapter === chapter.id);
  const count = mine.length;
  return {
    count,
    line:
      count === 0
        ? 'Nothing kept yet. The first one can be anything.'
        : `${count} portrait${count === 1 ? '' : 's'} so far. Quiet days are part of the story too.`,
  };
}

// ── sharing ──────────────────────────────────────────────────────────────
// Only ever the title and the line. Never the reflection, never the feeling
// words, never the prompt.

export function shareText(piece) {
  return `${piece.title}\n${piece.line}\n\nINNERWORLD`;
}

export function escapeHTML(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

// ── the model prompt ─────────────────────────────────────────────────────
// Built only from the day's question, the palette and the mark style. The
// reflection text is never part of it; `assertPromptIsSafe` is the guard the
// tests hold us to.

export function scenePrompt(day, palette, markId) {
  const mark = markStyles.find((m) => m.id === markId) || markStyles[0];
  const colours = palette.pigments.map((p) => p.name.toLowerCase()).join(', ');
  return [
    `An abstract painted field about this question: ${day.question}`,
    `Palette, in this order of dominance: ${colours}.`,
    `Handling: ${mark.label.toLowerCase()} — ${mark.note.toLowerCase()}`,
    'No text, letters, numerals, figures, faces, logos, zodiac or cosmic imagery.',
    'Flat, tactile, slightly uneven surface, as if mixed by hand.',
  ].join('\n');
}

// A suggested title, built from the leading pigment and the day. Always
// editable — the person gets the last word on what their piece is called.
export function titleFor(day, palette) {
  const word = palette.pigments[0].name.split(' ').pop().toLowerCase();
  return `${sentenceCase(word)} ${noun(day.id)}`;
}

function noun(dayId) {
  const nouns = {
    'autumn-light': 'window',
    'blue-dusk': 'hour',
    'costly-blue': 'measure',
    'white-lead': 'ground',
    afterimage: 'echo',
    'earth-colours': 'field',
    'one-red': 'mark',
    'grey-days': 'weather',
  };
  return nouns[dayId] || 'field';
}
