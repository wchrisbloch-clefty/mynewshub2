# V6 — stability diagnosis (two carried failing gates)

Time-boxed per the spec: Step 1 record the shifting nodes with measured shares; Step 2 fix what is
small and local, otherwise report a cause table. All measurements use the shared real-shape
fixtures with randomized load delays (`delayMax 200–800ms`), `?debug=1`'s `layout-shift`
PerformanceObserver and `window.__dbg`.

## Renders on scroll — RESOLVED to +0 (no fix needed)

The earlier "App renders on scroll +4" was a **measurement artifact**: the scroll was driven before
the fixture data had fully settled, so background data/timer commits landed inside the scroll
window and were miscounted as scroll-driven.

Control (desktop 1194, full 5s settle BEFORE scrolling):

| | App Δ | TopBar Δ |
|---|---|---|
| **with** a full 0→4000→0 scroll | **+0** | +2 |
| **without** scrolling (same window) | +0 | 0 |

App is **+0 on scroll**. The only thing that re-renders is `TopBar` (`dbgRender('TopBar')`,
App.jsx:8133), which owns `shrunk`/`hidden` and toggles the header shrink/hide — exactly what J2
isolated it to do, consumed only on the `.topbar-wrap` className (App.jsx:8347). App has no scroll
listener in its body. **Gate: PASS (+0), no change.**

## CLS — cause table (shares measured; fixes are not small/local)

### Energy desktop (1194): avg CLS 0.114 over 6 runs

| cause | evidence (share of total shift) | proposed fix | risk |
|---|---|---|---|
| Right-rail async modules stream in and resize each other | `.sidebar-section.pm-section` (Prediction Markets) + `.sd-section` (Sources) + `.social-block` + `.last-updated` = **~90%** combined across the top shift groups | reserve each module's loaded height (`min-height`, or `content-visibility:auto` + `contain-intrinsic-size`) so filling does not push the siblings below | **moderate** — the modules are collapsible / variable-height (prediction markets N rows, sources list N feeds); a fixed `min-height` large enough to stop the shift leaves a visible gap when the content is short (and would break the V4 ≤0.3% no-op). Needs per-module intrinsic sizing, not a one-line reserve. |

This rail CLS is **pre-existing** (≈0.096 on `main` before Batch U/V). V3's empty-box collapse removed
the 330px State-of-Play reserve that had been cushioning the rail top, nudging it to ~0.114; the
underlying shifter is the async modules, not the empty-box fix.

### Mobile Home (390): avg CLS 0.0056 over 6 runs (intermittent spikes to ~0.09 on ≈2/10 runs)

| cause | evidence | proposed fix | risk |
|---|---|---|---|
| The weather "Right Now" band area resizes and shoves `main` on some loads | `div.topbar-wx + main.hub-main` (**37%**) + its `::after` reserve (**50%**) | size `.topbar-wx-reserve` to the band's real rendered height so the band never grows past its reserve | **low–moderate** — the band's height varies with how many cities/forecast chips arrive; the current 26px reserve matches the common case (hence 0.0056 average) but not every fixture permutation. A taller reserve removes the spike but adds idle whitespace on the common case. |

The **average** mobile-Home CLS (0.0056) is already under 0.01; it is the occasional permutation
that spikes. Both this and the desktop rail are the kind of async-content reservation that the spec
says to report rather than force, since the small/local version (a single fixed `min-height`) trades
one defect (shift) for another (a gap / idle whitespace) and would fail the V4 pixel no-op.

## Fix shipped — restore the State-of-Play reserve (Home desktop CLS regression)

The V7 re-verify caught a real regression V3 introduced: `.sidebar-sop:empty{display:none}` collapsed
the wrapper whenever State of Play was momentarily empty. On pages where State of Play **fills after
load** (Home), the wrapper went empty→collapsed→full during the load window, shifting the rail —
Home desktop CLS went from **0.045 (main, PASS) to 0.094 (FAIL)**.

Fix (small/local): drop the `display:none` collapse; the empty wrapper keeps its reserved 330px
slot (the Q4 anti-CLS reserve) but stays **borderless** — a quiet reserved space, never a bordered
empty box. The empty-box detector still passes (it flags only bordered empties), and the slot no
longer flips during load.

Re-measured, desktop 1194, 10 runs:

| page | main | Batch V |
|---|---|---|
| Home | 0.045 (PASS) | **0.0435 (PASS — restored)** |
| Energy | 0.110 (FAIL, pre-existing) | 0.112 (FAIL, ≈ main — not regressed) |

## Outcome
- renders-on-scroll: **+0 — PASS** (artifact corrected).
- Home desktop CLS: **regression found and fixed** (0.094 → 0.0435, back to main's level).
- Energy desktop CLS: **pre-existing failure** (main 0.110), unchanged by Batch V — the async
  rail-module reservation in the cause table above is the real fix and is out of this batch's scope.
- No gate weakened; the empty **bordered box** stays gone (detector green).
