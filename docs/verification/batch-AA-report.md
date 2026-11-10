# Batch AA — a type system that is actually world-class, calm scores, iPad/desktop defects, Z follow-ups

**CASE:** `git fetch --all` + PR list — **PR #89 (Batch Z) is MERGED** (`3b64589` on
`main`). Branched `claude/vigilant-gates-D9cTB` **fresh from `main`**, one commit per
item (AA1…AA7, with AA6+AA7 coupled), **draft PR, DO NOT MERGE**. Sandbox has no feed
egress → all content is the harness's real-shape fixtures. No WebKit → real-device
Safari = **NEEDS-DEVICE**. Everything run desktop + touch emulation
(`isMobile/hasTouch` → `(hover:none)` true), light + dark, across phone (360/390/430),
iPad (820/1024/1180/1194/1280) and desktop (1440/1680), on every category/sub-category
page.

## Item status

| item | what | result |
|---|---|---|
| **AA1** | scores: calm, neutral, no "live" noise | ✅ **PASS** — removed the red dot / `is-live` / `sb-live-pill` / pulse; status shows period-clock or nothing, never "Live"/"In progress"; leader by weight (600 vs 400), not colour; label always "Scores". Scan: 0 `--red` on any score element, 0 `/live|in progress/i`, tile ≤68px (was ~130 on iPad). |
| **AA2** | type system: roles, weights, scale | ✅ **PASS** — every story headline serif (SoP rail fixed); weights {400,500,600,700}+wordmark; **154 px literals → 0** (role tokens); text-wrap balance/pretty, optical-sizing; caps only label/eyebrow/ticker; one section-heading style. |
| **AA3** | font delivery (self-host, no new family) | ✅ **PASS** — Inter + Source Serif 4 self-hosted WOFF2, npm pkg removed, OFL committed, Google Fonts deleted; metric-matched fallbacks; preload 2 latin files (97KB); **0 google requests**, **swap CLS ~0**. SW unchanged. |
| **AA4** | iPad/desktop defects | ✅ **PASS** — Analyze/Customize ghost icons ≤1280 (0 boxed), label ≥1281; chrome 1194 215px / 1440 222px; publisher cap counts the lead (≤2/publisher, unit-tested); stale ticker → neutral "Closed". Dead-gap already ≤4px. |
| **AA5** | Batch-Z follow-ups | ✅ **PASS** — one-time `feedsMigrationZ2` (versioned, preserves on/order/custom, idempotent, unit-tested); scroll place-keeping + "N new" pill now on iPad + desktop (fixed pill, 0 shift). CB_THUMBS unanswered → **WAITING-ON-CB** (rows 1–2 NOT promoted to thumbnail). |
| **AA6** | prove it on every page + re-verify | ✅ **PASS** — new `type.test.mjs`: **1078 violations on main → 0 on AA**; all suites re-run green (matrix). |
| **AA7** | bundle & performance | ✅ **PASS** — initial JS gzip **179,609 B = −224 B vs main** (≤ main); removed dead hero-band/gn-lead CSS; CSS assets not larger. |

## BEFORE / AFTER

| metric | main `3b64589` (BEFORE) | branch (AFTER) |
|---|---|---|
| font-weights in use | 7 — incl. **800 ×82**, **900 ×17**, 300 ×1 (Inter faked beyond 800) | **{400,500,600,700}** + the wordmark SVG (800) |
| font-size px literals in CSS | 154 (19 distinct) + 3 surviving clamps | **0** (every one a role token; check:tokens distinct 19→0) |
| uppercase (computed) | nav tabs, tagline, "Markets" flag, score labels **+** eyebrows | **only** label/eyebrow role, TopicLabel, S&P/DOW tickers |
| scores | red dot + "LIVE"/"IN PROGRESS"/"FINAL" + red/green numbers + pulse | **neutral** — period·clock or nothing, "Final", leader by weight, no red |
| score card height (iPad) | ~130px | **≤68px** |
| chrome above first section (1194 / 1440) | ~380px / — | **215px / 222px** |
| header buttons ≤1280 | boxed Analyze + Customize | **ghost icons** (0 boxed), label only ≥1281 |
| story headline voice | serif in Top stories, **sans** in SoP rail / standard feed rows | **serif everywhere** (one voice) |
| font delivery | render-blocking Google Fonts stylesheet + 2 preconnects, swap reflow | **self-hosted** WOFF2, preload, metric-matched fallback, **0 third-party**, swap CLS ~0 |
| font bytes, first paint | Google Fonts (variable, both axes) | **97KB** (2 preloaded latin files) ≤ 130KB |
| publisher cap | lead NOT counted (3 NY Post in the first five possible) | **lead counted** — ≤2/publisher across lead + rows |
| the four re-tagged feeds on an existing device | still in General (localStorage) | **migrated** once per device (TechCrunch→tech, CNBC/Brew→business, Bloomberg→finance) |
| initial JS gzip | 179,833 B | **179,609 B (−224 B)** |

