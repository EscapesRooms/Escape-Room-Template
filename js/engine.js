(function () {
  "use strict";

  const config = window.ESCAPE_CONFIG;
  const elements = {
    background: document.getElementById("background"),
    gameContent: document.getElementById("game-content"),
    expiredView: document.getElementById("expired-view"),
    expiredTitle: document.getElementById("expired-title"),
    expiredMessage: document.getElementById("expired-message"),
    sessionBlocked: document.getElementById("session-blocked"),
    sessionBlockedTitle: document.getElementById("session-blocked-title"),
    sessionBlockedMessage: document.getElementById("session-blocked-message"),
    music: document.getElementById("music"),
    musicButton: document.getElementById("music-button"),
    logo: document.getElementById("game-logo"),
    title: document.getElementById("game-title"),
    intro: document.getElementById("game-intro"),
    progress: document.getElementById("progress"),
    stageTitle: document.getElementById("stage-title"),
    prompt: document.getElementById("stage-prompt"),
    content: document.getElementById("challenge-content"),
    checkButton: document.getElementById("check-button"),
    hintButton: document.getElementById("hint-button"),
    hint: document.getElementById("hint"),
    result: document.getElementById("result"),
    continueButton: document.getElementById("continue-button"),
    notice: document.getElementById("notice"),
    footer: document.getElementById("game-footer")
  };
  let state;
  let currentStage;
  let storageReady = true;
  let accessDeadline = null;
  let accessTimer = null;
  let accessBlocked = false;

  function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  function setNotice(message) {
    elements.notice.textContent = message || "";
  }

  function persist() {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(config.storageKey, JSON.stringify(state));
    } catch (error) {
      storageReady = false;
      setNotice(config.ui.storageSaveError);
      console.error("No se pudo guardar el estado del juego.", error);
    }
  }

  function loadState() {
    const initial = {
      currentId: config.stages[0].id,
      unlockedIndex: 0,
      completed: {},
      coordinateInputs: {}
    };
    try {
      const saved = window.localStorage.getItem(config.storageKey);
      if (!saved) return initial;

      const parsed = JSON.parse(saved);
      const savedIndex = config.stages.findIndex(function (stage) {
        return stage.id === parsed.currentId;
      });
      const unlockedIndex = Number.isInteger(parsed.unlockedIndex)
        ? Math.min(Math.max(parsed.unlockedIndex, 0), config.stages.length)
        : 0;

      return {
        currentId: savedIndex >= 0 && savedIndex <= unlockedIndex
          ? parsed.currentId
          : config.stages[Math.min(unlockedIndex, config.stages.length - 1)].id,
        unlockedIndex: unlockedIndex,
        completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
        coordinateInputs: parsed.coordinateInputs && typeof parsed.coordinateInputs === "object"
          ? parsed.coordinateInputs
          : {}
      };
    } catch (error) {
      storageReady = false;
      console.error("No se pudo leer el progreso guardado.", error);
      setNotice(config.ui.storageUnavailable);
      return initial;
    }
  }

  function validateConfig() {
    if (!config || !Array.isArray(config.stages) || config.stages.length === 0 || !config.ui || !config.branding) {
      throw new Error(config && config.ui ? config.ui.invalidConfig : "Invalid game configuration.");
    }
    const ids = new Set();
    config.stages.forEach(function (stage) {
      if (!stage.id || ids.has(stage.id)) throw new Error("Cada prueba debe tener un identificador único.");
      ids.add(stage.id);
      if (!["clue", "coordinates", "quiz", "minigame"].includes(stage.kind)) {
        throw new Error("Tipo de prueba no reconocido: " + stage.kind);
      }
    });
    if (config.access && config.access.enabled) {
      if (config.access.expiresAt && !Number.isFinite(Date.parse(config.access.expiresAt))) {
        throw new Error("La fecha fija de expiración no tiene un formato válido.");
      }
      if (config.access.maxDurationHours !== undefined &&
        (!Number.isFinite(config.access.maxDurationHours) || config.access.maxDurationHours <= 0)) {
        throw new Error("La duración máxima de acceso debe ser un número positivo de horas.");
      }
      if (!config.access.expiresAt && config.access.maxDurationHours === undefined) {
        throw new Error("El acceso necesita una fecha límite o una duración máxima.");
      }
    }
  }

  function checkAccess() {
    const access = config.access;
    if (!access || !access.enabled) return { allowed: true };

    const now = Date.now();
    const deadlines = [];
    if (access.expiresAt) deadlines.push(Date.parse(access.expiresAt));

    if (access.maxDurationHours !== undefined) {
      const startKey = config.storageKey + ":access-start";
      let startTime;
      try {
        const storedStart = window.localStorage.getItem(startKey);
        if (storedStart === null) {
          startTime = now;
          window.localStorage.setItem(startKey, String(startTime));
        } else {
          startTime = Number(storedStart);
        }
      } catch (error) {
        console.error("No se pudo leer o registrar el inicio del periodo de acceso.", error);
        return { allowed: false, unavailable: true };
      }
      if (!Number.isFinite(startTime) || startTime <= 0 || startTime > now) {
        console.error("El inicio del periodo de acceso guardado no es válido.");
        return { allowed: false, unavailable: true };
      }
      deadlines.push(startTime + access.maxDurationHours * 60 * 60 * 1000);
    }

    accessDeadline = Math.min.apply(Math, deadlines);
    return {
      allowed: now < accessDeadline,
      deadline: accessDeadline
    };
  }

  function showExpiredAccess(unavailable) {
    if (accessBlocked) return;
    accessBlocked = true;
    if (accessTimer !== null) window.clearTimeout(accessTimer);
    elements.music.pause();
    elements.gameContent.hidden = true;
    elements.expiredTitle.textContent = unavailable
      ? config.access.unavailableTitle || config.access.expiredTitle
      : config.access.expiredTitle;
    elements.expiredMessage.textContent = unavailable
      ? config.access.unavailableMessage || config.access.expiredMessage
      : config.access.expiredMessage;
    elements.expiredView.hidden = false;
    document.title = elements.expiredTitle.textContent;
    document.body.classList.add("access-closed");
  }

  function ensureAccess() {
    if (accessBlocked) return false;
    if (!config.access || !config.access.enabled) return true;
    if (accessDeadline === null || Date.now() >= accessDeadline) {
      showExpiredAccess(false);
      return false;
    }
    return true;
  }

  function scheduleAccessCheck() {
    if (accessDeadline === null || accessBlocked) return;
    const remaining = accessDeadline - Date.now();
    if (remaining <= 0) {
      showExpiredAccess(false);
      return;
    }
    accessTimer = window.setTimeout(
      scheduleAccessCheck,
      Math.min(remaining, 2147483647)
    );
  }

  function applyBranding() {
    document.title = config.branding.title;
    elements.title.textContent = config.branding.title;
    elements.intro.textContent = config.branding.intro || "";
    elements.footer.textContent = config.branding.footer || "";
    elements.logo.src = config.branding.logo || "";
    elements.logo.hidden = !config.branding.logo;
    elements.logo.alt = config.branding.title;
    elements.music.src = config.branding.music || "";
    elements.musicButton.hidden = !config.branding.music;
    Object.entries(config.theme && config.theme.colors ? config.theme.colors : {}).forEach(function (entry) {
      document.documentElement.style.setProperty("--" + entry[0], entry[1]);
    });
    elements.musicButton.textContent = config.ui.musicOn;
    elements.musicButton.addEventListener("click", toggleMusic);
  }

  function toggleMusic() {
    if (elements.music.paused) {
      elements.music.play().then(function () {
        elements.musicButton.textContent = config.ui.musicOff;
      }).catch(function (error) {
        console.error("No se pudo reproducir la música.", error);
      });
      return;
    }
    elements.music.pause();
    elements.musicButton.textContent = config.ui.musicOn;
  }

  function updateUrl(stage) {
    const url = new URL(window.location.href);
    url.searchParams.set("pista", stage.id);
    window.history.replaceState({}, "", url);
  }

  function stageFromUrl() {
    const requested = new URLSearchParams(window.location.search).get("pista");
    if (requested === null) return null;
    let index = config.stages.findIndex(function (stage) { return stage.id === requested; });
    if (index < 0) {
      index = config.stages.findIndex(function (stage) { return String(stage.qr) === requested; });
    }
    return index;
  }

  function showResult(message, type) {
    elements.result.textContent = message || "";
    elements.result.className = "result" + (type ? " " + type : "");
  }

  function showFieldClue(message) {
    elements.result.replaceChildren();
    elements.result.className = "result field-clue";

    const label = document.createElement("span");
    label.className = "field-clue-label";
    label.textContent = config.ui.fieldClueLabel || "PISTA PARA ENCONTRAR EL SOBRE";

    const clue = document.createElement("p");
    clue.className = "field-clue-message";
    clue.textContent = message;

    elements.result.append(label, clue);
  }

  function renderProgress() {
    if (state.unlockedIndex >= config.stages.length) {
      elements.progress.textContent = config.ui.complete;
      return;
    }
    const index = config.stages.findIndex(function (stage) { return stage.id === state.currentId; });
    elements.progress.textContent = interpolate(config.ui.progress, {
      current: index + 1,
      total: config.stages.length
    });
  }

  function clearStage() {
    elements.content.replaceChildren();
    elements.checkButton.disabled = false;
    elements.checkButton.onclick = null;
    elements.hint.textContent = "";
    elements.hint.hidden = true;
    elements.hintButton.hidden = true;
    elements.checkButton.hidden = true;
    elements.continueButton.hidden = true;
    elements.result.textContent = "";
    elements.result.className = "result";
    elements.prompt.textContent = "";
  }

  function createInput(placeholder, ariaLabel) {
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", ariaLabel);
    input.className = "answer-input";
    return input;
  }

  function normalizeAnswer(value) {
    return value.toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  function createContinueButton() {
    elements.continueButton.textContent = config.ui.continue;
    elements.continueButton.hidden = false;
    elements.continueButton.onclick = advance;
  }

  function completeStage(message, resultType) {
    if (!ensureAccess()) return;
    if (state.completed[currentStage.id]) return;
    state.completed[currentStage.id] = true;
    state.unlockedIndex = Math.max(state.unlockedIndex, config.stages.indexOf(currentStage) + 1);
    persist();
    const resultMessage = message || currentStage.success || config.ui.correct;
    if (resultType === "error") {
      showResult(resultMessage, resultType);
    } else {
      if (currentStage.kind === "minigame") {
        const gameStatus = elements.content.querySelector(".game-status");
        if (gameStatus) gameStatus.hidden = true;
      }
      if (currentStage.envelope) {
        showFieldClue(resultMessage);
      } else {
        showResult(resultMessage, "success");
      }
    }
    elements.checkButton.disabled = true;
    createContinueButton();
    renderProgress();
  }

  function renderClue(stage) {
    const input = createInput(config.ui.answerPlaceholder, config.ui.answerAriaLabel);
    elements.content.appendChild(input);
    elements.checkButton.textContent = config.ui.check;
    elements.checkButton.hidden = false;
    elements.checkButton.onclick = function () {
      const accepted = stage.acceptedAnswers || [stage.answer];
      if (accepted.some(function (answer) {
        return normalizeAnswer(input.value) === normalizeAnswer(answer);
      })) {
        completeStage(stage.reveal || config.ui.correct);
      } else {
        showResult(config.ui.incorrect, "error");
      }
    };
  }

  function renderCoordinates(stage) {
    const wrapper = document.createElement("div");
    wrapper.className = "coordinates";
    const stored = state.coordinateInputs[stage.id] || [];
    let inputNumber = 0;
    (stage.fragments || []).forEach(function (fragment) {
      if (!Object.prototype.hasOwnProperty.call(fragment, "answer")) {
        wrapper.appendChild(document.createTextNode(fragment.text));
        return;
      }
      const index = inputNumber++;
      const input = createInput("", config.ui.coordinateAriaLabel + " " + (index + 1));
      input.inputMode = "numeric";
      input.maxLength = 1;
      input.classList.add("coordinate-input");
      input.dataset.answer = String(fragment.answer);
      input.value = stored[index] ? stored[index].value || "" : "";
      if (stored[index] && stored[index].correct) {
        input.disabled = true;
        input.classList.add("coordinate-correct");
      }
      input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        saveCoordinates(stage, wrapper);
      });
      wrapper.appendChild(input);
    });
    elements.content.appendChild(wrapper);
    elements.checkButton.textContent = config.ui.checkCoordinates;
    elements.checkButton.hidden = false;
    elements.checkButton.onclick = function () {
      const inputs = Array.from(wrapper.querySelectorAll(".coordinate-input"));
      const pending = inputs.filter(function (input) { return !input.disabled; });
      if (pending.some(function (input) { return input.value === ""; })) {
        showResult(config.ui.coordinatesIncomplete, "error");
        return;
      }
      let correctCount = 0;
      pending.forEach(function (input) {
        if (input.value === input.dataset.answer) {
          input.disabled = true;
          input.classList.add("coordinate-correct");
          correctCount++;
        } else {
          input.classList.add("coordinate-incorrect");
        }
      });
      saveCoordinates(stage, wrapper);
      if (inputs.every(function (input) { return input.disabled; })) {
        completeStage(stage.success || stage.reveal || config.ui.coordinatesSolved);
        if (stage.map && stage.map.url) addMapLink(stage.map);
        return;
      }
      showResult(correctCount === 0
        ? config.ui.coordinatesAllWrong
        : interpolate(config.ui.coordinatesPartial, { count: correctCount }), correctCount ? "success" : "error");
      if (correctCount === 0) {
        inputs.forEach(function (input) {
          input.value = "";
          input.disabled = false;
          input.classList.remove("coordinate-correct", "coordinate-incorrect");
        });
        saveCoordinates(stage, wrapper);
      }
    };
  }

  function saveCoordinates(stage, wrapper) {
    state.coordinateInputs[stage.id] = Array.from(wrapper.querySelectorAll(".coordinate-input"))
      .map(function (input) {
        return { value: input.value, correct: input.disabled };
      });
    persist();
  }

  function addMapLink(map) {
    const link = document.createElement("a");
    link.className = "map-link";
    link.href = map.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = config.ui.openMap;
    elements.result.appendChild(document.createElement("br"));
    elements.result.appendChild(link);
    if (map.label) {
      const label = document.createElement("small");
      label.textContent = map.label;
      elements.result.appendChild(document.createElement("br"));
      elements.result.appendChild(label);
    }
  }

  function renderQuiz(stage) {
    const choices = document.createElement("div");
    choices.className = "choices";
    let attempts = 0;
    (stage.options || []).forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.id = option.id;
      const label = document.createElement("span");
      label.className = "choice-label";
      label.textContent = option.id;
      const text = document.createElement("span");
      text.className = "choice-text";
      text.textContent = option.text;
      button.append(label, text);
      button.addEventListener("click", function () {
        if (option.id === stage.answer) {
          button.classList.add("choice-correct");
          choices.querySelectorAll("button").forEach(function (choice) { choice.disabled = true; });
          completeStage(stage.reveal || config.ui.correct);
          return;
        }
        attempts++;
        button.classList.add("choice-incorrect");
        if (attempts >= (stage.attempts || 2)) {
          choices.querySelectorAll("button").forEach(function (choice) {
            choice.disabled = choice.id !== stage.answer;
          });
          const answer = (stage.options || []).find(function (item) { return item.id === stage.answer; });
          showResult(interpolate(config.ui.attemptsExhausted, {
            answer: answer ? answer.id + ") " + answer.text : stage.answer
          }), "error");
          return;
        }
        button.disabled = true;
        showResult(config.ui.tryAgainWithRemaining, "error");
      });
      choices.appendChild(button);
    });
    elements.content.appendChild(choices);
  }

  function renderStage(stage) {
    if (!ensureAccess()) return;
    currentStage = stage;
    clearStage();
    elements.stageTitle.textContent = stage.title || "";
    elements.prompt.textContent = stage.prompt || "";
    elements.stageTitle.dataset.location = stage.location || "";
    if (stage.image) {
      elements.background.style.backgroundImage = "url(" + JSON.stringify(stage.image) + ")";
    } else {
      elements.background.style.backgroundImage = "";
    }
    elements.hint.textContent = stage.hint || "";
    elements.hintButton.textContent = config.ui.showHint;
    elements.hintButton.hidden = !stage.hint;
    elements.hintButton.onclick = function () { elements.hint.hidden = false; };
    renderProgress();

    if (state.completed[stage.id]) {
      const completedMessage = stage.kind === "coordinates"
        ? stage.success || stage.reveal || config.ui.coordinatesSolved
        : stage.success || stage.reveal || config.ui.correct;
      if (stage.envelope) {
        showFieldClue(completedMessage);
      } else {
        showResult(completedMessage, "success");
      }
      if (stage.kind === "coordinates" && stage.map && stage.map.url) addMapLink(stage.map);
      createContinueButton();
      return;
    }

    if (stage.kind === "clue") renderClue(stage);
    if (stage.kind === "coordinates") renderCoordinates(stage);
    if (stage.kind === "quiz") renderQuiz(stage);
    if (stage.kind === "minigame") {
      if (!window.EscapeMinigames || !stage.game) throw new Error("Falta el motor o la configuración del minijuego: " + stage.id);
      window.EscapeMinigames.mount(elements.content, stage.game, function () {
        completeStage(stage.game.successText || stage.success || config.ui.correct);
      });
    }
  }

  function advance() {
    if (!ensureAccess()) return;
    const nextIndex = config.stages.indexOf(currentStage) + 1;
    if (nextIndex >= config.stages.length) {
      state.unlockedIndex = config.stages.length;
      persist();
      renderComplete();
      return;
    }
    state.currentId = config.stages[nextIndex].id;
    state.unlockedIndex = Math.max(state.unlockedIndex, nextIndex);
    persist();
    updateUrl(config.stages[nextIndex]);
    renderStage(config.stages[nextIndex]);
  }

  function renderComplete() {
    currentStage = config.stages[config.stages.length - 1];
    clearStage();
    elements.stageTitle.textContent = config.ui.complete;
    elements.prompt.textContent = "";
    elements.progress.textContent = config.ui.complete;
    showResult(config.ui.complete, "success");
  }

  function restart() {
    if (!ensureAccess()) return;
    if (!window.confirm(config.ui.resetConfirm)) return;
    state = {
      currentId: config.stages[0].id,
      unlockedIndex: 0,
      completed: {},
      coordinateInputs: {}
    };
    persist();
    updateUrl(config.stages[0]);
    setNotice(config.ui.reset);
    renderStage(config.stages[0]);
  }

  function startGame(authResult) {
    try {
      if (authResult && authResult.experienceId && authResult.experienceId !== config.experienceId) {
        const targetExperience = config.publicPortal.experiences.find(function (experience) {
          return experience.id === authResult.experienceId;
        });
        if (!targetExperience || !targetExperience.url) {
          throw new Error("Falta configurar la URL de la aventura seleccionada en publicPortal.experiences.");
        }
        const destination = new URL(targetExperience.url, window.location.href);
        const params = new URLSearchParams(window.location.search);
        params.delete("aventura");
        params.delete("session");
        destination.search = params.toString();
        if (authResult.sessionId) destination.searchParams.set("session", authResult.sessionId);
        window.location.assign(destination.href);
        return;
      }
      validateConfig();
      applyBranding();
      document.body.classList.remove("portal-mode");
      document.getElementById("public-view").hidden = true;
      const accessStatus = checkAccess();
      if (!accessStatus.allowed) {
        showExpiredAccess(Boolean(accessStatus.unavailable));
        return;
      }
      elements.gameContent.hidden = false;
      scheduleAccessCheck();
      state = loadState();
      const requestedIndex = stageFromUrl();
      let currentIndex = config.stages.findIndex(function (stage) { return stage.id === state.currentId; });
      if (requestedIndex !== null && requestedIndex >= 0) {
        currentIndex = Math.min(requestedIndex, state.unlockedIndex, config.stages.length - 1);
      }
      if (currentIndex < 0) currentIndex = 0;
      state.currentId = config.stages[currentIndex].id;
      persist();
      updateUrl(config.stages[currentIndex]);
      renderStage(config.stages[currentIndex]);
      const restartButton = document.createElement("button");
      restartButton.type = "button";
      restartButton.className = "restart-button";
      restartButton.textContent = config.ui.restart;
      restartButton.addEventListener("click", restart);
      elements.footer.appendChild(restartButton);
      if (!storageReady) setNotice(config.ui.storageUnavailable);
    } catch (error) {
      console.error("No se pudo iniciar Escape Room.", error);
      elements.gameContent.hidden = true;
      elements.expiredView.hidden = false;
      elements.expiredTitle.textContent = config && config.ui ? config.ui.invalidConfig : "Error";
      elements.expiredMessage.textContent = error.message;
      document.title = elements.expiredTitle.textContent;
    }
  }

  window.ESCAPE_AUTH_GRANTED = function (result) {
    if (result && result.allowed) startGame(result);
  };

  if (!window.ESCAPE_AUTH_READY || typeof window.ESCAPE_AUTH_READY.then !== "function") {
    const title = "🔒 No se pudo validar la sesión";
    elements.sessionBlockedTitle.textContent = title;
    elements.sessionBlockedMessage.textContent = "No se pudo iniciar la validación de acceso. Vuelve a cargar la página o contacta con la organización.";
    elements.sessionBlocked.hidden = false;
    document.title = title;
    return;
  }
  window.ESCAPE_AUTH_READY.then(function (result) {
    if (result && result.allowed) {
      startGame(result);
      return;
    }
    if (result && result.needsCode) return;
    elements.gameContent.hidden = true;
    elements.expiredView.hidden = true;
    elements.sessionBlockedTitle.textContent = result && result.title || "🔒 Acceso denegado o sesión no válida";
    elements.sessionBlockedMessage.textContent = result && result.message || "Comprueba el enlace o contacta con la organización.";
    elements.sessionBlocked.hidden = false;
    document.title = elements.sessionBlockedTitle.textContent;
    document.body.classList.add("access-closed");
  }).catch(function (error) {
    console.error("No se pudo completar la validación de sesión.", error);
    elements.gameContent.hidden = true;
    elements.expiredView.hidden = true;
    elements.sessionBlockedTitle.textContent = "🔒 No se pudo validar la sesión";
    elements.sessionBlockedMessage.textContent = "Ocurrió un error al comprobar el acceso. Vuelve a cargar la página o contacta con la organización.";
    elements.sessionBlocked.hidden = false;
    document.title = elements.sessionBlockedTitle.textContent;
    document.body.classList.add("access-closed");
  });
})();
