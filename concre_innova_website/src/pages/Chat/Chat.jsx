import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CHAT_SENDERS,
  CHAT_STATES,
  OPEN_CHAT_EVENT,
  endChatConversation,
  escalateChatToSupport,
  getChatConversation,
  sendChatMessage,
} from "../../services/chatService";
import { isLoggedIn } from "../../services/authService";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import { buildProductDetailRoute, PUBLIC_ROUTES } from "../../routes/routes";
import chatbotIcon from "./charla-de-robots.png";
import "./Chat.css";

// Con la conversacion escalada las respuestas llegan del personal de soporte,
// asi que el hilo se refresca periodicamente mientras el chat esta abierto.
const SUPPORT_REFRESH_INTERVAL_MS = 8000;

const WELCOME_MESSAGE = {
  id: "bienvenida",
  sender: CHAT_SENDERS.BOT,
  text: "!Hola! Soy el asistente virtual de ConcreInnova. En que puedo ayudarte?",
  productos: [],
};

const QUICK_QUESTIONS = [
  { label: "Metodos de pago", question: "Cuales son los métodos de pago?" },
  { label: "Como comprar?", question: "Como puedo comprar?" },
  { label: "Productos", question: "Que productos tienen?" },
  { label: "Contacto", question: "Como puedo contactarlos?" },
];

function mapApiMessage(message) {
  return {
    id: `api-${message.idMensaje}`,
    sender: message.remitente,
    text: message.mensaje,
    productos: [],
  };
}

