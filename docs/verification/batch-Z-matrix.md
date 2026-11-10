# Batch Z — per-category / per-surface re-verification matrix (Z6)

Every category and surface re-checked across all device bands (phone 360/390/430,
iPad 820/1024/1194, desktop 1440/1680), light + dark, by the reusable machine gates,
after the Batch-Z changes (Z0 text-first lead · Z1 one Top-stories list · Z2
headlines-first pool · Z3 three row anatomies · Z4 chrome diet + scroll · Z5 podcast
parity · Z7 bundle). A cell is **PASS** when the named gate passed for that surface.

Gates: **chip/tile/status/band + row anatomy** = `conformance.test.mjs` (0 violations,
incl. the Z3 ANATOMY block: ≤3 anatomies/page, one `--fs-meta` meta token, no tweener
titles); **overlap** = `text-overlap` + `fixed-overlap` (0); **empty box** =
`empty-box` (0 empty bordered boxes); **contrast** = `contrast` (0 fails); **touch** =
`touch-mode` (≥44px hit on hover:none); **scores band** = `p5-sports-index` + the
conformance band rule; **hero/lead** = `o7-hero-contrast`; **detection** = `detect`
(37/37); **Top-stories up-front** = `sop-up-front`.

| category / surface | row anatomy (≤3) | chip/tile/band | overlap | empty-box | contrast | touch 44px |
|---|---|---|---|---|---|---|
| **News** (general / Home, phone + desktop) | PASS (LEAD text-first, STANDARD, COMPACT) | PASS | PASS | PASS | PASS | PASS |
| **Business & Markets** | PASS | PASS | PASS | PASS | PASS | PASS |
| **Energy** (Power/Oil&Gas/Clean/Markets/Policy) | PASS | PASS | PASS | PASS | PASS | PASS |
| **AI & Tech** | PASS | PASS | PASS | PASS | PASS | PASS |
| **Sports** (hero + 3-up grid + team feed) | PASS | PASS (scores band flat; weather merged on phone) | PASS | PASS | PASS | PASS |
| **Health & Longevity** | PASS | PASS | PASS | PASS | PASS | PASS |
| **Pop Culture** (Shows/Music/Books/Comedy) | PASS | PASS | PASS | PASS | PASS | PASS |
| **Podcasts** (Z5 one action set) | PASS (`.pod-card` COMPACT, `--fs-meta` meta) | PASS | PASS | PASS | PASS | PASS |
| **State of Play** (page + rail) | PASS (`.sop-item` COMPACT) | PASS | PASS | PASS | PASS | PASS |

## Surface-specific Z confirmations

| surface | gate | result |
|---|---|---|
| Phone Home lead | 0 lead-image request at 390; text-only skeleton | PASS (Z0) |
| Phone Home Top stories | ONE merged list, 5 rows + "Show all", 0 duplicate across lead/breaking/top/sections | PASS (Z1) |
| Home pool mix | ≥4/6 Top stories general; ≤2 per publisher; no single-outlet niche breaking | PASS (Z2) |
| Every list row | ≤3 anatomies/page, one `--fs-meta` meta token | PASS (Z3, conformance ANATOMY) |
| Phone chrome @390×844 | first headline top ≤220px | PASS — **217px** (Z4) |
| Phone Home CLS | ≤0.03, 20 runs | PASS — 390 **0.028** / 375 **0.015** (Z4) |
| Back scroll restore | within 8px | PASS — 1352→1352, 948→948 (Z4) |
| "N new stories" pill | 0 shifts during refresh, applies on tap | PASS (Z4) |
| Every podcast episode | Summary/Takeaways/Explain/Ask/Listen/Summarize/Share/Save; `/api/listen` only on tap | PASS (Z5) |
| Initial JS gzip vs main | ≤ +0.5% | PASS — **−0.64%** (179,833 B vs 180,999 B) (Z7) |
| Design-system ratchet | `check:tokens` baseline only down | PASS (inline styles 223→218) |

_Machine-gate run recorded in the Z6 suite; see batch-Z-report.md for the raw
per-gate output lines._
