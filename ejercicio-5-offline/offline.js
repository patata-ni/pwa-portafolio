const status = document.querySelector('#offline-status');
// El fallback conserva la URL solicitada: la ruta del script ubica el App Shell.
document.querySelector('#home').href = new URL('./', document.currentScript.src).href;
document.querySelector('#retry').addEventListener('click', () => location.reload());
function updateNetwork() {
  status.textContent = navigator.onLine
    ? 'El navegador indica conexión. Pulsa Reintentar para consultar el servidor.'
    : 'El navegador sigue indicando que no hay conexión.';
}
updateNetwork();
window.addEventListener('online', updateNetwork);
window.addEventListener('offline', updateNetwork);
