import { request } from "./apiClient";

const FAVORITES_STORAGE_KEY = "concre_innova_favorites";
const AUTH_STORAGE_KEY = "concre_innova_auth";

function notifyFavoritesChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent("favoriteschange", { detail }));
}

function hasAuthenticatedUser() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    return Boolean(auth?.codigo === 1 && auth?.idUsuario && auth?.idRol !== 4 && auth?.token);
  } catch {
    return false;
  }
}

function normalizeFavoriteProduct(product) {
  const idProducto = Number(product?.idProducto ?? product?.id);

  if (!idProducto) {
    return null;
  }

  return {
    ...product,
    idProducto,
    nombre: product.nombre ?? product.name ?? "Producto",
    descripcion: product.descripcion ?? product.description ?? "",
    precio: Number(product.precio ?? product.price) || 0,
    imagen: product.imagen ?? product.imageName ?? product.img ?? "",
  };
}

export function getLocalFavorites() {
  try {
    const rawFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const favorites = rawFavorites ? JSON.parse(rawFavorites) : [];
    return Array.isArray(favorites)
      ? favorites.map(normalizeFavoriteProduct).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function saveLocalFavorites(favorites, detail = {}) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  notifyFavoritesChanged(detail);
}

export async function getFavorites() {
  if (!hasAuthenticatedUser()) {
    return getLocalFavorites();
  }

  const favorites = await request("/api/Favoritos", { method: "GET" });
  return Array.isArray(favorites)
    ? favorites.map(normalizeFavoriteProduct).filter(Boolean)
    : [];
}

export function getFavoriteProductIds() {
  return getLocalFavorites().map((favorite) => Number(favorite.idProducto));
}

export async function getFavoriteProductIdsAsync() {
  if (hasAuthenticatedUser()) {
    const favoriteIds = await request("/api/Favoritos/ids", { method: "GET" });
    return Array.isArray(favoriteIds)
      ? favoriteIds.map((idProducto) => Number(idProducto)).filter(Boolean)
      : [];
  }

  const favorites = await getFavorites();
  return favorites.map((favorite) => Number(favorite.idProducto));
}

export function getFavoriteCount() {
  return getLocalFavorites().length;
}

export async function getFavoriteCountAsync() {
  if (!hasAuthenticatedUser()) {
    return getFavoriteCount();
  }

  const response = await request("/api/Favoritos/count", { method: "GET" });
  return Number(response?.count) || 0;
}

export function isFavoriteProduct(idProducto) {
  return getLocalFavorites().some(
    (favorite) => Number(favorite.idProducto) === Number(idProducto)
  );
}

export async function addFavorite(product) {
  const favoriteProduct = normalizeFavoriteProduct(product);

  if (!favoriteProduct) {
    return {
      favorites: hasAuthenticatedUser() ? null : getLocalFavorites(),
      added: false,
    };
  }

  if (hasAuthenticatedUser()) {
    const response = await request(`/api/Favoritos/${favoriteProduct.idProducto}`, { method: "POST" });
    notifyFavoritesChanged({
      idProducto: favoriteProduct.idProducto,
      isFavorite: true,
    });

    return {
      favorite: favoriteProduct,
      favorites: null,
      added: true,
      response,
    };
  }

  const favorites = getLocalFavorites();
  const alreadySaved = favorites.some(
    (favorite) => Number(favorite.idProducto) === favoriteProduct.idProducto
  );

  if (alreadySaved) {
    return {
      favorites,
      added: false,
    };
  }

  const nextFavorites = [...favorites, favoriteProduct];
  saveLocalFavorites(nextFavorites, {
    idProducto: favoriteProduct.idProducto,
    isFavorite: true,
  });

  return {
    favorite: favoriteProduct,
    favorites: nextFavorites,
    added: true,
  };
}

export async function removeFavorite(idProducto) {
  const normalizedProductId = Number(idProducto);

  if (hasAuthenticatedUser()) {
    await request(`/api/Favoritos/${normalizedProductId}`, { method: "DELETE" });
    notifyFavoritesChanged({
      idProducto: normalizedProductId,
      isFavorite: false,
    });

    return {
      favorites: null,
      idProducto: normalizedProductId,
      removed: true,
    };
  }

  const nextFavorites = getLocalFavorites().filter(
    (favorite) => Number(favorite.idProducto) !== normalizedProductId
  );
  saveLocalFavorites(nextFavorites, {
    idProducto: normalizedProductId,
    isFavorite: false,
  });

  return {
    favorites: nextFavorites,
    idProducto: normalizedProductId,
    removed: true,
  };
}

export async function toggleFavorite(product) {
  const idProducto = Number(product?.idProducto ?? product?.id);
  const favoriteIds = await getFavoriteProductIdsAsync();
  const alreadySaved = favoriteIds.some((favoriteId) => favoriteId === idProducto);

  if (alreadySaved) {
    const result = await removeFavorite(idProducto);
    return {
      ...result,
      isFavorite: false,
    };
  }

  const result = await addFavorite(product);
  return {
    ...result,
    isFavorite: true,
  };
}

export function mergeFavoritesWithCatalog(favorites, catalogProducts) {
  const productsById = new Map(
    (Array.isArray(catalogProducts) ? catalogProducts : [])
      .map((product) => [Number(product.idProducto ?? product.id), product])
      .filter(([idProducto]) => Boolean(idProducto))
  );

  return (Array.isArray(favorites) ? favorites : []).map((favorite) => {
    const currentProduct = productsById.get(Number(favorite.idProducto));
    return normalizeFavoriteProduct(currentProduct || favorite);
  }).filter(Boolean);
}
