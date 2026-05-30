import { useState, useEffect } from 'react';
import { useApp } from '../App.jsx';
import { callClaude, timeAgo } from '../utils.js';
import { CB_IDENTITY, NAV_ITEMS } from '../constants.js';
import MD from './shared/MD.jsx';
import { ThinkingDots } from './shared/Common.jsx';

// Curated Blue Ocean signals — CB's world
const SIGNALS = [
  { emoji: '🏘', title: 'Small Multifamily in Transitioning Houston Zips', insight: 'Institutional buyers skip sub-10 unit buildings. AI-driven migration is quietly repricing these before anyone notices.', category: 'Real Estate', color: '#00FFB2', urgency: 'HIGH' },
  { emoji: '🤖', title: 'AI-Augmented BD Professionals', insight: 'First movers who build systematic AI pipelines in BD will have a 10x edge within 18 months. Almost nobody is doing this yet.', category: 'Career Edge', color: '#6366F1', urgency: 'HIGH' },
  { emoji: '📈', title: 'Covered Calls on Dividend Stacks', insight: 'Systematic covered call writing on dividend portfolios adds 3–5% yield with no extra capital. The math is obvious. Almost no retail investors act on it.', category: 'Finance', color: '#ffcc44', urgency: 'MED' },
  { emoji: '⚡', title: 'ERCOT Ancillary Services', insight: 'Texas grid volatility = pricing opportunity in frequency regulation and demand response. Deeply underutilized by non-institutional players.', category: 'Energy/Macro', color: '#ff8844', urgency: 'MED' },
  { emoji: '🏥', title: 'Longevity Biomarkers Protocol', insight: "Attia's Zone 2 + VO₂Max + muscle mass trifecta: most people optimize none of them. The compounding return on health at 40+ is asymmetric.", category: 'Longevity', color: '#ff4488', urgency: 'HIGH' },
  { emoji: '🌐', title: 'Onshoring Infrastructure Play', insight: 'Data centers, chip fabs, and LNG terminals are being built at scale. The supply chain for construction and power is the overlooked moat.', category: 'Macro', color: '#4488ff', urgency: 'MED' },
];

// Module quick-launch grid
const QUICK_MODULES = [
  { id: 'learn',    icon: '📚', label: 'Learn',    desc: 'Books, topics, courses', color: '#00FFB2' },
  { id: 'research', icon: '🔭', label: 'Research',  desc: 'Truth-first analysis',  color: '#6366F1' },
  { id: 'podcast',  icon: '🎙️', label: 'Podcasts',  desc: 'AI summaries + listen', color: '#e11d48' },
  { id: 'projects', icon: '🚀', label: 'Projects',  desc: 'Track & ship',          color: '#ff8844' },
  { id: 'vault',    icon: '🏛', label: 'Vault',     desc: 'Your knowledge base',   color: '#ffcc44' },
  { id: 'growth',   icon: '📈', label: 'Growth',    desc: 'Goals & synthesis',     color: '#44ffcc' },
];

