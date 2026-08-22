import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import {
  getCatalogProducts,
  getProductImageCandidates,
} from "../../services/catalogService";
import { createQuotation } from "../../services/quotationService";
import { getCompanyInfo } from "../../services/empresaService";
import QuotationRequest from "./QuotationRequest";

jest.mock("../../services/quotationService", () => ({
  createQuotation: jest.fn(),
}));

jest.mock("../../services/catalogService", () => ({
  getCatalogProducts: jest.fn(),
  getProductImageCandidates: jest.fn(() => []),
}));

jest.mock("../../services/empresaService", () => ({
  getCompanyInfo: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getCatalogProducts.mockResolvedValue({
    items: [{ idProducto: 5, nombre: "Macetero terraza" }],
  });
  getCompanyInfo.mockResolvedValue({});
  getProductImageCandidates.mockReturnValue([]);
  URL.createObjectURL = jest.fn(() => "blob:reference-image");
  URL.revokeObjectURL = jest.fn();
});

async function advanceStep() {
  fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
  await waitFor(() => expect(Swal.fire).not.toHaveBeenCalled());
}

test("walks the three steps and submits the description and reference image", async () => {
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

  // Paso 1 -> 2
  await advanceStep();

  fireEvent.change(await screen.findByLabelText("Descripción"), {
    target: { value: "Macetero personalizado para terraza" },
  });
  fireEvent.change(screen.getByLabelText("Preferencias"), {
    target: { value: "Concreto gris y acabado mate" },
  });
  fireEvent.change(screen.getByLabelText("Adjuntar imagenes"), {
    target: { files: [referenceImage] },
  });

  // Paso 2 -> 3
  await advanceStep();

  fireEvent.click(await screen.findByRole("button", { name: /enviar solicitud/i }));

  await waitFor(() =>
    expect(createQuotation).toHaveBeenCalledWith({
      descripcion: "Macetero personalizado para terraza",
      preferencias: "Concreto gris y acabado mate",
      productos: [{ idProducto: 5, cantidad: 1 }],
      imagenes: [referenceImage],
    })
  );
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({
      icon: "success",
      title: "Solicitud recibida",
    })
  );
});

test("blocks the delivery data step until the project details are complete", async () => {
  Swal.fire.mockResolvedValue({});

  render(<QuotationRequest />);
  expect(
    await screen.findByRole("option", { name: "Macetero terraza" })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
  await screen.findByLabelText("Descripción");

  fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

  await waitFor(() =>
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Información requerida",
      })
    )
  );
  expect(createQuotation).not.toHaveBeenCalled();
});
