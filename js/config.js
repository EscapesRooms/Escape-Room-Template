window.ESCAPE_CONFIG = {
  storageKey: "escape-room-hogwarts-hybrid-v2",
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
    fieldClueLabel: "PISTA PARA ENCONTRAR EL SOBRE FÍSICO",
    resetConfirm: "¿Quieres reiniciar todo el progreso de esta aventura?",
    reset: "Progreso reiniciado."
  },
  stages: [
    {
      id: "gran-comedor",
      qr: 1,
      kind: "quiz",
      title: "El Gran Comedor",
      location: "Salón de las cuatro casas",
      prompt: "¿Qué forma adopta el Patronus de Luna Lovegood?",
      options: [
        { id: "A", text: "Un cisne" },
        { id: "B", text: "Una cierva" },
        { id: "C", text: "Un gato" },
        { id: "D", text: "Una liebre" }
      ],
      answer: "D",
      attempts: 2,
      success: "¡Correcto! El pergamino de la siguiente pista espera donde la luz de las velas apenas alcanza el último banco de roble.",
      reveal: "¡Correcto! El pergamino de la siguiente pista espera donde la luz de las velas apenas alcanza el último banco de roble.",
      envelope: {
        label: "Sobre físico 1",
        artifact: "Una pluma encantada con una runa grabada.",
        nextLocationClue: "Busca el lugar donde los libros más antiguos guardan secretos detrás de una puerta que casi nunca se abre."
      },
      image: "assets/img/loc1.jpg"
    },
    {
      id: "biblioteca-restringida",
      qr: 2,
      kind: "minigame",
      title: "La Sección Restringida",
      location: "Biblioteca de Hogwarts",
      prompt: "Repite la secuencia de runas para abrir el antiguo libro de hechizos.",
      success: "¡Runas descifradas! El sobre susurra desde el estante que proyecta una sombra con forma de lechuza.",
      envelope: {
        label: "Sobre físico 2",
        artifact: "Una página arrancada con símbolos y una inicial misteriosa.",
        nextLocationClue: "La siguiente huella no está en tinta: sigue el sendero hasta el árbol que se agita incluso cuando el aire permanece quieto."
      },
      game: {
        type: "runas",
        symbols: ["☽", "✦", "⚡", "✹"],
        sequence: ["✦", "☽", "✹", "⚡"],
        symbolAriaLabel: "Runa {symbol}",
        promptText: "Pulsa las runas en el orden que reveló el libro.",
        successText: "¡Runas descifradas! El sobre susurra desde el estante que proyecta una sombra con forma de lechuza.",
        retryText: "La secuencia se ha reiniciado. Observa las runas otra vez."
      },
      image: "assets/img/loc2.jpg"
    },
    {
      id: "sauce-boxeador",
      qr: 3,
      kind: "minigame",
      title: "El Guardián del Sendero",
      location: "Jardines del castillo",
      prompt: "Memoriza dónde se ocultan los guardianes del jardín y despiértalos en orden.",
      success: "¡El patrón está completo! Busca el sobre donde dos raíces se cruzan bajo la piedra más lisa.",
      envelope: {
        label: "Sobre físico 3",
        artifact: "Un pequeño mapa del castillo con una ruta marcada en tinta plateada.",
        nextLocationClue: "Sigue las vías hasta el tren que espera junto al andén que solo aparece para quien sabe mirar."
      },
      game: {
        type: "guardianes",
        count: 9,
        memoryMs: 2200,
        hiddenLabel: "?",
        successText: "¡El patrón está completo! Busca el sobre donde dos raíces se cruzan bajo la piedra más lisa.",
        memorizeText: "Memoriza la posición de los guardianes...",
        playText: "Encuéntralos en orden, del {first} al {last}.",
        nextText: "Siguiente guardián: {next}",
        retryText: "El patrón se ha roto. Empieza de nuevo."
      },
      image: "assets/img/loc3.jpg"
    },
    {
      id: "anden-encantado",
      qr: 4,
      kind: "minigame",
      title: "El Andén Escondido",
      location: "Estación del Expreso",
      prompt: "Memoriza la secuencia de andenes y repítela para encontrar el vagón correcto.",
      success: "¡Ruta encontrada! La siguiente carta se esconde donde el último vagón deja una sombra bajo el banco de madera.",
      envelope: {
        label: "Sobre físico 4",
        artifact: "Un billete antiguo del Expreso de Hogwarts con un mensaje en el reverso.",
        nextLocationClue: "Un destello dorado cruza el campo: busca el lugar donde las gradas miran al cielo y el viento nunca descansa."
      },
      game: {
        type: "anden",
        nodes: ["9", "3", "4", "7"],
        choices: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        separator: " → ",
        hiddenLabel: "?",
        memoryMs: 2200,
        hideText: "?",
        successText: "¡Ruta encontrada! La siguiente carta se esconde donde el último vagón deja una sombra bajo el banco de madera.",
        memorizeText: "Memoriza la ruta del tren...",
        playText: "Repite la ruta tocando los andenes.",
        retryText: "Ruta incorrecta. Memorízala otra vez."
      },
      image: "assets/img/loc4.jpg"
    },
    {
      id: "campo-quidditch",
      qr: 5,
      kind: "minigame",
      title: "La Caza de la Snitch",
      location: "Campo de Quidditch",
      prompt: "La Snitch aparece y desaparece entre las gradas. Captúrala tres veces para revelar el escondite.",
      success: "¡Snitch capturada! Busca el sobre donde la sombra de los tres postes se encuentra con la primera fila de gradas.",
      envelope: {
        label: "Sobre físico 5",
        artifact: "Una insignia de Quidditch con una nota escrita a mano.",
        nextLocationClue: "El último secreto aguarda tras una puerta de piedra, donde las antorchas dibujan una espiral en el suelo."
      },
      game: {
        type: "snitch",
        targetLabel: "⚡",
        capturesRequired: 3,
        initialSpeedMs: 1300,
        speedStepMs: 250,
        minimumSpeedMs: 450,
        startText: "Comenzar la caza",
        ariaLabel: "Capturar la Snitch dorada",
        countText: "Capturas: {current} / {total}",
        successText: "¡Snitch capturada! Busca el sobre donde la sombra de los tres postes se encuentra con la primera fila de gradas."
      },
      image: "assets/img/loc5.jpg"
    },
    {
      id: "camara-final",
      qr: 6,
      kind: "minigame",
      title: "El Hechizo Final",
      location: "Cámara de los secretos",
      prompt: "Memoriza las secuencias mágicas y repítelas para revelar el último escondite.",
      success: "¡Hechizo completado! El pergamino final espera donde la luz de la antorcha se quiebra junto a la piedra marcada.",
      envelope: {
        label: "Sobre físico 6 · Final",
        artifact: "El pergamino final con el mensaje que cierra la aventura.",
        nextLocationClue: null,
        ending: "Has reunido las pistas y completado la aventura de Hogwarts."
      },
      game: {
        type: "hechizo",
        symbols: ["✦", "☽", "⚡", "✹", "☄", "♜"],
        roundLengths: [3, 4, 5],
        memoryMs: 2200,
        nextRoundMs: 700,
        separator: "  ",
        hiddenLabel: "?",
        roundText: "Ronda {current} de {total}",
        memorizeText: "Memoriza la secuencia...",
        playText: "Repite la secuencia.",
        roundPassedText: "Ronda superada.",
        retryText: "Secuencia incorrecta. Observa otra vez.",
        successText: "¡Hechizo completado! El pergamino final espera donde la luz de la antorcha se quiebra junto a la piedra marcada."
      },
      image: "assets/img/loc6.jpg"
    }
  ]
};
