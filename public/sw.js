/* MyNewsHub service worker — CONSERVATIVE.
   Caches only the app shell + hashed static assets (same-origin /assets/*).
   NEVER caches /api/*, feeds, quotes, cross-origin, or any non-GET request.
   HTML is network-first so a new deploy is never stuck behind a stale cache.
   Bump VERSION to invalidate every cache on the next activate. */
const VERSION = 'mnh-v1';
const SHELL = VERSION + '-shell';
const ASSETS = VERSION + '-assets';
const SHELL_URLS = ['/', '/offline.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                     // never cache writes
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // feeds / fonts CDN / quotes: untouched
  if (url.pathname.startsWith('/api/')) return;         // NEVER cache /api/*

  // HTML / navigations: network-first → cached shell → offline page.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(SHELL); c.put('/', net.clone()).catch(() => {});
        return net;
      } catch {
        return (await caches.match('/')) || (await caches.match('/offline.html')) || Response.error();
      }
    })());
    return;
  }

  // Hashed, immutable build assets: cache-first.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      try { const net = await fetch(req); const c = await caches.open(ASSETS); c.put(req, net.clone()); return net; }
      catch { return hit || Response.error(); }
    })());
  }
});

/* Kill switch: the page posts 'KILL' (see SW_KILL in src/index.jsx) to clear caches
   and unregister. */
self.addEventListener('message', (e) => {
  if (e.data === 'KILL') {
    e.waitUntil(caches.keys()
      .then((ks) => Promise.all(ks.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister()));
  }
});
