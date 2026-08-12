import { buildApiFileUrl, request } from "./apiClient";

export function createQuotation({
  descripcion,
  preferencias,
  productos,
  imagenes,
}) {
  const formData = new FormData();
  formData.append("descripcion", String(descripcion || "").trim());
  formData.append("preferencias", String(preferencias || "").trim());
  formData.append(
    "productosJson",
    JSON.stringify(Array.isArray(productos) ? productos : [])
  );

  (Array.isArray(imagenes) ? imagenes : []).forEach((imagen) => {
    formData.append("imagenes", imagen, imagen.name);
  });

  return request("/api/Cotizaciones", {
    method: "POST",
    body: formData,
  });
}

export function getMyQuotations({
  page = 1,
  pageSize = 10,
  search = "",
  status = "",
  signal,
} = {}) {
  const query = new URLSearchParams({
    pagina: String(page),
    tamanoPagina: String(pageSize),
  });
  const normalizedSearch = String(search || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (normalizedSearch) {
    query.set("busqueda", normalizedSearch);
  }

  if (normalizedStatus) {
    query.set("estado", normalizedStatus);
  }

  return request(`/api/Cotizaciones/mias?${query}`, {
    method: "GET",
    signal,
  });
}

export function decideQuotation(idCotizacion, decision) {
  return request(`/api/Cotizaciones/${Number(idCotizacion)}/decision`, {
    method: "POST",
    body: { decision },
  });
}

export function getAdminQuotations({
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
  onlyHandled = false,
  signal,
} = {}) {
  const query = new URLSearchParams({
    pagina: String(page),
    tamanoPagina: String(pageSize),
  });
  const normalizedSearch = String(search || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (normalizedSearch) {
    query.set("busqueda", normalizedSearch);
  }

  if (normalizedStatus) {
    query.set("estado", normalizedStatus);
  }

  if (onlyHandled) {
    query.set("soloGestionadas", "true");
  }

  return request(`/api/Cotizaciones/admin?${query}`, {
    method: "GET",
    signal,
  });
}

export function respondQuotation(idCotizacion, { respuesta, productos }) {
  return request(`/api/Cotizaciones/${Number(idCotizacion)}/respuesta`, {
    method: "PUT",
    body: {
      respuesta: String(respuesta || "").trim(),
      productos: Array.isArray(productos) ? productos : [],
    },
  });
}

export function resolveQuotation(idCotizacion, decision) {
  return request(
    `/api/Cotizaciones/${Number(idCotizacion)}/resolucion-vendedor`,
    {
      method: "POST",
      body: { decision },
    }
  );
}

export function convertQuotationToOrder(idCotizacion) {
  return request(`/api/Cotizaciones/${Number(idCotizacion)}/pedido`, {
    method: "POST",
  });
}

export function getQuotationImageUrl(relativePath) {
  return buildApiFileUrl(relativePath);
}
