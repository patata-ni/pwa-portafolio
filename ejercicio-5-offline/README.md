# Ejercicio 5: Interceptor y Modo Sin Conexión

Entrega independiente con App Shell, caché y fallback propios.

## Ejecutar

Node.js 18 o superior, desde esta carpeta:

```powershell
node .\servidor.cjs
```

Abre http://localhost:8105. Ctrl+C detiene el servidor.
Otro puerto: `node .\servidor.cjs 8205`.

## Comportamiento

[sw.js](./sw.js) guarda el App Shell y [offline.html](./offline.html) durante
install. Usa Cache-First para GET del mismo origen:

- recurso guardado: respuesta de caché;
- recurso no guardado con red: respuesta real del servidor;
- navegación no guardada con fallo de red: vista “Modo Sin Conexión”,
  con HTTP 503 y botones para inicio y reintento;
- recurso no HTML sin red: HTTP 503 de texto, nunca HTML disfrazado de JS;
- respuesta HTTP 404/500: se conserva; no se considera fallo de conexión.

El fallback añade una base apuntando al scope para que CSS, iconos y
[offline.js](./offline.js) funcionen incluso desde rutas anidadas.
La dirección solicitada se mantiene: Reintentar vuelve a consultar esa URL.
No se guarda contenido dinámico en caché.

## Prueba reproducible en Chrome DevTools

1. Abre la raíz con red y espera “caché y fallback disponibles”.
2. Application → Cache Storage: comprueba 9 recursos, incluido offline.html.
   [pagina-no-cacheada.html](./pagina-no-cacheada.html) NO debe figurar.
3. Abre “Abrir página no guardada” online: verás “Esta página llegó desde la red”.
4. Vuelve a inicio. Network → Offline, abre de nuevo el enlace:
   verás “Modo Sin Conexión” con estilo e icono.
5. Sin red, “Volver al inicio” debe abrir el App Shell guardado.
6. Repite el fallback, vuelve a Online y pulsa Reintentar:
   debe cargar la página real del servidor.
7. Para comprobar una ruta anidada, abre `/subruta/no-guardada.html`
   directamente offline, con el worker ya activo. Debe conservar el estilo.
8. Online, esa ruta inexistente debe devolver 404, no la vista offline.

DevTools puede no reflejar su opción Offline en `navigator.onLine` de todas
las versiones; la vista se decide por el rechazo real de `fetch`, no por
esa señal. La primera visita sin red no funciona: antes debe instalarse el worker.

Para actualizar el precache incrementa la versión `v1` y cierra las
pestañas de esta aplicación para activar la actualización.

## GitHub Pages

Pages publica el portafolio desde main / (root); este ejercicio queda en
https://patata-ni.github.io/pwa-portafolio/ejercicio-5-offline/.
Todo funciona bajo esa subcarpeta. Para una prueba que excluya la caché HTTP
en Pages, marca Disable cache en Network mientras DevTools está abierto.
