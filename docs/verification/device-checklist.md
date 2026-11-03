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
