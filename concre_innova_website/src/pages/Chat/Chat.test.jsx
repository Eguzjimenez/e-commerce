import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  endChatConversation,
  escalateChatToSupport,
  getChatConversation,
  sendChatMessage,
} from "../../services/chatService";
import { isLoggedIn } from "../../services/authService";
import ChatBot from "./Chat";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={typeof to === "string" ? to : "#"} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

jest.mock("../../services/chatService", () => ({
  ...jest.requireActual("../../services/chatService"),
  endChatConversation: jest.fn(),
  escalateChatToSupport: jest.fn(),
  getChatConversation: jest.fn(),
  sendChatMessage: jest.fn(),
}));

jest.mock("../../services/authService", () => ({
  isLoggedIn: jest.fn(),
}));

function buildBotResponse(overrides = {}) {
  return {
    exitoso: true,
    idChat: 4,
    estado: "Abierto",
    mensajeUsuario: { idMensaje: 1, remitente: "Cliente", mensaje: "hola" },
    mensajeBot: { idMensaje: 2, remitente: "Bot", mensaje: "Respuesta del bot." },
    productosRecomendados: [],
    sugiereEscalamiento: false,
    soporteHumanoHabilitado: true,
    conversacionRegistrada: true,
    ...overrides,
  };
}

async function openAssistant() {
  render(<ChatBot />);
  fireEvent.click(await screen.findByRole("button", { name: "Abrir asistente" }));
}

beforeEach(() => {
  jest.clearAllMocks();
  isLoggedIn.mockReturnValue(true);
  getChatConversation.mockResolvedValue({
    idChat: 4,
    estado: "Abierto",
    soporteHumanoHabilitado: true,
    mensajes: [],
  });
  sendChatMessage.mockResolvedValue(buildBotResponse());
  escalateChatToSupport.mockResolvedValue({
    exitoso: true,
    estado: "Escalado",
    mensaje: "Tu consulta fue enviada a nuestro equipo de soporte.",
  });
  endChatConversation.mockResolvedValue({
    exitoso: true,
    estado: "Finalizado",
    mensaje: "Conversacion finalizada. Gracias por escribirnos.",
  });
});

test("sends the written message and shows the bot answer", async () => {
  await openAssistant();

  fireEvent.change(screen.getByPlaceholderText("Escribe tu pregunta..."), {
    target: { value: "Cuales son los metodos de pago?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

  await waitFor(() =>
    expect(sendChatMessage).toHaveBeenCalledWith("Cuales son los metodos de pago?")
  );

  expect(await screen.findByText("hola")).toBeInTheDocument();
  expect(screen.getByText("Respuesta del bot.")).toBeInTheDocument();
});

test("recovers the stored conversation when the assistant is opened", async () => {
  getChatConversation.mockResolvedValueOnce({
    idChat: 4,
    estado: "Abierto",
    soporteHumanoHabilitado: true,
    mensajes: [
      { idMensaje: 10, remitente: "Cliente", mensaje: "Consulta anterior" },
      { idMensaje: 11, remitente: "Bot", mensaje: "Respuesta anterior" },
    ],
  });

  await openAssistant();

  expect(await screen.findByText("Consulta anterior")).toBeInTheDocument();
  expect(screen.getByText("Respuesta anterior")).toBeInTheDocument();
});

test("shows the products recommended by the bot", async () => {
  sendChatMessage.mockResolvedValueOnce(
    buildBotResponse({
      mensajeBot: {
        idMensaje: 2,
        remitente: "Bot",
        mensaje: "Estos productos podrian servirte.",
      },
      productosRecomendados: [
        { idProducto: 1, nombre: "Maceta Ceramica Blanca 20cm", precio: 12500 },
        { idProducto: 4, nombre: "Maceta Ovalada Blanca", precio: 18000 },
      ],
    })
  );

  await openAssistant();

  fireEvent.change(screen.getByPlaceholderText("Escribe tu pregunta..."), {
    target: { value: "que maceteros tienen?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

  expect(
    await screen.findByText("Productos que podrian interesarte")
  ).toBeInTheDocument();
  expect(screen.getByText("Maceta Ceramica Blanca 20cm")).toBeInTheDocument();
  expect(screen.getByText("Maceta Ovalada Blanca")).toBeInTheDocument();
});

test("offers escalation when the bot cannot resolve the query", async () => {
  sendChatMessage.mockResolvedValueOnce(
    buildBotResponse({
      mensajeBot: {
        idMensaje: 2,
        remitente: "Bot",
        mensaje: "No estoy seguro de como responder esa pregunta.",
      },
      sugiereEscalamiento: true,
    })
  );

  await openAssistant();

  fireEvent.change(screen.getByPlaceholderText("Escribe tu pregunta..."), {
    target: { value: "mi factura tiene un cobro incorrecto" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

  fireEvent.click(
    await screen.findByRole("button", { name: "Hablar con un agente" })
  );

  await waitFor(() => expect(escalateChatToSupport).toHaveBeenCalled());

  expect(
    await screen.findByText("Tu consulta fue enviada a nuestro equipo de soporte.")
  ).toBeInTheDocument();
  expect(screen.getByText("Atencion de soporte")).toBeInTheDocument();
});

test("hides escalation when human support is disabled", async () => {
  sendChatMessage.mockResolvedValueOnce(
    buildBotResponse({
      sugiereEscalamiento: true,
      soporteHumanoHabilitado: false,
    })
  );

  await openAssistant();

  fireEvent.change(screen.getByPlaceholderText("Escribe tu pregunta..."), {
    target: { value: "necesito ayuda especial" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

  await waitFor(() => expect(sendChatMessage).toHaveBeenCalled());

  expect(
    screen.queryByRole("button", { name: "Hablar con un agente" })
  ).not.toBeInTheDocument();
});

test("ends the conversation and blocks further writing", async () => {
  await openAssistant();

  fireEvent.click(
    await screen.findByRole("button", { name: "Finalizar conversacion" })
  );

  await waitFor(() => expect(endChatConversation).toHaveBeenCalled());

  expect(
    await screen.findByText("Conversacion finalizada. Gracias por escribirnos.")
  ).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Conversacion finalizada")).toBeDisabled();
});
