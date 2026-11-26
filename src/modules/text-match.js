// src/modules/text-match.js — AE6: whole-word / phrase matching for category & sub-category
// filters. The old filters used `text.includes(keyword)`, so a short key matched INSIDE another
// word: 'ev' lit up every/never/event, 'rig' lit up right, 'oil' lit up boil/foil, 'gas' lit up
// gasket, 'tv' lit up any "tv" run. This matches on a word boundary instead.
//
// Mirrors the existing team matcher (App.jsx teamTermMatches) so there is one whole-word rule.

/** True when `term` (a word or phrase) occurs in `text` on word boundaries. Case-insensitive. */
export function wholeWordMatch(text, term) {
  const t = String(term || '').trim().toLowerCase();
  if (!t) return false;
  const hay = String(text || '').toLowerCase();
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try { return new RegExp(`(?:^|\\W)${esc}(?:\\W|$)`).test(hay); }
  catch { return hay.includes(t); }
}

/** True when ANY of `terms` matches `text` on word boundaries. */
export function anyWholeWord(text, terms) {
  return (terms || []).some(k => wholeWordMatch(text, k));
}
