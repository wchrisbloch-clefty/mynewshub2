// Y5: the HEAVY, ?debug=1-only part of the debug module — the on-screen overlay and the device-report
// blob builder. It is split out of ./index so it can be code-split: index.jsx lazy-imports this file
// only when DEBUG is on, so NONE of this (nor the Y3.1 image-report scan) ships in the initial chunk
// that every normal pageview downloads. The light counters (DEBUG, dbg, dbgRender…) stay in ./index,
// eagerly loaded, because they are called synchronously in render paths.
import { useEffect, useRef, useState } from 'react';
import { dbg } from './index';

// Build id, replaced at build time (vite define); 'dev' under `vite dev`.
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';

// N6: assemble ONE device-report blob for CB to copy from the ?debug=1 overlay and paste back.
// Pure read of what's already measured + a few on-demand DOM reads; no new timers, no network.
export function buildDeviceReport() {
  const r = { build: BUILD_ID, t: new Date().toISOString() };
  try {
    r.viewport = { w: window.innerWidth, h: window.innerHeight, dpr: +(window.devicePixelRatio || 1).toFixed(2) };
    r.ua = navigator.userAgent;
    r.appRenders = dbg.renders.App || 0;
    r.pageRenders = { ...dbg.renders }; delete r.pageRenders.App;
    r.pageMounts = { ...dbg.mounts };
    r.cls = +(dbg.cls || 0).toFixed(4);
    r.scrollJumps = dbg.scrollJumps;
    r.longFrames = dbg.longFrames;
    r.swipe = { navs: dbg.swipeNavs, ignored: dbg.swipeIgnored, reasons: { ...dbg.swipeReasons } };
    r.coverage = (typeof window !== 'undefined' && window.__dbg && window.__dbg.coverage) || null;
    const main = document.querySelector('.hub-main');
    r.headerHeight = main ? Math.round(main.getBoundingClientRect().top + window.scrollY) : null;
    // controls smaller than 44px in either dimension (ticker items excluded — known exception).
    let under = 0;
    for (const el of document.querySelectorAll('button,a,[role=button],input,select')) {
      if (el.closest && el.closest('.ss-ticker')) continue;
      const rc = el.getBoundingClientRect(); const s = getComputedStyle(el);
      if (rc.width > 0 && rc.height > 0 && s.display !== 'none' && (rc.height < 44 || rc.width < 44)) under++;
    }
    r.controlsUnder44 = under;
    // network requests in the last 60s, grouped by path (resource timings; no fetch wrapping).
    const now = performance.now ? performance.now() : 0;
    const net = {};
    try {
      for (const e of performance.getEntriesByType('resource')) {
        if (e.startTime < now - 60000) continue;
        let path; try { path = new URL(e.name).pathname; } catch { path = e.name; }
        net[path] = (net[path] || 0) + 1;
      }
    } catch { /* resource timing unsupported */ }
    r.network60s = net;
    // Y3.1: IMAGE SLOTS — the lead + the first 6 image slots, each with src, host, verdict and the
    // matched generic-card pattern. Verdict: usable / generic-card / blank-or-404 / empty / hidden.
    // Read from the data-img-* the cards stamp (SnapshotCard), so even a DROPPED slot (no <img>
    // rendered) still reports WHY. No network is issued — this only inspects the live DOM.
    try {
      const host = u => { try { return new URL(u, location.href).host; } catch { return ''; } };
      const seen = new Set();
      const nodes = [];
      const lead = document.querySelector('.snap-lead[data-img-src], .mh-lead .snap-card[data-img-src]');
      if (lead) { nodes.push(lead); seen.add(lead); }
      for (const el of document.querySelectorAll('.snap-card[data-img-src]')) {
        if (seen.has(el)) continue; seen.add(el); nodes.push(el);
        if (nodes.length >= 7) break;
      }
      let unverifiedSeen = false;
      r.images = nodes.slice(0, 7).map((el, i) => {
        const src = el.getAttribute('data-img-src') || '';
        const img = el.querySelector('img.snap-hero-img, img.snap-thumb');
        let verdict = el.getAttribute('data-img-state') || 'empty';
        // Confirm the runtime load state from the live <img> where one is present.
        if (img && verdict === 'usable' && img.complete && img.naturalWidth === 0) verdict = 'blank-or-404';
        const unver = el.getAttribute('data-img-unverified') === '1';
        if (unver) unverifiedSeen = true;
        return { slot: i === 0 ? 'lead' : `row${i}`, verdict, host: host(src),
          pattern: el.getAttribute('data-img-pattern') || null, unverified: unver || undefined,
          src: src.length > 120 ? src.slice(0, 120) + '…' : src };
      });
      r.imagesNote = unverifiedSeen
        ? 'UNVERIFIED: generic-card matches are inferred from URL shape; not confirmed against a live publisher response in-sandbox (no feed egress).'
        : 'no generic-card match among these slots';
    } catch (e) { r.imagesError = String(e); }
  } catch (e) { r.error = String(e); }
  return r;
}
// This module loads only under ?debug=1 (lazy). Expose the report builder for headless checks
// (the Y3.1 image-report verification) so a test can read the same blob the Copy button produces.
if (typeof window !== 'undefined') window.__buildDeviceReport = buildDeviceReport;

