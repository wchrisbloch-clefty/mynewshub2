// ─── CONTENT EXTRACTOR — "clean text from any URL" ────────────────────────────
// Thin client for the extraction endpoint. Given any URL (article, podcast page,
// YouTube video) it returns the readable body text — never a blurb. Summarizers
// run ONLY on this. App-agnostic and reusable.
//
// Public interface:
//   extractContent(url, opts?) -> { text, title, source, kind, chars } | { error, kind }
//     errors: 'no-transcript' | 'too-short' | 'fetch-failed' | 'no-url'
//   extractionFallbackMessage(error) -> honest user-facing string (never filler)
//
// Server half: api/extract.js (must live under api/ for the platform to route it —
// same constraint as x-pulse). Needs no key. Readability-lite + YouTube captions.

export async function extractContent(url, { endpoint = '/api/extract', timeout = 12000 } = {}) {
  if (!url) return { error: 'no-url' };
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) return { error: 'fetch-failed' };
    return await r.json();
  } catch {
    return { error: 'fetch-failed' };
  }
}

export function extractionFallbackMessage(error) {
  if (error === 'no-transcript') return "No transcript available — this video can't be summarized";
  return 'Full text unavailable — open the source.';
}
