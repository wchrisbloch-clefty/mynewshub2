// G2 pure helpers (no JSX, no DOM) — node-testable. Imported by ShareControl.jsx.
const enc = s => encodeURIComponent(s == null ? '' : String(s));

export function buildShareStrings({ title = '', url = '', source = '', text = null }) {
  // `text` (optional) fully overrides the body — used by the Briefing plain-text excerpt.
  const body = text != null ? text : `${title}${source ? ` — ${source}` : ''}\n${url}`;
  const smsBody = text != null ? text : `${title} ${url}`;
  return {
    mailto: `mailto:?subject=${enc(title)}&body=${enc(body)}`,
    // `sms:?&body=` is the form that works on BOTH iOS and Android.
    sms: `sms:?&body=${enc(smsBody)}`,
    body, smsBody,
  };
}

// Plain-text Briefing excerpt — date line, up to 5 numbered headlines with a one-line
// summary, and the site link. Capped (default 1,200 chars): summaries shrink first, then
// whole items drop, before any hard truncation.
export function buildBriefingExcerpt(items, { date = '', site = '', max = 1200 } = {}) {
  const picks = (items || []).slice(0, 5);
  const header = `MyNewsHub — ${date}`;
  const trim = (s, n) => { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
  const build = (list, sumLen) => {
    const body = list.map((a, i) => { const sum = sumLen > 0 ? trim(a.desc, sumLen) : ''; return `${i + 1}. ${trim(a.title, 120)}${sum ? ` — ${sum}` : ''}`; }).join('\n');
    return `${header}\n\n${body}\n\n${site}`;
  };
  for (const sumLen of [160, 120, 90, 60, 30, 0]) { const t = build(picks, sumLen); if (t.length <= max) return t; }
  const list = picks.slice();
  let t = build(list, 0);
  while (list.length > 1 && t.length > max) { list.pop(); t = build(list, 0); }
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}
