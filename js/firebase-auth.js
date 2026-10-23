import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  Timestamp,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBonaZQAH_5whKokDV8lnl2eP70WINPRTw",
  authDomain: "quiz-teams-414d7.firebaseapp.com",
  projectId: "quiz-teams-414d7",
  storageBucket: "quiz-teams-414d7.firebasestorage.app",
  messagingSenderId: "834996635016",
  appId: "1:834996635016:web:c48a60c6643d27bb6c263d"
};
const app = window.escapeFirebaseApp || (getApps().length ? getApp() : initializeApp(firebaseConfig));
const db = getFirestore(app);
const expiredTitle = "🔒 Acceso Expirado: El tiempo de tu pase ha finalizado";
const expiredMessage = "El tiempo de tu pase ha finalizado. Solicita un nuevo código de acceso para volver a jugar.";
const invalidCodeMessage = "Código inválido o ya utilizado.";
const accessView = document.getElementById("access-view");
const publicView = document.getElementById("public-view");
const qrNotice = document.getElementById("qr-notice");
const selectionNotice = document.getElementById("experience-selection");
const accessForm = document.getElementById("access-form");
const accessCode = document.getElementById("access-code");
const accessSubmit = document.getElementById("access-submit");
const accessError = document.getElementById("access-error");
const selectedExperienceStorageKey = "escape-room-selected-experience:" + firebaseConfig.projectId;
const legacySessionStorageKey = "escape-room-session:" + firebaseConfig.projectId;
let selectedExperienceId = null;
let expirationTimer = null;

function experienceSessionKey(experienceId) {
  return legacySessionStorageKey + ":" + experienceId;
}

function getExperience(experienceId) {
  const experiences = window.ESCAPE_CONFIG.publicPortal.experiences;
  return experiences.find(function (experience) { return experience.id === experienceId; }) || null;
}

