import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  feeds: {
    general: [
      { name: "Houston Chronicle", url: "https://www.houstonchronicle.com/rss/feed/Top-News-238.php", active: true },
      { name: "Reuters Top News", url: "https://feeds.reuters.com/reuters/topNews", active: true },
      { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", active: true },
      { name: "TechCrunch", url: "https://techcrunch.com/feed/", active: true },
      { name: "AP News", url: "https://rsshub.app/ap/topics/apf-topnews", active: true },
      { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", active: true },
      { name: "Houston Business Journal", url: "https://www.bizjournals.com/houston/feed/latest/", active: true },
      { name: "Wired", url: "https://www.wired.com/feed/rss", active: true },
      { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml", active: true },
      { name: "CNN", url: "http://rss.cnn.com/rss/cnn_topstories.rss", active: true },
      { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", active: true },
      { name: "The Daily Wire", url: "https://www.dailywire.com/feeds/rss.xml", active: true },
    ],
    sports: [
      { name: "ESPN Top Headlines", url: "https://www.espn.com/espn/rss/news", active: true },
      { name: "ESPN NFL", url: "https://www.espn.com/espn/rss/nfl/news", active: true },
      { name: "ESPN MLB", url: "https://www.espn.com/espn/rss/mlb/news", active: true },
      { name: "ESPN College Football", url: "https://www.espn.com/espn/rss/ncf/news", active: true },
      { name: "ESPN College Basketball", url: "https://www.espn.com/espn/rss/ncb/news", active: true },
      { name: "247Sports", url: "https://247sports.com/feeds/articles/rss/", active: true },
      { name: "CBS Sports CFB", url: "https://www.cbssports.com/rss/headlines/college-football", active: true },
      { name: "On3 Kentucky", url: "https://www.on3.com/teams/kentucky-wildcats/rss/", active: true },
      { name: "On3 Clemson", url: "https://www.on3.com/teams/clemson-tigers/rss/", active: true },
      { name: "Kentucky Sports Radio", url: "https://kentuckysportsradio.com/feed/", active: true },
      { name: "TigerNet (Clemson)", url: "https://www.tigernet.com/rss/news", active: true },
      { name: "Talking Chop (Braves)", url: "https://www.talkingchop.com/rss/current", active: true },
      { name: "The Athletic", url: "https://theathletic.com/rss/", active: true },
      { name: "Bleacher Report", url: "https://bleacherreport.com/articles/feed", active: true },
      { name: "Pro Football Talk", url: "https://profootballtalk.nbcsports.com/feed/", active: true },
      { name: "SI.com", url: "https://www.si.com/rss/si_topstories.rss", active: true },
      { name: "MLB.com Braves", url: "https://www.mlb.com/feeds/news/rss.xml", active: true },
      { name: "Baseball America", url: "https://www.baseballamerica.com/feed/", active: true },
      { name: "Houston Rockets", url: "https://www.espn.com/espn/rss/nba/news", active: true },
    ],
    business: [
      { name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", active: true },
      { name: "Oil & Gas Journal", url: "https://www.ogj.com/rss", active: true },
      { name: "Data Center Dynamics", url: "https://www.datacenterdynamics.com/en/rss/", active: true },
      { name: "AI News", url: "https://artificialintelligence-news.com/feed/", active: true },
      { name: "S&P Global Energy", url: "https://www.spglobal.com/commodityinsights/en/rss-feed/oil", active: true },
      { name: "Hart Energy", url: "https://www.hartenergy.com/rss", active: true },
      { name: "MIT Tech Review", url: "https://www.technologyreview.com/feed/", active: true },
      { name: "Rigzone", url: "https://www.rigzone.com/news/rss/rigzone_latest.aspx", active: true },
      { name: "Utility Dive", url: "https://www.utilitydive.com/feeds/news/", active: true },
      { name: "Power Magazine", url: "https://www.powermag.com/feed/", active: true },
      { name: "Upstream Online", url: "https://www.upstreamonline.com/rss", active: true },
      { name: "Datacenter Knowledge", url: "https://www.datacenters.com/news/feed", active: true },
      { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", active: true },
      { name: "Wood Mackenzie", url: "https://www.woodmac.com/feed/", active: true },
      { name: "Natural Gas Intelligence", url: "https://www.naturalgasintel.com/feed/", active: true },
      { name: "E&E News", url: "https://www.eenews.net/rss/1", active: true },
    ],
    finance: [
      { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/", active: true },
      { name: "Kiplinger", url: "https://www.kiplinger.com/rss/all", active: true },
      { name: "Motley Fool", url: "https://www.fool.com/feeds/index.aspx", active: true },
      { name: "Investopedia", url: "https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline", active: true },
      { name: "Barron's", url: "https://www.barrons.com/xml/rss/3_7510.xml", active: true },
      { name: "Morningstar", url: "https://www.morningstar.com/feeds/all-articles.rss", active: true },
      { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", active: true },
      { name: "BiggerPockets", url: "https://www.biggerpockets.com/blog/feed", active: true },
      { name: "RiskHedge", url: "https://riskhedge.com/feed/", active: true },
    ],
    bloom: [
      { name: "Bloom Energy News", url: "https://www.bloomenergy.com/news/feed/", active: true },
      { name: "Fuel Cell Works", url: "https://fuelcellsworks.com/feed/", active: true },
      { name: "S&P Global Energy", url: "https://www.spglobal.com/commodityinsights/en/rss-feed/oil", active: true },
      { name: "Utility Dive", url: "https://www.utilitydive.com/feeds/news/", active: true },
    ],
  },
  keywords: {
    general: ["Houston", "Texas", "AI", "geopolitical", "technology", "OpenAI", "Google"],
    sports: ["Texans", "Astros", "Braves", "Kentucky Wildcats", "Clemson Tigers", "Big Blue", "recruiting", "247sports", "SEC", "ACC", "CJ Stroud", "Rockets"],
    business: ["data center", "power grid", "LNG", "energy transition", "AI infrastructure", "oil price", "natural gas", "hyperscaler", "nuclear", "ERCOT", "Texas grid", "power demand", "Microsoft", "Google", "Amazon", "pipeline"],
    finance: ["interest rates", "401k", "investing", "inflation", "stock market", "retirement", "dividend", "Fed", "S&P 500", "real estate", "tax planning", "wealth management", "passive income", "energy stocks"],
    bloom: ["Bloom Energy", "fuel cell", "solid oxide", "electrolyzer", "hydrogen", "distributed power", "microgrid", "natural gas power"],
  },
  social: {
    general: { twitter: ["@Bloomberg", "@Reuters", "@WSJ", "@FoxNews", "@CNN", "@CNBC", "@BBCWorld", "@DailyWire"], instagram: [], linkedin: [] },
    sports: {
      twitter: ["@HoustonTexans", "@astros", "@Braves", "@KentuckyMBB", "@ClemsonFB", "@247Sports", "@Rivals", "@On3Sports", "@ClemsonRivals", "@KentuckyRivals", "@MLBastros", "@AtlantaBraves"],
      instagram: ["@houstontexans", "@astros", "@braves", "@kentuckymbb", "@clemsonfootball", "@espn", "@nfl", "@mlb", "@247sports"],
      linkedin: [],
    },
    business: { twitter: ["@OilandGasJnl", "@HartEnergy", "@UtilityDive", "@EENews", "@PowerMag", "@OpenAI"], instagram: [], linkedin: ["Marathon Petroleum", "ExxonMobil", "Chevron", "Shell", "NRG Energy", "Google DeepMind"] },
    finance: { twitter: [], instagram: [], linkedin: [] },
    bloom: { twitter: ["@BloomEnergy", "@FuelCellsWorks", "@UtilityDive"], instagram: [], linkedin: ["Bloom Energy"] },
  },
};

const RSS_PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";
const STORAGE_KEY = "mynewshub_v14_full";

const TABS = [
  { id: "general", label: "General News", icon: "🌐" },
  { id: "sports", label: "Sports", icon: "🏆" },
  { id: "business", label: "Business & Energy", icon: "⚡" },
  { id: "finance", label: "Personal Finance", icon: "📈" },
  { id: "bloom", label: "Bloom Energy", icon: "🔋" },
];

const TAB_COLORS = {
  general: "#1d4ed8",
  sports: "#16a34a",
  business: "#ea580c",
  finance: "#7c3aed",
  bloom: "#0891b2",
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (isNaN(diff) || diff < 0) return "";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function cleanText(html, len = 150) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim().slice(0, len);
}

const iStyle = { padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontFamily: "'Lora', serif", color: "#1e293b", outline: "none", flex: 1, background: "#fff" };
const bStyle = { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", fontFamily: "'Lora', serif", whiteSpace: "nowrap" };

// ─── HERO CARD ─────────────────────────────────────────────────────────────────
function HeroCard({ item, tab }) {
  if (!item) return null;
  const color = TAB_COLORS[tab] || "#1d4ed8";
  const clean = cleanText(item.description, 200);
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: "20px" }}>
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", minHeight: "340px", background: "#0f172a", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", transition: "transform 0.2s", cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
        {item.thumbnail && (
          <img src={item.thumbnail} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }} onError={e => e.target.style.display = "none"} />
        )}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(15,23,42,0.97) 0%, rgba(15,23,42,0.6) 50%, rgba(15,23,42,0.2) 100%)` }} />
        <div style={{ position: "relative", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: "340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <span style={{ background: color, color: "#fff", borderRadius: "6px", padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.source}</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{timeAgo(item.pubDate)}</span>
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: "1.75rem", fontWeight: 800, color: "#fff", lineHeight: 1.25, fontFamily: "'Playfair Display', serif", maxWidth: "820px" }}>{item.title}</h2>
          {clean && <p style={{ margin: 0, fontSize: "0.95rem", color: "#cbd5e1", lineHeight: 1.6, maxWidth: "700px" }}>{clean}…</p>}
        </div>
      </div>
    </a>
  );
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ArticleCard({ item, keywords, compact = false }) {
  const text = `${item.title} ${item.description || ""}`.toLowerCase();
  const matched = (keywords || []).filter(kw => text.includes(kw.toLowerCase()));
  const clean = cleanText(item.description, compact ? 80 : 120);
  const color = TAB_COLORS[item.tab] || "#1d4ed8";
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: compact ? "12px 14px" : "16px 18px", marginBottom: "10px", transition: "all 0.18s", cursor: "pointer", display: "flex", gap: "12px", alignItems: "flex-start", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(29,78,216,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
        {!compact && item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: "76px", height: "58px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontSize: compact ? "0.87rem" : "0.93rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(item.pubDate)}</span>
          </div>
          {!compact && clean && <p style={{ margin: "0 0 7px", fontSize: "0.81rem", color: "#475569", lineHeight: 1.5 }}>{clean}…</p>}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600, background: "#f1f5f9", padding: "1px 7px", borderRadius: "5px" }}>{item.source}</span>
            {matched.slice(0, 2).map(kw => <span key={kw} style={{ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: "10px", padding: "1px 7px", fontSize: "0.66rem", fontWeight: 700 }}>{kw}</span>)}
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── BLOOM STRIP ──────────────────────────────────────────────────────────────
function BloomStrip({ articles }) {
  if (!articles || articles.length === 0) return null;
  const items = articles.slice(0, 4);
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <span style={{ fontSize: "1.2rem" }}>🔋</span>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>Bloom Energy</h2>
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        <span style={{ fontSize: "0.72rem", color: "#0891b2", fontWeight: 700, background: "#e0f2fe", padding: "2px 10px", borderRadius: "12px" }}>LIVE FEED</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {items.map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #bae6fd", padding: "16px", transition: "all 0.18s", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column", gap: "8px" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0891b2"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(8,145,178,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#bae6fd"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "8px" }} onError={e => e.target.style.display = "none"} />}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.87rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}>{item.title}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.68rem", color: "#0891b2", fontWeight: 600 }}>{item.source}</span>
                  <span style={{ fontSize: "0.66rem", color: "#94a3b8" }}>{timeAgo(item.pubDate)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── MORNING BRIEFING ─────────────────────────────────────────────────────────
function MorningBriefing({ allArticles }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    const headlines = TABS.map(tab => {
      const items = (allArticles[tab.id] || []).slice(0, 3);
      return `${tab.icon} ${tab.label}: ${items.map(a => a.title).join(" | ")}`;
    }).join("\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a sharp morning news briefing assistant. Given headlines from multiple news categories, write ONE punchy sentence per category summarizing the most important story. Be direct and informative. Format as JSON array: [{tab, icon, headline, summary}]",
          messages: [{
            role: "user",
            content: `Today is ${formatDate(new Date())}. Write a one-sentence morning briefing for each category. Headlines:\n${headlines}\n\nReturn ONLY valid JSON array, no markdown, no explanation.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "[]";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setBriefing(parsed);
      setGenerated(true);
    } catch {
      setBriefing(TABS.map(tab => ({
        tab: tab.id, icon: tab.icon,
        headline: (allArticles[tab.id]?.[0]?.title || "No stories yet"),
        summary: "Check the latest stories in this section."
      })));
      setGenerated(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "22px 26px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>☕</span>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Morning Briefing</h2>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{formatDate(new Date())}</span>
          </div>
        </div>
        {!generated && (
          <button onClick={generate} disabled={loading} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'Lora', serif", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
            {loading ? "✨ Generating…" : "✨ Generate AI Briefing"}
          </button>
        )}
        {generated && (
          <button onClick={() => { setBriefing(null); setGenerated(false); }} style={{ background: "none", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Lora', serif" }}>Refresh</button>
        )}
      </div>

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "0.88rem" }}>
          Click "Generate AI Briefing" for a personalized morning summary powered by Claude AI
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "0.88rem" }}>
          <div style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "1.5rem", marginBottom: "8px" }}>✨</div>
          <p style={{ margin: 0 }}>Analyzing today's top stories…</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {briefing && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {briefing.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", borderLeft: `3px solid ${TAB_COLORS[item.tab] || "#1d4ed8"}`, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "2px", fontFamily: "'Playfair Display', serif" }}>{item.headline}</div>
                <div style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.5 }}>{item.summary}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 2×2 GRID STRIP ───────────────────────────────────────────────────────────
