// Build placeholders are filled by build/offline.ts. Never serve this template directly.
const SHELL = [{"url":"./assets/index-B7JJ0TFL.css","integrity":"sha256-xxkSnv8PtS5j9EV1lm8k9LhQquF0GB8iaoRlioGnjs8="},{"url":"./assets/index-DILsXzr6.js","integrity":"sha256-9O7M/B7+g9zdqJpuIVfXj+juhfgDBWHF3KbffsYcdiw="},{"url":"./icons/icon-180.png","integrity":"sha256-uUUBh/nFPXhmk+OtfaPcnOsMkQszYVmphvh6WQ/w5BE="},{"url":"./icons/icon-192.png","integrity":"sha256-vDmIAd3DTBI5ziseHtDIwRu626qb/F/gF7XzQ4gnyuI="},{"url":"./icons/icon-512.png","integrity":"sha256-DMXkeeysntiK9wNOo7j8Ny8cs6oji55jGVb20txypmo="},{"url":"./index.html","integrity":"sha256-VrzxbNMOSYY03dol5d5bVBHks5hVIdRR4P4zp3PyQP4="},{"url":"./manifest.webmanifest","integrity":"sha256-7TOeACimWbjcNgx0jsaJsgVmiQt6/pG1fRsW8sHqYXY="}];
const PREFIX = `petri-app:${encodeURIComponent(self.registration.scope)}:`;
const CACHE = PREFIX + 'e4abcc0501791a5d';
const urls = new Set(SHELL.map(entry => new URL(entry.url, self.registration.scope).href));
const index = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  // A failed or mixed deployment must not replace the last complete offline build.
  // Integrity checks include HTML, preventing a new page being paired with old chunks.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(entry =>
    new Request(new URL(entry.url, self.registration.scope), { cache: 'reload', integrity: entry.integrity })
  ))));
  // Updates wait for all existing game windows to close. No forced mid-game reload.
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    (key.startsWith(PREFIX) && key !== CACHE) || key === 'petri-app-v1' // the pre-0.11.3 worker's cache
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const root = new URL(self.registration.scope);
  if (url.origin !== root.origin) return;
  const isPage = (request.mode === 'navigate' || url.href === index) &&
    (url.pathname === root.pathname || url.pathname === new URL(index).pathname);
  if (!isPage && !urls.has(url.href)) return;
  // Serve the document and its chunks from the same installed build. Query strings
  // on the start page do not prevent an offline launch.
  event.respondWith(caches.open(CACHE).then(async cache => {
    // These are integrity-pinned public files. A server's Vary: Origin must not
    // hide a pre-cached file when a module request adds its Origin header.
    const hit = await cache.match(isPage ? index : request, { ignoreVary: true });
    return hit || fetch(request);
  }));
});
