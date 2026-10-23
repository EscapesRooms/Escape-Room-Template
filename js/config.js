window.ESCAPE_CONFIG = {
  experienceId: "mi-aventura",
  storageKey: "escape-room-mi-aventura-v1",
  theme: {
    colors: {
      page: "#111827",
      panel: "rgba(31, 41, 55, 0.94)",
      accent: "#60a5fa",
      highlight: "#93c5fd",
      text: "#e5e7eb",
      success: "#4ade80",
      error: "#f87171"
    }
  },
  branding: {
    title: "Nombre de la aventura",
    intro: "Escribe aquí una breve presentación de la historia y el objetivo del equipo.",
    footer: "StreetCode Escape",
    logo: "",
    music: ""
  },
  publicPortal: {
    title: "Escape rooms al aire libre",
    description: "Sigue las pistas, resuelve los retos y descubre cada etapa de la aventura.",
    experiencesTitle: "Tu aventura",
    experiences: [
      {
        id: "mi-aventura",
        title: "Mi aventura",
        theme: "default",
        url: ""
      }
    ],
    bookingTitle: "¿Quieres organizar una partida?",
    bookingDescription: "Añade aquí el contacto o el enlace de reservas.",
    bookingLabel: "Consultar disponibilidad",
    bookingUrl: ""
  },
  ui: {
    musicOn: "Activar sonido",
    musicOff: "Silenciar sonido",
    check: "Comprobar",
    checkCoordinates: "Comprobar coordenadas",
    showHint: "Ver pista",
    continue: "Continuar",
    restart: "Reiniciar progreso",
    answerPlaceholder: "Escribe tu respuesta...",
    answerAriaLabel: "Respuesta",
    coordinateAriaLabel: "Dígito",
    progress: "Prueba {current} de {total}",
    correct: "Respuesta correcta.",
    incorrect: "La respuesta no es correcta. Inténtalo de nuevo.",
    complete: "Has completado la aventura.",
    hintShown: "Pista",
    noStages: "No hay pruebas configuradas.",
    storageUnavailable: "No se pudo acceder a localStorage. El progreso solo se conservará mientras esta página permanezca abierta.",
    storageSaveError: "No se pudo guardar el progreso en este dispositivo.",
    invalidConfig: "La configuración del juego no es válida.",
    tryAgainWithRemaining: "Respuesta incorrecta. Te queda un intento.",
    attemptsExhausted: "Has agotado los intentos. La respuesta correcta era: {answer}",
    coordinatesIncomplete: "Completa todos los dígitos antes de comprobar.",
    coordinatesPartial: "Has acertado {count} dígito(s). Continúa con los restantes.",
    coordinatesAllWrong: "No has acertado ningún dígito. Inténtalo de nuevo.",
    coordinatesSolved: "Coordenadas descubiertas.",
    openMap: "Abrir mapa",
    fieldClueLabel: "PISTA PARA ENCONTRAR EL SOBRE FÍSICO",
    resetConfirm: "¿Quieres reiniciar todo el progreso de esta aventura?",
    reset: "Progreso reiniciado."
  },
  stages: [
    {
      id: "inicio",
      qr: 1,
      kind: "clue",
      title: "Punto de partida",
      location: "Indica aquí la localización",
      prompt: "Escribe la palabra de inicio para recibir la primera pista.",
      answer: "inicio",
      reveal: "¡Correcto! Busca el sobre preparado para esta etapa.",
      envelope: {
        label: "Sobre físico 1",
        artifact: "Describe aquí el objeto o material del sobre.",
        nextLocationClue: "Escribe aquí la pista en papel que conduce a la siguiente etapa."
      }
    },
    {
      id: "primer-reto",
      qr: 2,
      kind: "quiz",
      title: "Primer reto",
      location: "Indica aquí la segunda localización",
      prompt: "¿Qué elemento ayuda al equipo a resolver una misión?",
      options: [
        { id: "A", text: "Una sola idea" },
        { id: "B", text: "Compartir pistas" },
        { id: "C", text: "Ignorar las señales" },
        { id: "D", text: "Separarse sin comunicarse" }
      ],
      answer: "B",
      attempts: 3,
      success: "¡Respuesta correcta! Buscad el sobre de esta etapa.",
      reveal: "¡Respuesta correcta! Buscad el sobre de esta etapa.",
      envelope: {
        label: "Sobre físico 2",
        artifact: "Añade aquí el material de la segunda etapa.",
        nextLocationClue: "Añade aquí una pista para encontrar el siguiente punto."
      }
    },
    {
      id: "coordenadas",
      qr: 3,
      kind: "coordinates",
      title: "Coordenadas",
      location: "Indica aquí la tercera localización",
      prompt: "Completa el código numérico para desbloquear la pista.",
      fragments: [
        { text: "PUNTO " },
        { answer: 2 },
        { text: " · " },
        { answer: 4 },
        { text: " · " },
        { answer: 6 }
      ],
      success: "Código correcto. El último sobre de ejemplo está preparado.",
      envelope: {
        label: "Sobre físico 3 · Final",
        artifact: "Añade aquí el objeto final o el mensaje de cierre.",
        nextLocationClue: null,
        ending: "¡Enhorabuena! Habéis completado la aventura de ejemplo."
      }
    },
    {
      id: "secuencia",
      qr: 4,
      kind: "minigame",
      title: "Reto de secuencia",
      location: "Opcional: indica aquí una localización",
      prompt: "Pulsa los símbolos en el orden correcto para superar el minijuego.",
      success: "¡Secuencia completada!",
      game: {
        type: "secuencia",
        symbols: ["●", "▲", "■", "◆"],
        sequence: ["▲", "●", "◆"],
        symbolAriaLabel: "Símbolo {symbol}",
        promptText: "Pulsa los símbolos de la secuencia en el orden indicado.",
        successText: "¡Secuencia completada!",
        retryText: "El orden no era correcto. Inténtalo otra vez."
      }
    }
  ]
};
