import { useState, useEffect, useCallback } from "react";

async function fetchRSS(url) {
  const proxies = [
    async () => {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`);
      const data = await res.json();
      if (data.items && data.items.length > 0) return data.items.map(item => ({ title: item.title, link: item.link, description: item.description || item.content || "", pubDate: item.pubDate, thumbnail: item.thumbnail || "" }));
      return [];
    },
    async () => {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!data.contents) return [];
      const parser = new DOMParser();
      const xml = parser.parseFromString(data.contents, "text/xml");
      return Array.from(xml.querySelectorAll("item")).slice(0, 15).map(item => ({ title: item.querySelector("title")?.textContent || "", link: item.querySelector("link")?.textContent || "", description: item.querySelector("description")?.textContent || "", pubDate: item.querySelector("pubDate")?.textContent || "", thumbnail: item.querySelector("enclosure")?.getAttribute("url") || "" }));
    },
    async () => {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      return Array.from(xml.querySelectorAll("item")).slice(0, 15).map(item => ({ title: item.querySelector("title")?.textContent || "", link: item.querySelector("link")?.textContent || "", description: item.querySelector("description")?.textContent || "", pubDate: item.querySelector("pubDate")?.textContent || "", thumbnail: item.querySelector("enclosure")?.getAttribute("url") || "" }));
    },
  ];
  for (const proxy of proxies) {
    try { const items = await proxy(); if (items.length > 0) return items; } catch {}
  }
  return [];
}

const DEFAULT_CONFIG = {
  feeds: {
    general: [
      { name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml", active: true },
      { name: "NPR News", url: "https://feeds.npr.org/1001/rss.xml", active: true },
      { name: "The Hill", url: "https://thehill.com/homenews/feed/", active: true },
      { name: "TechCrunch", url: "https://techcrunch.com/feed/", active: true },
      { name: "Wired", url: "https://www.wired.com/feed/rss", active: true },
      { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", active: true },
      { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml", active: true },
      { name: "NY Post", url: "https://nypost.com/feed/", active: true },
      { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", active: true },
      { name: "Politico", url: "https://rss.politico.com/politics-news.xml", active: true },
      { name: "Houston Chronicle", url: "https://www.houstonchronicle.com/rss/feed/Top-News-238.php", active: true },
      { name: "Houston Biz Journal", url: "https://www.bizjournals.com/houston/feed/latest/", active: true },
    ],
    sports: [
      { name: "ESPN NFL", url: "https://www.espn.com/espn/rss/nfl/news", active: true },
      { name: "ESPN MLB", url: "https://www.espn.com/espn/rss/mlb/news", active: true },
      { name: "ESPN College Football", url: "https://www.espn.com/espn/rss/ncf/news", active: true },
      { name: "ESPN College Basketball", url: "https://www.espn.com/espn/rss/ncb/news", active: true },
      { name: "CBS Sports NFL", url: "https://www.cbssports.com/rss/headlines/nfl", active: true },
      { name: "CBS Sports MLB", url: "https://www.cbssports.com/rss/headlines/mlb", active: true },
      { name: "CBS Sports CFB", url: "https://www.cbssports.com/rss/headlines/college-football", active: true },
      { name: "Pro Football Talk", url: "https://profootballtalk.nbcsports.com/feed/", active: true },
      { name: "247Sports", url: "https://247sports.com/feeds/articles/rss/", active: true },
      { name: "Bleacher Report", url: "https://bleacherreport.com/articles/feed", active: true },
      { name: "Kentucky Sports Radio", url: "https://kentuckysportsradio.com/feed/", active: true },
      { name: "Baseball America", url: "https://www.baseballamerica.com/feed/", active: true },
    ],
    business: [
      { name: "Oil & Gas Journal", url: "https://www.ogj.com/rss", active: true },
      { name: "Rigzone", url: "https://www.rigzone.com/news/rss/rigzone_latest.aspx", active: true },
      { name: "Utility Dive", url: "https://www.utilitydive.com/feeds/news/", active: true },
      { name: "Power Magazine", url: "https://www.powermag.com/feed/", active: true },
      { name: "Data Center Dynamics", url: "https://www.datacenterdynamics.com/en/rss/", active: true },
      { name: "AI News", url: "https://artificialintelligence-news.com/feed/", active: true },
      { name: "MIT Tech Review", url: "https://www.technologyreview.com/feed/", active: true },
      { name: "E&E News", url: "https://www.eenews.net/rss/1", active: true },
      { name: "Hart Energy", url: "https://www.hartenergy.com/rss", active: true },
      { name: "Natural Gas Intelligence", url: "https://www.naturalgasintel.com/feed/", active: true },
      { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", active: true },
      { name: "S&P Global Energy", url: "https://www.spglobal.com/commodityinsights/en/rss-feed/oil", active: true },
    ],
    finance: [
      { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/", active: true },
      { name: "Kiplinger", url: "https://www.kiplinger.com/rss/all", active: true },
      { name: "Motley Fool", url: "https://www.fool.com/feeds/index.aspx", active: true },
      { name: "Investopedia", url: "https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline", active: true },
      { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", active: true },
      { name: "Morningstar", url: "https://www.morningstar.com/feeds/all-articles.rss", active: true },
      { name: "BiggerPockets", url: "https://www.biggerpockets.com/blog/feed", active: true },
      { name: "RiskHedge", url: "https://riskhedge.com/feed/", active: true },
      { name: "Barrons", url: "https://www.barrons.com/xml/rss/3_7510.xml", active: true },
    ],
  },
  keywords: {
    general: ["Houston", "Texas", "AI", "geopolitical", "technology", "OpenAI", "Google"],
    sports: ["Texans", "Astros", "Braves", "Kentucky Wildcats", "Clemson Tigers", "Big Blue", "recruiting", "247sports", "SEC", "ACC", "CJ Stroud", "Rockets"],
    business: ["data center", "power grid", "LNG", "energy transition", "AI infrastructure", "oil price", "natural gas", "hyperscaler", "nuclear", "ERCOT", "Texas grid", "power demand", "Microsoft", "Google", "Amazon", "pipeline"],
    finance: ["interest rates", "401k", "investing", "inflation", "stock market", "retirement", "dividend", "Fed", "S&P 500", "real estate", "tax planning", "wealth management", "passive income", "energy stocks"],
  },
  social: {
    general: { twitter: ["@Bloomberg", "@Reuters", "@WSJ", "@FoxNews", "@CNN", "@CNBC", "@BBCWorld", "@DailyWire"], instagram: [], linkedin: [] },
    sports: { twitter: ["@HoustonTexans", "@astros", "@Braves", "@KentuckyMBB", "@ClemsonFB", "@247Sports", "@Rivals", "@On3Sports", "@ClemsonRivals", "@KentuckyRivals", "@MLBastros", "@AtlantaBraves"], instagram: ["@houstontexans", "@astros", "@braves", "@kentuckymbb", "@clemsonfootball", "@espn", "@nfl", "@mlb", "@247sports"], linkedin: [] },
    business: { twitter: ["@OilandGasJnl", "@HartEnergy", "@UtilityDive", "@EENews", "@PowerMag", "@OpenAI"], instagram: [], linkedin: ["Marathon Petroleum", "ExxonMobil", "Chevron", "Shell", "NRG Energy", "Google DeepMind"] },
    finance: { twitter: [], instagram: [], linkedin: [] },
  },
};

const STORAGE_KEY = "mynewshub_v3";
const TABS = [
  { id: "general", label: "General News", icon: "🌐" },
  { id: "sports", label: "Sports", icon: "🏆" },
  { id: "business", label: "Business & Energy", icon: "⚡" },
  { id: "finance", label: "Personal Finance", icon: "📈" },
];

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

const inputStyle = { padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontFamily: "'Lora', serif", color: "#1e293b", outline: "none", flex: 1, background: "#fff" };
const btnStyle = { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", fontFamily: "'Lora', serif", whiteSpace: "nowrap" };

function SocialSection({ social }) {
  const hasSocial = social.twitter.length > 0 || social.instagram.length > 0 || social.linkedin.length > 0;
  if (!hasSocial) return null;
  const platforms = [
    { key: "twitter", label: "Twitter / X", icon: "X", color: "#000", bg: "#f7f7f7", link: h => `https://twitter.com/${h.replace("@", "")}` },
    { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0077b5", bg: "#e8f4f9", link: h => `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(h)}` },
    { key: "instagram", label: "Instagram", icon: "IG", color: "#e1306c", bg: "#fdf0f5", link: h => `https://instagram.com/${h.replace("@", "")}` },
  ].filter(p => social[p.key] && social[p.key].length > 0);
  return (
    <div style={{ marginTop: "36px", borderTop: "2px solid #e2e8f0", paddingTop: "28px" }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#0f172a", marginBottom: "20px" }}>Social Follows</h3>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(platforms.length, 3)}, 1fr)`, gap: "24px" }}>
        {platforms.map(({ key, label, icon, color, bg, link }) => (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ background: color, color: "#fff", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900 }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {social[key].map((handle, i) => (
                <a key={i} href={link(handle)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateX(3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>{handle.replace("@", "").slice(0, 2).toUpperCase()}</span>
                    <div>
                      <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "#1e293b" }}>{handle}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Open profile</div>
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

function ArticleCard({ item, keywords }) {
  const text = `${item.title} ${item.description || ""}`.toLowerCase();
  const matched = keywords?.filter(kw => text.includes(kw.toLowerCase())) || [];
  const clean = (item.description || "").replace(/<[^>]*>/g, "").slice(0, 130);
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 18px", marginBottom: "12px", transition: "all 0.18s", cursor: "pointer", display: "flex", gap: "14px", alignItems: "flex-start", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(29,78,216,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: "82px", height: "62px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "5px" }}>
            <h3 style={{ margin: 0, fontSize: "0.94rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(item.pubDate)}</span>
          </div>
          {clean && <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "#475569", lineHeight: 1.55 }}>{clean}...</p>}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.71rem", color: "#94a3b8", fontWeight: 600, background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>{item.source}</span>
            {matched.map(kw => <span key={kw} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "1px 8px", fontSize: "0.68rem", fontWeight: 700 }}>{kw}</span>)}
          </div>
        </div>
      </div>
    </a>
  );
}

function SettingsPanel({ config, setConfig, activeTab, onClose }) {
  const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(config)));
  const [activeSettingsTab, setActiveSettingsTab] = useState(activeTab);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newTwitter, setNewTwitter] = useState("");
  const [newLinkedIn, setNewLinkedIn] = useState("");
  const [newInstagram, setNewInstagram] = useState("");

  const save = () => { setConfig(localConfig); localStorage.setItem(STORAGE_KEY, JSON.stringify(localConfig)); onClose(); };
  const addFeed = (tab) => { if (!newFeedName || !newFeedUrl) return; setLocalConfig(prev => ({ ...prev, feeds: { ...prev.feeds, [tab]: [...prev.feeds[tab], { name: newFeedName, url: newFeedUrl, active: true }] } })); setNewFeedName(""); setNewFeedUrl(""); };
  const toggleFeed = (tab, idx) => { setLocalConfig(prev => { const f = [...prev.feeds[tab]]; f[idx] = { ...f[idx], active: !f[idx].active }; return { ...prev, feeds: { ...prev.feeds, [tab]: f } }; }); };
  const removeFeed = (tab, idx) => { setLocalConfig(prev => ({ ...prev, feeds: { ...prev.feeds, [tab]: prev.feeds[tab].filter((_, i) => i !== idx) } })); };
  const addKeyword = (tab) => { if (!newKeyword) return; setLocalConfig(prev => ({ ...prev, keywords: { ...prev.keywords, [tab]: [...prev.keywords[tab], newKeyword] } })); setNewKeyword(""); };
  const removeKeyword = (tab, idx) => { setLocalConfig(prev => ({ ...prev, keywords: { ...prev.keywords, [tab]: prev.keywords[tab].filter((_, i) => i !== idx) } })); };
  const addSocial = (tab, platform, val, setter) => { if (!val) return; setLocalConfig(prev => ({ ...prev, social: { ...prev.social, [tab]: { ...prev.social[tab], [platform]: [...prev.social[tab][platform], val] } } })); setter(""); };
  const removeSocial = (tab, platform, idx) => { setLocalConfig(prev => ({ ...prev, social: { ...prev.social, [tab]: { ...prev.social[tab], [platform]: prev.social[tab][platform].filter((_, i) => i !== idx) } } })); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "780px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", fontFamily: "'Lora', serif" }}>
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #e8edf3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>Hub Settings</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}>X</button>
          </div>
          <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveSettingsTab(tab.id)} style={{ padding: "7px 12px", borderRadius: "8px 8px 0 0", border: "none", background: activeSettingsTab === tab.id ? "#eff6ff" : "transparent", color: activeSettingsTab === tab.id ? "#1d4ed8" : "#64748b", fontWeight: activeSettingsTab === tab.id ? 700 : 500, cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Lora', serif", borderBottom: activeSettingsTab === tab.id ? "2px solid #1d4ed8" : "2px solid transparent", whiteSpace: "nowrap" }}>{tab.icon} {tab.label}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#0f172a", marginBottom: "12px" }}>RSS Sources</h3>
          {(localConfig.feeds[activeSettingsTab] || []).map((feed, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: feed.active ? "#f0f7ff" : "#f8fafc", borderRadius: "8px", marginBottom: "6px", border: `1px solid ${feed.active ? "#bfdbfe" : "#e2e8f0"}` }}>
              <input type="checkbox" checked={feed.active} onChange={() => toggleFeed(activeSettingsTab, idx)} style={{ accentColor: "#1d4ed8" }} />
              <span style={{ flex: 1, fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>{feed.name}</span>
              <span style={{ fontSize: "0.68rem", color: "#94a3b8", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{feed.url}</span>
              <button onClick={() => removeFeed(activeSettingsTab, idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem", flexShrink: 0 }}>X</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <input value={newFeedName} onChange={e => setNewFeedName(e.target.value)} placeholder="Feed name" style={{ ...inputStyle, minWidth: "120px" }} />
            <input value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} placeholder="RSS URL" style={{ ...inputStyle, flex: 2, minWidth: "180px" }} />
            <button onClick={() => addFeed(activeSettingsTab)} style={btnStyle}>+ Add</button>
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#0f172a", margin: "20px 0 10px" }}>Keywords</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {(localConfig.keywords[activeSettingsTab] || []).map((kw, idx) => (
              <span key={idx} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "3px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                {kw}<button onClick={() => removeKeyword(activeSettingsTab, idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}>x</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword(activeSettingsTab)} placeholder="Add keyword..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => addKeyword(activeSettingsTab)} style={btnStyle}>+ Add</button>
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#0f172a", margin: "20px 0 10px" }}>Social Follows</h3>
          {[
            { key: "twitter", label: "Twitter / X", placeholder: "@handle", val: newTwitter, setter: setNewTwitter },
            { key: "linkedin", label: "LinkedIn", placeholder: "Company or person", val: newLinkedIn, setter: setNewLinkedIn },
            { key: "instagram", label: "Instagram", placeholder: "@handle", val: newInstagram, setter: setNewInstagram },
          ].map(({ key, label, placeholder, val, setter }) => (
            <div key={key} style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "6px" }}>
                {(localConfig.social[activeSettingsTab]?.[key] || []).map((item, idx) => (
                  <span key={idx} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "2px 10px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                    {item}<button onClick={() => removeSocial(activeSettingsTab, key, idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}>x</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={val} onChange={e => setter(e.target.value)} onKeyDown={e => e.key === "Enter" && addSocial(activeSettingsTab, key, val, setter)} placeholder={placeholder} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => addSocial(activeSettingsTab, key, val, setter)} style={btnStyle}>+ Add</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: "1px solid #e8edf3" }}>
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Saved to your browser</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", cursor: "pointer", fontFamily: "'Lora', serif", fontSize: "0.85rem" }}>Cancel</button>
            <button onClick={save} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "'Lora', serif", fontSize: "0.85rem" }}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const fetchFeeds = useCallback(async (tab) => {
    const activeFeeds = (config.feeds[tab] || []).filter(f => f.active);
    if (!activeFeeds.length) return;
    setLoading(p => ({ ...p, [tab]: true }));
    const results = [];
    await Promise.allSettled(activeFeeds.map(async (feed) => {
      try {
        const items = await fetchRSS(feed.url);
        items.forEach(item => results.push({ ...item, source: feed.name }));
      } catch {}
    }));
    results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    setArticles(p => ({ ...p, [tab]: results }));
    setLoading(p => ({ ...p, [tab]: false }));
  }, [config]);

  useEffect(() => { fetchFeeds(activeTab); }, [activeTab, fetchFeeds]);

  const refresh = () => { fetchFeeds(activeTab); setLastRefresh(new Date()); };
  const displayArticles = (articles[activeTab] || []).filter(a => !search || `${a.title} ${a.description || ""}`.toLowerCase().includes(search.toLowerCase()));
  const tabKeywords = config.keywords[activeTab] || [];
  const tabSocial = config.social[activeTab] || { twitter: [], instagram: [], linkedin: [] };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Lora', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />
      <header style={{ background: "#0f172a", padding: "0 16px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "10px", height: "58px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg, #1d4ed8, #60a5fa)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", color: "#fff", fontWeight: 800 }}>N</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>MyNewsHub</span>
          </div>
          <nav style={{ display: "flex", gap: "2px", flex: 1, overflowX: "auto" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }} style={{ background: activeTab === tab.id ? "#1d4ed8" : "transparent", color: activeTab === tab.id ? "#fff" : "#94a3b8", border: "none", borderRadius: "8px", padding: "5px 8px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, fontFamily: "'Lora', serif", transition: "all 0.15s", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#e2e8f0"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#94a3b8"; }}
              >{tab.icon} {tab.label}</button>
            ))}
          </nav>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: "5px 8px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: "0.72rem", fontFamily: "'Lora', serif", outline: "none", width: "100px" }} />
            <button onClick={refresh} title="Refresh" style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: "8px", padding: "5px 9px", cursor: "pointer", fontSize: "0.9rem" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>&#8635;</button>
            <button onClick={() => setShowSettings(true)} style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "'Lora', serif", fontSize: "0.72rem", whiteSpace: "nowrap" }}>Settings</button>
          </div>
        </div>
      </header>
      {tabKeywords.length > 0 && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "7px 16px", overflowX: "auto" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "6px", alignItems: "center", minWidth: "max-content" }}>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>TRACKING:</span>
            {tabKeywords.map(kw => (
              <button key={kw} onClick={() => setSearch(search === kw ? "" : kw)} style={{ background: search === kw ? "#1d4ed8" : "#eff6ff", color: search === kw ? "#fff" : "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "2px 9px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Lora', serif", whiteSpace: "nowrap" }}>{kw}</button>
            ))}
            {search && <button onClick={() => setSearch("")} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "20px", padding: "2px 9px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Lora', serif", whiteSpace: "nowrap" }}>Clear</button>}
          </div>
        </div>
      )}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px" }}>
        {loading[activeTab] ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", margin: 0 }}>Loading latest news...</p>
          </div>
        ) : (
          <div>
            {displayArticles.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "0.73rem", color: "#94a3b8" }}>{displayArticles.length} articles</span>
              </div>
            )}
            {displayArticles.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", margin: "0 0 6px" }}>No articles found.</p>
                <p style={{ fontSize: "0.85rem", margin: "0 0 16px" }}>Tap the button below to refresh.</p>
                <button onClick={refresh} style={{ ...btnStyle, fontSize: "0.9rem", padding: "10px 24px" }}>Refresh Now</button>
              </div>
            )}
            <div style={{ columns: "2", columnGap: "14px" }}>
              {displayArticles.map((item, i) => (
                <div key={i} style={{ breakInside: "avoid" }}>
                  <ArticleCard item={item} keywords={tabKeywords} />
                </div>
              ))}
            </div>
            <SocialSection social={tabSocial} />
          </div>
        )}
      </main>
      {showSettings && <SettingsPanel config={config} setConfig={setConfig} activeTab={activeTab} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
