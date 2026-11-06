# Batch Y — finish what Batch X reported as partial (phone first screen, one Lead, real image proof, bundle diet)

**CASE:** `git fetch --all` + PR list — **PR #87 (Batch X) is MERGED** (`2f30633` on `main`). Branched
`claude/vigilant-gates-D9cTB` **fresh from `main`**, one commit per item, **draft PR, DO NOT MERGE**.
Sandbox has no feed egress → all content is the harness's real-shape fixtures. No WebKit in the
sandbox → real-device Safari = **NEEDS-DEVICE**. Everything run desktop + touch emulation
(`isMobile/hasTouch` → `(hover:none)` true), light + dark.

## Item status

| item | what | result |
|---|---|---|
| Y1 | phone first screen (finish X5 partial) | ⚠️ PARTIAL — lead skeleton PARITY built; Show-all+Open-full ONE row ✅; lead ghost Ask/Save icons ✅; Sports chrome ≤300 ✅ (230/288); lead dead-gap + breaking-top held CLS-limited (breaking-slot R2) |
| Y2 | one Lead look + flat scores bands + conformance catches band fill/shadow | ✅ PASS (committed `36940f0`) — conformance **FAILs sports-390** pre-fix → **0** after |
| Y3 | real-image proof (report blob, strict detection, fixture test) | ✅ PASS — `detect.test.mjs` 37/37; strict host+path shape; legit "default"-in-media-id renders; ?debug image report |
| Y4 | label-confirmation audit | ✅ AUDITED + **STOP** on mobile — desktop ~10% suppression; extending to phone Home = 64–78% (>20%) → NOT forced; options reported |
| Y5 | bundle diet (initial JS gzip ≤ +0.5% vs main) | ✅ PASS — **−0.61%** (180,995 B vs main 182,097 B): lazy-split the ?debug overlay off the initial chunk |
| Y6 | re-verify per category → matrix | ✅ `docs/verification/batch-Y-matrix.md` |
| Y7 | re-verify + report | ✅ this doc |

## BEFORE / AFTER

| metric | main `2f30633` (BEFORE) | branch (AFTER) |
|---|---|---|
| initial JS gzip (entry + preloaded react) | 182,097 B | **180,995 B** (**−0.61%**, ≤ +0.5% and a net DECREASE) |
| conformance violations (7 pages × 4 bands × light+dark) | 0 | **0** (ALL CONFORMANT) — Y2 added band fill/shadow + sticky-band checks |
| generic-card detection | substring "default"/"commercial" ANYWHERE (drops legit photos) | **exact host+path/filename shape** — a Guardian media id containing "default" renders; only real fallback cards drop |
| State of Play foot (phone) | "Show all N" and "Open full view" STACKED (2 rows) | **ONE row** (44px) |
| lead Ask/Save (the hero) | two bordered buttons | **ghost 16px icons** on the meta (44px hit via ::after); conformance unaffected |
| phone lead loading skeleton | 16:9 block only (~219px), 106px short of the card | **parity** — 16:9 media + ~91px deck/actions placeholder (~325px == card) |
| Sports chrome height @390×844 | — | **230px** (no team) / **288px** (team chips) — both ≤ 300 |
| mobile Home CLS (390/375) | max 0.0499 / 0.0477 (15 runs) | **max 0.0499 / 0.0489** (12 runs) — == main within the bimodal-spike noise (floor held at 360, see Y1) |

## Y1 — phone first screen (honest)

- **Skeleton parity (built).** The phone lead's loading skeleton (`.mh-lead-skel`) now mirrors the
  committed `SnapshotCard` lead: a 16:9 media block **and** a ~91px deck/actions placeholder, so the
  skeleton (~325px) matches the committed card (~325px) instead of being a bare 219px block.
- **Dead gap + breaking-top: HELD, CLS-limited (reported).** The dead gap below the lead (~35px) is
  the `min-height` floor (360) minus the card (~325). Dropping the floor DOES remove the gap, but it
  moves all content up, which **amplifies the pre-existing breaking-slot CLS spike** — the breaking
  strip's committed row count is load-timing dependent (which feeds have arrived at head-freeze), so a
  blind reserve can't match it, and the correct fix is the **atomic head reserve flagged R2 / out of
  scope** in the X report. Measured (15 runs, vs main 390 max 0.0499 / 375 0.0477): floor 344 → 390
  max **0.0538** (regression); floor 330 → **0.0541**. Per the spec's *"keep the smallest floor that
  meets CLS and report"* clause, the floor stays at **360** (CLS == main) and the gap/breaking-top
  targets (≤12px / ≤560px) are reported as breaking-R2-limited. Skeleton parity still improves the
  loading view and lets the floor drop for free once the breaking reserve is made atomic.
- **Lead ghost Ask/Save (done).** On the lead the actions are ghost 16px icons (`.snap-lead-act`,
  transparent, no box) on the meta foot, with a ≥44px tap target via a transparent `::after`. Distinct
  class from `.snap-ask`/`.snap-save`, so the one-look conformance gate (which checks those for a 1px
  border) stays 0 — a hero's inline icon actions are their own affordance.
- **Sports chrome ≤300px (met).** Measured at 390×844: 230px with no team selected (scores band +
  league row + My-Teams ribbon), 288px with a league's team chips. Both ≤ 300 at 390×844 and 390×664.
  Reported, not forced: merging the team chips INTO the league scroller as one row would shave ~50px
  more, but it requires threading `isMobile` into the Sports module and diverging the phone layout from
  the ≥641 index-grid (P5) — a responsive refactor out of proportion to an already-met target.
- **Show-all + Open-full ONE row (done).** `.sop-foot-actions` is now a single flex row (Show all N
  takes the remaining width, Open full view → is pinned right), a 44px row instead of two.

