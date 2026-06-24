import "./Chat.css";
import { useState } from "react";

function Chat() {
  const [messages, setMessages] = useState([
    { text: "Hola, en que puedo ayudarte?", type: "bot" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { text: input, type: "user" },
      { text: "Respuesta automatica", type: "bot" },
    ];

    setMessages(newMessages);
    setInput("");
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-header">
          <span>Soporte Concre Innova</span>
          <small>Atencion para productos, pedidos y cuidados</small>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>

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
