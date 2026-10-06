// /api/summarize.js — v6
// Multi-provider AI cascade: Groq → Groq-Fast → Gemini → Grok → Perplexity → Claude
// Claude uses prompt caching. Supports modes: summary|takeaways|explain|briefing|briefing-gen
//
// Model IDs are NOT inline here — every one lives in ../lib/ai-models.js with the date it
// was last confirmed working. A provider returning a non-ok response for a model that
// worked yesterday almost always means a retired/renamed model, not a bad key: check that
// registry (and /api/health) before rotating anything.
//
// Every cascade attempt is recorded, pass or fail, and a total failure returns the full
// attempt list — "no keys configured" and "everything timed out" must not look identical.
//
// Env vars (Vercel → Settings → Environment Variables):
//   GROQ_API_KEY        — free, console.groq.com
//   GOOGLE_AI_KEY       — free, aistudio.google.com
//   XAI_API_KEY         — console.x.ai (free tier)
//   PERPLEXITY_API_KEY  — perplexity.ai
//   ANTHROPIC_API_KEY   — paid fallback, console.anthropic.com

import { MODELS, CASCADE_ORDER, CASCADE_TIMEOUTS, PROMPT_VERSION } from '../lib/ai-models.js';

// Input caps, per mode class. The EXTRACT modes are summarized from article body text
// that api/extract.js returns (up to MAX_CHARS=8000); capping those at 3000 threw away
// the back ~60% of any long piece before the model ever saw it. 7500 keeps headroom
// under extract's 8000 while letting the model read the whole article. Non-extraction
// modes (chat/briefing) and briefing-gen keep their own, smaller caps.
const MAX_INPUT         = 3000; // chat, chat-open, briefing — content is already curated/short
const MAX_INPUT_EXTRACT = 7500; // summary|takeaways|explain|bias|related|brief — full article body
const MAX_INPUT_LARGE   = 5000; // briefing-gen mode
const EXTRACT_MODES = new Set(['summary', 'takeaways', 'explain', 'bias', 'related', 'brief']);
const TOKENS = { summary: 320, takeaways: 700, explain: 500, briefing: 400, 'briefing-gen': 700, chat: 300, 'chat-open': 300, bias: 400, related: 400, brief: 300 };

