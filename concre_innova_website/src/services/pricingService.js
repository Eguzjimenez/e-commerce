/**
 * Reglas de precio compartidas por el carrito, el checkout y el comprobante.
 *
 * Los precios del catálogo ya incluyen el impuesto, igual que el total que
 * registra la API (SUM(precio * cantidad)). Por eso el impuesto no se suma
 * sobre el total: se desglosa el que ya viene contenido en él, de modo que el
 * cliente vea cuánto paga de IVA sin que el monto a cobrar cambie.
 */
export const TASA_IVA = 0.13;

export function desglosarImpuesto(totalConImpuesto) {
  const total = Number(totalConImpuesto) || 0;

  if (total <= 0) {
    return { subtotal: 0, impuesto: 0, total: 0, tasa: TASA_IVA };
  }

  const subtotal = total / (1 + TASA_IVA);

  return {
    subtotal,
    impuesto: total - subtotal,
    total,
    tasa: TASA_IVA,
  };
}

export function formatearPorcentajeImpuesto(tasa = TASA_IVA) {
  return `${Math.round(tasa * 100)}%`;
}
