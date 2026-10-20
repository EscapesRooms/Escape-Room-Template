# Escape Room Template

Plantilla de Escape Room en una sola página. Separa el contenido de cada campaña
(`js/config.js`) del motor de navegación y validación (`js/engine.js`) y del motor
de minijuegos (`js/minigames.js`).

## Probar el juego

Abre `index.html` en un navegador moderno. Para usarlo con códigos QR, publícalo
en un sitio web HTTPS y crea un QR por prueba con `?pista=<id>`; por ejemplo:

```text
https://ejemplo.com/?pista=coordenadas
```

También se aceptan los identificadores numéricos definidos en la propiedad `qr`
de cada prueba. Los accesos a pruebas bloqueadas se llevan a la fase permitida.

## Preparar una campaña

1. Cambia `branding` y `theme` en `js/config.js`.
2. Define las pruebas en `stages`. Los tipos disponibles son `clue`,
   `coordinates`, `quiz` y `minigame`.
3. Para cambiar el orden o los parámetros de los seis minijuegos, edita las
   propiedades `game` de la prueba correspondiente. Los tipos admitidos son
   `runas`, `guardianes`, `anden`, `transporte`, `snitch` y `hechizo`.
4. Copia las imágenes y el audio de esa campaña a `assets/img/` y
   `assets/audio/`, y actualiza sus rutas en la configuración.
5. Asigna un `storageKey` distinto a cada campaña publicada en el mismo dominio.
   Si cambias la estructura de fases de una campaña ya publicada, incrementa la
   versión de esa clave para iniciar un progreso independiente.
6. Prueba el enlace de cada QR, las respuestas, la reanudación tras recargar y
   el diseño en móvil antes de compartirlo.

El ejemplo incluido contiene contenido de demostración de Hogwarts. Sustitúyelo
antes de entregar una campaña a un cliente.

Las imágenes de cada prueba se conservan como fondo difuminado para no revelar
la solución. En la vista se muestra una tarjeta decorativa de mapa encantado en
lugar de la fotografía.

## Persistencia y seguridad

El progreso se guarda en `localStorage` en el dispositivo del jugador. Se
recupera al recargar, pero no se sincroniza entre dispositivos ni navegadores.
El progreso parcial de coordenadas también se conserva; las respuestas de texto
y el estado interno temporal de un minijuego se reinician al volver a esa fase.

Esta es una plantilla estática: las soluciones están incluidas en los archivos
JavaScript que recibe el navegador y el jugador puede modificar `localStorage`
o saltarse las comprobaciones desde las herramientas del navegador. El bloqueo
de QR sirve para el flujo normal del juego, no como control antifraude. No la
uses para premios de valor, pagos o resultados que deban ser inviolables. Para
esos casos, valida respuestas y avance en un backend (por ejemplo, Firebase
Functions con reglas de acceso apropiadas) y guarda allí el estado confiable.
