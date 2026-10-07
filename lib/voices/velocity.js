// lib/voices/velocity.js — velocity ranking for Voices tiles (E3).
//
// Lifted (trimmed) from social-command-center lib/velocity.js: the core window→rank with
// the same `heat` tiebreak. Dropped the config/sources.js grouping helpers — our
// categories come from the app, so this stays dependency-free. Governance (E3): velocity
// only ORDERS tiles; it never raises a trust tier — every Voices tile is `inferred`.

export const DEFAULT_WINDOW_HOURS = 48;
const RANK = { high: 3, rising: 2, moderate: 1 };

// Numeric heat, used only to order WITHIN a signal band. Views-per-hour where a platform
// gives views (YouTube); pure recency otherwise. Never surfaced in the UI.
export function heat(item) {
  const age = Math.max(Number(item.ageHours) || 0, 0.25);
  const band = (RANK[item.signal] || 1) * 1_000_000;
  const perHour = (Number(item.views) || 0) / age;
  const recency = 1 / age;
  return band + (perHour > 0 ? Math.min(perHour, 999_999) : recency);
}

export function withinWindow(items, windowHours = DEFAULT_WINDOW_HOURS) {
  return (items || []).filter(i => (Number(i.ageHours) ?? Infinity) <= windowHours);
}

// window → rank → cap. Dedupe by url so the same post from two lanes shows once.
export function rankByVelocity(items, { windowHours = DEFAULT_WINDOW_HOURS, limit = 4 } = {}) {
  const seen = new Set();
  const pool = withinWindow(items, windowHours).filter(i => {
    const k = (i.url || i.title || '').toLowerCase();
    if (!k || seen.has(k)) return false; seen.add(k); return true;
  });
  return [...pool].sort((a, b) => heat(b) - heat(a)).slice(0, limit);
}

// Assign a coarse signal band from recency + views when the lane didn't set one.
export function signalFor({ ageHours, views }) {
  if ((Number(views) || 0) >= 50000 || (Number(ageHours) ?? 99) <= 3) return 'high';
  if ((Number(views) || 0) >= 5000 || (Number(ageHours) ?? 99) <= 12) return 'rising';
  return 'moderate';
}
