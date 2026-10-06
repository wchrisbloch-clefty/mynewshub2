// TierBadge — the SPARING card badge (Pass: trust-labels item 2c). Deliberately quiet:
//   • reported  → NO badge (reported is the silent default; badging it would be clutter)
//   • verified  → a small green check
//   • inferred  → a small "unverified" flag
//   • unknown   → nothing
// Palette matches the Perspectives panel's tier badges (green verified / muted unverified).
import { tagProvenance } from '../../../lib/provenance.js';
import './TierBadge.css';

export function TierBadge({ item }) {
  const { tier } = tagProvenance(item);
  if (tier === 'verified') return <span className="prov-badge prov-verified" title="Verified source">✓ Verified</span>;
  if (tier === 'inferred') return <span className="prov-badge prov-inferred" title="Unverified — inferred signal, not confirmed reporting">Unverified</span>;
  return null; // reported (silent default) and unknown → no badge
}
