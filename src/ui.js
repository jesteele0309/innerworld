import { escapeHTML as esc } from './core.js';

export { esc };

// Icons are inline so the app needs no icon font and no network. Decorative
// ones are hidden from assistive tech; a meaningful one gets a label from the
// control that holds it.
export const icons = {
  today:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  explore:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  practice:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 20c4-1 6-5 6-9M10 11c0-4 3-7 7-7 0 4-3 7-7 7z"/></svg>',
  world:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  read:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z"/></svg>',
  drift:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
  wander:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3"/><path d="M8 11l3-3 3 2 3 1"/><path d="M11 8l-1 6"/></svg>',
  back:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  forward:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  lock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  tick:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4 10-10"/></svg>',
};

export function icon(name, className = 'icon') {
  return `<span class="${className}">${icons[name] || ''}</span>`;
}

// Every tab carries its label at all times. An icon-only tab bar makes people
// learn four abstract glyphs before they can navigate.
const TABS = [
  { route: 'today', label: 'Today', icon: 'today' },
  { route: 'explore', label: 'Explore', icon: 'explore' },
  { route: 'practice', label: 'Practice', icon: 'practice' },
  { route: 'world', label: 'My World', icon: 'world' },
];

export function tabBar(current) {
  const items = TABS.map((tab) => {
    const active = tab.route === current;
    return `<a href="#${tab.route}" class="tab${active ? ' is-current' : ''}"${active ? ' aria-current="page"' : ''}>
      ${icon(tab.icon, 'tab-icon')}<span>${esc(tab.label)}</span>
    </a>`;
  }).join('');
  return `<nav class="tabs" aria-label="Main">${items}</nav>`;
}

export function backLink(href, label = 'Back') {
  return `<a class="iconbutton" href="#${href}" aria-label="${esc(label)}">${icon('back')}</a>`;
}

// Four bars: notice, reflect, make, keep. Progress through one day, never a
// run of days — there is nothing here to break.
export function loopBars(progress) {
  const steps = [
    ['notice', 'Notice'],
    ['reflect', 'Reflect'],
    ['make', 'Make'],
    ['keep', 'Keep'],
  ];
  const done = steps.filter(([id]) => progress.done.includes(id)).map(([, label]) => label);
  const label = done.length ? `Today's loop: ${done.join(', ')} done` : "Today's loop: not started";
  const bars = steps
    .map(([id]) => `<span class="loop-bar${progress.done.includes(id) ? ' is-done' : ''}"></span>`)
    .join('');
  return `<span class="loop" role="img" aria-label="${esc(label)}">${bars}</span>`;
}

export function pigmentChip(pigment, ink) {
  return `<span class="pigment-chip"><span class="dot" data-css="background:${esc(pigment.hex)};${
    ink ? `box-shadow:0 0 0 1px ${esc(ink)}` : ''
  }"></span>${esc(pigment.name)}</span>`;
}

export function screen({ route, body, tabs = true, ground = '', paged = false }) {
  const classes = ['screen', ground ? `ground-${ground}` : '', paged ? 'is-paged' : ''].filter(Boolean).join(' ');
  return `<div class="${classes}">${body}${tabs ? tabBar(route) : ''}</div>`;
}
