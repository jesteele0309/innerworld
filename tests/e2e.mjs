// End-to-end check of the daily loop in a real browser.
//
//   npm start            # in one terminal
//   npm run e2e          # in another
//
// Playwright is not a dependency of this project — `npm test` stays
// dependency-free on purpose. This script uses whatever Playwright it can
// find (a local install, or a global one) and says so clearly if there is
// none. It drives the whole loop: Notice → Reflect → Make → Keep.

const BASE = process.argv[2] || 'http://localhost:3000';
const SHOTS = process.argv[3] || null;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  try {
    const globalRoot = (await import('node:child_process')).execSync('npm root -g', { encoding: 'utf8' }).trim();
    ({ chromium } = (await import(`${globalRoot}/playwright/index.js`)).default);
  } catch {
    console.error('Playwright is not available. Install it with:  npm i -D playwright');
    console.error('Then run:  npx playwright install chromium');
    process.exit(2);
  }
}

const failures = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`console error: ${message.text()}`);
});

let picked = [];

async function step(label, run) {
  try {
    await run();
    console.log(`  ok    ${label}`);
  } catch (error) {
    console.log(`  FAIL  ${label}\n        ${error.message.split('\n')[0]}`);
    failures.push(label);
  }
}

const shot = (name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png` }) : Promise.resolve());

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

await step('Today shows a question, a pigment and three ways in', async () => {
  await page.waitForSelector('.display', { timeout: 5000 });
  const question = (await page.textContent('.display')).trim();
  if (!question.endsWith('?')) throw new Error(`not a question: ${question}`);
  if (!(await page.textContent('.pigment-name')).trim()) throw new Error('no pigment of the day');
  if ((await page.$$('.wayin')).length !== 3) throw new Error('expected three ways in');
});
await shot('1-today');

await step('all four tabs carry a visible label', async () => {
  const labels = await page.$$eval('.tab span:last-child', (nodes) => nodes.map((n) => n.textContent.trim()));
  if (labels.join(',') !== 'Today,Explore,Practice,My World') throw new Error(labels.join(','));
});

await step('Read pages forward and tracks its progress', async () => {
  await page.click('.wayin');
  await page.waitForSelector('.reading');
  const first = await page.textContent('.display-sm');
  await page.click('#next');
  await page.waitForFunction((b) => document.querySelector('.display-sm')?.textContent !== b, first);
  if ((await page.$$('.pip.is-done')).length !== 2) throw new Error('progress did not advance');
});
await shot('2-read');

await step('the paging controls do not move between sections', async () => {
  const where = () => page.$eval('#next', (el) => Math.round(el.getBoundingClientRect().y));
  const before = await where();
  const heading = await page.textContent('.display-sm');
  await page.click('#next');
  await page.waitForFunction((b) => document.querySelector('.display-sm')?.textContent !== b, heading);
  if ((await where()) !== before) throw new Error('Next moved between sections');
});

await step('text-only hides the plate and brings it back', async () => {
  await page.click('#text-only');
  if (await page.$('.plate')) throw new Error('plate still shown');
  await page.click('#text-only');
  if (!(await page.$('.plate'))) throw new Error('plate did not return');
});

await step('the last section leads to Reflect', async () => {
  for (let i = 0; i < 10 && !(await page.$('#reflection')); i += 1) {
    const heading = await page.textContent('.display-sm');
    await page.click('#next');
    await page.waitForFunction(
      (b) => Boolean(document.getElementById('reflection')) || document.querySelector('.display-sm')?.textContent !== b,
      heading,
      { timeout: 5000 },
    );
  }
  await page.waitForSelector('#reflection');
});

await step('the reflection is saved as it is typed', async () => {
  await page.fill('#reflection', 'On the bus home. The window turned everything amber and I stopped scrolling.');
  await page.waitForFunction(() => document.getElementById('save-state')?.textContent.includes('Saved'), null, {
    timeout: 5000,
  });
});

await step('feeling words cap at two', async () => {
  await page.click('[data-feeling="calm"]');
  await page.click('[data-feeling="tender"]');
  await page.click('[data-feeling="heavy"]');
  picked = await page.$$eval('.chip.is-on', (nodes) => nodes.map((n) => n.textContent.trim()));
  if (picked.length !== 2) throw new Error(`pressed ${picked.length}: ${picked.join(', ')}`);
});
await shot('3-reflect');

await step('the reflection and the words survive a reload', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(`${BASE}/#reflect`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#reflection');
  if (!(await page.inputValue('#reflection')).includes('amber')) throw new Error('the writing was lost');
  const after = await page.$$eval('.chip.is-on', (nodes) => nodes.map((n) => n.textContent.trim()));
  if (after.length !== 2) throw new Error(`${after.length} feeling words survived`);
  if (after.join() !== picked.join()) throw new Error(`kept ${after.join(', ')}, expected ${picked.join(', ')}`);
});