function selectExperience(experienceId) {
  const experience = getExperience(experienceId);
  if (!experience) return;
  selectedExperienceId = experienceId;
  window.localStorage.setItem(selectedExperienceStorageKey, experienceId);
  Array.from(document.querySelectorAll(".experience-card")).forEach(function (card) {
    const selected = card.dataset.experienceId === experienceId;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
  selectionNotice.textContent = "Has elegido " + experience.title + ". Introduce tu código para empezar.";
  accessView.hidden = false;
  accessError.textContent = "";
}

function renderPublicPortal() {
  const portal = window.ESCAPE_CONFIG && window.ESCAPE_CONFIG.publicPortal;
  if (!portal || !Array.isArray(portal.experiences)) {
    throw new Error("Falta configurar publicPortal en js/config.js.");
  }

  document.getElementById("public-title").textContent = portal.title || "Escape rooms al aire libre";
  document.getElementById("public-description").textContent = portal.description || "";
  document.getElementById("experiences-title").textContent = portal.experiencesTitle || "Nuestras aventuras";
  document.getElementById("booking-title").textContent = portal.bookingTitle || "Organiza una partida";
  document.getElementById("booking-description").textContent = portal.bookingDescription || "";

  const experienceList = document.getElementById("experience-list");
  experienceList.replaceChildren();
  portal.experiences.forEach(function (experience) {
    if (!experience || typeof experience.title !== "string") {
      throw new Error("Cada experiencia de publicPortal necesita un title.");
    }
    if (!["harry-potter", "stranger-things"].includes(experience.id)) {
      throw new Error("Cada experiencia debe tener un id reconocido: harry-potter o stranger-things.");
    }
    const card = document.createElement("button");
    card.type = "button";
    card.className = "experience-card";
    if (experience.theme === "hogwarts" || experience.theme === "stranger-things") {
      card.classList.add("experience-card--" + experience.theme);
    }
    card.dataset.experienceId = experience.id;
    card.setAttribute("aria-pressed", "false");
    const title = document.createElement("h3");
    title.textContent = experience.title;
    card.appendChild(title);
    card.addEventListener("click", function () { selectExperience(experience.id); });
    experienceList.appendChild(card);
  });

  const bookingLink = document.getElementById("booking-link");
  const bookingUrl = typeof portal.bookingUrl === "string" ? portal.bookingUrl.trim() : "";
  if (bookingUrl) {
    const isAllowedProtocol = /^(https?:|mailto:|tel:)/i.test(bookingUrl);
    if (!isAllowedProtocol) {
      throw new Error("publicPortal.bookingUrl debe usar https, http, mailto o tel.");
    }
    bookingLink.href = bookingUrl;
    bookingLink.textContent = portal.bookingLabel || "Consultar disponibilidad";
    bookingLink.hidden = false;
  } else {
    bookingLink.hidden = true;
    bookingLink.removeAttribute("href");
  }
}

function timestampMillis(value) {
  return value && typeof value.toMillis === "function" ? value.toMillis() : NaN;
}

function displayCodeEntry(message) {
  renderPublicPortal();
  document.body.classList.add("portal-mode");
  publicView.hidden = false;
  accessView.hidden = true;
  accessError.textContent = message || "";
  const params = new URLSearchParams(window.location.search);
  const requestedStage = params.get("pista");
  const queryExperienceId = params.get("aventura");
  let initialExperienceId = getExperience(queryExperienceId) ? queryExperienceId : null;
  if (!initialExperienceId && requestedStage) initialExperienceId = window.ESCAPE_CONFIG.experienceId;
  if (!initialExperienceId) {
    try {
      const savedExperienceId = window.localStorage.getItem(selectedExperienceStorageKey);
      if (getExperience(savedExperienceId)) initialExperienceId = savedExperienceId;
    } catch (error) {
      console.error("No se pudo recuperar la aventura elegida.", error);
    }
  }
  if (initialExperienceId) selectExperience(initialExperienceId);
  else selectionNotice.textContent = "Elige una aventura y después introduce tu código de acceso.";
  qrNotice.textContent = requestedStage
    ? "Has escaneado un QR de una aventura. Introduce tu código para acceder a esta prueba y continuar el recorrido."
    : "";
  qrNotice.hidden = !requestedStage;
  document.title = document.getElementById("public-title").textContent;
}

function showBlockedAccess(title, message) {
  document.body.classList.remove("portal-mode");
  document.getElementById("game-content").hidden = true;
  document.getElementById("expired-view").hidden = true;
  document.getElementById("access-view").hidden = true;
  document.getElementById("session-blocked-title").textContent = title;
  document.getElementById("session-blocked-message").textContent = message;
  document.getElementById("session-blocked").hidden = false;
  document.title = title;
  document.body.classList.add("access-closed");
}

function expireSession() {
  if (expirationTimer !== null) window.clearTimeout(expirationTimer);
  document.getElementById("game-content").hidden = true;
  document.getElementById("music").pause();
  displayCodeEntry(expiredMessage);
}

function scheduleExpiration(deadline) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    expireSession();
    return;
  }
  expirationTimer = window.setTimeout(
    function () { scheduleExpiration(deadline); },
    Math.min(remaining, 2147483647)
  );
}

function generateSessionId() {
  if (!window.crypto || typeof window.crypto.randomUUID !== "function") {
    throw new Error("Este navegador no permite generar un identificador seguro. Actualiza el navegador e inténtalo de nuevo.");
  }
  return window.crypto.randomUUID();
}

function ensureStorageAvailable() {
  const probeKey = legacySessionStorageKey + ":probe";
  window.localStorage.setItem(probeKey, "1");
  window.localStorage.removeItem(probeKey);
}

