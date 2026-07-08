// /api/summarize.js — v5
// Multi-provider AI cascade: Groq → Gemini → Grok → Perplexity → Claude
// Claude uses prompt caching. Supports modes: summary|takeaways|explain|briefing|briefing-gen
//
// Env vars (Vercel → Settings → Environment Variables):
//   GROQ_API_KEY        — free, console.groq.com
//   GOOGLE_AI_KEY       — free, aistudio.google.com
//   XAI_API_KEY         — grok-3-mini, console.x.ai (free tier)
//   PERPLEXITY_API_KEY  — sonar model, perplexity.ai
//   ANTHROPIC_API_KEY   — paid fallback, console.anthropic.com

const MAX_INPUT       = 3000;
const MAX_INPUT_LARGE = 5000; // briefing-gen mode
const TOKENS = { summary: 320, takeaways: 700, explain: 500, briefing: 400, 'briefing-gen': 700, chat: 300, bias: 400, related: 400, brief: 300 };

// ── Body parser ──────────────────────────────────────────────────────────────
async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !req.body.on) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// ── System instructions ──────────────────────────────────────────────────────
function buildSystem(type, mode) {
  const verb = type === 'podcast' ? 'podcast episode' : 'news article';
  if (mode === 'briefing-gen') {
    return 'You are a professional news briefing synthesizer. Follow the user instructions exactly. Output only what is requested — no headers, no meta-commentary.';
  }
  if (mode === 'briefing') {
    return 'You are a sharp morning news briefing writer. Given headlines from multiple news categories, write ONE punchy sentence per category summarizing the single most important story. Be direct, specific, include names and numbers. No filler.\n\nFormat each line as:\nCategory: One sentence summary';
  }
  if (mode === 'takeaways') {
    return `Extract 4-6 key points from this ${verb}. Each point MUST contain a concrete, specific detail drawn from the text that is NOT already stated in the headline — a proper name, a number, a dollar amount, a date/time, a statistic, a direct quote, or a stated consequence/next step. Across the points, cover the who, what, when, where, why, and how. Never restate or paraphrase the headline, and skip anything generic or obvious.\n\nFormat each as:\n**1. [Specific point]** — [One sentence carrying the concrete detail]\n**2. [Specific point]** — [One sentence carrying the concrete detail]\n(continue to 4-6)`;
  }
  if (mode === 'explain') {
    return `You are an expert news analyst. Explain this ${verb} for someone who wants full context.\n\nStructure your response as:\n**Background** — Context that makes this story important\n**Key Players** — Who is involved and their role\n**What's Happening** — The core development in plain language\n**Wider Impact** — Economic, political, or global implications\n**What to Watch** — One specific development to follow\n\nBe specific. Include names, numbers, and dates. No filler.`;
  }
  if (mode === 'chat') {
    return 'You are MyNewsHub\'s AI news assistant. The user will provide their question along with current news headlines for context. Answer conversationally in 2-4 sentences, referencing specific headlines when helpful. Be direct and informative.';
  }
  if (mode === 'bias') {
    return `Analyze the framing and perspective in this ${verb}. Note what angle it takes, what it emphasizes or omits, and what perspective it favors. Be specific and balanced in your assessment. 3-5 sentences.`;
  }
  if (mode === 'related') {
    return `Provide broader context for this ${verb}. What background, history, or related trends should a reader understand? What does this connect to? 3-5 sentences.`;
  }
  if (mode === 'brief') {
    return `Write a punchy one-paragraph brief on this ${verb}. Lead with the most important fact, include key names and numbers, end with what to watch. No headers.`;
  }
  return `Write a 3-4 sentence summary of this ${verb}. Sentence 1: the core event — what specifically happened, naming the key people/organizations and any pivotal number. Sentences 2-3: the context and why it matters — the cause, the stakes, or the significance beyond the headline. Final sentence: what happens next or the specific thing to watch. Be concrete and factual, ground every sentence in the article's details, and never merely paraphrase the headline. No filler, no "this article discusses".`;
}