// The whole point of the redesign: the words reach the paint, and the screen
// says which colour came from where.
await step('the palette comes from the words, and says so', async () => {
  await page.click('#to-make');
  await page.waitForSelector('.palette-why');
  const why = (await page.textContent('.palette-why')).trim();
  if ((await page.$$('.swatch-name')).length !== 4) throw new Error('expected four pigments');
  for (const word of picked) {
    if (!why.toLowerCase().includes(word.toLowerCase())) throw new Error(`"${word}" is not explained: ${why}`);
  }
  if (!/question/.test(why)) throw new Error(`the question is not credited: ${why}`);
});
await shot('4-make');

await step('painting happens on device and alt text stays human', async () => {
  await page.click('#paint');
  await page.waitForSelector('#portrait-image', { timeout: 30000 });
  if (!(await page.getAttribute('#portrait-image', 'src')).startsWith('blob:')) throw new Error('no local image');
  const alt = await page.getAttribute('#portrait-image', 'alt');
  if (alt.length > 140) throw new Error(`alt text is ${alt.length} characters`);
  if (/zodiac|No text, logos|Palette, in this order/i.test(alt)) throw new Error('prompt boilerplate in alt text');
  const width = await page.$eval('#portrait-image', (el) => el.naturalWidth);
  if (width !== 1024) throw new Error(`image is ${width}px wide`);
});
await shot('5-portrait');

await step('repaint gives a different picture', async () => {
  const before = await page.getAttribute('#portrait-image', 'src');
  await page.click('#repaint');
  await page.waitForFunction((b) => document.getElementById('portrait-image')?.src !== b, before, { timeout: 30000 });
});

await step('keeping it files it in the chapter, with no streak language', async () => {
  await page.click('#keep');
  await page.waitForSelector('.day-grid', { timeout: 5000 });
  if (!(await page.$$('.day.is-portrait')).length) throw new Error('nothing in the day grid');
  if (!(await page.$$('.colour-bar span')).length) throw new Error('no colour bar');
  if (/streak/i.test(await page.innerText('#main'))) throw new Error('streak language on the chapter screen');
});
await shot('6-world');

await step('Explore lists every question', async () => {
  await page.goto(`${BASE}/#explore`, { waitUntil: 'networkidle' });
  if ((await page.$$('.question-card')).length < 8) throw new Error('questions missing');
});
await shot('7-explore');

await step('Practice steps tick and persist', async () => {
  await page.goto(`${BASE}/#practice`, { waitUntil: 'networkidle' });
  await page.click('.step[data-step="0"]');
  await page.click('.step[data-step="1"]');
  await page.waitForTimeout(400);
  await page.goto(`${BASE}/#practice`, { waitUntil: 'networkidle' });
  const kept = (await page.$$('.step.is-done')).length;
  if (kept !== 2) throw new Error(`kept ${kept} of 2`);
});
await shot('8-practice');

await step('no screen scrolls sideways at 390px', async () => {
  for (const hash of ['#today', '#read', '#reflect', '#make', '#world', '#explore', '#practice']) {
    await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 0) throw new Error(`${hash} overflows by ${overflow}px`);
  }
});

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} problem(s):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nAll green. No page errors, no console errors.');