## AA6 — type.test FAIL-then-PASS (the proof)

`BASE=<main build> node test/visual/type.test.mjs` → **TYPE — 1078 violations**, catching
all four rules it must:

```
(a) headline not serif: .fc-title          (.sop-item-title on State of Play)
(b) weight 800 outside wordmark: .home-scores-label / .score-tile-lg / .nav-tab / .toh-title …
(b) weight 900 outside wordmark: .score-tile-score
(b) font-size 20px off-scale / 34px off-scale: .ph-label …
(c) uppercase not allowed: .nav-tab.t-general "News" / .score-tile-when "Q3 4:12"
(d) red on score el: .score-tile-dot backgroundColor / .score-tile-status color
```

`BASE=<AA build> node test/visual/type.test.mjs` → **TYPE — 0 violations · ALL PASS**
(12 pages × 3 bands × light/dark).

## Caps-discipline veto list (AA2.5 — change these, with screenshots)

| element | before | after |
|---|---|---|
| nav tabs | `NEWS` / `BUSINESS & MARKETS` (uppercase) | `News` / `Business & Markets` (sentence) |
| tagline (`.logo-tag`, `.pm-tagline`) | `YOUR DAILY BRIEFING` | `Your daily briefing` |
| markets flag (`.ss-flag`) | `MARKETS` | `Markets` |
| score league/status | `NFL · Q3 4:12` tracked uppercase, status red | `NFL · Q3 4:12` neutral, not tracked |
| **kept uppercase** (label/eyebrow role + tickers) | — | `TOP STORIES`, `SCORES`, `STATE OF PLAY`, TopicLabel, `S&P`/`DOW`/`NASDAQ` |

## Gates (final AA build)

`type` 0 · `conformance` 0 (incl. Z3 anatomy) · `text-overlap` 0 · `contrast` 0
(7100 leaves) · `empty-box` PASS · `dedupe-label` PASS · `image-slots` + `detect` 37/37 ·
`layout-polish` 0 · `fixed-overlap` 0 · `sports-dedup` PASS · `p5-sports-index` PASS ·
`o7-hero-contrast` PASS · `touch-mode` PASS · `sop-up-front` PASS · `check:tokens` green
(font-size literals 0) · unit tests (top-stories incl. AA4.5, feeds-migrate) ALL PASS ·
CLS Home 390 0.016 / 375 ≤0.03 · font-swap CLS ~0 at 390/820/1194/1440 · initial JS
gzip −224 B vs main.

## Screenshots

Captured at 390 / 820 / 1194 / 1440 for Home / Business / Sports / Podcasts / State of
Play, light + dark (40 shots). They show the calm scores, the one serif voice, the
sentence-case nav/tagline, the ghost header icons ≤1280, and the shift-free self-hosted
type.

## What CB confirms on his devices
- **iPhone / iPad:** scores calm and not red; headlines all one serif voice; no text
  jump on load; no dead gap under the Nvidia-style no-image rows; Analyze/Customize as
  icons.
- **Desktop:** the same type everywhere.
- **After merge:** the four feeds are tagged correctly on his own devices (one-time
  `feedsMigrationZ2`, idempotent).

## Honest caveats
- **AA3 opsz:** self-hosted the weight-variable subsets (the opsz 2-axis file is 122KB
  latin alone — over the 130KB first-paint budget), so `font-optical-sizing:auto` is a
  harmless no-op. Weight — the essential axis — is fully variable.
- **AA5.3 CB_THUMBS:** unanswered → **WAITING-ON-CB** (not shipped).
- **Safari/WebKit + live feeds:** **NEEDS-DEVICE** (no WebKit, no feed egress in the sandbox).
