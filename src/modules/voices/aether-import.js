// AG5.1: AetherHub people → mynewshub2 Voices import roster. Copied from
// social-command-center/config/sources.js (read-only) with their real handles. AetherHub categories
// map to mynewshub2 categories: energy→bloom, business→business, tech→tech, health→health,
// ancient (Ancient Mysteries) → popculture (parked, flagged, per E4).
//
// This module is INERT by design — it is NOT imported into the initial chunk. The one-time
// "Import from AetherHub" sheet (AG5.2) and the voice-signal flags (AG5.3) consume it from the lazy
// Voices/Customize path once there is bundle room under the +1.1% cap (see batch-AG-report.md).
//
// Handles are CB-confirmed on import (status stays 'seed' until Accept/Confirm, which sets
// status:'confirmed', confirmedBy:'aetherhub-import') — nothing is auto-followed and no handle is
// silently stored. Entries carry the platform the handle belongs to.

const CAT = { energy: 'bloom', business: 'business', tech: 'tech', health: 'health', ancient: 'popculture' };

// { name, type, category, platform, handle }  — handle is the exact AetherHub route handle.
export const AETHER_PEOPLE = [
  // X / Twitter
  { name: 'Daniel Yergin',  type: 'person', category: 'bloom',      platform: 'x', handle: '@DanielYergin' },
  { name: 'Doug Sheridan',  type: 'person', category: 'bloom',      platform: 'x', handle: '@DougSheridan' },
  { name: 'Alex Epstein',   type: 'person', category: 'bloom',      platform: 'x', handle: '@AlexEpstein' },
  { name: 'Jeff Krimmel',   type: 'person', category: 'bloom',      platform: 'x', handle: '@JeffKrimmel' },
  { name: 'Rich Miller',    type: 'person', category: 'bloom',      platform: 'x', handle: '@Tech_Journalism' }, // data-center beat
  { name: 'Jeff Immelt',    type: 'person', category: 'business',   platform: 'x', handle: '@JeffImmelt' },
  { name: 'John Chambers',  type: 'person', category: 'tech',       platform: 'x', handle: '@JohnTChambers' },
  { name: 'Eddie Donmez',   type: 'person', category: 'business',   platform: 'x', handle: '@eddiedonmez' },
  { name: 'Tim Grover',     type: 'person', category: 'health',     platform: 'x', handle: '@ATTACKATHLETICS' },
  { name: 'Annie Jacobsen', type: 'person', category: 'popculture', platform: 'x', handle: '@AnnieJacobsen', parkedFrom: 'ancient-mysteries' },
  // YouTube
  { name: 'Peter Zeihan',    type: 'person', category: 'business',   platform: 'youtube', handle: 'ZeihanonGeopolitics' },
  { name: 'Harry Stebbings', type: 'person', category: 'business',   platform: 'youtube', handle: '20VC' },
  { name: 'Daniel Pink',     type: 'person', category: 'business',   platform: 'youtube', handle: 'danielpinktv' },
  { name: 'Christopher Voss',type: 'person', category: 'business',   platform: 'youtube', handle: 'NegotiationMastery' },
  { name: 'Chase Hughes',    type: 'person', category: 'business',   platform: 'youtube', handle: 'chasehughesofficial' },
  { name: 'Jay Egg',         type: 'person', category: 'bloom',      platform: 'youtube', handle: 'EggGeothermal' },
  { name: 'Chris Williamson',type: 'person', category: 'health',     platform: 'youtube', handle: 'ChrisWillx' },
  { name: 'David Sinclair',  type: 'person', category: 'health',     platform: 'youtube', handle: 'LifespanOfficial' },
  { name: 'Jocko Willink',   type: 'person', category: 'health',     platform: 'youtube', handle: 'JockoPodcast' },
  { name: 'MrBallen',        type: 'person', category: 'popculture', platform: 'youtube', handle: 'MrBallen', parkedFrom: 'ancient-mysteries' },
  { name: 'Jesse Michels',   type: 'person', category: 'popculture', platform: 'youtube', handle: 'JesseMichels', parkedFrom: 'ancient-mysteries' },
  { name: 'Timothy Alberino',type: 'person', category: 'popculture', platform: 'youtube', handle: 'TimothyAlberino', parkedFrom: 'ancient-mysteries' },
  { name: 'Michael Button',  type: 'person', category: 'popculture', platform: 'youtube', handle: 'MichaelButton1', parkedFrom: 'ancient-mysteries' },
];

// AG5.2: X-only voices surfaced in the import sheet for CB to confirm alongside the AetherHub people.
// ZeroHedge / Watcher Guru carry CB-named handles; The Hormuz Letter is the Voices FINDER candidate
// (@HormuzLetter, the one consistent match across 6 sources) — flagged `candidate` so the sheet asks
// CB to confirm it, never auto-stored.
export const AETHER_X_VOICES = [
  { name: 'ZeroHedge',         type: 'org', category: 'business', platform: 'x', handle: '@zerohedge' },
  { name: 'Watcher Guru',      type: 'org', category: 'business', platform: 'x', handle: '@WatcherGuru' },
  { name: 'The Hormuz Letter', type: 'org', category: 'bloom',    platform: 'x', handle: '@HormuzLetter', candidate: true },
];

// Topic watches from AetherHub (CB's category keyword watches, e.g. ERCOT) — AG5.3 surfaces a
// "Watching: ERCOT" row on Energy. Kept minimal here; extend from CATEGORIES when AG5.3 lands.
export const AETHER_TOPIC_WATCHES = [
  { topic: 'ERCOT', category: 'bloom' },
];

// Merge AetherHub people into an existing seed list: add-only, no duplicate by name, tombstones
// respected (a name in `removed` is never re-added). Returns { seeds, added }. Consumed by AG5.2.
export function mergeAether(seeds, removed = new Set()) {
  const have = new Set((seeds || []).map(s => s && s.name));
  const out = (seeds || []).slice();
  let added = 0;
  for (const p of AETHER_PEOPLE) {
    if (have.has(p.name) || removed.has(p.name)) continue;
    out.push({ name: p.name, type: p.type, category: p.category, status: 'seed', _x: p.platform === 'x' ? p.handle : undefined, _aether: p.handle, _parkedFrom: p.parkedFrom });
    have.add(p.name); added++;
  }
  return { seeds: out, added };
}

export { CAT as AETHER_CAT_MAP };
