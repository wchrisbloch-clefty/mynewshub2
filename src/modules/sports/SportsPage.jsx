// ─── SPORTS PAGE ──────────────────────────────────────────────────────────────
// Hoisted + extracted from App.jsx (J3 identity fix, then lazy-split to keep the entry
// bundle under budget). Pure module: every App-internal value AND the App-defined
// components/helpers it uses arrive through ONE ctx object (no circular import back into
// App). Lazy-loaded + idle/hover-prefetched; a skeleton is the Suspense fallback.
import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { ChevronDown, ExternalLink, Star, Trophy, X as XIcon } from 'lucide-react';
import { StateOfPlay, selectStateOfPlay } from '../state-of-play';
import { SnapshotCard } from '../snapshot-card';
import { XPulse } from '../x-pulse';
import { dbgRender, dbgMount } from '../debug';
import { isPromoItem } from '../breaking'; // K3: promo filter for the team wide/gap scans

// Per-league keyword sets (lifted to module scope, P5) so the feed filter AND the index-tile
// counts share ONE source of truth — a tile's number is exactly what selecting it would show.
const SPORT_KWS = {
  nfl:   ['nfl','football','quarterback','touchdown','super bowl','running back','wide receiver','defensive end','nfc','afc','nfl draft'],
  nba:   ['nba','basketball','lakers','celtics','warriors','knicks','heat','bulls','playoffs','nba draft','three-pointer','slam dunk'],
  mlb:   ['mlb','baseball','world series','yankees','dodgers','cubs','home run','pitcher','bullpen','batting average','mlb draft'],
  cfb:   ['cfb','college football','ncaa football','sec','big ten','acc','pac-12','big 12','cfp','bowl game','heisman'],
  cbb:   ['cbb','college basketball','ncaa','march madness','final four','ncaa tournament','big east','sweet 16'],
  cbase: ['college baseball','ncaa baseball','cws','college world series','super regional','sec baseball','acc baseball','big 12 baseball','d1baseball','college world'],
  racing:['horse racing','thoroughbred','derby','stakes','jockey','paddock','furlong','harness racing','horse race','breeders cup','kentucky derby','preakness','belmont'],
  golf:  ['golf','pga tour','masters','us open golf','british open','ryder cup','tiger woods','golfer','birdie','bogey','fairway','tee shot','pga championship','lpga'],
};

