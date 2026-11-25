// AG5.1: AetherHub import roster + merge — add-only, no duplicate by name, tombstones respected,
// handles carried. (The import sheet AG5.2 and flags AG5.3 consume this; they are cap-blocked, see
// batch-AG-report.md.)
import { AETHER_PEOPLE, AETHER_TOPIC_WATCHES, mergeAether } from '../../src/modules/voices/aether-import.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };

ok(AETHER_PEOPLE.length === 23, `roster has all 23 AetherHub people (got ${AETHER_PEOPLE.length})`);
ok(AETHER_PEOPLE.every(p => p.name && p.handle && p.category && p.platform), 'every person has name + handle + category + platform');
ok(AETHER_PEOPLE.find(p => p.name === 'Daniel Yergin').handle === '@DanielYergin', 'Yergin carries the real X handle');
ok(AETHER_PEOPLE.filter(p => p.category === 'bloom').length >= 5, 'energy people mapped to bloom');
ok(AETHER_PEOPLE.filter(p => p.parkedFrom === 'ancient-mysteries').length >= 4, 'Ancient Mysteries people parked in popculture, flagged');
ok(AETHER_TOPIC_WATCHES.some(t => t.topic === 'ERCOT' && t.category === 'bloom'), 'ERCOT topic watch present on Energy');

// merge: add-only onto an empty seed list
let r = mergeAether([], new Set());
ok(r.added === 23 && r.seeds.length === 23, 'merge adds all 23 to an empty list');
ok(r.seeds.find(s => s.name === 'Daniel Yergin')._x === '@DanielYergin', 'X people carry _x handle for the resolve prefill');
ok(r.seeds.every(s => s.status === 'seed'), 'imported entries are status:seed (never auto-followed)');

// no duplicate by name
r = mergeAether([{ name: 'Daniel Yergin', type: 'person', category: 'bloom', status: 'confirmed' }], new Set());
ok(r.added === 22 && r.seeds.filter(s => s.name === 'Daniel Yergin').length === 1, 'existing name is not duplicated');

// tombstone respected
r = mergeAether([], new Set(['Alex Epstein']));
ok(!r.seeds.some(s => s.name === 'Alex Epstein') && r.added === 22, 'a removed (tombstoned) name is never re-added');

console.log(`\nAETHER-IMPORT — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
