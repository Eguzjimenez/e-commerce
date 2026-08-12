import "./AdminChat.css";
import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import {
  CHAT_SENDERS,
  CHAT_STATES,
  getSupportConversationMessages,
  getSupportConversations,
  replySupportConversation,
} from "../../services/chatService";

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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setErrorMessage("");

      try {
        const response = await getSupportConversations({
          estado: stateFilter,
          signal: controller.signal,
        });
        const nextConversations = Array.isArray(response) ? response : [];

        setConversations(nextConversations);
        setSelectedChatId(nextConversations[0]?.idChat ?? null);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setErrorMessage(
            error?.message || "No fue posible cargar las conversaciones."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingConversations(false);
        }
      }
    };

    loadConversations();
    return () => controller.abort();
  }, [stateFilter]);

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
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible enviar la respuesta.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout title="Chat Administrativo">
      <div className="admin-chat-page">
        <div className="admin-chat-sidebar">
          <div className="admin-chat-sidebar-header">
            <h2>Conversaciones</h2>
            <p>Atiende las consultas escaladas por el asistente virtual.</p>
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

                  {conversation.totalMensajes > 0 && (
                    <span className="admin-chat-unread">
                      {conversation.totalMensajes}
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