async function validateSavedSession() {
  const params = new URLSearchParams(window.location.search);
  const requestedExperienceId = params.get("aventura");
  let experienceId = getExperience(requestedExperienceId) ? requestedExperienceId : null;
  if (!experienceId && params.has("pista")) experienceId = window.ESCAPE_CONFIG.experienceId;
  if (!experienceId) {
    try {
      const savedExperienceId = window.localStorage.getItem(selectedExperienceStorageKey);
      if (getExperience(savedExperienceId)) experienceId = savedExperienceId;
    } catch (error) {
      console.error("No se pudo recuperar la aventura asociada a la sesión.", error);
    }
  }
  if (!experienceId) experienceId = window.ESCAPE_CONFIG.experienceId;
  const sessionStorageKey = experienceSessionKey(experienceId);
  const sessionQueryId = params.get("session");
  let saved;
  try {
    saved = sessionQueryId
      ? JSON.stringify({ id: sessionQueryId, expiresAt: 0, experienceId: experienceId })
      : window.localStorage.getItem(sessionStorageKey);
    if (!saved && experienceId === window.ESCAPE_CONFIG.experienceId) {
      saved = window.localStorage.getItem(legacySessionStorageKey);
    }
  } catch (error) {
    console.error("No se pudo leer la sesión guardada.", error);
    return {
      fatal: true,
      title: "🔒 Almacenamiento no disponible",
      message: "Activa el almacenamiento local del navegador para conservar tu sesión."
    };
  }
  if (!saved) return { needsCode: true };

  let session;
  try {
    session = JSON.parse(saved);
  } catch (error) {
    console.error("La sesión guardada tiene un formato antiguo o no válido.", error);
    window.localStorage.removeItem(sessionStorageKey);
    return { needsCode: true };
  }

  if (!session || typeof session.id !== "string" || !Number.isFinite(session.expiresAt)) {
    window.localStorage.removeItem(sessionStorageKey);
    return { needsCode: true };
  }
  if (session.experienceId && session.experienceId !== experienceId) {
    return { needsCode: true, experienceId: experienceId };
  }
  if (!sessionQueryId && Date.now() >= session.expiresAt) {
    window.localStorage.removeItem(sessionStorageKey);
    return { expired: true };
  }

  try {
    const snapshot = await getDoc(doc(db, "sesiones_juego", session.id));
    if (!snapshot.exists()) {
      window.localStorage.removeItem(sessionStorageKey);
      return { needsCode: true };
    }

    const data = snapshot.data();
    const serverExpiry = timestampMillis(data.expiresAt);
    const sessionExperienceId = data.experiencia || (experienceId === "harry-potter" ? "harry-potter" : null);
    if (data.activa !== true || !Number.isFinite(serverExpiry) || sessionExperienceId !== experienceId) {
      if (sessionQueryId) {
        return { fatal: true, title: "🔒 Código asociado a otra aventura", message: "Este acceso pertenece a otra aventura. Vuelve a la página principal y elige la aventura correcta." };
      }
      window.localStorage.removeItem(sessionStorageKey);
      return { needsCode: true };
    }
    if (Date.now() >= serverExpiry) {
      window.localStorage.removeItem(sessionStorageKey);
      return { expired: true };
    }

    const validatedSession = { id: session.id, expiresAt: serverExpiry, experienceId: experienceId };
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(validatedSession));
    if (sessionQueryId) {
      params.delete("session");
      window.history.replaceState({}, "", window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash);
    }
    scheduleExpiration(serverExpiry);
    return { allowed: true, expiresAt: serverExpiry, sessionId: session.id, experienceId: experienceId };
  } catch (error) {
    console.error("No se pudo validar la sesión guardada en Firestore.", error);
    return {
      fatal: true,
      title: "🔒 No se pudo comprobar la sesión",
      message: "No se pudo contactar con Firebase. Comprueba tu conexión y vuelve a intentarlo."
    };
  }
}

