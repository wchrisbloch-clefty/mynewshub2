'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Bell, Settings, Home, Compass, Mic2, Radio,
  Moon, Sun, ChevronDown, ChevronUp, Check, Bookmark,
  ExternalLink, Copy, RefreshCw, TrendingUp, Users,
  BarChart3, Send, Clock,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   PLATFORM STATUS
═══════════════════════════════════════════════════════════════ */
const PLATFORM_STATUS = {
  YouTube:   'live',
  X:         'manual',
  LinkedIn:  'manual',
  Instagram: 'manual',
};

/* ═══════════════════════════════════════════════════════════════
   PLATFORM CONFIG
═══════════════════════════════════════════════════════════════ */
const PLAT = {
  LinkedIn:  { color:'#0A66C2', bg:'#0A66C220', label:'LinkedIn',  icon:'in' },
  Instagram: { color:'#E1306C', bg:'#E1306C20', label:'Instagram', icon:'ig' },
  X:         { color:'#1D9BF0', bg:'#1D9BF020', label:'X',         icon:'𝕏'  },
  YouTube:   { color:'#FF0000', bg:'#FF000020', label:'YouTube',   icon:'▶'  },
};

/* ═══════════════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════════════ */
const T = {
  dark: {
    bg:'#06060F', surface:'#0B0B1A', border:'rgba(255,255,255,0.06)',
    text:'#F1F0FF', textSub:'rgba(241,240,255,0.5)', accent:'#6366F1',
    glass:'rgba(255,255,255,0.04)', accentBg:'rgba(99,102,241,0.15)',
  },
  light: {
    bg:'#F5F5FF', surface:'#FFFFFF', border:'rgba(0,0,0,0.08)',
    text:'#1A1A2E', textSub:'rgba(26,26,46,0.5)', accent:'#6366F1',
    glass:'rgba(0,0,0,0.03)', accentBg:'rgba(99,102,241,0.1)',
  },
};

