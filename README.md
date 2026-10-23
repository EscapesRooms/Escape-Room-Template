# Template

Base genérica para crear nuevas aventuras. El motor común conserva el flujo
QR → prueba digital → pista para encontrar el sobre físico → siguiente etapa.
El contenido, la identidad visual y los datos de cada juego se configuran por
separado en `js/config.js`.

## Crear una aventura

1. Copia los archivos de esta carpeta a una carpeta nueva, sin copiar `.git`.
2. Cambia `experienceId` por un identificador único en minúsculas, con guiones,
   y asigna un `storageKey` propio en `js/config.js`.
3. Actualiza `branding`, `theme` y `publicPortal` con el título, los textos, los
   colores y la dirección pública del nuevo juego.
4. Define las etapas en `stages`. Cada una tiene un `id` único y puede tener un
   número `qr`, título, localización, reto, respuesta y pista.
5. Para una experiencia híbrida, añade `envelope` a las etapas. Incluye
   `label`, `artifact`, `nextLocationClue` y, opcionalmente, `ending`. La pista
   digital ayuda a encontrar el sobre; el texto de `nextLocationClue` se prepara
   en papel para conducir al grupo a la etapa siguiente.
6. Añade imágenes y audio propios en `assets/img/` y `assets/audio/`, y escribe
   sus rutas en la configuración. Deja las rutas vacías si no vas a usarlos.
7. Crea los QR apuntando a `?pista=<id-de-etapa>` y prueba la ruta completa en
   móvil antes de publicar.

Tipos de etapa disponibles: `clue` (respuesta escrita), `coordinates` (código
numérico), `quiz` (opciones) y `minigame`.

Tipos de minijuego disponibles: `secuencia`, `memoria`, `ruta`, `eleccion`,
`objetivo` y `patron`. Sus parámetros y textos se definen en el objeto `game`
de la etapa correspondiente. La configuración incluida muestra ejemplos
genéricos de respuesta escrita, quiz, coordenadas y secuencia.

Si cambias etapas de una aventura ya publicada, aumenta la versión de
`storageKey` para que los datos guardados en el navegador no se mezclen con la
nueva ruta.

## Firebase y códigos de acceso

La plantilla está conectada al proyecto compartido de Firebase
`quiz-teams-414d7`. Conserva la colección `codigos_acceso`, las sesiones en
`sesiones_juego` y los registros de acceso en
`experiencias/{experienceId}/accesos/{sessionId}`. Cada código se puede usar
una sola vez y se asocia a una única aventura.

La configuración inicial usa el ID de ejemplo `mi-aventura`, que no está
autorizado en las reglas actuales. **No publiques la plantilla ni intentes
canjear códigos con esa configuración.** Para activar un nuevo juego:

1. Añade el mismo ID del nuevo juego a `experienceId` y a su entrada en
   `publicPortal.experiences` dentro de `js/config.js`.
2. Añade el ID explícitamente a las listas permitidas de
   `firestore.rules` para `codigos_acceso`, `sesiones_juego` y `experiencias`.
   Las reglas actuales solo autorizan `harry-potter` y `stranger-things`.
3. Mantén las reglas compartidas sincronizadas en
   `Template/firestore.rules`, `Escape-Harry-Potter/firestore.rules`,
   `Quiz/firestore.rules` y en el proyecto nuevo.
4. Publica las reglas combinadas desde un directorio configurado para el mismo
   proyecto Firebase:

   ```powershell
   npx.cmd firebase-tools deploy --only firestore:rules
   ```

Las reglas de Firestore son compartidas por las aplicaciones del proyecto
Firebase: publicar un archivo de reglas reemplaza el conjunto remoto completo.
Comprueba que conserve tanto los accesos de los juegos como las reglas del
Quiz antes de desplegar.

La portada que actualmente permite elegir Harry Potter o Stranger Things está
en `Escape-Harry-Potter`. Configura ahí la URL pública de cada aventura en
`publicPortal.experiences[].url` y configura en cada juego el enlace de retorno
al portal. Las rutas relativas actuales sirven en la estructura local; si los
proyectos se publican por separado, sustitúyelas por sus URL HTTPS reales.

## Datos y límites del cliente

El progreso se guarda en `localStorage` del dispositivo y no se sincroniza
entre navegadores. Las respuestas y las comprobaciones están en JavaScript que
recibe el navegador, por lo que este mecanismo es adecuado para el flujo normal
de una partida, no como protección antifraude. Para premios, pagos o resultados
que deban ser inviolables, valida respuestas y progreso en un backend.

Los códigos de acceso deben ser aleatorios y difíciles de adivinar. Las reglas
no limitan intentos de introducción. La configuración web de Firebase se entrega
al navegador; el `apiKey` no es una contraseña.
