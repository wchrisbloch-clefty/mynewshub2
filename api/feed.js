// api/feed.js — Vercel serverless RSS/news proxy.
//
// Fetches + parses feeds server-side (keeps any key off the client) and returns
// normalized JSON: { items, error?, status }. Fails LOUDLY: every failure is
// logged server-side with the source host + status, and the upstream status is
// returned so the client can count degraded sources. A single bad feed can never
// throw the request — parsing is guarded.

// A real browser UA + Accept headers. Many publishers 403 default/bot agents
// (the old "NewsBot/1.0" was being blocked across the board).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const FEED_HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

function decodeEntities(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(m[1]).replace(/<[^>]*>/g, '').trim() : '';
}
function extractImg(block) {
  let m = block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  m = block.match(/<img[^>]*src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks.slice(0, 20)) {
    const title = tag(b, 'title');
    let link = tag(b, 'link');
    if (!link) { const m = b.match(/<link[^>]*href=["']([^"']+)["']/i); if (m) link = m[1]; }
    if (!title || !link) continue;
    const desc = (tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')).slice(0, 300);
    const pubDate = tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated');
    items.push({ title, link, desc, pubDate, img: extractImg(b), duration: tag(b, 'itunes:duration') });
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
