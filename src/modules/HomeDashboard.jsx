import { useState } from 'react';
import { useApp } from '../App.jsx';
import { callClaude, buildSystem, timeAgo } from '../utils.js';
import { CB_LEARNING_SPINE } from '../constants.js';
import MD from './shared/MD.jsx';
import { Card, Label, ThinkingDots } from './shared/Common.jsx';

const BRIEF_PROMPTS = [
  "Give CB a concise morning intelligence brief (4-5 bullet points max). Cover: (1) The single most important strategic insight for someone in his position today — connect to his goals and mental models. (2) One Blue Ocean opportunity signal. (3) One decisive action for the day. Format: use CB's learning style — big picture first, decisive at the end. Keep it sharp and energizing, not overwhelming.",
];

const BLUE_OCEAN_SIGNALS = [
  { title: "Small Multifamily in Transitioning Houston Zip Codes", insight: "Institutional buyers ignore sub-10 unit buildings. Value-add opportunity before AI-driven migration trends reprice these markets.", category: "Real Estate", urgency: "high" },
  { title: "AI-Augmented BD Professionals", insight: "Most BD reps are not integrating AI into prospecting. First movers who build systematic AI-enhanced pipelines will have a 10x advantage within 18 months.", category: "Career/Business", urgency: "high" },
  { title: "Covered Calls on Dividend Portfolios", insight: "Retail investors who do this systematically generate 3-5% additional yield with no additional capital. Almost no one does it despite the math being obvious.", category: "Finance", urgency: "medium" },
  { title: "ERCOT Ancillary Services", insight: "Texas grid volatility creates pricing opportunities in frequency regulation and demand response — deeply underutilized by non-institutional players.", category: "Energy/Macro", urgency: "medium" },
];

