// /api/summarize.js
// Vercel serverless function — proxies AI summary requests to Anthropic's API.
// Browser cannot call api.anthropic.com directly (CORS + key exposure), so this
// runs server-side, holds the API key in env vars, and returns just the summary text.
//
// Setup required:
//   1. This file lives at /api/summarize.js in the repo root (next to /api/rss.js)
//   2. Vercel → Project Settings → Environment Variables → add:
//        Name:  ANTHROPIC_API_KEY
//        Value: sk-ant-...   (get from console.anthropic.com → API Keys)
//        Apply to: Production, Preview, Development
//   3. Redeploy after adding the env var (Vercel doesn't auto-pick-up new vars)

const ALLOWED_TYPES = ['article', 'podcast'];
const MAX_INPUT_CHARS = 4000;     // Truncate huge descriptions to control token spend
const MAX_OUTPUT_TOKENS = 250;    // 2-3 sentences fits comfortably

export default async function handler(req, res) {
  // CORS — same origin in production, but harmless if Vercel routes differently
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Use POST' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing ANTHROPIC_API_KEY env var. Add it in Vercel → Settings → Environment Variables, then redeploy.'
    });
  }

  // Vercel parses JSON body automatically when Content-Type is application/json
  const { type = 'article', title = '', content = '' } = req.body || {};

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(', ')}` });
  }
  if (!title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  // Truncate to avoid blowing token budget on unusually long descriptions
  const safeTitle   = String(title).slice(0, 500);
  const safeContent = String(content).slice(0, MAX_INPUT_CHARS);

  const prompt = type === 'podcast'
    ? `Summarize this podcast episode in 2-3 concise sentences. Be direct and factual. Skip generic phrases like "this episode discusses" — start with the actual content.\n\nTitle: ${safeTitle}\n\nDescription: ${safeContent}`
    : `Summarize this news article in 2-3 concise sentences. Be direct and factual. Skip generic phrases like "this article reports" — start with the actual news.\n\nTitle: ${safeTitle}\n\nContent: ${safeContent}`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',   // Fast + cheap for summaries; swap to claude-opus-4-5 if you want top quality
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
      // Vercel free tier defaults to 10s timeout; Claude usually responds in 2-4s
      signal: AbortSignal.timeout(9000),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({
        error: `Anthropic API ${upstream.status}`,
        detail: errText.slice(0, 500),
      });
    }

    const data = await upstream.json();
    const summary = data?.content?.[0]?.text?.trim() || '';

    if (!summary) {
      return res.status(502).json({ error: 'Empty response from Anthropic API' });
    }

    // Cache for 24h — same article shouldn't be re-summarized constantly
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary });

  } catch (err) {
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Anthropic API timed out (>9s)' : err.message || 'Unknown error',
    });
  }
}
