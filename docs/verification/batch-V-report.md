# Batch V — close out Batch U (phone parity, pills, empty box, debt, dark proof)

**CASE:** `git fetch --all` + PR list — PR #84 (Batch U) is **MERGED** (squash `1d6534c` on `main`).
Branched `claude/vigilant-gates-D9cTB` fresh from `main`, one commit per item V1–V7, **draft PR,
DO NOT MERGE**. Sandbox has no feed egress, so all content is the test harness's real-shape
fixtures. WebKit unavailable → real-device Safari = NEEDS-DEVICE.

## Item status

| item | what | result |
|---|---|---|
| V1 | phone header button parity (<=640 quiet icons) | ✅ PASS (header height Δ0, 0 bordered) |
| V2 | one pill language for the topic filters (+ sweep leftover category colour) | ✅ PASS (0 cat-colour outside TopicLabel, 0 non-transparent pills at rest) |
| V3 | collapse the empty State-of-Play rail box + reusable detector | ✅ PASS (box gone; detector green 30 cells) |
| V4 | design-debt burn-down so the ratchet bites | ⚠️ PARTIAL — hex & radius met, inline & font-size partial (see below) |
| V5 | dark-mode proof | ✅ PASS (no dark-only defect) |
| V6 | diagnose the two carried CLS/render gates | ✅ renders +0; Home CLS regression fixed; Energy pre-existing (cause table) |
| V7 | re-verify + report | ✅ this doc |

## BEFORE / AFTER (`scripts/token-baseline.json`, main vs branch)

| metric | main (BEFORE) | V (AFTER) | V4 target | met? |
|---|---|---|---|---|
| distinct hex outside `tokens.css` | 64 | **0** | ≤30 | ✅ exceeded |
| border-radius literals outside {0,4,8,12,pill} | 13 | **5** | ≤5 | ✅ |
| distinct `font-size` px literals | 21 | **19** | ≤14 | ❌ partial |
| inline `style={{` | 245 | **224** | ≤160 | ❌ partial |
| `!important` | 20 | **18** | — | ↓ |
| min computed font-size | 11px | 11px | — | held |
| header height (820/1194/1280) | 54px | 54px | ±1px | ✅ |
| initial JS gzip | — | **+0.17%** vs main(=U) | ≤+1% | ✅ |

**V4 partials, honestly:** the font-size ≤14 cap needs remapping the 92-use `12px` and the
17/20/24/28px headline sizes — those shift large text past the 0.3% pixel-diff budget (measured
3–6% when attempted), so they were left. The inline ≤160 cap needs ~65 `className`-merge
conversions that risk duplicate-className on elements that already carry one, for little design
value. Both reductions that WERE safe (whites/semantic colours consolidated, every remaining
literal centralised in `tokens.css`, small radii + pills tokenised, sub-pixel font merges, one
repeated icon style → `.ic-nudge`) were shipped and the baseline ratcheted down.

**V4 shifted-value table:** none. Every colour/radius/size change was a pixel no-op — the comprehensive
pixel diff (real fixtures, Home/Energy/Sports/State-of-Play at 390 & 1194, light + dark) is ≤ 0.09%
on every deterministic cell (Home-390 is the known content-jitter; Home-1194 dark spikes only when
the News fixture shows its error state). An earlier aggressive pass that mapped fixed darks/greys to
theme-aware tokens (inverting them in dark mode) and pills to boxy radii was reverted before commit.

## V3 root cause (the empty box)

`.sidebar-sop` (the App wrapper around State of Play, not `StateOfPlay.css`) still drew an outer
card — border + surface + 12px padding + a reserved 330px slot. When `StateOfPlay` returns null
(fewer than 3 ranked rows and no breaking — e.g. the Energy fixture, which doesn't cluster) that
wrapper rendered as an empty bordered **332×330** box at the top of the rail. Fix: drop the outer
card (U5.1 was incomplete — it only touched `StateOfPlay.css`); the empty wrapper keeps its reserved
height but is **borderless**, so it is a quiet reserved space, never a bordered empty box. The
reusable `test/visual/empty-box.test.mjs` detector flagged it before and is green after (30 cells).

## Gates (Chromium + Chromium-touch, real fixtures)

| gate | result |
|---|---|
| unit tests (10 modules) | **10/10 PASS** |
| touch-mode harness, sports-dedup, P5, hero-contrast, SoP-up-front | **ALL PASS** |
| text-overlap (10 widths × 6 pages incl. State of Play × light+dark) | **0 overlaps** |
| empty-box detector (Home/Energy/Sports/Business/Briefing × 6 widths) | **ALL PASS** |
| desktop/iPad CLS, Home 1194, 10 runs | **0.0435 PASS** (= main 0.045) |
| V2: 0 category-colour text outside TopicLabel; 0 non-transparent pills at rest | **PASS** (Energy/Home/Sports/Business, light+dark) |
| V1: phone header height Δ0, 0 bordered icons, (hover:none)=true | **PASS** |
| renders-on-scroll (App) | **+0** |
| 0 `api/` files · 0 new `setInterval` · SW unchanged · 0 new hex · check:tokens | **PASS** |
| initial JS gzip vs main(=U) | **+0.17%** (≤+1%) |

### Carried / pre-existing (U == V == main, NOT weakened by Batch V)

| item | main | V |
|---|---|---|
| Energy desktop CLS (1194, 10 runs, cap 0.05) | 0.110 FAIL | 0.112 FAIL (async rail modules — cause table in batch-V-cls-V6.md) |
| mobile Home CLS (390, cap 0.01) | spikes ~0.09 | avg 0.0056, same spikes (weather band) |

Home desktop CLS was briefly regressed by V3's empty-box collapse (0.094) and **fixed in V6**
(reserve restored, 0.0435). No gate ends weaker than main.

## Screenshots
Before (main) / after (V), real fixtures, **light and dark** at 390 and 1194 for Home, Energy,
Sports and the State of Play page: `docs/verification/batch-V/{page}-{w}-{theme}-{main,V}.jpg`.

## What CB confirms on iPhone / iPad (real Safari)
1. The phone header is as calm as the desktop one — borderless icons, no bordered squares.
2. The "Filter by topic" pills look exactly like the chips — bordered, transparent, neutral; the
   selected one is the single accent fill. No colour on a source name anywhere.
3. No empty box (or bordered rectangle) at the top of the right rail on Energy.
4. Dark mode is readable — amber "N unavailable" text, white topic label over photos, visible
   borderless icons, >=4.5:1 on every pill.
