import { request } from "./apiClient";

export const CONSULTA_ESTADOS = {
  NUEVO: "Nuevo",
  RESPONDIDO: "Respondido",
};

export const CONSULTAS_PAGE_SIZE = 10;

export async function getConsultas({
  estado = "",
  pagina = 1,
  tamanoPagina = CONSULTAS_PAGE_SIZE,
  signal,
} = {}) {
  const query = new URLSearchParams({
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
  });

  const estadoNormalizado = String(estado || "").trim();
  if (estadoNormalizado) {
    query.set("estado", estadoNormalizado);
  }

  return request(`/api/Consultas?${query.toString()}`, { method: "GET", signal });
}

export async function responderConsulta(idConsulta, respuesta) {
  return request(`/api/Consultas/${Number(idConsulta)}/respuesta`, {
    method: "POST",
    body: { respuesta: String(respuesta || "").trim() },
  });
}
