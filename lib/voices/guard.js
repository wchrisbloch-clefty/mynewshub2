// lib/voices/guard.js — shared protection for the quota-spending Voices routes (item 2).
// CORS allow-list (no wildcard) + a light per-IP rate limit. Dependency-free.

// Allowed browser origins: localhost (dev), and the production + Vercel preview domains.
// Tune PROD_HOST / the preview pattern to your real domain.
const ALLOW = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  /^https:\/\/mynewshub2\.vercel\.app$/i,                 // production
  /^https:\/\/mynewshub2-[a-z0-9-]+\.vercel\.app$/i,      // Vercel preview deploys
  /^https:\/\/([a-z0-9-]+\.)*mynewshub2\.app$/i,          // (reserved) custom domain
];

export function originAllowed(origin) {
  if (!origin) return true;            // same-origin / server-to-server (no Origin header)
  return ALLOW.some(re => re.test(origin));
}

// Sets a SPECIFIC Access-Control-Allow-Origin (never '*') for allowed origins; returns
// whether the request's origin is allowed (true when there is no Origin header).
export function allowOrigin(req, res) {
  const origin = (req.headers && req.headers.origin) || '';
  const ok = originAllowed(origin);
  if (origin && ok) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  return ok;
}

// Per-IP sliding-window limit. In-memory (per serverless instance) — a light guardrail,
// not a global quota; returns true (and sends 429) when the caller is over the limit.
const WINDOW_MS = 60_000, MAX = 30;
const hits = new Map();
export function rateLimited(req, res) {
  const ip = (((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim())
    || (req.socket && req.socket.remoteAddress) || 'unknown';
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  if (arr.length > MAX) { res.setHeader('Retry-After', '60'); res.status(429).json({ error: 'rate limited' }); return true; }
  return false;
}

// One call that enforces both: sets CORS, 403s a disallowed origin, 429s over-limit.
// Returns true if the request was REJECTED (handler should return immediately).
export function guard(req, res) {
  const ok = allowOrigin(req, res);
  if (!ok) { res.status(403).json({ error: 'origin not allowed' }); return true; }
  if (rateLimited(req, res)) return true;
  return false;
}
