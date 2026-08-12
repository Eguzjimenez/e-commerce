import { request } from "./apiClient";

export const CHAT_SENDERS = {
  CLIENT: "Cliente",
  BOT: "Bot",
  SUPPORT: "Soporte",
};

export const CHAT_STATES = {
  OPEN: "Abierto",
  ESCALATED: "Escalado",
  CLOSED: "Finalizado",
};

/**
 * Evento usado para abrir el asistente virtual desde otras partes de la interfaz,
 * siguiendo el mismo patron que "cartchange" y "authchange".
 */
export const OPEN_CHAT_EVENT = "openchat";

export function openChatAssistant() {
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
}

export function sendChatMessage(mensaje, { signal } = {}) {
  return request("/api/Chat/mensajes", {
    method: "POST",
    body: { mensaje: String(mensaje || "").trim() },
    signal,
  });
}

export function getChatConversation({ signal } = {}) {
  return request("/api/Chat/conversacion", {
    method: "GET",
    signal,
  });
}

export function escalateChatToSupport() {
  return request("/api/Chat/escalamiento", {
    method: "POST",
  });
}

export function endChatConversation() {
  return request("/api/Chat/finalizacion", {
    method: "POST",
  });
}

export function getSupportConversations({ estado = "", signal } = {}) {
  const query = new URLSearchParams();
  const normalizedState = String(estado || "").trim();

  if (normalizedState) {
    query.set("estado", normalizedState);
  }

  const queryString = query.toString();

  return request(`/api/Chat/admin${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
    signal,
  });
}

export function getSupportConversationMessages(idChat, { signal } = {}) {
  return request(`/api/Chat/admin/${Number(idChat)}/mensajes`, {
    method: "GET",
    signal,
  });
}

export function replySupportConversation(idChat, mensaje) {
  return request(`/api/Chat/admin/${Number(idChat)}/mensajes`, {
    method: "POST",
    body: { mensaje: String(mensaje || "").trim() },
  });
}
