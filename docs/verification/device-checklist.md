# MyNewsHub2 — device verification checklist

Twelve quick checks across **phone**, **iPad** and **desktop**. Open the app with `?debug=1`
(e.g. `https…/?debug=1`) so the small diagnostics overlay shows at the bottom-left. Each step
says what "good" looks like. At the end, tap **Copy report** in the overlay and paste the blob
back to Claude — that one JSON captures viewport/DPR/UA, renders, CLS, scroll jumps, long frames,
coverage, header height, controls under 44px, recent network, and the build id.

## Phone (hold it normally, portrait)
1. **Home loads without jumping.** Watch the first screen fill in. Nothing should shove down after
   it appears. _Good: `CLS` in the overlay stays ≤ 0.05 (ideally ~0)._
2. **Scroll Home top-to-bottom once.** The page scrolls smoothly; the lead, Top Stories, breaking,
   each category section and Houston are all present. _Good: `App renders` does **not** climb while
   you scroll (steady number, `0/s`); `scroll jumps` stays 0._
3. **Slide a thumb sideways across the bottom bar** a few times (don't tap a tab — slide across it).
   _Good: nothing navigates; `swipe navs` stays **0**._
4. **Diagonal thumb-arc scroll** (the natural curved scroll) on Home. _Good: it scrolls, the page
   does **not** switch category; `swipe navs` stays 0, `swipe ignored` ticks up._
5. **Open a category (tap Business), then flick left/right deliberately.** _Good: a clean fast
   horizontal flick moves one category; a slow or diagonal drag does not._
6. **Every control is thumb-sized.** Tap the Save and ⋯ on a story, the Read link, the bottom tabs.
   _Good: nothing is awkwardly tiny; overlay `long frames` stays low (taps feel instant)._

## iPad (portrait and landscape)
7. **Rotate portrait → landscape on Home.** _Good: no horizontal scrollbar, no clipped headlines,
   the right rail appears in landscape; `CLS` stays ≤ 0.05._
8. **State of Play / breaking is near the top** at landscape widths (not buried below the fold).
9. **Header holds still as scores/weather load.** Watch the top band on Home. _Good: the header
   height does not jump when the scores strip or weather fills in._

## Desktop (resize the window wide → narrow)
10. **Drag the window from very wide (~1920) down to ~1024.** _Good: no horizontal overflow at any
    width; the rail stays put or re-centers; nothing overlaps the header._
11. **Light ↔ dark** (toggle in the header / More). _Good: text stays readable on every surface in
    both themes; no white flash when it loads or when you switch tabs._
12. **Leave the tab idle ~2 minutes.** _Good: the overlay's `network (60s)` shows no repeating
    polling to the same path; nothing refetches on its own._

---

**Then: tap `Copy report` and paste it to Claude.** Expected-good ranges at a glance:
`CLS ≤ 0.05`, `App renders` steady while scrolling, `scroll jumps 0`, `swipe navs 0` after a bar
slide, `controls under 44` ≈ 0 on touch (the market ticker is the known exception), `long frames`
low, and `network (60s)` with no repeated same-path polling.

---

## Batch O — real-device defects (iPad Safari ~1194, iPhone 390) + the AetherHub look

These are the things CB saw on real hardware that emulation missed. Automated coverage:
`node test/visual/text-overlap.test.mjs` (no text overlaps, 10 widths × 5 pages × light/dark),
`sports-dedup.test.mjs` (one story once per Sports page), `o7-hero-contrast.test.mjs`
(hero white text ≥4.5:1 over any photo) and `p5-sports-index.test.mjs` (Sports index tiles).

13. **iPad right rail — no overlapping text (O1/P2).** At ~1194 wide, scroll the rail (State of
    Play, Across, Trending, Sources). _Good: every row is a light-bordered card in normal flow;
    headlines never sit on top of the next module's text; no ~40px dead gap inside a row._
14. **Phone Live Scores sit at the TOP (O2).** On phone Home the scores band is the first thing
    under the header (≤64px, hidden when no games); there is no second scores block mid-page.
15. **Chat button never covers a headline (O3).** Scroll down on phone/narrow — the launcher tucks
    away while scrolling down and returns at the top / on scroll-up / when you stop.
16. **Sports shows one story once (O4).** No headline repeats across the hero, the 3-up grid, the
    list and the rail. Every image slot shows a photo or a labelled placeholder — never a blank box.
17. **No stuck tap-tint; slim feed rows (O5).** Tapping a card on touch leaves no grey tint behind;
    time · source · Ask · Save sit on one line; rows are tighter than before.
18. **Market ticker shows whole items (O6).** The top ticker never clips an item mid-word; the
    header height does not change.
19. **Hero headline stays legible (O7).** White source + headline over the lead photo pass AA over
    even a bright image; the phone lead photo is full-bleed edge-to-edge.
20. **Phone first screen is tight (O8).** The "Right Now" weather band is one line (≤32px); the hero
    headline top is reachable without much scrolling.
21. **Category colour + typography (P1/P3).** Each category reads in its own muted slate/earth label
    colour; dense list rows + the rail + Voices use the sans, while the serif stays on the hero,
    Top Stories and section leads. Check both light and dark.
22. **Nav active state (P4).** The current section is a filled navy pill with legible text (not just
    an underline); a thin divider separates the primary tabs from the More group (≥641).
23. **Sports index tiles (P5).** At ≥641 the league row is a wrapping grid of outlined tiles with
    live counts ("NFL 12"); 0-count leagues are hidden; the selected tile is the filled navy pill;
    no horizontal scroll at ≥820. Phone keeps the scrollable chips.
24. **Honest source status + skeletons (P6).** The Sources rail reads `Sources · N/M live · K still
    loading` (the "still loading" clause disappears once everything resolves); loading placeholders
    are light-bordered cards at the row height, so nothing jumps when content swaps in.

---

## Batch S — root-cause touch fixes + the "State of Play up front / crisp white" polish

These passed in Chromium **touch emulation** (`test/visual/touch-mode.test.mjs`); real iPad/iPhone
Safari is **NEEDS-DEVICE**. Open with `?debug=1`.

25. **iPad header bands line up (S1/S2).** At ~1194 landscape the MARKETS label, the ticker values
    and the RIGHT NOW weather share one centre; no band bleeds into the one above/below; the ticker
    shows whole items only.
26. **State of Play rows are tight (S1/S3/S11).** No dead gap between a headline and its meta line;
    every row is its own lightly-boxed row with no number and the same left edge; cluster rows
    ("N sources") match.
27. **No breaking red dot (S10).** Breaking rows show the red "BREAKING" word only.
28. **State of Play is up front (S4).** On phone Home: breaking under the lead, then Top Stories,
    then the State of Play card. On Sports/Energy it sits near the top, not the last block.
29. **Chat launcher shows at rest (S6).** Visible at load on Home (iPad + iPhone); it tucks away
    only while you scroll down and comes back at the top / on scroll-up / when you stop.
30. **Phone weather never clips (S5a).** "HOUSTON 69° Clear" shows in full on the one-line band; the
    other city is in the expand.
31. **Phone hero is edge-to-edge (S5b).** The lead photo reaches both screen edges — no sliver.
32. **Sports scores strip clears the chip bar (S5c).** The sticky strip sits fully below the chip
    bar; the first team row of each card is visible.
33. **Crisp white + topic labels (S12/S13).** Light mode is white with hairline dividers; every
    Home headline carries its topic (ENERGY / SPORTS / …) in its colour at the head of the meta
    line. Dark mode looks exactly as before.

---

## Batch T — finish "State of Play up front"

Chromium touch emulation; real iPad/iPhone Safari = NEEDS-DEVICE. Open with `?debug=1`.

34. **Breaking strip under the Home lead (T1).** When there's breaking news, up to 3 one-line rows
    sit right under the lead (red BREAKING + headline + age); tapping a row opens the story; the
    same stories don't repeat in the State of Play card below.
35. **"Show all" on the State of Play card (T2).** The card shows 3 rows; "Show all N" expands the
    rest in place (nothing above moves); it's collapsed again next time you open Home.
36. **Full State of Play view (T3).** "Open full view" on the card, or "State of Play" in the More
    sheet, opens a single-column page with State of Play, Connections, Trending, Prediction Markets
    and Sources; browser Back returns you to where you were.
37. **State of Play is populated on Sports (T4).** On the Sports page (and Energy/Business/Health),
    the State of Play card near the top shows real rows (not an empty box) and never repeats a story
    that's also in the lead/grid/list.

---

## Batch U — one visual system (quiet category treatment, type floor, token guardrails)

Chromium + Chromium-touch emulation (isMobile/hasTouch; `(hover:none)` true); real iPad/iPhone
Safari = NEEDS-DEVICE. Open with `?debug=1`. The living reference is at `/design` (URL only).

38. **Sub-topic chips are text-only (U3).** Energy / Pop-culture / Sports-league chips show the
    word alone — no icon, 1px border, transparent, pill shape; the selected chip is the one accent
    fill. One line flips them back: `SHOW_CHIP_ICONS = true` in `src/modules/cat-icon`.
39. **Category colour only on the label (U3).** Source names read in neutral grey; the category
    colour appears only on the small uppercase topic label (and on the hero photo it is white, not
    a dark colour on a dark image). No source name is category-coloured.
40. **Header speaks one button language (U4).** Search / refresh / theme / profile are borderless
    quiet icons (44px touch target); Analyze and Customize share ONE bordered-transparent secondary
    style; the only filled element in the header is the active nav pill (Customize lost its navy).
41. **Rail has no box-in-box; one status pill (U5).** State of Play is a header + boxed rows on the
    page (no outer card); every row shares one headline weight and breaking is only the red word;
    the "N unavailable" pill is a plain bordered pill with amber text (no peach fill); "Updated"
    has no dot.
42. **No text below 11px (U6).** Every reading text is ≥ 11px on Home / Energy / Sports / Business /
    Briefing / State-of-Play at 390 / 820 / 1194 (light + dark). Smallest labels read cleanly.
43. **Living /design page (U7).** Visit `/design` (not linked anywhere): live colour swatches with
    contrast, type roles, spacing, radii, the real labels / chips / buttons / State-of-Play rows /
    pills / skeleton. It mirrors production because it renders the real tokens and components.

---

## Batch V — close out Batch U (phone parity, pills, empty box, debt, dark proof)

Chromium + Chromium-touch; real iPad/iPhone Safari = NEEDS-DEVICE.

44. **Phone header is quiet too (V1).** On iPhone the three header icons (markets toggle, Analyze,
    refresh) are borderless 20px glyphs with a 44px tap target — the same quiet language as the
    desktop header (U4 only reached >=641 before).
45. **Topic-filter pills match the chips (V2).** The "Filter by topic" pills are 1px-border,
    transparent, pill-shaped, neutral text; selected is the one accent fill. No category colour on
    any pill — category colour now lives only on the small TopicLabel.
46. **No empty box in the rail (V3).** When State of Play has nothing to show it collapses
    completely; there is no bordered empty rectangle at the top of the right rail.
47. **Dark mode reads cleanly (V5).** Borderless header icons are visible on the dark header; the
    "N unavailable" pill is amber text on a plain border; selected chips/pills keep >=4.5:1; the
    hero's topic label is white over the photo. Before/after dark screenshots at 390/834/1194 for
    Home/Energy/Sports/State-of-Play live under docs/verification/batch-V/.
48. **Scroll and load are stable (V6).** Scrolling re-renders only the header (App +0 on scroll).
    Home desktop CLS stays under the gate; the deeper Energy-rail CLS (async prediction-markets /
    sources / social modules) is pre-existing (fails on main too) and is documented, not hidden.
