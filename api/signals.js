// api/signals.js — unified "street signals" endpoint (Batch B item 3).
//
// ONE serverless function serving three inferred, click-to-load signals, dispatched on
// ?kind=. This consolidation exists because Vercel's Hobby plan caps a deployment at 12
// Serverless Functions — three separate files (x-pulse, discussions, github-signal) blew
// past it, so they live here instead and adding future signal kinds costs no new function.
//
//   kind=xpulse&topic=...   → X (Twitter) reaction via xAI (needs XAI_API_KEY)
//   kind=discussions&q=...  → Reddit + Hacker News threads for a story title
//   kind=github             → recently-created GitHub repos with fast star growth
//
// Every kind is FAIL-SOFT (always HTTP 200, empty payload on any error/timeout) so the
// client renders nothing rather than breaking, and nothing here auto-fetches — the client
// keeps its click-to-load trigger.

import { MODELS } from '../lib/ai-models.js';

const UA = 'MyNewsHub/1.0 (+https://mynewshub2.vercel.app; street signals)';

// ── kind=xpulse — X reaction (moved verbatim from the old api/x-pulse.js) ──────
const xCache = new Map(); // topicKey -> { at, data }
const X_TTL = 60_000;
function stripFences(s = '') { return s.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim(); }

async function handleXPulse(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  const topic = (req.query.topic || '').toString().slice(0, 160).trim();
  const empty = { sentiment: 'n/a', takes: [] };
  if (!topic) return res.status(200).json(empty);
  const key = process.env.XAI_API_KEY;
  if (!key) return res.status(200).json(empty);

  const ck = topic.toLowerCase();
  const hit = xCache.get(ck);
  if (hit && Date.now() - hit.at < X_TTL) return res.status(200).json(hit.data);

  const prompt = `You are monitoring X (Twitter) for the current street-level reaction to: "${topic}".
Search X for the most recent, real posts about this topic and gauge overall sentiment.
Return STRICT JSON ONLY — no prose, no markdown fences — matching exactly:
{"sentiment":"bullish|bearish|mixed|n/a","takes":[{"text":"...","handle":"@name","url":"https://x.com/..."}]}
Rules:
- up to 5 takes, each from a DIFFERENT real recent post
- text under 200 characters, quoted or tightly paraphrased from the real post
- handle is the poster's @username; url is the direct link to that exact post on x.com
- if you cannot find real posts, return {"sentiment":"n/a","takes":[]}`;

  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: MODELS.grok.id,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
        search_parameters: { mode: 'on', sources: [{ type: 'x' }], max_search_results: 20, return_citations: true },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) { console.error(`[signals/xpulse] xAI HTTP ${r.status} for "${topic}"`); return res.status(200).json(empty); }
    const d = await r.json();
    const content = stripFences(d?.choices?.[0]?.message?.content || '');
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return res.status(200).json(empty);
    let parsed;
    try { parsed = JSON.parse(m[0]); } catch { return res.status(200).json(empty); }
    const validSent = ['bullish', 'bearish', 'mixed', 'n/a'];
    const takes = (Array.isArray(parsed.takes) ? parsed.takes : [])
      .filter(t => t && t.text && t.url && /^https?:\/\//.test(t.url))
      .slice(0, 5)
      .map(t => ({ text: String(t.text).slice(0, 200), handle: (t.handle || '').toString(), url: String(t.url) }));
    const data = { sentiment: takes.length && validSent.includes(parsed.sentiment) ? parsed.sentiment : 'n/a', takes };
    xCache.set(ck, { at: Date.now(), data });
    return res.status(200).json(data);
  } catch (err) {
    console.error(`[signals/xpulse] exception for "${topic}": ${err?.name} ${err?.message}`);
    return res.status(200).json(empty);
  }
}

// ── kind=discussions — Reddit + HN, server-side (item 3b) ─────────────────────
const discCache = new Map(); // queryKey -> { at, data }
const DISC_TTL = 10 * 60_000;

async function fetchReddit(q) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=5&t=week`;
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.data?.children || []).filter(c => c?.data?.num_comments > 0).slice(0, 3).map(c => ({
      title: c.data.title, sub: c.data.subreddit_name_prefixed, ups: c.data.ups, comments: c.data.num_comments,
      url: `https://reddit.com${c.data.permalink}`, platform: 'reddit', source_class: 'discussion', tier: 'inferred',
    }));
  } catch { return []; }
}
async function fetchHN(q) {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=5`;
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.hits || []).filter(h => h.num_comments > 0).slice(0, 3).map(h => ({
      title: h.title, points: h.points, comments: h.num_comments,
      url: `https://news.ycombinator.com/item?id=${h.objectID}`, platform: 'hn', source_class: 'discussion', tier: 'inferred',
    }));
  } catch { return []; }
}
async function handleDiscussions(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  const q = (req.query.q || '').toString().slice(0, 120).trim();
  const empty = { reddit: [], hn: [] };
  if (!q) return res.status(200).json(empty);
  const ck = q.toLowerCase();
  const hit = discCache.get(ck);
  if (hit && Date.now() - hit.at < DISC_TTL) return res.status(200).json(hit.data);
  const [reddit, hn] = await Promise.all([fetchReddit(q), fetchHN(q)]);
  const data = { reddit, hn };
  discCache.set(ck, { at: Date.now(), data });
  return res.status(200).json(data);
}

// ── kind=github — trending new repos (item 3c) ────────────────────────────────
const ghCache = new Map(); // 'trending' -> { at, data }
const GH_TTL = 60 * 60_000;
function sinceDate(days) { return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10); }

async function handleGithub(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  const empty = { repos: [] };
  const hit = ghCache.get('trending');
  if (hit && Date.now() - hit.at < GH_TTL) return res.status(200).json(hit.data);
  try {
    const q = encodeURIComponent(`created:>${sinceDate(30)} stars:>100`);
    const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=8`;
    const headers = { 'User-Agent': UA, 'Accept': 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.status(200).json(empty);
    const d = await r.json();
    const repos = (Array.isArray(d?.items) ? d.items : []).slice(0, 8).map(it => ({
      name: it.full_name, stars: it.stargazers_count, url: it.html_url,
      desc: (it.description || '').slice(0, 140), language: it.language || '',
      platform: 'github', source_class: 'discussion', tier: 'inferred',
    }));
    const data = { repos };
    ghCache.set('trending', { at: Date.now(), data });
    return res.status(200).json(data);
  } catch { return res.status(200).json(empty); }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const kind = (req.query.kind || '').toString();
  if (kind === 'discussions') return handleDiscussions(req, res);
  if (kind === 'github') return handleGithub(req, res);
  if (kind === 'xpulse') return handleXPulse(req, res);
  return res.status(200).json({}); // unknown kind — fail soft
}
