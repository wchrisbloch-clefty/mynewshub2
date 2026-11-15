// lib/voices/handler-find.js — Voices SOURCE FINDER (Batch AC, item AC2).
//
// Answers "who should I follow for <category>?" — a question Voices could not ask before.
// Dispatched from api/signals.js as kind=voicefind (NO new api/ file — the Hobby 12-function
// cap is full). It uses Firecrawl (FIRECRAWL_API_KEY, env only) to: run ONE web search for
// credible "who to follow / leading voices" pages, then scrape AT MOST TWO of them with a JSON
// schema, returning up to 8 UNVERIFIED candidates. Nothing is auto-followed; the client turns
// an accepted candidate into a status:'seed' voice and runs the existing E2 confirm flow.
//
// Governance: every candidate is labelled unverified and carries an evidence link; handles are
// NEVER guessed here (the schema deliberately has no handle fields beyond optional link-outs).
//
// Cost + safety (Firecrawl bills per call):
//   • no key            → { enabled:false, note }               (still cached at the edge)
//   • any error/timeout → { enabled:true, candidates:[], error } ALWAYS HTTP 200, fail-soft
//   • hard cap of 3 Firecrawl calls per request (1 search + 2 scrapes)
//   • GET only, CDN s-maxage=86400; guard()+allowOrigin() like the sibling voice kinds
//   • no secret is ever read into a response or an error string
//
// The client adds its own 7-day localStorage cache + 60s cooldown + on-demand-only trigger.

process.noDeprecation = true;

import { allowOrigin, guard } from './guard.js';

const FC_BASE = 'https://api.firecrawl.dev/v2';
const BUDGET_MS = 8000;        // whole-request wall clock
const MAX_FC_CALLS = 3;        // 1 search + 2 scrapes
const MAX_CANDIDATES = 8;

// ── voiceId: EXACT mirror of src/modules/voices/model.js so server dedupe matches the client.
// (Kept inline rather than imported so this serverless handler has no cross-tree src/ import.)
const slug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export function voiceId(name, type = 'person') { return `${type}:${slug(name)}`; }

const firecrawlOn = () => !!process.env.FIRECRAWL_API_KEY;

// The JSON schema handed to Firecrawl's scrape — an array of credible voices for a category.
export const CANDIDATE_SCHEMA = {
  type: 'object',
  properties: {
    voices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['person', 'org'] },
          role: { type: 'string' },
          whyRelevant: { type: 'string' },
          evidenceUrl: { type: 'string' },
          siteUrl: { type: 'string' },
          youtubeUrl: { type: 'string' },
          redditUser: { type: 'string' },
        },
        required: ['name', 'role'],
      },
    },
  },
  required: ['voices'],
};

export function buildSearchQuery(category, focus) {
  const c = String(category || '').trim() || 'news';
  const f = String(focus || '').trim();
  return `best people and organizations to follow for ${c}${f ? ' ' + f : ''}: leading voices, experts and writers to follow on X`;
}

