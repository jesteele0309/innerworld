import { esc, icon, screen } from '../ui.js';
import { chapterDays, chapterPalette, chapterSummary, formatDay, pigments } from '../core.js';

export function html(ctx) {
  const { state } = ctx;
  const mine = state.pieces.filter((p) => p.chapter === state.chapter.id);
  const summary = chapterSummary(state.chapter, state.pieces);
  const grid = chapterDays(state.chapter, state.pieces, state.day);
  const colours = chapterPalette(mine);

  const cells = grid
    .map((cell) => {
      if (cell.state === 'upcoming') {
        return `<span class="day is-upcoming" role="listitem" aria-label="${esc(
          formatDay(cell.day),
        )}, still to come"></span>`;
      }
      if (cell.state === 'open') {
        return `<a class="day is-open is-today" role="listitem" href="#today"
          aria-label="${esc(formatDay(cell.day))}, today, still open"></a>`;
      }
      if (cell.state === 'quiet') {
        return `<span class="day is-quiet" role="listitem" aria-label="${esc(
          formatDay(cell.day),
        )}, a quiet day"></span>`;
      }
      const lead = (cell.piece.palette || []).find((key) => pigments[key]);
      const accent = lead ? pigments[lead].hex : '#C8913A';
      return `<a class="day is-portrait${cell.isToday ? ' is-today' : ''}" role="listitem"
        href="#piece/${esc(cell.piece.id)}"
        aria-label="${esc(formatDay(cell.day))}, ${esc(cell.piece.title)}"
        data-css="--accent:${esc(accent)}"><span class="day-form"></span></a>`;
    })
    .join('');

  const bar = colours.length
    ? `<div class="colour-bar" role="img" aria-label="${esc(
        colours.map((c) => `${c.name} ${c.share}%`).join(', '),
      )}">${colours
        .map((c) => `<span data-css="width:${c.share}%;background:${esc(c.hex)}"></span>`)
        .join('')}</div>
      <div class="colour-key">${colours
        .map((c) => `<span>${esc(c.name)} ${c.share}%</span>`)
        .join('')}</div>`
    : '<p class="muted-sm">Your colours will show here once you have kept a portrait or two.</p>';

  const body = `
    <div class="pane">
      <div class="row-between">
        <p class="eyebrow">${esc(state.chapter.title)} · ${esc(formatDay(state.chapter.start))} – now</p>
        <button type="button" id="rename" class="link">Rename</button>
      </div>
      <h1 class="display">${esc(state.chapter.name)}</h1>
      <p class="prose-sm">${esc(summary.line)}</p>

      <div class="day-grid" role="list" aria-label="Days in this chapter">${cells}</div>

      <section class="panel">
        <p class="kicker muted">Your colours this chapter</p>
        ${bar}
      </section>

      <div class="stack-sm">
        <button type="button" id="print" class="row-action">
          <span class="stack-xs">
            <span class="row-action-title">Print this chapter</span>
            <span class="muted-sm">${mine.length} portrait${
              mine.length === 1 ? '' : 's'
            } with your titles and lines. Your reflections are left out.</span>
          </span>
          ${icon('forward')}
        </button>
        <button type="button" id="backup" class="row-action">
          <span class="stack-xs">
            <span class="row-action-title">Export a private backup</span>
            <span class="muted-sm">A JSON file that does include your reflections. Keep it somewhere safe.</span>
          </span>
          ${icon('forward')}
        </button>
      </div>

      <p class="muted-sm">Stored in this browser on this device, not encrypted and not in an account. Clearing browser data removes it.</p>
    </div>`;

  return screen({ route: 'world', body });
}

export function mount(ctx) {
  const { actions } = ctx;

  document.getElementById('rename').onclick = () => actions.renameChapter();
  document.getElementById('print').onclick = () => window.print();
  document.getElementById('backup').onclick = () => actions.exportBackup();
}
