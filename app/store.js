// store.js — progress state for the Leonida Platinum Atlas.
// Everything the player ticks off lives here: earned trophies, per-trophy counters,
// individually revealed spoilers and the spoiler-shield switch. State is persisted to
// localStorage and can be exported to / imported from a JSON file. No network, ever.

const STORAGE_KEY = 'leonida-platinum-atlas-v1';

const blankState = () => ({
  earned: [],          // trophy ids the player has earned
  counts: {},          // trophy id -> tracked progress toward its official count
  revealed: [],        // hidden trophy ids the player chose to reveal despite the shield
  spoilerShield: true, // hide hidden story trophies until earned (or revealed)
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      revealed: Array.isArray(parsed.revealed) ? parsed.revealed : [],
      spoilerShield: parsed.spoilerShield !== false,
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the session still works, progress just will not persist.
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function setEarned(state, id, on) {
  const at = state.earned.indexOf(id);
  if (on && at === -1) state.earned.push(id);
  if (!on && at !== -1) state.earned.splice(at, 1);
}

export function getCount(state, trophy) {
  const n = Number(state.counts[trophy.id]);
  return Number.isFinite(n) && n > 0 ? Math.min(n, trophy.count ?? n) : 0;
}

export function setCount(state, trophy, value) {
  const max = trophy.count ?? Number.MAX_SAFE_INTEGER;
  const clamped = Math.max(0, Math.min(max, Math.floor(value) || 0));
  if (clamped === 0) delete state.counts[trophy.id];
  else state.counts[trophy.id] = clamped;
  // Reaching the official count means the trophy is earned; dropping below un-earns it.
  setEarned(state, trophy.id, clamped >= (trophy.count ?? Infinity));
  return clamped;
}

export function isRevealed(state, id) {
  return state.revealed.includes(id);
}

export function reveal(state, id) {
  if (!state.revealed.includes(id)) state.revealed.push(id);
}

export function exportState(state) {
  const payload = {
    app: 'leonida-platinum-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: state.earned,
    counts: state.counts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-atlas-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

export function importState(state, file) {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    const earned = Array.isArray(parsed) ? parsed : parsed.earned;
    const counts = Array.isArray(parsed) ? {} : parsed.counts;
    if (!Array.isArray(earned)) throw new Error('No earned list in that file.');
    state.earned = earned.filter((id) => Number.isInteger(id));
    state.counts = {};
    if (counts && typeof counts === 'object') {
      for (const [key, value] of Object.entries(counts)) {
        const n = Number(value);
        if (Number.isInteger(Number(key)) && Number.isFinite(n) && n > 0) state.counts[key] = n;
      }
    }
    return state;
  });
}
