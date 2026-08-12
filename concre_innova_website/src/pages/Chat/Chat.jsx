import { useState, useRef, useEffect } from "react";
import { getBotResponse } from "./chatbotResponses";
import chatbotIcon from "./charla-de-robots.png";
import "./Chat.css";

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "!Hola! Soy el asistente virtual de ConcreInnova. En que puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);

    const botResponse = getBotResponse(input);

    setInput("");

    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: botResponse,
      };

      setMessages((previousMessages) => [...previousMessages, botMessage]);
    }, 500);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const sendQuickMessage = (message) => {
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);

    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: getBotResponse(message),
      };

      setMessages((previousMessages) => [...previousMessages, botMessage]);
    }, 500);
  };

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
                <span>Asistente virtual</span>
              </div>
            </div>

            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}
              >
                {message.sender === "bot" && (
                  <div className="message-avatar" aria-hidden="true">
                    <img src={chatbotIcon} alt="" className="chatbot-icon" />
                  </div>
                )}

                <div className="message-content">{message.text}</div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="quick-options">
                <button onClick={() => sendQuickMessage("Cuales son los metodos de pago?")}>
                  Metodos de pago
                </button>

                <button onClick={() => sendQuickMessage("Como puedo comprar?")}>
                  Como comprar?
                </button>

                <button onClick={() => sendQuickMessage("Que productos tienen?")}>
                  Productos
                </button>

                <button onClick={() => sendQuickMessage("Como puedo contactarlos?")}>
                  Contacto
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button onClick={sendMessage} disabled={!input.trim()}>
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
