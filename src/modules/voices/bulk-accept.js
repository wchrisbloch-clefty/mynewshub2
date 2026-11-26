// AH1: bulk "Accept all" — pure, unit-tested, lazy (loaded on the accept tap so it stays out of the
// initial chunk). Adds each seed as status:'unconfirmed', confirmedBy:'accept-all' (followed by name;
// handles resolve lazily later via Lane 1). Tombstoned ids are never re-added; existing ids are
// skipped and counted. Returns { voices, added, skipped }.
import { makeVoice, upsertVoice } from './model.js';

export function bulkAccept(prevVoices, tombstones, seeds) {
  const have = new Set((prevVoices || []).map(v => v.id));
  const tomb = new Set(tombstones || []);
  let out = prevVoices || []; let added = 0, skipped = 0;
  for (const s of seeds || []) {
    const v = makeVoice({ type: s.type, name: s.name, category: s.category, status: 'unconfirmed' });
    v.confirmedBy = 'accept-all';
    if (have.has(v.id) || tomb.has(v.id)) { skipped++; continue; }
    out = upsertVoice(out, v); have.add(v.id); added++;
  }
  return { voices: out, added, skipped };
}
