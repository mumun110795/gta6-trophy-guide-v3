// views.js — the Roadmap and Missables views of the Leonida Platinum Atlas, plus the
// small DOM helpers the tracker shares with them. Both views are rendered from the
// same trophy data the tracker uses, so the roadmap stages, missable flags and
// counts can never drift apart from the checklist.

import { isEarned, isRevealed } from './store.js';

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function gradeChip(trophy) {
  const chip = el('span', `chip-grade grade-${trophy.grade}`, trophy.grade);
  return chip;
}

export function kindLabel(kind) {
  return { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online', misc: 'Feat' }[kind] ?? kind;
}

// A trophy is shielded when it is a hidden story trophy, the shield is on, and the
// player has neither earned it nor chosen to reveal it.
export function isShielded(state, trophy) {
  return Boolean(
    state.spoilerShield && trophy.hidden && trophy.kind === 'story' &&
    !isEarned(state, trophy.id) && !isRevealed(state, trophy.id),
  );
}

export function firstSentence(text) {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  const cut = flat.search(/(?<=[.!?])\s/);
  return cut === -1 ? flat : flat.slice(0, cut + 1);
}

export function sourcesLine(trophy) {
  const line = el('p', 'sources-line');
  line.append(el('span', 'sources-label', 'Sources: '), document.createTextNode(trophy.sources.join(' · ')));
  return line;
}

const STAGE_META = [
  {
    n: 1, title: 'Stage 1 — Story first, in order',
    brief: 'Play the campaign from Gone Fishing to the final mission. The chapter and named-mission trophies pop on their own; the work is the watchpoints — the character strands (Andy, Kenton, Billy, Randy, Tyrone) close for good as the story moves past them, so finish each strand before you push the main plot on.',
  },
  {
    n: 2, title: 'Stage 2 — Collectibles sweep',
    brief: 'With the whole map open, sweep the counted collectibles region by region. The official counts from the trophy list: 18 meditation spots, 3 card sets, 100 WAiNK spots, 100 discoverable vehicles and all 52 areas of Leonida.',
  },
  {
    n: 3, title: 'Stage 3 — Activities & challenges',
    brief: 'The skill grind: 250 stunts, gold in all 42 Shooting Range challenges, a Top Fun drone win at all 14 locations, 20 race wins, 8 stranger strands and 50 challenges. None of it is missable — it just takes reps.',
  },
  {
    n: 4, title: 'Stage 4 — Clean-up, feats & the platinum',
    brief: 'Everything left: the partner feats, robberies, one-off set pieces and the money trophies, then 100% completion (A Long Road). When the other 54 are in, Vice Got a Price! — the platinum — is yours. The PS5 list has no online trophies, so nothing here needs another player.',
  },
];

function roadmapRow(trophy, state) {
  const row = el('li', 'roadmap-row');
  if (isEarned(state, trophy.id)) row.classList.add('is-earned');
  row.append(gradeChip(trophy));
  const body = el('div', 'roadmap-body');
  const nameLine = el('p', 'roadmap-name');
  nameLine.append(document.createTextNode(trophy.name));
  if (trophy.missable) nameLine.append(el('span', 'flag-missable', ' ⚠ missable'));
  if (isEarned(state, trophy.id)) nameLine.append(el('span', 'flag-earned', ' ✓ earned'));
  body.append(nameLine, el('p', 'roadmap-brief', firstSentence(trophy.guide)));
  row.append(body);
  return row;
}

export function buildRoadmap(trophies, state) {
  const root = el('div', 'roadmap');
  root.append(el('h2', null, 'Roadmap to the Platinum'));
  root.append(el('p', 'view-intro',
    'Four stages, built from the official descriptions: the story in chapter order first, then the counted ' +
    'collectibles, then the activity grind, then clean-up. Stages come from each trophy\u2019s place in the list — ' +
    'story trophies in the order the chapters and missions appear, collectibles with the counts PlayStation tracks.'));

  const watch = el('div', 'watch-box');
  watch.append(el('h3', null, '⚠ Missable watch — read before you start'));
  watch.append(el('p', null,
    'Seven trophies can be locked out of a playthrough. The five character-strand finales close when their ' +
    'character leaves the story, one hunt is a single encounter, and the meditation spots include places the ' +
    'story changes for good. In story order:'));
  const watchList = el('ul', 'watch-list');
  for (const t of trophies.filter((t) => t.missable)) {
    const item = el('li', null);
    item.append(el('strong', null, `${t.name} — `), document.createTextNode(firstSentence(t.missableNote)));
    watchList.append(item);
  }
  watch.append(watchList);
  root.append(watch);

  for (const meta of STAGE_META) {
    const section = el('section', 'stage');
    section.append(el('h3', null, meta.title), el('p', 'stage-brief', meta.brief));
    const list = el('ol', 'roadmap-list');
    for (const t of trophies.filter((t) => t.stage === meta.n)) list.append(roadmapRow(t, state));
    section.append(list);
    root.append(section);
  }
  return root;
}

export function buildMissables(trophies, state, { onReveal } = {}) {
  const root = el('div', 'missables');
  root.append(el('h2', null, 'Missable trophies'));
  root.append(el('p', 'view-intro',
    'Every trophy this atlas flags as missable, with the reason and the point of no return. Flags are drawn from ' +
    'the official descriptions — one-chance wording, named characters whose strands end, a unique hunt — and from ' +
    'the cited guides. Do these inside the story, not after it.'));
  const list = el('div', 'missable-list');
  for (const t of trophies.filter((t) => t.missable)) {
    const card = el('article', 'missable-card');
    const head = el('div', 'missable-head');
    head.append(gradeChip(t));
    const shielded = isShielded(state, t);
    const name = el('h3', shielded ? 'shielded' : null, shielded ? 'Hidden trophy' : t.name);
    head.append(name, el('span', 'tag-kind', kindLabel(t.kind)));
    card.append(head);
    card.append(el('p', shielded ? 'desc shielded' : 'desc', shielded ? 'Description hidden by the spoiler shield.' : t.description));
    const note = el('p', 'missable-note');
    note.append(el('strong', null, 'Why it is missable: '), document.createTextNode(t.missableNote));
    card.append(note, sourcesLine(t));
    if (shielded && onReveal) {
      const btn = el('button', 'reveal-btn', 'Reveal anyway');
      btn.type = 'button';
      btn.addEventListener('click', () => onReveal(t.id));
      card.append(btn);
    }
    list.append(card);
  }
  root.append(list);
  return root;
}