/* ═══════════════════════════════════════════════════════════════
   SIGNAL COLOR
═══════════════════════════════════════════════════════════════ */
function sigColor(s) {
  if (s === 'high')   return { bg:'rgba(16,185,129,0.15)', color:'#10B981', border:'rgba(16,185,129,0.3)'  };
  if (s === 'rising') return { bg:'rgba(245,158,11,0.15)', color:'#F59E0B', border:'rgba(245,158,11,0.3)'  };
  return                     { bg:'rgba(99,102,241,0.12)', color:'#6366F1', border:'rgba(99,102,241,0.25)' };
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════ */
const MOCK_POSTS = [
  {
    id:'p1', author:'TechInsider', platform:'YouTube', time:'2h ago',
    signal:'high', velocity:'+847%', bw:['AI','automation','future'], eng:'2.4M views',
    content:'The AI revolution isn\'t coming — it\'s already here. We just analyzed 10,000 job postings and the shift is staggering. 65% now require AI literacy as a baseline skill.\n\nHere\'s what every professional needs to know right now about staying relevant in 2025 and beyond.',
    url:'https://youtube.com',
  },
  {
    id:'p2', author:'GrowthHacker', platform:'LinkedIn', time:'4h ago',
    signal:'rising', velocity:'+312%', bw:['growth','B2B','saas'], eng:'18.2K likes',
    content:'Stop writing cold emails. Start writing warm intros.\n\nAfter sending 50,000 cold emails and 500 warm intros, the data is clear: warm intros convert at 31x the rate.\n\nHere\'s the exact framework I use to get warm intros from anyone in my network.',
    url:'https://linkedin.com',
  },
  {
    id:'p3', author:'VisualCreator', platform:'Instagram', time:'6h ago',
    signal:'moderate', velocity:'+89%', bw:['design','brand','color'], eng:'4.1K saves',
    content:'Color theory changed my entire design practice. This single palette generates more engagement than anything else I\'ve tried.\n\nSave this for your next project! The psychology behind each choice matters more than pure aesthetics.',
    url:'https://instagram.com',
  },
  {
    id:'p4', author:'StartupFocus', platform:'X', time:'1h ago',
    signal:'high', velocity:'+1.2K%', bw:['startup','vc','funding'], eng:'94.3K views',
    content:'Just closed our Series A. Here\'s what every investor asked that nobody talks about:\n\n1. Not your TAM (they assume it\'s large)\n2. Not your tech (they assume it works)\n3. They asked about your churn rate at month 13\n\nThread: why month 13 is the magic number for B2B SaaS.',
    url:'https://x.com',
  },
  {
    id:'p5', author:'ContentPro', platform:'LinkedIn', time:'8h ago',
    signal:'rising', velocity:'+234%', bw:['content','marketing','seo'], eng:'7.8K reactions',
    content:'LinkedIn\'s algorithm changed again. Here\'s what\'s actually working in 2025:\n\n✓ Carousels still reign supreme (3× text posts)\n✓ First-person stories outperform thought leadership\n✓ Comments in first 30 min = distribution gold\n✓ Polls are dead (engagement theater)\n\nThe platform rewards authenticity now.',
    url:'https://linkedin.com',
  },
  {
    id:'p6', author:'AIWeekly', platform:'YouTube', time:'12h ago',
    signal:'high', velocity:'+567%', bw:['llm','gpt','claude'], eng:'1.1M views',
    content:'We tested every major AI model on 500 real business tasks. The results will change how you use AI forever.\n\nSpoiler: The winner wasn\'t who you expected. And the gap between #1 and #2 is enormous. Full breakdown inside.',
    url:'https://youtube.com',
  },
];

const MOCK_ALERTS = [
  { id:'a1', type:'spike',      title:'Viral spike detected',    body:'TechInsider\'s latest video crossed 2M views in 4h — 12× your avg engagement.',        time:'2m ago',  read:false },
  { id:'a2', type:'trend',      title:'Trending topic emerging', body:'"AI agents" spiking +340% across LinkedIn — 3 posts from your network already viral.', time:'15m ago', read:false },
  { id:'a3', type:'competitor', title:'Competitor activity',     body:'GrowthHacker posted 3 viral threads today. Their engagement is up 180% this week.',    time:'1h ago',  read:false },
  { id:'a4', type:'mention',    title:'Brand mention detected',  body:'Your content was referenced in 2 high-signal posts today.',                             time:'2h ago',  read:true  },
];

/* ═══════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════ */
function useWindowSize() {
  const [size, setSize] = useState({ w:1280, h:800 });
  useEffect(() => {
    const upd = () => setSize({ w:window.innerWidth, h:window.innerHeight });
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  return size;
}

const YT_HANDLES = ['@mkbhd', '@veritasium', '@fireship'];

function useLiveYouTube(handles) {
  const [livePosts, setLivePosts] = useState([]);
  const [status, setStatus]       = useState('idle');
  const cacheKey = (handles || []).join(',');

  const reload = useCallback(async () => {
    if (!handles?.length) return;
    setStatus('loading');
    try {
      const res  = await fetch('/api/youtube', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ action:'channels', handles }),
      });
      const data = await res.json();
      if (data.needsKey) { setStatus('nokey'); return; }
      setLivePosts(data.posts || []);
      setStatus('live');
    } catch {
      setStatus('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => { reload(); }, [reload]);
  return { livePosts, status, reload };
}

/* ═══════════════════════════════════════════════════════════════
   POST CARD
═══════════════════════════════════════════════════════════════ */
function PostCard({ post, t, bookmarks, onBookmark, compact }) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const cfg    = PLAT[post.platform] || PLAT.LinkedIn;
  const sig    = sigColor(post.signal);
  const bk     = bookmarks?.some(b => b.id === post.id);
  const isLong = post.content.length > 160;

  const displayContent = compact
    ? post.content.slice(0, 110) + '…'
    : expanded
      ? post.content
      : post.content.slice(0, 160);

  const copyText = () => {
    navigator.clipboard?.writeText(`@${post.author} on ${post.platform}:\n\n${post.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, fontWeight:700, fontSize:13, flexShrink:0 }}>
          {post.author[0]}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14, color:t.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>@{post.author}</div>
          <div style={{ fontSize:12, color:t.textSub }}>{post.time}</div>
        </div>
        <span style={{ background:cfg.bg, color:cfg.color, borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:600, flexShrink:0 }}>{cfg.label}</span>
        <span style={{ background:sig.bg, color:sig.color, border:`1px solid ${sig.border}`, borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:600, flexShrink:0 }}>
          {post.signal} {post.velocity}
        </span>
      </div>

      <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:t.text, whiteSpace:'pre-line' }}>
        {displayContent}{isLong && !expanded && !compact && '…'}
      </p>

      {isLong && !compact && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background:'none', border:'none', cursor:'pointer', color:t.accent, fontSize:13, fontWeight:600, padding:0, display:'flex', alignItems:'center', gap:4 }}
        >
          {expanded ? <><ChevronUp size={14}/>Show less</> : <><ChevronDown size={14}/>Read full post</>}
        </button>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
        {(post.bw || []).map(tag => (
          <span key={tag} style={{ background:t.glass, color:t.textSub, borderRadius:6, padding:'2px 8px', fontSize:11 }}>#{tag}</span>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button
            onClick={copyText}
            style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:8, padding:'4px 10px', cursor:'pointer', color:copied?'#10B981':t.textSub, fontSize:12, display:'flex', alignItems:'center', gap:4 }}
          >
            <Copy size={11}/>{copied ? 'Copied!' : 'Copy'}
          </button>
          {onBookmark && (
            <button
              onClick={() => onBookmark(post)}
              style={{ background:bk?t.accentBg:t.glass, border:`1px solid ${bk?t.accent:t.border}`, borderRadius:8, padding:'4px 10px', cursor:'pointer', color:bk?t.accent:t.textSub, fontSize:12, display:'flex', alignItems:'center', gap:4 }}
            >
              <Bookmark size={11}/>{bk ? 'Saved' : 'Save'}
            </button>
          )}
          <a
            href={post.url} target="_blank" rel="noopener noreferrer"
            style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:8, padding:'4px 10px', textDecoration:'none', color:t.textSub, fontSize:12, display:'flex', alignItems:'center', gap:4 }}
          >
            <ExternalLink size={11}/>Open
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEED VIEW
═══════════════════════════════════════════════════════════════ */
function FeedView({ t, activeFilter, setActiveFilter, onNav, isMobile }) {
  const [bookmarks, setBookmarks] = useState([]);
  const { livePosts, status, reload } = useLiveYouTube(YT_HANDLES);

  const platforms = ['All', 'YouTube', 'LinkedIn', 'X', 'Instagram'];

  const allPosts = [
    ...livePosts,
    ...MOCK_POSTS.filter(p =>
      !(p.platform === 'YouTube' && livePosts.length > 0)
    ),
  ];

  const filtered = activeFilter === 'All'
    ? allPosts
    : allPosts.filter(p => p.platform === activeFilter);

  const toggleBookmark = (post) =>
    setBookmarks(bk =>
      bk.some(b => b.id === post.id) ? bk.filter(b => b.id !== post.id) : [...bk, post]
    );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {status === 'live' && livePosts.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'8px 12px' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', display:'inline-block', flexShrink:0 }}/>
          <span style={{ color:'#10B981', fontSize:13, fontWeight:600 }}>YouTube live · {livePosts.length} videos</span>
          <button onClick={reload} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#10B981', display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
            <RefreshCw size={12}/>Refresh
          </button>
        </div>
      )}

      {status === 'nokey' && (
        <button
          onClick={() => onNav('settings')}
          style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, padding:'8px 12px', cursor:'pointer', width:'100%', textAlign:'left' }}
        >
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B', display:'inline-block', flexShrink:0 }}/>
          <span style={{ color:'#F59E0B', fontSize:13, fontWeight:600 }}>Add YouTube API key → enable live feed</span>
          <span style={{ marginLeft:'auto', color:'#F59E0B', fontSize:12 }}>Settings ›</span>
        </button>
      )}

      {status === 'loading' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:'8px 12px' }}>
          <span style={{ color:'rgba(99,102,241,0.7)', fontSize:13 }}>Loading live YouTube data…</span>
        </div>
      )}

      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {platforms.map(p => (
          <button
            key={p} onClick={() => setActiveFilter(p)}
            style={{ background:activeFilter===p?t.accentBg:t.glass, border:`1px solid ${activeFilter===p?t.accent:t.border}`, borderRadius:20, padding:'6px 14px', cursor:'pointer', color:activeFilter===p?t.accent:t.textSub, fontSize:13, fontWeight:activeFilter===p?600:400, whiteSpace:'nowrap', flexShrink:0 }}
          >
            {p}
          </button>
        ))}
      </div>

      {bookmarks.length > 0 && (
        <div style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:12, padding:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:t.textSub, marginBottom:8 }}>Saved · {bookmarks.length}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {bookmarks.map(b => (
              <span key={b.id} style={{ background:t.accentBg, color:t.accent, borderRadius:8, padding:'3px 10px', fontSize:12 }}>@{b.author}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
        {filtered.map(post => (
          <PostCard key={post.id} post={post} t={t} bookmarks={bookmarks} onBookmark={toggleBookmark}/>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', color:t.textSub, padding:40, fontSize:14 }}>
            No posts for this filter.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVER VIEW
═══════════════════════════════════════════════════════════════ */
function DiscoverView({ t, isMobile }) {
  const topics = [
    { label:'AI & Automation',  count:'+1.2K posts', color:'#10B981' },
    { label:'Creator Economy',  count:'+843 posts',  color:'#F59E0B' },
    { label:'Web3 / DeFi',      count:'+567 posts',  color:'#F59E0B' },
    { label:'B2B SaaS',         count:'+421 posts',  color:'#6366F1' },
    { label:'Personal Brand',   count:'+389 posts',  color:'#6366F1' },
    { label:'Product Design',   count:'+234 posts',  color:'#6366F1' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:18, fontWeight:700, color:t.text }}>Trending Topics</div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12 }}>
        {topics.map((tp, i) => (
          <div key={i} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <div>
              <div style={{ fontWeight:600, color:t.text, fontSize:14 }}>{tp.label}</div>
              <div style={{ color:tp.color, fontSize:12, fontWeight:600, marginTop:4 }}>{tp.count} today</div>
            </div>
            <TrendingUp size={20} color={tp.color}/>
          </div>
        ))}
      </div>

      <div style={{ fontSize:18, fontWeight:700, color:t.text, marginTop:8 }}>Top Creators to Follow</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {MOCK_POSTS.slice(0, 4).map(post => (
          <PostCard key={post.id} post={post} t={t} compact/>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INTELLIGENCE VIEW
═══════════════════════════════════════════════════════════════ */
function IntelligenceView({ t, isMobile }) {
  const metrics = [
    { label:'Reach this week',     value:'2.4M', delta:'+12%',  good:true  },
    { label:'Avg engagement rate', value:'4.8%', delta:'+0.6%', good:true  },
    { label:'Content velocity',    value:'3.2×', delta:'+0.4×', good:true  },
    { label:'Share of voice',      value:'8.1%', delta:'-0.3%', good:false },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:18, fontWeight:700, color:t.text }}>Market Intelligence</div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:16 }}>
            <div style={{ fontSize:13, color:t.textSub, marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:t.text }}>{m.value}</div>
            <div style={{ fontSize:12, fontWeight:600, color:m.good?'#10B981':'#EF4444', marginTop:4 }}>{m.delta} vs last week</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:16, fontWeight:700, color:t.text, marginTop:8 }}>Signal Breakdown</div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12 }}>
        {MOCK_POSTS.slice(0, 4).map(post => {
          const sig = sigColor(post.signal);
          return (
            <div key={post.id} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:14, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:t.text }}>@{post.author}</div>
                <div style={{ fontSize:12, color:t.textSub }}>{post.platform} · {post.eng}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ background:sig.bg, color:sig.color, border:`1px solid ${sig.border}`, borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:600, display:'block' }}>{post.signal}</span>
                <div style={{ fontSize:12, color:sig.color, marginTop:4 }}>{post.velocity}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STUDIO VIEW
═══════════════════════════════════════════════════════════════ */
function StudioView({ t, isMobile }) {
  const [draft,     setDraft]     = useState('');
  const [platform,  setPlatform]  = useState('LinkedIn');
  const [scheduled, setScheduled] = useState(null);
  const [posts,     setPosts]     = useState([]);

  const schedule = () => {
    if (!draft.trim()) return;
    const newPost = {
      id: `s${Date.now()}`, author:'You', platform,
      time:'Just now', signal:'moderate', velocity:'+0%',
      bw:[], eng:'0', content:draft, url:'#',
    };
    setPosts(p => [newPost, ...p]);
    setScheduled(platform);
    setDraft('');
    setTimeout(() => setScheduled(null), 3000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:18, fontWeight:700, color:t.text }}>Content Studio</div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 300px', gap:16 }}>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {Object.keys(PLAT).map(p => (
                <button
                  key={p} onClick={() => setPlatform(p)}
                  style={{ background:platform===p?PLAT[p].bg:t.glass, border:`1px solid ${platform===p?PLAT[p].color:t.border}`, borderRadius:8, padding:'5px 12px', cursor:'pointer', color:platform===p?PLAT[p].color:t.textSub, fontSize:13, fontWeight:platform===p?600:400 }}
                >
                  {PLAT[p].label}
                </button>
              ))}
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={`Write your ${platform} post…`}
              rows={6}
              style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:12, padding:12, color:t.text, fontSize:14, lineHeight:1.6, resize:'vertical', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:t.textSub }}>{draft.length} chars</span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setDraft('')} style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 16px', cursor:'pointer', color:t.textSub, fontSize:13 }}>Clear</button>
                <button onClick={schedule} style={{ background:t.accent, border:'none', borderRadius:8, padding:'8px 20px', cursor:'pointer', color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                  <Send size={14}/>Post Now
                </button>
              </div>
            </div>
            {scheduled && (
              <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'10px 14px', color:'#10B981', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                <Check size={14}/>Posted to {scheduled}!
              </div>
            )}
          </div>

          {posts.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:14, fontWeight:600, color:t.textSub }}>Drafted</div>
              {posts.map(p => <PostCard key={p.id} post={p} t={t} compact/>)}
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:12 }}>Best Times to Post</div>
            {[
              { day:'Mon–Wed', time:'8–9am',  label:'LinkedIn peak' },
              { day:'Thu–Fri', time:'12–1pm', label:'X peak'        },
              { day:'Sat–Sun', time:'10–11am',label:'YouTube peak'  },
            ].map((bt, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<2?`1px solid ${t.border}`:'none' }}>
                <div>
                  <div style={{ fontSize:13, color:t.text, fontWeight:500 }}>{bt.day}</div>
                  <div style={{ fontSize:11, color:t.textSub }}>{bt.label}</div>
                </div>
                <span style={{ background:t.accentBg, color:t.accent, borderRadius:8, padding:'3px 8px', fontSize:12, fontWeight:600 }}>{bt.time}</span>
              </div>
            ))}
          </div>

          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:10 }}>Trending Hooks</div>
            {[
              '"I spent 30 days doing X. Here\'s what I learned:"',
              '"Nobody talks about this:"',
              '"Stop doing X. Start doing Y:"',
            ].map((hook, i) => (
              <div
                key={i}
                onClick={() => setDraft(d => hook + '\n\n' + d)}
                style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:10, padding:'10px 12px', marginBottom:i<2?8:0, fontSize:13, color:t.textSub, cursor:'pointer', lineHeight:1.5 }}
              >
                {hook}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ALERTS VIEW
═══════════════════════════════════════════════════════════════ */
function AlertsView({ t }) {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const markRead    = (id) => setAlerts(a => a.map(al => al.id === id ? { ...al, read:true } : al));
  const markAllRead = ()   => setAlerts(a => a.map(al => ({ ...al, read:true })));

  const typeStyle = (type) => {
    if (type === 'spike')      return { bg:'rgba(16,185,129,0.12)', color:'#10B981', border:'rgba(16,185,129,0.3)', icon:<Zap size={14}/>       };
    if (type === 'trend')      return { bg:'rgba(99,102,241,0.12)', color:'#6366F1', border:'rgba(99,102,241,0.3)', icon:<TrendingUp size={14}/> };
    if (type === 'competitor') return { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'rgba(245,158,11,0.3)', icon:<Users size={14}/>      };
    return                            { bg:'rgba(99,102,241,0.08)', color:'#6366F1', border:'rgba(99,102,241,0.2)', icon:<Bell size={14}/>       };
  };

  const unread = alerts.filter(a => !a.read).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:18, fontWeight:700, color:t.text, display:'flex', alignItems:'center', gap:8 }}>
          Alerts
          {unread > 0 && (
            <span style={{ background:'#EF4444', color:'#fff', borderRadius:20, padding:'2px 8px', fontSize:13 }}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', color:t.textSub, fontSize:13 }}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {alerts.map(alert => {
          const s = typeStyle(alert.type);
          return (
            <div
              key={alert.id}
              style={{ borderRadius:14, padding:'14px 16px', background:alert.read?t.glass:s.bg, border:`1px solid ${alert.read?t.border:s.border}`, opacity:alert.read?0.5:1, transition:'opacity 0.3s, background 0.3s, border-color 0.3s' }}
            >
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:alert.read?t.glass:s.bg, border:`1px solid ${alert.read?t.border:s.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:alert.read?t.textSub:s.color, flexShrink:0, marginTop:2 }}>
                  {alert.read ? <Check size={13}/> : s.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:alert.read?t.textSub:s.color, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    {alert.title}
                    {alert.read && <span style={{ fontStyle:'italic', fontSize:11, fontWeight:400, color:t.textSub }}>read</span>}
                  </div>
                  <div style={{ fontSize:13, color:t.textSub, marginTop:4, lineHeight:1.5 }}>{alert.body}</div>
                  <div style={{ fontSize:11, color:t.textSub, marginTop:6, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={10}/>{alert.time}</span>
                    {!alert.read
                      ? (
                        <button
                          onClick={() => markRead(alert.id)}
                          style={{ background:'none', border:`1px solid ${s.border}`, borderRadius:6, padding:'2px 8px', cursor:'pointer', color:s.color, fontSize:11, display:'flex', alignItems:'center', gap:4 }}
                        >
                          <Check size={10}/>Mark Read
                        </button>
                      ) : (
                        <span style={{ color:'#10B981', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                          <Check size={10}/>Done
                        </span>
                      )
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOURCES VIEW
═══════════════════════════════════════════════════════════════ */
function SourcesView({ t, isMobile }) {
  const sources = [
    { name:'YouTube',   connected:true,  followers:'—',    posts:6,  desc:'Video content · live data' },
    { name:'LinkedIn',  connected:true,  followers:'2.4K', posts:12, desc:'Professional network'      },
    { name:'Instagram', connected:false, followers:'—',    posts:0,  desc:'Visual content'            },
    { name:'X',         connected:true,  followers:'8.1K', posts:34, desc:'Real-time conversations'   },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:18, fontWeight:700, color:t.text }}>Connected Sources</div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12 }}>
        {sources.map(pl => {
          const cfg = PLAT[pl.name];
          const dataStatus   = PLATFORM_STATUS[pl.name];
          const statusPill   = dataStatus === 'live'
            ? { bg:'rgba(16,185,129,0.12)', color:'#10B981', label:'● live'   }
            : { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', label:'○ manual' };
          return (
            <div key={pl.name} style={{ background:t.surface, border:`1px solid ${pl.connected?cfg.color+'40':t.border}`, borderRadius:16, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, fontWeight:700, fontSize:14 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:t.text }}>{pl.name}</div>
                  <div style={{ fontSize:12, color:t.textSub }}>{pl.desc}</div>
                </div>
                <span style={{ background:statusPill.bg, color:statusPill.color, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, flexShrink:0 }}>
                  {statusPill.label}
                </span>
              </div>
              <div style={{ display:'flex', gap:20 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:t.text }}>{pl.followers}</div>
                  <div style={{ fontSize:11, color:t.textSub }}>Followers</div>
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:t.text }}>{pl.posts}</div>
                  <div style={{ fontSize:11, color:t.textSub }}>Posts tracked</div>
                </div>
              </div>
              <button style={{ background:pl.connected?t.glass:cfg.bg, border:`1px solid ${pl.connected?t.border:cfg.color}`, borderRadius:10, padding:'8px 14px', cursor:'pointer', color:pl.connected?t.textSub:cfg.color, fontSize:13, fontWeight:600 }}>
                {pl.connected ? 'Manage' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS VIEW
═══════════════════════════════════════════════════════════════ */
function SettingsView({ t, dark, onDark, isMobile }) {
  const [keys,  setKeys]  = useState({ YOUTUBE_API_KEY:'', GROQ_API_KEY:'', GEMINI_API_KEY:'', ANTHROPIC_API_KEY:'', OPENAI_API_KEY:'' });
  const [saved, setSaved] = useState({});

  const save = (k) => {
    setSaved(s => ({ ...s, [k]:true }));
    setTimeout(() => setSaved(s => ({ ...s, [k]:false })), 2000);
  };

  const apiRows = [
    { key:'YOUTUBE_API_KEY',   label:'YouTube API Key',   hint:'Free · console.cloud.google.com · powers LIVE YouTube feed', color:'#FF0000', urgent:true  },
    { key:'GROQ_API_KEY',      label:'Groq API Key',      hint:'Free tier · console.groq.com · AI brief generation',         color:'#F97316', urgent:false },
    { key:'GEMINI_API_KEY',    label:'Gemini API Key',    hint:'Free tier · aistudio.google.com · AI fallback',              color:'#4285F4', urgent:false },
    { key:'ANTHROPIC_API_KEY', label:'Anthropic API Key', hint:'claude.ai · AI fallback #2',                                 color:'#6366F1', urgent:false },
    { key:'OPENAI_API_KEY',    label:'OpenAI API Key',    hint:'platform.openai.com · optional AI fallback',                 color:'#10B981', urgent:false },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:800 }}>
      <div style={{ fontSize:18, fontWeight:700, color:t.text }}>Settings</div>

      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:16 }}>Appearance</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:t.text }}>Dark mode</div>
            <div style={{ fontSize:12, color:t.textSub }}>Switch between dark and light theme</div>
          </div>
          <button
            onClick={onDark}
            style={{ width:48, height:26, borderRadius:13, background:dark?t.accent:'rgba(120,120,140,0.3)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}
          >
            <span style={{ position:'absolute', top:3, left:dark?24:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', display:'block' }}/>
          </button>
        </div>
      </div>

      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:4 }}>API Keys</div>
        <div style={{ fontSize:12, color:t.textSub, marginBottom:16 }}>Keys are stored in Vercel environment variables. Never share them publicly.</div>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
          {apiRows.map(({ key:k, label, hint, color, urgent }) => (
            <div
              key={k}
              style={{ display:'flex', flexDirection:'column', gap:6, background:urgent&&!keys[k]?`${color}08`:t.glass, border:`1px solid ${urgent&&!keys[k]?color+'40':t.border}`, borderRadius:12, padding:14 }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:keys[k]?'#10B981':color, flexShrink:0 }}/>
                <div style={{ fontSize:13, fontWeight:600, color:t.text }}>{label}</div>
                {urgent && !keys[k] && (
                  <span style={{ background:`${color}20`, color, borderRadius:6, padding:'1px 6px', fontSize:10, fontWeight:700 }}>NEEDED</span>
                )}
              </div>
              <div style={{ fontSize:11, color:t.textSub, lineHeight:1.5 }}>{hint}</div>
              <div style={{ display:'flex', gap:6 }}>
                <input
                  type="password"
                  placeholder={`Enter ${label}…`}
                  value={keys[k]}
                  onChange={e => setKeys(prev => ({ ...prev, [k]:e.target.value }))}
                  style={{ flex:1, background:t.bg, border:`1px solid ${t.border}`, borderRadius:8, padding:'7px 10px', color:t.text, fontSize:13, outline:'none', fontFamily:'monospace', minWidth:0 }}
                />
                <button
                  onClick={() => save(k)}
                  style={{ background:saved[k]?'rgba(16,185,129,0.15)':t.accentBg, border:`1px solid ${saved[k]?'rgba(16,185,129,0.4)':t.accent}`, borderRadius:8, padding:'7px 14px', cursor:'pointer', color:saved[k]?'#10B981':t.accent, fontSize:13, fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}
                >
                  {saved[k] ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INTELLIGENCE PANEL
═══════════════════════════════════════════════════════════════ */
function IntelPanel({ t }) {
  const trending   = ['#AIAgents','#CreatorEconomy','#B2BSaaS','#IndieHackers','#LinkedInAlgorithm'];
  const buzzwords  = ['velocity','compounding','leverage','flywheel','moat','founder','PLG','narrative'];
  const recommended = MOCK_POSTS.filter(p => p.signal === 'high').slice(0, 2);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
        <div style={{ fontWeight:700, fontSize:14, color:t.text, marginBottom:12 }}>Trending Now</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {trending.map((tag, i) => (
            <div key={tag} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:t.textSub, fontSize:12, width:20, textAlign:'right', flexShrink:0 }}>#{i+1}</span>
              <span style={{ color:t.accent, fontSize:13, fontWeight:600 }}>{tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
        <div style={{ fontWeight:700, fontSize:14, color:t.text, marginBottom:12 }}>Buzzwords</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {buzzwords.map(w => (
            <span key={w} style={{ background:t.accentBg, color:t.accent, borderRadius:20, padding:'4px 10px', fontSize:12, fontWeight:600 }}>{w}</span>
          ))}
        </div>
      </div>

      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
        <div style={{ fontWeight:700, fontSize:14, color:t.text, marginBottom:12 }}>Recommended Viewings</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {recommended.map(post => {
            const cfg = PLAT[post.platform];
            return (
              <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, fontSize:12, fontWeight:700, flexShrink:0 }}>
                  {cfg.icon}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:t.text, lineHeight:1.4 }}>{post.content.slice(0, 60)}…</div>
                  <div style={{ fontSize:11, color:t.textSub, marginTop:2 }}>@{post.author} · {post.eng}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id:'feed',         label:'Feed',         icon:<Home size={18}/>      },
  { id:'discover',     label:'Discover',     icon:<Compass size={18}/>   },
  { id:'intelligence', label:'Intelligence', icon:<BarChart3 size={18}/> },
  { id:'studio',       label:'Studio',       icon:<Mic2 size={18}/>      },
  { id:'alerts',       label:'Alerts',       icon:<Bell size={18}/>      },
  { id:'sources',      label:'Sources',      icon:<Radio size={18}/>     },
  { id:'settings',     label:'Settings',     icon:<Settings size={18}/>  },
];

function TopNav({ t, view, setView, dark, onDark, unreadAlerts }) {
  return (
    <div style={{ position:'sticky', top:0, zIndex:100, background:t.bg, borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center', gap:8, padding:'12px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:20, flexShrink:0 }}>
        <Zap size={20} color={t.accent} fill={t.accent}/>
        <span style={{ fontWeight:800, fontSize:18, color:t.text, fontFamily:'var(--font-syne, sans-serif)', whiteSpace:'nowrap' }}>AetherHub</span>
      </div>
      <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id} onClick={() => setView(item.id)}
            style={{ background:view===item.id?t.accentBg:'none', border:`1px solid ${view===item.id?t.accent:'transparent'}`, borderRadius:10, padding:'6px 12px', cursor:'pointer', color:view===item.id?t.accent:t.textSub, fontSize:13, fontWeight:view===item.id?600:400, display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', flexShrink:0, position:'relative' }}
          >
            {item.icon}{item.label}
            {item.id==='alerts' && unreadAlerts>0 && (
              <span style={{ position:'absolute', top:4, right:6, width:8, height:8, borderRadius:'50%', background:'#EF4444' }}/>
            )}
          </button>
        ))}
      </div>
      <button onClick={onDark} style={{ background:t.glass, border:`1px solid ${t.border}`, borderRadius:10, padding:'7px 10px', cursor:'pointer', color:t.textSub, display:'flex', alignItems:'center', flexShrink:0 }}>
        {dark ? <Sun size={16}/> : <Moon size={16}/>}
      </button>
    </div>
  );
}

function BottomNav({ t, view, setView, unreadAlerts }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:t.surface, borderTop:`1px solid ${t.border}`, display:'flex', zIndex:100 }}>
      {NAV_ITEMS.slice(0, 5).map(item => (
        <button
          key={item.id} onClick={() => setView(item.id)}
          style={{ flex:1, background:'none', border:'none', padding:'10px 4px 16px', cursor:'pointer', color:view===item.id?t.accent:t.textSub, display:'flex', flexDirection:'column', alignItems:'center', gap:3, position:'relative' }}
        >
          {item.icon}
          <span style={{ fontSize:10 }}>{item.label}</span>
          {item.id==='alerts' && unreadAlerts>0 && (
            <span style={{ position:'absolute', top:8, right:'calc(50% - 12px)', width:8, height:8, borderRadius:'50%', background:'#EF4444' }}/>
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function AetherHub() {
  const [dark,         setDark]         = useState(true);
  const [view,         setView]         = useState('feed');
  const [activeFilter, setActiveFilter] = useState('All');
  const { w } = useWindowSize();
  const isMobile  = w < 768;
  const showPanel = w >= 1120;
  const t = dark ? T.dark : T.light;
  const unreadAlerts = MOCK_ALERTS.filter(a => !a.read).length;

  return (
    <div style={{ minHeight:'100vh', background:t.bg, color:t.text, fontFamily:'var(--font-inter, system-ui, sans-serif)' }}>
      {!isMobile && (
        <TopNav t={t} view={view} setView={setView} dark={dark} onDark={() => setDark(d => !d)} unreadAlerts={unreadAlerts}/>
      )}

      <div style={{ display:'flex', maxWidth:1440, margin:'0 auto', padding:isMobile?'0 0 80px 0':'20px 20px 40px' }}>
        <div style={{ flex:1, minWidth:0, padding:isMobile?'16px 12px 0':'0 20px 0 0' }}>
          {view==='feed'         && <FeedView         t={t} activeFilter={activeFilter} setActiveFilter={setActiveFilter} onNav={setView} isMobile={isMobile}/>}
          {view==='discover'     && <DiscoverView     t={t} isMobile={isMobile}/>}
          {view==='intelligence' && <IntelligenceView t={t} isMobile={isMobile}/>}
          {view==='studio'       && <StudioView       t={t} isMobile={isMobile}/>}
          {view==='alerts'       && <AlertsView       t={t}/>}
          {view==='sources'      && <SourcesView      t={t} isMobile={isMobile}/>}
          {view==='settings'     && <SettingsView     t={t} dark={dark} onDark={() => setDark(d => !d)} isMobile={isMobile}/>}
        </div>

        {showPanel && (
          <div style={{ width:280, flexShrink:0 }}>
            <IntelPanel t={t}/>
          </div>
        )}
      </div>

      {isMobile && (
        <BottomNav t={t} view={view} setView={setView} unreadAlerts={unreadAlerts}/>
      )}
    </div>
  );
}
