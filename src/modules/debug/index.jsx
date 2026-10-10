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
import { useEffect, useRef, useState } from 'react';

export const DEBUG = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('debug') === '1';

// Mutable counters. Cheap plain object; only the overlay reads them.
// J1: `mounts`/`unmounts` track page-component MOUNT/UNMOUNT (a remount = +1 each),
// so the scroll test can prove a page is NOT being remounted on every App render.
export const dbg = { renders: {}, mounts: {}, unmounts: {}, pollFires: 0, cls: 0, scrollJumps: 0, lastJump: 0 };
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

export function DebugOverlay() {
  if (!DEBUG) return null;
  return <DebugOverlayInner />;
}

function DebugOverlayInner() {
  const [, force] = useState(0);
  const prevRenders = useRef({});
  const perSec = useRef({});
  const touchingUntil = useRef(0);
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    // Layout shift (CLS) — the real "things jump around" signal.
    let po;
    try {
      po = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) {
            dbg.cls += e.value;
            // eslint-disable-next-line no-console
            console.log(`[debug] layout-shift +${e.value.toFixed(4)} (CLS ${dbg.cls.toFixed(4)})`);
          }
        }
      });
      po.observe({ type: 'layout-shift', buffered: true });
    } catch { /* layout-shift unsupported */ }

    // A scrollY jump >40px that did NOT happen during/just-after a touch is the twitch.
    const onTouch = () => { touchingUntil.current = Date.now() + 350; };
    const onScroll = () => {
      const y = window.scrollY;
      const dy = Math.abs(y - lastScrollY.current);
      if (dy > 40 && Date.now() > touchingUntil.current) {
        dbg.scrollJumps++; dbg.lastJump = Math.round(dy);
        // eslint-disable-next-line no-console
        console.log(`[debug] scrollY JUMP ${Math.round(dy)}px (not touch-driven) — total ${dbg.scrollJumps}`);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // 1s tick: compute renders/sec and repaint the overlay.
    const iv = setInterval(() => {
      for (const k of Object.keys(dbg.renders)) {
        perSec.current[k] = (dbg.renders[k] || 0) - (prevRenders.current[k] || 0);
        prevRenders.current[k] = dbg.renders[k] || 0;
      }
      force(n => n + 1);
    }, 1000);

    return () => {
      try { po && po.disconnect(); } catch { /* noop */ }
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
      clearInterval(iv);
    };
  }, []);

  const row = (k, v) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ opacity: 0.7 }}>{k}</span><strong>{v}</strong>
    </div>
  );
  return (
    <div style={{
      position: 'fixed', left: 8, bottom: 8, zIndex: 99999, pointerEvents: 'none',
      background: 'rgba(0,0,0,0.82)', color: '#0f0', font: '11px/1.5 ui-monospace,monospace',
      padding: '8px 10px', borderRadius: 8, minWidth: 190, maxWidth: '70vw',
    }}>
      <div style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>?debug — scroll/render</div>
      {row('App renders', `${dbg.renders.App || 0} (${perSec.current.App || 0}/s)`)}
      {row('SportsPage', `${dbg.renders.SportsPage || 0} (${perSec.current.SportsPage || 0}/s)`)}
      {row('SportsPage mounts', `${dbg.mounts.SportsPage || 0}`)}
      {row('poll fires', dbg.pollFires)}
      {row('CLS', dbg.cls.toFixed(4))}
      {row('scroll jumps', `${dbg.scrollJumps}${dbg.lastJump ? ` (last ${dbg.lastJump}px)` : ''}`)}
    </div>
  );
}
