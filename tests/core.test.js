import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addDays,
  chapterDays,
  chapterPalette,
  chapterSummary,
  contrastRatio,
  daysBetween,
  derivePalette,
  escapeHTML,
  feelings,
  localDay,
  loopProgress,
  MAX_FEELINGS,
  pigments,
  readableInk,
  scenePrompt,
  shareText,
  titleFor,
} from '../src/core.js';
import { dayById, days, dayForDate } from '../src/content.js';

test('local dates belong to the day the person actually had', () => {
  assert.equal(localDay(new Date(2026, 8, 8, 23, 30)), '2026-09-08');
  assert.equal(localDay(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(daysBetween('2026-10-13', '2026-10-29'), 16);
});

test('the question of the day is chosen by date, not by anything about the person', () => {
  const first = dayForDate('2026-11-04');
  assert.equal(dayForDate('2026-11-04').id, first.id, 'same date gives the same question');
  assert.notEqual(dayForDate('2026-11-05').id, first.id, 'the next day moves on');
  assert.equal(dayForDate(addDays('2026-11-04', days.length)).id, first.id, 'the cycle closes');
});

test('every authored day is complete and carries a real pigment', () => {
  for (const day of days) {
    assert.ok(day.question.endsWith('?'), `${day.id} is phrased as a question`);
    assert.ok(pigments[day.pigment], `${day.id} names a pigment that exists`);
    assert.ok(day.reflect.trim().length > 10, `${day.id} has a reflection prompt`);
    assert.ok(day.ways.read.slides.length >= 4, `${day.id} has something to read`);
    assert.ok(day.ways.drift.lines.length >= 5, `${day.id} has a drift sequence`);
    assert.ok(day.ways.wander.steps.length >= 4, `${day.id} has a walk`);
    assert.equal(dayById[day.id], day);
  }
});

// The point of the whole redesign: the feeling words a person picks have to
// reach the painting. An earlier version collected them and never read them.
test('feeling words choose pigments, and the explanation says so', () => {
  const day = dayById['autumn-light'];
  const palette = derivePalette(day, ['calm', 'tender']);
  const keys = palette.pigments.map((p) => p.key);

  assert.equal(keys[0], day.pigment, "the day's own pigment leads");
  assert.ok(keys.includes('indigo'), 'calm brought indigo');
  assert.ok(keys.includes('lead-white'), 'tender brought lead white');
  assert.equal(keys.length, 4);
  assert.equal(new Set(keys).size, 4, 'no pigment is picked twice');

  assert.match(palette.why, /from today’s question/);
  assert.match(palette.why, /calm and tender/);
});

test('a different set of words gives a different palette', () => {
  const day = dayById['autumn-light'];
  const calm = derivePalette(day, ['calm']).pigments.map((p) => p.key);
  const restless = derivePalette(day, ['restless']).pigments.map((p) => p.key);
  assert.notDeepEqual(calm, restless);
  assert.ok(restless.includes('vermilion'));
});

test('picking nothing still yields a usable palette, and says why', () => {
  const palette = derivePalette(dayById['blue-dusk'], []);
  assert.equal(palette.pigments.length, 4);
  assert.match(palette.why, /no feeling words/);
});

test('only the first two feeling words count', () => {
  const palette = derivePalette(dayById['autumn-light'], ['calm', 'tender', 'heavy', 'bright']);
  const fromFeelings = palette.sources.filter((s) => s.source.startsWith('feeling:'));
  assert.equal(fromFeelings.length, MAX_FEELINGS);
  assert.ok(!palette.why.includes('bright'));
});

test('every feeling maps to a pigment that exists', () => {
  for (const feeling of feelings) {
    assert.ok(pigments[feeling.pigment], `${feeling.id} maps to a real pigment`);
  }
});

test('a pigment label is never set in a colour that fails on its own swatch', () => {
  for (const pigment of Object.values(pigments)) {
    const ink = readableInk(pigment.hex);
    assert.ok(
      contrastRatio(pigment.hex, ink) >= 4.5,
      `${pigment.name} needs a readable label (got ${contrastRatio(pigment.hex, ink).toFixed(2)}:1)`,
    );
  }
});

test('the loop tracks one day, and counts no runs', () => {
  assert.deepEqual(loopProgress(null), { step: 'notice', done: [] });

  const piece = { visited: ['read'] };
  assert.equal(loopProgress(piece).step, 'reflect');

  piece.response = 'On the bus home.';
  assert.equal(loopProgress(piece).step, 'make');

  piece.painting = true;
  assert.equal(loopProgress(piece).step, 'keep');

  piece.kept = true;
  assert.deepEqual(loopProgress(piece).done, ['notice', 'reflect', 'make', 'keep']);
});

test('a day with nothing kept is quiet, never missed', () => {
  const chapter = { id: 'c1', start: '2026-10-26' };
  const pieces = [
    { id: 'a', day: '2026-10-26', chapter: 'c1', palette: ['yellow-ochre', 'indigo'] },
    { id: 'b', day: '2026-10-29', chapter: 'c1', palette: ['yellow-ochre'] },
  ];
  const grid = chapterDays(chapter, pieces, '2026-10-30');

  assert.equal(grid.length % 7, 0, 'the grid fills whole weeks');
  assert.equal(grid[0].state, 'portrait');
  assert.equal(grid[1].state, 'quiet');
  assert.equal(grid[3].state, 'portrait');
  assert.equal(grid[4].state, 'open', 'today is still open, not yet quiet');
  assert.equal(grid[5].state, 'upcoming');
  assert.ok(grid.find((c) => c.day === '2026-10-30').isToday);

  const summary = chapterSummary(chapter, pieces);
  assert.match(summary.line, /Quiet days are part of the story/);
  assert.doesNotMatch(summary.line, /streak|missed|don't break|keep it up/i);
});

test('an empty chapter is invited, not scolded', () => {
  const line = chapterSummary({ id: 'c1', start: '2026-10-26' }, []).line;
  assert.match(line, /anything/);
  assert.doesNotMatch(line, /streak|missed|failed/i);
});

test('chapter colours are proportions of what was actually kept', () => {
  const bar = chapterPalette([
    { palette: ['yellow-ochre', 'indigo'] },
    { palette: ['yellow-ochre', 'burnt-umber'] },
    { palette: ['yellow-ochre'] },
  ]);
  assert.equal(bar[0].key, 'yellow-ochre');
  assert.equal(bar[0].share, 60);
  assert.equal(bar.reduce((sum, c) => sum + c.share, 0), 100);
  assert.deepEqual(chapterPalette([]), []);
});

// Privacy is the product. These two tests are the ones that must never go
// green by accident.
test('sharing carries the title and the question, and nothing private', () => {
  const text = shareText({
    title: 'Amber window',
    line: 'Why does autumn light feel different?',
    response: 'SECRET REFLECTION',
    feelings: ['SECRETFEELING'],
    prompt: 'SECRET PROMPT',
    why: 'SECRET WHY',
  });
  assert.match(text, /Amber window/);
  assert.match(text, /Why does autumn light feel different\?/);
  assert.doesNotMatch(text, /SECRET/);
});

test('the model prompt is built from the question and the palette only', () => {
  const day = dayById['autumn-light'];
  const palette = derivePalette(day, ['calm', 'tender']);
  const prompt = scenePrompt(day, palette, 'wash');

  assert.match(prompt, /Why does autumn light feel different\?/);
  assert.match(prompt, /yellow ochre/);
  assert.match(prompt, /wash/);
  assert.doesNotMatch(prompt, /reflection|journal|birth|diary/i);
  assert.ok(prompt.length <= 2500, 'the prompt fits the server limit');
});

test('user content is escaped before it reaches the DOM', () => {
  assert.equal(escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(escapeHTML("it's"), 'it&#39;s');
  assert.equal(escapeHTML(null), '');
  assert.equal(escapeHTML(undefined), '');
});

test('a suggested title is offered for every day', () => {
  for (const day of days) {
    const title = titleFor(day, derivePalette(day, ['calm']));
    assert.match(title, /^[A-Z][a-z]+ [a-z]+$/, `${day.id} gets a sensible title (${title})`);
  }
});
