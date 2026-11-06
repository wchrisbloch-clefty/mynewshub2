# Batch W — last visual close-out (dark legibility, two CLS shifts, token names)

**CASE:** `git fetch --all` + PR list — **PR #85 (Batch V) is MERGED** (squash `b8c505d` on `main`).
Branched `claude/vigilant-gates-D9cTB` **fresh from `main`**, one commit per item W1–W5, **draft PR,
DO NOT MERGE**. Sandbox has no feed egress, so all content is the test harness's real-shape fixtures.
No WebKit in the sandbox → real-device Safari = **NEEDS-DEVICE**. Chromium desktop + Chromium touch
emulation (`isMobile/hasTouch` → `(hover:none)` true) throughout.

## Item status

| item | what | result |
|---|---|---|
| W1 | dark-mode legibility sweep + reusable contrast scanner | ✅ **PASS** — 0 failures / 7,209 leaves (main: 249) |
| W2 | Energy desktop CLS — reserve the rail module floors | ⚠️ **PARTIAL** — 1024/1100 PASS; 1180–1440 improved (~0.099→~0.064) but still > 0.05; residual is the pre-existing main-column cascade (cause table below) |
| W3 | mobile Home weather band + the ~0.09 spike | ⚠️ **PARTIAL (near-pass)** — the ~0.09 spikes are **eliminated**; worst run 0.015, avg 0.006; a 0.010–0.015 residual on ~2/10 is pre-freeze breaking reselection |
| W4 | rename the junk-drawer tokens (value no-op) | ✅ **PASS** — built-bundle hex multiset byte-identical; `check:tokens` green |
| W5 | re-verify + report | ✅ this doc |

## BEFORE / AFTER CLS (real fixtures, randomized 200–800 ms delays, 10 runs/config)

| config | cap | main (BEFORE) max / avg | W (AFTER) max / avg | verdict |
|---|---|---|---|---|
| Energy 1024 | 0.05 | (rail cascade, pre-existing) | **0.017 / 0.014** | ✅ PASS |
| Energy 1100 | 0.05 | (rail cascade, pre-existing) | **0.014 / 0.013** | ✅ PASS |
| Energy 1180 | 0.05 | ~0.10 | 0.079 / 0.064 | ❌ improved, still > cap |
| Energy 1194 | 0.05 | **0.138 / 0.099** | **0.070 / 0.064** | ❌ improved ~35%, still > cap |
| Energy 1280 | 0.05 | ~0.10 | 0.111 / 0.059 | ❌ improved, still > cap |
| Energy 1440 | 0.05 | ~0.10 | 0.077 / 0.063 | ❌ improved, still > cap |
| Home 1194 | 0.05 | 0.043 / 0.028 | **0.047 / 0.031** | ✅ PASS (held) |
| Home 390 | 0.01 | **0.096 / 0.018** (spikes ~2/10) | **0.015 / 0.006** (spikes gone) | ❌ by 0.005 on ~2/10, spikes eliminated |
| Home 375 | 0.01 | **0.091 / 0.025** (spikes ~2/10) | **0.013 / 0.006** (spikes gone) | ❌ by 0.003 on ~1/10, spikes eliminated |

The headline wins: Energy 1194 worst-case **0.138 → 0.070**, phone-Home worst-case **0.096 → 0.015**.
No config ends weaker than main (Home 1194 holds PASS).

## W1 — the contrast scanner, failing then passing

New reusable gate `test/visual/contrast.test.mjs` (dark + light; every text leaf vs its first opaque
ancestor background; on-image text deferred to O7; fails < 4.5:1, 3:1 for ≥24px / ≥19px bold). Home,
Energy, Sports, Business, Briefing, State of Play at 390/820/1194, both themes.

