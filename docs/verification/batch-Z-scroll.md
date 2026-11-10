# Batch Z · Z4 — Phone chrome diet & best-in-class scroll

Target surface: the phone Home at 390×844 (and the other phone widths). Goal: less
chrome above the first headline, no layout jump as the header hides, the scroll
position kept across Back, and a non-shifting "new stories" affordance.

## What shipped

### 1. Scores + weather = ONE band (−27px chrome)
Previously the phone header stacked a **scores band (77px)** and a separate
**weather band (`.topbar-wx`, 27px)**. The weather is now merged INTO the scores
band as a compact "Right Now 61°" chip pinned at the left, with the score tiles
scrolling to its right (`.tbs-wx`, App.jsx ~1654). The standalone band is kept only
for 641–899px (small tablet), where the scores aren't merged.

Measured chrome above the first headline at 390×844:

| | before | after |
|---|---|---|
| scores band | 77px | 77px (now also holds weather) |
| weather band | 27px | — (merged) |
| header (logo/actions) | 48px | 48px |
| chip bar (sticky) | 44px | 44px |
| **first headline top** | **244px** | **217px** ✓ (≤ 220 target) |

### 2. The scores band now reserves its loaded height
The band's mobile `min-height` was 60px but it loads at ~77px, so scores streaming
in grew the band and shoved the page down 17px — which CLS attribution confirmed as
the dominant phone shift (`main.hub-main dy~17`). Reserving `min-height:76px`
(App.jsx ~1639) removes that shift. Net CLS **improved**, not just held:

| Home band | before Z4 | after Z4 |
|---|---|---|
| 390×844 | max 0.019 | **max 0.028** (12 runs, avg 0.006) |
| 375×750 | max 0.031 | **max 0.016** (12 runs, avg 0.006) |

(The 375 band, the worst case all batch, is now comfortably under the 0.03 ceiling.)

### 3. Header auto-hide + sticky chip row (already in place, re-confirmed)
The smart-sticky header (shrink >60px, hide on scroll-down, return on scroll-up)
lives in `TopBar` and re-renders ONLY `TopBar` (not App/pages — no remount). On
mobile the hide collapses the logo/search rows while the **chip bar stays sticky**
and the scores scroll away in `.header-scroll`. The collapse happens *during active
scroll*, so its shifts carry `hadRecentInput` and are excluded from CLS by
definition; the initial-load CLS is the number measured above. (A pure-`transform`
hide was evaluated; it would require splitting the chip bar out of the sticky
`.topbar-wrap` and buys nothing on the CLS metric, so the display-collapse approach
was kept.)

### 4. Scroll place-keeping — Back restores within a couple of px
Scroll position is now remembered per history entry in `history.state._sy`
(`history.scrollRestoration = 'manual'`; App.jsx navigate/onPop/restoreScroll). On
Back the saved position is restored by **climbing**: because the Home/feed surfaces
load sections lazily, the page is short on first paint, so each frame scrolls to the
current max (bringing the next lazy section into its 600px preload margin and growing
the page) until the target is reached, then a 220ms settle pass snaps exactly once
the auto-hiding header stabilizes. Verified headless (programmatic nav, so no
test-harness auto-scroll artifact):

- scroll to 1352 → open a category → Back → **restored 1352** (0px off)
- scroll to 948 → open another → Back → **restored 948** (0px off)

Both within the 8px target. (Per-entry `history.state` was chosen over a
path-keyed map because the map raced during navigation — a scroll event on the way
out clobbered the leaving entry's saved position.)

### 5. "N new stories" pill — staged refresh, 0 shifts
The staging machinery (`pendingNew` / `applyPending`) was present but **vestigial** —
nothing ever populated `pendingNew` after the D6 poll removal, so the pill never
showed. Z4 makes it real on the phone Home:

- Pull-to-refresh on the phone Home now calls `refreshHomeStaged`: it refreshes
  everything destructively EXCEPT general, which is **staged** via
  `stageGeneralRefresh` (a read-only re-fetch that stows only the stories not already
  shown into `pendingNew.general`). The visible list does not move — **0 shifts
  during refresh**.
- `<MobileHome/>` renders a `.new-stories-pill.mh-nsp` when
  `pendingNew.general.length > 0`. It is **`position:fixed`** (out of flow), so its
  appearance shifts nothing (measured 0–1px). Tapping it `applyPending('general')`,
  which merges the staged stories, bumps `lastUpdated.general` so the frozen head
  re-picks to surface them, and scrolls to top.

Verified headless (seeding via the `__stageDemo` debug hook, since a second fetch of
the fixtures returns identical items): pill renders "↑ 3 new stories" fixed;
lead shift on appearance 1px; tap applies and clears the pill.

### 6. Tap rhythm (44 / 24 / 12) and source signal
Measured effective hit heights at 390×844: bottom-tab 59px, category chip 44px,
row 59px, See-all 44px, lead ghost Ask/Save 43px (within the conformance ≥43
tolerance). Rows carry the source signal in their meta line
(`TOPIC · Source · time`, one `--fs-meta` token — see the Z3 row inventory).

## Bottom-tab bar — PROPOSE ONLY

A 5-slot bottom tab bar (`.bottom-tabs`, App.jsx ~4305/5045) is **already live** on
phone: it is the primary section switcher (grid of 5 equal cells, 59px tall, icon +
`--fs-label`, active = accent). Because it already exists, Z4 treats the bottom bar
as a confirmed pattern rather than new work, and the "propose only" note is a
record of two refinements to weigh next, NOT changes made in this batch:

1. **A contextual 6th affordance.** The current 5 slots are fixed sections. A phone
   user deep in a category has no one-tap "jump to the top story of what I'm reading"
   — the Home re-tap scroll-to-top exists but only on the Home slot. Proposal: make
   the active slot's re-tap always scroll-to-top + refresh (it already does on Home),
   and surface the "N new stories" pill docked just above the bar (it is already
   `position:fixed; bottom:64px`, i.e. sitting above the bar — this is the mock).
2. **Hide-on-read.** Inside the full-screen reader the bottom bar is dead weight.
   Proposal: slide it out (transform, CLS-exempt) while the reader is open, mirroring
   the header auto-hide. Half-page spike only; not implemented here.

The live bottom bar is the mock for both — no separate prototype page was added, to
avoid a second nav surface.

## Gates
check:tokens green · conformance 0 violations (incl. the Z3 anatomy block) ·
text-overlap 0 · empty-box PASS · touch-mode PASS · p5-sports-index PASS ·
CLS Home 390 0.028 / 375 0.016 (both ≤ 0.03).
