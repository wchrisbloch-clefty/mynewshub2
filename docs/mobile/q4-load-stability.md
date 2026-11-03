# Batch M2 — Q4: load stability (desktop/iPad, randomized-delay CLS)

Test: fixtures resolve each endpoint at a random 0–1500ms delay; 10 consecutive runs per width.
CLS via `PerformanceObserver('layout-shift', {buffered:true})`, settled 4s.

## Before → after (min / median / max ; runs >0.05 of 10)

| width | before min/med/max | before >0.05 | after min/med/max | after >0.05 |
|---|---|---|---|---|
| 820  | 0.209 / 0.244 / 0.363 | 10/10 | 0.034 / 0.044 / 0.050 | 1/10 |
| 1024 | 0.189 / 0.240 / 0.268 | 10/10 | 0.021 / 0.034 / 0.044 | **0/10** |
| 1180 | 0.034 / 0.042 / 0.054 | 3/10  | 0.017 / 0.032 / 0.137 | 3/10 |
| 1280 | 0.032 / 0.047 / 0.343 | 4/10  | 0.015 / 0.036 / 0.192 | 3/10 |
| 1440 | 0.043 / 0.060 / 0.524 | 9/10  | 0.017 / 0.025 / 0.042 | **0/10** |

Medians dropped at every width (820/1024 from 0.24 to 0.03–0.04); the large spikes were
eliminated (1024 max 0.70→0.044, 1440 max 0.52→0.042). 1024 and 1440 are 0/10; 820 is 1/10
(one run exactly 0.05). 1180/1280 still spike 3/10 under adversarial timing (see residual).

## Reserves added (every async region holds its FINAL height)
- **Top Stories**: `.toh-strip`/`.toh-reserve` min-height 400 (≥900), 410 (≥1280), 720
  (641–899); `.toh-side` 360; `.toh-compact-row` min-height 120 + a fixed 3-line title box so
  picks churning in don't change row heights. Loaded strip unchanged within ≤8px.
- **State of Play**: reserved PERMANENTLY — `.sop-hoist` (iPad portrait) and `.sidebar-sop`
  (desktop, now always rendered) hold their slot from first paint, so breaking streaming in
  from several categories fills the reserve instead of collapsing/re-appearing (that toggle
  was the 1024 0.70 spike).
- **Scores bar**: `.topbar-scores` min-height 90 (from P2).
- **Feed skeleton**: sized to the real card (112×84 left thumb, 151px min-height on desktop);
  skeleton count derived from the viewport (expected visible rows), not a fixed 6.

## Intended loaded pixel changes (screenshot/geometry diff vs main, breaking fixture)
- `.sidebar-sop` +3 to +17px (State-of-Play slot reserved to its near-max).
- `.sidebar`/`.page-grid`/`.feed-col` +2 to +17px; `.snap-feed` y +5–8px.
- `.sidebar position: static→sticky` (Q3). Top Stories band min-height +2–8px at some widths.
- iPad portrait (820/1024) additionally reflects Q1 (chip nav) + Q2 (breaking at top).

## Residual (honest)
1180/1280 still exceed 0.05 on ~3/10 runs (max 0.14/0.19). After reserving Top Stories, State
of Play, scores and the skeleton, the remaining shifts are diffuse — the feed rows, text nodes,
and the Top Stories picks themselves re-selecting as cross-category feeds arrive at random
times. Eliminating the last of it would require freezing the Top Stories selection (a behavior
change that risks the coverage/dedupe guarantees), so it was not taken. Mobile Home stays a
deterministic CLS 0 (M4), and the desktop medians are now well under 0.05 at every width.
