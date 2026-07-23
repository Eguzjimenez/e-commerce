import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import { addToCart } from "../../services/cartService";
import {
  getMyOrders,
  prepareOrderReorder,
} from "../../services/orderService";
import History from "./History";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("../../services/orderService", () => ({
  getMyOrders: jest.fn(),
  prepareOrderReorder: jest.fn(),
}));

jest.mock("../../services/cartService", () => ({
  addToCart: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

const ORDER = {
  idPedido: 27,
  fechaPedido: "2026-07-20T10:30:00",
  estado: "Pendiente",
  direccionEntrega: "Naranjo, Alajuela",
  metodoPago: "Tarjeta",
  estadoPago: "Pendiente",
  total: 25000,
  detalle: [
    {
      idDetallePedido: 91,
      idProducto: 1,
      idVariante: 4,
      nombre: "Maceta",
      nombreVariante: "Grande",
      tamano: "30cm",
      material: "Ceramica",
      color: "Blanco",
      cantidad: 2,
      precioUnitario: 12500,
      subtotal: 25000,
    },
  ],
};

function renderHistory() {
  return render(<History />);
}

beforeEach(() => {
  jest.clearAllMocks();
  getMyOrders.mockResolvedValue({ exitoso: true, pedidos: [ORDER] });
  Swal.fire.mockResolvedValue({ isConfirmed: false });
});

test("filters the order history by the selected date range", async () => {
  const { container } = renderHistory();

  expect(await screen.findByText("Pedido #27")).toBeInTheDocument();
  expect(container.querySelector(".history-state")).toHaveClass(
    "history-state--pending"
  );

  fireEvent.change(screen.getByLabelText("Desde"), {
    target: { value: "2026-07-01" },
  });
  fireEvent.change(screen.getByLabelText("Hasta"), {
    target: { value: "2026-07-31" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));

  await waitFor(() => {
    expect(getMyOrders).toHaveBeenLastCalledWith({
      fechaDesde: "2026-07-01",
      fechaHasta: "2026-07-31",
    });
  });
});

test("adds available order items to the cart when reordering", async () => {
  prepareOrderReorder.mockResolvedValue({
    exitoso: true,
    items: [
      {
        idProducto: 1,
        idVariante: 4,
        nombre: "Maceta",
        nombreVariante: "Grande",
        tamano: "30cm",
        material: "Ceramica",
        color: "Blanco",
        precio: 13000,
        cantidad: 2,
        disponible: true,
      },
    ],
  });

  renderHistory();
  fireEvent.click(
    await screen.findByRole("button", { name: "Volver a comprar" })
  );

  await waitFor(() => {
    expect(prepareOrderReorder).toHaveBeenCalledWith(27);
    expect(addToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        idProducto: 1,
        idVariante: 4,
        nombre: "Maceta - Grande",
        tamano: "30cm",
        material: "Ceramica",
        color: "Blanco",
        precio: 13000,
      }),
      2
    );
  });
});
