// ─── MOBILE SECTIONED HOME (Batch M, M1) ──────────────────────────────────────
// The phone Home (<=640px, General, no active filter/search). A single scannable column:
//   LEAD 16:9 → "Top stories" (4 compact cross-category headlines) → Breaking / State of
//   Play → live scores strip → CATEGORY SECTIONS (3 rows each) → Houston Local → footer.
//
// COVERAGE GUARANTEE: one shared used-keys set spans the lead, top stories, breaking and
// every section, so a story shows at most ONCE on the whole Home; a section whose top
// story was already shown promotes the next, so dedupe never empties it. Every enabled
// category is accounted for (shown, or hidden only when it has 0 usable stories — logged
// under ?debug=1). Promo/satire filtering keeps applying (items arrive promo-clean from
// loadCat; satire is stripped from breaking upstream).
//
// PERF: the first 2 sections load eagerly; the rest fetch only when near the viewport
// (IntersectionObserver, rootMargin 600px), each with a reserved-height skeleton so
// content swapping in never shifts the page.
//
// Desktop/iPad are untouched: App renders this ONLY when isMobile && Home. New code lives
// here, not in App.jsx (beyond the one-line wiring). Data arrives via the `ctx` pattern.
import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { SnapshotCard } from '../snapshot-card';
import { StateOfPlay } from '../state-of-play';
import { SectionSkeleton, SectionError } from '../section-state';
import { isPromoItem } from '../breaking';
import './mobile-home.css';

// Section order + labels. There is no user category-order setting in the app today, so
// this mirrors the fixed chip order (News is the Home top, so it is not a section);
// Business absorbs Markets (finance) on mobile; Comedy is last and only when it has stories.
const SECTIONS = [
  { cat: 'business', label: 'Business & Markets', extra: ['finance'] },
  { cat: 'bloom', label: 'Energy' },
  { cat: 'tech', label: 'AI & Tech' },
  { cat: 'sports', label: 'Sports' },
  { cat: 'health', label: 'Health' },
  { cat: 'popculture', label: 'Pop Culture' },
  { cat: 'comedy', label: 'Comedy' },
];
const EAGER = 2;               // first N sections load eagerly
const TOP_ORDER = ['general', 'business', 'finance', 'bloom', 'tech', 'sports', 'health', 'popculture'];

