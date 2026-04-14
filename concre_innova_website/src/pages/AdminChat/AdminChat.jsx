import "./AdminChat.css";
import { useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminChat() {
  const conversations = [
    {
      id: 1,
      cliente: "María López",
      ultimoMensaje: "Hola, necesito saber si tienen maceteros grandes.",
      hora: "09:15",
      noLeidos: 2,
      estado: "En línea",
      mensajes: [
        { emisor: "cliente", texto: "Hola, necesito saber si tienen maceteros grandes." },
        { emisor: "admin", texto: "Hola María, sí contamos con varios modelos disponibles." },
        { emisor: "cliente", texto: "Perfecto, me gustaría ver opciones en color negro." }
      ]
    },
    {
      id: 2,
      cliente: "Carlos Herrera",
      ultimoMensaje: "¿Hacen envíos fuera del GAM?",
      hora: "10:40",
      noLeidos: 0,
      estado: "Desconectado",
      mensajes: [
        { emisor: "cliente", texto: "¿Hacen envíos fuera del GAM?" },
        { emisor: "admin", texto: "Sí, hacemos envíos a distintas zonas del país." }
      ]
    },
    {
      id: 3,
      cliente: "Ana Rodríguez",
      ultimoMensaje: "Quisiera cotizar una fuente decorativa.",
      hora: "11:05",
      noLeidos: 1,
      estado: "En línea",
      mensajes: [
        { emisor: "cliente", texto: "Quisiera cotizar una fuente decorativa." },
        { emisor: "admin", texto: "Con gusto. ¿Buscas una fuente pequeña, mediana o grande?" }
      ]
    }
  ];

  const [chatActivo, setChatActivo] = useState(conversations[0]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  return (
    <AdminLayout title="Chat Administrativo">
      <div className="admin-chat-page">
        <div className="admin-chat-sidebar">
          <div className="admin-chat-sidebar-header">
            <h2>Conversaciones</h2>
            <p>Atiende consultas de clientes en tiempo real.</p>
          </div>

          <div className="admin-chat-conversations">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`admin-chat-conversation ${
                  chatActivo.id === conversation.id ? "active" : ""
                }`}
                onClick={() => setChatActivo(conversation)}
              >
                <div className="admin-chat-conversation-top">
                  <h3>{conversation.cliente}</h3>
                  <span>{conversation.hora}</span>
                </div>

                <p className="admin-chat-last-message">{conversation.ultimoMensaje}</p>

                <div className="admin-chat-conversation-bottom">
                  <span
                    className={`admin-chat-status ${
                      conversation.estado === "En línea" ? "online" : "offline"
                    }`}
                  >
                    {conversation.estado}
                  </span>

                  {conversation.noLeidos > 0 && (
                    <span className="admin-chat-unread">{conversation.noLeidos}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-chat-main">
          <div className="admin-chat-main-header">
            <div>
              <h2>{chatActivo.cliente}</h2>
              <p>{chatActivo.estado}</p>
            </div>

            <button className="admin-secondary-button">Ver perfil</button>
          </div>

          <div className="admin-chat-messages">
            {chatActivo.mensajes.map((mensaje, index) => (
              <div
                key={index}
                className={`admin-chat-message ${
                  mensaje.emisor === "admin" ? "admin" : "cliente"
                }`}
              >
                {mensaje.texto}
              </div>
            ))}
          </div>

          <div className="admin-chat-input-area">
            <textarea
              placeholder="Escribe una respuesta"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
            />

            <button className="admin-primary-button">Enviar</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminChat;