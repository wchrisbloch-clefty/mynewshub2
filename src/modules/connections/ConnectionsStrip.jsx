// ─── CONNECTIONS STRIP (G6) ───────────────────────────────────────────────────
// Compact sidebar module: up to 3 cross-category bridges, divided-row style (no
// images, no new card type). Each row: bridge label + shared entities + lead
// headline + outlet count. Empty = render nothing. ?debug=1 shows why each matched.
import './ConnectionsStrip.css';

export function ConnectionsStrip({ connections = [], onRead, formatDate, debug = false }) {
  if (!connections || !connections.length) return null;
  return (
    <div className="sidebar-section conn-section">
      <div className="sidebar-sec-head">
        <span className="sidebar-sec-label">Connections</span>
      </div>
      <div className="conn-list">
        {connections.slice(0, 3).map((c, i) => (
          <button key={c.key || i} className="conn-row" onClick={() => onRead?.(c.lead)}>
            <span className="eyebrow conn-bridge">{c.bridge}</span>
            <span className="conn-title">{c.lead.title}</span>
            <span className="conn-meta">{c.shared.join(', ')} · {c.outlets} outlets</span>
            {debug && (
              <span className="conn-debug">
                why: {c.shared.join(' + ')} · {c.members.length} stories · {c.categories.join(' / ')}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
