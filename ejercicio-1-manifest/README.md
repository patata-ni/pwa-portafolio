# Ejercicio 1: Web App Manifest

Entrega individual, sin frameworks ni dependencias externas.

## Ejecutar

Instala Node.js 18 o superior. Abre una terminal en esta carpeta:

```powershell
node .\servidor.cjs
```

Abre http://localhost:8101. Detén el servidor con Ctrl+C.
Puedes cambiar el puerto con `node .\servidor.cjs 8201`.
No abras el HTML mediante `file://`: el manifiesto se verifica desde HTTP/HTTPS.

## Archivos y requisitos

- [index.html](./index.html): enlaza el manifiesto y define los metadatos.
- [manifest.json](./manifest.json): `name`, `short_name`, `start_url`,
  `display: standalone`, `theme_color`, `background_color`, `id` y `scope`.
- [Icono 192](./icons/icon-192.png) y [Icono 512](./icons/icon-512.png):
  PNG reales con las dimensiones indicadas, diseñados para esta entrega.
- [app.js](./app.js): detecta standalone y muestra instalación cuando Chrome
  proporciona `beforeinstallprompt`. La disponibilidad depende del navegador.

## Verificación en Chrome DevTools

1. Abre Application → Manifest.
2. Revisa nombre, inicio, display, colores y las dos miniaturas de los iconos.
3. Network → recarga: el manifiesto y los dos PNG deben devolver HTTP 200.
4. Si el navegador ofrece instalación, instálala y ábrela desde su icono.
   La interfaz debe indicar el modo independiente.

Este ejercicio no añade Service Worker ni funcionamiento offline:
su objetivo es únicamente el manifiesto. No se garantiza que todos los
navegadores ofrezcan instalación con los mismos criterios.

## GitHub Pages

Esta carpeta es una subcarpeta del portafolio; Pages publica el repositorio
desde main / (root) y este ejercicio queda en
https://patata-ni.github.io/pwa-portafolio/ejercicio-1-manifest/.
Las rutas relativas y el scope `./` lo mantienen aislado de los demás.
Node solo se usa para probar localmente; Pages sirve los archivos estáticos.
