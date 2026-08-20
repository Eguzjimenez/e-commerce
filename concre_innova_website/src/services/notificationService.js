import { request } from "./apiClient";
import { normalizePaginatedResponse } from "./paginationService";

export const NOTIFICATION_TYPES = {
  ORDER: "Pedido",
  QUOTATION: "Cotizacion",
  CHAT: "Chat",
  GENERAL: "General",
};

/**
 * Evento usado para mantener sincronizados el indicador de la barra de
 * navegacion y el panel de notificaciones, siguiendo el mismo patron que
 * "cartchange" y "favoriteschange".
 */
export const NOTIFICATIONS_CHANGED_EVENT = "notificationschange";

export const NOTIFICATIONS_PAGE_SIZE = 10;
export const NOTIFICATIONS_PREVIEW_SIZE = 5;
export const NOTIFICATIONS_POLL_INTERVAL_MS = 20000;

/**
 * Textos compartidos por la campana y la pantalla de notificaciones, para que
 * ambas superficies digan exactamente lo mismo ante el mismo estado.
 */
export const NOTIFICATIONS_COPY = {
  titulo: "Notificaciones",
  cargando: "Cargando notificaciones...",
  vacio: "Todavía no tienes notificaciones.",
  vacioSinLeer: "No tienes notificaciones sin leer.",
  errorCarga: "No se pudieron cargar tus notificaciones.",
  errorMarcar: "No se pudo actualizar la notificación.",
  errorMarcarTodas: "No se pudieron actualizar las notificaciones.",
  marcarTodas: "Marcar todas como leídas",
  marcarUna: "Marcar como leída",
  verTodas: "Ver todas",
  sinLeer: "Sin leer",
};

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export async function getNotifications({
  soloNoLeidas = false,
  pagina = 1,
  tamanoPagina = NOTIFICATIONS_PAGE_SIZE,
  signal,
} = {}) {
  const query = new URLSearchParams({
    soloNoLeidas: String(Boolean(soloNoLeidas)),
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
  });

  const response = await request(`/api/Notificaciones?${query.toString()}`, {
    method: "GET",
    signal,
  });

  return {
    ...normalizePaginatedResponse(response, pagina, tamanoPagina),
    noLeidas: Number(response?.noLeidas) || 0,
  };
}

export async function getNotificationSummary({ signal } = {}) {
  const response = await request("/api/Notificaciones/resumen", {
    method: "GET",
    signal,
  });

  return {
    noLeidas: Number(response?.noLeidas) || 0,
    ultimaNoLeida: response?.ultimaNoLeida || null,
  };
}

export async function markNotificationAsRead(idNotificacion) {
  const result = await request(
    `/api/Notificaciones/${Number(idNotificacion)}/lectura`,
    { method: "PUT" }
  );

  notifyNotificationsChanged();
  return result;
}

export async function markAllNotificationsAsRead() {
  const result = await request("/api/Notificaciones/lectura", { method: "PUT" });

  notifyNotificationsChanged();
  return result;
}

/**
 * Devuelve la fecha de la notificacion en un formato corto y legible.
 */
export function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
