import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import { getCatalogProducts } from "../../services/catalogService";
import { createQuotation } from "../../services/quotationService";
import QuotationRequest from "./QuotationRequest";

jest.mock("../../services/quotationService", () => ({
  createQuotation: jest.fn(),
}));

jest.mock("../../services/catalogService", () => ({
  getCatalogProducts: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getCatalogProducts.mockResolvedValue({
    items: [{ idProducto: 5, nombre: "Macetero terraza" }],
  });
  URL.createObjectURL = jest.fn(() => "blob:reference-image");
  URL.revokeObjectURL = jest.fn();
});

test("submits the description and selected reference image", async () => {
  createQuotation.mockResolvedValue({
    exitoso: true,
    idCotizacion: 24,
    numeroSeguimiento: "COT-0000000024",
    cantidadImagenes: 1,
  });
  Swal.fire.mockResolvedValue({});
  const referenceImage = new File(["image-content"], "terraza.png", {
    type: "image/png",
  });

  render(<QuotationRequest />);

  expect(
    await screen.findByRole("option", { name: "Macetero terraza" })
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Descripcion"), {
    target: { value: "Macetero personalizado para terraza" },
  });
  fireEvent.change(screen.getByLabelText("Preferencias"), {
    target: { value: "Concreto gris y acabado mate" },
  });
  fireEvent.change(screen.getByLabelText("Adjuntar imagenes"), {
    target: { files: [referenceImage] },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar solicitud" })
  );

  await waitFor(() =>
    expect(createQuotation).toHaveBeenCalledWith({
      descripcion: "Macetero personalizado para terraza",
      preferencias: "Concreto gris y acabado mate",
      productos: [{ idProducto: 5, cantidad: 1 }],
      imagenes: [referenceImage],
    })
  );
  expect(
    await screen.findByText(
      "Solicitud COT-0000000024 recibida y lista para procesarse."
    )
  ).toBeInTheDocument();
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({
      icon: "success",
      title: "Solicitud recibida",
    })
  );
});
