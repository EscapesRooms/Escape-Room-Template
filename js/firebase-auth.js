import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  Timestamp
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
const sessionStorageKey = "escape-room-session:" + firebaseConfig.projectId;
const expiredTitle = "🔒 Acceso Expirado: El tiempo de tu pase ha finalizado";
const expiredMessage = "El tiempo de tu pase ha finalizado. Solicita un nuevo código de acceso para volver a jugar.";
const invalidCodeMessage = "Código inválido o ya utilizado.";
const accessView = document.getElementById("access-view");
const accessForm = document.getElementById("access-form");
const accessCode = document.getElementById("access-code");
const accessSubmit = document.getElementById("access-submit");
const accessError = document.getElementById("access-error");
let expirationTimer = null;

function timestampMillis(value) {
  return value && typeof value.toMillis === "function" ? value.toMillis() : NaN;
}

function displayCodeEntry(message) {
  accessView.hidden = false;
  accessError.textContent = message || "";
  document.title = "Acceso a la aventura";
}

function showBlockedAccess(title, message) {
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
  document.getElementById("expired-view").hidden = true;
  document.getElementById("music").pause();
  document.getElementById("session-blocked-title").textContent = expiredTitle;
  document.getElementById("session-blocked-message").textContent = expiredMessage;
  document.getElementById("session-blocked").hidden = false;
  document.title = expiredTitle;
  document.body.classList.add("access-closed");
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
  const probeKey = sessionStorageKey + ":probe";
  window.localStorage.setItem(probeKey, "1");
  window.localStorage.removeItem(probeKey);
}

async function validateSavedSession() {
  let saved;
  try {
    saved = window.localStorage.getItem(sessionStorageKey);
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
  if (Date.now() >= session.expiresAt) {
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
    if (data.activa !== true || !Number.isFinite(serverExpiry)) {
      window.localStorage.removeItem(sessionStorageKey);
      return { needsCode: true };
    }
    if (Date.now() >= serverExpiry) {
      window.localStorage.removeItem(sessionStorageKey);
      return { expired: true };
    }

    const validatedSession = { id: session.id, expiresAt: serverExpiry };
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(validatedSession));
    scheduleExpiration(serverExpiry);
    return { allowed: true, expiresAt: serverExpiry };
  } catch (error) {
    console.error("No se pudo validar la sesión guardada en Firestore.", error);
    return {
      fatal: true,
      title: "🔒 No se pudo comprobar la sesión",
      message: "No se pudo contactar con Firebase. Comprueba tu conexión y vuelve a intentarlo."
    };
  }
}

async function redeemCode(rawCode) {
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

  try {
    const expiresAt = await runTransaction(db, async function (transaction) {
      const codeSnapshot = await transaction.get(codeRef);
      if (!codeSnapshot.exists()) return null;

      const codeData = codeSnapshot.data();
      if (codeData.usado !== false) return null;

      const durationHours = Number(codeData.duracionHoras);
      if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24 * 30) {
        console.error("El código de acceso contiene una duración no válida.");
        return null;
      }

      const expiresAtMillis = Date.now() + durationHours * 60 * 60 * 1000;
      if (!Number.isFinite(expiresAtMillis)) return null;
      const expiresAtTimestamp = Timestamp.fromMillis(expiresAtMillis);
      transaction.update(codeRef, {
        usado: true,
        sesionId: sessionId
      });
      transaction.set(sessionRef, {
        activa: true,
        expiresAt: expiresAtTimestamp,
        codigoId: code
      });
      return expiresAtMillis;
    });

    if (expiresAt === null) return { invalid: true };

    const savedSession = { id: sessionId, expiresAt: expiresAt };
    try {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(savedSession));
    } catch (error) {
      console.error("El código se consumió, pero no se pudo guardar la sesión local.", error);
      return {
        error: "El código se ha validado, pero no se pudo guardar la sesión en este navegador. Activa el almacenamiento e inténtalo de nuevo con asistencia."
      };
    }
    scheduleExpiration(expiresAt);
    return { allowed: true, expiresAt: expiresAt };
  } catch (error) {
    console.error("No se pudo canjear el código de acceso en Firestore.", error);
    if (error && error.code === "permission-denied") {
      return {
        error: "Firebase no permite validar o consumir este código. Revisa las reglas de Firestore para codigos_acceso y sesiones_juego."
      };
    }
    return {
      error: "No se pudo contactar con Firebase. Comprueba tu conexión y vuelve a intentarlo."
    };
  }
}

accessForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (accessSubmit.disabled) return;

  accessSubmit.disabled = true;
  accessCode.disabled = true;
  accessError.textContent = "Validando código…";
  const result = await redeemCode(accessCode.value);
  accessSubmit.disabled = false;
  accessCode.disabled = false;

  if (result.allowed) {
    accessView.hidden = true;
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
    showBlockedAccess(expiredTitle, expiredMessage);
    window.finishEscapeAuth({ allowed: false, fatal: true });
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
