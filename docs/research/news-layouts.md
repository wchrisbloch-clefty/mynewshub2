# K0 — News layout research (ESPN, NBC, CNN, Fox, Bloomberg, Yahoo)

## Reachability (honest)

Direct page fetches were attempted with the sandbox's WebFetch on each site's
public homepage. **All six returned DNS `ENOTFOUND` — the sandbox cannot reach
them directly.** Per the batch rule I did **not** work around this with
curl/mirrors/caches. So for **direct observation of the live pages: NOT REACHED
for all six.**

| site | URL attempted | direct fetch |
|---|---|---|
| ESPN | https://www.espn.com | **NOT REACHED** (ENOTFOUND) |
| NBC News | https://www.nbcnews.com | **NOT REACHED** (ENOTFOUND) |
| CNN | https://www.cnn.com | **NOT REACHED** (ENOTFOUND) |
| Fox News | https://www.foxnews.com | **NOT REACHED** (ENOTFOUND) |
| Bloomberg | https://www.bloomberg.com | **NOT REACHED** (ENOTFOUND) |
| Yahoo News | https://news.yahoo.com | **NOT REACHED** (ENOTFOUND) |

Because **most (all) sites are unreachable for direct observation**, the batch
rule says to finish K1–K7 as written and tell you so you can attach screenshots.
That is what I did. The design decisions below are therefore driven by (a) the
K-spec defaults and (b) **secondary public design write-ups found via WebSearch**
(allowed) — clearly labelled as write-ups, **not** as live observation.

## Secondary sources actually retrieved (WebSearch write-ups)

- CNN homepage change (newscaststudio, 2015) — lead moved from left to **right**,
  **headline overlaid on the bottom of the lead photo**; secondary headline
  "scrapes" on the left with a smaller photo below the main one.
- Bloomberg (design critique, undated) — homepage is **rectangular, modular**;
  **lacks a traditional single "lead"**; modules reorder by publication time.
- Reuters redesign review (contextly) — dropped the **right-rail "river of
  stories"** in favour of a **wide single story column**.
- Washington Post / Nine (INMA) — **modular content units** (1–4 story layouts)
  with a **consistent labelling system**, editors reshuffle modules.
- ESPN 2015 relaunch (newscaststudio; Wikipedia "ESPN BottomLine") — a
  **horizontal top strip** that **stays visible on desktop** and doubles as
  **nav + score ticker**, scrolls sideways; the TV "BottomLine" ticker uses a
  **push-then-scroll** format (one item fully in view before scrolling).
- UI lists best practice (gov.sg design system; Uxcel; WashU theme guide) —
  in LTR lists put the **thumbnail on the LEFT**; use a **consistent aspect
  ratio** for every row's image (3:2 suggested, 16:9 standard for articles) so
  repeated cards align; prioritise headline + image + one snippet; small list
  thumbnails are fine.

(These are historical / secondary and may not match the sites' current live
layout; treated as directional, not authoritative.)

## Pattern → who → adopt/reject → where

| pattern | who (write-up) | adopt? | where in K1–K7 |
|---|---|---|---|
| Top strip doubles as nav + scores, stays visible on desktop | ESPN (2015) | **Adapt** — keep the order scores→markets→nav, but only the **nav** stays pinned (slimmer, calmer than ESPN's full strip); scores/markets scroll away | K1 |
| Ticker "push-then-scroll", last item whole | ESPN BottomLine | **Adopt** — clip the ticker inside its own area with a fade; last visible item not cut | K1 |
| Homepage has **no single traditional lead**; modular | Bloomberg | **Adopt** — General drops the duplicate hero card; the Top Stories block is the one hero; article becomes a normal row (not dropped) | K2 |
| Lead = photo with **headline overlaid**, secondary headlines as text beside it | CNN (2015) | **Adopt** — Top Stories = one 16:9 hero with 2–3 text-only headlines under it, 3 compact rows to the right | K4 |
| **Thumbnail on the LEFT**, consistent aspect ratio, repeated rows align | gov.sg / Uxcel / WashU | **Adopt** — STANDARD row: image LEFT, fixed ratio reserved with `aspect-ratio`, text-only row keeps the same min-height | K6 |
| Consistent image ratio avoids "mixed sizes" choppiness | WashU / RSS guides | **Adopt** — exactly three row types (LEAD 16:9, STANDARD 4:3 left-thumb, COMPACT text) | K6 |
| Drop the right-rail "river"; fewer, calmer modules | Reuters | **Adopt** — rail = State of Play → Connections → Briefing(only if exists) → collapsed Following/Trending/Prediction/Sources | K5 |
| Modular units, consistent labels, reshuffle | WaPo / Nine | **Adopt** — one shared band header style; interleaved modules become full-width bands at fixed positions | K6 |
| Modules reorder by publish time (no hierarchy) | Bloomberg | **Reject** — we keep an editorial order (State of Play first); time-ordering loses our "what's driving the day" signal | K5 |

## Changes to K1–K7 from the research

The research **confirms** the K-spec; no structural changes. Two refinements it
strengthens:

1. **K6 image ratio:** write-ups suggest 3:2 or 16:9 for consistency. The spec's
   STANDARD thumb is **112×84 = 4:3**, which is still a single consistent ratio
   (the point the research actually makes — *one* ratio, not *which*). Kept 4:3
   per the spec; the LEAD is 16:9 as the research's "article standard".
2. **K1 ticker:** adopt ESPN's "last item whole" explicitly (fade + no mid-item
   clip), which the spec already asks for.

**Action for you:** since direct observation was blocked, if you can attach
screenshots of the six homepages (or confirm the adopt column), I'll fold any
live-layout corrections into K1/K4/K6 before finalising.
