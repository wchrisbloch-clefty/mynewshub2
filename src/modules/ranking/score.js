// src/modules/ranking/score.js — AE2: IMPORTANCE ranking. Pure, unit-tested, built on the
// existing clustering (_clusterMembers). Replaces "sort by pubDate only", which let a fan blog
// posted 3 minutes ago outrank a wire story from an hour ago.
//
//   score = 3·min(distinctCoreOutlets,3) + 1·min(distinctSpecialistOutlets,2)
//         + recencyDecay(ageHours, halfLife) + followBoost − fanPenalty
//
// fan/alt/local sources NEVER count toward coverage; a cluster with only fan/local/alt sources
// scores 0 for coverage (recency only, minus a fan penalty). followBoost (+1, capped) comes from a
// followed team or a voice flag (AE5). A kill switch (?rank=legacy / stored flag) restores pure
// recency so CB can compare.

import { rankOf } from './rank.js';

// Half-life (hours) per category — how fast importance decays with age.
export const HALF_LIFE = { general: 6, business: 6, bloom: 6, finance: 6, sports: 3, tech: 12, health: 24, popculture: 24, comedy: 24 };

export function recencyDecay(ageHours, halfLife = 6) {
  const h = Math.max(0, Number(ageHours) || 0);
  return 4 * Math.pow(0.5, h / Math.max(1, halfLife)); // 4 at age 0, 2 at one half-life, 1 at two
}

/** Members of a cluster (the clustered articles), or the single article. */
export function clusterMembers(c) {
  return Array.isArray(c && c._clusterMembers) && c._clusterMembers.length ? c._clusterMembers : [c];
}

function hoursSince(pubDate, now) {
  const t = new Date(pubDate).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, ((now || Date.now()) - t) / 3_600_000);
}

/** Distinct outlets by rank across a cluster's members. fan/alt/local never count toward coverage. */
export function coverageOf(cluster) {
  const core = new Set(), spec = new Set();
  let hasFan = false, hasAlt = false, hasLocal = false, hasReal = false;
  for (const m of clusterMembers(cluster)) {
    const r = rankOf(m && m.source);
    if (r === 'core') { core.add(m.source); hasReal = true; }
    else if (r === 'specialist') { spec.add(m.source); hasReal = true; }
    else if (r === 'fan') hasFan = true;
    else if (r === 'alt') hasAlt = true;
    else if (r === 'local') hasLocal = true;
  }
  return { core: core.size, specialist: spec.size, hasFan, hasAlt, hasLocal, hasReal };
}

/**
 * Importance score for a clustered story. Pure.
 * ctx: { cat, now, halfLife?, followBoost?(number), trending?(bool) }
 */
export function scoreStory(cluster, ctx = {}) {
  if (!cluster) return 0;
  const cov = coverageOf(cluster);
  const coverage = 3 * Math.min(cov.core, 3) + 1 * Math.min(cov.specialist, 2);
  const halfLife = ctx.halfLife || HALF_LIFE[ctx.cat] || 6;
  const ageHours = cluster.ageHours != null ? cluster.ageHours : hoursSince(cluster.pubDate, ctx.now);
  const recency = recencyDecay(ageHours, halfLife);
  const followBoost = Math.min(1, Number(ctx.followBoost) || 0);
  const trending = ctx.trending ? 1 : 0; // AE4 cap +1, counted once
  const fanPenalty = (cov.hasFan && coverage === 0) ? 2 : 0;
  return Math.max(0, coverage + recency + followBoost + trending - fanPenalty);
}

/** Default Top-now eligibility: real coverage, OR a follow boost. Excludes pure fan/alt/local. */
export function defaultEligible(cluster, score, ctx = {}) {
  const cov = coverageOf(cluster);
  if (cov.hasReal && (cov.core + cov.specialist) >= 1) return true;
  return (Math.min(1, Number(ctx.followBoost) || 0) > 0) && cov.hasReal;
}

/**
 * Split clusters into "Top now" (top N by score within `withinHours`, max `perPublisher` per
 * outlet) and "Latest" (the rest, chronological). Pure; no dedup beyond what the caller passed.
 * ctx may carry: cat, now, boostOf(cluster)->number, trendingOf(cluster)->bool,
 * eligible(cluster,score,ctx)->bool (AE3 passes a stricter one), topN, perPublisher, withinHours.
 */
export function splitTopNowLatest(clusters, ctx = {}) {
  const now = ctx.now || Date.now();
  const topN = ctx.topN || 6;
  const perPublisher = ctx.perPublisher || 2;
  const withinHours = ctx.withinHours || 24;
  const eligible = ctx.eligible || defaultEligible;
  const boostOf = ctx.boostOf || (() => 0);
  const trendingOf = ctx.trendingOf || (() => false);

  const scored = (clusters || []).map(c => {
    const sctx = { cat: ctx.cat, now, halfLife: ctx.halfLife, followBoost: boostOf(c), trending: trendingOf(c) };
    const ageHours = c.ageHours != null ? c.ageHours : hoursSince(c.pubDate, now);
    return { c, score: scoreStory(c, sctx), ageHours, sctx };
  });

  // Top now: eligible, within the window, highest score, capped per publisher.
  const perPub = new Map();
  const topNow = [];
  for (const s of scored.filter(s => s.ageHours <= withinHours && eligible(s.c, s.score, s.sctx))
                        .sort((a, b) => b.score - a.score || a.ageHours - b.ageHours)) {
    const pub = s.c.source || '?';
    const n = perPub.get(pub) || 0;
    if (n >= perPublisher) continue;
    perPub.set(pub, n + 1);
    topNow.push(s.c);
    if (topNow.length >= topN) break;
  }

  // Latest: everything NOT in Top now, newest first.
  const inTop = new Set(topNow.map(c => c.link || c));
  const latest = scored.filter(s => !inTop.has(s.c.link || s.c))
                       .sort((a, b) => a.ageHours - b.ageHours)
                       .map(s => s.c);
  return { topNow, latest };
}

/** Legacy ordering: pure recency (the pre-AE2 behaviour), for the ?rank=legacy kill switch. */
export function legacyOrder(clusters) {
  return [...(clusters || [])].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}
