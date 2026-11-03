// R2 held-selection test. Run: node src/modules/stable-list/heldList.test.mjs
// Proves: a late-arriving HIGHER-RANKED story does NOT reorder the visible Top Stories, but IS
// picked up after a refresh (reset), and that dedupe keys stay consistent with the held set.
import { reconcileHeld } from './heldList.js';

const keyOf = a => ((a && a.title) || '').slice(0, 60).toLowerCase().replace(/\s+/g, '');
const S = (t) => ({ title: t, link: 'https://ex.com/' + t.replace(/\s+/g, '') });
const target = 4;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const sig = l => l.map(keyOf).join(',');

// The caller keeps `held` = the COMMITTED list (null until committed).
let held = null;
const step = (live, opts = {}) => { const r = reconcileHeld(held, live, { keyOf, target, ...opts }); if (r.committed) held = r.items; return r; };

// 1) Fill up to target, then commit.
let r = step([S('A'), S('B')]);       // 2 < 4 → not committed
ok(!r.committed && held === null, 'under target: not committed, held stays null');
r = step([S('A'), S('B'), S('C'), S('D')]); // 4 → committed
ok(r.committed, 'reaching target: committed');
const committed = held;
ok(sig(committed) === 'a,b,c,d', `committed set is A,B,C,D (got ${sig(committed)})`);

// 2) A late HIGHER-RANKED story (Z) arrives at the top of the live list → suppressed, visible
//    order unchanged.
r = step([S('Z'), S('A'), S('B'), S('C'), S('D')]);
ok(r.suppressed, 'late higher-ranked story is suppressed');
ok(sig(r.items) === 'a,b,c,d', `visible order unchanged — still A,B,C,D (got ${sig(r.items)})`);
ok(!r.items.some(x => keyOf(x) === keyOf(S('Z'))), 'Z is NOT shown in the held Top Stories');

// 3) After refresh (caller resets prev=null), Z IS picked up.
r = reconcileHeld(null, [S('Z'), S('A'), S('B'), S('C')], { keyOf, target });
ok(r.committed && sig(r.items) === 'z,a,b,c', `after refresh Z leads (got ${sig(r.items)})`);

// 4) Dedupe consistency: the keys used downstream come from the HELD set, so a story held in
//    Top Stories (A) is excluded from a section, and Z (not held) remains available to sections.
const heldKeys = new Set(committed.map(keyOf));
ok(heldKeys.has(keyOf(S('A'))) && !heldKeys.has(keyOf(S('Z'))),
  'held keys contain A (shown) and not Z (free for a section)');

// 5) done=true commits even under target (a thin category whose load finished).
r = reconcileHeld(null, [S('A'), S('B')], { keyOf, target, done: true });
ok(r.committed && sig(r.items) === 'a,b', 'loading done commits a short list');

console.log(fails ? `\nFAIL (${fails})` : '\nPASS: held selection holds visible items, picks up new data after refresh, dedupe consistent');
process.exit(fails ? 1 : 0);
