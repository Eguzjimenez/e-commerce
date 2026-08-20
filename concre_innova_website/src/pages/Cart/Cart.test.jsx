import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import { validateCartStock } from "../../services/orderService";
import Cart from "./Cart";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: () => ({ pathname: "/cart" }),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

jest.mock("../../services/authService", () => ({
  isLoggedIn: jest.fn(() => true),
}));

jest.mock("../../services/catalogService", () => ({
  getProductImageCandidates: jest.fn(() => []),
}));

jest.mock("../../services/orderService", () => ({
  isStockItemUnavailable: jest.fn(
    (stockItem) => stockItem?.estado !== "DISPONIBLE"
  ),
  validateCartStock: jest.fn(),
}));

const CART_ITEM = {
  idProducto: 1,
  idVariante: 10,
  nombre: "Maceta",
  descripcion: "Maceta decorativa",
  precio: 12500,
  imagen: "",
  nombreVariante: "Grande",
  tamano: "30cm",
  material: "Ceramica",
  color: "Blanco",
  cantidad: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("concre_innova_cart", JSON.stringify([CART_ITEM]));
  Swal.fire.mockResolvedValue({ isConfirmed: false });
  validateCartStock.mockResolvedValue({
    todoDisponible: true,
    subtotal: 12500,
    items: [
      {
        idProducto: 1,
        idVariante: 10,
        cantidadSolicitada: 1,
        stockDisponible: 5,
        precioUnitario: 12500,
        subtotal: 12500,
        estado: "DISPONIBLE",
      },
    ],
  });
});

test("validates stock before increasing quantity and recalculates totals", async () => {
  validateCartStock
    .mockResolvedValueOnce({
      todoDisponible: true,
      subtotal: 12500,
      items: [
        {
          idProducto: 1,
          idVariante: 10,
          cantidadSolicitada: 1,
          stockDisponible: 5,
          precioUnitario: 12500,
          subtotal: 12500,
          estado: "DISPONIBLE",
        },
      ],
    })
    .mockResolvedValue({
    todoDisponible: true,
    subtotal: 25000,
    items: [
      {
        idProducto: 1,
        idVariante: 10,
        cantidadSolicitada: 2,
        stockDisponible: 5,
        precioUnitario: 12500,
        subtotal: 25000,
        estado: "DISPONIBLE",
      },
    ],
  });

  render(<Cart />);

  fireEvent.click(
    screen.getByRole("button", {
      name: "Aumentar cantidad de Maceta",
    })
  );

  await waitFor(() => {
    expect(validateCartStock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          idProducto: 1,
          idVariante: 10,
          cantidad: 2,
        }),
      ]
    );
    expect(screen.getByLabelText("Cantidad de Maceta")).toHaveValue(2);
    expect(screen.getByText("1 producto(s) · 2 unidad(es)")).toBeInTheDocument();
  });
});

test("asks for confirmation before removing a cart item", async () => {
  Swal.fire
    .mockResolvedValueOnce({ isConfirmed: true })
    .mockResolvedValueOnce({});

  render(<Cart />);

  fireEvent.click(
    screen.getByRole("button", {
      name: "Eliminar Maceta del carrito",
    })
  );

  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({
      icon: "question",
      title: "Eliminar producto",
      showCancelButton: true,
    })
  );

  expect(await screen.findByText("Tu carrito está vacío.")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("concre_innova_cart"))).toEqual([]);
});

test("rejects decimal quantities without changing the cart", async () => {
  render(<Cart />);

  fireEvent.change(screen.getByLabelText("Cantidad de Maceta"), {
    target: { value: "1.5" },
  });

  await waitFor(() => {
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Cantidad inválida",
      })
    );
  });

  expect(validateCartStock).not.toHaveBeenCalledWith(
    [
      expect.objectContaining({
        cantidad: 1.5,
      }),
    ]
  );
  expect(screen.getByLabelText("Cantidad de Maceta")).toHaveValue(1);
  expect(JSON.parse(localStorage.getItem("concre_innova_cart"))[0].cantidad).toBe(
    1
  );
});

test("shows the authoritative subtotal after automatic stock validation", async () => {
  validateCartStock.mockResolvedValue({
    todoDisponible: true,
    subtotal: 13000,
    items: [
      {
        idProducto: 1,
        idVariante: 10,
        cantidadSolicitada: 1,
        stockDisponible: 5,
        precioUnitario: 13000,
        subtotal: 13000,
        estado: "DISPONIBLE",
      },
    ],
  });

  render(<Cart />);

  expect(
    await screen.findByText("Todos los productos tienen stock disponible.")
  ).toBeInTheDocument();
  // El monto validado por la API es ahora el total a pagar; subtotal e IVA son
  // el desglose de ese mismo importe.
  expect(screen.getByText("Total a pagar").parentElement).toHaveTextContent(/₡13\s000/);
  expect(screen.getByText("Subtotal")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ir a pagar" })).toBeEnabled();
});
