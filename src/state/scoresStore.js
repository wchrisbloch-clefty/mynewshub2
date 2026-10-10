// ─── LIVE-SCORES STORE (I1) ───────────────────────────────────────────────────
// An external store for the ONE piece of high-frequency, polled state — live scores.
// It lives OUTSIDE React's App tree so a score tick notifies only the components that
// subscribe (ActiveScoresBar, Scoreboard, the Sports score strip) — NOT App, and so NOT
// the feed pages. This is the enabling split by change-rate: feed/pref/UI state stays in
// App; the fast-churning scores slice moves here.
//
// Framework-agnostic: no React import. The React binding is useScores() (./useScores),
// built on useSyncExternalStore. App wires the fetcher once via configureScores().

let state = { scores: {}, loading: false };
let fetcher = null;              // async () => scoresByLeague — injected by App
let inFlight = false;
const listeners = new Set();

function emit() { for (const cb of listeners) cb(); }

// Point the store at the app's real score fetcher (fetchAllScores). Idempotent.
export function configureScores(fetchFn) { fetcher = fetchFn; }

export function subscribeScores(cb) { listeners.add(cb); return () => listeners.delete(cb); }

// Stable snapshot: the SAME object reference is returned until a real change, so
// useSyncExternalStore never loops.
export function getScoresSnapshot() { return state; }

// Load scores through the injected fetcher and publish the result. Guards against
// overlapping loads (a visibility-change refresh landing on top of a poll).
export async function loadScores() {
  if (!fetcher || inFlight) return;
  inFlight = true;
  state = { scores: state.scores, loading: true }; emit();
  try {
    const scores = await fetcher();
    state = { scores: scores || {}, loading: false };
  } catch {
    state = { scores: state.scores, loading: false };
  } finally {
    inFlight = false;
    emit();
  }
}

// Does any league have a game currently live? (Drives the Sports-only 120s poll.)
export function anyLiveGame(scores = state.scores) {
  return Object.values(scores || {}).some(list => Array.isArray(list) && list.some(g => g && g.state === 'in'));
}

// Test seam: reset store between runs.
export function __resetScores() { state = { scores: {}, loading: false }; fetcher = null; inFlight = false; listeners.clear(); }
