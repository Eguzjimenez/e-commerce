import { request } from "./apiClient";

const THEME_STORAGE_KEY = "concre_innova_tema";

function storeThemeFailed() {
  return false;
}

export async function getPreferences() {
  return request("/api/Preferencias", { method: "GET" });
}

export async function updatePreferences({
  notificacionesActivas,
  notificacionesCorreo,
  tema,
}) {
  return request("/api/Preferencias", {
    method: "PUT",
    body: {
      notificacionesActivas: Boolean(notificacionesActivas),
      notificacionesCorreo: Boolean(notificacionesCorreo),
      tema: tema === "oscuro" ? "oscuro" : "claro",
    },
  });
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "oscuro" ? "oscuro" : "claro";
  } catch {
    return "claro";
  }
}

export function storeTheme(tema) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, tema === "oscuro" ? "oscuro" : "claro");
    window.dispatchEvent(new Event("temachange"));
  } catch {
    storeThemeFailed();
  }
}
