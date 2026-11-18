// src/modules/markets-surface/useMarkets.js — the Markets data hook, split out of
// MarketsSurface.jsx (AE2 bundle offset) so the ~6KB MarketsSurface COMPONENT can lazy-load on
// the Markets tab while this tiny hook stays eager. No behaviour change (the setInterval here is
// pre-existing, moved verbatim — not a new poll).
import { useState, useEffect, useCallback } from 'react';

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
