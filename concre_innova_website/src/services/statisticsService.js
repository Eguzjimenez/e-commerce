import { request } from "./apiClient";

export async function getStatisticsSummary() {
  return request("/api/Estadisticas/resumen", { method: "GET" });
}

export async function getFrequentClients(top = 10) {
  return request(`/api/Estadisticas/clientes-frecuentes?top=${Number(top)}`, {
    method: "GET",
  });
}

export async function getCategoryStatistics() {
  return request("/api/Estadisticas/categorias", { method: "GET" });
}

export async function getTopProducts(top = 5) {
  return request(`/api/Estadisticas/productos-destacados?top=${Number(top)}`, {
    method: "GET",
  });
}
