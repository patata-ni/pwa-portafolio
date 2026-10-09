const networkStatus = document.querySelector('#network-status');
const swStatus = document.querySelector('#sw-status');
function updateNetwork() {
  networkStatus.textContent = navigator.onLine
    ? 'El navegador informa conexión disponible. El fallback depende del resultado real de cada petición.'
    : 'Modo sin conexión: las páginas no guardadas mostrarán el fallback.';
}
updateNetwork();
window.addEventListener('online', updateNetwork);
window.addEventListener('offline', updateNetwork);
function showController() {
  swStatus.textContent = navigator.serviceWorker.controller
    ? 'Service Worker activo: caché y fallback disponibles.'
    : 'Registro completado. Esperando el controlador…';
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
        if (worker.state === 'redundant') swStatus.textContent = 'Worker descartado: revisa los recursos del precache y la consola.';
        if (worker.state === 'installed' && navigator.serviceWorker.controller) swStatus.textContent = 'Actualización en espera. Cierra las pestañas de esta aplicación para activarla.';
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
