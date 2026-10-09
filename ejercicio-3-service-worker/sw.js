async function report(phase) {
  console.info(`[Ejercicio 3] ${phase}`);
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    if (client.url.startsWith(self.registration.scope)) {
      client.postMessage({ type: 'LIFECYCLE', phase });
    }
  }
}
self.addEventListener('install', (event) => {
  event.waitUntil(report('install'));
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    await report('activate');
  })());
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  console.info(`[Ejercicio 3] fetch: ${url.pathname}`);
  event.respondWith(fetch(event.request));
});
