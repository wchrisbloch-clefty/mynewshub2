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
import { SectionSkeleton, SectionError } from '../section-state';
import { TopicTag } from '../topic-tag';
import { hasUsableImage, imgReferrerPolicy } from '../source-image';
import { isPromoItem } from '../breaking';
import { selectTopStories } from '../top-stories/select.js';
import { sameStory } from '../clustering/index.js';
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
const TOP_N = 6;               // Z1: selectTopStories builds 6; phone shows 5 + "Show all N".
const TOP_SHOWN = 5;           // Z1.2: phone shows the first 5; the rest live on the full page.
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
// Y4 (audit outcome): we measured extending the desktop label-confirmation rule (labelConfirmed via
// kwMatch) to the phone Home mixed surfaces and it suppressed 64–78% of category labels in the
// fixtures — far over the 20% STOP threshold — because kwMatch needs an exact DEFAULT_KW keyword hit
// that most genuine headlines lack. Per the spec's "if >20% disappear, STOP and report (no new
// classifier)" clause, the label is NOT gated here; see docs/verification/batch-Y-report.md (Y4).
function CompactRow({ a, fmtDate, onRead, onPerspectives }) {
  // Z1.2: a quiet "N sources" chip when the cluster is widely covered (>=3 outlets); tapping it opens
  // the existing perspective/coverage view instead of the story. No numbers anywhere else.
  const sources = a._clusterSize || 1;
  return (
    <button className="mh-compact" type="button" onClick={() => onRead(a)}>
      <span className="mh-compact-title">{a.title}</span>
      <span className="mh-compact-meta">
        <TopicTag cat={a.cat}/> · {a.source} · {fmtDate(a.pubDate)}
        {sources >= 3 && onPerspectives && (
          <span className="mh-compact-sources" role="button" tabIndex={0}
            onClick={e => { e.stopPropagation(); onPerspectives(a); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onPerspectives(a); } }}>
            {sources} sources
          </span>
        )}
      </span>
    </button>
  );
}

