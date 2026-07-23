import { request } from "./apiClient";

function normalizeOrderItems(items) {
  const groupedItems = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const idProducto = Number(item?.idProducto);
    const cantidad = Math.max(1, Number(item?.cantidad) || 1);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      return;
    }

    groupedItems.set(idProducto, (groupedItems.get(idProducto) || 0) + cantidad);
  });

  return Array.from(groupedItems.entries()).map(([idProducto, cantidad]) => ({
    idProducto,
    cantidad,
  }));
}

export async function validateCartStock(items) {
  const normalizedItems = normalizeOrderItems(items);

  return request("/api/Carrito/validar-stock", {
    method: "POST",
    body: { items: normalizedItems },
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

  console.log("registerOrder payload:", payload);

  return request("/api/Carrito/registrar-pedido", {
    method: "POST",
    body: payload,
  });
}

export async function getMyOrders() {
  return request("/api/Carrito/mis-pedidos", {
    method: "GET",
  });
}

export async function prepareOrderReorder(idPedido) {
  return request(`/api/Carrito/mis-pedidos/${Number(idPedido)}/recompra`, {
    method: "POST",
  });
}

export async function getAdminOrders({
  busqueda = "",
  estado = "",
  fechaDesde = "",
  fechaHasta = "",
  pagina = 1,
  tamanoPagina = 10,
} = {}) {
  const query = new URLSearchParams();

  if (busqueda) {
    query.set("busqueda", busqueda);
  }

  if (estado) {
    query.set("estado", estado);
  }

  if (fechaDesde) {
    query.set("fechaDesde", fechaDesde);
  }

  if (fechaHasta) {
    query.set("fechaHasta", fechaHasta);
  }

  query.set("pagina", pagina);
  query.set("tamanoPagina", tamanoPagina);

  return request(`/api/Pedidos?${query.toString()}`, {
    method: "GET",
  });
}

export async function getAdminOrderDetail(idPedido) {
  return request(`/api/Pedidos/${Number(idPedido)}`, {
    method: "GET",
  });
}

export async function updateOrderStatus(idPedido, nuevoEstado) {
  return request(`/api/Pedidos/${Number(idPedido)}/estado`, {
    method: "PUT",
    body: {
      idPedido: Number(idPedido),
      nuevoEstado,
    },
  });
}

export async function cancelOrder(idPedido) {
  return request(`/api/Pedidos/${Number(idPedido)}/cancelar`, {
    method: "PUT",
  });
}