export function SportsPage({ ctx }) {
  const { tab, subcat, tertiary, arts, loading, kw, teams, myTeams, followedTeams, activeTeam, activeKw, activeSrc, breakingItems, feeds, health, lastUpdated, pendingNew, recommended, search, sorted, setActiveTeam, setActiveKw, setActiveSrc, setChatContext, setPerspArticle, setSearch, navigate, onRead, onSave, isSavedFn, isReadFn, isTeamFollowed, isTopicFollowed, followTeam, unfollowTeam, toggleTopic, loadCat, applyPending, refreshAll, openCustomize, getRelated, voicesStripFor, CATS, CoverImg, EmptyState, FeedCard, IconGear, LEAGUES, LastUpdated, Sidebar, SourceFooter, SourcesDisagree, SportsScoreStrip, TEAM_CHIPS, TeamLogo, TrendingPills, storyKey, fmtDate, teamSlug, teamScanKeyword, fetchDiscover, fetchWebSearch, ld, sv, opinionLabel } = ctx;
    dbgRender('SportsPage'); // D8: ?debug=1 render counter (no-op when off)
    useEffect(() => dbgMount('SportsPage'), []); // J1: remount counter (no-op when off)
    // I3: SportsPage no longer subscribes to the scores store — the live-score tile strip
    // (SportsScoreStrip) subscribes itself and hosts the poll. So a score tick re-renders
    // ONLY the strip, not this whole page (feed, team rails, State of Play). This is the
    // Sports-twitch fix: App +0 (I1) AND SportsPage +0 on a tick.
    // Phase 2: subcategory comes from the URL (never local state). Chips navigate.
    const sportTab = subcat || 'all'; // 'all' | 'nfl' | 'nba' | 'mlb' | 'cfb' | 'cbb' | 'cbase' | 'racing' | 'golf'
    const setSportTab = (key) => navigate('sports', key === 'all' ? null : key);
    // Tier 3: team page driven by the URL's 3rd segment (/sports/:league/:team).
    const teamName = (sportTab !== 'all' && tertiary)
      ? ((TEAM_CHIPS[sportTab] || []).find(n => teamSlug(n) === tertiary)
         || tertiary.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      : null;
    const teamFollowed = !!(teamName && isTeamFollowed(teamName, sportTab));
    // activeTeam/setActiveTeam now live in App state (survives SportsPage remounts).
    const [teamMenuSym, setTeamMenuSym] = useState(null); // team with open popup menu
    // Collapsible State of Play — shared shell behavior, per-category memory ('sports').
    const [sopCollapsed, setSopCollapsed] = useState(()=>ld('sopCollapsed_sports', false));
    const toggleSop = () => setSopCollapsed(v => { const nx = !v; sv('sopCollapsed_sports', nx); return nx; });
    const [sportWebResults, setSportWebResults] = useState([]);
    const [sportWebLoading, setSportWebLoading] = useState(false);
    // Coverage-Gap stories for the active team, folded into the team's State of
    // Play list as tagged rows (Pass G item 9) — no standalone panel.
    const [teamGapItems, setTeamGapItems] = useState([]);
    // Wide multi-source scan for the active team (Pass K item 1). The team story feed
    // must not be scoped to ESPN's sports feed alone — it runs the same wide scan as
    // Coverage Gap (any outlet that mentions the team), so niche/local teams (e.g. the
    // Rockets) surface real stories instead of an empty state. Covers BOTH the URL-driven
    // Tier-3 team page (teamName) and the My-Teams hub (activeTeam).
    const [teamWideItems, setTeamWideItems] = useState([]);
    // Resolve the active team entity for the wide scan. Two entry points with DIFFERENT
    // field shapes, so we normalize:
    //   • Tier-3 team page: teamName is a clean chip name ("Clemson"), league = URL tab
    //     key ("cfb").
    //   • My-Teams hub: activeTeam.match is the search term ("Clemson", "Houston Texans"),
    //     activeTeam.team is a DISPLAY label ("Clemson FB", "UK Basketball"), and
    //     activeTeam.league is an ESPN slug ("college-football").
    // We search on the MATCH term (never the display label) and keep a set of filter
    // "needles" — the match phrase, its mascot/last word, and the display label — so a
    // suffixed label like "Clemson FB" or a city-prefixed "Houston Texans" still matches
    // real headlines ("Clemson beats…", "Texans sign…").
    const teamEntity = useMemo(() => {
      if (teamName) return { name: teamName, league: sportTab, needles: [teamName] };
      if (activeTeam) {
        const match = activeTeam.match || activeTeam.team || '';
        const last = match.split(/\s+/).filter(Boolean).pop();
        return { name: match, league: activeTeam.league, needles: [match, last, activeTeam.team].filter(Boolean) };
      }
      return null;
    }, [teamName, sportTab, activeTeam]);
    const teamEntityName = teamEntity && teamEntity.name;
    const teamEntityLeague = teamEntity && teamEntity.league;
    useEffect(() => {
      let alive = true;
      if (!teamEntityName) { setTeamWideItems([]); return () => { alive = false; }; }
      const kw = teamScanKeyword(teamEntityName, teamEntityLeague);
      fetchDiscover('sports', [kw], [], 'feed').then(r => { if (alive) setTeamWideItems(((r && r.items) || []).filter(a => !isPromoItem(a))); });
      return () => { alive = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamEntityName, teamEntityLeague]);
    // Keep only wide-scan rows that name the team — match ANY needle (the scoped query
    // already narrows the search; this just drops an adjacent headline clustering merged).
    const teamWideFiltered = useMemo(() => {
      if (!teamEntity) return [];
      const needles = teamEntity.needles.map(n => (n || '').toLowerCase()).filter(Boolean);
      return teamWideItems.filter(a => { const t = (a.title || '').toLowerCase(); return needles.some(n => t.includes(n)); });
    }, [teamWideItems, teamEntity]);

    // v36: Fetch web results when a specific league tab is active
    useEffect(() => {
      if (sportTab === 'all') { setSportWebResults([]); return; }
      const SPORT_TAB_QUERIES = {
        nfl: 'NFL football news today', nba: 'NBA basketball news today',
        mlb: 'MLB baseball news today', cfb: 'college football news today',
        cbb: 'college basketball news today', cbase: 'college baseball news today',
        racing: 'horse racing news today', golf: 'PGA Tour golf news today',
      };
      const q = SPORT_TAB_QUERIES[sportTab] || `${sportTab} sports news`;
      setSportWebLoading(true);
      fetchWebSearch(q).then(r => { setSportWebResults(r); setSportWebLoading(false); });
    }, [sportTab]);

    const cc = CATS.sports;
    // D8: memoize — `sorted('sports')` returns a NEW array of NEW objects every call,
    // so calling it raw gave `allItems` a fresh identity each render, which made the
    // `sportItems` and `teamItems` memos (that depend on it) recompute on EVERY render
    // and never cache. `sorted` is a stable useCallback, so this recomputes only when
    // its inputs actually change.
    const allItems = useMemo(() => sorted('sports'), [sorted]);
    const isLoading = loading.sports;

    // Filter teams by sport tab — pill rail respects tab
    const visibleTeams = useMemo(() => {
      if (sportTab === 'all') return teams;
      const leagueKey = sportTab;
      const L = LEAGUES.find(x => x.key === leagueKey);
      if (!L) return []; // golf/racing/cbase have no LEAGUE entry — use keyword filter only
      return teams.filter(t => t.sport === L.sport && t.league === L.league);
    }, [teams, sportTab]);

    // Filter+sort stories: optionally team-locked, optionally sport-locked.
    // Favorites float to top: any item mentioning ANY team in `teams` gets
    // boosted unless a specific team filter is active.
    const sportItems = useMemo(() => {
      let items = allItems;
      if (activeTeam) {
        const m = (activeTeam.match || '').toLowerCase();
        const teamShort = (activeTeam.team || '').toLowerCase();
        items = items.filter(a => {
          const text = (a.title + ' ' + (a.desc||'')).toLowerCase();
          return text.includes(m) || (teamShort.length > 3 && text.includes(teamShort));
        });
        // Fold in the wide multi-source scan (Pass K item 1) so the team feed isn't
        // limited to ESPN/CBS — any outlet that covers this team surfaces here.
        const have = new Set(items.map(storyKey));
        items = [...items, ...teamWideFiltered.filter(a => !have.has(storyKey(a)))];
      } else if (sportTab !== 'all') {
        // Sport-tab filter: keep articles mentioning any team in this sport,
        // OR keep any article from sport-specific kw (broad fallback).
        const teamsInSport = visibleTeams.map(t => (t.match||'').toLowerCase());
        const sportKws = SPORT_KWS[sportTab] || [];
        items = items.filter(a => {
          const t = (a.title + ' ' + (a.desc||'')).toLowerCase();
          return teamsInSport.some(m => m && t.includes(m)) || sportKws.some(k => t.includes(k));
        });
      }
      // Favorite-team prioritization: bubble articles mentioning user's teams to top
      const favMatches = teams.map(t => (t.match||'').toLowerCase()).filter(Boolean);
      const scored = items.map(a => {
        const t = (a.title + ' ' + (a.desc||'')).toLowerCase();
        const favHits = favMatches.filter(m => t.includes(m)).length;
        return { ...a, _favScore: favHits };
      });
      scored.sort((a, b) => {
        if (b._favScore !== a._favScore) return b._favScore - a._favScore;
        return new Date(b.pubDate) - new Date(a.pubDate);
      });
      return scored;
    }, [allItems, activeTeam, sportTab, teams, visibleTeams, teamWideFiltered]);

    // Hero = first article with image
    // Tier 3: team feed reuses the Phase 2 engine (narrower query) + clusterStories.
    const teamItems = useMemo(() => {
      if (!teamName) return [];
      const q = teamName.toLowerCase();
      const local = clusterStories(allItems.filter(a => (a.title + ' ' + (a.desc||'')).toLowerCase().includes(q)));
      // Merge the wide multi-source scan (Pass K item 1) — stories from ANY outlet that
      // mention the team, not just the reader's ESPN/CBS sports feeds. Local (richer:
      // images, descriptions) first, then wide-scan rows not already present.
      const have = new Set(local.map(storyKey));
      const merged = [...local, ...teamWideFiltered.filter(a => !have.has(storyKey(a)))];
      return merged.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
    }, [teamName, allItems, teamWideFiltered]);
    const teamHero = teamItems.find(a => a.img) || null;

    // Fetch the team's Coverage-Gap items (widely-covered team news the reader's
    // own sports sources missed) to fold into the team State of Play list.
    useEffect(() => {
      let alive = true;
      if (!teamName) { setTeamGapItems([]); return () => { alive = false; }; }
      const srcs = (feeds.sports || []).filter(f => f.on).map(f => f.name);
      fetchDiscover('sports', [teamName], srcs).then(r => { if (alive) setTeamGapItems(((r && r.items) || []).filter(a => !isPromoItem(a))); });
      return () => { alive = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamName]);

    const heroItems = sportItems.filter(a => a.img);
    const lead = heroItems[0] || null;
    // O4: one story once per PAGE. Dedupe the feed by storyKey (title-key, the same rule Home
    // uses) so a syndicated copy of the lead — or of another story — can't reappear as a list
    // row or a second grid card.
    const feedSeen = new Set();
    if (lead) feedSeen.add(storyKey(lead));
    let feedItems = sportItems.filter(a => {
      if (a === lead) return false;
      const k = storyKey(a);
      if (feedSeen.has(k)) return false;
      feedSeen.add(k);
      return true;
    });
    if (feedItems.length === 0 && sportItems.length > 0) { feedItems = sportItems.filter(a => a !== lead); } // never blank when stories exist
    // T4: State of Play claims the heat-ranked TOP of the feed FIRST (so the up-front card shows the
    // stories actually driving the day, not the low-heat leftovers O4 handed it), then the hero grid
    // and the list render what SoP did NOT take — one story once per page, the same claim-order Home
    // uses (SoP/Top Stories before the feed). The rail + the <=1100 hoist both rank from `feedItems`
    // and so render exactly this same top set, disjoint from the grid/list below.
    const sopRailItems = feedItems; // StateOfPlay selects its top from here
    const sopTopList = selectStateOfPlay({ items: feedItems, breakingItems: [], gapItems: [] }).top;
    const sopKeys = new Set(sopTopList.map(storyKey));
    const sopHasRows = sopTopList.length >= 3; // the up-front card renders only with a real list
    const feedAfterSop = feedItems.filter(a => !sopKeys.has(storyKey(a)));
    // The hero grid (gn-row) and the list below it draw from the SoP-claimed remainder, so they are
    // disjoint from each other AND from State of Play. The grid takes its 3 cards image-first.
    const showGrid = !activeTeam && feedAfterSop.length > 0;
    const gridCards = showGrid
      ? feedAfterSop.slice(0, 6).filter(a => a.img).slice(0, 3).concat(feedAfterSop.slice(0, 6).filter(a => !a.img)).slice(0, 3)
      : [];
    const gridKeys = new Set(gridCards.map(storyKey));
    const listItems = (activeTeam ? feedItems : feedAfterSop.filter(a => !gridKeys.has(storyKey(a)))).slice(0, 30);

    // League pills are text-only (Pass J item 7): lucide-react has no per-league
    // glyphs and emoji rendered inconsistently. Team pills below carry real icons
    // (TeamLogo). "All" gets a lucide Trophy so the leading pill still reads as sports.
    const SPORT_TABS = [
      { key:'all',    label:'All',             icon:Trophy },
      { key:'nfl',    label:'NFL' },
      { key:'nba',    label:'NBA' },
      { key:'mlb',    label:'MLB' },
      { key:'cfb',    label:'NCAAF' },
      { key:'cbb',    label:'NCAAB' },
      { key:'cbase',  label:'College Baseball' },
      { key:'racing', label:'Horse Racing' },
      { key:'golf',   label:'Golf' },
    ];

    // P5: per-league story counts for the index tiles — the SAME keyword + team-name predicate
    // the feed uses, so "NFL 12" means selecting NFL shows 12. Computed once over the sports pool.
    const leagueCounts = useMemo(() => {
      const counts = { all: allItems.length };
      for (const key of Object.keys(SPORT_KWS)) {
        const kws = SPORT_KWS[key];
        const teamNames = ((TEAM_CHIPS && TEAM_CHIPS[key]) || []).map(n => (n || '').toLowerCase()).filter(Boolean);
        counts[key] = allItems.filter(a => {
          const t = (a.title + ' ' + (a.desc || '')).toLowerCase();
          return kws.some(k => t.includes(k)) || teamNames.some(m => t.includes(m));
        }).length;
      }
      return counts;
    }, [allItems]);

    // Keep the active subcategory chip scrolled into view (on load + on change).
    const sportTabsRef = useRef(null);
    useEffect(() => {
      const el = sportTabsRef.current?.querySelector('.sport-tab.active');
      if (el?.scrollIntoView) el.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
    }, [sportTab]);

    const feedRef = useRef(null);
    const scrollToFeed = () => {
      const el = feedRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };

    return (
      <div className="page sports-page">

        {/* v46: "N new stories" pill */}
        {(pendingNew.sports||[]).length > 0 && (
          <button className="new-stories-pill" onClick={()=>applyPending('sports')}>
            <span className="nsp-dot"/> ↑ {pendingNew.sports.length} new {pendingNew.sports.length===1?'story':'stories'}
          </button>
        )}

        {/* ── SCORES — live scoreboard, anchored at the very top of the ribbon ── */}
        {!teamName && <SportsScoreStrip sportTab={sportTab} teams={[...teams, ...myTeams.map(t=>({match:t.name, league:t.league}))]}/>}

        {/* ── LEAGUES — phone: scrollable pill chips (unchanged). >=641 (P5): a wrapping grid of
            equal outlined INDEX TILES carrying live counts ("NFL 12"); 0-count leagues are hidden
            (except the selected one) and the selected tile is the filled navy pill. ── */}
        <div className="sport-tabs sport-index" data-no-swipe ref={sportTabsRef}>
          {SPORT_TABS.map(t => {
            const n = leagueCounts[t.key] || 0;
            const zero = n === 0 && t.key !== 'all';
            return (
              <button key={t.key}
                className={`sport-tab ${sportTab===t.key?'active':''} ${zero?'is-zero':''}`}
                onClick={()=>{setSportTab(t.key); setActiveTeam(null); setTimeout(scrollToFeed,80);}}>
                {t.icon && <t.icon size={14} strokeWidth={2.2}/>}
                <span className="sport-tab-label">{t.label}</span>
                <span className="sport-tab-count" aria-label={`${n} stories`}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* ── MY TEAMS — followed teams as a pill ribbon (Yahoo Sports style). A pill
            click routes into the existing team-hub (setActiveTeam → filtered feed +
            ESPN/Team links). Order follows the user's My Teams (favorites) config. ── */}
        {!teamName && !activeSrc && !search && followedTeams.length > 0 && (
          <div className="sport-tabs my-teams-ribbon" data-no-swipe>
            {followedTeams.map((t, i) => (
              <button key={`${t.slug}-${t.league}-${i}`}
                className={`sport-tab ${activeTeam && activeTeam.team===t.team && activeTeam.league===t.league ? 'active' : ''}`}
                onClick={()=>{ setActiveTeam(activeTeam && activeTeam.team===t.team ? null : t); setTimeout(scrollToFeed,80); }}>
                <TeamLogo name={t.team} league={t.league} size={16}/>
                {t.team}
              </button>
            ))}
          </div>
        )}

        {/* ── TEAM CHIP RAIL (Tier 3) — reuses sport-tabs styling ── */}
        {TEAM_CHIPS[sportTab] && (
          <div className="sport-tabs" data-no-swipe style={{marginTop:'-4px'}}>
            <button className={`sport-tab ${!teamName?'active':''}`} onClick={()=>navigate('sports', sportTab)}>
              All {SPORT_TABS.find(s=>s.key===sportTab)?.label||''}
            </button>
            {TEAM_CHIPS[sportTab].map(n => {
              const s = teamSlug(n);
              return (
                <button key={s} className={`sport-tab ${tertiary===s?'active':''}`} onClick={()=>navigate('sports', sportTab, s)}>
                  <TeamLogo name={n} league={sportTab} size={16}/>
                  {n}
                </button>
              );
            })}
          </div>
        )}

        {/* ── TEAM PAGE (Tier 3) — StateOfPlay + SnapshotCards + XPulse, follow star ── */}
        {teamName && (
          <>
            <div className="sport-league-header">
              <div className="sport-league-header-left">
                <TeamLogo name={teamName} league={sportTab} size={40}/>
                <div>
                  <h2 className="sport-league-title">{teamName}</h2>
                  <div className="sport-league-count">{teamItems.length} {teamItems.length===1?'story':'stories'} · {sportTab.toUpperCase()}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <button className="sport-league-all-btn" onClick={()=> teamFollowed ? unfollowTeam({name:teamName, league:sportTab}) : followTeam(teamName, sportTab)}>
                  {teamFollowed ? <><Star size={11} fill="currentColor" aria-hidden="true"/> Following</> : <><Star size={11} aria-hidden="true"/> Follow</>}
                </button>
                <button className="sport-league-all-btn" onClick={()=>navigate('sports', sportTab)}>← All {SPORT_TABS.find(s=>s.key===sportTab)?.label}</button>
              </div>
            </div>
            <div className="page-grid">
              <div className="feed-col">
                {/* Coverage Gap is folded into this list as "Not in your sources" rows
                    (Pass G item 9) — no standalone "You may be missing this" panel. */}
                {/* D2: wire Breaking into the Sports team/league page SoP (sports-relevant only). */}
                <StateOfPlay items={teamItems} meta={CATS.sports} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate}
                  collapsed={sopCollapsed} onToggleCollapse={toggleSop} gapItems={teamGapItems}
                  breakingItems={(breakingItems||[]).filter(b=>b.cat==='sports').slice(0,3)}/>
                <TrendingPills label={`Trending · ${teamName}`} items={teamItems} onOpen={t=>setSearch(t.toLowerCase())} isTopicFollowed={isTopicFollowed} toggleTopic={toggleTopic}/>
                <SourcesDisagree topic={teamName} items={teamItems}/>
                {teamItems.length === 0
                  ? <EmptyState message={`No recent stories for .`} actionLabel="Refresh" onAction={()=>loadCat('sports')}/>
                  : <div className="snap-feed" data-no-swipe>
                      {teamItems.slice(0,20).map((a,i)=>(
                        <Fragment key={a.link||i}>
                          <SnapshotCard a={a} meta={CATS.sports} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} onPerspectives={setPerspArticle} onAsk={setChatContext} formatDate={fmtDate} opinionLabel={opinionLabel(a)} hideImage={i>=3}/>
                          {i===2 && <XPulse topic={teamName} variant="feed"/>}
                        </Fragment>
                      ))}
                    </div>}
              </div>
              <Sidebar cat="sports" voicesNode={voicesStripFor('sports')} arts={arts} kw={kw} health={health} onAsk={setChatContext}
                activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}}
                activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}}
                onRead={onRead} showScoreboard={false}
                isTopicFollowed={isTopicFollowed} toggleTopic={toggleTopic}/>
            </div>
          </>
        )}

        {/* My Teams photo-thumbnail cards removed from the hero area — replaced by the
            My Teams pill ribbon under the league tabs (routes into the team-hub via
            setActiveTeam). Scores now sit at the very top of the page. */}

        {/* ── LEAGUE HEADER — ESPN hero banner (only when league tab active) ── */}
        {sportTab !== 'all' && !teamName && !activeTeam && (() => {
          const lt = SPORT_TABS.find(st => st.key === sportTab);
          return (
            <div className="sport-league-header">
              <div className="sport-league-header-left">
                {lt?.emoji && <span className="sport-league-emoji">{lt.emoji}</span>}
                <div>
                  <h2 className="sport-league-title">{lt?.label}</h2>
                  <div className="sport-league-count">
                    {sportItems.length > 0 ? `${sportItems.length} stories` : 'No stories yet — refresh to load'}
                  </div>
                  <div className="sport-league-sub">Top Stories · Trending News</div>
                </div>
              </div>
              <button className="sport-league-all-btn" onClick={()=>setSportTab('all')}>← All Sports</button>
            </div>
          );
        })()}

        {/* ── TEAM HUB — ESPN team page header when team is active ── */}
        {activeTeam && (
          <div className="team-hub">
            <div className="team-hub-header">
              <div>
                <div className="team-hub-title">{activeTeam.emoji} {activeTeam.team}</div>
                <div className="team-hub-count">{sportItems.length} stories found · {activeTeam.league?.toUpperCase()}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                {activeTeam.espnUrl && <a className="team-hub-link" href={activeTeam.espnUrl} target="_blank" rel="noreferrer"><span>ESPN</span> <ExternalLink size={12} aria-hidden="true" style={{verticalAlign:"-1px"}}/></a>}
                {activeTeam.teamUrl && <a className="team-hub-link" href={activeTeam.teamUrl} target="_blank" rel="noreferrer"><span>Team Site</span> <ExternalLink size={12} aria-hidden="true" style={{verticalAlign:"-1px"}}/></a>}
                <button className="team-hub-clear" onClick={()=>setActiveTeam(null)}><XIcon size={12} aria-hidden="true"/> Clear</button>
              </div>
            </div>
          </div>
        )}

        {/* State of Play moved into the sidebar (Pass J item 2). */}

        {/* ── HERO + FEED ── */}
        {!teamName && <div className="page-grid" ref={feedRef}>
          <div className="feed-col">
            {/* Hero lead article */}
            {lead && (
              <article className="sports-hero" onClick={()=>onRead(lead)}>
                <div className="sports-hero-img">
                  <CoverImg src={lead.img} label={lead.source}/>
                  {lead._favScore > 0 && <span className="sports-hero-fav">★ MY TEAMS</span>}
                </div>
                <div className="sports-hero-text">
                  <h1 className="sports-hero-title">{lead.title}</h1>
                  {lead.desc && <p className="sports-hero-desc">{lead.desc}</p>}
                  <div className="sports-hero-meta">
                    <span className="sports-hero-source">{lead.source}</span>
                    <span>·</span>
                    <span>{fmtDate(lead.pubDate)}</span>
                  </div>
                </div>
              </article>
            )}

            {/* S4: State of Play up front on single-column widths (<=1100) — directly after the
                lead, before the long feed. The rail copy (buried at the bottom when the rail
                stacks) is hidden <=1100 via CSS. CB: State of Play is the draw on Sports. */}
            {(sportTab === 'all' || activeTeam) && !activeSrc && !search && sopHasRows && (
              <div className="sports-sop-hoist">
                <StateOfPlay variant="sidebar" items={sopRailItems} meta={CATS.sports} maxRows={3}
                  onRead={onRead} onAsk={setChatContext} formatDate={fmtDate}
                  collapsed={sopCollapsed} onToggleCollapse={toggleSop}/>
              </div>
            )}

            {/* 3-column story grid — ESPN visual punch for top stories */}
            {showGrid && (
              <div className="gn-row" style={{marginBottom:'24px'}}>
                {gridCards.map((a, i) => (
                  <article key={i} className="gn-card" onClick={()=>onRead(a)}>
                    <div className="gn-card-img"><CoverImg src={a.img} label={a.source}/></div>
                    <h3 className="gn-card-title">{a.title}</h3>
                    <div className="gn-card-meta">
                      <span className="gn-card-source" style={{color:cc.color}}>{a.source}</span>
                      <span>·</span><span>{fmtDate(a.pubDate)}</span>
                      {a._favScore > 0 && <Star size={11} aria-hidden="true" style={{marginLeft:'4px',color:'var(--amber)'}} fill="currentColor"/>}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {isLoading && !feedItems.length
              ? <div aria-busy="true" aria-label="Loading sports">{Array.from({length:5}).map((_,i)=>(
                  <div key={i} className="fc-skeleton"><div className="fc-skeleton-title"/><div className="fc-skeleton-line"/><div className="fc-skeleton-line" style={{width:'60%'}}/></div>
                ))}</div>
              : feedItems.length === 0
                ? <EmptyState
                    message={activeTeam ? `No stories for ${activeTeam.team} yet.` : `Couldn't load Sports. Try refresh.`}
                    actionLabel="Refresh" onAction={refreshAll}/>
                : listItems.map((a, i) => (
                    <FeedCard key={i} a={a} cat="sports" isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,'sports')} isRead={isReadFn(a)} userKw={kw} userTeams={teams}/>
                  ))
            }

            {/* v36: Web results for active league tab */}
            {sportTab !== 'all' && (sportWebResults.length > 0 || sportWebLoading) && (
              <div className="web-fallback">
                <div className="rail-label" style={{margin:'24px 0 12px'}}>From the Web</div>
                {sportWebLoading && <div style={{fontSize:'12px',color:'var(--text3)',fontStyle:'italic',padding:'10px 0'}}>Searching the web…</div>}
                {sportWebResults.map((r,i) => (
                  <a key={i} className="web-result" href={r.link} target="_blank" rel="noreferrer">
                    <div className="web-result-title">{r.title}</div>
                    {r.desc && <div className="web-result-desc">{r.desc.slice(0,160)}</div>}
                    <div className="web-result-src">{r.source}{r.pubDate && <span className="web-result-date"> · {fmtDate(r.pubDate)}</span>}</div>
                  </a>
                ))}
              </div>
            )}

            {lastUpdated.sports && (
              <div style={{display:'flex',justifyContent:'flex-end',padding:'8px 0'}}>
                <LastUpdated timestamp={lastUpdated.sports} onRefresh={() => loadCat('sports')}/>
              </div>
            )}
            {/* ── MY TEAMS SHELF — sleek card grid at bottom of sports feed ── */}
            {teams.length > 0 && (
              <div className="teams-shelf">
                <div className="teams-shelf-head">
                  <span className="teams-shelf-label">My Teams</span>
                  <button className="teams-shelf-edit" onClick={()=>openCustomize('teams','sports')}><IconGear/> Edit</button>
                </div>
                <div className="teams-shelf-grid">
                  {teams.map(t => {
                    const isFiltered = activeTeam?.team === t.team;
                    const menuOpen = teamMenuSym === t.team;
                    return (
                      <div key={t.team} className={`team-card${isFiltered?' filtered':''}`}>
                        <button className="team-card-btn"
                          onClick={()=>setTeamMenuSym(menuOpen ? null : t.team)}>
                          <span className="team-card-emoji">{t.emoji}</span>
                          <div className="team-card-info">
                            <span className="team-card-name">{t.team}</span>
                            <span className="team-card-league">{t.league?.toUpperCase()}</span>
                          </div>
                          <span className="team-card-arrow"><ChevronDown size={11} aria-hidden="true" style={{transform:menuOpen?'rotate(180deg)':'none',transition:"transform .15s"}}/></span>
                        </button>
                        {menuOpen && (
                          <div className="team-card-menu">
                            <button className="team-menu-item" onClick={()=>{
                              setActiveTeam(isFiltered ? null : t); setSportTab('all');
                              setTeamMenuSym(null); setTimeout(scrollToFeed, 80);
                            }}>
                              {isFiltered ? <><XIcon size={12} aria-hidden="true"/> Clear filter</> : 'Filter News'}
                            </button>
                            {t.espnUrl && <a className="team-menu-item" href={t.espnUrl} target="_blank" rel="noreferrer"><span>ESPN</span> <ExternalLink size={12} aria-hidden="true" style={{verticalAlign:"-1px"}}/></a>}
                            {t.teamUrl && <a className="team-menu-item" href={t.teamUrl} target="_blank" rel="noreferrer"><span>Team Site</span> <ExternalLink size={12} aria-hidden="true" style={{verticalAlign:"-1px"}}/></a>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <SourceFooter cat="sports" feeds={feeds} arts={arts}/>
          </div>

          {/* State of Play scoping across Sports (three cases, three answers):
              • "All" overview (sportTab==='all', no team) → SHOW (top-level category).
              • League view (a specific league, no team) → HIDE — league-wide trending
                is noise unless you follow every team; sopItems is null.
              • Team hub (activeTeam set) → SHOW, scoped to that team (sportItems is
                already team-filtered). The Tier-3 team page renders its own in-column
                StateOfPlay in the teamName block above. */}
          <Sidebar cat="sports" voicesNode={voicesStripFor('sports')} arts={arts} kw={kw} health={health} onAsk={setChatContext}
            activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}}
            activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}}
            onRead={onRead}
            showScoreboard={false} recommended={recommended}
            isTopicFollowed={isTopicFollowed} toggleTopic={toggleTopic}
            sopItems={(sportTab === 'all' || activeTeam) && !activeSrc && !search ? sopRailItems : null}
            sopMeta={CATS.sports} sopCollapsed={sopCollapsed} onToggleSop={toggleSop} formatDate={fmtDate}/>
        </div>}
      </div>
    );
}
