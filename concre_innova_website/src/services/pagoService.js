import { request } from "./apiClient";

export const COMPROBANTE_MAX_BYTES = 5 * 1024 * 1024;
export const COMPROBANTE_FORMATOS = [".jpg", ".jpeg", ".png", ".webp"];
export const COMPROBANTE_REFERENCIA_MIN = 4;
export const COMPROBANTE_REFERENCIA_MAX = 100;

/**
 * Registra la referencia del pago y, cuando el metodo lo exige, el comprobante
 * de la transferencia. La API valida la propiedad del pedido y la obligatoriedad
 * del adjunto, asi que aqui solo se prepara el envio.
 */
export async function registrarComprobantePago({ idPedido, referencia, comprobante }) {
  const formData = new FormData();

  formData.append("IdPedido", String(Number(idPedido)));
  formData.append("Referencia", String(referencia || "").trim());

  if (comprobante) {
    formData.append("Comprobante", comprobante);
  }

  return await request("/api/Pagos/comprobante", {
    method: "POST",
    body: formData,
  });
}

export function validarComprobante(archivo) {
  if (!archivo) {
    return "Adjunta la imagen del comprobante de la transferencia.";
  }

  if (archivo.size > COMPROBANTE_MAX_BYTES) {
    return "El comprobante no puede superar los 5 MB.";
  }

  const nombre = String(archivo.name || "").toLowerCase();
  const formatoValido = COMPROBANTE_FORMATOS.some((extension) =>
    nombre.endsWith(extension)
  );

  return formatoValido ? "" : "El comprobante debe ser una imagen JPG, PNG o WEBP.";
}

export function validarReferencia(referencia) {
  const valor = String(referencia || "").trim();

  if (valor.length < COMPROBANTE_REFERENCIA_MIN) {
    return "Ingresa el número de referencia del pago.";
  }

  return valor.length <= COMPROBANTE_REFERENCIA_MAX
    ? ""
    : `La referencia no puede superar ${COMPROBANTE_REFERENCIA_MAX} caracteres.`;
}
