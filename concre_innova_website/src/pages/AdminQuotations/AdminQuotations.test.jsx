import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import { getCatalogProducts } from "../../services/catalogService";
import {
  convertQuotationToOrder,
  getAdminQuotations,
  resolveQuotation,
  respondQuotation,
} from "../../services/quotationService";
import AdminQuotations from "./AdminQuotations";

jest.mock("../../components/AdminLayout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../../services/catalogService", () => ({
  getCatalogProducts: jest.fn(),
}));

jest.mock("../../services/quotationService", () => ({
  convertQuotationToOrder: jest.fn(),
  getAdminQuotations: jest.fn(),
  getQuotationImageUrl: jest.fn((path) => path),
  resolveQuotation: jest.fn(),
  respondQuotation: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();

  getCatalogProducts.mockResolvedValue({
    items: [
      {
        idProducto: 1,
        nombre: "Maceta blanca",
        precio: 12500,
      },
    ],
  });
  getAdminQuotations.mockResolvedValue({
    items: [
      {
        idCotizacion: 12,
        numeroSeguimiento: "COT-0000000012",
        cliente: "Cliente QA",
        fechaSolicitud: "2026-07-23T08:00:00",
        fechaRespuesta: "2026-07-23T09:00:00",
        estado: "Aceptada",
        total: 25000,
        descripcion: "Maceteros para terraza",
        preferencias: "Acabado mate",
        respuesta: "Oferta disponible",
        productosSolicitados: [],
        imagenes: [],
        productos: [
          {
            idProducto: 1,
            nombre: "Maceta blanca",
            cantidad: 2,
            precioUnitario: 12500,
            subtotal: 25000,
          },
        ],
        historialEstados: [
          {
            estadoAnterior: "Respondida",
            estadoNuevo: "Aceptada",
            fechaCambio: "2026-07-23T10:00:00",
          },
        ],
      },
    ],
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  resolveQuotation.mockResolvedValue({
    exitoso: true,
    mensaje: "Cotizacion aprobada por ventas.",
    estado: "Aprobada",
    total: 25000,
  });
  convertQuotationToOrder.mockResolvedValue({
    exitoso: true,
    mensaje: "Cotizacion convertida en pedido correctamente.",
    estado: "Aprobada",
    total: 25000,
    idPedido: 31,
  });
  Swal.fire.mockResolvedValue({ isConfirmed: true });
});

test("allows sales staff to approve and convert an accepted quotation", async () => {
  render(<AdminQuotations />);

  fireEvent.click(
    await screen.findByRole("button", { name: "Aprobar cotizacion" })
  );

  await waitFor(() =>
    expect(resolveQuotation).toHaveBeenCalledWith(12, "Aprobar")
  );

  fireEvent.click(
    await screen.findByRole("button", { name: "Convertir en pedido" })
  );

  await waitFor(() =>
    expect(convertQuotationToOrder).toHaveBeenCalledWith(12)
  );
  expect(
    await screen.findByText("Pedido formal asociado: #31")
  ).toBeInTheDocument();
});

test("shows requested products and attached images for each received request", async () => {
  getAdminQuotations.mockResolvedValueOnce({
    items: [
      {
        idCotizacion: 15,
        numeroSeguimiento: "COT-0000000015",
        cliente: "Cliente Pendiente",
        fechaSolicitud: "2026-07-23T08:00:00",
        fechaRespuesta: null,
        estado: "Pendiente",
        total: 0,
        descripcion: "Dos maceteros para exterior",
        preferencias: "",
        respuesta: "",
        productosSolicitados: [
          { idProducto: 1, nombre: "Maceta blanca", cantidad: 2 },
        ],
        imagenes: [{ rutaArchivo: "images/cotizaciones/a.jpg" }],
        productos: [],
        historialEstados: [],
      },
    ],
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  render(<AdminQuotations />);

  expect(
    await screen.findByText("Productos solicitados: Maceta blanca x2")
  ).toBeInTheDocument();
  expect(screen.getByText("1 imagen(es) adjunta(s)")).toBeInTheDocument();
  expect(screen.getByText("COT-0000000015 | Solicitud: 23/7/2026")).toBeInTheDocument();
});

test("lists handled quotations in the attended history view", async () => {
  render(<AdminQuotations />);

  fireEvent.click(await screen.findByRole("tab", { name: "Historial" }));

  expect(
    await screen.findByText("Historial de cotizaciones atendidas")
  ).toBeInTheDocument();

  await waitFor(() =>
    expect(getAdminQuotations).toHaveBeenCalledWith(
      expect.objectContaining({ onlyHandled: true })
    )
  );

  const historyTable = screen.getByRole("table");
  expect(historyTable).toHaveTextContent("COT-0000000012");
  expect(historyTable).toHaveTextContent("Cliente QA");
  expect(historyTable).toHaveTextContent("Aceptada");
});

test("lists pending requests and sends the seller response with prices and conditions", async () => {
  getAdminQuotations.mockResolvedValueOnce({
    items: [
      {
        idCotizacion: 15,
        numeroSeguimiento: "COT-0000000015",
        cliente: "Cliente Pendiente",
        fechaSolicitud: "2026-07-23T08:00:00",
        fechaRespuesta: null,
        estado: "Pendiente",
        total: 0,
        descripcion: "Dos maceteros para exterior",
        preferencias: "Entrega durante agosto",
        respuesta: "",
        productosSolicitados: [
          {
            idProducto: 1,
            nombre: "Maceta blanca",
            cantidad: 2,
          },
        ],
        imagenes: [],
        productos: [],
        historialEstados: [],
      },
    ],
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  respondQuotation.mockResolvedValueOnce({
    exitoso: true,
    mensaje: "Cotizacion respondida correctamente.",
    estado: "Respondida",
    total: 25000,
  });

  render(<AdminQuotations />);

  expect(
    (await screen.findAllByText("Cliente Pendiente")).length
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText("Dos maceteros para exterior").length
  ).toBeGreaterThan(0);
  expect(
    document.querySelector(".quotation-status.pendiente")
  ).toHaveTextContent("Pendiente");

  fireEvent.change(screen.getByLabelText("Respuesta al cliente"), {
    target: {
      value: "Entrega en 10 dias. Oferta valida durante 30 dias.",
    },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar respuesta" })
  );

  await waitFor(() =>
    expect(respondQuotation).toHaveBeenCalledWith(15, {
      respuesta: "Entrega en 10 dias. Oferta valida durante 30 dias.",
      productos: [
        {
          idProducto: 1,
          cantidad: 2,
          precioUnitario: 12500,
        },
      ],
    })
  );
  await waitFor(() =>
    expect(
      document.querySelector(".quotation-status.respondida")
    ).toHaveTextContent("Respondida")
  );
});