function SeeAll({ label, onClick }) {
  return (
    <button className="mh-seeall" type="button" onClick={onClick} aria-label={`See all ${label}`}>
      See all
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}

// COMPACT row — text-only headline + source · time (the K6 COMPACT type). No image.
function CompactRow({ a, fmtDate, onRead }) {
  return (
    <button className="mh-compact" type="button" onClick={() => onRead(a)}>
      <span className="mh-compact-title">{a.title}</span>
      <span className="mh-compact-meta">{a.source} · {fmtDate(a.pubDate)}</span>
    </button>
  );
}

// One category section: lazy-loads its feed when near the viewport, then renders a header
// + up to 3 rows (first STANDARD with a left thumbnail if it has an image, rest COMPACT).
function CategorySection({ s, ctx, eager, onNear }) {
  const { loading, lastUpdated, feeds, feedHealth, CATS, fmtDate, onRead, onSave, isSavedFn, setChatContext, opinionLabel, navigate, loadCat } = ctx;
  const ref = useRef(null);
  const firedRef = useRef(false);
  const fire = () => { if (firedRef.current) return; firedRef.current = true; onNear(); };
  useEffect(() => {
    if (eager) { fire(); return; }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { fire(); return; }
    const io = new IntersectionObserver(ents => { if (ents.some(e => e.isIntersecting)) { fire(); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cats = [s.cat, ...(s.extra || [])];
  const items = s.items;
  const isLoading = cats.some(c => loading[c]);
  const everLoaded = cats.some(c => lastUpdated && lastUpdated[c] != null);
  // Distinguish a genuinely EMPTY feed (reachable, HTTP 200, 0 items → hide the section)
  // from a transport FAILURE (no response / 0 / >=400 → show the retry row). loadCat stores
  // feedHealth[name] = { code, ok } per source.
  const anyTransportFail = cats.some(c => (feeds[c] || []).filter(f => f.on).some(f => {
    const h = feedHealth[f.name]; return h && !h.ok && (h.code === 0 || h.code >= 400);
  }));
  const failed = everLoaded && !items.length && anyTransportFail;

  let body;
  if (items.length) {
    body = (
      <div className="mh-rows">
        {items.map((a, i) => i === 0
          ? <SnapshotCard key={a.link || i} a={a} meta={CATS[s.cat] || {}} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate} opinionLabel={opinionLabel(a)} lead={false}/>
          : <CompactRow key={a.link || i} a={a} fmtDate={fmtDate} onRead={onRead}/>)}
      </div>
    );
  } else if (failed) {
    body = <SectionError label={s.label} onRetry={() => cats.forEach(c => loadCat(c))}/>;
  } else {
    // loading OR not-yet-requested: a reserved-height skeleton (no layout shift).
    body = <SectionSkeleton rows={3} label={s.label}/>;
  }

  // Hidden (requested, done, genuinely empty, not failed): render nothing but keep the
  // observed node so the reason is logged once in debug (handled by the parent model).
  const hidden = everLoaded && !isLoading && !items.length && !failed;
  if (hidden) return <div ref={ref} className="mh-section mh-section-hidden" data-cat={s.cat} aria-hidden="true"/>;

  return (
    <section ref={ref} className="mh-section" data-cat={s.cat}>
      <div className="mh-sec-head">
        <span className="eyebrow mh-sec-label">{s.label}</span>
        <SeeAll label={s.label} onClick={() => navigate(s.cat)}/>
      </div>
      {body}
    </section>
  );
}

export function MobileHome({ ctx }) {
  const { arts, breakingItems, loadCat, loading, lastUpdated, onRead, onSave, isSavedFn,
    setChatContext, navigate, openCustomize, favTeams, CATS, storyKey, fmtDate, opinionLabel,
    HOUSTON_SOURCES, ActiveScoresBar, DEBUG } = ctx;

  // Lazy-load bookkeeping: which section cats have had loadCat fired.
  const requestedRef = useRef(new Set());
  const [, forceReq] = useState(0);
  const requestCat = (cats) => {
    let changed = false;
    for (const c of cats) if (!requestedRef.current.has(c)) { requestedRef.current.add(c); if (!(arts[c] && arts[c].length) && !loading[c]) loadCat(c); changed = true; }
    if (changed) forceReq(n => n + 1);
  };
  // General is needed immediately for the lead + top stories; fetch once if empty.
  useEffect(() => {
    if (!requestedRef.current.has('general')) { requestedRef.current.add('general'); if (!(arts.general && arts.general.length) && !loading.general) loadCat('general'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The one shared model: lead → top stories → breaking → sections → Houston, all deduped
  // against a single used-keys set (COVERAGE GUARANTEE). Recomputes as feeds fill in.
    // R2: above-the-fold selection (lead + top + breaking). Computed live here, then FROZEN once
    // the first full render settles (see frozenHead below), so slow feeds streaming in don't
    // re-pick/reorder the lead or the Top Stories rows and shove the page — they flow into the
    // category sections instead, and the head is re-picked on the next refresh. Mirrors the
    // desktop held-list (App.useHeldList / modules/stable-list).
  const liveHead = useMemo(() => {
    const used = new Set();
    const clean = c => (arts[c] || []).filter(a => a && a.title && a.link && !isPromoItem(a));
    const general = clean('general');
    const lead = general.find(a => a.img) || general[0] || null;
    if (lead) used.add(storyKey(lead));
    const top = [];
    for (const c of TOP_ORDER) { const it = clean(c).find(a => !used.has(storyKey(a))); if (it) { top.push(it); used.add(storyKey(it)); } if (top.length >= 4) break; }
    if (top.length < 4) for (const c of TOP_ORDER) { for (const a of clean(c)) { if (top.length >= 4) break; if (!used.has(storyKey(a))) { top.push(a); used.add(storyKey(a)); } } if (top.length >= 4) break; }
    const breaking = (breakingItems || []).filter(b => !used.has(storyKey(b))).slice(0, 3);
    return { lead, top, breaking };
  }, [arts, breakingItems]);
    // Freeze the head once General has loaded AND Top Stories is full (4) — or nothing in the
    // TOP_ORDER set is still loading (thin data). Re-pick on refresh (lastUpdated.general change).
  const refreshKey = (lastUpdated && lastUpdated.general != null) ? lastUpdated.general : 0;
  const [frozenHead, setFrozenHead] = useState(null);
  useEffect(() => { setFrozenHead(null); }, [refreshKey]);
  useEffect(() => {
    if (!refreshKey || frozenHead) return;
    const settled = !TOP_ORDER.some(c => loading && loading[c]);
    if (liveHead.top.length >= 4 || (liveHead.top.length > 0 && settled)) setFrozenHead(liveHead);
  }, [refreshKey, liveHead, frozenHead, loading]);
  const committed = !!frozenHead;
  const head = frozenHead || liveHead;

  const model = useMemo(() => {
    const used = new Set();
    const clean = c => (arts[c] || []).filter(a => a && a.title && a.link && !isPromoItem(a));
    const cov = {};  // ?debug coverage: per cat { found, shown, filtered, breaking }

    const general = clean('general');
    cov.general = { found: (arts.general || []).length, filtered: (arts.general || []).length - general.length, shown: 0, breaking: 0 };

    // Head (held): lead + top + breaking seed the shared used-keys set, exactly as before —
    // the coverage guarantee (one story shown at most once) is preserved because the sections
    // below dedupe against this same set.
    const { lead, top, breaking } = head;
    if (lead) used.add(storyKey(lead));
    top.forEach(t => used.add(storyKey(t)));
    breaking.forEach(b => { used.add(storyKey(b)); const c = b.cat || 'general'; cov[c] = cov[c] || { found: 0, filtered: 0, shown: 0, breaking: 0 }; cov[c].breaking++; });

    // SECTIONS — each shows up to 3 not-yet-used stories (promote past duplicates).
    const sections = SECTIONS.map(s => {
      const cats = [s.cat, ...(s.extra || [])];
      const raw = cats.flatMap(c => arts[c] || []);
      const src = raw.filter(a => a && a.title && a.link && !isPromoItem(a));
      const seen = new Set(); const items = [];
      for (const a of src) { const k = storyKey(a); if (used.has(k) || seen.has(k)) continue; seen.add(k); items.push(a); if (items.length >= 3) break; }
      items.forEach(a => used.add(storyKey(a)));
      cov[s.cat] = { found: raw.length, filtered: raw.length - src.length, shown: items.length, breaking: (cov[s.cat] && cov[s.cat].breaking) || 0, dedupHidden: src.length > 0 && items.length === 0 };
      return { ...s, items };
    });

    // HOUSTON LOCAL — General stories from Houston outlets, deduped, max 4.
    const houston = general.filter(a => (HOUSTON_SOURCES || []).includes(a.source) && !used.has(storyKey(a))).slice(0, 4);
    houston.forEach(a => used.add(storyKey(a)));

    cov.general.shown = (lead ? 1 : 0) + top.filter(t => (t.cat || 'general') === 'general').length;
    return { lead, top, breaking, sections, houston, cov };
  }, [arts, breakingItems, head]); // eslint-disable-line react-hooks/exhaustive-deps

  // ?debug=1 coverage readout: per category = found / shown / breaking / filtered / hidden.
  useEffect(() => {
    if (!DEBUG || typeof window === 'undefined') return;
    window.__dbg = window.__dbg || {};
    window.__dbg.coverage = model.cov;
    const hidden = Object.entries(model.cov).filter(([, v]) => v.found === 0 || v.dedupHidden).map(([c]) => c);
    // eslint-disable-next-line no-console
    if (hidden.length) console.log('[coverage] hidden sections:', hidden.join(', '));
  }, [model, DEBUG]);

  const sopMeta = CATS.general || {};
  const hasBreaking = model.breaking.length > 0;
  const generalLoaded = !!(lastUpdated && lastUpdated.general != null);

  return (
    <div className="page mobile-home" data-mobile-home="1">
      {/* LEAD 16:9 (reserved height so the deck/actions don't shift it in) */}
      {model.lead
        ? <div className="mh-lead"><SnapshotCard a={model.lead} meta={sopMeta} isSaved={isSavedFn(model.lead)} onSave={onSave} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate} opinionLabel={opinionLabel(model.lead)} lead={true}/></div>
        : <div className="mh-lead"><SectionSkeleton lead rows={0} label="Top story"/></div>}

      {/* TOP STORIES — 4 compact cross-category headlines (always present once loaded) */}
      <section className="mh-section mh-topstories">
        <div className="mh-sec-head"><span className="eyebrow mh-sec-label">Top stories</span></div>
        {committed && model.top.length > 0
          ? <div className="mh-rows">{model.top.map((a, i) => <CompactRow key={a.link || i} a={a} fmtDate={fmtDate} onRead={onRead}/>)}</div>
          : <SectionSkeleton rows={4} label="Top stories"/>}
      </section>

      {/* BREAKING / STATE OF PLAY — existing selection rules, only when present. While
          General is still loading, reserve the slot so a late breaking block doesn't shove
          the page; once loaded, show it or collapse. */}
      {hasBreaking
        ? <section className="mh-section mh-breaking">
            <StateOfPlay variant="sidebar" items={[]} breakingItems={model.breaking}
              meta={sopMeta} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate}/>
          </section>
        : (!generalLoaded && <div className="mh-breaking mh-breaking-reserve" aria-hidden="true"><SectionSkeleton rows={3}/></div>)}

      {/* LIVE SCORES — one slim row; ActiveScoresBar self-hides when nothing is live/today */}
      {ActiveScoresBar && (
        <div className="mh-scores"><ActiveScoresBar favTeams={favTeams} onGoToSports={() => navigate('sports')}/></div>
      )}

      {/* CATEGORY SECTIONS */}
      {model.sections.map((s, i) => (
        <CategorySection key={s.cat} s={s} ctx={ctx} eager={i < EAGER}
          onNear={() => requestCat([s.cat, ...(s.extra || [])])}/>
      ))}

      {/* HOUSTON LOCAL */}
      {model.houston.length > 0 && (
        <section className="mh-section mh-houston">
          <div className="mh-sec-head"><span className="eyebrow mh-sec-label">Houston Local</span></div>
          <div className="mh-rows">
            {model.houston.map((a, i) => i === 0
              ? <SnapshotCard key={a.link || i} a={a} meta={sopMeta} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate} opinionLabel={opinionLabel(a)} lead={false}/>
              : <CompactRow key={a.link || i} a={a} fmtDate={fmtDate} onRead={onRead}/>)}
          </div>
        </section>
      )}

      {/* FOOTER — Edit sections → Customize */}
      <div className="mh-footer">
        <button className="mh-edit-sections" type="button" onClick={() => openCustomize('keywords', 'general')}>Edit sections</button>
      </div>
    </div>
  );
}
