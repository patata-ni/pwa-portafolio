const status = document.querySelector('#sw-status');
const controllerStatus = document.querySelector('#controller');
const events = document.querySelector('#events');
function log(message) {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString('es')} · ${message}`;
  events.prepend(item);
  if (events.children.length > 30) events.lastElementChild.remove();
}
function showController() {
  const controlled = Boolean(navigator.serviceWorker.controller);
  controllerStatus.textContent = controlled
    ? 'La página está controlada por el Service Worker.'
    : 'La página todavía no está controlada.';
  log(controllerStatus.textContent);
}
function observe(worker) {
  if (!worker) return;
  const update = () => {
    status.textContent = `Estado: ${worker.state}`;
    log(status.textContent);
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      status.textContent = 'Actualización instalada: cierra todas las pestañas de esta aplicación para activarla.';
    }
  };
  update();
  worker.addEventListener('statechange', update);
}
async function registerWorker() {
  if (!('serviceWorker' in navigator)) {
    status.textContent = 'Este navegador no admite Service Workers.';
    controllerStatus.textContent = 'No hay controlador disponible.';
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', showController);
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'LIFECYCLE') log(`Worker: ${event.data.phase}`);
  });
  showController();
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    log(`Registro completado. Scope: ${registration.scope}`);
    observe(registration.installing || registration.waiting || registration.active);
    registration.addEventListener('updatefound', () => observe(registration.installing));
  } catch (error) {
    console.error('No se pudo registrar el Service Worker:', error);
    status.textContent = `Error de registro: ${error.message}. Usa HTTPS o localhost.`;
    log(status.textContent);
  }
}
window.addEventListener('load', registerWorker);
