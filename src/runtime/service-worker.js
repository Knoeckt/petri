// Build placeholders are filled by build/offline.ts. Never serve this template directly.
const SHELL = __SHELL_MANIFEST__;
const PREFIX = `petri-app:${encodeURIComponent(self.registration.scope)}:`;
const CACHE = PREFIX + '__BUILD_ID__';
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
    key.startsWith(PREFIX) && key !== CACHE
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
