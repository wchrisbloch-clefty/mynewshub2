// L3 one-story-once fixture test. Run: node src/modules/dedup/railDedup.test.mjs
// The crux: a single story S qualifies for State of Play AND a Connections bridge AND an
// Across section. With one shared used-keys set filled in priority order, S must appear
// in EXACTLY ONE module (the highest-priority one, State of Play) and be suppressed in
// Connections and Across.
import { claim, claimConnections, claimAcrossSections } from './railDedup.js';

const keyOf = a => (((a && a.title) || '').slice(0, 60).toLowerCase().replace(/\s+/g, ''));
const S = { title: 'Shared Story About The Grid', link: 'https://ex.com/s', cat: 'bloom' };
const X = { title: 'Tech Angle On The Grid', link: 'https://ex.com/x', cat: 'tech' };
const Y = { title: 'An Unrelated Finance Story', link: 'https://ex.com/y', cat: 'finance' };
const Z = { title: 'A Second Unrelated Story', link: 'https://ex.com/z', cat: 'sports' };

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  FAIL ' + msg); } };

// ── Case 1: S is in State of Play, a Connections bridge, and an Across section ──
{
  const used = new Set();
  const topStories = claim([], used, keyOf);                       // none
  const sop = claim([S], used, keyOf);                             // SoP claims S first
  const connections = claimConnections([{ members: [S, X] }], used, keyOf); // bridge has S -> dropped
  const across = claimAcrossSections([{ cat: 'bloom', items: [S, Y] }], used, keyOf); // S suppressed, Y kept

  ok(sop.some(a => a === S), 'S should be in State of Play');
  ok(connections.length === 0, 'connection containing S should be dropped (S already shown)');
  ok(across.length === 1 && across[0].items.length === 1 && across[0].items[0] === Y,
    'Across should drop S and keep only Y');

  // S appears exactly once across all modules
  const everywhere = [...topStories, ...sop, ...connections.flatMap(c => c.members), ...across.flatMap(s => s.items)];
  const sCount = everywhere.filter(a => keyOf(a) === keyOf(S)).length;
  ok(sCount === 1, `S must appear exactly once across feed+rail (got ${sCount})`);
  console.log(`Case 1: SoP=${sop.length} conn=${connections.length} across-items=${across.reduce((n,s)=>n+s.items.length,0)}  S-count=${sCount}`);
}

// ── Case 2: a clean bridge (no member shown elsewhere) survives and claims its members ──
{
  const used = new Set();
  claim([], used, keyOf);
  claim([Y], used, keyOf);                                         // feed shows Y only
  const connections = claimConnections([{ members: [S, X] }], used, keyOf); // S,X unused -> kept
  const across = claimAcrossSections([{ cat: 'tech', items: [X, Z] }], used, keyOf); // X now claimed -> only Z

  ok(connections.length === 1, 'clean bridge (S+X) should survive');
  ok(across.length === 1 && across[0].items.length === 1 && across[0].items[0] === Z,
    'Across should drop X (claimed by the bridge) and keep Z');
  console.log(`Case 2: conn=${connections.length} across=[${across[0] ? across[0].items.map(a => a.title.split(' ').pop()).join(',') : ''}]`);
}

console.log(fails ? `\nFAIL (${fails})` : '\nPASS: one story appears at most once across feed + rail');
process.exit(fails ? 1 : 0);
