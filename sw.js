/* Service Worker — Academia Memento PWA
   Estrategia:
   - App shell (index.html, íconos, manifest): cache-first con actualización en segundo plano.
   - Navegación / data.json: network-first con fallback a caché (para funcionar sin señal).
   - Firebase / Google Fonts (CDN): se dejan pasar a la red (con caché oportunista de fuentes).
   Subí el número de versión para forzar una actualización del caché. */
const CACHE = 'memento-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './logo-memento.jpg',
  './logo-fmed.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () { /* algún asset opcional puede faltar */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isData = url.pathname.endsWith('data.json') || url.href.indexOf('data.json') !== -1;
  const isNavigation = req.mode === 'navigate';

  // Network-first: navegación y data.json (contenido siempre fresco cuando hay señal).
  if (isNavigation || isData) {
    event.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Cache-first (stale-while-revalidate) para assets estáticos propios.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        const network = fetch(req).then(function (res) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
    return;
  }

  // Fuentes de Google: caché oportunista.
  if (url.host.indexOf('fonts.g') !== -1) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (res) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        });
      })
    );
    return;
  }

  // Resto (Firebase, etc.): directo a la red.
});