**On `main` (BEFORE) — 249 failures / 7,206 leaves.** The dark-mode defects (sample):
```
[energy 1194 dark] <.social-handle> "@BloomEnergy"  1.14:1 (need 4.5) fg=rgb(0, 0, 0)       bg=rgb(20, 20, 22)
[energy 1194 dark] <.social-handle> "Bloom Energy"  3.24:1 (need 4.5) fg=rgb(10, 102, 194)  bg=rgb(20, 20, 22)
[energy 1194 dark] <.social-handle> "@bloomenergy"  4.24:1 (need 4.5) fg=rgb(225, 48, 108)  bg=rgb(20, 20, 22)
[sports 1194 dark] <.logo-tag> "Your daily briefin" 1.95:1 (need 4.5) fg=rgb(68, 70, 77)    bg=rgb(20, 20, 22)
[energy 1194 dark] <.social-plat-count> "4"         4.36:1 (need 4.5) fg=rgb(126, 128, 136) bg=rgb(27, 27, 31)
[briefing 1194 dark] <.briefing-src-pill> "Axios …" 4.36:1 (need 4.5) fg=rgb(126, 128, 136) bg=rgb(27, 27, 31)
[sop 1194 dark] <.sop-page-source-n> "19"           4.36:1 (need 4.5) fg=rgb(126, 128, 136) bg=rgb(27, 27, 31)
...
CONTRAST SCANNER — 7206 text leaves scanned, 249 failures
```

**On the W branch (AFTER) — 0 failures / 7,209 leaves:**
```
CONTRAST SCANNER — 7209 text leaves scanned, 0 failures
ALL PASS
```

Every fix is a token edit, listed:
- `.social-handle` drops its inline brand colour (`var(--ink)`=#000 for X, blue for LinkedIn, pink for
  IG) as TEXT — the brand colour stays on the ICON badge only; the handle pill is `--text2` on
  `--surface` with the chip border.
- `.logo-tag` `--text4 → --text3` (1.95:1 → AA).
- `.chip-more.active` `--on-media → --on-accent` (white on the accent pill).
- `--text3` nudged light `#6b6e75 → #64676e`, dark `#7e8088 → #868892`, so every meta label
  (`social-plat-count`, `briefing-src-pill`, `sop-page-source-n`) clears 4.5:1 on `--surface2`.

## W2 — Energy desktop cause table (the wide-width residual)

Shift attribution at 1194 (summed CLS share across 8 runs), after the W2 `.sb-across` reserve:

| shifter | where | share | status |
|---|---|---|---|
| `.social-block` | **main column** (`.feed-col`), bottom — appears at 201px when social data loads | ~0.13 | pre-existing |
| `.last-updated` | **main column**, top of `.page-header-row` — appears at 22px and shoves the whole column | ~0.13 | pre-existing |
| `.sb-across-cat` rows | rail — move as the modules above them (PM / Sources) resolve | ~0.14 | reserved container (520px); children ride the modules above |

The dominant Energy shifters are in the **main column** (the "updated" line at the very top and the
Social Follows block at the bottom), not the rail. Reserving them is exactly what **V6 already tried
and reverted** because it *backfired* (a `.social-block` min-height + `.page-header-row` min-height
took Energy CLS **0.066 → 0.086**): the blocks are variable-height, so a fixed floor trades the shift
for idle whitespace on the common case and breaks the pixel no-op. Per the spec's "do not add idle
whitespace — report rather than force" rule, the W2 commit ships the one clean, safe reserve
(`.sb-across`, the single dominant rail shifter — it took the rail from ~0.11 to ~0.065 and makes
1024/1100 pass) and this cause table documents the rest. It is pre-existing (main ~0.10) and no width
ends weaker than main.

## W3 — mobile Home: the spike is gone

