import { esc, backLink, icon, screen } from '../ui.js';
import { feelings, MAX_FEELINGS } from '../core.js';

export function html(ctx) {
  const { state } = ctx;
  const chosen = state.draft.feelings;
  const atLimit = chosen.length >= MAX_FEELINGS;

  const chips = feelings
    .map((feeling) => {
      const on = chosen.includes(feeling.id);
      return `<button type="button" class="chip${on ? ' is-on' : ''}" data-feeling="${esc(feeling.id)}"
        aria-pressed="${on}"${!on && atLimit ? ' data-full="true"' : ''}>${esc(feeling.label)}</button>`;
    })
    .join('');

  const body = `
    <header class="bar">
      <div class="row-between">
        ${backLink('read')}
        <span class="eyebrow private">${icon('lock', 'icon-sm')} Reflect · only you see this</span>
        <span class="bar-spacer"></span>
      </div>
    </header>

    <div class="pane">
      <label class="display-sm" for="reflection">${esc(state.content.reflect)}</label>
      <textarea id="reflection" maxlength="3000"
        placeholder="One word, one line, or nothing at all.">${esc(state.draft.response)}</textarea>
      <p class="muted-sm" id="save-state" role="status">This stays on this device. It is never sent to the painting model and nothing reads it but you.</p>

      <fieldset class="feelings">
        <legend class="kicker muted">How did it feel? Pick up to ${MAX_FEELINGS}.</legend>
        <div class="chips">${chips}</div>
        <p class="muted-sm">These choose the colours you will paint with. Nothing else reads them.</p>
      </fieldset>
    </div>

    <div class="pane-actions">
      <button type="button" id="to-make" class="button primary">Save and make today's portrait</button>
      <button type="button" id="save-only" class="button plain">Save without a portrait</button>
    </div>`;

  return screen({ route: 'today', body, tabs: false, ground: 'indigo' });
}

export function mount(ctx) {
  const { state, actions, go } = ctx;
  const field = document.getElementById('reflection');
  const saveState = document.getElementById('save-state');

  // Autosave. The label promises the writing is kept on this device, so it has
  // to be true before the person presses anything.
  let timer;
  field.oninput = () => {
    actions.setDraft({ response: field.value });
    saveState.textContent = 'Saving…';
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const ok = await actions.persistDraft();
      saveState.textContent = ok
        ? 'Saved on this device.'
        : 'Could not save to this browser. Copy your words somewhere safe.';
    }, 600);
  };

  field.onblur = () => {
    clearTimeout(timer);
    actions.persistDraft();
  };

  for (const button of document.querySelectorAll('[data-feeling]')) {
    button.onclick = () => {
      const id = button.dataset.feeling;
      const chosen = state.draft.feelings;
      const next = chosen.includes(id)
        ? chosen.filter((f) => f !== id)
        : [...chosen, id].slice(-MAX_FEELINGS);
      actions.setDraft({ feelings: next });
      actions.persistDraft();
      actions.rerender();
    };
  }

  document.getElementById('to-make').onclick = async () => {
    await actions.persistDraft();
    go('make');
  };

  document.getElementById('save-only').onclick = async () => {
    await actions.keepWithoutPortrait();
    go('world');
  };
}
