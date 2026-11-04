import {
  dayForDate,
  derivePalette,
  localDay,
  scenePrompt,
  shareText,
  titleFor,
  defaults,
} from './core.js';
import { dayById } from './content.js';
import * as store from './store.js';
import { describePainting, planPainting, renderToBlob } from './painter.js';

import * as todayView from './views/today.js';
import * as readView from './views/read.js';
import * as reflectView from './views/reflect.js';
import * as makeView from './views/make.js';
import * as portraitView from './views/portrait.js';
import * as worldView from './views/world.js';
import * as exploreView from './views/explore.js';
import * as practiceView from './views/practice.js';

const VIEWS = {
  today: todayView,
  read: readView,
  reflect: reflectView,
  make: makeView,
  portrait: portraitView,
  world: worldView,
  explore: exploreView,
  practice: practiceView,
};

const main = document.getElementById('main');
const noticeEl = document.getElementById('notice');

const state = {
  day: localDay(),
  content: null,
  reading: null,
  prefs: { ...defaults },
  piece: null,
  viewing: null,
  pieces: [],
  chapter: null,
  route: 'today',
  readSlide: 0,
  practiceKind: 'drift',
  portraitUrl: null,
  status: { configured: false, painter: 'local' },
  draft: { response: '', feelings: [], practice: {} },
  storageOk: true,
};

// ── notices ──────────────────────────────────────────────────────────────

let noticeTimer;
function notify(text) {
  noticeEl.textContent = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    noticeEl.textContent = '';
  }, 7000);
}

// ── boot ─────────────────────────────────────────────────────────────────

async function boot() {
  state.content = dayForDate(state.day);
  state.reading = state.content;

  try {
    await store.open();
    const [prefs, chapters, pieces] = await Promise.all([
      store.meta.get('preferences'),
      store.meta.get('chapters'),
      store.pieces.all(),
    ]);
    state.prefs = { ...defaults, ...(prefs || {}) };
    state.pieces = pieces || [];
    state.chapter = resolveChapter(chapters);
  } catch {
    state.storageOk = false;
    state.chapter = newChapter(state.day);
    notify('This browser will not let INNERWORLD store anything. You can look around, but nothing will be saved.');
  }

  state.piece = state.pieces.find((p) => p.day === state.day) || null;
  state.viewing = state.piece;
  if (state.piece) {
    state.draft = {
      response: state.piece.response || '',
      feelings: state.piece.feelings || [],
      practice: state.piece.practice || {},
    };
  }

  // IndexedDB writes are asynchronous, so a tap or keystroke immediately
  // before the tab closes can be lost. Every change is also mirrored to
  // localStorage, which writes synchronously; if that mirror is newer than
  // what the database holds, it wins.
  const mirror = readMirror();
  if (mirror && (!state.piece || (mirror.savedAt || 0) > (state.piece.updatedAt || 0))) {
    state.draft = { response: mirror.response, feelings: mirror.feelings, practice: mirror.practice };
    persistDraftNow();
  }

  await refreshStatus();
  await loadPortraitUrl();

  window.addEventListener('hashchange', onRoute);
  onRoute();
}

function resolveChapter(chapters) {
  if (chapters && chapters.current) return chapters.current;
  const chapter = newChapter(state.day);
  store.meta.set('chapters', { current: chapter }).catch(() => {});
  return chapter;
}

function newChapter(start) {
  return { id: `chapter-${start}`, title: 'Chapter one', name: 'A beginning', start };
}

async function refreshStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('unavailable');
    const status = await response.json();
    state.status = { configured: Boolean(status.configured), painter: status.painter || 'local' };
  } catch {
    // No server, or a static preview. On-device painting still works, so this
    // is not an error worth putting in front of anyone.
    state.status = { configured: false, painter: 'local' };
  }
  if (!state.status.configured && state.prefs.painter === 'model') {
    state.prefs.painter = 'local';
  }
}

// ── routing ──────────────────────────────────────────────────────────────

