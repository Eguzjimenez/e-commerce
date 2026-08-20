import { request } from "./apiClient";
import { getAuth, logout } from "./authService";

const AUTH_STORAGE_KEY = "concre_innova_auth";

/** Margen antes del vencimiento en el que ya conviene renovar. */
const MARGEN_RENOVACION_MS = 5 * 60 * 1000;

/** Tiempo sin ninguna interacción tras el cual la sesión sí debe cerrarse. */
export const INACTIVIDAD_MAXIMA_MS = 30 * 60 * 1000;

let ultimaActividad = Date.now();
let renovacionEnCurso = null;

export function registrarActividad() {
  ultimaActividad = Date.now();
}

export function estaInactivo() {
  return Date.now() - ultimaActividad > INACTIVIDAD_MAXIMA_MS;
}

/** Momento de vencimiento del token guardado, en milisegundos. */
export function getVencimientoToken() {
  const token = getAuth()?.token;

  if (!token) {
    return 0;
  }

  try {
    const carga = JSON.parse(atob(token.split(".")[1]));
    return Number(carga?.exp) * 1000 || 0;
  } catch {
    return 0;
  }
}

function guardarToken(token) {
  try {
    const auth = getAuth();
    if (!auth) {
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...auth, token }));
  } catch {
    // Sin almacenamiento no se puede prolongar la sesión; se dejará vencer.
  }
}

/**
 * Pide un token nuevo al API. Varias llamadas simultáneas comparten la misma
 * petición para no renovar dos veces seguidas.
 */
export async function renovarSesion() {
  if (renovacionEnCurso) {
    return renovacionEnCurso;
  }

  renovacionEnCurso = request("/api/Auth/refresh", { method: "POST" })
    .then((respuesta) => {
      if (respuesta?.token) {
        guardarToken(respuesta.token);
        return true;
      }
      return false;
    })
    .catch(() => false)
    .finally(() => {
      renovacionEnCurso = null;
    });

  return renovacionEnCurso;
}

/**
 * Mantiene viva la sesión de quien está trabajando: renueva el token antes de
 * que venza y solo cierra sesión tras un rato real de inactividad.
 */
export function iniciarVigilanciaDeSesion() {
  const eventos = ["click", "keydown", "pointerdown", "scroll"];
  eventos.forEach((evento) =>
    window.addEventListener(evento, registrarActividad, { passive: true })
  );

  const intervalo = window.setInterval(async () => {
    const vencimiento = getVencimientoToken();

    if (!vencimiento) {
      return;
    }

    if (estaInactivo()) {
      if (Date.now() >= vencimiento) {
        logout();
      }
      return;
    }

    if (vencimiento - Date.now() <= MARGEN_RENOVACION_MS) {
      await renovarSesion();
    }
  }, 60 * 1000);

  return () => {
    window.clearInterval(intervalo);
    eventos.forEach((evento) =>
      window.removeEventListener(evento, registrarActividad)
    );
  };
}