// AC3: STANDARD row — headline left, a 72px thumbnail right, TOPIC · Source · time. Used for
// Top-stories rows 1–2 WHEN the story has a usable image (the chooser checks hasUsableImage
// first). The 72px slot is fixed so the lazy image loads into reserved space (no shift); if the
// image 404s/blanks at runtime it collapses to the plain COMPACT layout — no gap, no placeholder.
function StandardRow({ a, fmtDate, onRead, onPerspectives }) {
  const [imgErr, setImgErr] = useState(false);
  const sources = a._clusterSize || 1;
  return (
    <button className="mh-standard" type="button" onClick={() => onRead(a)}>
      <span className="mh-standard-main">
        <span className="mh-compact-title">{a.title}</span>
        <span className="mh-compact-meta">
          <TopicTag cat={a.cat}/> · {a.source} · {fmtDate(a.pubDate)}
          {sources >= 3 && onPerspectives && (
            <span className="mh-compact-sources" role="button" tabIndex={0}
              onClick={e => { e.stopPropagation(); onPerspectives(a); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onPerspectives(a); } }}>
              {sources} sources
            </span>
          )}
        </span>
      </span>
      {!imgErr && (
        <span className="mh-standard-thumb">
          <img src={a.img} loading="lazy" decoding="async" alt="" referrerPolicy={imgReferrerPolicy(a.img)}
            onError={() => setImgErr(true)} onLoad={e => { if (!e.currentTarget.naturalWidth) setImgErr(true); }} />
        </span>
      )}
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

// Z5: phone Home PODCASTS section — the latest 3 episodes across all shows, lazy-loaded when near
// the viewport and collapsing to nothing when there are none. Same COMPACT row anatomy as the rest
// of the page (PODCAST · Show · time · duration meta); the row opens the episode, the header's
// "See all" opens the full Podcasts page where the Z5 action set (Summary/Takeaways/Explain/Ask/…) lives.
function PodcastSection({ ctx, onNear }) {
  const { podEps, podLoading, PODCAST_FEEDS, fmtDate, fmtDuration, navigate } = ctx;
  const ref = useRef(null);
  const firedRef = useRef(false);
  const fire = () => { if (firedRef.current) return; firedRef.current = true; onNear(); };
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { fire(); return; }
    const io = new IntersectionObserver(ents => { if (ents.some(e => e.isIntersecting)) { fire(); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feeds = PODCAST_FEEDS || [];
  const eps = feeds.flatMap(p => (podEps[p.name] || []).slice(0, 3).map(e => ({ ...e, show: e.show || p.name })))
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 3);
  const anyLoading = feeds.some(p => podLoading && podLoading[p.name]);
  const everLoaded = feeds.some(p => podEps && podEps[p.name] !== undefined);

  // Collapse to nothing once loaded & genuinely empty — but keep the observed node so a late
  // fetch can still fill it in.
  if (everLoaded && !anyLoading && eps.length === 0) return <div ref={ref} className="mh-section mh-section-hidden" aria-hidden="true"/>;

  return (
    <section ref={ref} className="mh-section mh-podcasts" data-cat="podcasts">
      <div className="mh-sec-head">
        <span className="eyebrow mh-sec-label">Podcasts</span>
        <SeeAll label="Podcasts" onClick={() => navigate('podcasts')}/>
      </div>
      {eps.length
        ? <div className="mh-rows">{eps.map((ep, i) => (
            <button key={ep.link || i} className="mh-compact" type="button"
              onClick={() => ep.link ? window.open(ep.link, '_blank', 'noopener') : navigate('podcasts')}>
              <span className="mh-compact-title">{ep.title}</span>
              <span className="mh-compact-meta">Podcast · {ep.show} · {fmtDate(ep.pubDate)}{ep.duration ? ` · ${fmtDuration(ep.duration)}` : ''}</span>
            </button>))}
          </div>
        : <SectionSkeleton rows={3} label="Podcasts"/>}
    </section>
  );
}

export function MobileHome({ ctx }) {
  const { arts, breakingItems, loadCat, loading, lastUpdated, onRead, onSave, isSavedFn,
    setChatContext, navigate, openCustomize, favTeams, CATS, storyKey, fmtDate, opinionLabel,
    HOUSTON_SOURCES, ActiveScoresBar, DEBUG, isPhone, setPerspArticle,
    podEps, loadPod, PODCAST_FEEDS, pendingNew, applyPending } = ctx;
  const nNew = (pendingNew && pendingNew.general || []).length;

  // Lazy-load bookkeeping: which section cats have had loadCat fired.
  const requestedRef = useRef(new Set());
  const podsRequestedRef = useRef(false);   // Z5: fire loadPod for all shows once, when near.
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
    const clean = c => (arts[c] || []).filter(a => a && a.title && a.link && !isPromoItem(a));
    const general = clean('general');
    const lead = general.find(a => a.img) || general[0] || null;
    // Z2.3: a non-general story is eligible for Home breaking only with MULTI significance (>=3
    // distinct outlets in 2h — qualifyBreaking stamps _breakingSig='multi'). The single-outlet
    // strong-term path (_breakingSig='strong') stays for the story's own category page, not Home.
    const breaking = (breakingItems || [])
      .filter(b => b && (((b.cat || 'general') === 'general') || b._breakingSig === 'multi'))
      .filter(b => !(lead && sameStory(b, lead)))
      .slice(0, 3);
    // Z1: ONE "Top stories" list — the single cross-category ranked list that replaces BOTH the old
    // category round-robin AND the phone State-of-Play card (the double dip). It excludes the lead
    // and the breaking rows so no story shows twice. Z2: non-general needs >=3 outlets (minOutlets).
    const allCats = Object.values(arts).flat();
    const top = selectTopStories({ general, allCats, breaking: [lead, ...breaking].filter(Boolean), max: TOP_N, minOutlets: 3 });
    return { lead, top, breaking };
  }, [arts, breakingItems]);
    // Freeze the head once General has loaded AND Top Stories is full (4) — or nothing in the
    // TOP_ORDER set is still loading (thin data). Re-pick on refresh (lastUpdated.general change).
  const refreshKey = (lastUpdated && lastUpdated.general != null) ? lastUpdated.general : 0;
  const [frozenHead, setFrozenHead] = useState(null);
  // W6: coalesce the INITIAL-LOAD burst. `lastUpdated.general` ticks 2–3 times within ~1s as the
  // general feed commits in passes; each tick used to reset the frozen head and re-pick. Re-picking
  // after the head first froze flips the variable-height breaking slot 0->N once the load reserve
  // is gone (reserve is only up while !generalLoaded) and shoves the page — the ~0.09 mobile-Home
  // CLS spike (cause: `model.breaking` <- `head.breaking`, reset by this effect; selector
  // `.mh-breaking` / `.mh-brk-row`). A genuine later refresh (refreshKey quiet for > 2.5s) still
  // re-picks; the initial burst does not. The lead + Top Stories are height-reserved, so a re-pick
  // never shifts them — only breaking needs this guard.
  const lastRefreshAtRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    const sinceLast = now - lastRefreshAtRef.current;
    lastRefreshAtRef.current = now;
    if (sinceLast < 2500 && frozenHead) return; // initial-load burst: keep the first frozen head
    setFrozenHead(null);
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
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

    // Head (held): lead + breaking + top are all FROZEN together so the shared used-keys set is
    // stable — otherwise a changing Top-stories list churns the sections below it (their dedupe
    // input moves). The coverage guarantee (one story at most once across lead, breaking, Top stories
    // and every section) holds because every surface dedupes against this one frozen set. Z1: the
    // separate phone State-of-Play card is gone — "Top stories" IS the one ranked cross-category list.
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
  }, [arts, breakingItems, head, liveHead]); // eslint-disable-line react-hooks/exhaustive-deps

  // ?debug=1 coverage readout: per category = found / shown / breaking / filtered / hidden.
  useEffect(() => {
    if (!DEBUG || typeof window === 'undefined') return;
    window.__dbg = window.__dbg || {};
    window.__dbg.coverage = model.cov;
    window.__dbg.topStories = (model.top || []).map(a => ({ t: (a.title || '').slice(0, 30), cat: a.cat }));
    const hidden = Object.entries(model.cov).filter(([, v]) => v.found === 0 || v.dedupHidden).map(([c]) => c);
    // eslint-disable-next-line no-console
    if (hidden.length) console.log('[coverage] hidden sections:', hidden.join(', '));
  }, [model, DEBUG]);

  const sopMeta = CATS.general || {};
  // Z0/Z1: breaking renders only AFTER the head commits (atomic with Top Stories), and there is no
  // pre-commit reserve that collapses — that collapse was the dominant mobile-Home CLS source (the
  // Y "R2" breaking churn), and the Z0 text lead amplified it by moving everything up. With breaking
  // gated on `committed`, the breaking strip (0-3 rows) appears in the same frame Top Stories does.
  const hasBreaking = committed && model.breaking.length > 0;
  const generalLoaded = !!(lastUpdated && lastUpdated.general != null);

  return (
    <div className="page mobile-home" data-mobile-home="1">
      {/* Z4: "N new stories" pill — staged refresh (pull-to-refresh) stows fresh general stories in
          pendingNew.general without replacing the view (0 shift), and this fixed-position pill (out
          of flow, so its appearance shifts nothing) applies them on tap. */}
      {nNew > 0 && applyPending && (
        <button className="new-stories-pill mh-nsp" type="button" onClick={() => applyPending('general')}>
          <span className="nsp-dot"/> ↑ {nNew} new {nNew === 1 ? 'story' : 'stories'}
        </button>
      )}
      {/* LEAD. Z0: on phone (<=640) the lead is TEXT-FIRST — no hero image is rendered or requested
          (hideImage={isPhone} on the one Lead component; the band decision, not a fork). At 641-900
          (ipad-portrait sections) isPhone is false, so the 16:9 hero image stays exactly as before.
          The phone skeleton is text-only (no image block) and sized to the committed text lead; the
          .mh-lead floor is set per band in mobile-home.css (phone floor = text-lead height). */}
      {model.lead
        ? <div className={`mh-lead${isPhone ? ' mh-lead-noimg' : ''}`}><SnapshotCard a={model.lead} meta={sopMeta} isSaved={isSavedFn(model.lead)} onSave={onSave} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate} opinionLabel={opinionLabel(model.lead)} lead={true} hideImage={isPhone}/></div>
        : <div className={`mh-lead${isPhone ? ' mh-lead-noimg' : ''}`}>{isPhone
            ? <div className="mh-lead-skel mh-lead-skel-text" aria-busy="true" aria-label="Loading top story"><span className="mh-lead-skel-kicker"/><span className="mh-lead-skel-h1"/><span className="mh-lead-skel-h2"/><span className="mh-lead-skel-deck"/><span className="mh-lead-skel-meta"/></div>
            : <div className="mh-lead-skel" aria-busy="true" aria-label="Loading top story"><div className="mh-lead-skel-img"/><div className="mh-lead-skel-main"><span className="mh-lead-skel-ln1"/><span className="mh-lead-skel-ln2"/><span className="mh-lead-skel-deck"/></div></div>}</div>}

      {/* T1: BREAKING strip — directly under the LEAD, above Top Stories (CB: the "what is
          happening" signal is the draw). ONE line per row: red BREAKING word (no dot, S10) +
          1-line headline + age; the whole row opens the story, with a >=44px hit area via ::after.
          Max 3 (breaking rules); these stories are seeded into the dedupe set, so they never repeat
          in the State of Play card below. While General loads, reserve the slot (no shove). */}
      {/* W6: breaking collapses to 0px when there is nothing breaking (Batch T rule). The slot is
          reserved ONLY while General is still loading (so it does not shove content when breaking
          arrives), then collapses. The ~0.09 CLS spike that W3 masked with a permanent floor is
          fixed at the source — the held head no longer re-picks on the initial-load refreshKey
          burst (see the coalescing effect above), so `model.breaking` no longer flips 0->N after
          `generalLoaded`. */}
      {hasBreaking
        ? <section className={`mh-section mh-breaking mh-breaking-n${Math.min(model.breaking.length, 3)}`}>
            <div className="mh-brk-strip" role="list">
              {model.breaking.slice(0, 3).map((b, i) => (
                <button key={b.link || i} className="mh-brk-row" role="listitem" onClick={() => onRead(b)}
                  title={b._breakingWhy ? `Breaking — ${b._breakingWhy}` : 'Breaking'}>
                  <span className="mh-brk-tag">Breaking</span>
                  <span className="mh-brk-title">{b.title}</span>
                  <span className="mh-brk-age">{fmtDate(b.pubDate)}</span>
                </button>
              ))}
            </div>
          </section>
        // Z1: pre-commit, reserve the breaking slot so when the strip commits it fills the reserve
        // instead of shoving Top stories down (the dominant mobile-Home CLS source). The row count is
        // not known until the head freezes, so the reserve is sized to the LIVE head's breaking count
        // when known, else to the breakingItems prop (available from first paint), else a 2-row
        // default — the typical Home breaking height. Fully eliminating the residual needs the atomic
        // head reserve (R2, see batch-Z-report).
        : (!committed &&
            <div className={`mh-section mh-breaking mh-breaking-reserve mh-breaking-n${Math.min(Math.max(liveHead.breaking.length, (breakingItems || []).length ? 2 : 0, 2), 3)}`} aria-hidden="true"/>)}

      {/* Z1: ONE "Top stories" — the single ranked cross-category list (selectTopStories). It
          replaces BOTH the old category round-robin AND the State-of-Play card (the double dip). It
          shows 5 rows + "Show all N" which opens the full State-of-Play page ("All top stories"). The
          block is a FIXED 5-row reserve, so nothing below it shifts as it commits (CLS). */}
      <section className="mh-section mh-topstories">
        <div className="mh-sec-head"><span className="eyebrow mh-sec-label">Top stories</span></div>
        {committed && model.top.length > 0
          ? <>
              <div className="mh-rows">{model.top.slice(0, TOP_SHOWN).map((a, i) => (i < 2 && hasUsableImage(a.img))
                ? <StandardRow key={a.link || i} a={a} fmtDate={fmtDate} onRead={onRead} onPerspectives={setPerspArticle}/>
                : <CompactRow key={a.link || i} a={a} fmtDate={fmtDate} onRead={onRead} onPerspectives={setPerspArticle}/>)}</div>
              <button className="mh-topstories-all" type="button" onClick={() => navigate('stateofplay')}>
                Show all top stories
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          : <SectionSkeleton rows={TOP_SHOWN} label="Top stories"/>}
      </section>

      {/* O2: Live Scores moved to the TOP of the scrolling header stack (match iPad order:
          Scores → Markets/weather → nav), so it is no longer rendered here mid-page. */}

      {/* CATEGORY SECTIONS */}
      {model.sections.map((s, i) => (
        <CategorySection key={s.cat} s={s} ctx={ctx} eager={i < EAGER}
          onNear={() => requestCat([s.cat, ...(s.extra || [])])}/>
      ))}

      {/* Z5: PODCASTS — latest 3 episodes, lazy-loaded, collapses when empty. */}
      <PodcastSection ctx={ctx} onNear={() => {
        if (podsRequestedRef.current) return; podsRequestedRef.current = true;
        (PODCAST_FEEDS || []).forEach(p => { if (!(podEps && podEps[p.name]) && loadPod) loadPod(p); });
      }}/>

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
