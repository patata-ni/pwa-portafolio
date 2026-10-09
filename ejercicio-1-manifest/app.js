const status = document.querySelector('#status');
const installButton = document.querySelector('#install');
const standalone = matchMedia('(display-mode: standalone)');
function showDisplayMode() {
  status.textContent = standalone.matches
    ? 'La aplicación está abierta en modo independiente.'
    : 'La aplicación está abierta en una pestaña del navegador.';
}
showDisplayMode();
standalone.addEventListener('change', showDisplayMode);
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
    status.textContent = choice.outcome === 'accepted'
      ? 'Solicitud de instalación aceptada.'
      : 'Instalación cancelada; puedes seguir usando la web.';
  } catch (error) {
    console.error('No se pudo mostrar la instalación:', error);
    status.textContent = `No se pudo iniciar la instalación: ${error.message}`;
  }
});
window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  installButton.hidden = true;
  status.textContent = 'Aplicación instalada.';
});
