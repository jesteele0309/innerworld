import { esc, backLink, icon, screen } from '../ui.js';
import { derivePalette, markStyles, readableInk } from '../core.js';

export function html(ctx) {
  const { state } = ctx;
  const palette = derivePalette(state.content, state.draft.feelings);

  const swatches = palette.pigments
    .map(
      (pigment, i) => `<div class="swatch">
        <span class="swatch-dot${i === 0 ? ' is-lead' : ''}" data-css="background:${esc(pigment.hex)};color:${esc(
        readableInk(pigment.hex),
      )}"></span>
        <span class="swatch-name">${esc(pigment.name)}</span>
      </div>`,
    )
    .join('');

  const marks = markStyles
    .map(
      (mark) => `<button type="button" class="mark${state.prefs.mark === mark.id ? ' is-on' : ''}"
        data-mark="${esc(mark.id)}" aria-pressed="${state.prefs.mark === mark.id}">
        <span class="mark-label">${esc(mark.label)}</span>
        <span class="mark-note">${esc(mark.note)}</span>
      </button>`,
    )
    .join('');

  const quote = state.draft.response.trim()
    ? `<blockquote class="quote">${esc(firstSentence(state.draft.response))}</blockquote>`
    : `<p class="muted-sm">You wrote nothing today, which is allowed. The painting will come from the question and the palette alone.</p>`;

  const painterChoice = state.status.configured
    ? `<fieldset class="painters">
        <legend class="kicker muted">Who paints it</legend>
        <div class="chips">
          <button type="button" class="chip${state.prefs.painter === 'local' ? ' is-on' : ''}"
            data-painter="local" aria-pressed="${state.prefs.painter === 'local'}">On this device</button>
          <button type="button" class="chip${state.prefs.painter === 'model' ? ' is-on' : ''}"
            data-painter="model" aria-pressed="${state.prefs.painter === 'model'}">Painting model</button>
        </div>
      </fieldset>`
    : '';

  const body = `
    <header class="bar">
      <div class="row-between">
        ${backLink('reflect')}
        <span class="eyebrow">Make</span>
        <span class="bar-spacer"></span>
      </div>
    </header>

    <div class="pane">
      <h1 class="display-sm">Today's palette</h1>
      <div class="swatches">${swatches}</div>

      <p class="muted-sm palette-why">${esc(palette.why)}</p>

      <fieldset class="marks">
        <legend class="kicker muted">Mark style</legend>
        <div class="mark-row">${marks}</div>
      </fieldset>

      ${quote}
      ${painterChoice}
    </div>

    <div class="pane-actions">
      <p class="disclosure">${icon('info', 'icon-sm')}<span>${esc(disclosure(state))}</span></p>
      <button type="button" id="paint" class="button primary">Paint my day</button>
      <p class="muted-sm" id="paint-state" role="status"></p>
    </div>`;

  return screen({ route: 'today', body, tabs: false });
}

function disclosure(state) {
  if (state.prefs.painter === 'model' && state.status.configured) {
    return 'The painting model receives only the question, the palette and the mark style — never your words. Everything you read in INNERWORLD is written by people.';
  }
  return 'This painting is made on your device from the palette and the mark style. Nothing leaves this machine.';
}

function firstSentence(text) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const stop = trimmed.search(/[.!?](\s|$)/);
  const sentence = stop > 20 ? trimmed.slice(0, stop + 1) : trimmed;
  return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
}

export function mount(ctx) {
  const { state, actions, go } = ctx;

  for (const button of document.querySelectorAll('[data-mark]')) {
    button.onclick = () => {
      actions.setPref('mark', button.dataset.mark);
    };
  }

  for (const button of document.querySelectorAll('[data-painter]')) {
    button.onclick = () => {
      actions.setPref('painter', button.dataset.painter);
    };
  }

  const paint = document.getElementById('paint');
  const status = document.getElementById('paint-state');

  paint.onclick = async () => {
    paint.disabled = true;
    status.textContent =
      state.prefs.painter === 'model'
        ? 'Painting. This can take a few minutes — keep this tab open.'
        : 'Painting…';
    try {
      await actions.paintToday();
      go('portrait');
    } catch (error) {
      status.textContent = error.message;
      paint.disabled = false;
    }
  };
}
