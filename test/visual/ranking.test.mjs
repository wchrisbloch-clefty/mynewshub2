// AE2: importance ranking unit tests. Pure logic, no browser. Uses CB's real examples:
// a single-outlet Houston auto-show, a single-outlet Staten Island turkeys lifestyle item, and a
// fan-blog "shot at the Big House" item must NOT make Top now; a multi-outlet political story and
// a multi-outlet NFL trade MUST.
import { rankOf, scoreStory, coverageOf, splitTopNowLatest, recencyDecay, legacyOrder } from '../../src/modules/ranking/index.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const NOW = Date.UTC(2026, 10, 18, 12, 0, 0);
const hoursAgo = h => new Date(NOW - h * 3600e3).toISOString();

// ── rankOf ────────────────────────────────────────────────────────────────────
ok(rankOf('CNN') === 'core', 'CNN core');
ok(rankOf('ESPN NFL') === 'core', 'ESPN NFL core (rule)');
ok(rankOf('CBS Sports MLB') === 'core', 'CBS Sports MLB core (rule)');
ok(rankOf('The Spun') === 'fan', 'The Spun fan');
ok(rankOf('ZeroHedge') === 'alt', 'ZeroHedge alt');
ok(rankOf('KHOU Houston') === 'local', 'KHOU local');
ok(rankOf('Some Random Blog') === 'specialist', 'unknown → specialist');
ok(rankOf('ESPN Golf') === 'specialist', 'ESPN Golf specialist (own chip)');

// ── coverage never counts fan/local/alt ─────────────────────────────────────────
const mk = (title, sources, h, link) => {
  const members = sources.map((s, i) => ({ title, source: s, pubDate: hoursAgo(h), link: `${link}-${i}` }));
  return { title, source: sources[0], pubDate: hoursAgo(h), link, _clusterSize: sources.length, _clusterMembers: members };
};
const fanOnly = mk('Former Michigan QB takes a shot at the Big House', ['The Spun'], 0.1, 'fan1');
ok(coverageOf(fanOnly).core === 0 && coverageOf(fanOnly).specialist === 0, 'fan-only coverage 0');
ok(scoreStory(fanOnly, { cat: 'sports', now: NOW }) < 2, 'fan-only scores low (recency minus penalty)');

const localSingle = mk('Houston Auto Show opens at NRG Center this weekend', ['KHOU Houston'], 0.2, 'loc1');
ok(coverageOf(localSingle).core === 0, 'single local coverage 0 for ranking');

// ── recency can't beat coverage ─────────────────────────────────────────────────
const freshFan = mk('Fan hot take posted 3 minutes ago', ['OutKick'], 0.05, 'fan2');
const olderWire = mk('Senate passes major bill in bipartisan vote', ['Reuters (Google News)', 'AP (Google News)', 'CNN', 'Politico'], 1.5, 'wire1');
ok(scoreStory(olderWire, { cat: 'general', now: NOW }) > scoreStory(freshFan, { cat: 'general', now: NOW }), 'multi-outlet wire outranks a 3-min-old fan post');
ok(recencyDecay(0) > recencyDecay(6) && recencyDecay(6) > recencyDecay(24), 'recency decays monotonically');

// ── Top now / Latest split on CB's fixtures ─────────────────────────────────────
const politics = mk('President signs sweeping executive order on energy', ['AP (Google News)', 'Reuters (Google News)', 'The New York Times', 'Axios'], 2, 'pol1');
const nflTrade = mk('Star quarterback traded in blockbuster three-team deal', ['ESPN NFL', 'The Athletic', 'Yahoo Sports'], 1, 'nfl1');
const turkeys = mk('Wild turkeys are taking over a Staten Island neighborhood', ['NY Post'], 0.3, 'turk1'); // single specialist, lifestyle
const clusters = [fanOnly, localSingle, freshFan, politics, nflTrade, turkeys];
const { topNow, latest } = splitTopNowLatest(clusters, { cat: 'general', now: NOW });
const inTop = t => topNow.some(c => c.title === t);
ok(inTop('President signs sweeping executive order on energy'), 'multi-outlet political IN Top now');
ok(inTop('Star quarterback traded in blockbuster three-team deal'), 'multi-outlet NFL trade IN Top now');
ok(!inTop('Houston Auto Show opens at NRG Center this weekend'), 'single-local auto show NOT in Top now');
ok(!inTop('Former Michigan QB takes a shot at the Big House'), 'fan-blog shot NOT in Top now');
ok(!inTop('Fan hot take posted 3 minutes ago'), 'fresh fan hot take NOT in Top now');
ok(latest.length + topNow.length === clusters.length, 'every cluster lands in exactly one of Top now / Latest');
ok(!topNow.some(c => latest.includes(c)), '0 duplicates across Top now / Latest');

// ── max 2 per publisher ─────────────────────────────────────────────────────────
const samePub = ['a','b','c'].map((k,i)=>mk('Big multi-covered story '+k, ['AP (Google News)','Reuters (Google News)','CNN'], 1+i*0.1, 'sp'+k));
const r2 = splitTopNowLatest(samePub, { cat:'general', now: NOW, perPublisher: 2 });
ok(r2.topNow.filter(c => c.source === 'AP (Google News)').length <= 2, 'max 2 per publisher in Top now');

// ── legacy kill switch = pure recency ───────────────────────────────────────────
const leg = legacyOrder([olderWire, freshFan]);
ok(leg[0] === freshFan, 'legacy order = pure recency (fresh fan first)');

// ── AF2.2: ALT governance — alt never counts coverage, never leads Top now ──────
const altOnly = mk('ZeroHedge take on the market', ['ZeroHedge'], 0.2, 'alt1');
ok(coverageOf(altOnly).core === 0 && coverageOf(altOnly).specialist === 0, 'alt-only cluster coverage 0');
ok(coverageOf(altOnly).hasAlt === true, 'alt cluster flagged hasAlt');
const altMix = [altOnly, politics, nflTrade];
const altSplit = splitTopNowLatest(altMix, { cat: 'business', now: NOW });
ok(!altSplit.topNow.some(c => c.title === 'ZeroHedge take on the market'), 'alt item never in Top now');
ok(rankOf('The Daily Wire') === 'alt' && rankOf('Watcher Guru') === 'alt', 'Daily Wire + Watcher Guru are alt');

console.log(`\nRANKING — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
