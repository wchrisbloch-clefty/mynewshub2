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
      background: '#060610',
      borderRight: '1px solid #1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Logo + collapse toggle */}
      <div style={{ padding: sidebarCollapsed ? '16px 0' : '16px 14px', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: 8, minHeight: 57 }}>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif", letterSpacing: -0.3 }}>Aether</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#00FFB2', textTransform: 'uppercase', marginTop: 1 }}>Intelligence Hub</div>
          </div>
        )}
        {sidebarCollapsed && <div style={{ fontSize: 16 }}>⚡</div>}
        <div
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 5, cursor: 'pointer', flexShrink: 0, color: '#445', fontSize: 10 }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = activeModule === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
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
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? item.accent : '#556' }}>
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

      {/* Stats footer */}
      {!sidebarCollapsed && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1a1a2e' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, background: '#0c0c18', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#00FFB2' }}>{streak}</div>
              <div style={{ fontSize: 8, color: '#334', letterSpacing: 1 }}>streak</div>
            </div>
            <div style={{ flex: 1, background: '#0c0c18', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6366F1' }}>{topics.length}</div>
              <div style={{ fontSize: 8, color: '#334', letterSpacing: 1 }}>topics</div>
            </div>
            <div style={{ flex: 1, background: '#0c0c18', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#ffcc44' }}>{Math.round(totalMin / 60)}h</div>
              <div style={{ fontSize: 8, color: '#334', letterSpacing: 1 }}>learned</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: '#0c0c18', borderRadius: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000', flexShrink: 0 }}>CB</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>CB</div>
              <div style={{ fontSize: 9, color: '#334' }}>Houston, TX</div>
            </div>
          </div>
        </div>
      )}

      {sidebarCollapsed && (
        <div style={{ padding: '12px 0', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000' }}>CB</div>
        </div>
      )}
    </aside>
  );
}
