const CACHE_PREFIX = `pwa-e4-${new URL(self.registration.scope).pathname}-`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'
].map((path) => new URL(path, self.registration.scope).href);
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' })));
    console.info('[Ejercicio 4] App Shell guardado.');
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
    console.info('[Ejercicio 4] Caché activa:', CACHE_NAME);
  })());
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      return await fetch(event.request);
    } catch (error) {
      console.warn('[Ejercicio 4] Red no disponible:', event.request.url, error);
      return new Response('Sin conexión: este recurso no está guardado en caché.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
  })());
});
