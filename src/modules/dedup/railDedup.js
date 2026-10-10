// ─── RAIL DEDUP (one-story-once) ──────────────────────────────────────────────
// L3: a single shared "used keys" set, filled in PRIORITY ORDER, so one story shows
// at most once across the whole page — the feed column (Top Stories → State of Play →
// the numbered feed) first, then the rail modules (Connections → Across). A story that
// qualifies for several modules lands in the highest-priority one and is suppressed
// everywhere below it.
//
// Pure + app-agnostic: the caller injects `keyOf(story)` (MyNewsHub passes its storyKey,
// a title-based key so the same story from a different outlet can't slip back in). These
// helpers MUTATE the shared `used` set as they claim, so call them in order.

// Claim a flat list: keep only stories whose key isn't already used, marking kept keys.
export function claim(items, used, keyOf) {
  const out = [];
  for (const a of items || []) {
    const k = keyOf(a);
    if (used.has(k)) continue;
    used.add(k);
    out.push(a);
  }
  return out;
}

// Claim connections (cross-category bridges). A bridge is a RELATIONSHIP between ≥2
// member stories; if ANY member is already shown elsewhere on the page, the whole bridge
// is dropped (so the member headline never appears twice). Kept bridges claim all their
// members so a later module (Across) can't repeat them either.
export function claimConnections(connections, used, keyOf) {
  const out = [];
  for (const c of connections || []) {
    const members = c.members || [];
    if (members.some(m => used.has(keyOf(m)))) continue;
    members.forEach(m => used.add(keyOf(m)));
    out.push(c);
  }
  return out;
}

// Claim "Across" sections ({ cat, cc, items }): filter each section's items to unused
// stories, mark them used, and drop sections left empty.
export function claimAcrossSections(sections, used, keyOf) {
  const out = [];
  for (const s of sections || []) {
    const items = claim(s.items || [], used, keyOf);
    if (items.length) out.push({ ...s, items });
  }
  return out;
}
