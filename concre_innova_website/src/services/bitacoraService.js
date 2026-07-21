import { request } from "./apiClient";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value).trim());
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getBitacora(options = {}) {
  const queryString = buildQueryString({
    pagina: options.page,
    tamanoPagina: options.pageSize,
    busqueda: options.searchTerm,
    operacion: options.operation,
  });

  return await request(`/api/Bitacora/List${queryString}`);
}

export async function registerBitacora({ idUsuario, tablaAfectada, operacion, descripcion }) {
  return await request("/api/Bitacora/Register", {
    method: "POST",
    body: { idUsuario, tablaAfectada, operacion, descripcion },
  });
}
