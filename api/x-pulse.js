// api/x-pulse.js — Phase 4. Street-level X (Twitter) reaction for a topic.
//
// Calls the xAI API (grok w/ Live Search limited to X) using XAI_API_KEY and
// returns STRICT JSON: { sentiment, takes: [{text, handle, url}] }. Fails soft:
// on any error / timeout / no-takes it returns { sentiment:'n/a', takes:[] } with
// 200 so the client can simply render nothing. Cached per topic ~60s in memory
// (per warm lambda) plus s-maxage at the edge.

const cache = new Map(); // topicKey -> { at, data }
const TTL = 60_000;

function stripFences(s = '') {
  return s.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const topic = (req.query.topic || '').toString().slice(0, 160).trim();
  const empty = { sentiment: 'n/a', takes: [] };
  if (!topic) return res.status(200).json(empty);

  const key = process.env.XAI_API_KEY;
  if (!key) return res.status(200).json(empty);

  const ck = topic.toLowerCase();
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return res.status(200).json(hit.data);

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
        // grok-3-mini is the model proven to authenticate with this key (also used
        // by /api/summarize). Live Search is enabled per-request via search_parameters.
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
        search_parameters: { mode: 'on', sources: [{ type: 'x' }], max_search_results: 20, return_citations: true },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error(`[x-pulse] xAI HTTP ${r.status} for "${topic}":`, body.slice(0, 400));
      return res.status(200).json(empty);
    }

    const d = await r.json();
    const content = stripFences(d?.choices?.[0]?.message?.content || '');
    if (!content) {
      console.error(`[x-pulse] empty content for "${topic}":`, JSON.stringify(d).slice(0, 400));
      return res.status(200).json(empty);
    }

    const m = content.match(/\{[\s\S]*\}/);
    if (!m) {
      console.error(`[x-pulse] no JSON object in content for "${topic}":`, content.slice(0, 300));
      return res.status(200).json(empty);
    }

    let parsed;
    try { parsed = JSON.parse(m[0]); }
    catch (e) {
      console.error(`[x-pulse] JSON parse failed for "${topic}": ${e.message} ::`, m[0].slice(0, 300));
      return res.status(200).json(empty);
    }

    const validSent = ['bullish', 'bearish', 'mixed', 'n/a'];
    const takes = (Array.isArray(parsed.takes) ? parsed.takes : [])
      .filter(t => t && t.text && t.url && /^https?:\/\//.test(t.url))
      .slice(0, 5)
      .map(t => ({ text: String(t.text).slice(0, 200), handle: (t.handle || '').toString(), url: String(t.url) }));

    if (!takes.length) console.error(`[x-pulse] parsed but 0 valid takes for "${topic}"`);

    const data = {
      sentiment: takes.length && validSent.includes(parsed.sentiment) ? parsed.sentiment : 'n/a',
      takes,
    };
    cache.set(ck, { at: Date.now(), data });
    return res.status(200).json(data);
  } catch (err) {
    console.error(`[x-pulse] exception for "${topic}": ${err?.name} ${err?.message}`);
    return res.status(200).json(empty);
  }
}
