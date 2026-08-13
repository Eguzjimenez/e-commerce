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

/**
 * Deja constancia en bitacora de un acceso rechazado por las guardas de ruta.
 * Es informativo: si falla, la navegacion continua sin interrumpir al usuario.
 */
export async function reportDeniedAccess(ruta) {
  try {
    await request("/api/Bitacora/acceso-denegado", {
      method: "POST",
      body: { ruta },
    });
  } catch {
    // El registro es complementario y no debe afectar la navegacion.
  }
}

export async function registerBitacora({ idUsuario, tablaAfectada, operacion, descripcion }) {
  return await request("/api/Bitacora/Register", {
    method: "POST",
    body: { idUsuario, tablaAfectada, operacion, descripcion },
  });
}
