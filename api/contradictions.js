// /api/contradictions.js — consensus + genuine factual disagreement detection.
//
// Modeled on api/summarize.js's provider cascade (Groq → Gemini → Grok → Perplexity
// → Claude), but returns STRUCTURED JSON, not prose. Standalone file — does not
// import or change api/summarize.js.
//
// Input  (POST): { topic: string, items: [{ title, summary?, source, tier? }] }
// Output (JSON): {
//   consensus: string,                       // what most sources agree on ('' if none)
//   conflicts: [{
//     issue: string,                          // e.g. "reported death toll"
//     positions: [{ claim, tier, sources[] }] // ordered strongest-tier first
//   }]
// }
// Only genuine FACTUAL disagreements (different numbers, opposite claims) — never
// differences of tone or wording. Empty conflicts[] means "no real disagreement".

const TIER_RANK = { verified: 3, reported: 2, unverified: 1, '': 0 };

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !req.body.on) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function buildPrompt(topic, items) {
  const lines = items.map((it, i) =>
    `[${i + 1}] source="${it.source || 'unknown'}" tier="${it.tier || 'unverified'}"\n    ${String(it.title || '').slice(0, 200)}${it.summary ? `\n    ${String(it.summary).slice(0, 300)}` : ''}`
  ).join('\n');
  return `You compare news coverage of a single topic and detect GENUINE FACTUAL disagreements.

TOPIC: ${topic}

ITEMS:
${lines}

Return STRICT JSON only (no prose, no code fences) shaped exactly:
{"consensus": "<one sentence on what most sources agree on, or empty string if they don't overlap enough>",
 "conflicts": [{"issue":"<short label>","positions":[{"claim":"<specific factual claim>","tier":"<verified|reported|unverified>","sources":["<source name>"]}]}]}

Rules:
- A conflict is ONLY a factual contradiction: different numbers, dates, names, or opposite claims (X happened vs X did not). NEVER list differences of tone, emphasis, or wording.
- If sources merely emphasize different angles but do not contradict, that is NOT a conflict — omit it.
- Each conflict needs at least two positions that genuinely contradict. Order positions strongest tier first (verified > reported > unverified).
- If there is no real factual disagreement, return "conflicts": [].
- Keep claims short and concrete. Do not invent sources or facts not present in the items.`;
}

// ── Provider callers (same models/keys as summarize.js) ──────────────────────
async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 700, temperature: 0.2, response_format: { type: 'json_object' } }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d?.choices?.[0]?.message?.content || null;
  } catch { return null; }
}
async function callGemini(prompt) {
  const key = process.env.GOOGLE_AI_KEY; if (!key) return null;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 700, temperature: 0.2, responseMimeType: 'application/json' } }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { return null; }
}
async function callGrok(prompt) {
  const key = process.env.XAI_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'grok-3-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 700, temperature: 0.2 }),
      signal: AbortSignal.timeout(13000),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d?.choices?.[0]?.message?.content || null;
  } catch { return null; }
}
async function callClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(13000),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d?.content?.[0]?.text || null;
  } catch { return null; }
}

function parseJSON(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch { return null; }
}

// Order positions strongest-tier-first so a lone verified source outweighs several
// unverified ones (never a false 50/50), and drop malformed/one-sided "conflicts".
function normalize(parsed) {
  const consensus = typeof parsed?.consensus === 'string' ? parsed.consensus.trim() : '';
  const conflicts = Array.isArray(parsed?.conflicts) ? parsed.conflicts : [];
  const clean = conflicts.map(c => {
    const positions = Array.isArray(c?.positions) ? c.positions
      .filter(p => p && p.claim)
      .map(p => ({ claim: String(p.claim).slice(0, 240), tier: TIER_RANK[p.tier] != null ? p.tier : 'unverified', sources: Array.isArray(p.sources) ? p.sources.slice(0, 4) : [] }))
      .sort((x, y) => (TIER_RANK[y.tier] || 0) - (TIER_RANK[x.tier] || 0)) : [];
    return { issue: String(c?.issue || 'Disputed detail').slice(0, 120), positions };
  }).filter(c => c.positions.length >= 2); // a real conflict needs ≥2 contradicting positions
  return { consensus, conflicts: clean };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body;
  try { body = await readBody(req); } catch { return res.status(400).json({ error: 'Bad body' }); }
  const topic = String(body.topic || '').trim();
  const items = Array.isArray(body.items) ? body.items.filter(i => i && i.title).slice(0, 12) : [];
  if (!topic || items.length < 2) {
    // Not enough overlapping coverage to compare — an empty, honest result.
    return res.status(200).json({ consensus: '', conflicts: [] });
  }

  const prompt = buildPrompt(topic, items);
  const raw = (await callGroq(prompt)) || (await callGemini(prompt)) || (await callGrok(prompt)) || (await callClaude(prompt));
  const parsed = parseJSON(raw);
  if (!parsed) return res.status(200).json({ consensus: '', conflicts: [] });

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json(normalize(parsed));
}