// Appended to the system prompt ONLY when the client flags this as tier-(b) preview text
// (extraction failed, we're summarizing a short RSS blurb). Without it the model is still
// asked for a 3–4 sentence summary of 1–2 sentences of input, so it pads and restates.
const SNIPPET_CONSTRAINT = '\n\nIMPORTANT: The source text below is a SHORT PREVIEW SNIPPET (an RSS blurb), not the full article. Be brief — at most 2 sentences (or at most 2 bullets). State ONLY what the snippet explicitly says; do not infer, extrapolate, or add any fact not present in it. If it supports only one line, write one. Never pad to reach a length.';

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
// PROMPT VERSIONING: any edit to buildSystem() below changes what a summary looks like,
// and summaries are cached for 24h (7-day stale-while-revalidate). Bump PROMPT_VERSION in
// lib/ai-models.js IN THE SAME COMMIT as the prompt change, or pre-improvement summaries
// keep being served for up to a week with nothing to distinguish them.
function buildSystem(type, mode) {
  const verb = type === 'podcast' ? 'podcast episode' : 'news article';
  if (mode === 'briefing-gen') {
    return 'You are a professional news briefing synthesizer. Follow the user instructions exactly. Output only what is requested — no headers, no meta-commentary.';
  }
  if (mode === 'briefing') {
    return 'You are a sharp morning news briefing writer. Given headlines from multiple news categories, write ONE punchy sentence per category summarizing the single most important story. Be direct, specific, include names and numbers. No filler.\n\nFormat each line as:\nCategory: One sentence summary';
  }
  if (mode === 'takeaways') {
    return `Extract the key points from this ${verb}. Output ONLY as many bullets as the source genuinely supports — three strong bullets beat six padded ones. Rules:
- Every bullet must carry a concrete fact NOT already in the headline: a name, a number, a dollar amount, a date, a place, or a direct quote under 15 words.
- If a fact isn't in the source, OMIT the bullet. Never write a bullet that says information is missing.
- Never output metadata as a takeaway (episode number, release date, sponsor, host, "the speaker's source of information") — that is not news.
- BANNED phrases (never use): "not specified", "not mentioned", "the provided content", "the article does not".
Format each as:
**1. [Point]** — [one sentence with the concrete fact]
**2. [Point]** — [one sentence with the concrete fact]`;
  }
  if (mode === 'explain') {
    return `You are an expert news analyst. Explain this ${verb} for someone who wants full context.\n\nStructure your response as:\n**Background** — Context that makes this story important\n**Key Players** — Who is involved and their role\n**What's Happening** — The core development in plain language\n**Wider Impact** — Economic, political, or global implications\n**What to Watch** — One specific development to follow\n\nBe specific. Include names, numbers, and dates. No filler.`;
  }
  if (mode === 'chat') {
    return `You are MyNewsHub's news concierge. Prefer the FEED CONTEXT provided. If the FEED CONTEXT answers the question, ground your answer in it and name sources (e.g. "per Reuters"). If the FEED CONTEXT does NOT contain the answer, say "This isn't in today's feed —" and then answer from general knowledge concisely. Never invent story sources, quotes, or dates. Be concise: 2-4 sentences.`;
  }
  if (mode === 'chat-open') {
    return `You are MyNewsHub's assistant. Answer the user's question about the SPECIFIC ARTICLE provided in their message. Ground every statement in that article's text. If the article doesn't contain the answer, say so in one sentence, then answer from general knowledge clearly prefaced with "Beyond this article:". Be concise: 2-4 sentences.`;
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
  return `Write a 3-4 sentence summary of this ${verb}, grounded entirely in the source text:
- What happened — the concrete event, naming the key people/organizations and any pivotal number.
- Why it matters — the stakes and context beyond the headline.
- What's next — ONLY if the source states a specific next step; then end there. If the source states no next step, end after the stakes.
Never paraphrase the headline. BANNED: filler closers like "as the situation unfolds, it will be crucial to watch for further developments", "only time will tell", "this is a developing story", and the phrase "the provided content". No "this article discusses".`;
}

// ── User content ─────────────────────────────────────────────────────────────
function buildUser(title, content, mode) {
  if (mode === 'briefing' || mode === 'briefing-gen' || mode === 'chat' || mode === 'chat-open') return content; // chat content is already a clean FEED CONTEXT + QUESTION block
  return `Title: ${title}\n\nContent: ${content}`;
}

function buildPrompt(type, title, content, mode) {
  if (mode === 'briefing-gen') return content; // already contains full instructions
  return buildSystem(type, mode) + '\n\n' + buildUser(title, content, mode);
}

// ── Provider calls ───────────────────────────────────────────────────────────
// Each call resolves to an ATTEMPT RECORD — never a bare null. A failure carries why:
//   no-key        — the provider's env var is unset (nothing was sent)
//   http-error    — the provider answered non-2xx; `status` says which (401/403 → key,
//                   404/400 → almost certainly a retired/renamed model, 429 → rate limit)
//   timeout       — the request exceeded this step's budget; `detail` says the budget
//   network-error — fetch itself threw (DNS, TLS, socket) before any response
//   empty-response— 2xx, but the body carried no usable text (filtered/truncated output)
// Collapsing these into one null is what made a dead key and a dead network look the same.
const TIMEOUTS = CASCADE_TIMEOUTS;

// Provider error bodies are echoed back to the caller for debugging, so scrub the key
// out of them first — Gemini in particular takes the key as a query parameter.
function redact(text, secret) {
  let s = String(text || '').replace(/key=[^&\s"']+/gi, 'key=[redacted]');
  if (secret) s = s.split(secret).join('[redacted]');
  return s;
}

function buildRequest(entry, apiKey, { prompt, system, user, maxTokens }) {
  if (entry.api === 'gemini') {
    return {
      url: `${entry.endpoint}/${entry.id}:generateContent?key=${apiKey}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
        }),
      },
    };
  }
  if (entry.api === 'anthropic') {
    return {
      url: entry.endpoint,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31',
        },
        body: JSON.stringify({
          model: entry.id,
          max_tokens: maxTokens,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: user }],
        }),
      },
    };
  }
  // openai-compatible: Groq, Groq-Fast, Grok, Perplexity
  return {
    url: entry.endpoint,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: entry.id,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    },
  };
}

function extractText(entry, data) {
  if (entry.api === 'gemini')    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (entry.api === 'anthropic') return data?.content?.[0]?.text?.trim() || '';
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

async function callProvider(step, payload) {
  const entry   = MODELS[step];
  const timeout = TIMEOUTS[step] || 12000;
  const apiKey  = process.env[entry.env];
  const base    = { step, provider: entry.provider, model: entry.id };

  if (!apiKey) return { ...base, ok: false, reason: 'no-key', detail: `${entry.env} unset`, ms: 0 };

  const started = Date.now();
  try {
    const { url, init } = buildRequest(entry, apiKey, payload);
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
    const ms = Date.now() - started;
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return { ...base, ok: false, reason: 'http-error', status: r.status, detail: redact(body, apiKey).slice(0, 200), ms };
    }
    const data = await r.json().catch(() => null);
    const text = data ? extractText(entry, data) : '';
    if (!text) return { ...base, ok: false, reason: 'empty-response', status: r.status, detail: 'no text in 2xx body', ms };
    return { ...base, ok: true, text, ms };
  } catch (err) {
    const ms = Date.now() - started;
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return {
      ...base,
      ok: false,
      reason: timedOut ? 'timeout' : 'network-error',
      detail: timedOut ? `exceeded ${timeout}ms` : redact(err?.message || String(err), apiKey).slice(0, 120),
      ms,
    };
  }
}

// What the caller sees in `attempts` — the record minus the summary text.
function toAttempt(r) {
  const a = { provider: r.provider, model: r.model, reason: r.reason, ms: r.ms };
  if (r.status) a.status = r.status;
  if (r.detail) a.detail = r.detail;
  return a;
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

  const validModes = ['summary', 'takeaways', 'explain', 'briefing', 'briefing-gen', 'chat', 'chat-open', 'bias', 'related', 'brief'];
  const m = validModes.includes(mode) ? mode : 'summary';
  const maxTokens = TOKENS[m] || 250;
  const maxInput = m === 'briefing-gen' ? MAX_INPUT_LARGE : EXTRACT_MODES.has(m) ? MAX_INPUT_EXTRACT : MAX_INPUT;
  const t = String(title).slice(0, 500);
  const c = String(content).slice(0, maxInput);

  // Tier-(b) preview: client sets `preview:true` when it's summarizing an RSS snippet
  // because extraction failed. Tighten the prompt so the model doesn't pad a blurb.
  const isPreview = !!body.preview && EXTRACT_MODES.has(m);
  const system = buildSystem(type, m) + (isPreview ? SNIPPET_CONSTRAINT : '');
  const payload = {
    system,
    user:   buildUser(t, c, m),
    // buildPrompt already composes system+user for the providers that take one blob
    // (Gemini); keep the preview constraint in that path too.
    prompt: m === 'briefing-gen' ? c : system + '\n\n' + buildUser(t, c, m),
    maxTokens,
  };

  // Cascade: Groq-70b → Groq-8b → Gemini → Grok → Perplexity → Claude.
  // Every failed step is kept so a total failure can say what actually happened, and a
  // success can still show what it had to fall through to get there.
  res.setHeader('X-Prompt-Version', PROMPT_VERSION);
  const attempts = [];
  for (const step of CASCADE_ORDER) {
    const r = await callProvider(step, payload);
    if (r.ok) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({
        summary: r.text,
        provider: r.provider,
        model: r.model,
        promptVersion: PROMPT_VERSION,   // identifies which prompt produced a cached entry
        ms: r.ms,
        ...(attempts.length ? { attempts } : {}),
      });
    }
    attempts.push(toAttempt(r));
  }

  // Everything failed. Never cache a failure, and never report it as a bare "all failed".
  res.setHeader('Cache-Control', 'no-store');

  if (attempts.every(a => a.reason === 'no-key')) {
    return res.status(500).json({
      error: 'No AI provider configured. Add GROQ_API_KEY (free) in Vercel → Settings → Environment Variables, then redeploy.',
      attempts,
      promptVersion: PROMPT_VERSION,
    });
  }

  const tried = attempts.map(a => `${a.provider} (${a.model}): ${a.reason}${a.status ? ' ' + a.status : ''}`).join('; ');
  return res.status(502).json({
    error: `All providers failed — ${tried}. Try again in a moment.`,
    attempts,
    promptVersion: PROMPT_VERSION,
    hint: attempts.some(a => a.reason === 'http-error' && [400, 404].includes(a.status))
      ? 'A 400/404 from a provider usually means a retired or renamed model — check lib/ai-models.js before rotating keys.'
      : undefined,
  });
}
