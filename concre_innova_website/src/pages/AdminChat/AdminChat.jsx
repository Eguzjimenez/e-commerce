import "./AdminChat.css";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import {
  CHAT_SENDERS,
  CHAT_STATES,
  closeSupportConversation,
  getSupportConversationMessages,
  getSupportConversations,
  getSupportConversationsSummary,
  replySupportConversation,
} from "../../services/chatService";

const EMPTY_SUMMARY = {
  activas: 0,
  escaladas: 0,
  finalizadas: 0,
  pendientes: 0,
};

const STATE_FILTERS = [
  { value: "", label: "Todas" },
  { value: CHAT_STATES.ESCALATED, label: "Escaladas" },
  { value: CHAT_STATES.OPEN, label: "Con el asistente" },
  { value: CHAT_STATES.CLOSED, label: "Finalizadas" },
];

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

function getSenderClass(remitente) {
  if (remitente === CHAT_SENDERS.SUPPORT) {
    return "admin";
  }

  return remitente === CHAT_SENDERS.BOT ? "bot" : "cliente";
}

function AdminChat() {
  const [stateFilter, setStateFilter] = useState(CHAT_STATES.ESCALATED);
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const loadSummary = useCallback(async (signal) => {
    try {
      const response = await getSupportConversationsSummary({ signal });
      setSummary({ ...EMPTY_SUMMARY, ...(response || {}) });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setSummary(EMPTY_SUMMARY);
      }
    }
  }, []);

  const loadConversations = useCallback(
    async (signal) => {
      setIsLoadingConversations(true);
      setErrorMessage("");

      try {
        const response = await getSupportConversations({
          estado: stateFilter,
          signal,
        });
        const nextConversations = Array.isArray(response) ? response : [];

        setConversations(nextConversations);
        setSelectedChatId((currentChatId) =>
          nextConversations.some(
            (conversation) => conversation.idChat === currentChatId
          )
            ? currentChatId
            : nextConversations[0]?.idChat ?? null
        );
      } catch (error) {
        if (error?.name !== "AbortError") {
          setErrorMessage(
            error?.message || "No fue posible cargar las conversaciones."
          );
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoadingConversations(false);
        }
      }
    },
    [stateFilter]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadConversations(controller.signal);
    loadSummary(controller.signal);

    return () => controller.abort();
  }, [loadConversations, loadSummary]);

  const loadMessages = useCallback(async (idChat, signal) => {
    if (!idChat) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    try {
      const response = await getSupportConversationMessages(idChat, { signal });
      setMessages(Array.isArray(response) ? response : []);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setErrorMessage(error?.message || "No fue posible cargar los mensajes.");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadMessages(selectedChatId, controller.signal);
    return () => controller.abort();
  }, [selectedChatId, loadMessages]);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.idChat === selectedChatId
    ) || null;

  const handleSendReply = async () => {
    const trimmedReply = replyText.trim();

    if (!trimmedReply || !selectedChatId || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage("");

    try {
      const nuevoMensaje = await replySupportConversation(
        selectedChatId,
        trimmedReply
      );

      setMessages((currentMessages) => [...currentMessages, nuevoMensaje]);
      setReplyText("");
      await loadConversations();
      await loadSummary();
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible enviar la respuesta.");
    } finally {
      setIsSending(false);
    }
  };

  const handleReplyKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendReply();
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedChatId || isClosing) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Cerrar conversacion",
      text: "La conversacion se archiva y queda disponible en el filtro Finalizadas.",
      showCancelButton: true,
      confirmButtonText: "Si, cerrar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setIsClosing(true);
    setErrorMessage("");

    try {
      await closeSupportConversation(selectedChatId);
      await loadConversations();
      await loadSummary();

      await Swal.fire({
        icon: "success",
        title: "Conversacion cerrada",
        text: "El historial sigue disponible en las conversaciones finalizadas.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible cerrar la conversacion.");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <AdminLayout title="Chat con clientes"
      subtitle="Atiende las conversaciones escaladas a soporte.">
      <div className="admin-chat-page">
        <div className="admin-chat-sidebar">
          <div className="admin-chat-sidebar-header">
            <h2>Conversaciones</h2>
            <p>Atiende las consultas escaladas por el asistente virtual.</p>

            <div className="admin-chat-summary" aria-label="Resumen de la bandeja">
              <span className="admin-chat-summary-item pending">
                Pendientes <strong>{summary.pendientes}</strong>
              </span>
              <span className="admin-chat-summary-item">
                Activas <strong>{summary.activas}</strong>
              </span>
              <span className="admin-chat-summary-item">
                Cerradas <strong>{summary.finalizadas}</strong>
              </span>
            </div>
          </div>

          <div className="admin-chat-filters">
            {STATE_FILTERS.map((filter) => (
              <button
                key={filter.label}
                type="button"
                className={stateFilter === filter.value ? "active" : ""}
                onClick={() => setStateFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {isLoadingConversations && (
            <p className="admin-chat-state">Cargando conversaciones...</p>
          )}

          {!isLoadingConversations && conversations.length === 0 && (
            <p className="admin-chat-state">
              No hay conversaciones para este filtro.
            </p>
          )}

          <div className="admin-chat-conversations">
            {conversations.map((conversation) => (
              <button
                key={conversation.idChat}
                className={`admin-chat-conversation ${
                  selectedChatId === conversation.idChat ? "active" : ""
                }`}
                onClick={() => setSelectedChatId(conversation.idChat)}
              >
                <div className="admin-chat-conversation-top">
                  <h3>{conversation.cliente || `Chat #${conversation.idChat}`}</h3>
                  <span>{formatMessageTime(conversation.fechaUltimoMensaje)}</span>
                </div>

                <p className="admin-chat-last-message">
                  {conversation.ultimoMensaje || "Sin mensajes"}
                </p>

                <div className="admin-chat-conversation-bottom">
                  <span
                    className={`admin-chat-status ${
                      conversation.estado === CHAT_STATES.ESCALATED
                        ? "online"
                        : "offline"
                    }`}
                  >
                    {conversation.estado}
                  </span>

                  {conversation.mensajesSinLeer > 0 && (
                    <span
                      className="admin-chat-unread"
                      title="Mensajes sin responder"
                    >
                      {conversation.mensajesSinLeer} sin leer
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-chat-main">
          {!selectedConversation && !isLoadingConversations && (
            <p className="admin-chat-state">
              Selecciona una conversacion para ver el detalle.
            </p>
          )}

          {selectedConversation && (
            <>
              <div className="admin-chat-main-header">
                <div>
                  <h2>{selectedConversation.cliente}</h2>
                  <p>
                    {selectedConversation.estado}
                    {selectedConversation.correoCliente
                      ? ` | ${selectedConversation.correoCliente}`
                      : ""}
                  </p>
                </div>

                {selectedConversation.estado !== CHAT_STATES.CLOSED && (
                  <button
                    type="button"
                    className="admin-chat-close-button"
                    onClick={handleCloseConversation}
                    disabled={isClosing}
                  >
                    {isClosing ? "Cerrando..." : "Cerrar conversacion"}
                  </button>
                )}
              </div>

              {errorMessage && (
                <p className="admin-chat-state error">{errorMessage}</p>
              )}

              <div className="admin-chat-messages">
                {isLoadingMessages && (
                  <p className="admin-chat-state">Cargando mensajes...</p>
                )}

                {!isLoadingMessages &&
                  messages.map((mensaje) => (
                    <div
                      key={mensaje.idMensaje}
                      className={`admin-chat-message ${getSenderClass(
                        mensaje.remitente
                      )}`}
                    >
                      <span className="admin-chat-message-sender">
                        {mensaje.remitente}
                        <time className="admin-chat-message-time">
                          {formatMessageTime(mensaje.fechaHora)}
                        </time>
                      </span>
                      {mensaje.mensaje}
                    </div>
                  ))}
              </div>

              <div className="admin-chat-input-area">
                <textarea
                  placeholder="Escribe una respuesta"
                  aria-label="Respuesta al cliente"
                  maxLength={1000}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  disabled={selectedConversation.estado === CHAT_STATES.CLOSED}
                />

                <button
                  className="admin-primary-button"
                  type="button"
                  onClick={handleSendReply}
                  disabled={
                    !replyText.trim() ||
                    isSending ||
                    selectedConversation.estado === CHAT_STATES.CLOSED
                  }
                >
                  {isSending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminChat;
