import { useApp } from '../App.jsx';
import { NAV_ITEMS } from '../constants.js';

export default function Sidebar() {
  const { activeModule, setActiveModule, sidebarCollapsed, setSidebarCollapsed, graph } = useApp();

  const topics = Object.values(graph?.topics || {});
  const totalMin = graph?.totalTime || 0;
  const streak = graph?.streak || 0;

  return (
    <aside style={{
      width: sidebarCollapsed ? 56 : 200,
      minWidth: sidebarCollapsed ? 56 : 200,
      height: '100vh',
      background: 'var(--bg-alt)',
      borderRight: '1px solid var(--bord2)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 10,
      flexShrink: 0,
    }}>
      <div style={{ padding: sidebarCollapsed ? '16px 0' : '16px 14px', borderBottom: '1px solid var(--bord2)', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: 8, minHeight: 57 }}>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: "'Fraunces', serif", letterSpacing: -0.3 }}>Aether</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#00FFB2', textTransform: 'uppercase', marginTop: 1 }}>Intelligence Hub</div>
          </div>
        )}
        {sidebarCollapsed && <div style={{ fontSize: 16 }}>⚡</div>}
        <div
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', flexShrink: 0, color: 'var(--subtle)', fontSize: 10 }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = activeModule === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: sidebarCollapsed ? '10px 0' : '9px 14px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                background: active ? `${item.accent}10` : 'transparent',
                borderRight: active ? `2px solid ${item.accent}` : '2px solid transparent',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? item.accent : 'var(--muted)' }}>
                  {item.label}
                </span>
              )}
              {active && sidebarCollapsed && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 20, background: item.accent, borderRadius: 1 }} />
              )}
            </div>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bord2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[
              { val: streak, label: 'streak', color: '#00FFB2' },
              { val: topics.length, label: 'topics', color: '#6366F1' },
              { val: Math.round(totalMin / 60) + 'h', label: 'learned', color: '#ffcc44' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'var(--surface)', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 8, color: 'var(--dim)', letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: 'var(--surface)', borderRadius: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000', flexShrink: 0 }}>CB</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>CB</div>
              <div style={{ fontSize: 9, color: 'var(--dim)' }}>Houston, TX</div>
            </div>
          </div>
        </div>
      )}

      {sidebarCollapsed && (
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--bord2)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000' }}>CB</div>
        </div>
      )}
    </aside>
  );
}
