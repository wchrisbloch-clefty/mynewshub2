// /api/health.js — live reachability check for the summarize cascade.
//
// Answers one question no other endpoint answers: which providers are actually reachable
// RIGHT NOW, without triggering a real summary request.
//
// This makes a REAL (1-token) call to every provider — it is not an env-var presence
// check. A key that is present but expired, revoked, rate-limited, or pointed at a
// retired model reports as a failure here, which an env-var check would call healthy.
//
// Three states per provider, never a boolean:
//   ok                      — key present, provider answered 2xx
//   key-present-call-failed — key present, the call did not succeed (`status`/`reason` say why)
//   key-missing             — env var unset, nothing was sent (ms is null: no call was made)
//
// Response time is reported per provider against that step's cascade budget, so a provider
// that is technically "working" but consistently too slow to win the race is visible.
//
//   GET /api/health                 all six cascade steps
//   GET /api/health?provider=claude one step only (key of MODELS in lib/ai-models.js)
//   GET /api/health?fresh=1         bypass the 60s CDN cache
//
// HTTP 200 when at least one provider is ok (the cascade can still serve), 503 when none is.

import { MODELS, CASCADE_ORDER, CASCADE_TIMEOUTS, PROMPT_VERSION } from '../lib/ai-models.js';

const PROBE_TIMEOUT = 8000;   // per provider; independent of the cascade's own budgets
const PROBE_PROMPT  = 'ping'; // smallest prompt that is still a valid request

function redact(text, secret) {
  let s = String(text || '').replace(/key=[^&\s"']+/gi, 'key=[redacted]');
  if (secret) s = s.split(secret).join('[redacted]');
  return s;
}

// The smallest real request each API shape accepts: one token out, one word in.
function buildProbe(entry, apiKey) {
  if (entry.api === 'gemini') {
    return {
      url: `${entry.endpoint}/${entry.id}:generateContent?key=${apiKey}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROBE_PROMPT }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      },
    };
  }
  if (entry.api === 'anthropic') {
    return {
      url: entry.endpoint,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: entry.id, max_tokens: 1, messages: [{ role: 'user', content: PROBE_PROMPT }] }),
      },
    };
  }
  return {
    url: entry.endpoint,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: entry.id, messages: [{ role: 'user', content: PROBE_PROMPT }], max_tokens: 1 }),
    },
  };
}

// A non-ok status is not one undifferentiated failure — the fix differs per class.
function diagnose(status) {
  if (status === 401 || status === 403) return 'key rejected — expired, revoked, or wrong env var';
  if (status === 404 || status === 400) return 'model likely retired or renamed — check lib/ai-models.js before rotating the key';
  if (status === 429) return 'rate limited or quota exhausted — key is valid';
  if (status >= 500)  return 'provider-side outage';
  return 'unexpected status';
}

async function probe(step) {
  const entry  = MODELS[step];
  const budget = CASCADE_TIMEOUTS[step] || 12000;
  const apiKey = process.env[entry.env];
  const base   = { step, provider: entry.provider, model: entry.id, env: entry.env, confirmed: entry.confirmed, budgetMs: budget };

  if (!apiKey) return { ...base, state: 'key-missing', ms: null, reason: `${entry.env} unset` };

  const started = Date.now();
  try {
    const { url, init } = buildProbe(entry, apiKey);
    const r  = await fetch(url, { ...init, signal: AbortSignal.timeout(PROBE_TIMEOUT) });
    const ms = Date.now() - started;
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return { ...base, state: 'key-present-call-failed', ms, status: r.status, reason: diagnose(r.status), detail: redact(body, apiKey).slice(0, 200) };
    }
    // A one-token ping that already burns half a full summary's budget will lose the
    // cascade race on a real request, even though the provider is "up".
    return { ...base, state: 'ok', ms, status: r.status, slow: ms > budget / 2 };
  } catch (err) {
    const ms = Date.now() - started;
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return {
      ...base,
      state: 'key-present-call-failed',
      ms,
      reason: timedOut ? 'timeout' : 'network-error',
      detail: timedOut ? `no response within ${PROBE_TIMEOUT}ms` : redact(err?.message || String(err), apiKey).slice(0, 120),
    };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'GET only' });

  const q = req.query || {};
  const only = typeof q.provider === 'string' ? q.provider : '';
  if (only && !MODELS[only]) {
    return res.status(400).json({ error: `Unknown provider '${only}'. Known: ${CASCADE_ORDER.join(', ')}` });
  }
  const steps = only ? [only] : CASCADE_ORDER;

  // Probing costs a real (if tiny) call per provider, so the default response is cached
  // for 60s at the CDN — enough to stop a dashboard poll from hammering paid providers.
  // `?fresh=1` is a different cache key, so it genuinely bypasses that.
  res.setHeader('Cache-Control', q.fresh ? 'no-store' : 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('X-Prompt-Version', PROMPT_VERSION);

  const started   = Date.now();
  const providers = await Promise.all(steps.map(probe));
  const counts    = {
    ok:      providers.filter(p => p.state === 'ok').length,
    failed:  providers.filter(p => p.state === 'key-present-call-failed').length,
    missing: providers.filter(p => p.state === 'key-missing').length,
    slow:    providers.filter(p => p.slow).length,
  };

  return res.status(counts.ok > 0 ? 200 : 503).json({
    checkedAt: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    cascadeOrder: steps,
    counts,
    // The cascade serves as long as ONE provider answers; this is not "everything is fine".
    servable: counts.ok > 0,
    totalMs: Date.now() - started,
    providers,
    note: 'Each provider was probed with a real 1-token call, not an env-var check. `confirmed` is the date that model ID was last verified against the provider lineup — update it in lib/ai-models.js when a probe reports ok.',
  });
}
