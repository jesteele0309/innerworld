import { esc, backLink, pigmentChip, screen } from '../ui.js';
import { daysBetween, formatDay, pigments } from '../core.js';

export function html(ctx) {
  const { state } = ctx;
  const piece = state.viewing;
  const isToday = Boolean(piece) && piece.day === state.day;

  if (!piece || !piece.painting) {
    return screen({
      route: 'today',
      tabs: false,
      body: `<div class="pane empty">
        <h1 class="display-sm">Nothing painted yet today.</h1>
        <p class="prose">Start with the question, write a line, then make the portrait.</p>
        <a class="button primary" href="#today">Back to today</a>
      </div>`,
    });
  }

  const chips = (piece.palette || [])
    .filter((key) => pigments[key])
    .map((key) => pigmentChip(pigments[key], '#5A6296'))
    .join('');

  const dayNumber = daysBetween(state.chapter.start, piece.day) + 1;

  const body = `
    <div class="plate-full">
      <img id="portrait-image" src="${esc(state.portraitUrl || '')}" alt="${esc(piece.alt || 'Today’s painting.')}">
      ${backLink('today')}
    </div>

    <div class="pane tight">
      <p class="eyebrow">${esc(formatDay(piece.day))} · Day ${dayNumber} of ${esc(state.chapter.title)}</p>
      <h1 class="display-sm" id="portrait-title">${esc(piece.title)}</h1>
      ${
        piece.response
          ? `<p class="prose-sm">From your words: &ldquo;${esc(shorten(piece.response))}&rdquo;${
              piece.feelings && piece.feelings.length ? ` Felt ${esc(piece.feelings.join(', '))}.` : ''
            }</p>`
          : `<p class="prose-sm">Painted from today's question and palette. You wrote nothing, which is fine.</p>`
      }
      <div class="chips tight">${chips}</div>
      <details class="why">
        <summary>Why this?</summary>
        <p class="muted-sm">${esc(piece.why || '')}</p>
        ${
          piece.prompt
            ? `<p class="mono-sm prompt-dump">${esc(piece.prompt)}</p>`
            : '<p class="muted-sm">Made on your device. Nothing was sent anywhere.</p>'
        }
      </details>
    </div>

    <div class="pane-actions">
      ${
        isToday
          ? `<button type="button" id="keep" class="button primary">${
              piece.kept ? 'Kept in your chapter' : 'Keep in my chapter'
            }</button>
             <div class="two-up">
               <button type="button" id="repaint" class="button ghost">Repaint</button>
               <button type="button" id="share" class="button ghost">Share</button>
             </div>`
          : `<div class="two-up">
               <button type="button" id="share" class="button ghost">Share</button>
               <button type="button" id="remove" class="button ghost">Remove</button>
             </div>`
      }
      <p class="muted-sm" role="status" id="portrait-state"></p>
    </div>`;

  return screen({ route: 'today', body, tabs: false });
}

function shorten(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 120 ? `${clean.slice(0, 117)}…` : clean;
}

export function mount(ctx) {
  const { state, actions, go } = ctx;
  if (!state.viewing || !state.viewing.painting) return;

  const status = document.getElementById('portrait-state');
  const keep = document.getElementById('keep');
  const repaint = document.getElementById('repaint');
  const remove = document.getElementById('remove');

  if (keep) {
    keep.onclick = async () => {
      keep.disabled = true;
      const ok = await actions.keepToday();
      if (ok) {
        go('world');
        return;
      }
      keep.disabled = false;
      status.textContent = 'Could not save to this browser. Export a backup, or free some space.';
    };
  }

  if (repaint) {
    repaint.onclick = async () => {
      status.textContent = 'Repainting\u2026';
      try {
        await actions.repaintToday();
        actions.rerender();
      } catch (error) {
        status.textContent = error.message;
      }
    };
  }

  if (remove) {
    remove.onclick = async () => {
      if (!window.confirm('Remove this portrait from this device? Export a backup first if you want to keep it.')) return;
      await actions.removePiece(state.viewing.id);
      go('world');
    };
  }

  document.getElementById('share').onclick = async () => {
    const result = await actions.sharePiece(state.viewing);
    status.textContent = result.message;
  };
}