function onRoute() {
  const hash = (location.hash || '#today').slice(1);
  const [name, param] = hash.split('/');

  if (name === 'day' && dayById[param]) {
    state.reading = dayById[param];
    state.readSlide = 0;
    state.route = 'read';
  } else if (name === 'piece' && param) {
    const piece = state.pieces.find((p) => p.id === param);
    if (piece) {
      state.viewing = piece;
      state.route = 'portrait';
      loadPortraitUrl().then(render);
      return;
    }
    state.route = 'world';
  } else if (VIEWS[name]) {
    state.route = name;
    if (name === 'portrait') state.viewing = state.piece;
    if (name === 'read' && state.reading !== state.content) {
      // Coming back to Read without a day in the URL means today's.
      state.reading = state.content;
    }
  } else {
    state.route = 'today';
  }

  render();
  main.focus();
}

function go(route) {
  if (location.hash === `#${route}`) {
    render();
    return;
  }
  location.hash = route;
}

// ── render ───────────────────────────────────────────────────────────────

const ctx = { state, actions: {}, go };

let lastRoute = null;

function render() {
  const view = VIEWS[state.route] || VIEWS.today;
  const changedScreen = lastRoute !== state.route;
  lastRoute = state.route;

  main.innerHTML = view.html(ctx);
  applyDynamicStyles(main);

  // Only a change of screen animates. Re-rendering in place — turning a page,
  // pressing a chip — must not move the control under the reader's finger.
  main.classList.remove('entering');
  if (changedScreen) {
    void main.offsetWidth;
    main.classList.add('entering');
  }

  if (view.mount) view.mount(ctx);
}

