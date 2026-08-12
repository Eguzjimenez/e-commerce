import { buildApiFileUrl, request } from "./apiClient";

export function getSpaceImageUrl(relativePath) {
  return buildApiFileUrl(relativePath);
}

export function uploadSpaceImage(archivo) {
  const formData = new FormData();
  formData.append("imagen", archivo, archivo.name);

  return request("/api/Visualizaciones/imagen-espacio", {
    method: "POST",
    body: formData,
  });
}

export function saveVisualization({
  idVisualizacion = null,
  nombre,
  rutaImagenEspacio,
  anchoLienzo,
  altoLienzo,
  productos,
}) {
  return request("/api/Visualizaciones", {
    method: "POST",
    body: {
      idVisualizacion,
      nombre: String(nombre || "").trim(),
      rutaImagenEspacio,
      anchoLienzo: Math.round(Number(anchoLienzo) || 0),
      altoLienzo: Math.round(Number(altoLienzo) || 0),
      productos: Array.isArray(productos) ? productos : [],
    },
  });
}

export function getMyVisualizations({ signal } = {}) {
  return request("/api/Visualizaciones", {
    method: "GET",
    signal,
  });
}

export function getVisualization(idVisualizacion, { signal } = {}) {
  return request(`/api/Visualizaciones/${Number(idVisualizacion)}`, {
    method: "GET",
    signal,
  });
}

export function deleteVisualization(idVisualizacion) {
  return request(`/api/Visualizaciones/${Number(idVisualizacion)}`, {
    method: "DELETE",
  });
}
