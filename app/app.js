// app.js — the Leonida Platinum Atlas tracker: checklist, filters, spoiler shield,
// counters, detail pane and the tab wiring for the Roadmap and Missables views.
// Data comes from data/trophies.json (fetched once, same folder — the app itself
// never leaves app/). Progress lives in store.js.

import {
  loadState, saveState, isEarned, setEarned, getCount, setCount, reveal,
  exportState, importState,
} from './store.js';
import {
  el, gradeChip, kindLabel, isShielded, sourcesLine, buildRoadmap, buildMissables,
} from './views.js';

const state = loadState();
let trophies = [];
let selectedId = null;
let activeKind = 'all';

const listEl = document.getElementById('trophy-list');
const statusEl = document.getElementById('list-status');
const detailEl = document.getElementById('detail-pane');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade-filter');
const hideEarnedEl = document.getElementById('hide-earned');
const shieldEl = document.getElementById('spoiler-shield');

function persistAndRender() {
  saveState(state);
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function renderProgress() {
  const total = trophies.length;
  const earnedCount = trophies.filter((t) => isEarned(state, t.id)).length;
  const pct = total ? Math.round((earnedCount / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-count').textContent = `${earnedCount} of ${total} earned`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const inGrade = trophies.filter((t) => t.grade === grade);
    const got = inGrade.filter((t) => isEarned(state, t.id)).length;
    document.getElementById(`tally-${grade}`).textContent = `${got}/${inGrade.length}`;
  }
  const missables = trophies.filter((t) => t.missable).length;
  document.getElementById('missable-count').textContent = String(missables);
}

function matchesFilters(t) {
  if (activeKind === 'missable' && !t.missable) return false;
  if (activeKind !== 'all' && activeKind !== 'missable' && t.kind !== activeKind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (hideEarnedEl.checked && isEarned(state, t.id)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
  return true;
}

function counterControls(t, compact) {
  const wrap = el('span', 'counter');
  const label = el('span', 'counter-label', `${getCount(state, t)}/${t.count}`);
  const minus = el('button', 'counter-btn', '−');
  const plus = el('button', 'counter-btn', '+');
  minus.type = plus.type = 'button';
  minus.setAttribute('aria-label', `One less for ${t.name}`);
  plus.setAttribute('aria-label', `One more for ${t.name}`);
  minus.addEventListener('click', (ev) => { ev.stopPropagation(); setCount(state, t, getCount(state, t) - 1); persistAndRender(); });
  plus.addEventListener('click', (ev) => { ev.stopPropagation(); setCount(state, t, getCount(state, t) + 1); persistAndRender(); });
  if (!compact) wrap.append(minus);
  wrap.append(label);
  if (!compact) wrap.append(plus);
  return wrap;
}

function buildRow(t) {
  const row = el('li', 'trophy-row');
  if (isEarned(state, t.id)) row.classList.add('is-earned');
  if (t.id === selectedId) row.classList.add('is-selected');
  row.tabIndex = 0;
  row.setAttribute('role', 'button');
  row.setAttribute('aria-label', `Open guide for ${t.name}`);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earned-box';
  box.checked = isEarned(state, t.id);
  box.setAttribute('aria-label', `Mark ${t.name} earned`);
  box.addEventListener('click', (ev) => ev.stopPropagation());
  box.addEventListener('change', () => { setEarned(state, t.id, box.checked); persistAndRender(); });
  row.append(box, gradeChip(t));

  const shielded = isShielded(state, t);
  const body = el('div', 'row-body');
  const nameLine = el('p', 'row-name');
  nameLine.append(document.createTextNode(shielded ? 'Hidden trophy' : t.name));
  if (t.missable) nameLine.append(el('span', 'flag-missable', ' ⚠ missable'));
  nameLine.append(el('span', 'tag-kind', kindLabel(t.kind)));
  if (t.hidden && !shielded) nameLine.append(el('span', 'tag-hidden', 'hidden'));
  body.append(nameLine);
  body.append(el('p', shielded ? 'row-desc shielded' : 'row-desc',
    shielded ? 'Name and description hidden by the spoiler shield until earned.' : t.description));
  row.append(body);

  if (t.count) row.append(counterControls(t, false));
  if (shielded) {
    const btn = el('button', 'reveal-btn', 'Reveal');
    btn.type = 'button';
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); reveal(state, t.id); persistAndRender(); });
    row.append(btn);
  }
  row.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); });
  row.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { selectedId = t.id; renderList(); renderDetail(); } });
  return row;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  listEl.replaceChildren();
  if (activeKind === 'online' && shown.length === 0) {
    listEl.append(el('li', 'empty-note', 'The official PS5 list has no online trophies — everything here is earned solo, offline.'));
  } else if (shown.length === 0) {
    listEl.append(el('li', 'empty-note', 'No trophies match those filters.'));
  }
  for (const t of shown) listEl.append(buildRow(t));
  const earnedShown = shown.filter((t) => isEarned(state, t.id)).length;
  statusEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${earnedShown} earned in this view`;
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  detailEl.replaceChildren();
  if (!t) {
    detailEl.append(el('p', 'detail-hint', 'Pick a trophy to read its full guide, missable warning and sources.'));
    return;
  }
  const shielded = isShielded(state, t);
  const head = el('div', 'detail-head');
  head.append(gradeChip(t), el('span', 'tag-kind', kindLabel(t.kind)), el('span', 'tag-stage', `Roadmap stage ${t.stage}`));
  detailEl.append(head);
  detailEl.append(el('h2', 'detail-name', shielded ? 'Hidden trophy' : t.name));

  const official = el('div', 'official-box');
  official.append(el('p', 'official-label', 'Official description (PlayStation)'));
  official.append(el('p', 'official-text', shielded ? 'Hidden by the spoiler shield until earned.' : t.description));
  detailEl.append(official);

  if (t.missable) {
    const warn = el('div', 'missable-warning');
    warn.append(el('p', 'missable-warning-title', '⚠ Missable — do not leave this for clean-up'));
    warn.append(el('p', null, t.missableNote));
    detailEl.append(warn);
  }

  if (t.count) {
    const progress = el('div', 'detail-counter');
    progress.append(el('span', null, `Tracked progress: `), counterControls(t, false));
    detailEl.append(progress);
  }

  const guideBox = el('div', 'guide-box');
  guideBox.append(el('h3', null, 'Guide'));
  for (const para of t.guide.split(/\n\n+/)) guideBox.append(el('p', null, para));
  detailEl.append(guideBox);
  detailEl.append(sourcesLine(t));

  const toggle = el('button', 'earned-toggle', isEarned(state, t.id) ? '✓ Earned — click to undo' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => { setEarned(state, t.id, !isEarned(state, t.id)); persistAndRender(); });
  detailEl.append(toggle);
  if (shielded) {
    const btn = el('button', 'reveal-btn', 'Reveal this trophy anyway');
    btn.type = 'button';
    btn.addEventListener('click', () => { reveal(state, t.id); persistAndRender(); });
    detailEl.append(btn);
  }
}

function renderRoadmap() {
  const host = document.getElementById('view-roadmap');
  host.replaceChildren(buildRoadmap(trophies, state));
}

function renderMissables() {
  const host = document.getElementById('view-missables');
  host.replaceChildren(buildMissables(trophies, state, {
    onReveal: (id) => { reveal(state, id); persistAndRender(); },
  }));
}

function wireControls() {
  document.querySelectorAll('#kind-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      activeKind = chip.dataset.kind;
      renderList();
    });
  });
  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  hideEarnedEl.addEventListener('change', renderList);
  shieldEl.checked = state.spoilerShield;
  shieldEl.addEventListener('change', () => { state.spoilerShield = shieldEl.checked; persistAndRender(); });
  document.getElementById('export-btn').addEventListener('click', () => exportState(state));
  document.getElementById('import-file').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try { await importState(state, file); persistAndRender(); }
    catch { statusEl.textContent = 'That import file could not be read as Atlas progress.'; }
    ev.target.value = '';
  });
  document.querySelectorAll('#view-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#view-tabs .tab').forEach((x) => x.classList.remove('is-active'));
      tab.classList.add('is-active');
      for (const view of ['tracker', 'roadmap', 'missables']) {
        document.getElementById(`view-${view}`).hidden = view !== tab.dataset.view;
      }
    });
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;
  wireControls();
  persistAndRender();
}

boot();
