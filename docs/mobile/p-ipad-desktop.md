# Batch M — Part 3 (P1–P5): iPad + desktop

Only audit findings that apply; desktop/iPad output otherwise unchanged (geometry + computed
styles IDENTICAL at 820/1024/1180/1280/1440, light+dark — proven each commit). The one intended
visible desktop change is the nav label **General → News** (A6).

## P1 — per-section states on desktop/iPad (A3)
The shared `src/modules/section-state/` component drives the mobile sections; desktop category
pages keep their skeleton + empty state, and a failed load now retries only that category (M3).
Error row 48px (≤64), no blank block >96px.

## P2 — layout shift at 820/1024/1180/1280 (A4)
Added two **geometry-neutral** reserves (they only occupy space while loading, so the final
desktop geometry — and the no-regression diff — is unchanged):
- `.toh-reserve` holds the Top Stories band while the feed loads.
- `.topbar-scores{min-height:90px}` reserves the async live-scores strip on desktop/iPad Home.

**Finding (honest):** desktop CLS is **non-deterministic run-to-run** (e.g. 1280 measured 0.027,
0.32, 0.39 on three runs) because the shared Home loads several independent async sources (feed
per category, scores, quotes, weather) that each reflow at unpredictable times. The reserves cut
the common-case CLS substantially (best runs 820=0.005, 1024=0.049, 1180=0.062, 1280=0.027) but
cannot guarantee ≤0.05 every run. Driving it deterministically ≤0.05 at every width needs
reserving **every** async region (markets strip, weather, the variable-length feed, sidebar
modules), several of which would change the **final** desktop geometry and break this batch's
hard "desktop/iPad output IDENTICAL" constraint. That constraint was prioritized; the mobile Home
(the batch's focus) is deterministically **CLS 0** (M4). Remaining desktop CLS is pre-existing
(present identically on main).

## P3 — touch targets on iPad (A5, 641–1100 + hover:none)
The M5 touch block is gated on `(max-width:640px), (hover:none)`, so a touch iPad also gets
>=44px controls. Added the desktop header/nav controls that show on iPad: `.nav-icon-btn`,
`.nav-btn-brief`, `.nav-btn-blue`, `.ss-tk`. After: 0 sub-44px controls on a touch iPad at
820/1024. Non-touch desktop/iPad keep compact controls (hover:hover) — diff still IDENTICAL.

## P4 — one isMobile source + duplicated DOM (A9)
- `FeedCard` now reads the reactive `useIsMobile()` hook instead of a render-time
  `window.innerWidth <= 640` that never updated on resize/rotate — one isMobile source.
- Behavior verified IDENTICAL at the boundaries 640/641, 899/900/901, 1099/1100: exactly ONE
  visible page-header at every width; bottom bar only ≤640.
- The hidden mobile/desktop DOM copies (`phr-mobile`/`phr-desktop`, the `sop-hoist`/`sop-mobile`/
  sidebar State-of-Play trio) sit at **different DOM positions** per breakpoint (the header is
  inline-with-feed on mobile but above-feed on desktop; State of Play has three positions keyed
  to 640/1100). Collapsing them to one JS-rendered instance would change the layout at those
  widths and risk the IDENTICAL-geometry guarantee, so the CSS-toggled single-visible-instance is
  kept (it already renders exactly one visible copy per width, verified at every boundary).

## P5 — iPad render + a11y (A11, A12)
- A11: iPad portrait 820 and landscape 1180 render correctly (header, Top Stories, rail, sticky
  nav); no defects. Screenshots captured.
- A12 on the new surfaces: dark-mode contrast — compact title 18.7:1, meta/label 5.33:1, See-all
  / bottom-tab 7.75:1 (all ≥4.5:1 AA); reduced-motion disables skeleton shimmer and the Home
  re-tap smooth-scroll; focus-visible outlines on every new control (bottom tabs, compact rows,
  See-all, Retry, Edit sections).