// Pigment colours are data, so they cannot live in the stylesheet, and a
// parsed inline style attribute would need 'unsafe-inline' in the policy.
// Setting them through CSSOM keeps both script-src and style-src at 'self'.
const SAFE_DECLARATION = /^[-a-z]+:[#a-z0-9().,%\s-]+$/i;

function applyDynamicStyles(container) {
  for (const element of container.querySelectorAll('[data-css]')) {
    for (const declaration of element.dataset.css.split(';')) {
      if (!declaration.trim() || !SAFE_DECLARATION.test(declaration.trim())) continue;
      const split = declaration.indexOf(':');
      element.style.setProperty(declaration.slice(0, split).trim(), declaration.slice(split + 1).trim());
    }
  }
}

// ── actions ──────────────────────────────────────────────────────────────

Object.assign(ctx.actions, {
  rerender: render,

  setReadSlide(index) {
    state.readSlide = index;
    render();
  },

  setPracticeKind(kind) {
    state.practiceKind = kind;
    render();
  },

  async setPracticeDone(kind, done) {
    state.draft.practice = { ...state.draft.practice, [kind]: done };
    writeMirror();
    render();
    await ctx.actions.persistDraft();
  },

  async setPref(key, value) {
    state.prefs = { ...state.prefs, [key]: value };
    render();
    try {
      await store.meta.set('preferences', state.prefs);
    } catch {
      notify('Could not save that preference in this browser.');
    }
  },

  setDraft(patch) {
    state.draft = { ...state.draft, ...patch };
    writeMirror();
  },

  // Writing is saved as it is typed. The Reflect screen says the words stay on
  // this device, so they have to actually be there before anything is pressed.
  // Writes are queued rather than fired in parallel, so a run of quick taps
  // cannot land out of order and commit older state last.
  persistDraft() {
    writeQueue = writeQueue.then(persistDraftNow, persistDraftNow);
    return writeQueue;
  },

  async paintToday() {
    const piece = ensureTodayPiece();
    const palette = derivePalette(state.content, state.draft.feelings);
    piece.palette = palette.pigments.map((p) => p.key);
    piece.mark = state.prefs.mark;
    piece.variant = 0;
    piece.title = piece.title || titleFor(state.content, palette);
    piece.line = state.content.question;
    piece.response = state.draft.response;
    piece.feelings = state.draft.feelings;
    piece.question = state.content.question;

    if (state.prefs.painter === 'model' && state.status.configured) {
      await paintWithModel(piece, palette);
    } else {
      await paintOnDevice(piece, palette);
    }

    piece.painting = true;
    await savePiece(piece);
    state.viewing = piece;
    await loadPortraitUrl();
  },

  async repaintToday() {
    const piece = state.piece;
    if (!piece) return;
    const palette = derivePalette(state.content, piece.feelings || []);
    piece.variant = (piece.variant || 0) + 1;
    piece.mark = state.prefs.mark;
    if (piece.painter === 'model' && state.status.configured) {
      await paintWithModel(piece, palette);
    } else {
      await paintOnDevice(piece, palette);
    }
    await savePiece(piece);
    store.releaseImageUrl(piece.id);
    await loadPortraitUrl();
  },

  async keepToday() {
    const piece = state.piece;
    if (!piece) return false;
    piece.kept = true;
    piece.chapter = state.chapter.id;
    const ok = await savePiece(piece);
    if (ok) notify(`Kept in ${state.chapter.name}.`);
    return ok;
  },

  async keepWithoutPortrait() {
    const piece = ensureTodayPiece();
    piece.kept = true;
    piece.chapter = state.chapter.id;
    piece.title = piece.title || 'A quiet day';
    piece.line = state.content.question;
    piece.response = state.draft.response;
    piece.feelings = state.draft.feelings;
    const ok = await savePiece(piece);
    notify(ok ? 'Saved. No portrait today, which is fine.' : 'Could not save in this browser.');
    return ok;
  },

  async removePiece(id) {
    try {
      await store.removePiece(id);
      state.pieces = state.pieces.filter((p) => p.id !== id);
      if (state.piece && state.piece.id === id) {
        state.piece = null;
        state.draft = { response: '', feelings: [], practice: {} };
      }
      notify('Removed from this device.');
    } catch {
      notify('Could not remove that piece.');
    }
  },

  // Only ever the title and the line — never the reflection, never the
  // feeling words.
  async sharePiece(piece) {
    const text = shareText(piece);
    if (!window.confirm('Share only the title and the question? Your reflection and feeling words are not included.')) {
      return { message: '' };
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: piece.title, text });
        return { message: 'Shared.' };
      }
      await navigator.clipboard.writeText(text);
      return { message: 'Copied the title and question to your clipboard.' };
    } catch (error) {
      if (error && error.name === 'AbortError') return { message: '' };
      return { message: 'Sharing did not finish. Your piece is still here.' };
    }
  },

  async renameChapter() {
    const name = window.prompt('What would you call this chapter?', state.chapter.name);
    if (name == null) return;
    const trimmed = name.trim().slice(0, 80);
    if (!trimmed) return;
    state.chapter = { ...state.chapter, name: trimmed };
    try {
      await store.meta.set('chapters', { current: state.chapter });
    } catch {
      notify('Could not save the new name in this browser.');
    }
    render();
  },

  async exportBackup() {
    if (!window.confirm('This backup includes your reflections in plain text. Download it to this device?')) return;
    try {
      const payload = await store.exportBackup({ includeImages: true });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      download(`innerworld-backup-${state.day}.json`, blob);
      notify('Backup downloaded. Keep it somewhere safe.');
    } catch {
      notify('Could not build a backup. Free some browser storage and try again.');
    }
  },
});

// ── painting ─────────────────────────────────────────────────────────────

// localStorage can be unavailable (private windows, blocked site data), and
// the accessor itself can throw. It is a convenience mirror, never the record,
// so every use is guarded and the app works without it.
const MIRROR_KEY = 'innerworld:draft';

function writeMirror() {
  try {
    window.localStorage.setItem(
      MIRROR_KEY,
      JSON.stringify({ day: state.day, savedAt: Date.now(), ...state.draft }),
    );
  } catch {
    // No mirror available. IndexedDB remains the record.
  }
}

