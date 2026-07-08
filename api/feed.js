// api/feed.js — Vercel serverless proxy for RSS / news feeds (Phase 2).
//
// Why: the client used to hit third-party CORS proxies directly. This first-party
// proxy fetches + parses feeds server-side and keeps any provider key OUT of the
// browser bundle. If NEWS_API_KEY (an rss2json key) is set in the Vercel env it is
// used server-side for higher rate limits; otherwise the feed is fetched + parsed
// directly. Response is normalized JSON: { items: [...] }.

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

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No url provided', items: [] });
  const target = decodeURIComponent(url);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const key = process.env.NEWS_API_KEY; // server-side only — never shipped to the client
  try {
    if (key) {
      const r = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(target)}&api_key=${key}&count=20`,
        { signal: AbortSignal.timeout(9000) }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.items?.length) {
          return res.status(200).json({
            items: d.items.map(i => ({
              title: (i.title || '').trim(),
              link: i.link,
              desc: (i.description || i.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 300),
              pubDate: i.pubDate,
              img: i.thumbnail || i.enclosure?.link || '',
              duration: i.itunes_duration || '',
            })),
          });
        }
      }
    }

    const r = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}`, items: [] });
    const xml = await r.text();
    return res.status(200).json({ items: parseFeed(xml) });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
