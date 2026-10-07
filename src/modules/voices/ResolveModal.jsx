// src/modules/voices/ResolveModal.jsx — the add+confirm discovery UI (E2).
//
// Shows up to 3 candidates per platform from /api/voices-resolve with name, @handle, bio,
// followers and a verified flag when available, plus a confidence chip. The user confirms
// PER PLATFORM — nothing is ever auto-accepted, and only an accepted handle is stored. A
// candidate the resolver marked confirmedEligible is highlighted but still requires the tap.
// With no search key the modal says so and manual entry (in the row's Edit) still works.
import './ResolveModal.css';

const PLATFORM_LABEL = { x: 'X', instagram: 'Instagram', linkedin: 'LinkedIn', tiktok: 'TikTok', youtube: 'YouTube' };
const fmtFollowers = n => n == null ? '' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);

export function ResolveModal({ voice, state, onAccept, onClose }) {
  if (!voice) return null;
  const { loading, data } = state || {};
  const platforms = (data && data.platforms) || {};
  const disabled = data && data.enabled === false;
  return (
    <div className="vr-overlay" onClick={onClose}>
      <div className="vr-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={`Find handles for ${voice.name}`}>
        <div className="vr-head">
          <span className="vr-title">Confirm handles · {voice.name}</span>
          <button className="vr-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="vr-sub">Pick the real profile on each platform. Nothing is saved until you accept it — unconfirmed platforms stay empty.</div>
        {loading && <div className="vr-empty">Searching…</div>}
        {!loading && disabled && (
          <div className="vr-empty">{(data && data.note) || 'Add a search key (SEARCH_API_KEY) to enable discovery.'} You can still add handles manually with <strong>Edit</strong>.</div>
        )}
        {!loading && !disabled && Object.keys(PLATFORM_LABEL).map(pk => {
          const cands = platforms[pk] || [];
          return (
            <div key={pk} className="vr-plat">
              <div className="vr-plat-label">{PLATFORM_LABEL[pk]}</div>
              {cands.length === 0 && <div className="vr-none">No candidate found — leave empty or add manually.</div>}
              {cands.map((c, i) => (
                <div key={i} className={`vr-cand ${c.confirmedEligible ? 'vr-eligible' : ''}`}>
                  {c.avatar ? <img className="vr-avatar" src={c.avatar} alt="" /> : <span className="vr-avatar vr-avatar-ph">{(c.displayName || c.handle || '?').slice(0, 1)}</span>}
                  <div className="vr-cand-main">
                    <div className="vr-cand-top">
                      <span className="vr-cand-name">{c.displayName || c.handle}</span>
                      {c.verified && <span className="vr-verified" title="Verified">✓</span>}
                      <span className={`vr-conf vr-conf-${c.confidence}`}>{c.confidence}</span>
                      {c.followers != null && <span className="vr-foll">{fmtFollowers(c.followers)}</span>}
                    </div>
                    <a className="vr-handle" href={c.url} target="_blank" rel="noreferrer">{c.handle} ↗</a>
                    {c.bio && <div className="vr-bio">{c.bio}</div>}
                  </div>
                  <button className="vr-accept" onClick={() => onAccept(pk, c)}>Accept</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
