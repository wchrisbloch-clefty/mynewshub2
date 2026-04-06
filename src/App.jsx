import React,{useState,useEffect,useCallback,useRef}from"react";

const SK = 'v12_';
function load(k, def) { try { const v = localStorage.getItem(SK + k); return v ? JSON.parse(v) : def; } catch { return def; } }
function save(k, v) { try { localStorage.setItem(SK + k, JSON.stringify(v)); } catch {} }

const CATS = { /* unchanged from your original */ };
const CROSS_TAGS = { /* unchanged */ };
const DEFAULT_STOCKS = ['BE', 'CL=F', 'BTC-USD', 'NG=F'];
const DEFAULT_YT = [ /* unchanged */ ];
const YT_CATS = [ /* unchanged */ ];
const DEFAULT_TWITTER = [ /* unchanged */ ];
const PODCAST_FEEDS = [ /* unchanged */ ];
const BRIEFING_FEEDS = [ /* unchanged */ ];
const HOUSTON_FEEDS = [ /* unchanged */ ];
const DEFAULT_KW = { /* unchanged */ };
const DEFAULT_FEEDS = { /* unchanged */ };
const WX_CODES = { /* unchanged */ };
const SPORT_TABS = [ /* unchanged */ ];
const MAIN_CATS = ['general', 'sports', 'business', 'finance', 'bloom', 'houston'];

// Helper functions (parseXML, fetchRSS, fetchPodcast, fmtDate, etc.) — kept exactly as in your original for compatibility
// ... (paste all your original helper functions here: detectCrossTags, readTime, extractImg, parseXML, fetchRSS, fetchPodcast, fmtDate, fmtDuration, artId, etc.)

// StockBar, WeatherBar, ScoresSection — kept mostly original, minor tweaks for mobile

function StockBar() { /* your original StockBar with minor mobile padding adjustments */ }
function WeatherBar() { /* your original */ }
function ScoresSection() { /* your original */ }

// New: Morning Digest component
function MorningDigest({ arts, briefArts, kw }) {
  const digestText = useMemo(() => {
    // Simple client-side "digest" — in production, call your /api/summarize with combined top headlines
    const topHeadlines = [
      ...Object.values(arts).flat().slice(0, 5),
      ...Object.values(briefArts).flat().slice(0, 3)
    ].map(a => a.title).slice(0, 8);
    return "Morning brief: " + topHeadlines.join(" • ") + ". Focus on energy, Houston, and your teams today.";
  }, [arts, briefArts]);

  return (
    <div style={{background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16}}>
      <div style={{fontSize: 13, fontWeight: 700, marginBottom: 4}}>Good morning, Chris • Your Digest</div>
      <div style={{fontSize: 12, lineHeight: 1.5, opacity: 0.9}}>{digestText}</div>
      <button style={{marginTop: 10, background: '#fff', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600}}
        onClick={() => alert('Full AI digest coming — call your summarize API here with top headlines')}>
        Generate Full AI Brief
      </button>
    </div>
  );
}

