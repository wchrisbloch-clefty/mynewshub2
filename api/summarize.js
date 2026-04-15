// /api/summarize.js — v2
// Vercel serverless function that proxies AI summary requests to Anthropic.
// Browser cannot call api.anthropic.com directly (CORS + key exposure), so this
// runs server-side, holds the API key in env vars, returns 2-3 sentence summary.
//
// Setup:
//   1. File lives at /api/summarize.js (next to /api/rss.js)
//   2. Vercel → Settings → Environment Variables → ANTHROPIC_API_KEY = sk-ant-...
//   3. REDEPLOY after adding the env var (Vercel doesn't pick it up automatically)

const ALLOWED_TYPES = ['article', 'podcast'];
const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 250;
const MODEL = 'claude-sonnet-4-5';  // Current Sonnet, billed at standard rate

// Vercel does NOT auto-parse req.body for plain serverless functions
// (only Next.js does). We need to read the raw stream ourselves.
async function readBody(req) {
  // Some Vercel runtimes DO pre-parse — check first
  if (req.body && typeof req.body === 'object' && !req.body.on) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  // Fall back to manually reading the stream
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Use POST' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing ANTHROPIC_API_KEY env var. Add it in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  let body;
  try { body = await readBody(req); }
  catch (e) { return res.status(400).json({ error: 'Could not read request body: ' + e.message }); }

  const { type = 'article', title = '', content = '' } = body;

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid type "${type}" — must be article or podcast` });
  }
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Missing title in request body. Body received: ' + JSON.stringify(body).slice(0, 200) });
  }

  const safeTitle   = String(title).slice(0, 500);
  const safeContent = String(content).slice(0, MAX_INPUT_CHARS);

  const prompt = type === 'podcast'
    ? `Summarize this podcast episode in 2-3 concise sentences. Be direct and factual. Skip filler like "this episode discusses" — start with the actual content.\n\nTitle: ${safeTitle}\n\nDescription: ${safeContent}`
    : `Summarize this news article in 2-3 concise sentences. Be direct and factual. Skip filler like "this article reports" — start with the actual news.\n\nTitle: ${safeTitle}\n\nContent: ${safeContent}`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(9000),
    });

    const upstreamText = await upstream.text();

    if (!upstream.ok) {
      // Surface Anthropic's actual error message so we can diagnose 400s precisely
      let errDetail = upstreamText.slice(0, 500);
      try {
        const errJson = JSON.parse(upstreamText);
        errDetail = errJson?.error?.message || errDetail;
      } catch {}
      return res.status(upstream.status).json({
        error: `Anthropic ${upstream.status}: ${errDetail}`,
      });
    }

    let data;
    try { data = JSON.parse(upstreamText); }
    catch { return res.status(502).json({ error: 'Anthropic returned non-JSON response' }); }

    const summary = data?.content?.[0]?.text?.trim() || '';
    if (!summary) {
      return res.status(502).json({ error: 'Anthropic returned empty summary' });
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary });

  } catch (err) {
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Anthropic API timed out (>9s)' : `Fetch error: ${err.message || err.name}`,
    });
  }
}
