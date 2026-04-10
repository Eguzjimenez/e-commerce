import "./Chat.css";
import { useState } from "react";

function Chat() {
  const [messages, setMessages] = useState([
    { text: "Hola 👋 ¿En qué puedo ayudarte?", type: "bot" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { text: input, type: "user" },
      { text: "Respuesta automática 🤖", type: "bot" }
    ];

    setMessages(newMessages);
    setInput("");
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">

        <div className="chat-header">
          🌿 Soporte Concre Innova
        </div>

        {/* MENSAJES */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="chat-input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>

      </div>
    </div>
  );
}

export default Chat;