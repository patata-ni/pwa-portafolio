# Ejercicio 3: Registro y ciclo de vida

Aplicación individual, sin dependencias ni referencias a otros ejercicios.

## Ejecutar

Node.js 18 o superior, desde esta carpeta:

```powershell
node .\servidor.cjs
```

Abre http://localhost:8103. Detén con Ctrl+C.
Otro puerto: `node .\servidor.cjs 8203`.
Un Service Worker exige HTTPS o localhost; no funciona mediante `file://`.

## Implementación

- [app.js](./app.js): registro asíncrono al terminar la carga, manejo explícito
  de errores, observación de `statechange`, `updatefound`, `controllerchange`
  y mensajes del worker.
- [sw.js](./sw.js): listeners `install`, `activate` y `fetch`.
  `event.waitUntil` extiende instalación/activación.
  `clients.claim()` controla clientes tras activarse.
  Las peticiones GET del mismo origen se envían a la red con `respondWith`.
- La interfaz muestra hasta 30 eventos y el estado del controlador.

## Validación en Chrome DevTools

1. Application → Service Workers: verifica el scope y estado activated.
2. La interfaz debe mostrar que la página está controlada.
3. Abre la consola del worker mediante Inspect para revisar install/activate.
4. Recarga: observa los mensajes de fetch en dicha consola.
5. Para una instalación limpia, usa Unregister y recarga.
6. Modifica un mensaje del worker y pulsa Update: con otra versión activa,
   el nuevo worker espera. Cierra todas las pestañas de esta aplicación y
   vuelve a abrirla para activar la actualización.

No se fuerza `skipWaiting`: se conserva el ciclo de vida estándar.
Este ejercicio no guarda caché; offline debe fallar, no mostrar una vista
exitosa. Caché y fallback pertenecen a los ejercicios 4 y 5.

## GitHub Pages

Pages publica el portafolio desde main / (root); este ejercicio queda en
https://patata-ni.github.io/pwa-portafolio/ejercicio-3-service-worker/.
El registro relativo fija el scope a esta subcarpeta, sin controlar los
otros ejercicios, que comparten origen pero tienen otro scope.
