// AG3: "Also moving" strip — up to 5 behind-the-scenes stories with a neutral "why" chip. Lazy (not
// first paint). Labelled inferred; never affects ranking/tier. Empty → renders nothing (no empty box).
// Rows are computed by selectAlsoMoving in FeedPage (so their keys can be excluded from Latest).
import './AlsoMoving.css';

export function AlsoMoving({ rows = [], onRead, formatDate }) {
  if (!rows.length) return null;
  return (
    <section className="almv" aria-label="Also moving">
      <div className="almv-head"><span className="almv-label">Also moving</span><span className="almv-inferred">inferred</span></div>
      {rows.map(({ item, why }, i) => (
        <button key={item.link || i} className="almv-row" onClick={() => onRead(item)}>
          <span className="almv-title">{item.title}</span>
          <span className="almv-foot"><span className="almv-why">{why}</span><span className="almv-src">{item.source}{formatDate ? ' · ' + formatDate(item.pubDate) : ''}</span></span>
        </button>
      ))}
    </section>
  );
}
