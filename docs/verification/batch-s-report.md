# Batch S — root-cause touch fixes + AetherHub polish — verification report

**CASE: PR #81 (Batch O) is MERGED** (`origin/main` tops out at `fc6a51d "Batch O…(#81)"`), so
Batch S branches fresh from `main` as a new draft PR. One commit per item (S0…S13). **DO NOT
MERGE** — review PR. WebKit is unavailable in this container, so all automation is **Chromium**;
real iPad/iPhone Safari is **NEEDS-DEVICE**.

## The root cause (the point of the batch)

Batch O measured everything in Chromium **desktop** emulation, where the M5/N1
`@media(hover:none)/(pointer:coarse)` `min-height:44px` rules never apply. CB's real **touch**
devices hit those rules, so the shipped geometry differed from every green gate: the iPad header
bands crossed, State-of-Play rows grew a ~29px dead gap, the ticker misaligned, the sticky Sports
strip tucked under the chip bar. **S0** re-runs the geometry assertions under touch emulation
(`isMobile`+`hasTouch`, `matchMedia('(hover:none)')` & `(pointer:coarse)` both true) and they
**fail on main**; **S1** fixes the cause by moving the 44px target off the layout box onto an
`::after` hit-area for every control that lives inside a shared row/band.

## Automated gates

| Gate | Result |
|---|---|
| `test/visual/touch-mode.test.mjs` (S0) at 390/430/834/1194 touch | **ALL PASS** (13 assertions failed on main → 0 after) |
| `test/visual/text-overlap.test.mjs` (10 widths × 5 pages × light/dark) | _(filled below)_ |
| `sports-dedup`, `o7-hero-contrast`, `p5-sports-index` (Batch O) | **PASS** |
| Unit tests (11): promo, connections, railDedup, opinion, satire, share, heldList, state-of-play select, swipe-gesture, **source-name (S3)**, **top-stories select (S7)** | **PASS** |
| Hard constraints vs `main`: new `api/` files / new `setInterval` / new hex outside `tokens.css` / SW changed | **0 / 0 / 0 / 0** |
| Bundle gzip (JS+CSS) vs `main` | **269,552 B vs 267,665 B = +0.71%** (≤+1% gate) |

### Touch-mode assertions (S0), fail-on-main → pass-after

| assertion | on main (touch) | after |
|---|---|---|
| a — iPad MARKETS/ticker/weather share one center | spread 136px (portrait) / 14.5px (landscape); weather box overflows the 30px strip by 6.5px | spread 0, 0 overflow |
| b — State of Play in-row button box | 44px (the ~29px dead gap) | 20px (44px target on ::after) |
| b — SoP meta.top − title.bottom / row left-edge drift | — | ≤4px / 0px |
| c — phone Sports scores strip vs chip bar | tucked under (overlap) | 0 overlap at 5 scroll stops |
| d — phone hero/lead right edge | 386 vs 390 / 426 vs 430 (4px sliver) | 390.0 / 430.0 |
| e — clipped ticker / weather item | — | 0 clipped |
| f — chat launcher visible at rest | hidden on iPhone 390/430 + iPad portrait/landscape | visible (inView, not hidden) |

## Items

- **S1 root cause.** Converted the in-row touch controls (`.ss-tk`, `.rnw-row`, `.sop-ask`,
  `.sop-row-menu-btn`, `.fc-read-link`, `.fc-act`, `.fc-ellipsis-btn`) from a 44px layout box to a
  compact box + `::after` hit-area; stand-alone controls (nav/header icons, chips, collapse,
  see-all/footer links) keep real 44px. The slim ~30px ticker/weather strip is a documented
  exception (a 44px box there crosses the bands). All scoped to the touch media block — desktop
  mouse output byte-identical.
- **S2 iPad header.** Band 2 is one grid `[MARKETS][ticker 1fr][weather]`, `align-items:center`;
  ticker shows whole items only (O6); a ResizeObserver publishes `--band-scores-h`,
  `--band-markets-h`, `--sticky-h` for sticky offsets.
- **S3 SoP rows / sources.** One boxed row anatomy (headline + one meta line, same left edge);
  `cleanSourceName` turns `WWW.CHEMENGONLINE.COM` into `ChemEngOnline` (unit-tested).
- **S4 State of Play up front.** Home: breaking under the lead above Top Stories, then a ranked SoP
  card (claims before the sections). Category pages: SoP hoisted above the feed at ≤1100 (Energy
  verified at 390 top / 834 at 0.18vh; Home card at 1.26vh); Sports hoists a copy after the lead.
  _Partial/deferred:_ one-line breaking-strip styling, the "Show all N" expander, and the full-page
  / More-sheet single-column SoP view — the up-front **placement** (CB's core ask) is done.
- **S5 phone details.** Full-bleed hero via `calc(50% - 50vw)` (gutter-independent); the one-line
  weather band shows only the first city in full (never clips); the Sports strip sticks at
  `var(--sticky-h)` below the header.
- **S6 launcher.** Visible at rest, hides only while scrolling down, returns on up/idle.
- **S7 Top Stories relevance.** Home Top Stories ranked by coverage breadth then recency, non-
  general categories capped to one slot (≥2 outlets or breaking) — niche single-outlet trade/sports
  items no longer take a prime slot. Pure `rankHomeTop`, unit-tested. DCD-Studio-style items should
  NOT join `PROMO_PATTERNS` (no sponsored marker; the ranking is the right lever).
- **S10 breaking dot removed** — red "BREAKING" word is the only marker.
- **S11 numbers removed, light boxes** — each story a bordered row; the module drops its outer card.
- **S12 crisp white light mode** — `--bg` #f4f4f2 → #ffffff; white bands with hairline dividers
  (light-scoped); hover/pill fills → `--surface2`. **Dark unchanged by construction** (light-scoped
  / `:hover`-only changes); a 6-page dark screenshot diff sits within the same-build
  non-determinism noise floor.
- **S13 topic on every headline** — the topic is the first meta-line token in its category colour
  (News / Business & Markets / Energy / …) on mixed-topic surfaces (Home Top Stories, State of Play,
  breaking). Contrast ≥6.08:1 on white.

### Light-mode contrast on #ffffff (S12)

| token | contrast | | category tokens | min |
|---|---|---|---|---|
| text | 18.86:1 | | text (10 cats) | ≥6.08:1 |
| text2 | 8.58:1 | | bar (10 cats) | ≥4.25:1 |
| text3 (meta) | 5.11:1 (was 4.6 on pearl) | | all ≥4.5 / ≥3 | ✓ |

## Safari / real device

WebKit is unavailable, so S1/S5/S6 touch behaviour on real iPad/iPhone Safari is **NEEDS-DEVICE** —
`device-checklist.md` steps 25–33 are the on-hardware pass (tap **Copy report** with `?debug=1`).
