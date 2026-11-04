import { esc, icon, screen } from '../ui.js';
import { ways } from '../core.js';

export function html(ctx) {
  const { state } = ctx;
  const kind = state.practiceKind;
  const practice = state.content.ways[kind];
  const steps = kind === 'drift' ? practice.lines : practice.steps;
  const done = state.draft.practice[kind] || [];
  const accent = ways[kind].accent;

  const switcher = ['drift', 'wander']
    .map(
      (id) => `<button type="button" class="chip${id === kind ? ' is-on' : ''}" data-kind="${esc(id)}"
        aria-pressed="${id === kind}">${esc(ways[id].label)}</button>`,
    )
    .join('');

  // Real buttons with a pressed state, rather than press-and-hold. Holding is
  // pleasant but it shuts out anyone using a keyboard, a switch or a shaky
  // hand, and a tick is just as deliberate.
  const list = steps
    .map((text, i) => {
      const on = done.includes(i);
      return `<li>
        <button type="button" class="step${on ? ' is-done' : ''}" data-step="${i}" aria-pressed="${on}">
          <span class="step-box">${on ? icon('tick', 'icon-sm') : `<span class="step-n">${i + 1}</span>`}</span>
          <span class="step-text">${esc(text)}</span>
        </button>
      </li>`;
    })
    .join('');

  const complete = done.length === steps.length;

  const body = `
    <div class="pane" data-css="--accent:${esc(accent)}">
      <p class="eyebrow">Practice · ${esc(ways[kind].label)} · ${practice.minutes} min</p>
      <h1 class="display-sm">${esc(practice.title)}</h1>
      <div class="chips">${switcher}</div>
      <p class="muted-sm">${esc(
        kind === 'drift'
          ? 'A guided sequence, written to be read slowly, one line at a time. Narrated audio is not in this version.'
          : 'Do these outside, in any order, at whatever pace suits the walk.',
      )}</p>
      <ol class="steps">${list}</ol>
      ${
        complete
          ? `<p class="prose-sm done-note">That is the whole sequence. ${esc(
              kind === 'drift' ? 'Sit for a moment before you go back.' : 'Nothing to log and nothing to keep up.',
            )}</p>
         <a class="button primary" href="#reflect">Write today down</a>`
          : ''
      }
    </div>`;

  return screen({ route: 'practice', body });
}

export function mount(ctx) {
  const { state, actions } = ctx;
  const kind = state.practiceKind;

  for (const button of document.querySelectorAll('[data-kind]')) {
    button.onclick = () => actions.setPracticeKind(button.dataset.kind);
  }

  for (const button of document.querySelectorAll('[data-step]')) {
    button.onclick = () => {
      const index = Number(button.dataset.step);
      const done = state.draft.practice[kind] || [];
      const next = done.includes(index) ? done.filter((i) => i !== index) : [...done, index];
      actions.setPracticeDone(kind, next);
    };
  }
}
