// AF4.2: Breaking-in-sports gate — >=3 distinct REAL outlets (core/specialist), >=1 core, within 2h,
// fan/alt never count, followed teams get +1. Pure-function unit test.
import { selectSportsBreaking } from '../../src/modules/sports/breaking-select.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const now = Date.now();
const hAgo = h => new Date(now - h * 3600e3).toISOString();
const art = (title, source, extra = {}) => ({ title, source, link: title + source, pubDate: hAgo(1), ...extra });

// 3 core outlets within 2h → qualifies (ESPN/CBS Sports resolve to core via RANK_RULES)
ok(selectSportsBreaking([
  art('Star QB traded to a contender in a blockbuster deadline move', 'ESPN'),
  art('Star QB traded to a contender in a blockbuster deadline move', 'Yahoo Sports'),
  art('Star QB traded to a contender in a blockbuster deadline move', 'CBS Sports NFL'),
], { now }).length === 1, '3 core outlets within 2h qualifies');

// 3 fan outlets, no core → never triggers (fan excluded, so 0 counted outlets)
ok(selectSportsBreaking([
  art('Recruiting rumor swirls about a five-star flip this weekend', 'OutKick'),
  art('Recruiting rumor swirls about a five-star flip this weekend', 'The Spun'),
  art('Recruiting rumor swirls about a five-star flip this weekend', 'On3 Recruiting'),
], { now }).length === 0, 'fan-only cluster never triggers');

// 2 core + 1 fan → fan does not count, only 2 real outlets → below threshold
ok(selectSportsBreaking([
  art('Coach fired after a losing streak reaches double digits tonight', 'ESPN'),
  art('Coach fired after a losing streak reaches double digits tonight', 'The Athletic'),
  art('Coach fired after a losing streak reaches double digits tonight', 'OutKick'),
], { now }).length === 0, '2 core + 1 fan stays below the 3-outlet gate');

// 3 specialist, no core → >=3 outlets but no core → does not qualify
ok(selectSportsBreaking([
  art('Trade winds pick up as the deadline nears for several clubs', 'SB Nation'),
  art('Trade winds pick up as the deadline nears for several clubs', 'Blogging The Boys'),
  art('Trade winds pick up as the deadline nears for several clubs', 'Pats Pulpit'),
], { now }).length === 0, '3 specialist with no core does not qualify');

// old story (>2h) excluded even with 3 core
ok(selectSportsBreaking([
  art('Yesterday result recap with full box score and highlights here', 'ESPN', { pubDate: hAgo(5) }),
  art('Yesterday result recap with full box score and highlights here', 'Yahoo Sports', { pubDate: hAgo(5) }),
  art('Yesterday result recap with full box score and highlights here', 'Fox Sports', { pubDate: hAgo(5) }),
], { now }).length === 0, 'stories older than 2h are excluded');

// followed-team boost: the fav story sorts above an equally-covered non-fav story
const res = selectSportsBreaking([
  art('Rockets complete a surprise trade for an all-star guard tonight', 'ESPN'),
  art('Rockets complete a surprise trade for an all-star guard tonight', 'Yahoo Sports'),
  art('Rockets complete a surprise trade for an all-star guard tonight', 'The Athletic'),
  art('Dodgers add a frontline starter in a late-night blockbuster swap', 'ESPN'),
  art('Dodgers add a frontline starter in a late-night blockbuster swap', 'Yahoo Sports'),
  art('Dodgers add a frontline starter in a late-night blockbuster swap', 'Fox Sports'),
], { now, favMatches: ['rockets'] });
ok(res.length === 2 && /Rockets/.test(res[0].title), 'followed-team story gets the +1 boost to the top');

console.log(`\nSPORTS-BREAKING — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
