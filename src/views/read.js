import { esc, backLink, screen } from '../ui.js';

export function html(ctx) {
  const { state } = ctx;
  const piece = state.reading.ways.read;
  const index = Math.min(state.readSlide, piece.slides.length - 1);
  const slide = piece.slides[index];
  const last = index === piece.slides.length - 1;

  const pips = piece.slides
    .map(
      (_, i) =>
        `<span class="pip${i <= index ? ' is-done' : ''}"></span>`,
    )
    .join('');

  // The artwork is a labelled placeholder until a real public-domain image is
  // chosen and its credit verified. A wrong credit would be worse.
  const figure = state.prefs.textOnly
    ? ''
    : `<figure class="plate">
        <div class="plate-slot">
          <span class="mono-sm">[ARTWORK]<br>Public-domain painting chosen for this day</span>
        </div>
        <figcaption class="credit">${esc(piece.art.artist)}. <em>${esc(piece.art.title)}</em>, ${esc(
        piece.art.year,
      )}. Image courtesy ${esc(piece.art.museum)}, public domain.</figcaption>
      </figure>`;

  const body = `
    <header class="bar">
      <div class="row-between">
        ${backLink('today', 'Back to today')}
        <div class="bar-tools">
          <button type="button" id="text-size" class="pill" aria-label="Text size, currently ${esc(
            sizeLabel(state.prefs.textSize),
          )}">Aa</button>
          <button type="button" id="text-only" class="pill" aria-pressed="${state.prefs.textOnly}">Text only</button>
        </div>
      </div>
      <div class="pips" role="img" aria-label="Section ${index + 1} of ${piece.slides.length}">${pips}</div>
    </header>

    <div class="pane reading" data-size="${esc(String(state.prefs.textSize))}">
      ${figure}
      <h2 class="display-sm">${esc(slide.heading)}</h2>
      <p class="prose">${esc(slide.body)}</p>
      <p class="muted-sm">Written by ${esc(piece.writer)} · Human-made. Everything you read in INNERWORLD is written by people.</p>
    </div>

    <div class="pane-actions two-up">
      <button type="button" id="prev" class="button ghost"${index === 0 ? ' disabled' : ''}>Previous</button>
      <button type="button" id="next" class="button primary">${last ? 'Reflect on this' : 'Next'}</button>
    </div>`;

  return screen({ route: 'today', body, tabs: false, paged: true });
}

function sizeLabel(size) {
  return ['small', 'regular', 'large', 'largest'][size] || 'regular';
}

export function mount(ctx) {
  const { state, actions, go } = ctx;
  const piece = state.reading.ways.read;

  document.getElementById('prev').onclick = () => {
    if (state.readSlide > 0) actions.setReadSlide(state.readSlide - 1);
  };

  document.getElementById('next').onclick = () => {
    if (state.readSlide >= piece.slides.length - 1) {
      go('reflect');
      return;
    }
    actions.setReadSlide(state.readSlide + 1);
  };

  document.getElementById('text-size').onclick = () => {
    actions.setPref('textSize', (state.prefs.textSize + 1) % 4);
  };

  document.getElementById('text-only').onclick = () => {
    actions.setPref('textOnly', !state.prefs.textOnly);
  };
}
