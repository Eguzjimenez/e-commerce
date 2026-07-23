import { request } from "./apiClient";

function normalizeOrderItems(items) {
  const groupedItems = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const idProducto = Number(item?.idProducto);
    const parsedVariantId = Number(item?.idVariante);
    const idVariante =
      Number.isInteger(parsedVariantId) && parsedVariantId > 0
        ? parsedVariantId
        : null;
    const cantidad = Math.max(1, Number(item?.cantidad) || 1);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      return;
    }

    const itemKey = `${idProducto}:${idVariante || 0}`;
    const existingItem = groupedItems.get(itemKey);

    if (existingItem) {
      existingItem.cantidad += cantidad;
      return;
    }

    groupedItems.set(itemKey, {
      idProducto,
      idVariante,
      nombreVariante: String(item?.nombreVariante || "").trim(),
      tamano: String(item?.tamano || "").trim(),
      material: String(item?.material || "").trim(),
      color: String(item?.color || "").trim(),
      cantidad,
    });
  });

  return Array.from(groupedItems.values());
}

export function isStockItemUnavailable(stockItem) {
  const requestedQuantity = Number(stockItem?.cantidadSolicitada) || 0;
  const availableStock = Number(stockItem?.stockDisponible) || 0;
  const status = String(stockItem?.estado || "").toLowerCase();

  if (requestedQuantity > availableStock) {
    return true;
  }

  return [
    "sin",
    "agotado",
    "insuficiente",
    "no disponible",
    "no_disponible",
  ].some((term) => status.includes(term));
}

export async function validateCartStock(items, { signal } = {}) {
  const normalizedItems = normalizeOrderItems(items);

  return request("/api/Carrito/validar-stock", {
    method: "POST",
    body: { items: normalizedItems },
    signal,
  });
}

export async function registerOrder({ idUsuario, direccionEntrega, metodoPago, items }) {
  const normalizedItems = normalizeOrderItems(items);
  const payload = {
    idUsuario: Number(idUsuario),
    direccionEntrega: String(direccionEntrega || "").trim(),
    metodoPago: String(metodoPago || "").trim(),
    items: normalizedItems,
  };

  return request("/api/Carrito/registrar-pedido", {
    method: "POST",
    body: payload,
  });
}

export async function getMyOrders({ fechaDesde = "", fechaHasta = "" } = {}) {
  const query = new URLSearchParams();

  if (fechaDesde) {
    query.set("fechaDesde", fechaDesde);
  }

  if (fechaHasta) {
    query.set("fechaHasta", fechaHasta);
  }

  const queryString = query.toString();
  const endpoint = `/api/Carrito/mis-pedidos${queryString ? `?${queryString}` : ""}`;

  return request(endpoint, {
    method: "GET",
  });
}

export async function prepareOrderReorder(idPedido) {
  return request(`/api/Carrito/mis-pedidos/${Number(idPedido)}/recompra`, {
    method: "POST",
  });
}
