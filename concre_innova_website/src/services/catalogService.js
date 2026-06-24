import { API_BASE_URL, request } from "./apiClient";

async function requestWithFallback(paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      return await request(path, { method: "GET" });
    } catch (error) {
      lastError = error;

      if (error?.status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("No se encontraron endpoints disponibles.");
}

export async function getCatalogProducts() {
  return await requestWithFallback([
    "/api/Productos",
    "/api/Catalogo/productos",
  ]);
}

export async function getCatalogCategories() {
  return await requestWithFallback([
    "/api/Categorias",
    "/api/Categoria",
    "/api/Catalogo/categorias",
  ]);
}

export function getProductImageCandidates(imageName) {
  if (!imageName) {
    return [];
  }

  if (/^https?:\/\//i.test(imageName)) {
    return [imageName];
  }

  const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedImageName = String(imageName).replace(/^\/+/, "");
  const configuredImagePath = (process.env.REACT_APP_PRODUCT_IMAGE_PATH || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  // Si el backend ya devuelve ruta relativa (ej: "images/x.jpg"), usarla tal cual.
  if (normalizedImageName.includes("/")) {
    return [`${normalizedBaseUrl}/${normalizedImageName}`];
  }

  const configuredCandidate = configuredImagePath
    ? `${normalizedBaseUrl}/${configuredImagePath}/${normalizedImageName}`
    : null;

  // Sin ruta configurada, evita probar carpetas al azar para no disparar muchos 404.
  return [configuredCandidate].filter(Boolean);
}
