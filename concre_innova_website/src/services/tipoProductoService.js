import { request } from "./apiClient";

export async function getTiposProductoAdministracion() {
  return await request("/api/TiposProducto/administracion", { method: "GET" });
}

export async function createTipoProducto(tipoProducto) {
  return await request("/api/TiposProducto", {
    method: "POST",
    body: tipoProducto,
  });
}

export async function updateTipoProducto(idTipo, tipoProducto) {
  return await request(`/api/TiposProducto/${idTipo}`, {
    method: "PUT",
    body: tipoProducto,
  });
}

export async function deleteTipoProducto(idTipo) {
  return await request(`/api/TiposProducto/${idTipo}`, {
    method: "DELETE",
  });
}
