// src/modules/ranking/rank.js — AE1: source RANK, a RUNTIME lookup (never stored in saved feed
// lists). This is NOT the trust `tier` (verified/reported/inferred) — it is the COVERAGE weight
// the importance ranker (AE2) uses:
//
//   core        a primary national/wire outlet — full weight toward "a story is important"
//   specialist  a credible but narrower outlet (trade press, single-beat) — partial weight
//   fan         fan blog / hot-take — NEVER counts toward coverage, never leads, penalised
//   alt         "alternative perspective" lane — labelled, never leads/breaks/raises a tier,
//               never counts toward coverage; can appear in Latest and the Voices flag chip
//   local       Houston/Harris-County local — gated (AE3); default home is the Houston strip
//
// A custom/unknown feed defaults to `specialist` (credible-but-narrow), never `core`.

export const RANKS = ['core', 'specialist', 'fan', 'alt', 'local'];

// Only NON-DEFAULT ranks are listed (an unknown name is already `specialist`, see rankOf), as
// Sets per rank — compact (no repeated `:'core'` literals). Names are the feed `name` strings in
// DEFAULT_FEEDS (and the AE1 additions).
const CORE = new Set([
  'AP (Google News)', 'Reuters (Google News)', 'CBS News', 'ABC News', 'NBC News', 'CNN',
  'The New York Times', 'Wall Street Journal', 'Politico', 'Axios', 'BBC News', 'NPR News',
  // AH3.3: Fox News → core, for parity with CNN/ABC/CBS/NBC (largest US cable news outlet). NY Post
  // stays specialist; Daily Wire/ZeroHedge/Watcher Guru stay alt. REVERSIBLE — remove to revert.
  'Fox News',
  'The Guardian US', 'Reuters Business (Google News)', 'WSJ Business', 'WSJ Markets', 'CNBC Top News',
  'CNBC Business', 'MarketWatch', 'Bloomberg', 'Yahoo Finance', 'FT (Google News)', 'Axios Markets',
  'The Guardian Business', 'EIA Today in Energy', 'U.S. Department of Energy', 'FERC',
  'American Petroleum Institute (Google News)', 'CNBC Energy', 'TechCrunch', 'The Verge', 'Wired',
  'Ars Technica', 'VentureBeat', 'MIT Tech Review', 'IEEE Spectrum', 'Techmeme', 'OpenAI',
  'Google DeepMind', 'Yahoo Sports', 'The Athletic', 'Fox Sports', 'Pro Football Talk',
  // AH3.2: ESPN top-headlines feed → core (its league feeds "ESPN NFL" etc. already match the ESPN rule).
  'ESPN',
  'Sports Illustrated', 'Bleacher Report',
]);
const FAN = new Set(['The Spun', 'OutKick', '247Sports', 'On3 Recruiting']);
const ALT = new Set(['The Daily Wire', 'ZeroHedge', 'Watcher Guru']);
const LOCAL = new Set([
  'KHOU Houston', 'Chron.com', 'Houston Public Media', 'ABC13 Houston', 'KPRC Houston',
  'Fox 26 Houston', 'Houston Business Journal',
]);
// Back-compat view for any importer/test that wants the flat map.
export const RANK_BY_NAME = Object.fromEntries([
  ...[...CORE].map(n => [n, 'core']), ...[...FAN].map(n => [n, 'fan']),
  ...[...ALT].map(n => [n, 'alt']), ...[...LOCAL].map(n => [n, 'local']),
]);

// Prefix/substring rules for families whose feed names carry a league/section suffix
// ("ESPN NFL", "CBS Sports MLB", "ESPN Golf"). Checked only when there is no exact match.
const RANK_RULES = [
  { test: n => /^ESPN Golf/i.test(n), rank: 'specialist' }, // golf lives under its own chip
  { test: n => /^ESPN /i.test(n), rank: 'core' },
  { test: n => /^CBS Sports/i.test(n), rank: 'core' },
  { test: n => /^NBC Sports/i.test(n), rank: 'core' },
  { test: n => /(racing|bloodhorse|thoroughbred|horse|drf|golf|baseball america)/i.test(n), rank: 'specialist' },
];

/** The coverage rank for a source name. Unknown/custom → 'specialist'. Never throws. */
export function rankOf(name) {
  const n = String(name || '').trim();
  if (!n) return 'specialist';
  if (CORE.has(n)) return 'core';
  if (FAN.has(n)) return 'fan';
  if (ALT.has(n)) return 'alt';
  if (LOCAL.has(n)) return 'local';
  for (const r of RANK_RULES) if (r.test(n)) return r.rank;
  return 'specialist';
}

export const isCore = n => rankOf(n) === 'core';
export const isFan = n => rankOf(n) === 'fan';
export const isAlt = n => rankOf(n) === 'alt';
export const isLocal = n => rankOf(n) === 'local';
