import IMAGEN from "../img/Maceta-Negra.jpg";
import { getProductImageCandidates } from "./catalogService";

export const PRODUCT_SORT_OPTIONS = {
  NONE: "",
  PRICE_ASC: "price-asc",
  PRICE_DESC: "price-desc",
};

export function normalizeCatalogCategories(categories) {
  return (Array.isArray(categories) ? categories : [])
    .map((category) => ({
      id: String(category.idCategoria ?? category.id ?? ""),
      name: category.nombreCategoria ?? category.nombre ?? "Sin nombre",
    }))
    .filter((category) => category.id);
}

export function getCatalogProductId(product) {
  return Number(product?.idProducto ?? product?.id);
}

export function formatCatalogPrice(price) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

export function getCatalogProductStock(product) {
  return Number(product.stock ?? product.cantidadDisponible ?? product.existencia ?? 0);
}

export function getCatalogProductAvailabilityText(product) {
  if (product.disponibilidad) {
    return product.disponibilidad;
  }

  const stock = getCatalogProductStock(product);

  if (Number.isNaN(stock)) {
    return "Disponibilidad no indicada";
  }

  if (stock <= 0) {
    return "Agotado";
  }

  return `${stock} disponibles`;
}

export function getCatalogProductAvailabilityClass(product) {
  const stock = getCatalogProductStock(product);
  const availability = String(getCatalogProductAvailabilityText(product)).trim().toLowerCase();

  if (availability.includes("agotad") || stock === 0) {
    return "catalog-stock--out";
  }

  if (availability.includes("disponible") && stock > 5) {
    return "catalog-stock--in";
  }

  return "catalog-stock--low";
}

export function getCatalogProductCategoryName(product, categories) {
  const productCategoryId = String(product.idCategoria ?? "");
  return (
    product.nombreCategoria ||
    categories.find((category) => category.id === productCategoryId)?.name ||
    "Producto"
  );
}

export function getCatalogProductImage(product) {
  return getProductImageCandidates(product.imagen)[0] || IMAGEN;
}

export function handleCatalogImageCandidateFallback(event, imageCandidates) {
  const imageElement = event.currentTarget;
  const currentIndex = Number(imageElement.dataset.candidateIndex || 0);
  const nextIndex = currentIndex + 1;

  if (nextIndex < imageCandidates.length) {
    imageElement.dataset.candidateIndex = String(nextIndex);
    imageElement.src = imageCandidates[nextIndex];
    return;
  }

  imageElement.onerror = null;
  imageElement.src = IMAGEN;
}

export function handleCatalogImageFallback(event, imageName) {
  handleCatalogImageCandidateFallback(event, getProductImageCandidates(imageName));
}

export function buildCatalogModalProduct(product) {
  const imageCandidates = getProductImageCandidates(product.imagen);

  return {
    idProducto: product.idProducto,
    name: product.nombre,
    nombre: product.nombre,
    price: Number(product.precio) || 0,
    precio: Number(product.precio) || 0,
    img: imageCandidates[0] || IMAGEN,
    images: imageCandidates.length ? [...imageCandidates, IMAGEN] : [IMAGEN],
    description: product.descripcion,
    descripcion: product.descripcion,
    imagen: product.imagen,
    imageName: product.imagen,
    availability: getCatalogProductAvailabilityText(product),
    stock: getCatalogProductStock(product),
  };
}

export function buildAdminProductViewModel(product, categories) {
  const id = getCatalogProductId(product);
  const categoryId = String(product.idCategoria ?? "");
  const categoryName = getCatalogProductCategoryName(product, categories);
  const stock = getCatalogProductStock(product);
  const imageCandidates = getProductImageCandidates(product.imagen);

  return {
    id,
    idProducto: id,
    name: product.nombre ?? "Producto sin nombre",
    nombre: product.nombre ?? "",
    descripcion: product.descripcion ?? "",
    price: Number(product.precio) || 0,
    precio: Number(product.precio) || 0,
    category: categoryName === "Producto" ? "Sin categoria" : categoryName,
    categoryId,
    idCategoria: categoryId,
    stock,
    cantidadDisponible: stock,
    minStock: Number(product.cantidadMinima ?? 0),
    cantidadMinima: Number(product.cantidadMinima ?? 0),
    status: product.estado || (stock > 0 ? "Activo" : "Inactivo"),
    estado: product.estado || (stock > 0 ? "Activo" : "Inactivo"),
    imagen: product.imagen ?? "",
    image: imageCandidates[0] || IMAGEN,
    imageCandidates,
  };
}