export default function DebugOverlayInner() {
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

    // N6: main-thread long frames (>50ms) — jank the reader feels.
    let lpo;
    try { lpo = new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.duration > 50) dbg.longFrames++; });
      lpo.observe({ type: 'longtask', buffered: true }); } catch { /* longtask unsupported */ }

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
      try { lpo && lpo.disconnect(); } catch { /* noop */ }
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
      clearInterval(iv);
    };
  }, []);

  const [copied, setCopied] = useState(false);
  const copyReport = () => {
    const blob = JSON.stringify(buildDeviceReport(), null, 2);
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(blob).then(done, () => fallback(blob, done)); }
      else fallback(blob, done);
    } catch { fallback(blob, done); }
  };
  const fallback = (text, done) => {
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
    catch { /* eslint-disable-next-line no-console */ console.log('[debug] device report:\n' + text); done(); }
  };

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
      <div style={{ color: 'var(--on-media)', fontWeight: 700, marginBottom: 4 }}>?debug — scroll/render</div>
      {row('App renders', `${dbg.renders.App || 0} (${perSec.current.App || 0}/s)`)}
      {row('SportsPage', `${dbg.renders.SportsPage || 0} (${perSec.current.SportsPage || 0}/s)`)}
      {row('SportsPage mounts', `${dbg.mounts.SportsPage || 0}`)}
      {row('poll fires', dbg.pollFires)}
      {row('CLS', dbg.cls.toFixed(4))}
      {row('scroll jumps', `${dbg.scrollJumps}${dbg.lastJump ? ` (last ${dbg.lastJump}px)` : ''}`)}
      {row('swipe navs', dbg.swipeNavs)}
      {row('swipe ignored', `${dbg.swipeIgnored}${Object.keys(dbg.swipeReasons).length ? ' (' + Object.entries(dbg.swipeReasons).map(([k, v]) => `${k}:${v}`).join(' ') + ')' : ''}`)}
      {row('long frames', dbg.longFrames)}
      {/* N6: one-tap device report → clipboard, for CB to paste back. pointerEvents re-enabled
          on the button only (the overlay itself stays click-through). */}
      <button onClick={copyReport} style={{
        pointerEvents: 'auto', marginTop: 6, width: '100%', cursor: 'pointer',
        background: copied ? 'rgba(0,160,0,0.9)' : 'rgba(0,70,40,0.9)', color: 'inherit', border: '1px solid currentColor',
        borderRadius: 5, font: 'inherit', fontWeight: 700, padding: '5px 8px',
      }}>{copied ? '✓ copied — paste to Claude' : 'Copy report'}</button>
    </div>
  );
}
