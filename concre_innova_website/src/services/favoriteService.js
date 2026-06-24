const FAVORITES_STORAGE_KEY = "concre_innova_favorites";

function notifyFavoritesChanged() {
  window.dispatchEvent(new Event("favoriteschange"));
}

function normalizeFavoriteProduct(product) {
  const idProducto = Number(product?.idProducto ?? product?.id);

  if (!idProducto) {
    return null;
  }

  return {
    idProducto,
    nombre: product.nombre ?? product.name ?? "Producto",
    descripcion: product.descripcion ?? product.description ?? "",
    precio: Number(product.precio ?? product.price) || 0,
    imagen: product.imagen ?? product.imageName ?? product.img ?? "",
  };
}

export function getFavorites() {
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

export function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  notifyFavoritesChanged();
}

export function getFavoriteProductIds() {
  return getFavorites().map((favorite) => Number(favorite.idProducto));
}

export function getFavoriteCount() {
  return getFavorites().length;
}

export function isFavoriteProduct(idProducto) {
  return getFavorites().some(
    (favorite) => Number(favorite.idProducto) === Number(idProducto)
  );
}

export function addFavorite(product) {
  const favoriteProduct = normalizeFavoriteProduct(product);

  if (!favoriteProduct) {
    return {
      favorites: getFavorites(),
      added: false,
    };
  }

  const favorites = getFavorites();
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
  saveFavorites(nextFavorites);

  return {
    favorites: nextFavorites,
    added: true,
  };
}

export function removeFavorite(idProducto) {
  const nextFavorites = getFavorites().filter(
    (favorite) => Number(favorite.idProducto) !== Number(idProducto)
  );
  saveFavorites(nextFavorites);
  return nextFavorites;
}

export function toggleFavorite(product) {
  const idProducto = Number(product?.idProducto ?? product?.id);

  if (isFavoriteProduct(idProducto)) {
    const favorites = removeFavorite(idProducto);
    return {
      favorites,
      isFavorite: false,
    };
  }

  const result = addFavorite(product);
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
