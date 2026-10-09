# Ejercicio 2: App Shell y Splash Screen nativa

Entrega individual: incluye su propio HTML, CSS, JavaScript, manifiesto e iconos.
No utiliza archivos de los otros ejercicios.

## Ejecutar

Con Node.js 18 o superior, desde esta carpeta:

```powershell
node .\servidor.cjs
```

Abre http://localhost:8102. Ctrl+C detiene el servidor.
Otro puerto: `node .\servidor.cjs 8202`.

## App Shell

- [index.html](./index.html): header, navegación accesible, main y footer.
- [styles.css](./styles.css): menú lateral en escritorio; menú horizontal y
  tarjetas apiladas bajo 700 px; respeta preferencia de movimiento reducido.
- [app.js](./app.js): navegación activa, detección de standalone e instalación
  cuando el navegador proporciona el evento correspondiente.
- [manifest.json](./manifest.json): nombre, fondo, tema e iconos de arranque.

## Validar en DevTools

1. Application → Manifest: comprueba los metadatos y los iconos PNG.
2. Activa Device Toolbar y revisa anchos de 360, 768 y 1280 px.
   No debe existir desbordamiento horizontal.
3. Instala desde el menú de Chrome si está disponible y abre la aplicación.
   Su estado debe indicar modo independiente.

## Verificar la Splash Screen real

La Splash Screen es del navegador/sistema operativo, NO una animación HTML.
DevTools verifica el manifiesto y permite revisar la aplicación instalada,
pero emular un teléfono NO demuestra la Splash Screen nativa.

Para comprobarla: publica en GitHub Pages (HTTPS), abre la URL en Chrome
para Android, elige instalar, cierra la aplicación y ábrela desde su icono.
Comprueba el icono, nombre y fondo `#eef4fa` durante el arranque en frío.
Su duración y presentación dependen de Chrome y Android; puede ser breve.
Chrome de escritorio no garantiza la misma experiencia de Android.

Esta comprobación en un dispositivo real queda pendiente hasta realizarla
allí. No se declara verificada solo por revisar el manifiesto.

## iPhone (Safari)

Safari no construye la Splash Screen con el manifiesto. Usa las imágenes
declaradas con `apple-touch-startup-image` en [index.html](./index.html),
una por tamaño de pantalla, generadas en [splash/](./splash/) con el fondo
`#eef4fa` y el icono centrado. Cubren iPhone SE (1.ª gen.) hasta iPhone 16 Pro
Max en vertical; en horizontal y en iPad no hay imagen.

1. Abre la URL HTTPS en Safari → Compartir → Añadir a pantalla de inicio.
2. Abre la app desde el icono nuevo, no desde Safari.
3. iOS guarda la imagen al añadirla: si cambias las imágenes, elimina
   el icono y añádelo de nuevo.

Safari no ofrece `beforeinstallprompt`: el botón de instalar no aparece.
Estas imágenes no se han probado en un iPhone físico.
Este ejercicio no incluye Service Worker: corresponde al ejercicio 3.

## GitHub Pages

Pages publica el portafolio desde main / (root); este ejercicio queda en
https://patata-ni.github.io/pwa-portafolio/ejercicio-2-app-shell/.
Las rutas relativas lo mantienen aislado de los demás ejercicios.
El servidor local no es necesario para el despliegue.
