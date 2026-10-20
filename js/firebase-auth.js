import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

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
const deniedTitle = "🔒 Acceso denegado o sesión no válida";
const deniedMessage = "El enlace no contiene una sesión activa válida. Comprueba el enlace o contacta con la organización.";
const expiredTitle = "🔒 Acceso Expirado: El tiempo de tu pase ha finalizado";
const expiredMessage = "El tiempo de tu pase ha finalizado. Si necesitas ayuda, ponte en contacto con la organización.";
let expirationTimer = null;

function showBlockedAccess(title, message) {
  document.getElementById("game-content").hidden = true;
  document.getElementById("expired-view").hidden = true;
  document.getElementById("session-blocked-title").textContent = title;
  document.getElementById("session-blocked-message").textContent = message;
  document.getElementById("session-blocked").hidden = false;
  document.title = title;
  document.body.classList.add("access-closed");
}

function timestampMillis(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") {
    const millis = typeof value === "number" ? value : Date.parse(value);
    return Number.isFinite(millis) ? millis : NaN;
  }
  return NaN;
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

async function validateSession() {
  const params = new URLSearchParams(window.location.search);
  let sessionId = params.get("sesion");

  try {
    if (!sessionId) sessionId = window.localStorage.getItem(sessionStorageKey);
  } catch (error) {
    console.error("No se pudo leer la sesión guardada.", error);
    return {
      allowed: false,
      title: "🔒 No se pudo validar la sesión",
      message: "El navegador no permite acceder al almacenamiento local. Habilítalo o abre el enlace de sesión completo."
    };
  }

  if (!sessionId || !sessionId.trim()) {
    return { allowed: false, title: deniedTitle, message: deniedMessage };
  }

  try {
    const snapshot = await getDoc(doc(db, "sesiones_juego", sessionId.trim()));
    if (!snapshot.exists()) return { allowed: false, title: deniedTitle, message: deniedMessage };

    const session = snapshot.data();
    if (session.activa !== true) return { allowed: false, title: deniedTitle, message: deniedMessage };

    const startMillis = timestampMillis(session.fechaInicio);
    const durationHours = Number(session.duracionHoras);
    if (!Number.isFinite(startMillis) || !Number.isFinite(durationHours) || durationHours <= 0) {
      console.error("El documento de sesión contiene una fecha de inicio o duración no válida.");
      return { allowed: false, title: deniedTitle, message: deniedMessage };
    }

    const expiresAt = startMillis + durationHours * 60 * 60 * 1000;
    if (!Number.isFinite(expiresAt)) {
      console.error("La sesión contiene una fecha de expiración no válida.");
      return { allowed: false, title: deniedTitle, message: deniedMessage };
    }
    if (Date.now() >= expiresAt) {
      return {
        allowed: false,
        title: expiredTitle,
        message: expiredMessage
      };
    }

    try {
      window.localStorage.setItem(sessionStorageKey, sessionId.trim());
    } catch (error) {
      console.error("No se pudo guardar la sesión validada.", error);
      return {
        allowed: false,
        title: "🔒 No se pudo validar la sesión",
        message: "No se pudo guardar la sesión en este navegador. Habilita el almacenamiento local e inténtalo de nuevo."
      };
    }

    return { allowed: true, expiresAt: expiresAt };
  } catch (error) {
    console.error("No se pudo consultar la sesión en Cloud Firestore.", error);
    if (error && error.code === "permission-denied") {
      return {
        allowed: false,
        title: "🔒 Firebase no permite consultar esta sesión",
        message: "Revisa las reglas de Cloud Firestore para permitir la validación segura de esta sesión."
      };
    }
    return {
      allowed: false,
      title: "🔒 No se pudo validar la sesión",
      message: "No se pudo contactar con Firebase. Comprueba tu conexión y vuelve a intentarlo."
    };
  }
}

validateSession().then(function (result) {
  if (!result.allowed) showBlockedAccess(result.title, result.message);
  else scheduleExpiration(result.expiresAt);
  window.finishEscapeAuth(result);
}).catch(function (error) {
  console.error("Error inesperado al validar la sesión.", error);
  const result = {
    allowed: false,
    title: "🔒 No se pudo validar la sesión",
    message: "Ocurrió un error al comprobar el acceso. Vuelve a cargar la página o contacta con la organización."
  };
  showBlockedAccess(result.title, result.message);
  window.finishEscapeAuth(result);
});