async function redeemCode(rawCode, experienceId) {
  const code = rawCode.trim().toUpperCase();
  if (!code || code.includes("/") || code.length > 128) {
    return { invalid: true };
  }

  let sessionId;
  try {
    ensureStorageAvailable();
    sessionId = generateSessionId();
  } catch (error) {
    console.error("No se pudo preparar una sesión segura en este navegador.", error);
    return {
      error: "No se pudo preparar la sesión. Comprueba que el almacenamiento esté habilitado y que el sitio use HTTPS."
    };
  }

  const codeRef = doc(db, "codigos_acceso", code);
  const sessionRef = doc(db, "sesiones_juego", sessionId);
  const accessRef = doc(db, "experiencias", experienceId, "accesos", sessionId);

  try {
    const expiresAt = await runTransaction(db, async function (transaction) {
      const codeSnapshot = await transaction.get(codeRef);
      if (!codeSnapshot.exists()) return null;

      const codeData = codeSnapshot.data();
      if (codeData.usado !== false) return null;

      const durationHours = Number(codeData.duracionHoras);
      if (!Number.isInteger(durationHours) || durationHours <= 0 || durationHours > 24 * 30) {
        console.error("El código de acceso contiene una duración no válida.");
        return null;
      }

      const expiresAtMillis = Date.now() + durationHours * 60 * 60 * 1000;
      if (!Number.isFinite(expiresAtMillis)) return null;
      const expiresAtTimestamp = Timestamp.fromMillis(expiresAtMillis);
      transaction.update(codeRef, {
        usado: true,
        sesionId: sessionId,
        experiencia: experienceId
      });
      transaction.set(sessionRef, {
        activa: true,
        expiresAt: expiresAtTimestamp,
        codigoId: code,
        experiencia: experienceId
      });
      transaction.set(accessRef, {
        codigoId: code,
        expiresAt: expiresAtTimestamp,
        createdAt: serverTimestamp()
      });
      return expiresAtMillis;
    });

    if (expiresAt === null) return { invalid: true };

    const savedSession = { id: sessionId, expiresAt: expiresAt, experienceId: experienceId };
    try {
      window.localStorage.setItem(experienceSessionKey(experienceId), JSON.stringify(savedSession));
      window.localStorage.setItem(selectedExperienceStorageKey, experienceId);
    } catch (error) {
      console.error("El código se consumió, pero no se pudo guardar la sesión local.", error);
      return {
        error: "El código se ha validado, pero no se pudo guardar la sesión en este navegador. Activa el almacenamiento e inténtalo de nuevo con asistencia."
      };
    }
    scheduleExpiration(expiresAt);
    return { allowed: true, expiresAt: expiresAt, sessionId: sessionId, experienceId: experienceId };
  } catch (error) {
    console.error("No se pudo canjear el código de acceso en Firestore.", error);
    if (error && error.code === "permission-denied") {
      return {
        error: "Firebase no permite validar o consumir este código. Revisa las reglas publicadas para codigos_acceso y sesiones_juego. Detalle técnico: " +
          (error.code || "permission-denied") + (error.message ? " — " + error.message : "")
      };
    }
    return {
      error: "No se pudo contactar con Firebase. Comprueba tu conexión y vuelve a intentarlo. Detalle técnico: " +
        (error && error.code || "sin código") + (error && error.message ? " — " + error.message : "")
    };
  }
}

accessForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (accessSubmit.disabled) return;
  if (!selectedExperienceId) {
    accessError.textContent = "Elige primero la aventura que quieres jugar.";
    return;
  }
  const selectedExperience = getExperience(selectedExperienceId);
  if (selectedExperienceId !== window.ESCAPE_CONFIG.experienceId && !selectedExperience.url) {
    accessError.textContent = "Falta configurar la URL de " + selectedExperience.title + " en publicPortal.experiences.";
    return;
  }

  accessSubmit.disabled = true;
  accessCode.disabled = true;
  accessError.textContent = "Validando código…";
  const result = await redeemCode(accessCode.value, selectedExperienceId);
  accessSubmit.disabled = false;
  accessCode.disabled = false;

  if (result.allowed) {
    accessView.hidden = true;
    if (result.experienceId !== window.ESCAPE_CONFIG.experienceId) {
      const destination = new URL(selectedExperience.url, window.location.href);
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete("aventura");
      currentParams.delete("session");
      if (currentParams.toString()) destination.search = currentParams.toString();
      if (result.sessionId) destination.searchParams.set("session", result.sessionId);
      window.location.assign(destination.href);
      return;
    }
    window.ESCAPE_AUTH_GRANTED(result);
    return;
  }

  accessError.textContent = result.invalid ? invalidCodeMessage : result.error;
  if (result.invalid) accessCode.select();
});

validateSavedSession().then(function (result) {
  if (result.allowed) {
    window.finishEscapeAuth(result);
  } else if (result.expired) {
    displayCodeEntry(expiredMessage);
    window.finishEscapeAuth({ needsCode: true });
  } else if (result.needsCode) {
    displayCodeEntry("");
    window.finishEscapeAuth({ needsCode: true });
  } else {
    showBlockedAccess(result.title, result.message);
    window.finishEscapeAuth({ allowed: false, fatal: true });
  }
}).catch(function (error) {
  console.error("Error inesperado al validar la sesión guardada.", error);
  const result = {
    fatal: true,
    title: "🔒 No se pudo comprobar la sesión",
    message: "Ocurrió un error al comprobar tu acceso. Recarga la página o contacta con la organización."
  };
  showBlockedAccess(result.title, result.message);
  window.finishEscapeAuth({ allowed: false, fatal: true });
});
