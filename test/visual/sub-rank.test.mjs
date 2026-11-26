// AH3: canonical sub keys + rank fixes.
import { normalizeSub, sourcesForSub } from '../../src/modules/feeds-sub.js';
import { rankOf } from '../../src/modules/ranking/rank.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };

// ── AH3.1: sub normalization ──────────────────────────────────────────────
ok(normalizeSub('stay-current') === 'staycurrent', "'stay-current' → 'staycurrent' (alias)");
ok(normalizeSub('staycurrent') === 'staycurrent', "'staycurrent' stays 'staycurrent'");
ok(normalizeSub('UPSTREAM') === 'upstream', 'case-insensitive');
ok(normalizeSub(undefined) === '', 'undefined → empty (no throw)');

// every AI & Tech stay-current feed lands in the chip, even with the drifted spelling
const techFeeds = [
  { name: 'TLDR AI', sub: 'staycurrent' }, { name: 'Hugging Face', sub: 'staycurrent' },
  { name: 'Import AI', sub: 'staycurrent' }, { name: 'Latent Space', sub: 'stay-current' },
  { name: 'Simon Willison', sub: 'staycurrent' }, { name: 'One Useful Thing', sub: 'staycurrent' },
  { name: 'TechCrunch' }, { name: 'The Verge', sub: 'bigtech' },
];
const sc = sourcesForSub(techFeeds, 'staycurrent');
for (const n of ['TLDR AI', 'Hugging Face', 'Import AI', 'Latent Space', 'Simon Willison', 'One Useful Thing'])
  ok(sc.has(n), `Stay current chip includes ${n}`);
ok(sc.size === 6 && !sc.has('TechCrunch'), 'exactly the 6 stay-current feeds (no stragglers)');

// ── AH3.3: Fox News → core (parity), others unchanged ─────────────────────
ok(rankOf('Fox News') === 'core', 'Fox News → core');
ok(rankOf('CNN') === 'core' && rankOf('ABC News') === 'core' && rankOf('CBS News') === 'core' && rankOf('NBC News') === 'core', 'CNN/ABC/CBS/NBC stay core');
ok(rankOf('NY Post') === 'specialist' && rankOf('New York Post') === 'specialist', 'NY Post stays specialist');
ok(rankOf('The Daily Wire') === 'alt' && rankOf('ZeroHedge') === 'alt' && rankOf('Watcher Guru') === 'alt', 'Daily Wire/ZeroHedge/Watcher Guru stay alt');

// ── AH3.2: ESPN top-headlines → core; fallback-served feeds keep their declared rank by name ──
ok(rankOf('ESPN') === 'core', 'ESPN top-headlines feed → core');
ok(rankOf('ESPN NFL') === 'core' && rankOf('ESPN NBA') === 'core', 'ESPN league feeds stay core');
ok(rankOf('ESPN Golf') === 'specialist', 'ESPN Golf stays specialist (own chip)');
// fallback keeps the feed name, so rankOf(source) == declared rank for these fallback-served feeds
for (const [name, want] of [['The Guardian US', 'core'], ['Yahoo Finance', 'core'], ['Sports Illustrated', 'core'], ['Bleacher Report', 'core'], ['ESPN', 'core']])
  ok(rankOf(name) === want, `fallback-served ${name} keeps rank ${want}`);

console.log(`\nSUB-RANK — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