## Y3 — real-image proof

- **Strict detection (`src/modules/source-image/detect.js`).** The generic-card patterns were matching
  the bare substring `default`/`commercial`/`fallback` ANYWHERE in the URL, so a legitimate Guardian
  photo whose media id contains those letters was wrongly dropped. Now each pattern requires the token
  as a **dedicated path segment** (`…/commercial/…`, `…/fallback/…`, `…/default-card/…`) or the
  **filename stem** (`…/default.jpg`, `…/og-default.png`, `guardian-logo.png`). Pure logic, no JSX, so
  it unit-tests in Node.
- **Fixture test (`test/visual/detect.test.mjs`, 37/37).** Three legit Guardian URLs — including
  `…/media/8f3b2default9c0a/…/3000.jpg` ("default" inside the media id) — read **usable**; genuine
  fallback cards (`/commercial/default.jpg`, `/fallback/card.png`, `og-default.jpg`, `site-logo.png`)
  read **generic-card** with a matched pattern + the UNVERIFIED flag.
- **Copy-report blob (?debug=1).** `buildDeviceReport()` now includes an `images` section: the lead +
  first 6 image slots, each `{slot, verdict, host, pattern, src}`. Verdict ∈ usable / generic-card /
  blank-or-404 / empty / hidden, read from the `data-img-*` each card stamps so even a DROPPED slot
  reports WHY. `imagesNote` carries the **UNVERIFIED** caveat (the exact fallback-card shape is
  inferred, not confirmed against a live publisher response in-sandbox — no feed egress).
- **CB on iPad:** open any page with `?debug=1`, tap **Copy report** (bottom-left overlay), paste back;
  the `images` array shows each slot's src/host/verdict so a real blank can be identified by URL shape.

## Y4 — label-confirmation audit

Measured by recording every `labelConfirmed` decision under `?debug=1` (keyed by title) and tallying
suppressed labels vs the naive "always show the feed category" baseline, with a cross-topic tornado
story (a weather headline injected into a sports feed) as the acceptance probe.

| surface set | non-general labels | suppressed by kwMatch | % of non-general | overall vanished |
|---|---|---|---|---|
| desktop mixed (Top-of-hour + SoP, W1280) | 2 | 1 | 50% (n=2) | **10%** (1 of 10) |
| phone Home, mixed + sections (W390) | 18 | 11 | 61% | 55% |
| phone Home, mixed only (Top Stories + SoP, W390) | 9 | 7 | 78% | 64% |

**Decision — STOP (per spec).** Extending the desktop `labelConfirmed`/`kwMatch` rule to the phone
Home suppresses **64–78%** of category labels — far over the 20% stop threshold — because `kwMatch`
needs an exact `DEFAULT_KW` keyword hit that most genuine headlines lack (it cannot tell "genuinely
this category but no canned keyword" from "wrong category"; both miss the keyword). So the rule is
**not** forced onto the phone Home (reverted); the phone keeps the feed-category label.

**Tornado acceptance:** on the **desktop** mixed surfaces the tornado-from-a-sports-feed story is
`cat=sports, confirmed=false → no "Sports" label` (**PASS**, as shipped in X2b). On the **phone** it
would still read "Sports" — a known mislabel that a real content classifier (the proposal already
reported out-of-scope in Batch X) would fix; blanking 78% of phone labels to catch it is the wrong
trade, which is exactly what the >20% stop rule protects against. **Home share keeping a label**:
desktop 90% (unchanged); phone would drop to ~36% if the rule were applied — so it is not.

## Y5 — bundle diet

Initial JS gzip (entry chunk + preloaded `react`, the set in `index.html`): **main 182,097 B →
branch 180,995 B = −1,102 B (−0.61%)**. The Y1/Y2/Y3 additions cost ~+900 B; lazy-splitting the
`?debug=1` overlay + device-report builder (`src/modules/debug/overlay.jsx`, ~200 lines incl. the
Y3.1 image scan) off the initial chunk via `React.lazy` more than offset that — the overlay is a
separate ~4.4 KB-gzip chunk fetched only under `?debug=1`. Net: the branch is **smaller than main**,
well under the +0.5% ceiling (X shipped +0.90%). SW unchanged; total CSS not larger; page mounts 0.

## Gates (Chromium + Chromium touch, real fixtures)

| gate | result |
|---|---|
| conformance (7 pages × 4 bands × light+dark) | **0 violations — ALL CONFORMANT** |
| detect (generic-card detection, pure logic) | **37/37 PASS** |
| image-slots (0 generic / 0 blank / 0 empty indent) | **PASS** |
| text-overlap (10 widths × 6 pages × light+dark) | **0 overlaps / 120 cells** |
| fixed-overlap (no floating element over text; 1-tap chat) | **0 failures, 0 console errors** |
| contrast · empty-box · sop-up-front · sports-dedup · p5 · o7 hero · touch-mode · dedupe-label · layout-polish | **PASS** |
| initial JS gzip vs main | **−0.61%** (≤ +0.5%) |
| 0 api · 0 new setInterval · 0 new hex outside tokens.css · SW unchanged · check:tokens | **PASS** |

## What CB confirms on real devices
- **iPhone:** the State of Play card's "Show all" and "Open full view" sit on ONE row; the lead's
  Ask/Save are small ghost icons, not boxed buttons; the lead loads as a card-shaped skeleton (not a
  bare photo block). The ~35px gap below the lead and the breaking-strip position are unchanged from
  main (held for CLS — see Y1).
- **iPad:** Sports chrome (scores + league/team tabs) stays under one screen's worth before the feed.
- **Desktop:** every category still draws the one chip/tile/button/status look; no generic "THE
  GUARDIAN" watermark cards; a `?debug=1` → Copy report now lists each image slot's verdict.
