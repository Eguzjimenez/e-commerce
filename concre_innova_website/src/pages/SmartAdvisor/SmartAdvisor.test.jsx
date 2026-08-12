import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import {
  clearAdvisorAnswers,
  generateAdvisorRecommendations,
  getAdvisorQuestionnaire,
} from "../../services/advisorService";
import { isLoggedIn } from "../../services/authService";
import { addToCart } from "../../services/cartService";
import SmartAdvisor from "./SmartAdvisor";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("../../services/advisorService", () => ({
  ...jest.requireActual("../../services/advisorService"),
  clearAdvisorAnswers: jest.fn(),
  generateAdvisorRecommendations: jest.fn(),
  getAdvisorQuestionnaire: jest.fn(),
}));

jest.mock("../../services/authService", () => ({
  isLoggedIn: jest.fn(),
}));

jest.mock("../../services/cartService", () => ({
  addToCart: jest.fn(),
  getCartCount: jest.fn(() => 0),
  getCartSubtotal: jest.fn(() => 0),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

const QUESTIONNAIRE = {
  preguntas: [
    {
      idPregunta: 1,
      codigo: "espacio",
      texto: "Donde vas a colocar tus plantas o maceteros?",
      ayuda: "El tipo de espacio define las condiciones ambientales.",
      orden: 1,
      opciones: [
        { idOpcion: 6, idPregunta: 1, codigo: "interior", etiqueta: "Interior" },
        { idOpcion: 5, idPregunta: 1, codigo: "exterior", etiqueta: "Exterior" },
      ],
    },
    {
      idPregunta: 3,
      codigo: "luz",
      texto: "Cuanta luz natural recibe ese espacio?",
      ayuda: "",
      orden: 2,
      opciones: [
        { idOpcion: 2, idPregunta: 3, codigo: "baja", etiqueta: "Luz baja" },
        { idOpcion: 1, idPregunta: 3, codigo: "alta", etiqueta: "Luz alta" },
      ],
    },
  ],
};

const RECOMMENDATIONS = {
  exitoso: true,
  mensaje: "Recomendaciones generadas correctamente.",
  respuestasGuardadas: true,
  grupos: [
    {
      clasificacion: "Planta",
      productos: [
        {
          idProducto: 12,
          nombre: "Sansevieria",
          descripcion: "Lengua de suegra facil de cuidar",
          precio: 12000,
          imagen: "sansevieria.jpg",
          nombreCategoria: "Plantas Interior",
        },
      ],
    },
    {
      clasificacion: "Macetero",
      productos: [
        {
          idProducto: 2,
          nombre: "Maceta Minimalista Negra",
          descripcion: "Diseno moderno color negro",
          precio: 14500,
          imagen: "maceta_negra.jpg",
          nombreCategoria: "Macetas Interior",
        },
      ],
    },
  ],
};

async function completeQuestionnaire() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Iniciar cuestionario" })
  );

  fireEvent.click(screen.getByRole("radio", { name: /Interior/ }));
  fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
  fireEvent.click(screen.getByRole("radio", { name: /Luz baja/ }));
  fireEvent.click(
    screen.getByRole("button", { name: /Obtener Recomendaciones/ })
  );

  await screen.findByText("Tus recomendaciones");
}

beforeEach(() => {
  jest.clearAllMocks();
  getAdvisorQuestionnaire.mockResolvedValue(QUESTIONNAIRE);
  generateAdvisorRecommendations.mockResolvedValue(RECOMMENDATIONS);
  clearAdvisorAnswers.mockResolvedValue({ codigo: 1 });
  isLoggedIn.mockReturnValue(true);
  Swal.fire.mockResolvedValue({ isConfirmed: false });
});

test("shows the welcome screen before starting the questionnaire", async () => {
  render(<SmartAdvisor />);

  expect(
    await screen.findByText("Bienvenido a tu asesoria personalizada")
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Iniciar cuestionario" })
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Donde vas a colocar tus plantas o maceteros?")
  ).not.toBeInTheDocument();
});

test("generates recommendations with every questionnaire answer", async () => {
  render(<SmartAdvisor />);
  await completeQuestionnaire();

  await waitFor(() =>
    expect(generateAdvisorRecommendations).toHaveBeenCalledWith([
      { idPregunta: 1, idOpcion: 6 },
      { idPregunta: 3, idOpcion: 2 },
    ])
  );

  expect(await screen.findByText("Plantas recomendadas")).toBeInTheDocument();
  expect(screen.getByText("Maceteros recomendados")).toBeInTheDocument();
  expect(screen.getByText("Sansevieria")).toBeInTheDocument();
  expect(screen.getByText("Maceta Minimalista Negra")).toBeInTheDocument();
});

test("keeps the recommendation button disabled until the questionnaire is complete", async () => {
  render(<SmartAdvisor />);

  fireEvent.click(
    await screen.findByRole("button", { name: "Iniciar cuestionario" })
  );
  fireEvent.click(screen.getByRole("radio", { name: /Interior/ }));
  fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

  expect(
    screen.getByRole("button", { name: /Obtener Recomendaciones/ })
  ).toBeDisabled();
});

test("adds a recommended product to the cart", async () => {
  render(<SmartAdvisor />);
  await completeQuestionnaire();

  fireEvent.click(
    screen.getAllByRole("button", { name: /Agregar al carrito/ })[0]
  );

  await waitFor(() =>
    expect(addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ idProducto: 12, nombre: "Sansevieria" }),
      1
    )
  );
});

test("restarts the questionnaire and clears the stored answers", async () => {
  render(<SmartAdvisor />);
  await completeQuestionnaire();

  fireEvent.click(
    screen.getByRole("button", { name: /Reiniciar Cuestionario/ })
  );

  await waitFor(() => expect(clearAdvisorAnswers).toHaveBeenCalled());

  expect(
    screen.getByText("Donde vas a colocar tus plantas o maceteros?")
  ).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Interior/ })).not.toBeChecked();
  expect(screen.queryByText("Sansevieria")).not.toBeInTheDocument();
});
