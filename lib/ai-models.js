// lib/ai-models.js — single source of truth for AI model IDs + prompt version.
//
// WHY THIS FILE EXISTS
// Every model ID used by the summarize cascade used to be an inline string literal
// inside its provider function. When a provider retires or renames a model, that call
// starts returning a non-ok response and the cascade silently falls through to the next
// provider — the summary still appears, so nothing looks broken. This registry makes
// every model ID, and the date it was last confirmed working, visible in one place.
//
// DEBUGGING RULE — READ BEFORE ROTATING A KEY
// A provider returning a non-ok response for a model that worked yesterday is almost
// always a RETIRED OR RENAMED MODEL, not a bad key. Check this registry first:
//   1. Hit /api/health — it makes a real live call per provider. A key problem shows up
//      as 401/403 on every model for that provider; a model problem shows up as
//      404/400 on one model while the provider's other models still answer.
//   2. Only if the failure is 401/403 across the board should you suspect key rotation.
//   3. When you change an ID here, update `confirmed` and leave a one-line note saying why.
//
// `confirmed` = the date this ID was last verified against the provider's current lineup.
// The 2026-08-15 dates come from the repo-wide model audit in commit 0071390 (a static
// audit, not a live call). Update a date to the day /api/health reported `ok` for it.

// `provider` is the user-facing label; both Groq steps deliberately share it (the UI has
// always said "Groq"), so the `model` field is what distinguishes them in reports.
export const MODELS = {
  groq:       { provider: 'Groq',       env: 'GROQ_API_KEY',       api: 'openai',    endpoint: 'https://api.groq.com/openai/v1/chat/completions',           id: 'llama-3.3-70b-versatile', confirmed: '2026-08-15' },
  groqFast:   { provider: 'Groq',       env: 'GROQ_API_KEY',       api: 'openai',    endpoint: 'https://api.groq.com/openai/v1/chat/completions',           id: 'llama-3.1-8b-instant',    confirmed: '2026-08-15' },
  gemini:     { provider: 'Gemini',     env: 'GOOGLE_AI_KEY',      api: 'gemini',    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',   id: 'gemini-2.5-flash',        confirmed: '2026-08-15' },
  grok:       { provider: 'Grok',       env: 'XAI_API_KEY',        api: 'openai',    endpoint: 'https://api.x.ai/v1/chat/completions',                      id: 'grok-3-mini',             confirmed: '2026-08-15' },
  perplexity: { provider: 'Perplexity', env: 'PERPLEXITY_API_KEY', api: 'openai',    endpoint: 'https://api.perplexity.ai/chat/completions',                id: 'sonar',                   confirmed: '2026-08-15' },
  // CHANGED 2026-08-15 (commit 0071390): was `claude-sonnet-4-6`, which is not in the
  // current Anthropic lineup — the last fallback had been dark and nothing reported it.
  claude:     { provider: 'Claude',     env: 'ANTHROPIC_API_KEY',  api: 'anthropic', endpoint: 'https://api.anthropic.com/v1/messages',                     id: 'claude-sonnet-5',         confirmed: '2026-08-15' },
};

// Models used outside the summarize cascade. Same rule applies: one line, one date.
export const AUX_MODELS = {
  whisper: { provider: 'Groq', env: 'GROQ_API_KEY', api: 'groq-audio', endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions', id: 'whisper-large-v3', confirmed: '2026-08-15' }, // /api/listen audio transcription
};

// Order the summarize cascade tries these in. /api/health probes them in this order too,
// so the health report reads top-to-bottom the way a real request falls through.
export const CASCADE_ORDER = ['groq', 'groqFast', 'gemini', 'grok', 'perplexity', 'claude'];

// Per-step timeout budget the summarize cascade allows (ms). Shared with /api/health so a
// provider that is technically reachable but too slow to win the race shows up as slow
// there instead of silently losing every real request.
export const CASCADE_TIMEOUTS = { groq: 10000, groqFast: 7000, gemini: 12000, grok: 12000, perplexity: 14000, claude: 12000 };

// ── Prompt version ───────────────────────────────────────────────────────────
// BUMP THIS IN THE SAME COMMIT AS ANY CHANGE TO buildSystem() IN api/summarize.js.
// Summaries are served with `s-maxage=86400, stale-while-revalidate=604800`, so a prompt
// improvement (the banned-phrases rules, for example) can otherwise be masked by
// pre-improvement summaries for up to seven days with no signal that they are stale.
// The version travels three ways so a stale entry is always identifiable:
//   • the client appends `?pv=<version>` to /api/summarize, so it is part of the cache key
//   • every response carries `promptVersion` in its JSON body
//   • every response carries an `X-Prompt-Version` header
// Format: sum-<YYYY-MM-DD><letter>, letter incrementing for same-day bumps.
//
// CHANGELOG
//   sum-2026-08-25a — first versioned prompt set (baseline; no prompt text changed).
export const PROMPT_VERSION = 'sum-2026-08-25a';
