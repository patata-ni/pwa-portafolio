const CACHE_PREFIX = `pwa-e5-${new URL(self.registration.scope).pathname}-`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = new URL('./offline.html', self.registration.scope).href;
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './offline.html', './offline.js'
].map((path) => new URL(path, self.registration.scope).href);
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' })));
    console.info('[Ejercicio 5] App Shell y fallback guardados.');
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
    console.info('[Ejercicio 5] Caché activa:', CACHE_NAME);
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
      console.warn('[Ejercicio 5] Falló la conexión:', event.request.url, error);
      if (event.request.mode === 'navigate') {
        const fallback = await cache.match(OFFLINE_URL);
        if (fallback) {
          // La navegacion conserva su URL, incluso si pertenece a una subruta.
          const base = self.registration.scope.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          const html = (await fallback.text()).replace('<head>', `<head><base href="${base}">`);
          return new Response(html, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        }
        console.error('[Ejercicio 5] Falta offline.html en la caché.');
      }
      return new Response('Modo Sin Conexión: el recurso solicitado no está disponible.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
  })());
});
