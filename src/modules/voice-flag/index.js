// AG5.3: voice flags. For a confirmed voice with a recent post, if the post shares >=3 meaningful
// tokens with a story headline on the page, that story gets a quiet "Yergin · 2h ↗" chip (inferred,
// +1 follow boost) and is fed to "Also moving" (AG3). Pure + unit-tested; the live voice posts come
// from the existing voice-signals (search snippet / YouTube / RSSHub; X only on tap) = NEEDS-DEVICE.
const STOP = new Set(['the','and','for','with','from','that','this','have','will','your','what','when',
  'news','today','says','after','over','into','amid','about','their','they','been','says','could','would']);

function toks(s) {
  const set = new Set();
  for (const w of String(s || '').toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 3 && !STOP.has(w)) set.add(w);
  return set;
}

// "Daniel Yergin" → "Yergin"; "@DanielYergin" → "DanielYergin"; keeps org names short.
export function shortVoiceName(who) {
  const n = String(who || '').replace(/^@/, '').trim();
  const parts = n.split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : n;
}

// tiles: the category's voice-signal tiles [{ who, title, age }]. Returns { name, ago } for the first
// voice whose recent post shares >=3 meaningful tokens with the article headline, else null.
export function voiceFlagFor(article, tiles) {
  if (!article || !article.title || !tiles || !tiles.length) return null;
  const a = toks(article.title);
  if (a.size < 3) return null;
  for (const t of tiles) {
    if (!t || !t.title) continue;
    const b = toks(t.title);
    let hits = 0;
    for (const w of a) if (b.has(w) && ++hits >= 3) return { name: shortVoiceName(t.who), ago: t.age || '' };
  }
  return null;
}
