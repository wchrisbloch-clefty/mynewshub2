# U3 — one quiet category treatment: contrast + verification

Batch U, item U3. The category identity now lives in ONE place — the `TopicLabel` component
(`src/modules/topic-tag`) — and never on a source name, a button, or body text. Icons on
sub-topic chips are OFF (`SHOW_CHIP_ICONS = false`, `src/modules/cat-icon`), so a chip row is one
quiet word per chip. Verified against the built bundle with Playmaker + `getComputedStyle`
(scripts in the session scratchpad; synthetic-DOM probe so the result is data-independent).

## What changed
- **Chips are text-only.** Energy (`EN_SUBTABS`), Pop-culture (`PC_SUBTABS`) and Sports league
  (`SPORT_TABS`) chips drop their lucide icon, gated behind one flag `SHOW_CHIP_ICONS=false`.
  One `CatIcon` wrapper (lucide, 16px, strokeWidth 1.5, `currentColor`) is the single icon
  treatment for when any category icon does render.
- **Source names are neutral.** `.fc-source` lost its inline `color:cc.color` and now computes to
  `--text3` (the meta colour) — category colour is no longer painted on a source name.
- **One active-chip colour.** The hardcoded Pop-culture pink (`#db2777`) active chip is gone;
  Energy and Pop-culture chips share the single brand `--accent` when active.
- **Hero lead label reads on the photo.** The Top Stories hero sits over a dark scrim, so its
  `TopicLabel` switches to `--on-media` (white) via `onMedia`, instead of the dark category
  colour (which was low-contrast there). Off-photo labels keep the category colour.
- **Label consumes tokens**: `--fs-label` (11px), `--fw-semibold` (600), `--tracking-label`
  (0.06em → 0.66px computed).

## Contrast of `--cat-*-text` labels (WCAG AA floor 4.5:1 for text)
Measured computed colour of a rendered `.topic-tag` against `--surface`, both themes. All pass;
**no token needed darkening.**

| category    | light on #ffffff | dark on #141416 |
|-------------|------------------|-----------------|
| general     | 6.59:1 | 8.53:1 |
| business    | 6.92:1 | 8.29:1 |
| finance     | 6.34:1 | 9.06:1 |
| bloom       | 6.08:1 | 8.43:1 |
| tech        | 7.22:1 | 7.59:1 |
| sports      | 6.99:1 | 7.72:1 |
| health      | 6.35:1 | 8.95:1 |
| popculture  | 7.26:1 | 7.79:1 |
| comedy      | 6.40:1 | 9.23:1 |
| local       | 6.19:1 | 8.97:1 |
| **min**     | **6.08:1** | **7.59:1** |

On-media variant: computed `rgb(255,255,255)` — full-opacity white over the photo scrim.

## Assertions (built bundle)
- **0 chip icons** rendered inside `.pc-subtab` / `.sport-tab` on Energy (6 chips), Pop-culture
  (5), Sports (16) — all 0 SVGs.
- **source neutral**: `.fc-source` computes to `--text3` in light and dark (= no category colour
  on a source name).
- **44px target**: `.pc-subtab` is 44.0px tall at 390.
- All 10 category labels ≥ 4.5:1 in both themes (table above).

`check:tokens` after U3: hex 64, inline-style 245 (−1 vs U2 baseline; re-baselined this commit),
font-size 26 / <11 = 5, radius 13, `!important` 20 — PASSED.
