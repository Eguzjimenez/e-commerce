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
});

test("validates stock before increasing quantity and recalculates totals", async () => {
  validateCartStock.mockResolvedValue({
    todoDisponible: true,
    items: [
      {
        idProducto: 1,
        cantidadSolicitada: 2,
        stockDisponible: 5,
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
    expect(validateCartStock).toHaveBeenCalledWith([
      expect.objectContaining({
        idProducto: 1,
        idVariante: 10,
        cantidad: 2,
      }),
    ]);
    expect(screen.getByLabelText("Cantidad de Maceta")).toHaveValue(2);
    expect(screen.getByText("Unidades: 2")).toBeInTheDocument();
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

  expect(await screen.findByText("Tu carrito esta vacio.")).toBeInTheDocument();
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
        title: "Cantidad invalida",
      })
    );
  });

  expect(validateCartStock).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Cantidad de Maceta")).toHaveValue(1);
  expect(JSON.parse(localStorage.getItem("concre_innova_cart"))[0].cantidad).toBe(
    1
  );
});