function readMirror() {
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.day !== state.day) return null;
    return {
      savedAt: parsed.savedAt || 0,
      response: typeof parsed.response === 'string' ? parsed.response : '',
      feelings: Array.isArray(parsed.feelings) ? parsed.feelings : [],
      practice: parsed.practice && typeof parsed.practice === 'object' ? parsed.practice : {},
    };
  } catch {
    return null;
  }
}

let writeQueue = Promise.resolve(true);

async function persistDraftNow() {
  if (!state.storageOk) return false;
  const piece = ensureTodayPiece();
  piece.response = state.draft.response;
  piece.feelings = state.draft.feelings;
  piece.practice = state.draft.practice;
  piece.visited = Array.from(new Set([...(piece.visited || []), state.route]));
  piece.updatedAt = Date.now();
  try {
    await store.pieces.put(piece);
    upsertPiece(piece);
    return true;
  } catch {
    return false;
  }
}

async function paintOnDevice(piece, palette) {
  const plan = planPainting({
    day: piece.day,
    palette: piece.palette,
    mark: piece.mark,
    variant: piece.variant || 0,
  });
  const blob = await renderToBlob(plan, (w, h) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  });
  if (!blob) throw new Error('This browser could not render the painting.');
  await store.images.put(piece.id, blob);
  piece.painter = 'local';
  piece.seed = plan.seed;
  piece.prompt = null;
  piece.alt = describePainting(plan, palette.pigments);
  piece.why = `${palette.why} Painted on your device, so nothing was sent anywhere. The same day and palette always give the same picture; Repaint moves to the next variation.`;
}

async function paintWithModel(piece, palette) {
  const prompt = scenePrompt(state.content, palette, piece.mark);
  const response = await fetch('/api/paint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(240_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The painting model could not be reached.');

  const blob = await (await fetch(result.image)).blob();
  await store.images.put(piece.id, blob);
  piece.painter = 'model';
  piece.seed = null;
  piece.prompt = prompt;
  piece.alt = `An abstract painting in ${palette.pigments
    .slice(0, 3)
    .map((p) => p.name.toLowerCase())
    .join(', ')}, made for today's question.`;
  piece.why = `${palette.why} A painting model made the image from the prompt below. Your reflection was not part of it.`;
}

async function loadPortraitUrl() {
  const piece = state.viewing;
  state.portraitUrl = null;
  if (!piece || !piece.painting) return;
  try {
    state.portraitUrl = await store.imageUrl(piece.id);
  } catch {
    state.portraitUrl = null;
  }
}

// ── piece bookkeeping ────────────────────────────────────────────────────

function ensureTodayPiece() {
  if (state.piece) return state.piece;
  state.piece = {
    id: newId(),
    day: state.day,
    dayId: state.content.id,
    question: state.content.question,
    title: '',
    line: state.content.question,
    response: '',
    feelings: [],
    practice: {},
    palette: [],
    mark: state.prefs.mark,
    painting: false,
    kept: false,
    chapter: null,
    visited: [],
    createdAt: new Date().toISOString(),
  };
  state.viewing = state.piece;
  upsertPiece(state.piece);
  return state.piece;
}

function newId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `piece-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function savePiece(piece) {
  upsertPiece(piece);
  if (!state.storageOk) return false;
  try {
    await store.pieces.put(piece);
    return true;
  } catch {
    return false;
  }
}

function upsertPiece(piece) {
  const index = state.pieces.findIndex((p) => p.id === piece.id);
  if (index === -1) state.pieces = [piece, ...state.pieces];
  else state.pieces[index] = piece;
}

function download(name, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// ── dialogs in the shell ─────────────────────────────────────────────────

for (const button of document.querySelectorAll('[data-open-dialog]')) {
  button.onclick = () => document.getElementById(button.dataset.openDialog).showModal();
}
for (const button of document.querySelectorAll('[data-close-dialog]')) {
  button.onclick = () => document.getElementById(button.dataset.closeDialog).close();
}

window.addEventListener('pagehide', () => {
  ctx.actions.persistDraft();
  store.releaseAllImageUrls();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') ctx.actions.persistDraft();
});

boot();
