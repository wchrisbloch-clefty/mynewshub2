// api/feed.js — Vercel serverless RSS/news proxy.
//
// Fetches + parses feeds server-side (keeps any key off the client) and returns
// normalized JSON: { items, error?, status }. Fails LOUDLY: every failure is
// logged server-side with the source host + status, and the upstream status is
// returned so the client can count degraded sources. A single bad feed can never
// throw the request — parsing is guarded.

// Suppress Node/undici internal deprecation warnings (e.g. [DEP0169] url.parse()
// emitted by fetch/redirect handling) — they flood the serverless logs as "errors"
// but come from the runtime, not our code.
process.noDeprecation = true;

// A real browser UA + Accept headers. Many publishers 403 default/bot agents
// (the old "NewsBot/1.0" was being blocked across the board).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const FEED_HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Decode at ingestion: full numeric + named entities so every downstream surface
// receives clean text by construction (no per-surface decoding needed).
function decodeOnce(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; } })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
// Iterate so DOUBLE-encoded entities decode fully. A single pass decodes &amp; last,
// so `she&amp;#8217;s` only becomes `she&#8217;s` and would render raw downstream
// (this was the recurring "State of Play shows &#8217;" bug). Loop until stable.
function decodeEntities(s = '') {
  let out = String(s), prev;
  for (let i = 0; i < 3 && out !== prev; i++) { prev = out; out = decodeOnce(out); }
  return out;
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(m[1]).replace(/<[^>]*>/g, '').trim() : '';
}
function attr(block, tagName, attrName) {
  const m = block.match(new RegExp(`<${tagName}[^>]*\\b${attrName}=["']([^"']+)["']`, 'i'));
  return m ? m[1] : '';
}
function extractImg(block) {
  let m = block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  m = block.match(/<img[^>]*src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}
// Byline at ingestion: Atom <author><name>, WordPress <dc:creator>, or RSS <author>
// (often "email (Name)" or a bare name — never surface a raw email). Empty when none.
function extractAuthor(block) {
  const atom = block.match(/<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i);
  if (atom) return decodeEntities(atom[1]).replace(/<[^>]*>/g, '').trim().slice(0, 80);
  const creator = tag(block, 'dc:creator');
  if (creator) return creator.slice(0, 80);
  const a = tag(block, 'author');
  if (a) { const paren = a.match(/\(([^)]+)\)/); const name = paren ? paren[1].trim() : (a.includes('@') ? '' : a); return name.slice(0, 80); }
  return '';
}
// Link resolution that survives real-world feeds:
//   1) <link>https://…</link>  (RSS)        3) <guid>https://…</guid>  (ESPN, some CMS)
//   2) <link href="…"/>        (Atom)        4) <enclosure url="…">     (podcasts)
// The old parser REQUIRED a text <link> and silently dropped every item without one —
// that was the ESPN / megaphone "200 with 0 items" bug (link lives in guid/href).
function pickLink(block) {
  const text = tag(block, 'link');
  if (/^https?:\/\//i.test(text)) return text;
  const href = attr(block, 'link', 'href');
  if (href) return href;
  const guid = tag(block, 'guid');
  if (/^https?:\/\//i.test(guid)) return guid;
  const enc = attr(block, 'enclosure', 'url');
  if (enc) return enc;
  return text || '';
}
// JSON feeds (e.g. ESPN's site.api.espn.com news API returns { articles:[…] }).
function parseJsonFeed(body) {
  let d; try { d = JSON.parse(body); } catch { return []; }
  const arr = d.items || d.entries || d.articles || (Array.isArray(d) ? d : []);
  const out = [];
  for (const it of (arr || []).slice(0, 20)) {
    const title = decodeEntities(String(it.title || it.headline || '').trim());
    if (!title) continue;
    const link = it.url || it.links?.web?.href || (typeof it.link === 'string' ? it.link : it.link?.href) || it.links?.[0]?.href || '';
    const descRaw = it.description || it.summary || it.content_text || it.content || '';
    const imgRaw = it.image?.url || it.image || (it.images && (it.images[0]?.url || it.images[0])) || it.thumbnail || '';
    const authorRaw = it.author?.name || (typeof it.author === 'string' ? it.author : '') || it.byline || (Array.isArray(it.authors) ? (it.authors[0]?.name || it.authors[0]) : '') || '';
    out.push({
      author: decodeEntities(String(authorRaw || '')).replace(/<[^>]*>/g, '').trim().slice(0, 80),
      title,
      link: String(link || ''),
      desc: decodeEntities(String(descRaw).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim().slice(0, 300),
      pubDate: it.published || it.date_published || it.pubDate || it.updated || '',
      img: typeof imgRaw === 'string' ? imgRaw : '',
      duration: '',
    });
  }
  return out;
}
function parseFeed(body) {
  const s = (body || '').replace(/^﻿/, '').trimStart();
  if (s[0] === '{' || s[0] === '[') return parseJsonFeed(s);        // JSON feed
  // XML: accept RSS <item> AND Atom <entry>, in whatever order they appear.
  const blocks = [
    ...(body.match(/<item[\s\S]*?<\/item>/gi) || []),
    ...(body.match(/<entry[\s\S]*?<\/entry>/gi) || []),
  ];
  const items = [];
  for (const b of blocks.slice(0, 20)) {
    const title = tag(b, 'title');
    if (!title) continue;                                            // title is the only hard requirement
    const link = pickLink(b);
    const desc = (tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')).slice(0, 300);
    const pubDate = tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated');
    items.push({ title, link, desc, pubDate, img: extractImg(b), duration: tag(b, 'itunes:duration'), author: extractAuthor(b) });
  }
  return items;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const hostOf = u => { try { return new URL(u).host; } catch { return u; } };

// Fetch with retry+backoff on transient failures (network / 5xx / 429). Permanent
// statuses (401/402/403/404) are NOT retried — retrying can't fix them.
async function fetchFeed(target) {
  const backoffs = [0, 400, 1200];
  let last = { status: 0, err: 'unknown' };
  for (let i = 0; i < backoffs.length; i++) {
    if (backoffs[i]) await sleep(backoffs[i]);
    try {
      const r = await fetch(target, { headers: FEED_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(9000) });
      if (r.ok) return { ok: true, text: await r.text() };
      last = { status: r.status, err: `HTTP ${r.status}` };
      if ([401, 402, 403, 404, 410].includes(r.status)) break; // permanent — stop retrying
    } catch (e) {
      last = { status: 0, err: e?.name === 'TimeoutError' ? 'timeout' : (e?.message || 'network') };
    }
  }
  return { ok: false, ...last };
}

export default async function handler(req, res) {
  const { url } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (!url) return res.status(400).json({ error: 'No url provided', items: [], status: 400 });
  const target = decodeURIComponent(url);
  const host = hostOf(target);

  try {
    const r = await fetchFeed(target);
    if (!r.ok) {
      console.error(`[feed] ${host} FAIL status=${r.status} (${r.err})`);
      // 200 to the client with the real status so it can count/report degradation;
      // the client still falls through to its own fallbacks on empty items.
      return res.status(200).json({ items: [], error: r.err, status: r.status });
    }
    let items = [];
    try { items = parseFeed(r.text); }
    catch (e) { console.error(`[feed] ${host} PARSE-ERROR ${e?.message}`); items = []; }
    if (!items.length) console.error(`[feed] ${host} EMPTY (0 items parsed)`);
    return res.status(200).json({ items, status: 200 });
  } catch (err) {
    // Must never take the request down. Log + report, never 500 the client.
    console.error(`[feed] ${host} EXCEPTION ${err?.message}`);
    return res.status(200).json({ items: [], error: err?.message || 'exception', status: 0 });
  }
}