// Enhanced SocialPage
function SocialPage({ getSummary, summaries, sumLoading, saveArt, isSaved, readLaterArt, isReadLater }) {
  const [ytChannels] = useState(() => load('yt_channels', DEFAULT_YT));
  const [twitterAccounts] = useState(() => load('tw_accounts', DEFAULT_TWITTER));
  const [ytFilter, setYtFilter] = useState('all');
  const [ytVideos, setYtVideos] = useState({});
  const [ytLoading, setYtLoading] = useState(false);

  // Load YouTube (your original logic)
  const loadYt = useCallback(async () => { /* your original loadYt */ }, []);

  useEffect(() => { loadYt(); }, [loadYt]);

  const allVideos = Object.values(ytVideos).flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const filteredVideos = ytFilter === 'all' ? allVideos : allVideos.filter(v => v.category === ytFilter);

  // Placeholder for mixed social feed (extend with real X fetch later)
  const mixedSocial = useMemo(() => {
    return [...filteredVideos.slice(0, 6), ...twitterAccounts.slice(0, 4).map(acc => ({
      title: `Latest from @${acc.handle}`,
      link: `https://twitter.com/${acc.handle}`,
      desc: `${acc.label} updates`,
      img: '',
      source: 'X',
      cat: 'social'
    }))];
  }, [filteredVideos, twitterAccounts]);

  return (
    <div className="social-page" style={{padding: 16}}>
      <div className="social-header"> {/* your original header */} </div>

      {/* New: Unified Latest Social */}
      <div style={{marginBottom: 24}}>
        <div style={{fontSize: 15, fontWeight: 700, marginBottom: 12}}>Latest from Social</div>
        <div className="yt-grid">
          {mixedSocial.slice(0, 12).map((item, i) => (
            <div key={i} className="yt-card" onClick={() => window.open(item.link, '_blank')}>
              {/* card rendering similar to FeedCard for consistency */}
              <div style={{padding: 12}}>
                <div style={{fontWeight: 700}}>{item.title}</div>
                <div style={{fontSize: 11, color: '#888', marginTop: 4}}>{item.source}</div>
                <div className="yt-card-acts" style={{marginTop: 10}}>
                  <button onClick={e => { e.stopPropagation(); window.open(item.link, '_blank'); }}>Open</button>
                  <button onClick={e => { e.stopPropagation(); getSummary(artId(item), item.title, item.desc, e); }}>AI</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rest of your original Social sections (YouTube filters, Twitter grid, LinkedIn) remain */}
      {/* ... your original SocialPage content ... */}
    </div>
  );
}

// Enhanced PodcastsPage
function PodcastsPage({ podEps, podLoading, activePod, setActivePod, getSummary, summaries, sumLoading, saveArt, isSaved }) {
  const [queue, setQueue] = useState(() => load('pod_queue', []));
  const [nowPlaying, setNowPlaying] = useState(null);

  const allEps = useMemo(() => {
    let eps = [];
    PODCAST_FEEDS.forEach(p => {
      (podEps[p.name] || []).forEach(e => eps.push({ ...e, show: p.name, host: p.host }));
    });
    return eps.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  }, [podEps]);

  // Continue Listening (last 2 with progress simulation)
  const continueListening = useMemo(() => allEps.slice(0, 2), [allEps]);

  return (
    <div className="pod-page">
      {/* New: Continue Listening Banner */}
      {continueListening.length > 0 && (
        <div style={{background: '#e11d48', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 16}}>
          <div style={{fontWeight: 700}}>Continue Listening</div>
          {continueListening.map((ep, i) => (
            <div key={i} style={{marginTop: 8, display: 'flex', gap: 10, alignItems: 'center'}}>
              <button onClick={() => setNowPlaying(ep)}>▶ {ep.title.slice(0, 40)}...</button>
            </div>
          ))}
        </div>
      )}

      {/* Rest of your Podcasts UI with added queue and sticky mini-player if nowPlaying */}
      {/* ... your original PodcastsPage content ... */}

      {/* Sticky Mini Player (mobile friendly) */}
      {nowPlaying && (
        <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', padding: 12, borderTop: '1px solid #333', zIndex: 400}}>
          <audio controls autoPlay src={nowPlaying.link} style={{width: '100%'}} />
          <button onClick={() => setNowPlaying(null)}>Close</button>
        </div>
      )}
    </div>
  );
}

// Main NewsHub component with layout improvements
export default function NewsHub() {
  // All your original state variables...

  const [lastVisit, setLastVisit] = useState(() => load('lastVisit', Date.now()));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

  // Time-of-day logic for smart defaults
  const hour = new Date().getHours();
  const isMorning = hour < 10;

  // Collapsible state for mobile sections
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (cat) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }));

  // Enhanced TodayPage with Morning Digest and collapsible sections
  function TodayPage() {
    return (
      <div className="main">
        <div className="main-feed">
          <MorningDigest arts={arts} briefArts={briefArts} kw={kw} />

          {/* Your Topics — made scrollable chips */}
          <div className="follow-section">
            <div className="follow-title">Your Topics</div>
            <div style={{display: 'flex', overflowX: 'auto', gap: 8, padding: '8px 0'}}>
              {['Houston','Astros','Texans','Energy','Oil','AI','Trump','Fed','Kentucky','Clemson','Bloom Energy'].map(t => (
                <span key={t} className={'follow-pill' + (following.includes(t) ? ' following' : '')} onClick={() => toggleFollow(t)}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Collapsible sections on mobile */}
          {MAIN_CATS.map(cat => {
            const arts2 = sorted(cat);
            const cc = CATS[cat] || CATS.general;
            const isCol = collapsed[cat] !== false; // default open
            return (
              <div key={cat} className="section" style={{marginBottom: 16}}>
                <div className="section-head" onClick={isMobile ? () => toggleCollapse(cat) : undefined} style={{cursor: isMobile ? 'pointer' : 'default'}}>
                  <div className="section-label">
                    <div className="section-dot" style={{background: cc.color}} /> {cc.label} <span className="section-count">{arts2.length}</span>
                  </div>
                  {isMobile && <span>{isCol ? '▼' : '▶'}</span>}
                </div>
                {(!isMobile || isCol) && (
                  <div className="h-row">
                    {arts2.slice(0, 8).map((a, i) => <PicCard key={i} a={a} cat={cat} wide={i===0} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar or Floating Quick View on mobile */}
        <div className="sidebar-col">
          <ScoresSection />
          {/* Trending, Read Later, Alerts — your original sidebar content */}
        </div>

        {/* Mobile floating button for Quick View */}
        {isMobile && (
          <button style={{position: 'fixed', bottom: 80, right: 20, background: '#1d4ed8', color: '#fff', borderRadius: '50%', width: 56, height: 56, fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}
            onClick={() => alert('Quick View: Scores + Trending — expand this into a bottom sheet in future')}>
            📊
          </button>
        )}
      </div>
    );
  }

  // Rest of your original NewsHub component (CatPage, BriefingPage, SavedPage, CustomizePanel, hero, ticker, etc.)
  // Apply similar mobile tweaks to hero height, card sizes, etc.

  // In return statement:
  return (
    <>
      <style>{css /* add your updated CSS with mobile media queries below */}</style>
      <div className={'hub' + (dark ? ' dark' : '')}>
        {/* Your topbar, StockBar, WeatherBar, breaking banner — unchanged */}

        {/* Hero with reduced mobile height via CSS */}

        {tab === 'today' && <TodayPage />}
        {MAIN_CATS.includes(tab) && <CatPage cat={tab} />}
        {/* other tabs */}

        {/* Add pull-to-refresh hint or logic if desired */}
      </div>
    </>
  );
}

// Updated CSS additions (append to your existing css string)
const extraCSS = `
@media (max-width: 900px) {
  :root { --hero-h: 280px; }
  .main { grid-template-columns: 1fr; padding: 12px; gap: 12px; }
  .h-row { gap: 12px; padding: 12px 0; }
  .pic-card { width: 260px; }
  .section-head { padding: 14px 16px; }
  .follow-pills { flex-wrap: nowrap; overflow-x: auto; }
}

/* Sticky mini player styles already in Podcasts */
`;

// Paste your full original css + extraCSS

// Note: For full ERCOT widget or real X RSS, add a new fetch function using public ERCOT API endpoints (e.g., grid conditions) and a Twitter RSS proxy if needed.
