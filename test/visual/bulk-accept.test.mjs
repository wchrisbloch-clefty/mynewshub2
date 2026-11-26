// AH1: bulk accept-all — adds seeds as unconfirmed/accept-all, skips duplicates + tombstones.
import { bulkAccept } from '../../src/modules/voices/bulk-accept.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const seed = (name, type = 'person', category = 'general') => ({ name, type, category, status: 'seed' });

// accept all onto an empty list
let r = bulkAccept([], [], [seed('Peter Zeihan', 'person', 'business'), seed('Reuters', 'org', 'general')]);
ok(r.added === 2 && r.voices.length === 2, 'accept all adds every seed');
ok(r.voices.every(v => v.status === 'unconfirmed' && v.confirmedBy === 'accept-all'), 'bulk voices are unconfirmed, confirmedBy:accept-all');
ok(r.voices.every(v => !v.handles || Object.keys(v.handles).length === 0), 'no handles stored (resolved lazily later)');

// 105-style count integrity
const many = Array.from({ length: 105 }, (_, i) => seed('Voice ' + i, i % 2 ? 'org' : 'person', ['general', 'business', 'bloom', 'tech'][i % 4]));
ok(bulkAccept([], [], many).added === 105, 'accept all 105 → 105 voices (count matches)');

// duplicate id skipped + counted
r = bulkAccept([{ id: 'person:peter-zeihan', name: 'Peter Zeihan', type: 'person', category: 'business', status: 'confirmed' }], [], [seed('Peter Zeihan', 'person', 'business'), seed('Ian Bremmer', 'person', 'general')]);
ok(r.added === 1 && r.skipped === 1 && r.voices.filter(v => v.name === 'Peter Zeihan').length === 1, 'existing id skipped + counted (no duplicate)');

// tombstoned id never re-added
r = bulkAccept([], ['person:ian-bremmer'], [seed('Ian Bremmer', 'person', 'general'), seed('Axios', 'org', 'general')]);
ok(r.added === 1 && r.skipped === 1 && !r.voices.some(v => v.name === 'Ian Bremmer'), 'tombstoned id stays removed');

// empty seeds → no change
ok(bulkAccept([{ id: 'x' }], [], []).added === 0, 'empty seed list → nothing added');

console.log(`\nBULK-ACCEPT — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
