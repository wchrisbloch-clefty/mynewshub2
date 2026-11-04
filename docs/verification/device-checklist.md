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
