// AC2: unit tests for the Voices source finder handler (lib/voices/handler-find.js).
// Pure-logic + a mocked-fetch pass over the full handler. No browser, no network, no real key.
// Covers: schema mapping (whyRelevant cap, person/org, http-only links, no guessed handle),
// dedupe within a batch, tombstone/existing exclusion, the 8-candidate cap, voiceId PARITY with
// the client model, and — critically — that the FIRECRAWL key is NEVER echoed into a response.
import { voiceId, mapCandidate, dedupeCandidates, buildSearchQuery, CANDIDATE_SCHEMA } from '../../lib/voices/handler-find.js';
import { voiceId as modelVoiceId } from '../../src/modules/voices/model.js';
import handler from '../../lib/voices/handler-find.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('FAIL ' + msg); } };

// ── voiceId parity: server must match the client model exactly (or server dedupe is wrong) ──────
for (const [n, t] of [['Jane Doe', 'person'], ['The Economist', 'org'], ['Élodie Ngô', 'person'], ['A/B & C', 'org']]) {
  ok(voiceId(n, t) === modelVoiceId(n, t), `voiceId parity for "${n}" (${t}): ${voiceId(n, t)} vs ${modelVoiceId(n, t)}`);
}

// ── mapCandidate: normalization + governance ────────────────────────────────────────────────────
const m = mapCandidate(
  { name: '  Ada Lovelace ', type: 'person', role: 'Analyst', whyRelevant: 'x'.repeat(200),
    evidenceUrl: 'https://ev.example/ada', siteUrl: 'not-a-url', redditUser: 'u/ada_l' },
  { category: 'tech', pageUrl: 'https://page.example' });
ok(m.voiceId === 'person:ada-lovelace', `mapCandidate id: ${m.voiceId}`);
ok(m.name === 'Ada Lovelace', 'mapCandidate trims name');
ok(m.whyRelevant.length <= 120, `whyRelevant capped (${m.whyRelevant.length})`);
ok(m.tier === 'unverified', 'candidate tier is unverified (governance)');
ok(m.evidenceUrl === 'https://ev.example/ada', 'evidenceUrl kept');
ok(m.siteUrl === undefined, 'non-http siteUrl dropped (never a guessed/garbage link)');
ok(m.redditUser === 'ada_l', `redditUser normalized (${m.redditUser})`);
ok(!('x' in m) && !('handles' in m), 'finder never emits a social handle');
ok(mapCandidate({ type: 'person' }) === null, 'nameless row dropped');
ok(mapCandidate({ name: 'Org X', type: 'weird', role: 'r' }).type === 'person', 'unknown type → person');
const evFallback = mapCandidate({ name: 'No Ev', role: 'r' }, { pageUrl: 'https://src.example/p' });
ok(evFallback.evidenceUrl === 'https://src.example/p', 'evidenceUrl falls back to page url');

// ── dedupe: within-batch, exclude set (existing + tombstones), and the 8-cap ────────────────────
const batch = [
  mapCandidate({ name: 'Al', role: 'r' }), mapCandidate({ name: 'Al', role: 'dup' }),    // dup within batch
  mapCandidate({ name: 'Bo', role: 'r' }),                                               // excluded (existing)
  mapCandidate({ name: 'Cy', role: 'r' }),                                               // excluded (tombstone)
  ...Array.from({ length: 12 }, (_, i) => mapCandidate({ name: 'Voice ' + i, role: 'r' })),
];
const deduped = dedupeCandidates(batch, ['person:bo', 'person:cy']);
ok(!deduped.some(c => c.voiceId === 'person:bo'), 'existing voice excluded');
ok(!deduped.some(c => c.voiceId === 'person:cy'), 'tombstoned voice excluded');
ok(deduped.filter(c => c.voiceId === 'person:al').length === 1, 'within-batch dup collapsed');
ok(deduped.length <= 8, `capped at 8 (got ${deduped.length})`);

// ── schema shape sanity ─────────────────────────────────────────────────────────────────────────
ok(CANDIDATE_SCHEMA.properties.voices.items.required.includes('name'), 'schema requires name');
ok(buildSearchQuery('Sports', 'NBA').includes('Sports') && buildSearchQuery('Sports', 'NBA').includes('NBA'), 'query carries category + focus');

// ── FULL handler with a MOCKED fetch: key must never appear in the response ──────────────────────
const FAKE_KEY = 'fc-SECRET-DO-NOT-ECHO-123456';
process.env.FIRECRAWL_API_KEY = FAKE_KEY;
const realFetch = global.fetch;
function mockRes() {
  const r = { headers: {}, _status: 0, _json: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r._status = c; return r; };
  r.json = (o) => { r._json = o; return r; };
  r.end = () => r;
  return r;
}
let callCount = 0;
global.fetch = async (url, opts) => {
  callCount++;
  // Authorization header must carry the key (so we know the test exercised the real path)...
  ok(/Bearer fc-SECRET/.test(opts.headers.Authorization), 'request sends Bearer key');
  if (String(url).endsWith('/search')) return { ok: true, json: async () => ({ data: { web: [{ url: 'https://a.example' }, { url: 'https://b.example' }, { url: 'https://c.example' }, { url: 'https://d.example' }] } }) };
  return { ok: true, json: async () => ({ data: { json: { voices: [
    { name: 'Dup Person', type: 'person', role: 'writer', whyRelevant: 'covers it' },
    { name: 'Removed One', type: 'person', role: 'x' },
    { name: 'Fresh Voice', type: 'org', role: 'desk' },
  ] } } }) };
};
const req = { method: 'GET', headers: {}, socket: {}, query: { kind: 'voicefind', category: 'News', exclude: 'person:removed-one' } };
const res = mockRes();
await handler(req, res);
ok(res._status === 200, `handler 200 (got ${res._status})`);
ok(res._json && res._json.enabled === true, 'handler enabled with key present');
const bodyStr = JSON.stringify(res._json) + JSON.stringify(res.headers);
ok(!bodyStr.includes(FAKE_KEY) && !bodyStr.includes('SECRET'), 'KEY IS NEVER ECHOED into response/headers');
ok(!res._json.candidates.some(c => c.voiceId === 'person:removed-one'), 'tombstone excluded end-to-end');
ok(res._json.candidates.some(c => c.voiceId === 'org:fresh-voice'), 'fresh candidate present');
ok(callCount <= 3, `hard cap <=3 Firecrawl calls (made ${callCount})`);

// no-key path → disabled note, no network
delete process.env.FIRECRAWL_API_KEY;
let netAfter = 0; global.fetch = async () => { netAfter++; throw new Error('should not fetch'); };
const res2 = mockRes();
await handler({ method: 'GET', headers: {}, socket: {}, query: { category: 'News' } }, res2);
ok(res2._json.enabled === false && !!res2._json.note, 'no key → {enabled:false, note}');
ok(netAfter === 0, 'no key → 0 network calls');

global.fetch = realFetch;

console.log(`\nVOICEFIND — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
