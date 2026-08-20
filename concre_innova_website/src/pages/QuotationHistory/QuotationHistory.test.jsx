import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import {
  decideQuotation,
  getMyQuotations,
} from "../../services/quotationService";
import QuotationHistory from "./QuotationHistory";

jest.mock("../../services/quotationService", () => ({
  decideQuotation: jest.fn(),
  getMyQuotations: jest.fn(),
  getQuotationImageUrl: jest.fn((path) => path),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("accepts a responded quotation and sends it to seller review", async () => {
  getMyQuotations.mockResolvedValue({
    items: [
      {
        idCotizacion: 6,
        numeroSeguimiento: "COT-0000000006",
        fechaSolicitud: "2026-07-23T10:00:00",
        estado: "Respondida",
        total: 25000,
        descripcion: "Maceteros para terraza",
        preferencias: "Acabado mate",
        respuesta: "Oferta disponible",
        productos: [
          {
            idProducto: 1,
            nombre: "Maceta blanca",
            cantidad: 2,
            precioUnitario: 12500,
            subtotal: 25000,
          },
        ],
        productosSolicitados: [
          {
            idProducto: 1,
            nombre: "Maceta blanca",
            cantidad: 2,
          },
        ],
        imagenes: [],
        historialEstados: [
          {
            estadoAnterior: null,
            estadoNuevo: "Pendiente",
            fechaCambio: "2026-07-23T10:00:00",
          },
          {
            estadoAnterior: "Pendiente",
            estadoNuevo: "Respondida",
            fechaCambio: "2026-07-23T11:00:00",
          },
        ],
      },
    ],
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  decideQuotation.mockResolvedValue({
    exitoso: true,
    mensaje: "Cotizacion aceptada y enviada a revision de ventas.",
    estado: "Aceptada",
    total: 25000,
    idPedido: null,
  });
  Swal.fire
    .mockResolvedValueOnce({ isConfirmed: true })
    .mockResolvedValueOnce({});

  render(<QuotationHistory />);

  expect(await screen.findAllByText("COT-0000000006")).toHaveLength(2);
  expect(screen.getByText("Preferencias solicitadas")).toBeInTheDocument();
  expect(screen.getByText("Cantidad: 2")).toBeInTheDocument();
  expect(screen.getByText("Historial de estados")).toBeInTheDocument();
  expect(screen.getByText("Cambio desde Pendiente")).toBeInTheDocument();

  fireEvent.click(
    await screen.findByRole("button", { name: "Aceptar cotización" })
  );

  await waitFor(() =>
    expect(decideQuotation).toHaveBeenCalledWith(6, "Aceptar")
  );
  expect(screen.queryByText(/Pedido asociado:/)).not.toBeInTheDocument();
  expect(screen.getAllByText("Aceptada").length).toBeGreaterThanOrEqual(3);
});

test("applies search and status filters only after submitting", async () => {
  getMyQuotations.mockResolvedValue({
    items: [],
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  render(<QuotationHistory />);

  await waitFor(() => expect(getMyQuotations).toHaveBeenCalledTimes(1));

  fireEvent.change(screen.getByLabelText("Buscar cotizaciones"), {
    target: { value: "Macetero" },
  });
  fireEvent.change(screen.getByLabelText("Estado"), {
    target: { value: "Respondida" },
  });

  expect(getMyQuotations).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

  await waitFor(() =>
    expect(getMyQuotations).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        search: "Macetero",
        status: "Respondida",
      })
    )
  );
});
