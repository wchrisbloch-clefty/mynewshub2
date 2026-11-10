# Batch AA — per-category / per-surface re-verification matrix (AA6)

Every category and sub-category page re-checked across phone (360/390/430), iPad
(820/1024/1180/1194/1280) and desktop (1440/1680), light + dark, by the reusable
machine gates, after the Batch-AA changes (AA1 calm scores · AA2 type system · AA3
self-hosted fonts · AA4 iPad/desktop defects · AA5 Z follow-ups). A cell is **PASS**
when the named gate passed for that surface.

Gates: **type** = `type.test.mjs` (serif headlines; weights ⊆ {400-700} + wordmark;
sizes ⊆ scale; uppercase only label/eyebrow/ticker; no red on scores; text-wrap on
headlines; 0 third-party font request) · **chip/tile/band + row anatomy** =
`conformance.test.mjs` (0 violations, incl. the Z3 ≤3-anatomy block) · **overlap** =
`text-overlap` + `fixed-overlap` · **contrast** = `contrast` · **empty box** =
`empty-box` · **dedupe/label** = `dedupe-label` · **image slots** = `image-slots` +
`detect` · **scores** = `p5-sports-index` + the type gate's no-red-on-scores · **hero**
= `o7-hero-contrast` · **touch** = `touch-mode`.

| category / surface | type (AA) | conformance | overlap | contrast | scores calm | touch |
|---|---|---|---|---|---|---|
| **News** (general / Home) | PASS | PASS | PASS | PASS | PASS (no red, no "live") | PASS |
| **Business & Markets** | PASS | PASS | PASS | PASS | — | PASS |
| **Energy** (Power/Oil&Gas/Clean/Markets/Policy) | PASS | PASS | PASS | PASS | — | PASS |
| **AI & Tech** | PASS | PASS | PASS | PASS | — | PASS |
| **Sports** (hero + 3-up grid + scores strip) | PASS | PASS | PASS | PASS | PASS (ScoreTile shared, no red) | PASS |
| **Health & Longevity** | PASS | PASS | PASS | PASS | — | PASS |
| **Pop Culture** (Shows/Music/Books/Comedy) | PASS | PASS | PASS | PASS | — | PASS |
| **Podcasts** | PASS | PASS | PASS | PASS | — | PASS |
| **Briefing** | PASS | PASS | PASS | PASS | — | PASS |
| **State of Play / All top stories** | PASS (rail now serif) | PASS | PASS | PASS | — | PASS |
| **Saved** | PASS | PASS | PASS | PASS | — | PASS |
| **Sources** | PASS | PASS | PASS | PASS | — | PASS |
| **Reader** | PASS (title serif, on-scale) | PASS | PASS | PASS | — | PASS |

## Batch-AA confirmations

| surface / claim | gate | result |
|---|---|---|
| Scores (Home strip, Sports, rail, tiles) | computed-style scan | PASS — 0 `--red`-derived colour on any score element, 0 `/live|in progress/i` text, tile ≤68px |
| Every story headline (all surfaces) | type (a) | PASS — serif everywhere (SoP/rail, Houston, feed rows, podcasts, breaking strip) |
| Weights | type (b) | PASS — content weights ⊆ {400,500,600,700}; 0 ≥800 outside the wordmark SVG |
| Font-size scale | type (b) + check:tokens | PASS — 0 px/clamp literals in App.jsx CSS; computed sizes ⊆ role tokens |
| Caps discipline | type (c) | PASS — uppercase only on label/eyebrow role, TopicLabel, tickers; nav/tagline/markets/scores sentence-case |
| Typesetting | type (e) | PASS — text-wrap:balance on headline roles |
| Fonts | type (f) + AA3 probe | PASS — 0 request to googleapis/gstatic; swap CLS ~0 |
| Header buttons ≤1280 | AA4 probe | PASS — 0 boxed buttons at 1194/1280 (ghost icons); boxed+labelled ≥1281 |
| Chrome ≥641 | AA4 probe | PASS — 1194 215px (≤260), 1440 222px (≤240) |
| Publisher cap (lead counted) | unit test | PASS — NY Post lead → ≤1 NY Post row |
| Feed reconcile | unit test | PASS — 4 moves, flags/custom preserved, idempotent |
| Place-keeping iPad/desktop | AA5 probe | PASS — Back restores within 0px at 820/1194/1440 |
| "N new" pill iPad/desktop | AA5 probe | PASS — fixed, 0 shift, applies |

## type.test on main (the FAIL-then-PASS proof)

`BASE=<main build> node test/visual/type.test.mjs` → **1078 violations**, catching all
four rules it must: (a) `.fc-title`/`.sop-item-title` not serif, (b) weight 800/900 +
off-scale sizes, (c) uppercase on nav tabs + `.score-tile-when`, (d) red on
`.score-tile-dot`/`.score-tile-status`. On the AA build: **0 violations, ALL PASS**.
Full pre-fix output: `/docs/verification/` referenced in batch-AA-report.md.
