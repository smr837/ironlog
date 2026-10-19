// Ironlog offline support: keeps the app and its fonts cached so it opens without a connection.
const CACHE = 'ironlog-v2';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const store = res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };

  // The app itself: try the network for updates, fall back to the cached copy offline.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(store).catch(() => caches.match(req).then(m => m || caches.match('./index.html'))));
    return;
  }
  // Google Fonts: cache first, they never change.
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(store)));
  }
});