function isClientMessage(message) {
  return message.sender === CHAT_SENDERS.CLIENT;
}

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationState, setConversationState] = useState(CHAT_STATES.OPEN);
  const [canEscalate, setCanEscalate] = useState(false);
  const [supportEnabled, setSupportEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const openAssistant = () => setIsOpen(true);

    window.addEventListener(OPEN_CHAT_EVENT, openAssistant);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openAssistant);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const loadStoredConversation = useCallback(async (signal) => {
    if (!isLoggedIn()) {
      return;
    }

    try {
      const conversation = await getChatConversation({ signal });
      const storedMessages = Array.isArray(conversation?.mensajes)
        ? conversation.mensajes
        : [];

      setSupportEnabled(Boolean(conversation?.soporteHumanoHabilitado));
      setConversationState(conversation?.estado || CHAT_STATES.OPEN);

      if (storedMessages.length > 0) {
        setMessages(storedMessages.map(mapApiMessage));
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setNotice("No fue posible recuperar la conversacion anterior.");
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const controller = new AbortController();
    loadStoredConversation(controller.signal);

    return () => controller.abort();
  }, [isOpen, loadStoredConversation]);

  useEffect(() => {
    if (!isOpen || conversationState !== CHAT_STATES.ESCALATED) {
      return undefined;
    }

    const controller = new AbortController();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadStoredConversation(controller.signal);
      }
    }, SUPPORT_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [isOpen, conversationState, loadStoredConversation]);

  const appendMessages = (newMessages) => {
    setMessages((previousMessages) => [...previousMessages, ...newMessages]);
  };

  const submitQuestion = async (question) => {
    const trimmedQuestion = String(question || "").trim();

    if (!trimmedQuestion || isSending) {
      return;
    }

    setIsSending(true);
    setNotice("");

    try {
      const response = await sendChatMessage(trimmedQuestion);

      appendMessages([
        {
          id: `cliente-${Date.now()}`,
          sender: CHAT_SENDERS.CLIENT,
          text: response?.mensajeUsuario?.mensaje || trimmedQuestion,
          productos: [],
        },
        {
          id: `bot-${Date.now() + 1}`,
          sender: CHAT_SENDERS.BOT,
          text: response?.mensajeBot?.mensaje || "",
          productos: Array.isArray(response?.productosRecomendados)
            ? response.productosRecomendados
            : [],
        },
      ]);

      setSupportEnabled(Boolean(response?.soporteHumanoHabilitado));
      setCanEscalate(Boolean(response?.sugiereEscalamiento));
    } catch (error) {
      setNotice(
        error?.message || "No fue posible enviar el mensaje. Intenta nuevamente."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    const messageToSend = input.trim();

    if (!messageToSend) {
      return;
    }

    setInput("");
    await submitQuestion(messageToSend);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleEscalate = async () => {
    if (!isLoggedIn()) {
      setNotice("Inicia sesión para que un agente continue tu conversacion.");
      return;
    }

    try {
      const result = await escalateChatToSupport();

      setConversationState(result?.estado || CHAT_STATES.ESCALATED);
      setCanEscalate(false);
      appendMessages([
        {
          id: `escalamiento-${Date.now()}`,
          sender: CHAT_SENDERS.BOT,
          text: result?.mensaje || "Tu consulta fue enviada al equipo de soporte.",
          productos: [],
        },
      ]);
    } catch (error) {
      setNotice(error?.message || "No fue posible escalar la conversacion.");
    }
  };

  const handleEndConversation = async () => {
    if (!isLoggedIn()) {
      setIsOpen(false);
      return;
    }

    try {
      const result = await endChatConversation();

      setConversationState(CHAT_STATES.CLOSED);
      setCanEscalate(false);
      appendMessages([
        {
          id: `cierre-${Date.now()}`,
          sender: CHAT_SENDERS.BOT,
          text: result?.mensaje || "Conversacion finalizada.",
          productos: [],
        },
      ]);
    } catch (error) {
      setNotice(error?.message || "No fue posible finalizar la conversacion.");
    }
  };

  const isConversationClosed = conversationState === CHAT_STATES.CLOSED;
  const isConversationEscalated = conversationState === CHAT_STATES.ESCALATED;
  const showQuickOptions = messages.length === 1 && !isConversationClosed;

  // El usuario puede pedir atencion humana en cualquier momento; el bot ademas la
  // destaca cuando no logro resolver la consulta.
  const showEscalateAction =
    supportEnabled && !isConversationClosed && !isConversationEscalated;

  return (
    <>
      {!isOpen && (
        <button
          className="chatbot-button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asistente"
          title="Abrir chatbot"
        >
          <img src={chatbotIcon} alt="Chatbot" className="chatbot-icon" />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar" aria-hidden="true">
                <img src={chatbotIcon} alt="" className="chatbot-icon" />
              </div>

              <div>
                <h3>ConcreInnova</h3>
                <span>
                  {conversationState === CHAT_STATES.ESCALATED
                    ? "Atención de soporte"
                    : "Asistente virtual"}
                </span>
              </div>
            </div>

            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  isClientMessage(message) ? "user-message" : "bot-message"
                }`}
              >
                {!isClientMessage(message) && (
                  <div className="message-avatar" aria-hidden="true">
                    <img src={chatbotIcon} alt="" className="chatbot-icon" />
                  </div>
                )}

                <div className="message-content">
                  {message.text}

                  {message.productos?.length > 0 && (
                    <div className="chatbot-recommendations">
                      <span className="chatbot-recommendations-title">
                        Productos que podrian interesarte
                      </span>

                      {message.productos.map((product) => (
                        <Link
                          className="chatbot-recommendation"
                          key={product.idProducto}
                          to={buildProductDetailRoute(product.idProducto)}
                          onClick={() => setIsOpen(false)}
                        >
                          <strong>{product.nombre}</strong>
                          <span>{formatCatalogPrice(product.precio)}</span>
                        </Link>
                      ))}

                      <Link
                        className="chatbot-recommendations-link"
                        to={PUBLIC_ROUTES.CATALOG}
                        onClick={() => setIsOpen(false)}
                      >
                        Ver el catálogo completo
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {showQuickOptions && (
              <div className="quick-options">
                {QUICK_QUESTIONS.map((quickQuestion) => (
                  <button
                    key={quickQuestion.label}
                    type="button"
                    onClick={() => submitQuestion(quickQuestion.question)}
                    disabled={isSending}
                  >
                    {quickQuestion.label}
                  </button>
                ))}
              </div>
            )}

            {notice && (
              <p className="chatbot-notice" role="status">
                {notice}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-actions">
            {showEscalateAction && (
              <button
                type="button"
                className={canEscalate ? "chatbot-action-highlight" : ""}
                onClick={handleEscalate}
              >
                Hablar con un agente
              </button>
            )}

            {!isConversationClosed && (
              <button type="button" onClick={handleEndConversation}>
                Finalizar conversacion
              </button>
            )}
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              aria-label="Mensaje para el asistente"
              placeholder={
                isConversationClosed
                  ? "Conversacion finalizada"
                  : "Escribe tu pregunta..."
              }
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || isConversationClosed}
            />

            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isSending || isConversationClosed}
            >
              {isSending ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