export default function HomeDashboard() {
  const { graph, projects, notes, setActiveModule, isMobile, isTablet, isPhone } = useApp();

  const [brief, setBrief]             = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefDone, setBriefDone]     = useState(false);
  const [briefError, setBriefError]   = useState(false);

  const topics        = Object.values(graph?.topics || {});
  const totalMin      = graph?.totalTime || 0;
  const activeProjects = projects.filter(p => p.status === 'active');
  const recentSessions = (graph?.sessions || []).slice(-4).reverse();
  const recentNotes   = (notes || []).slice(0, 3);

  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  // Auto-generate brief on first open each day
  useEffect(() => {
    const todayKey = `aether_brief_${new Date().toDateString()}`;
    const saved = localStorage.getItem(todayKey);
    if (saved) { setBrief(saved); setBriefDone(true); return; }
    const timer = setTimeout(() => generateBrief(todayKey), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBrief = async (cacheKey) => {
    if (briefLoading) return;
    setBriefLoading(true);
    setBriefError(false);
    try {
      const projList  = activeProjects.slice(0, 3).map(p => p.title).join(', ') || 'none yet';
      const topicList = topics.slice(-3).map(t => t.title).join(', ') || 'none yet';
      const prompt = `CB's Daily Intelligence Brief — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

Give CB 4 tight, decisive bullets. Format exactly:
**📡 Signal** — [single most important strategic insight for CB today — connect to BD, real estate, energy, or longevity]
**🌊 Blue Ocean** — [one underpriced opportunity CB should be tracking right now]
**⚡ Today's Move** — [one concrete action CB should take today — specific, not vague]
**🧠 Mental Model** — [one framework from CB's library that applies to what's happening right now]

CB's context:
- Active projects: ${projList}
- Recent learning: ${topicList}
- Streak: ${graph?.streak || 0} days
- Location: Houston, TX. BD professional. Long-game operator.

Be blunt. No hedging. One decisive line per bullet.`;

      const reply = await callClaude({
        system: CB_IDENTITY,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
      });
      setBrief(reply);
      setBriefDone(true);
      if (cacheKey) localStorage.setItem(cacheKey, reply);
    } catch {
      setBriefError(true);
    }
    setBriefLoading(false);
  };

  // ─── Layout helpers ────────────────────────────────────────────────────
  const pad  = isPhone ? '14px' : isMobile ? '16px' : isTablet ? '24px' : '32px';
  const cols2 = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div style={{ maxWidth: isMobile ? '100%' : 1100, margin: '0 auto', paddingBottom: isMobile ? 80 : 60 }}>

      {/* ─── TOP GREETING BAR ─────────────────────────────────────────── */}
      <div style={{ padding: `${pad} ${pad} 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'var(--text)', fontFamily: "'Fraunces', serif", letterSpacing: -0.5, lineHeight: 1.1 }}>
            {greeting}, CB.
          </div>
        </div>
        {/* Compact stats — only show if any data */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {graph?.streak > 0 && (
            <div style={{ fontSize: 10, color: 'var(--subtle)', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, whiteSpace: 'nowrap' }}>
              🔥 {graph.streak}d
            </div>
          )}
          {totalMin > 0 && (
            <div style={{ fontSize: 10, color: 'var(--subtle)', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, whiteSpace: 'nowrap' }}>
              ⏱ {Math.round(totalMin / 60)}h
            </div>
          )}
          {activeProjects.length > 0 && (
            <div style={{ fontSize: 10, color: 'var(--subtle)', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, whiteSpace: 'nowrap' }}>
              🚀 {activeProjects.length}
            </div>
          )}
        </div>
      </div>

      {/* ─── HERO: DAILY INTELLIGENCE BRIEF ──────────────────────────── */}
      <div style={{ padding: `0 ${isMobile ? '0' : pad}`, marginBottom: isMobile ? 16 : 24 }}>
        <div style={{
          background: 'var(--surface)',
          border: isMobile ? 'none' : '1px solid var(--border)',
          borderRadius: isMobile ? 0 : 14,
          overflow: 'hidden',
          borderTop: `3px solid #00FFB2`,
        }}>
          {/* Card header */}
          <div style={{ padding: isMobile ? '14px 16px 12px' : '18px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bord2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#00FFB210', border: '1px solid #00FFB230', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.2 }}>Daily Intelligence Brief</div>
                <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>CB-style · auto-generated · {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
              </div>
            </div>
            {briefDone && (
              <div onClick={() => { setBrief(''); setBriefDone(false); generateBrief(null); }}
                style={{ fontSize: 10, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--dim)', cursor: 'pointer', whiteSpace: 'nowrap', background: 'var(--bg)' }}>
                ↻ Refresh
              </div>
            )}
          </div>
          {/* Card body */}
          <div style={{ padding: isMobile ? '14px 16px 16px' : '18px 22px 20px' }}>
            {briefLoading && !brief && (
              <div style={{ padding: '8px 0 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12, letterSpacing: 0.3 }}>Generating your intelligence brief…</div>
                <ThinkingDots color="#00FFB2" />
              </div>
            )}
            {briefError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Brief unavailable — check connection.</div>
                <div onClick={() => generateBrief(null)} style={{ fontSize: 10, padding: '5px 12px', background: '#00FFB210', border: '1px solid #00FFB230', borderRadius: 6, color: '#00FFB2', cursor: 'pointer', whiteSpace: 'nowrap' }}>Retry</div>
              </div>
            )}
            {brief && <MD text={brief} color="#00FFB2" />}
          </div>
        </div>
      </div>

      {/* ─── QUICK MODULE LAUNCH ──────────────────────────────────────── */}
      <div style={{ padding: `0 ${pad}`, marginBottom: isMobile ? 20 : 28 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
          Quick Access
        </div>
        {isMobile ? (
          /* Mobile: horizontal scroll row */
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
            {QUICK_MODULES.map(m => (
              <div key={m.id} onClick={() => setActiveModule(m.id)}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 14px', background: 'var(--surface)', border: `1px solid ${m.color}22`, borderRadius: 12, cursor: 'pointer', minWidth: 72, transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ fontSize: 22 }}>{m.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop/Tablet: grid */
          <div style={{ display: 'grid', gridTemplateColumns: isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 10 }}>
            {QUICK_MODULES.map(m => (
              <div key={m.id} onClick={() => setActiveModule(m.id)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', background: 'var(--surface)', border: `1px solid ${m.color}20`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${m.color}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${m.color}20`}>
                <div style={{ fontSize: 22 }}>{m.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--dim)' }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── BLUE OCEAN SIGNALS ───────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <div style={{ padding: `0 ${pad}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
            🌊 Blue Ocean Signals
          </div>
          <div onClick={() => setActiveModule('research')} style={{ fontSize: 10, color: '#6366F1', cursor: 'pointer', fontWeight: 600 }}>Research hub →</div>
        </div>

        {isMobile ? (
          /* Mobile: horizontal scroll cards */
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: `0 ${pad} 4px` }}>
            {SIGNALS.map((s, i) => (
              <div key={i} style={{ flexShrink: 0, width: isPhone ? 240 : 272, padding: '14px 16px', background: 'var(--surface)', border: `1px solid ${s.color}22`, borderRadius: 12, borderTop: `2px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.emoji} {s.category}</div>
                  <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: `${s.color}18`, border: `1px solid ${s.color}30`, color: s.color, fontWeight: 800, letterSpacing: 1 }}>{s.urgency}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6, lineHeight: 1.35 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{s.insight}</div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop/Tablet: grid */
          <div style={{ padding: `0 ${pad}`, display: 'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {SIGNALS.map((s, i) => (
              <div key={i} style={{ padding: '16px 18px', background: 'var(--surface)', border: `1px solid ${s.color}22`, borderRadius: 12, borderTop: `2px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.emoji} {s.category}</div>
                  <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: `${s.color}18`, border: `1px solid ${s.color}30`, color: s.color, fontWeight: 800, letterSpacing: 1 }}>{s.urgency}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6, lineHeight: 1.35 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{s.insight}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ACTIVE PROJECTS (only if they exist) ────────────────────── */}
      {activeProjects.length > 0 && (
        <div style={{ padding: `0 ${pad}`, marginBottom: isMobile ? 20 : 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', letterSpacing: 2.5, textTransform: 'uppercase' }}>🚀 Active Projects</div>
            <div onClick={() => setActiveModule('projects')} style={{ fontSize: 10, color: '#ff8844', cursor: 'pointer', fontWeight: 600 }}>View all →</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: 10 }}>
            {activeProjects.slice(0, isMobile ? 2 : 3).map(p => {
              const done = (p.milestones || []).filter(m => m.done).length;
              const total = (p.milestones || []).length || 1;
              const pct = Math.round((done / total) * 100);
              return (
                <div key={p.id} onClick={() => setActiveModule('projects')}
                  style={{ padding: '12px 14px', background: 'var(--surface)', border: `1px solid ${p.color}22`, borderRadius: 10, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{p.emoji} {p.title}</div>
                    <div style={{ fontSize: 11, color: p.color, fontWeight: 700, flexShrink: 0 }}>{pct}%</div>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 2, height: 3 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── RECENT ACTIVITY (only if data exists) ────────────────────── */}
      {(recentSessions.length > 0 || recentNotes.length > 0) && (
        <div style={{ padding: `0 ${pad}`, display: 'grid', gridTemplateColumns: cols2, gap: isMobile ? 16 : 20 }}>
          {/* Recent Learning */}
          {recentSessions.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', letterSpacing: 2.5, textTransform: 'uppercase' }}>Recent Learning</div>
                <div onClick={() => setActiveModule('learn')} style={{ fontSize: 10, color: '#00FFB2', cursor: 'pointer', fontWeight: 600 }}>Continue →</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentSessions.slice(0, 3).map((s, i) => (
                  <div key={i} onClick={() => setActiveModule('learn')}
                    style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                      <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>{timeAgo(s.date)} · {s.durationMin}min</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.confidence >= 7 ? '#00FFB2' : s.confidence >= 4 ? '#ffcc44' : '#ff6644', flexShrink: 0, marginLeft: 8 }}>{s.confidence}/10</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', letterSpacing: 2.5, textTransform: 'uppercase' }}>Vault Notes</div>
                <div onClick={() => setActiveModule('vault')} style={{ fontSize: 10, color: '#ffcc44', cursor: 'pointer', fontWeight: 600 }}>Vault →</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentNotes.map(n => (
                  <div key={n.id} onClick={() => setActiveModule('vault')}
                    style={{ padding: '10px 14px', background: 'var(--surface)', border: `1px solid ${n.color}20`, borderLeft: `3px solid ${n.color}`, borderRadius: 8, cursor: 'pointer', minHeight: 44 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EMPTY STATE (new user) ────────────────────────────────────── */}
      {recentSessions.length === 0 && recentNotes.length === 0 && activeProjects.length === 0 && (
        <div style={{ padding: `0 ${pad}` }}>
          <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 16, lineHeight: 1.7 }}>
              Your hub is fresh. Start anywhere below — each module builds your intelligence graph.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '📚 Start a Book', id: 'learn' },
                { label: '🔭 Run Research', id: 'research' },
                { label: '🎙️ Browse Podcasts', id: 'podcast' },
              ].map(a => (
                <div key={a.id} onClick={() => setActiveModule(a.id)}
                  style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-b)', cursor: 'pointer', minHeight: 36, display: 'flex', alignItems: 'center' }}>
                  {a.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
