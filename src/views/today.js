import { esc, icon, loopBars, screen } from '../ui.js';
import { formatDay, loopProgress, pigments, ways } from '../core.js';

export function html(ctx) {
  const { state } = ctx;
  const day = state.content;
  const pigment = pigments[day.pigment];
  const progress = loopProgress(state.piece);

  const waysIn = ['read', 'drift', 'wander']
    .map((kind) => {
      const way = day.ways[kind];
      const meta = ways[kind];
      const note = kind === 'read' ? `${meta.label} · ${way.minutes} min` : `${meta.label} · ${way.minutes} min · ${kindNote(kind)}`;
      return `<a class="wayin" href="#${kind === 'read' ? 'read' : 'practice'}">
        <span class="wayin-icon" data-css="background:${esc(meta.accent)}">${icon(kind, 'icon ink-dark')}</span>
        <span class="wayin-text">
          <span class="wayin-title">${esc(way.title)}</span>
          <span class="wayin-meta">${esc(note)}</span>
        </span>
      </a>`;
    })
    .join('');

  const body = `
    <div class="pane">
      <div class="row-between">
        <p class="eyebrow">${esc(formatDay(state.day, { weekday: 'long', month: 'short', day: 'numeric' }))}</p>
        ${loopBars(progress)}
      </div>

      <div class="stack-sm">
        <p class="kicker">Today's question</p>
        <h1 class="display">${esc(day.question)}</h1>
      </div>

      <div class="pigment-card">
        <span class="pigment-swatch" data-css="background:${esc(pigment.hex)}"></span>
        <span class="stack-xs">
          <span class="eyebrow">Pigment of the day</span>
          <span class="pigment-name">${esc(pigment.name)}</span>
          <span class="muted-sm">${esc(pigment.note)}</span>
        </span>
      </div>

      <div class="stack-sm">
        <p class="kicker muted">Three ways in</p>
        ${waysIn}
      </div>

      ${state.piece && state.piece.kept ? keptNote(state) : resumeNote(progress)}
    </div>`;

  return screen({ route: 'today', body });
}

function kindNote(kind) {
  return kind === 'drift' ? 'guided, read at your own pace' : 'outside, on foot';
}

function keptNote(state) {
  return `<a class="resume" href="#portrait">
    <span class="stack-xs">
      <span class="resume-title">${esc(state.piece.title)}</span>
      <span class="muted-sm">Kept in ${esc(state.chapter.title)} · open it again</span>
    </span>
    ${icon('forward')}
  </a>`;
}

function resumeNote(progress) {
  const next = {
    notice: ['Start anywhere above', 'There is no right order, and no need to do all three.'],
    reflect: ['Write today down', 'You read something. The next step is yours.'],
    make: ['Paint today', 'Your words and the palette are ready.'],
    keep: ['Keep today', "Today's portrait is waiting to go in your chapter."],
  }[progress.step];
  const href = { notice: 'read', reflect: 'reflect', make: 'make', keep: 'portrait' }[progress.step];
  return `<a class="resume" href="#${href}">
    <span class="stack-xs">
      <span class="resume-title">${esc(next[0])}</span>
      <span class="muted-sm">${esc(next[1])}</span>
    </span>
    ${icon('forward')}
  </a>`;
}

export function mount() {}
