const swStatus = document.querySelector('#sw-status');
const networkStatus = document.querySelector('#network-status');
const cacheStatus = document.querySelector('#cache-status');
function updateNetwork() {
  networkStatus.textContent = navigator.onLine
    ? 'El navegador informa conexión disponible; esto no garantiza acceso al servidor.'
    : 'Modo sin conexión detectado por el navegador.';
}
updateNetwork();
window.addEventListener('online', updateNetwork);
window.addEventListener('offline', updateNetwork);
function showController() {
  swStatus.textContent = navigator.serviceWorker.controller
    ? 'Service Worker activo: esta página ya usa Cache-First.'
    : 'Registro completado. Esperando que el Service Worker controle la página…';
}
window.addEventListener('load', async () => {
  if (!('serviceWorker' in navigator)) {
    swStatus.textContent = 'Este navegador no admite Service Workers.';
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', showController);
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const monitor = (worker) => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'redundant') swStatus.textContent = 'El worker fue descartado. Revisa la consola y los recursos del precache.';
        if (worker.state === 'installed' && navigator.serviceWorker.controller) swStatus.textContent = 'Nueva versión en espera. Cierra las pestañas de esta aplicación para activarla.';
      });
    };
    monitor(registration.installing);
    registration.addEventListener('updatefound', () => monitor(registration.installing));
    if (registration.waiting) swStatus.textContent = 'Actualización en espera. Cierra las pestañas de esta aplicación para activarla.';
    else showController();
  } catch (error) {
    console.error('Error de registro:', error);
    swStatus.textContent = `No se pudo registrar el Service Worker: ${error.message}`;
  }
});
document.querySelector('#inspect').addEventListener('click', async () => {
  const resources = document.querySelector('#resources');
  resources.replaceChildren();
  if (!('caches' in window)) {
    cacheStatus.textContent = 'Cache API no disponible. Usa HTTPS o localhost.';
    return;
  }
  try {
    const names = (await caches.keys()).filter((name) => name.startsWith(`pwa-e4-${new URL('./', location.href).pathname}-`));
    if (!names.length) {
      cacheStatus.textContent = 'No hay caché todavía. Revisa la instalación del Service Worker.';
      return;
    }
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const item = document.createElement('li');
        item.textContent = `${name}: ${new URL(request.url).pathname}`;
        resources.append(item);
      }
    }
    cacheStatus.textContent = `${resources.children.length} recursos encontrados.`;
  } catch (error) {
    console.error('No se pudo leer la caché:', error);
    cacheStatus.textContent = `Error al consultar la caché: ${error.message}`;
  }
});
