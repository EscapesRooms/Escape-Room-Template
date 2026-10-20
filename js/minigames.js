(function () {
  "use strict";

  function shuffle(items) {
    const shuffled = items.slice();
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text || "";
    return element;
  }

  function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  function mountRunes(container, game, onComplete) {
    const board = textElement("div", "runes-board");
    const status = textElement("p", "game-status", game.promptText);
    const sequence = game.sequence || game.symbols;
    const selected = [];
    shuffle(game.symbols).forEach(function (symbol) {
      const button = textElement("button", "game-tile rune-tile", symbol);
      button.type = "button";
      button.setAttribute("aria-label", interpolate(game.symbolAriaLabel, { symbol: symbol }));
      button.addEventListener("click", function () {
        if (symbol !== sequence[selected.length]) {
          selected.length = 0;
          board.querySelectorAll("button").forEach(function (tile) {
            tile.disabled = false;
            tile.classList.remove("tile-correct");
          });
          status.textContent = game.retryText;
          return;
        }
        selected.push(symbol);
        button.disabled = true;
        button.classList.add("tile-correct");
        if (selected.length === sequence.length) {
          status.textContent = game.successText;
          onComplete();
        }
      });
      board.appendChild(button);
    });
    container.append(board, status);
  }

  function mountGuardians(container, game, onComplete) {
    const board = textElement("div", "guardians-board");
    const status = textElement("p", "game-status", game.memorizeText);
    let next = 1;
    let locked = true;
    const positions = shuffle(Array.from({ length: game.count }, function (_, index) { return index + 1; }));
    positions.forEach(function (number) {
      const button = textElement("button", "game-tile guardian-tile", String(number));
      button.type = "button";
      button.disabled = true;
      button.addEventListener("click", function () {
        if (locked) return;
        if (number !== next) {
          next = 1;
          board.querySelectorAll("button").forEach(function (tile) {
            tile.disabled = false;
            tile.textContent = game.hiddenLabel;
            tile.classList.remove("tile-correct");
          });
          status.textContent = game.retryText;
          return;
        }
        button.disabled = true;
        button.textContent = String(number);
        button.classList.add("tile-correct");
        next++;
        if (next > game.count) {
          status.textContent = game.successText;
          onComplete();
        } else {
          status.textContent = interpolate(game.nextText, { next: next });
        }
      });
      board.appendChild(button);
    });
    container.append(board, status);
    window.setTimeout(function () {
      locked = false;
      board.querySelectorAll("button").forEach(function (button) {
        button.disabled = false;
        button.textContent = game.hiddenLabel;
      });
      status.textContent = interpolate(game.playText, { first: 1, last: game.count });
    }, game.memoryMs);
  }

  function mountPlatform(container, game, onComplete) {
    const sequence = game.sequence || game.route || game.nodes;
    const sequenceView = textElement("div", "sequence-view", sequence.join(game.separator));
    const board = textElement("div", "platform-board");
    const status = textElement("p", "game-status", game.memorizeText);
    let position = 0;
    let showing = true;
    const buttons = game.choices.map(function (choice) {
      const button = textElement("button", "game-tile platform-tile", choice);
      button.type = "button";
      button.addEventListener("click", function () {
        if (showing) return;
        if (choice !== sequence[position]) {
          position = 0;
          showing = true;
          buttonsReset();
          sequenceView.textContent = sequence.join(game.separator);
          status.textContent = game.retryText;
          window.setTimeout(hideSequence, game.retryMemoryMs || game.memoryMs);
          return;
        }
        button.disabled = true;
        button.classList.add("tile-correct");
        position++;
        if (position === sequence.length) {
          status.textContent = game.successText;
          onComplete();
        }
      });
      board.appendChild(button);
      return button;
    });
    function buttonsReset() {
      buttons.forEach(function (button) {
        button.disabled = false;
        button.classList.remove("tile-correct");
      });
    }
    function hideSequence() {
      showing = false;
      sequenceView.textContent = Array(sequence.length).fill(game.hiddenLabel).join(game.separator);
      status.textContent = game.playText;
    }
    container.append(sequenceView, board, status);
    window.setTimeout(hideSequence, game.memoryMs);
  }

  function mountTransport(container, game, onComplete) {
    const route = textElement("div", "transport-route");
    const vehicle = textElement("div", "transport-vehicle", game.trainLabel);
    const options = textElement("div", "transport-options");
    const status = textElement("p", "game-status", "");
    let current = 0;

    function renderLeg() {
      const leg = game.stages[current];
      route.replaceChildren();
      route.append(
        textElement("span", "transport-stop", game.startLabel + " " + leg.from),
        textElement("span", "transport-line", game.lineLabel),
        textElement("span", "transport-stop", game.goalIcon + " " + game.goalLabel)
      );
      vehicle.classList.remove("vehicle-error", "vehicle-arrival");
      status.textContent = interpolate(game.turnText, { current: current + 1, total: game.stages.length });
      options.replaceChildren();
      shuffle([leg.correct, ...leg.alternatives]).forEach(function (destination) {
        const button = textElement("button", "transport-choice", game.trainLabel + " " + destination);
        button.type = "button";
        button.addEventListener("click", function () {
          options.querySelectorAll("button").forEach(function (item) { item.disabled = true; });
          if (destination !== leg.correct) {
            current = 0;
            vehicle.classList.add("vehicle-error");
            status.textContent = game.wrongText;
            window.setTimeout(renderLeg, game.retryDelayMs);
            return;
          }
          button.classList.add("tile-correct");
          vehicle.classList.add("vehicle-arrival");
          current++;
          if (current === game.stages.length) {
            status.textContent = game.successText;
            onComplete();
            return;
          }
          status.textContent = game.nextText;
          window.setTimeout(renderLeg, game.nextDelayMs);
        });
        options.appendChild(button);
      });
    }
    container.append(route, vehicle, options, status);
    renderLeg();
  }

  function mountTargetHunt(container, game, onComplete) {
    const start = textElement("button", "hunt-start", game.startText);
    const zone = textElement("div", "hunt-zone", "");
    const target = textElement("button", "hunt-target", game.targetLabel);
    const progress = textElement("p", "game-status", interpolate(game.countText, { current: 0, total: game.capturesRequired }));
    let captures = 0;
    let intervalId;
    target.type = "button";
    target.setAttribute("aria-label", game.ariaLabel);
    zone.appendChild(target);
    zone.hidden = true;
    function moveTarget() {
      const maxLeft = Math.max(0, zone.clientWidth - target.offsetWidth);
      const maxTop = Math.max(0, zone.clientHeight - target.offsetHeight);
      target.style.left = Math.random() * maxLeft + "px";
      target.style.top = Math.random() * maxTop + "px";
    }
    start.type = "button";
    start.addEventListener("click", function () {
      start.disabled = true;
      zone.hidden = false;
      moveTarget();
      intervalId = window.setInterval(moveTarget, game.initialSpeedMs);
    });
    target.addEventListener("click", function () {
      captures++;
      progress.textContent = interpolate(game.countText, { current: captures, total: game.capturesRequired });
      if (captures >= game.capturesRequired) {
        window.clearInterval(intervalId);
        target.remove();
        progress.textContent = game.successText;
        onComplete();
        return;
      }
      window.clearInterval(intervalId);
      intervalId = window.setInterval(
        moveTarget,
        Math.max(game.minimumSpeedMs, game.initialSpeedMs - captures * game.speedStepMs)
      );
      moveTarget();
    });
    container.append(start, zone, progress);
  }

  function mountSpell(container, game, onComplete) {
    const roundLabel = textElement("p", "round-label", "");
    const sequenceView = textElement("div", "sequence-view", "");
    const board = textElement("div", "spell-board");
    const status = textElement("p", "game-status", "");
    let round = 0;
    let sequence = [];
    let position = 0;
    let locked = true;
    const buttons = game.symbols.map(function (symbol) {
      const button = textElement("button", "game-tile spell-tile", symbol);
      button.type = "button";
      button.addEventListener("click", function () {
        if (locked) return;
        if (symbol !== sequence[position]) {
          status.textContent = game.retryText;
          nextRound();
          return;
        }
        position++;
        if (position === sequence.length) {
          round++;
          if (round >= game.roundLengths.length) {
            status.textContent = game.successText;
            onComplete();
            return;
          }
          status.textContent = game.roundPassedText;
          window.setTimeout(nextRound, game.nextRoundMs);
        }
      });
      board.appendChild(button);
      return button;
    });
    function nextRound() {
      const length = game.roundLengths[round];
      if (!length) return;
      roundLabel.textContent = interpolate(game.roundText, {
        current: round + 1,
        total: game.roundLengths.length
      });
      sequence = shuffle(game.symbols).slice(0, length);
      position = 0;
      locked = true;
      sequenceView.textContent = sequence.join(game.separator);
      status.textContent = game.memorizeText;
      buttons.forEach(function (button) { button.disabled = true; });
      window.setTimeout(function () {
        locked = false;
        sequenceView.textContent = Array(length).fill(game.hiddenLabel).join(game.separator);
        status.textContent = game.playText;
        buttons.forEach(function (button) { button.disabled = false; });
      }, game.memoryMs);
    }
    container.append(roundLabel, sequenceView, board, status);
    nextRound();
  }

  const gameTypes = {
    runas: mountRunes,
    guardianes: mountGuardians,
    anden: mountPlatform,
    transporte: mountTransport,
    snitch: mountTargetHunt,
    hechizo: mountSpell
  };

  window.EscapeMinigames = {
    mount: function (container, game, onComplete) {
      container.replaceChildren();
      const mountGame = gameTypes[game.type];
      if (!mountGame) throw new Error("Tipo de minijuego no reconocido: " + game.type);
      mountGame(container, game, onComplete);
    }
  };
})();
