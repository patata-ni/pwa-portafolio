# Portafolio PWA: cinco ejercicios

Portafolio de Progressive Web Apps. Cada ejercicio está en su subcarpeta, es
autocontenido y se publica en
https://patata-ni.github.io/pwa-portafolio/.
No hay dependencias entre ejercicios ni paquetes que instalar.
Requisito para probar localmente: Node.js 18 o superior.

| Ejercicio | Carpeta | Sitio publicado | Puerto local |
|---|---|---|---|
| 1. Manifest e iconos PNG | [ejercicio-1-manifest](./ejercicio-1-manifest/) | [abrir](https://patata-ni.github.io/pwa-portafolio/ejercicio-1-manifest/) | 8101 |
| 2. App Shell y Splash nativa | [ejercicio-2-app-shell](./ejercicio-2-app-shell/) | [abrir](https://patata-ni.github.io/pwa-portafolio/ejercicio-2-app-shell/) | 8102 |
| 3. Ciclo de vida del SW | [ejercicio-3-service-worker](./ejercicio-3-service-worker/) | [abrir](https://patata-ni.github.io/pwa-portafolio/ejercicio-3-service-worker/) | 8103 |
| 4. Cache API y Cache-First | [ejercicio-4-cache-first](./ejercicio-4-cache-first/) | [abrir](https://patata-ni.github.io/pwa-portafolio/ejercicio-4-cache-first/) | 8104 |
| 5. Fallback offline | [ejercicio-5-offline](./ejercicio-5-offline/) | [abrir](https://patata-ni.github.io/pwa-portafolio/ejercicio-5-offline/) | 8105 |

Desde la carpeta elegida ejecuta `node .\servidor.cjs`, abre su dirección
localhost y sigue su README. Cada servidor escucha solamente en tu equipo.
Los puertos diferentes evitan que los Service Workers se solapen.

Los ejercicios 1 y 2 no implementan SW para mantener separado su objetivo.
Los ejercicios 3, 4 y 5 incluyen cada uno su propio SW con scope propio
(su subcarpeta), así que no se controlan entre sí aunque compartan origen.
El diseño y los iconos son originales, sin recursos externos.
Los servidores se repiten intencionalmente para que cada ejercicio funcione solo.

## Verificación automatizada del conjunto

Desde la raíz del repositorio:

```powershell
node --test .\herramientas\verificar.test.cjs
```

Las pruebas comprueban manifiestos, dimensiones y estructura de los PNG,
referencias locales y comportamiento de los workers con dobles de Cache API,
red y clientes. La prueba en un navegador real es complementaria.
La Splash Screen nativa necesita instalar y abrir en un dispositivo real:
no se simula ni se declara validada por estas pruebas. En iPhone se usan
las imágenes de arranque del ejercicio 2 (ver su README).

## Publicación

El repositorio es público. GitHub Pages sirve main / (root), por lo que cada
ejercicio queda en su subcarpeta de https://patata-ni.github.io/pwa-portafolio/.
La carpeta [herramientas](./herramientas/) contiene el generador de iconos y las
pruebas.
