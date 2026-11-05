// U3: ONE icon treatment. Every category / sub-topic icon that renders anywhere goes through
// CatIcon so size and stroke are identical instead of the old ad-hoc `size=14 strokeWidth=2.2`
// / `size=13` / `size=16` mix. Icons are quiet: thin 1.5 stroke, currentColor (so the parent's
// text colour — normally the neutral --text3 — flows through), never a category colour.
//
// SHOW_CHIP_ICONS is the single switch for sub-topic CHIP icons (Energy / Pop-culture / Sports
// league chips). Batch U sets it false: those chips are text-only, so a chip row is one quiet
// word per chip, not icon + fill + border. Flip to true and every chip icon comes back at one
// consistent size/stroke through CatIcon. (Icons that carry meaning on their own — header utility
// buttons, the share glyph, control X's — are not chip icons and are unaffected.)
export const SHOW_CHIP_ICONS = false;

// icon: a lucide component (passed in, so this module pulls in no icons of its own).
// size: 16 for in-row / chip use (default), 20 for header-scale use.
export function CatIcon({ icon: Icon, size = 16 }) {
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={1.5} color="currentColor" aria-hidden="true" />;
}
