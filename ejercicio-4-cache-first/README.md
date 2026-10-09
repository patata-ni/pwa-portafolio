# Ejercicio 4: Cache API y Cache-First

Aplicación autocontenida con manifiesto, iconos y Service Worker propios.

## Ejecutar

Con Node.js 18 o superior, desde esta carpeta:

```powershell
node .\servidor.cjs
```

Abre http://localhost:8104. Ctrl+C detiene el servidor.
Puedes usar otro puerto: `node .\servidor.cjs 8204`.

## Estrategia

[sw.js](./sw.js) crea una caché versionada durante `install` y usa
`cache.addAll` para almacenar:

- raíz e [index.html](./index.html);
- [styles.css](./styles.css) y [app.js](./app.js);
- [manifest.json](./manifest.json);
- ambos iconos PNG.

Si falla el precache, falla la instalación: no se anuncia éxito parcial.
En `activate` elimina únicamente versiones antiguas de ESTE ejercicio y scope.
En `fetch`, para GET del mismo origen:

1. Busca la petición exacta en la caché actual.
2. Si existe, la devuelve sin ir a la red.
3. Si falta, consulta la red; no añade caché dinámica.
4. Si la red falla, responde 503 de texto y registra el error.

No se ignoran parámetros de consulta; `index.html?prueba=1` es otra petición.
Las peticiones externas y POST no se interceptan.
Los errores HTTP del servidor se conservan.

## Validar

1. Espera el estado “esta página ya usa Cache-First”.
2. Pulsa Consultar caché: deben aparecer los 7 recursos.
3. DevTools → Application → Cache Storage: revisa el contenido.
4. Network → Offline → recarga la raíz: debe seguir cargando HTML, CSS,
   JavaScript y el icono. Las respuestas deben provenir del Service Worker.
5. Abre `/no-guardado.html` offline: obtendrás 503 de texto, no HTML de fallback.
6. Vuelve a Online. Al actualizar recursos, incrementa `v1` en el worker a
   `v2`; espera el nuevo worker y cierra las pestañas para activarlo.

El servidor usa `Cache-Control: no-store` para distinguir la caché HTTP
de la caché explícita del Service Worker. Cache API sí conserva el App Shell.
`navigator.onLine` solo informa conectividad aproximada; no prueba acceso real.

## Publicar

Pages publica el portafolio desde main / (root); este ejercicio queda en
https://patata-ni.github.io/pwa-portafolio/ejercicio-4-cache-first/.
HTTPS y rutas relativas fijan el scope a la subcarpeta. El nombre de la
caché incluye ese scope, así que no se mezcla con la del ejercicio 5.
