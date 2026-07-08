// api/markets.js — Phase 3. ONE consolidated markets payload from Financial
// Modeling Prep so the client makes exactly one request. Key stays in env.
//
// Returns: { indices[], gainers[6], losers[6], actives[6], news[~12], asOf, error }
// Cache ~30s at the edge (s-maxage) so bursts of clients share a single upstream.

const FMP = 'https://financialmodelingprep.com/stable';
const INDEX_SYMS = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
const INDEX_LABELS = { '^GSPC':'S&P 500', '^DJI':'Dow', '^IXIC':'Nasdaq', '^RUT':'Russell 2000', '^VIX':'VIX' };

const num = v => (v == null || isNaN(+v)) ? null : +v;
// Movers use `changesPercentage`; index quotes use `changePercentage` — normalize to `pct`.
const mapMover = m => ({ symbol:m.symbol, name:m.name, price:num(m.price), pct:num(m.changesPercentage), change:num(m.change) });

async function fmp(path) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${FMP}/${path}${sep}apikey=${process.env.FMP_API_KEY}`, { signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error(`FMP ${path} -> ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (!process.env.FMP_API_KEY) {
    return res.status(200).json({ error: 'FMP_API_KEY not configured', indices:[], gainers:[], losers:[], actives:[], news:[] });
  }

  // Each sub-request degrades to null on failure so one bad endpoint never blanks the page.
  const safe = (path, fn) => fmp(path).then(fn).catch(() => null);

  const [idx, gain, lose, act, news] = await Promise.all([
    safe(`batch-quote?symbols=${encodeURIComponent(INDEX_SYMS.join(','))}`, d => {
      const by = {}; (d || []).forEach(q => { by[q.symbol] = q; });
      return INDEX_SYMS.filter(s => by[s]).map(s => ({
        symbol: s, name: INDEX_LABELS[s] || by[s].name,
        price: num(by[s].price), pct: num(by[s].changePercentage), change: num(by[s].change),
      }));
    }),
    safe('biggest-gainers', d => (d || []).slice(0, 6).map(mapMover)),
    safe('biggest-losers',  d => (d || []).slice(0, 6).map(mapMover)),
    safe('most-actives',    d => (d || []).slice(0, 6).map(mapMover)),
    safe('news/general-latest?page=0&limit=12', d => (d || []).slice(0, 12).map(n => ({
      title: n.title, url: n.url, site: n.site || n.publisher || '',
      image: n.image || '', publishedDate: n.publishedDate, text: (n.text || '').slice(0, 280),
    }))),
  ]);

  const anyOk = idx || gain || lose || act || news;
  return res.status(200).json({
    error: anyOk ? null : 'FMP request failed',
    asOf: new Date().toISOString(),
    indices: idx || [], gainers: gain || [], losers: lose || [], actives: act || [], news: news || [],
  });
}
