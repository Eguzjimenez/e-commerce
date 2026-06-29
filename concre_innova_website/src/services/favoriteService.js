import { request } from "./apiClient";

const FAVORITES_STORAGE_KEY = "concre_innova_favorites";
const AUTH_STORAGE_KEY = "concre_innova_auth";

function notifyFavoritesChanged() {
  window.dispatchEvent(new Event("favoriteschange"));
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

export function saveLocalFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  notifyFavoritesChanged();
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
  const favorites = await getFavorites();
  return favorites.map((favorite) => Number(favorite.idProducto));
}

export function getFavoriteCount() {
  return getLocalFavorites().length;
}

export async function getFavoriteCountAsync() {
  return (await getFavorites()).length;
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
      favorites: await getFavorites(),
      added: false,
    };
  }

  if (hasAuthenticatedUser()) {
    await request(`/api/Favoritos/${favoriteProduct.idProducto}`, { method: "POST" });
    const favorites = await getFavorites();
    notifyFavoritesChanged();
    return { favorites, added: true };
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
  saveLocalFavorites(nextFavorites);

  return {
    favorites: nextFavorites,
    added: true,
  };
}

export async function removeFavorite(idProducto) {
  if (hasAuthenticatedUser()) {
    await request(`/api/Favoritos/${idProducto}`, { method: "DELETE" });
    const favorites = await getFavorites();
    notifyFavoritesChanged();
    return favorites;
  }

  const nextFavorites = getLocalFavorites().filter(
    (favorite) => Number(favorite.idProducto) !== Number(idProducto)
  );
  saveLocalFavorites(nextFavorites);
  return nextFavorites;
}

export async function toggleFavorite(product) {
  const idProducto = Number(product?.idProducto ?? product?.id);
  const favorites = await getFavorites();
  const alreadySaved = favorites.some(
    (favorite) => Number(favorite.idProducto) === idProducto
  );

  if (alreadySaved) {
    const nextFavorites = await removeFavorite(idProducto);
    return {
      favorites: nextFavorites,
      isFavorite: false,
    };
  }

  const result = await addFavorite(product);
  return {
    favorites: result.favorites,
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
