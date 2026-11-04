import test from 'node:test';
import assert from 'node:assert/strict';

import { CANVAS, describePainting, planPainting, seedFrom } from '../src/painter.js';
import { derivePalette, pigments } from '../src/core.js';
import { dayById } from '../src/content.js';

const palette = derivePalette(dayById['autumn-light'], ['calm', 'tender']).pigments;
const keys = palette.map((p) => p.key);

test('the same day, palette and mark always paint the same picture', () => {
  const a = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash', variant: 0 });
  const b = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash', variant: 0 });
  assert.deepEqual(a, b, 'a kept portrait can always be redrawn exactly');
});

test('repainting moves to a different picture, not a random one', () => {
  const first = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash', variant: 0 });
  const second = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash', variant: 1 });
  const again = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash', variant: 1 });

  assert.notEqual(first.seed, second.seed);
  assert.deepEqual(second, again, 'variant 1 is reproducible too');
});

test('a different palette paints a different picture', () => {
  const calm = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash' });
  const other = derivePalette(dayById['autumn-light'], ['restless']).pigments.map((p) => p.key);
  const restless = planPainting({ day: '2026-11-04', palette: other, mark: 'wash' });
  assert.notEqual(calm.seed, restless.seed);
});

test('every mark style produces marks, and only known kinds', () => {
  const allowed = new Set(['blob', 'band', 'speck', 'stroke']);
  for (const mark of ['wash', 'grain', 'line']) {
    const plan = planPainting({ day: '2026-11-04', palette: keys, mark });
    assert.ok(plan.marks.length > 0, `${mark} puts paint down`);
    for (const m of plan.marks) {
      assert.ok(allowed.has(m.kind), `${mark} uses a known mark kind`);
      assert.ok(m.alpha > 0 && m.alpha <= 1, `${mark} alpha stays in range`);
      assert.ok(typeof m.hex === 'string' && m.hex.startsWith('#'));
    }
  }
});

test('the three mark styles differ from each other', () => {
  const kinds = (mark) =>
    new Set(planPainting({ day: '2026-11-04', palette: keys, mark }).marks.map((m) => m.kind));
  assert.ok(kinds('grain').has('speck'));
  assert.ok(kinds('line').has('stroke'));
  assert.ok(!kinds('wash').has('speck'));
});

test('the painting only ever uses pigments from the palette', () => {
  const allowed = new Set(keys.map((key) => pigments[key].hex));
  const plan = planPainting({ day: '2026-11-04', palette: keys, mark: 'grain' });
  assert.ok(allowed.has(plan.ground), 'the ground is one of the palette');
  for (const m of plan.marks) assert.ok(allowed.has(m.hex), `${m.hex} is in the palette`);
});

test('the darkest pigment becomes the ground', () => {
  const plan = planPainting({ day: '2026-11-04', palette: ['lead-white', 'bone-black'], mark: 'wash' });
  assert.equal(plan.ground, pigments['bone-black'].hex);
});

test('the plan is sized to the canvas', () => {
  const plan = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash' });
  assert.equal(plan.width, CANVAS.width);
  assert.equal(plan.height, CANVAS.height);
  assert.equal(plan.width / plan.height, 0.8, 'portrait, 4:5');
});

test('seeds are stable and specific', () => {
  assert.equal(seedFrom(['a', 'b']), seedFrom(['a', 'b']));
  assert.notEqual(seedFrom(['a', 'b']), seedFrom(['a', 'c']));
  assert.equal(typeof seedFrom(['a']), 'number');
});

// Alt text is a short human description. The generation prompt belongs in
// "Why this?" — an earlier version read the whole prompt out loud instead.
test('alt text is short, human, and free of prompt boilerplate', () => {
  const plan = planPainting({ day: '2026-11-04', palette: keys, mark: 'wash' });
  const alt = describePainting(plan, palette);

  assert.ok(alt.length < 140, `alt text stays short (was ${alt.length})`);
  assert.match(alt, /yellow ochre/);
  assert.doesNotMatch(alt, /No text, logos|zodiac|cosmic|Palette, in this order/i);
});