// ── User content ─────────────────────────────────────────────────────────────
function buildUser(title, content, mode) {
  if (mode === 'briefing' || mode === 'briefing-gen') return content;
  return `Title: ${title}\n\nContent: ${content}`;
}

function buildPrompt(type, title, content, mode) {
  if (mode === 'briefing-gen') return content; // already contains full instructions
  return buildSystem(type, mode) + '\n\n' + buildUser(title, content, mode);
}

// ── Provider 1: Groq (Llama 3.3 70B, free, ~700 tok/s) ─────────────────────
async function tryGroq(prompt, maxTokens) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

// ── Provider 1.5: Groq Fast (llama-3.1-8b-instant, higher rate limits) ──────
async function tryGroqFast(prompt, maxTokens) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

// ── Provider 2: Google Gemini (free 500 req/day) ────────────────────────────
async function tryGemini(prompt, maxTokens) {
  const key = process.env.GOOGLE_AI_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch { return null; }
}

// ── Provider 3: xAI Grok (OpenAI-compatible, free tier) ─────────────────────
async function tryGrok(prompt, maxTokens) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

// ── Provider 4: Perplexity (sonar model) ────────────────────────────────────
async function tryPerplexity(prompt, maxTokens) {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(14000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

// ── Provider 5: Anthropic Claude (paid, prompt caching) ─────────────────────
async function tryClaude(system, user, maxTokens) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.content?.[0]?.text?.trim() || null;
  } catch { return null; }
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body;
  try { body = await readBody(req); } catch { return res.status(400).json({ error: 'Bad body' }); }

  const { type = 'article', title = '', content = '', mode = 'summary' } = body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'title required' });
  }

  const validModes = ['summary', 'takeaways', 'explain', 'briefing', 'briefing-gen', 'chat', 'bias', 'related', 'brief'];
  const m = validModes.includes(mode) ? mode : 'summary';
  const maxTokens = TOKENS[m] || 250;
  const maxInput = m === 'briefing-gen' ? MAX_INPUT_LARGE : MAX_INPUT;
  const t = String(title).slice(0, 500);
  const c = String(content).slice(0, maxInput);

  const system = buildSystem(type, m);
  const user   = buildUser(t, c, m);
  const prompt = buildPrompt(type, t, c, m);

  // Cascade: Groq-70b → Groq-8b → Gemini → Grok → Perplexity → Claude
  const groqResult = await tryGroq(prompt, maxTokens);
  if (groqResult) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary: groqResult, provider: 'Groq' });
  }

  const groqFastResult = await tryGroqFast(prompt, maxTokens);
  if (groqFastResult) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary: groqFastResult, provider: 'Groq' });
  }

  const geminiResult = await tryGemini(prompt, maxTokens);
  if (geminiResult) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary: geminiResult, provider: 'Gemini' });
  }

  const grokResult = await tryGrok(prompt, maxTokens);
  if (grokResult) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary: grokResult, provider: 'Grok' });
  }

  const perplexityResult = await tryPerplexity(prompt, maxTokens);
  if (perplexityResult) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary: perplexityResult, provider: 'Perplexity' });
  }

  const claudeResult = await tryClaude(system, user, maxTokens);
  if (claudeResult) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ summary: claudeResult, provider: 'Claude' });
  }

  // All five failed
  const configured = [];
  if (process.env.GROQ_API_KEY)        configured.push('Groq');
  if (process.env.GOOGLE_AI_KEY)       configured.push('Gemini');
  if (process.env.XAI_API_KEY)         configured.push('Grok');
  if (process.env.PERPLEXITY_API_KEY)  configured.push('Perplexity');
  if (process.env.ANTHROPIC_API_KEY)   configured.push('Claude');

  if (configured.length === 0) {
    return res.status(500).json({
      error: 'No AI provider configured. Add GROQ_API_KEY (free) in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  return res.status(502).json({
    error: `All providers failed (tried: ${configured.join(', ')}). Try again in a moment.`,
  });
}