Diagnosis (per-node, real fixtures): the ~0.09 phone-Home spikes were **not** the weather band and
**not** Top Stories (both stable). They were (1) the **breaking slot toggling in/out of the DOM** — it
rendered only when it had items, so the streaming breaking row count (1→3→2, and a transient empty
landing just after `generalLoaded` flipped) collapsed the slot and refilled it; and (2) the weather
band reserve being **1px short** (26px vs the band's real 27px).

Fix (O1 floors, no empty→full flip): the breaking slot is now **always in the flow** on the phone Home
at a fixed 108px floor (3 rows max), filling with rows or sitting as a borderless empty reserve — it
never toggles, so row-count churn (even across a subtree remount) can't resize it. The band reserve is
sized to 27px (≤32px, O8). Top Stories floor raised 330→356px to its real loaded height.

Result: **the ~0.09 spikes are eliminated** — 390/375 worst run 0.015 (was ~0.096), avg 0.0056. The
small residual (0.010–0.015 on ~2/10 runs) is the breaking **item reselection** before the head
freezes (the held-list / atomic-feed-commit class the spec says to report, not force — the same R2
work batch-V flagged). Hero top unchanged; header block ±0; empty-box green; Home desktop CLS holds.

## W4 — rename + shade tables

Full old→new rename table and the V4 "close-shade" merge tables live in
**`docs/verification/batch-W-tokens.md`**. The 8 junk-drawer tokens become role names
(`--ink→--black`, `--c-gray→--gray-mid`, `--c-gray-line→--line-muted`, `--pink→--accent-pink`,
`--brown→--accent-brown`, `--navy-2→--accent-deep`, `--chat-fg→--chat-text`, `--chat-bg→--chat-surface`;
28 uses, no alias). Proven a true value no-op: the built-bundle hex value multiset (104 distinct
values across all dist assets) is **byte-identical** before and after the rename.

## Gates (Chromium + Chromium-touch, real fixtures)

| gate | result |
|---|---|
| unit tests (11 modules) | **11/11 PASS** |
| contrast scanner (6 pages × 390/820/1194 × light+dark) | **0 failures / 7,209 leaves** (main: 249) |
| touch-mode harness (`(hover:none)` true) | **ALL PASS** |
| text-overlap (10 widths × 6 pages × light+dark) | **0 overlaps** |
| empty-box detector | **ALL PASS** (the always-present breaking reserve is borderless) |
| sports-dedup · P5 sports-index · O7 hero-contrast · SoP-up-front | **ALL PASS** |
| renders-on-scroll (App) | **+0** (TopBar +2, owns shrink/hide; FeedPage +0 = page mounts 0) |
| Home desktop CLS 1194 (10 runs) | **0.047 PASS** |
| mobile Home CLS 390/375 (10 runs) | spikes eliminated; worst 0.015, avg 0.006 (cap 0.01 missed by ≤0.005 on ~2/10) |
| Energy desktop CLS 1024/1100 (10 runs) | **PASS** (≤0.017); 1180–1440 improved but > cap (cause table) |
| initial JS gzip vs main | **+0.08%** (180,148 vs 180,001 B; ≤ +1%) |
| 0 `api/` files touched · 0 new `setInterval` · SW unchanged · `check:tokens` green | **PASS** |

## Screenshots

Before (`main`) / after (`W`), **dark mode**, real fixtures, 390 & 1194 for Home and Energy:
`docs/verification/batch-W/{home,energy}-{390,1194}-dark-{main,W}.jpg`. The Energy-1194-dark pair is
the headline: the X/Twitter handles (`@BloomEnergy`, `@UtilityDive`, `@POWERmagazine`, `@DCDnews`) go
from near-black-on-black (unreadable) to readable grey, LinkedIn handles from low-contrast blue to
grey, while the platform badges keep their brand colour.

## Skipped / not fully met, and why

- **Real-device Safari — NEEDS-DEVICE.** No WebKit in the sandbox; all runs are Chromium + Chromium
  touch emulation.
- **W2 Energy 1180–1440 ≤ 0.05 (10/10) — not met.** Improved ~0.099→~0.064; the residual is the
  pre-existing main-column cascade that V6 proved backfires when force-reserved. Reported, not forced.
- **W3 mobile ≤ 0.01 (10/10) — missed by ≤0.005 on ~2/10.** The dominant ~0.09 spikes are gone; the
  residual is pre-freeze breaking reselection (held-list / R2 work), reported not forced.

## What CB confirms on iPhone / iPad (real Safari)
1. **Social follows are readable in dark** — every handle is light-grey text on the dark tile; only the
   round platform badge (𝕏 / in / IG / ▶) keeps its brand colour. Nothing is black-on-black.
2. **The Energy page stops jumping while it loads** at iPad/narrow-desktop widths; on a wide desktop it
   still settles a little as the "updated" line and the Social Follows block fill in (documented).
3. **The phone top stays still** — the weather band and the breaking strip no longer shove the lead or
   the sections as they load; no sudden jump a second after opening Home.

---

## Addendum — W6 & W7 (booth follow-ups)

Two follow-ups that fix the real causes W3/W2 had masked with permanent reserves, instead of the
reserves themselves.

### W6 — phone Home breaking slot (fix the churn, drop the floor)

W3 had masked the ~0.09 spike with a permanent 108px breaking floor (idle whitespace when nothing
was breaking). W6 undoes that and fixes the source.

**Cause (measured, with selector):** `lastUpdated.general` ticks 2–3 times within ~1s as the general
feed commits in passes. Each tick ran `useEffect(() => setFrozenHead(null), [refreshKey])`, re-picking
the held head AFTER it first froze. Because the reserve is only up while `!generalLoaded`, that
re-pick flipped the variable-height breaking slot **0→N once the reserve was gone** and shoved the
page. Selector: `.mh-breaking` / `.mh-brk-row`, value `model.breaking ← head.breaking`.

**Fix:** coalesce the initial-load refreshKey burst (a change within 2.5s of the previous one, while
the head is already frozen, no longer re-picks; a genuine later refresh still does). Breaking
collapses to 0px when there is nothing breaking (Batch T); the slot is reserved only while General is
still loading (`.mh-breaking` min-height 108→0; the borderless `.mh-breaking-reserve` shows only while
`!generalLoaded`). Weather band reserve stays 27px.

**Result:** the named ~0.09 churn spike is gone. Mobile Home CLS (10 runs): **390** max 0.050 / avg
0.023; **375** max 0.048 / avg 0.018. The residual (~0.05 on ~30% of runs) is the inherent
"breaking is cross-category and lags general" handoff (reserve→section when breaking isn't ready by
`generalLoaded`), not churn — half of main's 0.096, reported per the acceptance (report 10/10).

**356px Top Stories floor, re-justified at 390×844 and 375×667:** hero headline top (283 / 275 px) and
the gap above Top Stories (22 px) are byte-identical to main; first-Top-Story visibility matches main
(visible at 390, below the fold at 375 in both). The floor reserves height INSIDE the section (below
the first row), so it never pushes the hero or first story down. renders-on-scroll App **+0**.

### W7 — Energy rail "Across MyNewsHub" (floor only while loading)

W2 gave `.sb-across` a permanent 520px floor and rendered the container even when empty — idle
whitespace (loaded content is ~416px at ≤1100) and, during empty-load, a bordered box showing only
its header.

**Fix:** the floor applies only while the module's source categories are loading (`acrossLoading` =
any across-cat in `loading`), sized to the real loaded height per width band (416px ≤1100, 530px
≥1160, measured) so dropping it never shrinks the box. If it resolves empty it renders nothing; the
brief loading-empty window is held by a borderless `.sb-across-reserve`.

