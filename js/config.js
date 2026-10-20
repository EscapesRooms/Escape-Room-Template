window.ESCAPE_CONFIG = {
  storageKey: "escape-room-hogwarts-demo-v1",
  theme: {
    colors: {
      page: "#080706",
      panel: "rgba(15, 15, 15, 0.88)",
      accent: "#d4af37",
      highlight: "#ffd700",
      text: "#f3d180",
      success: "#6dff7b",
      error: "#ff6d6d"
    }
  },
  branding: {
    title: "Búsqueda de los Horrocruxes",
    intro: "El Ministerio de Magia necesita tu ayuda. Resuelve los enigmas y encuentra el siguiente rastro.",
    footer: "Hogwarts School of Witchcraft and Wizardry",
    logo: "assets/img/logo.png",
    music: "assets/audio/background.mp3"
  },
  ui: {
    musicOn: "🎵 Activar música",
    musicOff: "🔇 Silenciar música",
    check: "Comprobar",
    checkCoordinates: "Descubrir coordenadas",
    showHint: "Pedir ayuda",
    continue: "Continuar",
    restart: "Reiniciar progreso",
    answerPlaceholder: "Escribe tu respuesta...",
    answerAriaLabel: "Respuesta",
    coordinateAriaLabel: "Dígito oculto",
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
    resetConfirm: "¿Quieres reiniciar todo el progreso de esta aventura?",
    reset: "Progreso reiniciado."
  },
  stages: [
    {
      id: "inicio",
      qr: 0,
      kind: "clue",
      title: "El comienzo de la aventura",
      location: "Primera localización",
      prompt: "La primera localización lleva el nombre del niño que sobrevivió.",
      hint: "Es una plaza.",
      acceptedAnswers: ["Harry Walker"],
      reveal: "La aventura comienza ahora.",
      image: "assets/img/loc1.jpg"
    },
    {
      id: "mensaje-encriptado",
      qr: 1,
      kind: "clue",
      title: "Mensaje encriptado",
      location: "Zona de enigmas",
      prompt: "26 - 15 - 14 - 1 / 22 - 5 - 18 - 4 - 5. Descifra el mensaje oculto.",
      hint: "Piensa en el abecedario.",
      acceptedAnswers: ["Zona Verde"],
      reveal: "El siguiente rastro está cerca.",
      image: "assets/img/loc2.jpg"
    },
    {
      id: "coordenadas",
      qr: 2,
      kind: "coordinates",
      title: "El susurro del agua",
      location: "Localización secreta",
      prompt: "Completa los dígitos ocultos para revelar las coordenadas.",
      hint: "El agua corre por ellas.",
      fragments: [
        { text: "41°2" },
        { answer: "6" },
        { text: "'32.5\"N 2°1" },
        { answer: "0" },
        { text: "'38." },
        { answer: "9" },
        { text: "\"E" }
      ],
      map: {
        url: "https://www.google.com/maps/search/?api=1&query=41.442361,2.177472",
        label: "41°26'32.5\"N 2°10'38.9\"E"
      },
      image: "assets/img/loc3.jpg"
    },
    {
      id: "pregunta",
      qr: 3,
      kind: "quiz",
      title: "Conocimiento mágico",
      location: "Biblioteca",
      prompt: "¿Qué forma adopta el Patronus de Luna Lovegood?",
      options: [
        { id: "A", text: "Cisne" },
        { id: "B", text: "Cierva" },
        { id: "C", text: "Gato" },
        { id: "D", text: "Liebre" }
      ],
      answer: "D",
      attempts: 2,
      reveal: "La respuesta correcta te abre el camino.",
      image: "assets/img/loc4.jpg"
    },
    {
      id: "runas",
      qr: 4,
      kind: "minigame",
      title: "Secuencia de runas",
      location: "Cámara de runas",
      prompt: "Pulsa los símbolos en el orden correcto.",
      success: "Las runas obedecen tu magia.",
      game: {
        type: "runas",
        symbols: ["☽", "✦", "⚡", "✹"],
        symbolAriaLabel: "Runa {symbol}",
        promptText: "Pulsa los símbolos en el orden correcto.",
        successText: "Has descifrado la secuencia mágica.",
        retryText: "La secuencia se ha reiniciado."
      },
      image: "assets/img/loc1.jpg"
    },
    {
      id: "guardianes",
      qr: 5,
      kind: "minigame",
      title: "Los guardianes",
      location: "Bosque encantado",
      prompt: "Memoriza las posiciones y despierta a los guardianes en orden.",
      success: "Todos los guardianes están despiertos.",
      game: {
        type: "guardianes",
        count: 9,
        memoryMs: 2200,
        hiddenLabel: "?",
        successText: "Has despertado a todos los guardianes.",
        memorizeText: "Memoriza la posición...",
        playText: "Encuéntralos en orden, del {first} al {last}.",
        nextText: "Siguiente guardián: {next}",
        retryText: "Orden incorrecto. Empieza de nuevo."
      },
      image: "assets/img/loc2.jpg"
    },
    {
      id: "anden",
      qr: 6,
      kind: "minigame",
      title: "El andén secreto",
      location: "Estación encantada",
      prompt: "Memoriza la ruta y repítela tocando los accesos.",
      success: "Has encontrado la ruta secreta.",
      game: {
        type: "anden",
        nodes: ["9", "3", "4", "7"],
        choices: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        separator: " → ",
        hiddenLabel: "?",
        memoryMs: 2200,
        hideText: "?",
        successText: "Has atravesado el andén mágico.",
        memorizeText: "Memoriza la ruta...",
        playText: "Repite la ruta tocando los accesos.",
        retryText: "Ruta incorrecta. Memorízala otra vez."
      },
      image: "assets/img/loc3.jpg"
    },
    {
      id: "transporte",
      qr: 7,
      kind: "minigame",
      title: "El tren encantado",
      location: "Ruta de transporte",
      prompt: "Elige las estaciones correctas para completar el trayecto.",
      success: "Has llegado a tu destino.",
      game: {
        type: "transporte",
        lineLabel: "L4",
        goalLabel: "Destino",
        trainLabel: "🚇",
        startLabel: "🚉",
        goalIcon: "🏁",
        stages: [
          { from: "Estación A", correct: "Estación B", alternatives: ["Estación C", "Estación D"] },
          { from: "Estación B", correct: "Estación E", alternatives: ["Estación F", "Estación G"] },
          { from: "Estación E", correct: "Destino", alternatives: ["Estación H", "Estación I"] }
        ],
        retryDelayMs: 900,
        nextDelayMs: 700,
        successText: "El tren ha llegado al destino.",
        turnText: "Tramo {current} de {total}: elige la siguiente estación.",
        wrongText: "Vía incorrecta. Volviendo al inicio de la ruta.",
        nextText: "Tramo completado. Preparando el siguiente."
      },
      image: "assets/img/loc4.jpg"
    },
    {
      id: "snitch",
      qr: 8,
      kind: "minigame",
      title: "La caza dorada",
      location: "Campo de vuelo",
      prompt: "Captura el objetivo tantas veces como indique el marcador.",
      success: "Has completado la caza.",
      game: {
        type: "snitch",
        targetLabel: "⚡",
        capturesRequired: 3,
        initialSpeedMs: 1300,
        speedStepMs: 250,
        minimumSpeedMs: 450,
        startText: "Comenzar la caza",
        ariaLabel: "Capturar objetivo",
        countText: "Capturas: {current} / {total}",
        successText: "Has capturado el objetivo."
      },
      image: "assets/img/loc5.jpg"
    },
    {
      id: "hechizo",
      qr: 9,
      kind: "minigame",
      title: "El hechizo de memoria",
      location: "Aula de encantamientos",
      prompt: "Memoriza cada secuencia y repítela en el orden correcto.",
      success: "Has dominado el hechizo.",
      game: {
        type: "hechizo",
        symbols: ["✦", "☽", "⚡", "✹", "☄", "♜"],
        roundLengths: [3, 3, 3],
        memoryMs: 2200,
        nextRoundMs: 700,
        separator: "  ",
        hiddenLabel: "?",
        roundText: "Ronda {current} de {total}",
        memorizeText: "Memoriza la secuencia...",
        playText: "Repite la secuencia.",
        roundPassedText: "Ronda superada.",
        retryText: "Secuencia incorrecta. Observa otra vez.",
        successText: "Has dominado el hechizo final."
      },
      image: "assets/img/loc6.jpg"
    }
  ]
};