// Normalize one raw schema row into a candidate, or null if unusable. `pageUrl` is the scraped
// page, used as the evidence link when the row doesn't carry its own. Never invents a handle.
export function mapCandidate(raw, { category = 'general', subcategory, pageUrl } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const type = raw.type === 'org' ? 'org' : 'person';
  const role = String(raw.role || '').trim().slice(0, 80);
  let why = String(raw.whyRelevant || '').trim();
  if (why.length > 120) why = why.slice(0, 117).trimEnd() + '…';
  const httpOnly = u => (/^https?:\/\//i.test(String(u || '')) ? String(u).trim() : undefined);
  const evidenceUrl = httpOnly(raw.evidenceUrl) || httpOnly(pageUrl) || undefined;
  const reddit = String(raw.redditUser || '').trim().replace(/^u\//i, '').replace(/^\//, '') || undefined;
  return {
    voiceId: voiceId(name, type),
    name,
    type,
    role,
    whyRelevant: why,
    evidenceUrl,
    siteUrl: httpOnly(raw.siteUrl),
    youtubeUrl: httpOnly(raw.youtubeUrl),
    redditUser: reddit,
    category: category || 'general',
    ...(subcategory ? { subcategory } : {}),
    tier: 'unverified',           // governance: finder output is never verified, never a followed voice
    source_class: 'suggestion',
  };
}

// Dedupe candidates by voiceId: against an exclude set (existing voices + tombstones) AND within
// the batch; cap at MAX_CANDIDATES. Pure — the heart of the unit tests.
export function dedupeCandidates(cands, excludeIds = []) {
  const exclude = new Set(excludeIds);
  const seen = new Set();
  const out = [];
  for (const c of cands || []) {
    if (!c || !c.voiceId) continue;
    if (exclude.has(c.voiceId) || seen.has(c.voiceId)) continue;
    seen.add(c.voiceId);
    out.push(c);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

function parseExclude(q) {
  // Comma-joined voiceIds the client already holds (followed voices + tombstones). Bounded.
  return String(q || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 400);
}

async function fcSearch(query, deadline) {
  const r = await fetch(`${FC_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ query, limit: 5, sources: [{ type: 'web' }] }),
    signal: AbortSignal.timeout(Math.max(500, deadline - Date.now())),
  });
  if (!r.ok) throw new Error(`search ${r.status}`);
  const d = await r.json();
  const web = (d && d.data && Array.isArray(d.data.web)) ? d.data.web : (Array.isArray(d?.data) ? d.data : []);
  return web.map(w => (w && w.url) ? String(w.url) : '').filter(u => /^https?:\/\//i.test(u));
}

async function fcScrape(url, deadline) {
  const r = await fetch(`${FC_BASE}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({
      url,
      only_main_content: true,
      formats: [{
        type: 'json',
        schema: CANDIDATE_SCHEMA,
        prompt: 'List the specific people and organizations this page recommends following for this topic. For each, give name, whether it is a person or org, their role/title, one short reason they are relevant (<=120 chars), and any profile/site/youtube/reddit link shown. Do not invent social handles.',
      }],
    }),
    signal: AbortSignal.timeout(Math.max(500, deadline - Date.now())),
  });
  if (!r.ok) throw new Error(`scrape ${r.status}`);
  const d = await r.json();
  const voices = d && d.data && d.data.json && Array.isArray(d.data.json.voices) ? d.data.json.voices : [];
  return voices;
}

export default async function handler(req, res) {
  allowOrigin(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (guard(req, res)) return;

  const category = (req.query.category || '').toString().trim().slice(0, 60);
  const subcategory = (req.query.subcategory || '').toString().trim().slice(0, 60) || undefined;
  const focus = (req.query.focus || '').toString().trim().slice(0, 80);
  const excludeIds = parseExclude(req.query.exclude);

  // Edge-cache every outcome for a day: a repeat ask costs 0 Firecrawl calls.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');

  if (!firecrawlOn()) {
    return res.status(200).json({ enabled: false, provider: 'firecrawl', candidates: [],
      note: 'Source finder is off until FIRECRAWL_API_KEY is set in Vercel.' });
  }
  if (!category) return res.status(400).json({ error: 'Missing category' });

  const deadline = Date.now() + BUDGET_MS;
  let calls = 0;
  try {
    const urls = await fcSearch(buildSearchQuery(category, focus), deadline); calls++;
    const raw = [];
    for (const url of urls) {
      if (calls >= MAX_FC_CALLS || Date.now() > deadline - 500) break;  // hard cap: never exceed 3 calls
      try {
        const voices = await fcScrape(url, deadline); calls++;
        for (const v of voices) {
          const c = mapCandidate(v, { category, subcategory, pageUrl: url });
          if (c) raw.push(c);
        }
      } catch { calls++; /* a bad page must not sink the request */ }
    }
    const candidates = dedupeCandidates(raw, excludeIds);
    return res.status(200).json({ enabled: true, provider: 'firecrawl', candidates });
  } catch (e) {
    // Named failure, no secret. Always 200 so the client shows an honest "couldn't fetch" state.
    const msg = String((e && e.message) || e || 'error').slice(0, 80);
    return res.status(200).json({ enabled: true, provider: 'firecrawl', candidates: [], error: msg });
  }
}