**Empty-box detector extended:** besides an empty bordered box, it now flags a bordered box whose only
text is its own header, while excluding genuinely collapsed sections (an `aria-expanded` toggle is
content behind a toggle). Verified: FLAGS a synthetic header-only "Across MyNewsHub" box (332×60);
PASSES on the real rail (collapsed Prediction Markets / Sources / Trending are not false-flagged).

**Energy desktop CLS, before (W6 permanent floor) → after (W7), 10 runs (max / avg):**

| width | before max/avg | after max/avg | verdict |
|---|---|---|---|
| 1024 | 0.017 / 0.013 | 0.017 / 0.014 | ✅ PASS |
| 1100 | 0.014 / 0.013 | 0.028 / 0.015 | ✅ PASS |
| 1180 | 0.073 / 0.063 | 0.099 / 0.064 | ❌ (pre-existing main-column cascade) |
| 1194 | 0.111 / 0.070 | 0.111 / 0.063 | ❌ (pre-existing) |
| 1280 | 0.073 / 0.057 | 0.074 / 0.054 | ❌ (pre-existing) |
| 1440 | 0.077 / 0.063 | 0.118 / 0.073 | ❌ (pre-existing) |

Averages are within run-to-run noise; 1024/1100 hold PASS. The wide-width failures are unchanged in
character — the main-column cascade (the "updated" line + Social Follows block), not the rail. No gate
weakened (empty-box / contrast / text-overlap / touch-mode / sports-dedup / P5 / hero / SoP / unit all
PASS; renders-on-scroll App +0; `check:tokens` green; initial JS gzip unchanged).
