// src/modules/provenance — the app's provenance surface. The canonical tier table and
// tagging logic live in /lib/provenance.js (so the serverless API can share them); this
// module re-exports them and adds the React badge. Import from here in app code.
export { TIER_RANK, TIER_LABEL, normalizeTier, tierRankOf, sourceClassOf, tagProvenance } from '../../../lib/provenance.js';
export { TierBadge } from './TierBadge.jsx';
