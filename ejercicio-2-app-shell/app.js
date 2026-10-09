const displayStatus = document.querySelector('#display-status');
const installButton = document.querySelector('#install');
const standalone = matchMedia('(display-mode: standalone)');
function updateDisplay() {
  displayStatus.textContent = standalone.matches
    ? 'Modo independiente: sin la interfaz habitual del navegador.'
    : 'Modo navegador: revisa el menú para instalar si es compatible.';
}
updateDisplay();
standalone.addEventListener('change', updateDisplay);
function markSection() {
  const current = location.hash || '#inicio';
  document.querySelectorAll('nav a').forEach((link) => {
    if (link.hash === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
markSection();
window.addEventListener('hashchange', markSection);
let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = undefined;
  installButton.hidden = true;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    displayStatus.textContent = choice.outcome === 'accepted'
      ? 'Solicitud aceptada. Abre la aplicación desde su icono después de instalarla.'
      : 'Instalación cancelada.';
  } catch (error) {
    console.error('Error de instalación:', error);
    displayStatus.textContent = `No se pudo iniciar la instalación: ${error.message}`;
  }
});
window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  installButton.hidden = true;
  displayStatus.textContent = 'Aplicación instalada. Ábrela desde su icono.';
});
