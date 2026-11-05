# Batch U — one visual system (quiet category treatment, type floor, token guardrails)

**CASE:** Branched fresh from `origin/main` — Batch T (PR #83) and all earlier batches are merged
(`git log` shows `86baf7e Batch T … (#83)` as main's tip at branch time). Branch
`claude/vigilant-gates-D9cTB`, one commit per item U0–U9, **draft PR, DO NOT MERGE**.

Environment note: this is a cloud sandbox with **no outbound feed access** (allorigins / cross-origin
APIs are blocked → cert/tunnel errors). All page content in the gates and the before/after
screenshots is rendered from the test harness's **real-shape fixtures** (`test/visual/realfix.mjs`),
exactly as every prior batch verified. WebKit/Safari is unavailable → real-device Safari = NEEDS-DEVICE.

## Item status

| item | what | result |
|---|---|---|
| U0 | audit + baseline (`scripts/token-audit.mjs`, `token-baseline.json`, `docs/design/audit-U0.md`) | ✅ PASS |
| U1 | ratchet guard `npm run check:tokens` (fails on any increase) | ✅ PASS (proven exit 1 bad / 0 clean) |
| U2 | tokens as vocabulary (additive, visual no-op) | ✅ PASS (Home 1194 diff 0.0000%) |
| U3 | one quiet category treatment (text-only chips, neutral source, one TopicLabel, CatIcon) | ✅ PASS |
| U4 | one button language (quiet header icons, one secondary, one chip, de-navy Customize) | ✅ PASS (header height Δ0) |
| U5 | rail/status one anatomy, no box-in-box, feed-headline hierarchy fix | ✅ PASS |
| U6a | tokenize fixed-size literals (no-op) | ✅ PASS |
| U6b | raise the type floor to 11px | ✅ PASS (MIN 11px) |
| U7 | living `/design` page (lazy, URL-only, noindex) | ✅ PASS (0 app console errors) |
| U8 | STRETCH — container-query lead headline | ⏭️ SKIPPED — see below |
| U9 | re-verify + report | ✅ this doc |

**U8 skipped (honestly):** its acceptance is "CLS gates unchanged", but the lead headline only renders
with real feed data, which the sandbox blocks — so I cannot measure the CLS delta U8 must prove, and
container-query sizing interacts with the R2/Q4-tuned Top Stories stability. Per the spec U8 is
explicitly optional. Clean follow-up; nothing in U0–U7 depends on it.

## BEFORE / AFTER numbers (`node scripts/token-audit.mjs`)

| metric | BEFORE (main, U0) | AFTER (U) | note |
|---|---|---|---|
| distinct hex outside `tokens.css` | 64 | **64** | no new hex (ratchet held) |
| inline `style={{` | 246 | **245** | −1 (U3 removed the `.fc-source` inline) |
| distinct `font-size` px literals | 26 | **21** | −5 |
| `font-size` literals < 11px | 5 (7/8/9/10/10.5, 211 uses) | **0** | type floor |
| MIN computed font-size (text) | 9px (sub-11 throughout) | **11px** | excl. aria-hidden logo mark |
| distinct computed sizes / page / viewport | — | **3–8** | cap 12 |
| `!important` | 20 | **20** | no new |
| initial JS gzip vs main | — | **+0.38%** | cap +1% |
| total JS gzip vs main | — | +1.42% | the new lazy `/design` chunk (+2.9KB gz, loads only on /design) |
| header height (820/1194/1280) | 54px | **54px (Δ0)** | |

## U3 contrast table (`--cat-*-text` on `--surface`, computed live)

All ten pass AA (4.5:1) in both themes; **none needed darkening**.

| category | light | dark | | category | light | dark |
|---|---|---|---|---|---|---|
| general | 6.59 | 8.53 | | sports | 6.99 | 7.72 |
| business | 6.92 | 8.29 | | health | 6.35 | 8.95 |
| finance | 6.34 | 9.06 | | popculture | 7.26 | 7.79 |
| bloom | 6.08 | 8.43 | | comedy | 6.40 | 9.23 |
| tech | 7.22 | 7.59 | | local | 6.19 | 8.97 |
| **min** | **6.08** | **7.59** | | on-media | white | white |

## Element-count-per-row (must not increase)

| surface | BEFORE | AFTER |
|---|---|---|
| sub-topic chip | icon + label (2) | **label (1)** — decreased |
| feed-card meta | source(colour) + badges + topic-chip | source(neutral) + badges + topic-chip — **same count** |
| Top Stories / rail / mobile row | TopicTag · source · age | TopicLabel · source · age — **same count** |
| State-of-Play row | title + meta(topic/sources/time/ask) | same — **same count** |

No row's visible element count increased; chips decreased by one (the icon).

## Gates (Chromium + Chromium-touch, real-shape fixtures)

| gate | result |
|---|---|
| unit tests (10 modules: select, source-name, share, swipe, railDedup, connections, SoP select, satire, heldList, promo) | **10/10 PASS** |
| touch-mode harness (`(hover:none)` true) | **ALL PASS** |
| text-overlap: 10 widths (390/430/820/1024/1100/1101/1180/1194×834/1280/1440) × 6 pages (general/business/bloom/sports/briefing/**stateofplay**) × light+dark = 120 cells | **0 overlaps** |
| sports-dedup | ALL PASS |
| P5 sports index (selected tile = accent, 0 stray zero tiles, no h-scroll) | ALL PASS |
| hero contrast (white headline/source ≥4.5:1 over photo) | ALL PASS |
| SoP-up-front | ALL PASS |
| desktop/iPad CLS ≤ 0.05, Home 1194, 10 runs | **0.038 PASS** |
| swipe gesture (unit) + `data-no-swipe` intact (21 sites) | PASS; 9/9 device table = Chromium-touch / real Safari NEEDS-DEVICE (no gesture code changed) |
| 0 files under `api/` · 0 new `setInterval` · SW (`public/sw.js`) unchanged | **PASS** |
| dark mode changed only where U3/U4 specify | PASS (U2 added `--border-strong`/`--on-media` dark values; U3 on-media; no other dark change) |

### No-regression items (U matches main — not introduced by Batch U)

| item | main | U | verdict |
|---|---|---|---|
| mobile Home CLS (390, 10 runs, cap 0.01) | max **0.093** | max **0.096** | pre-existing spike (≈2/10 runs); U does not regress |
| App renders on scroll (390) | +4 | **+4** | identical; pre-existing |
| scrollJumps (390) | 7 | 7 | identical |

The mobile-Home CLS spike is a known residual (flagged since Batch T); it is not a type-floor or
layout effect of Batch U — main and U are statistically identical, and desktop/iPad CLS passes.

## Screenshots

- Living design system (light + dark + iPad): `docs/verification/design-baseline/design-{390,834,1194}.jpg`.
- Before/after (main vs U), real fixtures, Home/Energy/Sports/State-of-Play at 390 & 1194, **light**:
  `docs/verification/batch-U/{page}-{width}-light-{main,U}.jpg` (16 images). Dark was verified by the
  text-overlap suite (light **and** dark, 120 cells, 0 overlaps) and the `/design` dark baseline;
  the light pairs are kept here as the clearest side-by-side and to keep the repo lean.

The Energy@1194 pair is the clearest: chips lose their icons and grey fill; Customize loses its navy;
header icons go borderless; "8 sources unavailable" drops the peach fill (amber text on a plain
border); the "Updated" dot is gone; source names go neutral grey (the amber stays only on the ENERGY
topic label); the tagline is 11px; feed-row headlines drop to the 15px row-title token.

## What CB confirms on iPad / iPhone (real Safari)

1. The sub-topic chips read as clean words with no icons — and `SHOW_CHIP_ICONS = true` brings them
   back in one line.
2. The header is calm: quiet icons, one bordered Customize, the active section the only filled pill.
3. State of Play is a list of boxed rows with no card around them — no box-in-box.
4. The smallest text (labels, timestamps, "unavailable") is readable — nothing hair-thin.
5. `/design` renders the whole system at a glance (type it into the URL; it is not in the nav).
