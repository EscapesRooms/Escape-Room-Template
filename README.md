# Template

Plantilla de Escape Room en una sola página. Separa el contenido de cada campaña
(`js/config.js`) del motor de navegación y validación (`js/engine.js`) y del motor
de minijuegos (`js/minigames.js`).

## Portal público y acceso al juego

Al abrir la dirección principal se muestra un portal público con información
de las experiencias y un apartado para introducir el código. Si se escanea un
QR de una prueba sin tener una sesión activa, el portal explica que forma parte
de un recorrido y solicita el código antes de mostrar el juego.

Configura el contenido del portal en `publicPortal`, dentro de `js/config.js`:
puedes añadir o quitar experiencias y definir un enlace de reservas, WhatsApp o
correo en `bookingUrl`. Deja `bookingUrl` vacío si todavía no tienes un enlace.
El portal tiene su propia hoja de estilos (`css/portal.css`), independiente del
diseño de las experiencias en `css/style.css`; se activa solo mientras se muestra
la portada y el acceso.

Publica el juego en HTTPS. Después de introducir el código una vez, la sesión
se conserva en ese navegador y los QR siguientes llevan directamente a la
etapa indicada, sin volver a pedirlo. Cada QR puede enlazar a una etapa, por
ejemplo:

```text
https://ejemplo.com/?pista=biblioteca-restringida
```

También se aceptan los identificadores numéricos definidos en la propiedad `qr`
de cada prueba. Los accesos a pruebas bloqueadas se llevan a la fase permitida.
Al caducar la sesión se puede introducir un nuevo código.
La campaña de ejemplo incluye seis etapas físicas y digitales: QR de la
localización → reto → acertijo en pantalla para hallar un sobre físico →
artefacto y pista en papel dentro del sobre para llegar a la siguiente etapa.
Sus identificadores de ejemplo son `gran-comedor`, `biblioteca-restringida`,
`sauce-boxeador`, `anden-encantado`, `campo-quidditch` y `camara-final`.

## Preparar una campaña

1. Cambia `branding` y `theme` en `js/config.js`.
2. Define las pruebas en `stages`. Los tipos disponibles son `clue`,
   `coordinates`, `quiz` y `minigame`.
3. Para cambiar el orden o los parámetros de los seis minijuegos, edita las
   propiedades `game` de la prueba correspondiente. Los tipos admitidos son
   `runas`, `guardianes`, `anden`, `transporte`, `snitch` y `hechizo`.
4. Para el flujo híbrido, agrega a cada etapa un objeto `envelope` con `label`,
   `artifact`, `nextLocationClue` y, opcionalmente, `ending`. `success` o
   `game.successText` es el acertijo digital para encontrar el sobre en la
   localización actual. El motor muestra ese mensaje una sola vez en una tarjeta
   destacada; `envelope` es información de preparación para la persona
   organizadora y no se revela automáticamente al jugador.
5. Copia las imágenes y el audio de esa campaña a `assets/img/` y
   `assets/audio/`, y actualiza sus rutas en la configuración.
6. Asigna un `storageKey` distinto a cada campaña publicada en el mismo dominio.
   Si cambias la estructura de fases de una campaña ya publicada, incrementa la
   versión de esa clave para iniciar un progreso independiente.
7. Prueba el enlace de cada QR, las respuestas, la reanudación tras recargar y
   el diseño en móvil antes de compartirlo.
8. Crea en Firestore un documento por código de acceso en `codigos_acceso`,
   con ID aleatorio difícil de adivinar, `usado: false` y `duracionHoras` como
   entero. Cada código se canjea una sola vez y queda asociado a la aventura
   elegida. El canje crea también un registro en
   `experiencias/{experienceId}/accesos/{sessionId}`. Publica las reglas de
   `firestore.rules` en el proyecto configurado antes de probarlo.
9. Edita `publicPortal` en `js/config.js` para mostrar las experiencias
   disponibles y el contacto o enlace para contratarlas.
10. Configura las URL públicas de cada experiencia en
    `publicPortal.experiences[].url` y el `publicPortalUrl` de
    `Escape-Stranger-Things/js/config.js`. Las rutas relativas de ejemplo sirven
    si ambas carpetas se publican bajo el mismo dominio; en producción, usa
    las URL HTTPS reales de cada juego y del portal.

El ejemplo incluido usa temática de Hogwarts y escondites de muestra. Sustituye
los textos, las respuestas, los artefactos y los acertijos por datos adecuados
al recorrido real antes de entregar una campaña a un cliente. Comprueba que cada
escondite exista y sea seguro y permitido.

En un quiz, alcanzar el límite de respuestas incorrectas muestra la solución,
pero no desbloquea la etapa: el jugador aún debe seleccionar la respuesta
correcta para recibir la pista del sobre.

Las imágenes de cada prueba se conservan únicamente como fondo difuminado para
no revelar la solución. La interfaz está optimizada para móvil; las opciones de
quiz aparecen en una columna con objetivos táctiles amplios.

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

## Acceso con Firebase

`js/firebase-auth.js` consulta y consume mediante una transacción el documento
cuyo ID es el código introducido en `codigos_acceso`. El documento debe
contener:

```text
usado: false
duracionHoras: número positivo (máximo 720)
```

Al canjearlo, la transacción registra la aventura en el código, crea un
documento de sesión en `sesiones_juego` y crea una entrada de auditoría en
`experiencias/{experienceId}/accesos/{sessionId}`. La sesión incluye
`activa: true`, `expiresAt` como Timestamp de Firestore, `codigoId` y
`experiencia`. Así se puede distinguir, por ejemplo,
`experiencias/harry-potter/accesos` de
`experiencias/stranger-things/accesos`. La sesión se guarda en el navegador y
se comprueba de nuevo en Firestore al recargar y al abrir otro juego.

`firestore.rules` permite leer códigos individuales (no listar la colección),
consumir un código que todavía no se haya usado y crear la sesión y su registro
de experiencia en la misma transacción. Solo permite leer individualmente las
sesiones y deniega actualizaciones y borrados desde el cliente. Este repositorio y `Quiz` usan el
mismo proyecto Firebase, que solo admite un conjunto de reglas de Firestore:
publicar las reglas desde una aplicación reemplaza las reglas de la otra. Por
eso ambos archivos `firestore.rules` contienen las reglas combinadas para el
Escape Room y los rankings del Quiz. Mantén ambos archivos sincronizados y
publica las reglas combinadas desde esta carpeta con:

```powershell
npx.cmd firebase-tools deploy --only firestore:rules
```

Los códigos deben ser aleatorios y difíciles de adivinar: las reglas no limitan
intentos ni ofrecen protección contra ataques automatizados de adivinación. La
configuración web de Firebase se entrega al navegador; el `apiKey` no es un
secreto.

El canje usa una transacción para que dos navegadores no puedan consumir
simultáneamente el mismo código. Aun así, las reglas del cliente y el reloj del
navegador no ofrecen garantías antifraude completas: las reglas deben exigir
los cambios permitidos, y un backend es lo recomendable si el tiempo de acceso
se usa para proteger una venta o debe ser inviolable. La sesión queda asociada
al perfil del navegador; borrar los datos del sitio implica solicitar otro
código. Los códigos deben generarse y entregarse de forma segura y no reutilizar
un código para varios accesos.
