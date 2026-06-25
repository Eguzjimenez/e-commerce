import { API_BASE_URL, request } from "./apiClient";

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

async function requestWithFallback(paths, queryParams = {}) {
  let lastError = null;
  const queryString = buildQueryString(queryParams);

  for (const path of paths) {
    try {
      return await request(`${path}${queryString}`, { method: "GET" });
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

export async function getCatalogProducts(options = {}) {
  return await requestWithFallback([
    "/api/Productos",
    "/api/Catalogo/productos",
  ], {
    busqueda: options.searchTerm,
    ordenarPor: options.sortBy,
    direccionOrden: options.sortDirection,
    idCategoria: options.categoryId,
    precioMinimo: options.minPrice,
    precioMaximo: options.maxPrice,
    disponibilidad: options.availability,
    tamano: options.size,
    material: options.material,
    tipo: options.type,
  });
}

export async function getCatalogProductById(idProducto) {
  try {
    return await request(`/api/Productos/${idProducto}`, { method: "GET" });
  } catch (error) {
    if (![404, 405].includes(error?.status)) {
      throw error;
    }

    const products = await getCatalogProducts();
    return (Array.isArray(products) ? products : []).find(
      (product) => Number(product.idProducto ?? product.id) === Number(idProducto)
    ) || null;
  }
}

export async function getRelatedCatalogProducts(idProducto, limit = 4) {
  return await requestWithFallback([
    `/api/Productos/${idProducto}/relacionados`,
    `/api/Catalogo/productos/${idProducto}/relacionados`,
  ], {
    limite: limit,
  });
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