export default function HomeDashboard() {
  const { graph, projects, notes, setActiveModule, isMobile } = useApp();
  const [brief, setBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefGenerated, setBriefGenerated] = useState(false);

  const topics = Object.values(graph?.topics || {});
  const totalSessions = (graph?.sessions || []).length;
  const totalMin = graph?.totalTime || 0;
  const avgConf = topics.length ? Math.round(topics.reduce((s, t) => s + t.confidence, 0) / topics.length) : 0;
  const activeProjects = projects.filter(p => p.status === 'active');
  const recentSessions = (graph?.sessions || []).slice(-3).reverse();
  const recentNotes = (notes || []).slice(-2);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const generateBrief = async () => {
    setBriefLoading(true);
    try {
      const system = CB_LEARNING_SPINE;
      const msg = BRIEF_PROMPTS[0] + "\n\nCB's current context:\n- Active projects: " + activeProjects.map(p => p.title).join(', ') + '\n- Recent learning: ' + topics.slice(-3).map(t => t.title).join(', ') + '\n- Learning streak: ' + (graph?.streak || 0) + ' days';
      const reply = await callClaude({ system, messages: [{ role: 'user', content: msg }], maxTokens: 600 });
      setBrief(reply);
      setBriefGenerated(true);
    } catch {
      setBrief('Unable to generate brief. Check your connection.');
      setBriefGenerated(true);
    }
    setBriefLoading(false);
  };

  const statCards = [
    { label: 'Learning Hours', value: Math.round(totalMin / 60) + 'h', accent: '#00FFB2', icon: '📚', sub: `${totalSessions} sessions` },
    { label: 'Active Projects', value: activeProjects.length, accent: '#ff8844', icon: '🚀', sub: `${projects.length} total` },
    { label: 'Avg Confidence', value: avgConf + '/10', accent: '#6366F1', icon: '🎯', sub: `${topics.length} topics` },
    { label: 'Day Streak', value: (graph?.streak || 0), accent: '#ffcc44', icon: '🔥', sub: 'days active' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px 16px 60px' : '24px 28px 60px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 6 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: "'Fraunces', serif", letterSpacing: -0.5, marginBottom: 4 }}>{greeting}, CB.</div>
        <div style={{ fontSize: 12, color: 'var(--subtle)' }}>Your intelligence hub is ready. {topics.length > 0 ? `${topics.length} topics tracked, ${activeProjects.length} projects active.` : 'Start by adding a book or topic.'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCards.map(s => (
          <Card key={s.label} color={s.accent} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 18 }}>{s.icon}</div>
              <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: 1 }}>{s.sub}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.accent, marginBottom: 2, fontFamily: "'Fraunces', serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--subtle)', letterSpacing: 0.5 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card color="#00FFB2" style={{ padding: '18px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <Label color="#00FFB2">⚡ Daily Intelligence Brief</Label>
              <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: -4 }}>CB-style — big picture first</div>
            </div>
            {!briefGenerated && (
              <div onClick={generateBrief} style={{ fontSize: 10, padding: '5px 12px', background: '#00FFB215', border: '1px solid #00FFB240', borderRadius: 8, color: '#00FFB2', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {briefLoading ? '...' : 'Generate'}
              </div>
            )}
          </div>
          {briefLoading && (
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 10 }}>Generating your intelligence brief...</div>
              <ThinkingDots color="#00FFB2" />
            </div>
          )}
          {briefGenerated && brief && <MD text={brief} color="#00FFB2" />}
          {!briefGenerated && !briefLoading && (
            <div style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--dim)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
              <div style={{ fontSize: 11 }}>Generate your daily brief — CB-style intelligence snapshot in 10 seconds.</div>
            </div>
          )}
        </Card>

        <Card color="#ff8844" style={{ padding: '18px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Label color="#ff8844">🚀 Active Projects</Label>
            <div onClick={() => setActiveModule('projects')} style={{ fontSize: 10, color: '#ff8844', cursor: 'pointer' }}>View all →</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeProjects.slice(0, 3).map(p => {
              const done = p.milestones.filter(m => m.done).length;
              const pct = Math.round((done / p.milestones.length) * 100);
              return (
                <div key={p.id} onClick={() => setActiveModule('projects')} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{p.emoji} {p.title}</div>
                    <div style={{ fontSize: 10, color: p.color }}>{pct}%</div>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 2, height: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
            {activeProjects.length === 0 && <div style={{ fontSize: 11, color: 'var(--dim)', textAlign: 'center', padding: 16 }}>No active projects. Add one →</div>}
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Label color="#6366F1">🌊 Blue Ocean Signals</Label>
          <div onClick={() => setActiveModule('research')} style={{ fontSize: 10, color: '#6366F1', cursor: 'pointer' }}>Explore →</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
          {BLUE_OCEAN_SIGNALS.map((s, i) => (
            <Card key={i} color={s.urgency === 'high' ? '#00FFB2' : '#6366F1'} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: s.urgency === 'high' ? '#00FFB2' : '#6366F1', fontWeight: 600 }}>{s.category}</div>
                <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: s.urgency === 'high' ? '#00FFB2' : '#6366F1', background: s.urgency === 'high' ? '#00FFB218' : '#6366F118', border: `1px solid ${s.urgency === 'high' ? '#00FFB230' : '#6366F130'}`, borderRadius: 4, padding: '3px 7px', fontWeight: 700 }}>{s.urgency}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: 'var(--subtle)', lineHeight: 1.65 }}>{s.insight}</div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Label>Recent Learning</Label>
            <div onClick={() => setActiveModule('learn')} style={{ fontSize: 10, color: '#00FFB2', cursor: 'pointer' }}>Continue →</div>
          </div>
          {recentSessions.length === 0 && <div style={{ fontSize: 11, color: 'var(--dim)', padding: '16px 0' }}>No sessions yet. Start learning →</div>}
          {recentSessions.map((s, i) => (
            <div key={i} onClick={() => setActiveModule('learn')} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 7, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.title}</div>
                <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>{timeAgo(s.date)} · {s.durationMin}min</div>
              </div>
              <div style={{ fontSize: 10, color: s.confidence >= 7 ? '#00FFB2' : s.confidence >= 4 ? '#ffcc44' : '#ff6644' }}>{s.confidence}/10</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Label>Recent Notes</Label>
            <div onClick={() => setActiveModule('vault')} style={{ fontSize: 10, color: '#ffcc44', cursor: 'pointer' }}>Vault →</div>
          </div>
          {recentNotes.length === 0 && <div style={{ fontSize: 11, color: 'var(--dim)', padding: '16px 0' }}>No notes yet. Save insights →</div>}
          {recentNotes.map(n => (
            <div key={n.id} onClick={() => setActiveModule('vault')} style={{ padding: '10px 14px', background: 'var(--surface)', border: `1px solid ${n.color}20`, borderRadius: 8, marginBottom: 7, cursor: 'pointer' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 10, color: 'var(--subtle)', lineHeight: 1.55, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
