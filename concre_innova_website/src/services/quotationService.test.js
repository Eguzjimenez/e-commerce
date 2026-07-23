import { request } from "./apiClient";
import {
  convertQuotationToOrder,
  createQuotation,
  decideQuotation,
  getAdminQuotations,
  getMyQuotations,
  resolveQuotation,
  respondQuotation,
} from "./quotationService";

jest.mock("./apiClient", () => ({
  API_BASE_URL: "http://localhost:5222",
  request: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("sends the quotation description and reference images as multipart data", async () => {
  request.mockResolvedValue({
    exitoso: true,
    idCotizacion: 8,
    cantidadImagenes: 1,
  });
  const image = new File(["image"], "referencia.png", {
    type: "image/png",
  });

  await createQuotation({
    descripcion: "  Macetero para terraza  ",
    preferencias: "  Acabado mate  ",
    productos: [{ idProducto: 3, cantidad: 2 }],
    imagenes: [image],
  });

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones",
    expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
    })
  );

  const body = request.mock.calls[0][1].body;
  expect(body.get("descripcion")).toBe("Macetero para terraza");
  expect(body.get("preferencias")).toBe("Acabado mate");
  expect(JSON.parse(body.get("productosJson"))).toEqual([
    { idProducto: 3, cantidad: 2 },
  ]);
  expect(body.getAll("imagenes")).toHaveLength(1);
  expect(body.get("imagenes").name).toBe("referencia.png");
});

test("requests the authenticated quotation history with pagination", async () => {
  request.mockResolvedValue({ items: [], totalItems: 0 });

  await getMyQuotations({ page: 2, pageSize: 10 });

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/mias?pagina=2&tamanoPagina=10",
    expect.objectContaining({ method: "GET" })
  );
});

test("sends quotation search and status filters only when provided", async () => {
  request.mockResolvedValue({ items: [], totalItems: 0 });

  await getMyQuotations({
    page: 1,
    pageSize: 10,
    search: "  COT-0000000006  ",
    status: "Respondida",
  });

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/mias?pagina=1&tamanoPagina=10&busqueda=COT-0000000006&estado=Respondida",
    expect.objectContaining({ method: "GET" })
  );
});

test("sends the customer quotation decision", async () => {
  request.mockResolvedValue({ exitoso: true, estado: "Aceptada" });

  await decideQuotation(7, "Aceptar");

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/7/decision",
    {
      method: "POST",
      body: { decision: "Aceptar" },
    }
  );
});

test("sends the administrative quotation response", async () => {
  request.mockResolvedValue({ exitoso: true, estado: "Respondida" });

  await respondQuotation(9, {
    respuesta: "  Oferta disponible  ",
    productos: [{ idProducto: 1, cantidad: 2, precioUnitario: 5000 }],
  });

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/9/respuesta",
    {
      method: "PUT",
      body: {
        respuesta: "Oferta disponible",
        productos: [{ idProducto: 1, cantidad: 2, precioUnitario: 5000 }],
      },
    }
  );
});

test("sends the seller quotation approval decision", async () => {
  request.mockResolvedValue({ exitoso: true, estado: "Aprobada" });

  await resolveQuotation(9, "Aprobar");

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/9/resolucion-vendedor",
    {
      method: "POST",
      body: { decision: "Aprobar" },
    }
  );
});

test("converts an approved quotation into an order", async () => {
  request.mockResolvedValue({ exitoso: true, idPedido: 14 });

  await convertQuotationToOrder(9);

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/9/pedido",
    { method: "POST" }
  );
});

test("requests paginated quotations for administrators", async () => {
  request.mockResolvedValue({ items: [], totalItems: 0 });

  await getAdminQuotations({ page: 3, pageSize: 20 });

  expect(request).toHaveBeenCalledWith(
    "/api/Cotizaciones/admin?pagina=3&tamanoPagina=20",
    expect.objectContaining({ method: "GET" })
  );
});
