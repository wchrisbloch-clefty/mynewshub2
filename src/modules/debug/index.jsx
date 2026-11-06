// src/modules/debug — ?debug=1 diagnostics for the mobile Sports scroll/twitch hunt
// (D8). EVERYTHING here is a no-op when the flag is off: the counters guard on DEBUG,
// and the overlay renders null, so there is zero cost in normal use.
//
// What it records, live:
//   • layout-shift   — cumulative CLS via PerformanceObserver('layout-shift')
//   • scroll jumps   — scrollY deltas >40px NOT caused by a touch (the suspected twitch)
//   • render counts  — App / SportsPage renders, and renders-per-second
//   • poll fires     — each time a polling effect actually fires (e.g. live scores)
//
// Turn it on by visiting any page with ?debug=1 and read the overlay (bottom-left),
// or the console ([debug] …). CB: confirm the numbers on a real phone.
import { lazy, Suspense } from 'react';

export const DEBUG = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('debug') === '1';

// Mutable counters. Cheap plain object; only the overlay reads them.
// J1: `mounts`/`unmounts` track page-component MOUNT/UNMOUNT (a remount = +1 each),
// so the scroll test can prove a page is NOT being remounted on every App render.
export const dbg = { renders: {}, mounts: {}, unmounts: {}, pollFires: 0, cls: 0, scrollJumps: 0, lastJump: 0,
  // M4: swipe navigations that actually fired vs. gestures ignored (by reason). CB reads these on
  // the phone: after sliding a thumb across the bottom bar / scrolling, "swipe navs" should stay 0.
  swipeNavs: 0, swipeIgnored: 0, swipeReasons: {},
  // N6: main-thread long frames (>50ms) via PerformanceObserver('longtask').
  longFrames: 0 };

// H5: expose the debug counters on window under ?debug=1 so the Sports-twitch
// measurement (App/SportsPage renders/s, CLS, scroll jumps) can read them headlessly.
if (DEBUG && typeof window !== 'undefined') window.__dbg = dbg;

export function dbgRender(name) { if (!DEBUG) return; dbg.renders[name] = (dbg.renders[name] || 0) + 1; }
// J1: call from a page's mount effect: useEffect(() => dbgMount('SportsPage'), []).
// Increments mounts now and unmounts on cleanup — a stable component mounts once per
// visit; a remount-on-every-render shows mounts climbing with App renders.
export function dbgMount(name) {
  if (!DEBUG) return () => {};
  dbg.mounts[name] = (dbg.mounts[name] || 0) + 1;
  return () => { dbg.unmounts[name] = (dbg.unmounts[name] || 0) + 1; };
}
export function dbgPoll(name) {
  if (!DEBUG) return;
  dbg.pollFires++;
  // eslint-disable-next-line no-console
  console.log(`[debug] poll fire: ${name} (total ${dbg.pollFires})`);
}
// M4: record each completed swipe gesture — a real category navigation, or an ignore + why.
export function dbgSwipe(fire, reason) {
  if (!DEBUG) return;
  if (fire) { dbg.swipeNavs++; }
  else { dbg.swipeIgnored++; dbg.swipeReasons[reason] = (dbg.swipeReasons[reason] || 0) + 1; }
  // eslint-disable-next-line no-console
  console.log(`[debug] swipe ${fire ? 'NAV ' + fire : 'ignored (' + reason + ')'} — navs ${dbg.swipeNavs} / ignored ${dbg.swipeIgnored}`);
}

// Y5: the overlay UI + device-report builder (incl. the Y3.1 image-slot scan) are ~200 lines used
// ONLY under ?debug=1. They now live in ./overlay and are code-split via React.lazy, so that whole
// chunk is fetched on demand (only when DEBUG is on) and never ships in the initial bundle that every
// normal pageview downloads. In normal use DebugOverlay returns null before any import is triggered.
const DebugOverlayInner = lazy(() => import('./overlay.jsx'));
export function DebugOverlay() {
  if (!DEBUG) return null;
  return <Suspense fallback={null}><DebugOverlayInner /></Suspense>;
}
