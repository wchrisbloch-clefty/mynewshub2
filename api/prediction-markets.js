// /api/prediction-markets.js — prediction-market probability snapshots (Pass: item 4).
//
// Treats Polymarket / Kalshi as MARKET-DATA feeds (like the stock ticker), NOT as
// news sources — it returns compact { question, probability, source, url } snapshots,
// never article cards. The client passes keywords (followed topics + trending + top
// headline entities); we surface the markets that MATCH them, then fill with the
// highest-volume "trending" contracts so the module is relevant, not random.
//
// Sources:
//   • Polymarket — public Gamma API, no key. Always attempted.
//   • Kalshi     — needs KALSHI_API_KEY; DARK (skipped) until that env var is set, so
//                  the module ships on Polymarket alone and lights up Kalshi later.
//
// Fail-soft by design: always returns HTTP 200 with a (possibly empty) markets array;
// any fetch/parse error yields [] for that source and never throws to the caller.

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !req.body.on) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return new Promise(resolve => {
    let d = ''; req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const asArray = v => { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } } return []; };
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

// ── Polymarket (public Gamma API) ────────────────────────────────────────────
async function fetchPolymarket() {
  try {
    const url = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&archived=false&limit=150&order=volumeNum&ascending=false';
    const r = await fetch(url, { headers: { 'User-Agent': 'MyNewsHub/1.0' }, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return [];
    const rows = await r.json();
    if (!Array.isArray(rows)) return [];
    const out = [];
    for (const m of rows) {
      const prices = asArray(m.outcomePrices).map(num);
      const outcomes = asArray(m.outcomes);
      if (!m.question || prices.length < 2) continue;
      // Binary market → probability of the "Yes" (first) outcome.
      const yesIdx = outcomes.findIndex(o => /^yes$/i.test(String(o)));
      const prob = Math.round((prices[yesIdx >= 0 ? yesIdx : 0]) * 100);
      if (!(prob >= 0 && prob <= 100)) continue;
      out.push({
        question: String(m.question).trim(),
        probability: prob,
        source: 'Polymarket',
        url: m.slug ? `https://polymarket.com/event/${m.slug}` : 'https://polymarket.com',
        volume: num(m.volumeNum || m.volume),
      });
    }
    return out;
  } catch { return []; }
}

// ── Kalshi (key-gated; dark until KALSHI_API_KEY is provided) ─────────────────
async function fetchKalshi() {
  const key = process.env.KALSHI_API_KEY;
  if (!key) return []; // intentionally dark until a key exists
  try {
    // NOTE: Kalshi's trade-api authenticates most endpoints with a signed request.
    // We attempt a simple key header here; if the account's auth needs request
    // signing, this fails soft (→ []) and Kalshi simply stays dark until wired fully.
    const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=100';
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'User-Agent': 'MyNewsHub/1.0' }, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return [];
    const d = await r.json();
    const markets = Array.isArray(d?.markets) ? d.markets : [];
    return markets.map(m => ({
      question: String(m.title || m.subtitle || '').trim(),
      probability: Math.round(num(m.yes_bid || m.last_price)),  // cents ≈ percent
      source: 'Kalshi',
      url: m.ticker ? `https://kalshi.com/markets/${m.ticker}` : 'https://kalshi.com',
      volume: num(m.volume),
    })).filter(x => x.question && x.probability >= 0 && x.probability <= 100);
  } catch { return []; }
}

function matchesKeyword(question, kws) {
  const q = question.toLowerCase();
  return kws.some(k => k && q.includes(k));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body; try { body = await readBody(req); } catch { return res.status(200).json({ markets: [] }); }
  const keywords = (Array.isArray(body.keywords) ? body.keywords : [])
    .map(k => String(k || '').toLowerCase().trim()).filter(k => k.length >= 3).slice(0, 40);

  const [poly, kalshi] = await Promise.all([fetchPolymarket(), fetchKalshi()]);
  const all = [...poly, ...kalshi];
  if (!all.length) { res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800'); return res.status(200).json({ markets: [] }); }

  // Relevance: keyword-matched markets first (by volume), then top-volume "trending"
  // contracts to fill — so the module is tied to what the app already covers, but is
  // never empty when nothing matches.
  const seen = new Set();
  const dedup = m => { const k = m.question.slice(0, 80).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; };
  const matched = keywords.length ? all.filter(m => matchesKeyword(m.question, keywords)).sort((a, b) => b.volume - a.volume) : [];
  const trending = all.slice().sort((a, b) => b.volume - a.volume);
  const markets = [];
  for (const m of [...matched, ...trending]) { if (markets.length >= 8) break; if (dedup(m)) markets.push({ ...m, matched: matchesKeyword(m.question, keywords) }); }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  return res.status(200).json({ markets });
}
