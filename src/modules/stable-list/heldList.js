// ─── HELD SELECTION (Batch M3, R2) ────────────────────────────────────────────
// Keep an above-the-fold list (Top Stories, the lead, State-of-Play rows) STABLE once it has
// first rendered in full, so late-arriving data under slow/uneven network never reorders or
// replaces what the reader is already looking at — the main source of desktop/iPad load CLS.
//
// Rule (pure, app-agnostic): before the list is "full" (reaches `target`, or loading finishes)
// follow the live list as it fills; once committed, keep exactly the committed items and order.
// A later story that WOULD change the committed set is reported as `suppressed` (the caller
// counts these as "held N changes") — it is not shown here, but the live list still flows to the
// sections/feed and to the next refresh, so nothing is lost and dedupe keys stay consistent.
//
// `prev`  committed list, or null/empty before the first commit
// `live`  freshly computed list
// opts    { keyOf, target, done } — done = loading finished (commit even if under target)
export function reconcileHeld(prev, live, { keyOf, target, done = false }) {
  live = live || [];
  if (!prev || !prev.length) {
    const committed = live.length >= target || (done && live.length > 0);
    return { items: live, committed, suppressed: false };
  }
  // Committed: hold the chosen items + order. Suppressed if the live list's first prev.length
  // keys differ from what is held (a late reorder/replacement that we are deliberately holding).
  const liveSig = live.slice(0, prev.length).map(keyOf).join('|');
  const prevSig = prev.map(keyOf).join('|');
  return { items: prev, committed: true, suppressed: liveSig !== prevSig };
}
