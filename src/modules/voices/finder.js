// src/modules/voices/finder.js — the Voices source-finder CLIENT logic (AC2), kept OUT of the
// initial bundle. App.jsx's findVoices is a thin shim that dynamically imports this on the first
// tap, so the 7-day cache + 60s cooldown + fetch/parse code costs the entry chunk nothing.
//
// Pure-ish: all app plumbing (storage + fetch helpers + the React setter) is passed in, so this
// module has no import of App and is itself easy to reason about.

export async function runFinder({
  category, focus = '', defaultCat = 'general',
  voices = [], tombstones = [],
  ld, sv, fetchWithTimeout, cooldownRef, setState,
}) {
  const cat = String(category || defaultCat || 'general');
  const fkey = `${cat}|${focus}`.toLowerCase();
  const cacheK = `voicefind_${fkey.replace(/[^a-z0-9]+/g, '-')}`;

  // 7-day client cache — a repeat ask makes NO request at all.
  const cached = ld(cacheK, null);
  if (cached && cached.t && (Date.now() - cached.t) < 7 * 86400000) {
    setState({ category: cat, focus, loading: false, data: cached.data });
    return;
  }
  // 60s cooldown between live asks for the same (category, focus).
  const last = (cooldownRef.current[fkey]) || 0;
  if (Date.now() - last < 60000) {
    setState({ category: cat, focus, loading: false, data: { enabled: true, candidates: [], error: 'Please wait a moment before searching again.' } });
    return;
  }
  cooldownRef.current[fkey] = Date.now();
  setState({ category: cat, focus, loading: true, data: null });

  // Dedupe server-side against what the user already has (followed voices + tombstones).
  const exclude = [...new Set([...(voices || []).map(v => v.id), ...(tombstones || [])])].join(',');
  try {
    const qs = `kind=voicefind&category=${encodeURIComponent(cat)}&focus=${encodeURIComponent(focus)}&exclude=${encodeURIComponent(exclude)}`;
    const r = await fetchWithTimeout(`/api/signals?${qs}`, 10000);
    const data = r.ok ? await r.json() : { enabled: true, candidates: [], error: `HTTP ${r.status}` };
    if (data && data.enabled !== false && !data.error) sv(cacheK, { t: Date.now(), data });
    setState(cur => cur && cur.category === cat && cur.focus === focus ? { category: cat, focus, loading: false, data } : cur);
  } catch {
    setState(cur => cur && cur.category === cat && cur.focus === focus ? { category: cat, focus, loading: false, data: { enabled: true, candidates: [], error: 'unreachable' } } : cur);
  }
}
