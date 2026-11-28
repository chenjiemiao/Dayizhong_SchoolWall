const CACHE = 'dayizhong-wall-v3';
const SHELL = [
  './',
  './index.html',
  './app.html',
  './account.html',
  './publish.html',
  './title.html',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 接口一律走网络，永不缓存
  if (url.hostname.indexOf('tcloudbase') !== -1) return;
  if (url.hostname.indexOf('supabase') !== -1) return;
  if (url.pathname.indexOf('/functions/v1/') !== -1) return;
  if (url.pathname.indexOf('/rest/v1/') !== -1) return;
  if (url.pathname.indexOf('/storage/v1/') !== -1) return;

  // 页面：网络优先，断网时用缓存
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./app.html')))
    );
    return;
  }

  // 图片等静态资源：缓存优先
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && (req.destination === 'image' || req.destination === 'script' || req.destination === 'style')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => hit))
  );
});
