# Batch O + AetherHub addendum — verification report

Branch `claude/batch-o` (off `main` after #79/#80). One draft PR, one commit per item
(O0…O9, P1…P6). **DO NOT MERGE** — this is a review/verification PR.

Batch O fixes defects CB saw on real hardware (iPad Safari ~1194, iPhone 390) that desktop
emulation missed; the AetherHub addendum (P1–P6) layers the "AetherHub look" on top. Every
result below is labelled **PASS** / **MOCKED** / **NEEDS-DEVICE**. WebKit/Safari is unavailable
in this container, so every Safari-specific check is **NEEDS-DEVICE** (not faked); all automated
runs are Chromium.

## Automated tests (all Chromium, real-shape fixtures via Playwright route interception)

| Test | What it proves | Result |
|---|---|---|
| `test/visual/text-overlap.test.mjs` | no text leaf overlaps >1px (10 widths × 5 pages × light/dark), rail allow-listed to hero/badges/chat | **PASS — 0 overlaps** |
| `test/visual/sports-dedup.test.mjs` | one story once per Sports page (hero/grid/list) + rail disjoint + no blank image box | **PASS** (fails on pre-O4: 1 dup) |
| `test/visual/o7-hero-contrast.test.mjs` | hero white text ≥4.5:1 over a pure-white photo (pixel-sampled), light+dark | **PASS** (fails on baseline: 1.88 / 1.12) |
| `test/visual/p5-sports-index.test.mjs` | Sports index tiles: grid + no h-scroll ≥820, counts shown, 0-count hidden, selected filled; phone keeps chips | **PASS** |
| `src/modules/stable-list/heldList.test.mjs` | held-selection stability (R2) | **PASS** |

### O0 — the test gap, closed first (own commit, before any fix)
- Built real-shape fixtures (`test/visual/realfix.mjs`): 2–3-line headlines at rail width, source
  clusters ("N sources"), missing-image rows, Prediction Markets, a 12-game score strip.
- The generic overlap test **failed on the rail before O1** (37 overlaps, 32 in the rail) and
  **passes after** (0 rail). The Sports dedup + hero-contrast tests each **fail on the pre-fix
  code and pass after** (proofs captured in those commits).

## Batch O items

- **O1/P2 — iPad right-rail text overlap.** Root cause was `flex-shrink` on items inside the
  sticky `overflow-y:auto` rail shrinking them below content; reserved space is now a
  `min-height` floor, modules stack in normal flow as light-bordered cards, SoP rows lost the
  ~40px dead gap. Overlap test: 0 rail overlaps. **PASS.**
- **O2 — phone Live Scores at the top.** Scores band is the first scrolling-header band on phone
  (≤64px, hidden when no games); the mid-page block is gone. CLS 0.005. **PASS.**
- **O3 — chat launcher never covers text.** Ref-based hide-while-scrolling-down / reveal at
  top·scroll-up·idle, gated to touch/narrow, no `setInterval`. **PASS** (overlap test allow-lists
  the launcher; manual real-device = NEEDS-DEVICE).
- **O4 — Sports one story once.** Title-key dedup across lead/grid/list; grid and list made
  disjoint; rail excludes exactly the shown keys. Single branded placeholder, never a blank box.
  **PASS** (proven fail→pass).
- **O5 — stuck tap-tint + slim rows.** `:hover` wrapped in `@media(hover:hover)`; a touch reset
  block clears lingering tints; the action row is one line with 32px-visual / 44px-hit buttons.
  **PASS** (the 44px box that bled into the next headline was removed — see overlap fix below).
- **O6 — iPad ticker clipped mid-item.** Ref-based fit hides from the first clipped item onward
  (ResizeObserver + MutationObserver, no `setInterval`); header height unchanged. **PASS**
  (Chromium; real iPad Safari = NEEDS-DEVICE).
- **O7 — hero legibility.** Scrim strengthened to hold white ≥4.5:1 across the whole text band
  over a pure-white photo (pixel-sampled 9.00:1 headline / 5.92:1 source); phone lead full-bleed.
  **PASS** (fails on baseline 1.88 / 1.12).
- **O8 — phone first screen.** "Right Now" weather band compacted to one line (≤32px reserve).
  **PASS.**
- **Overlap fix (O0 re-run).** The P3 overlap re-run surfaced one remaining text collision: the
  global M5 touch rule forced the `.snap-ask/.snap-save` *box* to 44px, overflowing a short
  standard row and bleeding the "Ask" button 3px into the next section's headline on phone. Fixed
  by dropping the 44px *box* min-height (the O5 `::after` already gives a ≥44px tap target); kept
  `min-width:44px`. Overlap test now 0.

## AetherHub addendum (P1–P6)

- **P1 — category colour system (tokens only).** One `--cat-X-text` (≥4.5:1) + `--cat-X-bar`
  (≥3:1) pair per category, light + dark, muted slate/earth. Contrast table below — all pass.
- **P2 — one row anatomy (with O1).** Light-bordered rail cards (1px border, 8px radius, 12–14px
  padding, normal flow, min-height floors); grid `[number][content]`, headline + one meta line.
- **P3 — typography + category colour.** Dense surfaces (standard feed rows `.fc-title`/
  `.snap-title`, rail SoP, Voices) use the sans at medium weight; serif stays on the hero,
  Top Stories lead, Sports hero and the lead card. Each category's identity colour (`cc.color`)
  now points at its `--cat-*-text` token, colouring existing labels/eyebrows with no new elements;
  the brand navy `--accent` stays on nav/buttons/links/focus.
- **P4 — nav active state.** The active section is a filled brand-navy rounded pill with its tuned
  on-accent ink (≥4.5:1), not an underline; hover tint under `@media(hover:hover)`; a thin vertical
  divider separates the primary tabs from the More group (≥641).
- **P5 — Sports index tiles.** ≥641 the league row is a wrapping grid of equal outlined tiles with
  live counts ("NFL 12"); 0-count leagues hidden (except selected); selected = filled navy; no
  horizontal scroll ≥820. Phone keeps the scrollable chips. Also closes O4(d) rhythm. **PASS.**
- **P6 — honest status + skeletons.** The Sources rail reads `Sources · N/M live · K still loading`
  (the clause drops once everything resolves); loading placeholders are light-bordered cards at a
  row-matching min-height. **PASS.**

### P1 contrast table (computed; text vs `--surface`, bar vs `--surface`)

| | light text | light bar | dark text | dark bar |
|---|---|---|---|---|
| requirement | ≥4.5 | ≥3 | ≥4.5 | ≥3 |
| **minimum across all 10 categories** | **6.08** | **4.25** | **7.59** | **5.29** |

Every category passes in both themes (general 6.59/5.14, business 6.92/4.95, finance 6.34/4.69,
bloom 6.08/4.47, tech 7.22/5.43, sports 6.99/4.99, health 6.35/4.60, popculture 7.26/5.17,
comedy 6.40/4.48, local 6.19/4.25 in light; all higher in dark).

## Hard constraints (vs `main`)

- **0** new/changed files under `api/`.
- **0** new `setInterval` / polling added (O3/O6 use refs + ResizeObserver/MutationObserver).
- **0** new hex colours outside `src/styles/tokens.css`.
- Service worker **unchanged**.
- Desktop ≥1281 geometry changes only in rail borders/anatomy (P2), nav active state (P4) and the
  Sports index tiles (P5); fonts swapped at identical size/line-height/clamp so row boxes are
  unchanged.

## Bundle (gzip) — measured JS+CSS total, each tree built with its own config

| build | JS+CSS gzip | vs main |
|---|---|---|
| `main` (post #79/#80) | 255,497 B | — |
| Batch O before the P3–P6 tail (HEAD @ O7) | 266,100 B | +4.15% |
| **Batch O final (P1–P6)** | **267,446 B** | **+4.68%** |

- **P-addendum sub-gate — PASS.** The P3–P6 tail adds **+1,346 B = +0.51%** over the pre-tail
  Batch-O build, within the "≤+1% over Batch O alone" gate (P3–P6 are CSS tokens + a small
  per-league counts memo + a status string + font/colour token swaps — no meaningful JS).
- **Whole-batch vs main — OVER the +2% target (+4.68%).** This is the full Batch O (O1–O8 runtime
  code + the visual system living in the in-JS `GLOBAL_CSS` string), not the P-addendum. It is
  reported here honestly rather than hidden: the ~+12 KB gzip buys the real-device fixes (chat
  scroll-reveal, ticker fit, sports dedup/counts, section-state, the rail card anatomy and the
  AetherHub look). Because this is a **DO-NOT-MERGE review PR**, CB can weigh that cost; if the
  +2% ceiling is firm, the next pass can move `GLOBAL_CSS` out of the JS bundle into a real
  stylesheet (a structural win independent of this batch).

## Safari / real device

WebKit is unavailable in the container, so iPad/iPhone Safari behaviour (O3 scroll reveal, O6
ticker fit, touch tints) is **NEEDS-DEVICE** — the device checklist (`device-checklist.md`,
steps 13–24) is the manual pass for CB on real hardware.
