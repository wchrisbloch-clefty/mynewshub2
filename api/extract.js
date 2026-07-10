// api/extract.js — "clean text from any URL" extraction endpoint.
//
// One server-side extraction path for every content type. Fetches the real source
// and returns its readable body — never a blurb. Consumers (Summarize / Key Points,
// in-feed or Analyze) run ONLY on this output.
//
// GET /api/extract?url=<url>[&kind=article|youtube|podcast]
//   -> 200 { text, title, source, kind, chars }        on success
//   -> 200 { error: 'no-transcript'|'too-short'|'fetch-failed'|'no-url', kind }
// Never 500s; failures are reported so the client can render an honest fallback
// ("Full text unavailable — open the source" / "No transcript available") instead
// of summarizing filler. Cached ~10min per URL in memory + s-maxage at the edge.

process.noDeprecation = true;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
// A full real-browser header set. Publishers 403 requests that send only a UA (or
// a bot UA) with no Accept/Accept-Language — the missing Accept header was the root
// cause of "Full text unavailable" in production. Match what feed.js already sends.
const ARTICLE_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};
const hostOf = u => { try { return new URL(u).host; } catch { return u; } };
const MIN_CHARS = 500;
const MAX_CHARS = 8000; // sensible token cap for summarization
const cache = new Map(); // url -> { at, data }
const TTL = 10 * 60 * 1000;

function decodeEntities(s = '') {
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; } })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

const youtubeId = (url) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

async function fetchText(url, timeout = 9000) {
  const r = await fetch(url, { headers: ARTICLE_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
  if (!r.ok) {
    // Log the actual input-path failure: which host blocked us and with what status.
    console.error(`[extract] ${hostOf(url)} FAIL status=${r.status}`);
    throw new Error(`HTTP ${r.status}`);
  }
  return r.text();
}

// ── Readability-lite: strip chrome, prefer <article>/<main>, else <p> density ──
function extractArticle(html) {
  let title = '';
  const tm = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (tm) title = decodeEntities(tm[1].trim());

  // Kill non-content elements outright.
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer|aside|form|figure|figcaption|noscript|iframe|svg)[\s\S]*?<\/\1>/gi, ' ');

  // Prefer the main article container if present.
  const container = h.match(/<article[\s\S]*?<\/article>/i) || h.match(/<main[\s\S]*?<\/main>/i);
  const scope = container ? container[0] : h;

  // Pull paragraph + heading text.
  const parts = [];
  for (const m of scope.matchAll(/<(p|h1|h2|h3|li)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (t.length > 30) parts.push(t); // drop tiny nav/boilerplate fragments
  }
  let text = parts.join('\n\n');
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
  return { title, text };
}

// ── YouTube: real captions/transcript, never the description ──
async function extractYouTube(id) {
  const watch = await fetchText(`https://www.youtube.com/watch?v=${id}&hl=en`);
  const titleM = watch.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const title = titleM ? decodeEntities(titleM[1]) : '';
  const pr = watch.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\})\s*;\s*(?:var|<\/script>)/);
  if (!pr) return { error: 'no-transcript', title };
  let tracks;
  try { tracks = JSON.parse(pr[1])?.captions?.playerCaptionsTracklistRenderer?.captionTracks; } catch { tracks = null; }
  if (!tracks || !tracks.length) return { error: 'no-transcript', title };
  const track = tracks.find(t => (t.languageCode || '').startsWith('en')) || tracks[0];
  let xml;
  try { xml = await fetchText(track.baseUrl); } catch { return { error: 'no-transcript', title }; }
  const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(m => decodeEntities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()).filter(Boolean);
  let text = lines.join(' ');
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
  return { title, text };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  const url = (req.query.url || '').toString();
  if (!url) return res.status(200).json({ error: 'no-url' });

  const ck = url.toLowerCase();
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return res.status(200).json(hit.data);

  const ytId = youtubeId(url);
  const kind = ytId ? 'youtube' : (req.query.kind || 'article');
  let data;
  try {
    if (ytId) {
      const r = await extractYouTube(ytId);
      if (r.error) data = { error: r.error, kind, title: r.title || '' };
      else if ((r.text || '').length < MIN_CHARS) data = { error: 'no-transcript', kind, title: r.title || '' };
      else data = { text: r.text, title: r.title, source: 'YouTube', kind, chars: r.text.length };
    } else {
      const html = await fetchText(url);
      const r = extractArticle(html);
      if ((r.text || '').length < MIN_CHARS) data = { error: 'too-short', kind, title: r.title || '' };
      else data = { text: r.text, title: r.title, source: (() => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return ''; } })(), kind, chars: r.text.length };
    }
  } catch (err) {
    console.error(`[extract] ${kind} FAIL ${err?.message} :: ${url.slice(0, 80)}`);
    data = { error: 'fetch-failed', kind };
  }
  cache.set(ck, { at: Date.now(), data });
  return res.status(200).json(data);
}