export function getCatalogQueryOptions(searchTerm, sortOrder) {
  const options = {
    searchTerm: searchTerm.trim(),
  };

  if (sortOrder === PRODUCT_SORT_OPTIONS.PRICE_ASC) {
    options.sortBy = "precio";
    options.sortDirection = "asc";
  }

  if (sortOrder === PRODUCT_SORT_OPTIONS.PRICE_DESC) {
    options.sortBy = "precio";
    options.sortDirection = "desc";
  }

  return options;
}

export function filterAndSortCatalogProducts(products, filters) {
  const {
    searchTerm,
    selectedCategoryId,
    selectedMinPrice,
    selectedMaxPrice,
    selectedSortOrder,
  } = filters;
  const term = searchTerm.trim().toLowerCase();
  const min = Number(selectedMinPrice);
  const max = Number(selectedMaxPrice);
  const hasMinPrice = !Number.isNaN(min);
  const hasMaxPrice = !Number.isNaN(max);

  const filteredProducts = (Array.isArray(products) ? products : []).filter((product) => {
    const categoryId = String(product.idCategoria ?? "");
    const matchesCategory =
      selectedCategoryId === "all" || categoryId === selectedCategoryId;
    const productPrice = Number(product.precio) || 0;
    const matchesMinPrice = !hasMinPrice || productPrice >= min;
    const matchesMaxPrice = !hasMaxPrice || productPrice <= max;

    if (!matchesCategory || !matchesMinPrice || !matchesMaxPrice) {
      return false;
    }

    if (!term) {
      return true;
    }

    const searchableText = [
      product.nombre,
      product.descripcion,
      product.nombreCategoria,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(term);
  });

  if (selectedSortOrder === PRODUCT_SORT_OPTIONS.PRICE_ASC) {
    return [...filteredProducts].sort((first, second) =>
      (Number(first.precio) || 0) - (Number(second.precio) || 0)
    );
  }

  if (selectedSortOrder === PRODUCT_SORT_OPTIONS.PRICE_DESC) {
    return [...filteredProducts].sort((first, second) =>
      (Number(second.precio) || 0) - (Number(first.precio) || 0)
    );
  }

  return filteredProducts;
}

export function filterAdminProductViewModels(products, searchTerm, selectedCategory) {
  const term = searchTerm.trim().toLowerCase();

  return (Array.isArray(products) ? products : []).filter((product) => {
    const matchesSearch = !term || product.name.toLowerCase().includes(term);
    const matchesCategory =
      selectedCategory === "Todas" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
}

export function getProductFormValidation(productForm) {
  if (!productForm.nombre.trim()) {
    return {
      title: "Nombre requerido",
      text: "Ingresa el nombre del producto.",
    };
  }

  if (!productForm.idCategoria) {
    return {
      title: "Categoria requerida",
      text: "Selecciona una categoria.",
    };
  }

  if (!productForm.imagen.trim()) {
    return {
      title: "Imagen requerida",
      text: "Ingresa el nombre o ruta de la imagen.",
    };
  }

  const precio = Number(productForm.precio);
  const cantidadDisponible = Number(productForm.cantidadDisponible);
  const cantidadMinima = Number(productForm.cantidadMinima);

  if (Number.isNaN(precio) || precio < 0) {
    return {
      title: "Precio invalido",
      text: "Ingresa un precio valido.",
    };
  }

  if (Number.isNaN(cantidadDisponible) || cantidadDisponible < 0) {
    return {
      title: "Cantidad disponible invalida",
      text: "Ingresa una cantidad disponible valida.",
    };
  }

  if (Number.isNaN(cantidadMinima) || cantidadMinima < 0) {
    return {
      title: "Cantidad minima invalida",
      text: "Ingresa una cantidad minima valida.",
    };
  }

  return null;
}

export function buildProductRequestPayload(productForm, modalMode) {
  const payload = {
    nombre: productForm.nombre.trim(),
    descripcion: productForm.descripcion.trim(),
    precio: Number(productForm.precio),
    imagen: productForm.imagen.trim(),
    idCategoria: Number(productForm.idCategoria),
    cantidadDisponible: Number(productForm.cantidadDisponible),
    cantidadMinima: Number(productForm.cantidadMinima),
    estado: "Activo",
  };

  if (modalMode === "edit") {
    payload.idProducto = Number(productForm.idProducto);
  }

  return payload;
}

export function getFeaturedCatalogProducts(products, limit = 6) {
  return (Array.isArray(products) ? products : [])
    .filter((product) => getCatalogProductStock(product) > 0)
    .slice(0, limit);
}
