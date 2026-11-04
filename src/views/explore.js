import { esc, screen } from '../ui.js';
import { days, pigments, ways } from '../core.js';

export function html(ctx) {
  const { state } = ctx;

  const cards = days
    .map((day) => {
      const pigment = pigments[day.pigment];
      const isToday = day.id === state.content.id;
      const mix = ['read', 'drift', 'wander']
        .map(
          (kind) =>
            `<span class="way-dot" data-css="background:${esc(ways[kind].accent)}" title="${esc(
              ways[kind].label,
            )}"></span>`,
        )
        .join('');
      return `<a class="question-card" href="#day/${esc(day.id)}">
        <span class="question-swatch" data-css="background:${esc(pigment.hex)}"></span>
        <span class="question-text">
          <span class="question-title">${esc(day.question)}</span>
          <span class="question-meta">${esc(pigment.name)} · ${mix ? '' : ''}3 ways in${
            isToday ? ' · today' : ''
          }</span>
          <span class="way-dots">${mix}</span>
        </span>
      </a>`;
    })
    .join('');

  const body = `
    <div class="pane">
      <p class="eyebrow">Explore</p>
      <h1 class="display">Every question, and the colour it brings.</h1>
      <p class="prose-sm">${days.length} questions so far. One arrives each day; you can read any of them whenever you like, in any order.</p>
      <div class="question-list">${cards}</div>
    </div>`;

  return screen({ route: 'explore', body });
}

export function mount() {}
