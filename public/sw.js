// Petri (new build) service worker, scoped to /app/: the page is network-first so updates arrive on the next
// launch; hashed assets, icons and fonts are cache-first so the app opens offline.
const CACHE = 'petri-app-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const path = new URL(req.url).pathname;
  const isPage = req.mode === 'navigate' || path.endsWith('/index.html');
  if (isPage) { e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && (req.url.startsWith(self.location.origin) || /fonts\.(googleapis|gstatic)\.com/.test(req.url))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