function TabStrip({ allArticles, onTabClick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" }}>
      {TABS.filter(t => t.id !== "bloom").map(tab => {
        const items = (allArticles[tab.id] || []).slice(0, 3);
        const color = TAB_COLORS[tab.id];
        return (
          <div key={tab.id} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px", cursor: "pointer", transition: "all 0.18s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            onClick={() => onTabClick(tab.id)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "12px", paddingBottom: "10px", borderBottom: `2px solid ${color}` }}>
              <span style={{ fontSize: "1rem" }}>{tab.icon}</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>{tab.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {items.length === 0 && <div style={{ fontSize: "0.78rem", color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Loading…</div>}
              {items.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: "0.8rem", color: i === 0 ? "#0f172a" : "#475569", fontWeight: i === 0 ? 700 : 500, lineHeight: 1.35, padding: "6px 0", borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none", fontFamily: i === 0 ? "'Playfair Display', serif" : "'Lora', serif" }}>
                    {item.title.slice(0, 72)}{item.title.length > 72 ? "…" : ""}
                    <div style={{ fontSize: "0.66rem", color: "#94a3b8", marginTop: "2px" }}>{item.source} · {timeAgo(item.pubDate)}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SOCIAL SECTION ───────────────────────────────────────────────────────────
function SocialSection({ social }) {
  const platforms = [
    { key: "twitter", label: "Twitter / X", icon: "𝕏", color: "#000", bg: "#f7f7f7", link: h => `https://twitter.com/${h.replace("@", "")}` },
    { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0077b5", bg: "#e8f4f9", link: h => `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(h)}` },
    { key: "instagram", label: "Instagram", icon: "◈", color: "#e1306c", bg: "#fdf0f5", link: h => `https://instagram.com/${h.replace("@", "")}` },
  ].filter(p => social[p.key] && social[p.key].length > 0);
  if (!platforms.length) return null;
  return (
    <div style={{ marginTop: "36px", borderTop: "2px solid #e2e8f0", paddingTop: "28px" }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#0f172a", marginBottom: "20px" }}>🔗 Social Follows</h3>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${platforms.length}, 1fr)`, gap: "24px" }}>
        {platforms.map(({ key, label, icon, color, bg, link }) => (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ background: color, color: "#fff", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 900 }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{label}</span>
              <span style={{ marginLeft: "auto", background: "#f1f5f9", borderRadius: "10px", padding: "1px 8px", fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>{social[key].length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {social[key].map((handle, i) => (
                <a key={i} href={link(handle)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateX(3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.transform = "translateX(0)"; }}>
                    <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>{handle.replace("@", "").slice(0, 2).toUpperCase()}</span>
                    <div>
                      <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "#1e293b" }}>{handle}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Open profile →</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function SettingsPanel({ config, setConfig, activeTab, onClose }) {
  const [local, setLocal] = useState(JSON.parse(JSON.stringify(config)));
  const [st, setSt] = useState(activeTab);
  const [fn, setFn] = useState(""); const [fu, setFu] = useState("");
  const [kw, setKw] = useState("");
  const [tw, setTw] = useState(""); const [li, setLi] = useState(""); const [ig, setIg] = useState("");

  const save = () => { setConfig(local); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(local)); } catch {} onClose(); };
  const addFeed = () => { if (!fn || !fu) return; setLocal(p => ({ ...p, feeds: { ...p.feeds, [st]: [...(p.feeds[st] || []), { name: fn, url: fu, active: true }] } })); setFn(""); setFu(""); };
  const toggleFeed = (i) => setLocal(p => { const f = [...p.feeds[st]]; f[i] = { ...f[i], active: !f[i].active }; return { ...p, feeds: { ...p.feeds, [st]: f } }; });
  const removeFeed = (i) => setLocal(p => ({ ...p, feeds: { ...p.feeds, [st]: p.feeds[st].filter((_, j) => j !== i) } }));
  const addKw = () => { if (!kw) return; setLocal(p => ({ ...p, keywords: { ...p.keywords, [st]: [...(p.keywords[st] || []), kw] } })); setKw(""); };
  const removeKw = (i) => setLocal(p => ({ ...p, keywords: { ...p.keywords, [st]: p.keywords[st].filter((_, j) => j !== i) } }));
  const addSocial = (platform, val, setter) => { if (!val) return; setLocal(p => ({ ...p, social: { ...p.social, [st]: { ...p.social[st], [platform]: [...(p.social[st]?.[platform] || []), val] } } })); setter(""); };
  const removeSocial = (platform, i) => setLocal(p => ({ ...p, social: { ...p.social, [st]: { ...p.social[st], [platform]: (p.social[st]?.[platform] || []).filter((_, j) => j !== i) } } }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "780px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", fontFamily: "'Lora', serif" }}>
        <div style={{ padding: "24px 32px 0", borderBottom: "1px solid #e8edf3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>⚙️ Hub Settings</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
            {TABS.map(tab => (<button key={tab.id} onClick={() => setSt(tab.id)} style={{ padding: "8px 14px", borderRadius: "8px 8px 0 0", border: "none", background: st === tab.id ? "#eff6ff" : "transparent", color: st === tab.id ? "#1d4ed8" : "#64748b", fontWeight: st === tab.id ? 700 : 500, cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Lora', serif", borderBottom: st === tab.id ? "2px solid #1d4ed8" : "2px solid transparent", whiteSpace: "nowrap" }}>{tab.icon} {tab.label}</button>))}
          </div>
        </div>
        <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#0f172a", marginBottom: "14px" }}>📡 RSS Sources</h3>
          {(local.feeds[st] || []).map((feed, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: feed.active ? "#f0f7ff" : "#f8fafc", borderRadius: "8px", marginBottom: "6px", border: `1px solid ${feed.active ? "#bfdbfe" : "#e2e8f0"}` }}>
              <input type="checkbox" checked={feed.active} onChange={() => toggleFeed(i)} style={{ accentColor: "#1d4ed8" }} />
              <span style={{ flex: 1, fontSize: "0.87rem", color: "#1e293b", fontWeight: 600 }}>{feed.name}</span>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{feed.url}</span>
              <button onClick={() => removeFeed(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem" }}>🗑</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <input value={fn} onChange={e => setFn(e.target.value)} placeholder="Feed name" style={iStyle} />
            <input value={fu} onChange={e => setFu(e.target.value)} placeholder="RSS URL" style={{ ...iStyle, flex: 2 }} />
            <button onClick={addFeed} style={bStyle}>+ Add</button>
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#0f172a", margin: "24px 0 12px" }}>🔍 Keywords</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "10px" }}>
            {(local.keywords[st] || []).map((k, i) => (<span key={i} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "3px 12px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>{k}<button onClick={() => removeKw(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}>×</button></span>))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addKw()} placeholder="Add keyword…" style={{ ...iStyle, flex: 1 }} />
            <button onClick={addKw} style={bStyle}>+ Add</button>
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#0f172a", margin: "24px 0 12px" }}>🔗 Social Follows</h3>
          {[
            { key: "twitter", label: "Twitter / X", placeholder: "@handle", val: tw, setter: setTw },
            { key: "linkedin", label: "LinkedIn", placeholder: "Company or person", val: li, setter: setLi },
            { key: "instagram", label: "Instagram", placeholder: "@handle", val: ig, setter: setIg },
          ].map(({ key, label, placeholder, val, setter }) => (
            <div key={key} style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {(local.social[st]?.[key] || []).map((item, i) => (<span key={i} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>{item}<button onClick={() => removeSocial(key, i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}>×</button></span>))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={val} onChange={e => setter(e.target.value)} onKeyDown={e => e.key === "Enter" && addSocial(key, val, setter)} placeholder={placeholder} style={{ ...iStyle, flex: 1 }} />
                <button onClick={() => addSocial(key, val, setter)} style={bStyle}>+ Add</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderTop: "1px solid #e8edf3" }}>
          <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>Settings saved to your browser</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ padding: "9px 22px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", cursor: "pointer", fontFamily: "'Lora', serif", fontSize: "0.88rem" }}>Cancel</button>
            <button onClick={save} style={{ padding: "9px 24px", borderRadius: "8px", border: "none", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "'Lora', serif", fontSize: "0.88rem" }}>💾 Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB FEED VIEW ────────────────────────────────────────────────────────────
function TabFeedView({ articles, keywords, social, loading, search, tab }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "16px", display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", margin: 0 }}>Loading latest news…</p>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  const filtered = articles.filter(a => !search || `${a.title} ${a.description || ""}`.toLowerCase().includes(search.toLowerCase()));
  const hero = filtered[0];
  const grid = filtered.slice(1, 5);
  const rest = filtered.slice(5);

  if (filtered.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
      <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", margin: "0 0 6px" }}>No articles found.</p>
      <p style={{ fontSize: "0.85rem", margin: 0 }}>Try refreshing or adjusting your filter.</p>
    </div>
  );

  return (
    <div>
      <HeroCard item={hero} tab={tab} />
      {grid.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {grid.map((item, i) => <ArticleCard key={i} item={item} keywords={keywords} />)}
        </div>
      )}
      {rest.length > 0 && (
        <div style={{ columns: "2", columnGap: "16px" }}>
          {rest.map((item, i) => <div key={i} style={{ breakInside: "avoid" }}><ArticleCard item={item} keywords={keywords} compact /></div>)}
        </div>
      )}
      <SocialSection social={social} />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function NewsHub() {
  const [config, setConfig] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_CONFIG; }
    catch { return DEFAULT_CONFIG; }
  });
  const [activeTab, setActiveTab] = useState("general");
  const [articles, setArticles] = useState({});
  const [loading, setLoading] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [view, setView] = useState("dashboard"); // dashboard | tab

  const fetchFeeds = useCallback(async (tab) => {
    const activeFeeds = (config.feeds[tab] || []).filter(f => f.active);
    if (!activeFeeds.length) return;
    setLoading(p => ({ ...p, [tab]: true }));
    const results = [];
    await Promise.allSettled(activeFeeds.map(async (feed) => {
      try {
        const res = await fetch(`${RSS_PROXY}${encodeURIComponent(feed.url)}&count=15`);
        const data = await res.json();
        if (data.items) data.items.forEach(item => results.push({ ...item, source: feed.name, tab }));
      } catch {}
    }));
    results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    setArticles(p => ({ ...p, [tab]: results }));
    setLoading(p => ({ ...p, [tab]: false }));
  }, [config]);

  useEffect(() => { TABS.forEach(tab => fetchFeeds(tab.id)); }, []);
  useEffect(() => { if (view === "tab") fetchFeeds(activeTab); }, [activeTab, view]);

  const refresh = () => {
    if (view === "dashboard") TABS.forEach(tab => fetchFeeds(tab.id));
    else fetchFeeds(activeTab);
    setLastRefresh(new Date());
  };

  const handleTabClick = (tabId) => { setActiveTab(tabId); setView("tab"); setSearch(""); };

  const tabKeywords = config.keywords[activeTab] || [];
  const tabSocial = config.social[activeTab] || { twitter: [], instagram: [], linkedin: [] };
  const tabArticles = articles[activeTab] || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Lora', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header style={{ background: "#0f172a", padding: "0 32px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "16px", height: "62px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, cursor: "pointer" }} onClick={() => setView("dashboard")}>
            <div style={{ width: "34px", height: "34px", background: "linear-gradient(135deg, #1d4ed8, #60a5fa)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📰</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>MyNewsHub</span>
          </div>

          {/* VIEW TOGGLE */}
          <div style={{ display: "flex", gap: "4px", background: "#1e293b", borderRadius: "8px", padding: "3px" }}>
            <button onClick={() => setView("dashboard")} style={{ background: view === "dashboard" ? "#fff" : "transparent", color: view === "dashboard" ? "#0f172a" : "#94a3b8", border: "none", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "'Lora', serif", transition: "all 0.15s" }}>Dashboard</button>
            <button onClick={() => setView("tab")} style={{ background: view === "tab" ? "#fff" : "transparent", color: view === "tab" ? "#0f172a" : "#94a3b8", border: "none", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "'Lora', serif", transition: "all 0.15s" }}>Deep Dive</button>
          </div>

          {/* TABS (only in tab view) */}
          {view === "tab" && (
            <nav style={{ display: "flex", gap: "2px", flex: 1, overflowX: "auto" }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }} style={{ background: activeTab === tab.id ? "#1d4ed8" : "transparent", color: activeTab === tab.id ? "#fff" : "#94a3b8", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", fontSize: "0.81rem", fontWeight: 600, fontFamily: "'Lora', serif", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}
                  onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#94a3b8"; }}>
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </nav>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "auto" }}>
            {view === "tab" && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: "0.81rem", fontFamily: "'Lora', serif", outline: "none", width: "140px" }} />}
            <button onClick={refresh} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: "8px", padding: "7px 11px", cursor: "pointer", fontSize: "1rem" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>↻</button>
            <button onClick={() => setShowSettings(true)} style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: "8px", padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontFamily: "'Lora', serif", fontSize: "0.81rem" }}>⚙ Settings</button>
          </div>
        </div>
      </header>

      {/* KEYWORD CHIPS (tab view only) */}
      {view === "tab" && tabKeywords.length > 0 && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "9px 32px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em" }}>TRACKING:</span>
            {tabKeywords.map(kw => (<button key={kw} onClick={() => setSearch(search === kw ? "" : kw)} style={{ background: search === kw ? "#1d4ed8" : "#eff6ff", color: search === kw ? "#fff" : "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "3px 12px", fontSize: "0.77rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Lora', serif", transition: "all 0.15s" }}>{kw}</button>))}
            {search && <button onClick={() => setSearch("")} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "20px", padding: "3px 12px", fontSize: "0.77rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Lora', serif" }}>✕ Clear</button>}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" }}>
        {view === "dashboard" ? (
          <div>
            <MorningBriefing allArticles={articles} />
            <TabStrip allArticles={articles} onTabClick={handleTabClick} />
            <BloomStrip articles={articles.bloom || []} />
            {/* General hero on dashboard */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>🌐 Top Story</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <button onClick={() => handleTabClick("general")} style={{ fontSize: "0.78rem", color: "#1d4ed8", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "'Lora', serif" }}>See all General News →</button>
            </div>
            <HeroCard item={(articles.general || [])[0]} tab="general" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {(articles.general || []).slice(1, 5).map((item, i) => <ArticleCard key={i} item={item} keywords={config.keywords.general} />)}
            </div>
          </div>
        ) : (
          <TabFeedView
            articles={tabArticles}
            keywords={tabKeywords}
            social={tabSocial}
            loading={!!loading[activeTab]}
            search={search}
            tab={activeTab}
          />
        )}
      </main>

      {showSettings && <SettingsPanel config={config} setConfig={setConfig} activeTab={activeTab} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
