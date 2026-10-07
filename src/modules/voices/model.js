// src/modules/voices/model.js — Voices entity model + tombstone/merge logic (E1).
//
// Pure and dependency-free so it is unit-testable in node and safe to import from both
// the client and the serverless API. Persistence (localStorage + cloudConfig) and the
// Customize UI live in App; this module owns the SHAPE and the merge/tombstone rules,
// which mirror the proven followed-teams reconciliation (removedTeams) so a removed
// voice can never be resurrected by an older cloud profile.
//
// Entity:
//   { id, type:'person'|'org'|'team', name, category, subcategory?,
//     handles:{ x?, instagram?, linkedin?, tiktok?, youtube?, reddit? },
//     status:'confirmed'|'unconfirmed'|'seed', confirmedAt? }
//
// status:
//   seed         — suggested from a list (E4) or migrated from DEFAULT_SOCIAL; NOT followed
//                  until the user accepts, and every handle must pass E2 confirm first.
//   unconfirmed  — added by the user but no platform handle confirmed yet.
//   confirmed    — at least one handle confirmed via the E2 add+confirm flow.

export const VOICE_PLATFORMS = ['x', 'instagram', 'linkedin', 'tiktok', 'youtube', 'reddit'];

const slug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Stable id from type + name, so the same voice dedupes across local/cloud/seed.
export function voiceId(name, type = 'person') {
  return `${type}:${slug(name)}`;
}

// Normalize a partial voice into the full shape (never trusts a guessed handle:
// handles arrive only from the confirm flow, so an un-passed handle stays absent).
export function makeVoice({ type = 'person', name, category, subcategory, handles = {}, status = 'unconfirmed', confirmedAt } = {}) {
  const h = {};
  for (const p of VOICE_PLATFORMS) if (handles[p]) h[p] = String(handles[p]).trim();
  return { id: voiceId(name, type), type, name: String(name || '').trim(), category: category || 'general',
    ...(subcategory ? { subcategory } : {}), handles: h, status, ...(confirmedAt ? { confirmedAt } : {}) };
}

// Union-merge local + cloud voice lists, dedupe by id (local wins — it is the device the
// edit happened on), then drop anything whose id is tombstoned. Mirrors the followed-teams
// rule exactly: tombstones are themselves unioned by the caller before this runs, so a
// removal made on any device survives a pull from an older profile.
export function mergeVoices(localList = [], cloudList = [], tombstones = []) {
  const tomb = new Set(tombstones);
  const byId = new Map();
  // cloud first, then local overrides — local is the most recent edit surface.
  for (const v of cloudList) if (v && v.id) byId.set(v.id, v);
  for (const v of localList) if (v && v.id) byId.set(v.id, v);
  return [...byId.values()].filter(v => !tomb.has(v.id));
}

// Add or replace a voice in a list by id (immutable).
export function upsertVoice(list = [], voice) {
  const out = list.filter(v => v.id !== voice.id);
  out.push(voice);
  return out;
}

// Remove a voice: returns { list, tombstones } with the id tombstoned so a later cloud
// pull cannot bring it back (exactly the removedTeams contract).
export function removeVoice(list = [], tombstones = [], id) {
  return { list: list.filter(v => v.id !== id), tombstones: [...new Set([...tombstones, id])] };
}

// Re-following a voice clears its tombstone (same as re-following a team).
export function clearTombstone(tombstones = [], id) {
  return tombstones.filter(t => t !== id);
}
