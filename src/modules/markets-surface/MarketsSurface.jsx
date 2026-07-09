// ─── MARKETS SURFACE ──────────────────────────────────────────────────────────
// A drop-in markets view: a sticky, horizontally-scrollable index ticker rail and
// a gainers/losers/most-active movers block (tabs on mobile, three columns at
// ≥1024px). Self-contained: consumes one consolidated payload and its own CSS.
//
// Exports:
//   useMarkets({ endpoint? }) -> { data, loading, error, refresh }
//     Owns the single request to the markets endpoint (default /api/markets) and a
//     60s auto-refresh that only fires while the tab is visible.
//   <MarketsSurface mkt loading error />
//     Presentational. `mkt` is the payload: { indices[], gainers[], losers[], actives[] }.
//
// Styling: co-located MarketsSurface.css + design tokens (src/styles/tokens.css).

import { useState, useEffect, useCallback } from 'react';
import './MarketsSurface.css';

const fmtPrice = n => n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function useMarkets({ endpoint = '/api/markets' } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error('http');
      const d = await r.json();
      setData(d); setError(!!d.error && !(d.indices || []).length);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => {
    refresh();
    const iv = setInterval(() => { if (!document.hidden) refresh(); }, 60000);
    const onVis = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [refresh]);
  return { data, loading, error, refresh };
}

export function MarketsSurface({ mkt, loading, error }) {
  const [moverTab, setMoverTab] = useState('gainers');
  const Movers = ({ title, list, kind }) => (
    <div className={`mkt-mover-col ${moverTab === kind ? 'active' : ''}`}>
      <div className="mkt-mover-head">{title}</div>
      {(list || []).map(m => { const up = (m.pct || 0) >= 0; return (
        <a key={m.symbol} className="mkt-mover-row" href={`https://finance.yahoo.com/quote/${encodeURIComponent(m.symbol)}`} target="_blank" rel="noreferrer">
          <span className="mkt-mover-sym">{m.symbol}</span>
          <span className="mkt-mover-name">{m.name}</span>
          <span className="mkt-mover-px">{fmtPrice(m.price)}</span>
          <span className={`mkt-mover-pct ${up ? 'mkt-up' : 'mkt-down'}`}>{up ? '▲' : '▼'} {Math.abs(m.pct || 0).toFixed(2)}%</span>
        </a>); })}
      {(!list || !list.length) && <div className="mkt-mover-empty">—</div>}
    </div>
  );
  return (
    <>
      {/* (a) STICKY TICKER RAIL — indices, price, % green/red, tabular nums */}
      {loading && !mkt
        ? <div className="mkt-rail"><div className="mkt-rail-inner">{Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mkt-rail-item"><span className="sk-line" style={{ width: '56px' }}/><span className="sk-line" style={{ width: '72px' }}/></div>
          ))}</div></div>
        : (mkt?.indices || []).length > 0 && (
          <div className="mkt-rail"><div className="mkt-rail-inner">
            {mkt.indices.map(ix => { const up = (ix.pct || 0) >= 0; return (
              <div key={ix.symbol} className="mkt-rail-item">
                <span className="mkt-rail-name">{ix.name}</span>
                <span className="mkt-rail-px">{fmtPrice(ix.price)}</span>
                <span className={`mkt-rail-pct ${up ? 'mkt-up' : 'mkt-down'}`}>{up ? '▲' : '▼'} {Math.abs(ix.pct || 0).toFixed(2)}%</span>
              </div>); })}
          </div></div>
        )}

      {error && <div className="mkt-fail">Live market data is temporarily unavailable. Latest markets news is below.</div>}

      {/* (b) MOVERS — 3 tabs on mobile, 3 columns at ≥1024px */}
      <section className="mkt-movers-section">
        <div className="mkt-mover-tabs">
          {[['gainers', 'Gainers'], ['losers', 'Losers'], ['actives', 'Most Active']].map(([k, l]) => (
            <button key={k} className={`mkt-mover-tab ${moverTab === k ? 'active' : ''}`} onClick={() => setMoverTab(k)}>{l}</button>
          ))}
        </div>
        {loading && !mkt
          ? <div className="mkt-mover-cols">{Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`mkt-mover-col ${i === 0 ? 'active' : ''}`}><div className="mkt-mover-head">&nbsp;</div>
                {Array.from({ length: 6 }).map((_, j) => <div key={j} className="mkt-mover-row"><span className="sk-line"/></div>)}
              </div>))}</div>
          : <div className="mkt-mover-cols">
              <Movers title="Gainers" list={mkt?.gainers} kind="gainers"/>
              <Movers title="Losers" list={mkt?.losers} kind="losers"/>
              <Movers title="Most Active" list={mkt?.actives} kind="actives"/>
            </div>}
      </section>
    </>
  );
}
