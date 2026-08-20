import IMAGEN from "../img/Maceta-Negra.jpg";
import { getProductImageCandidates } from "./catalogService";

export const PRODUCT_SORT_OPTIONS = {
  NONE: "",
  PRICE_ASC: "price-asc",
  PRICE_DESC: "price-desc",
};

export const CATALOG_FILTER_OPTIONS = {
  TYPES: [
    { value: "all", label: "Todos" },
    { value: "Macetas", label: "Macetas" },
    { value: "Plantas", label: "Plantas" },
  ],
  // Los valores corresponden a los que realmente existen en el catalogo:
  // ofrecer opciones sin resultados solo produce busquedas vacias.
  SIZES: [
    { value: "all", label: "Todos" },
    { value: "Pequeño", label: "Pequeño" },
    { value: "Mediano", label: "Mediano" },
    { value: "Grande", label: "Grande" },
    { value: "Jumbo", label: "Jumbo" },
  ],
  MATERIALS: [
    { value: "all", label: "Todos" },
    { value: "Concreto", label: "Concreto" },
  ],
  AVAILABILITY: [
    { value: "all", label: "Todas" },
    { value: "disponible", label: "Disponibles" },
    { value: "agotado", label: "Agotados" },
  ],
};

export function normalizeCatalogCategories(categories) {
  return (Array.isArray(categories) ? categories : [])
    .map((category) => ({
      id: String(category.idCategoria ?? category.id ?? ""),
      name: category.nombreCategoria ?? category.nombre ?? "Sin nombre",
      descripcion: category.descripcion ?? "",
      estado: category.estado ?? "Activo",
    }))
    .filter((category) => category.id);
}

export function normalizeCatalogTypes(types) {
  return (Array.isArray(types) ? types : [])
    .map((type) => ({
      id: String(type.idTipo ?? type.id ?? ""),
      name: type.nombreTipo ?? type.nombre ?? "Sin nombre",
      descripcion: type.descripcion ?? "",
      estado: type.estado ?? "Activo",
    }))
    .filter((type) => type.id);
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

export function getCatalogProductAttributeText(product, attributeName) {
  const value = product?.[attributeName];
  return typeof value === "string" && value.trim() ? value.trim() : "No especificado";
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
    tamano: getCatalogProductAttributeText(product, "tamano"),
    material: getCatalogProductAttributeText(product, "material"),
    availability: getCatalogProductAvailabilityText(product),
    stock: getCatalogProductStock(product),
  };
}

export function calculateCatalogPriceBounds(products) {
  const prices = (Array.isArray(products) ? products : [])
    .map((product) => Number(product.precio))
    .filter((price) => !Number.isNaN(price));

  if (prices.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function buildAdminProductViewModel(product, categories) {
  const id = getCatalogProductId(product);
  const categoryId = String(product.idCategoria ?? "");
  const categoryName = getCatalogProductCategoryName(product, categories);
  const stock = getCatalogProductStock(product);
  const imageCandidates = getProductImageCandidates(product.imagen);
  const typeId = product.idTipo != null ? String(product.idTipo) : "";

  return {
    id,
    idProducto: id,
    name: product.nombre ?? "Producto sin nombre",
    nombre: product.nombre ?? "",
    descripcion: product.descripcion ?? "",
    price: Number(product.precio) || 0,
    precio: Number(product.precio) || 0,
    category: categoryName === "Producto" ? "Sin categoría" : categoryName,
    categoryId,
    idCategoria: categoryId,
    typeId,
    idTipo: typeId,
    typeName: product.nombreTipo || "Sin tipo",
    nombreTipo: product.nombreTipo ?? "",
    tamano: getCatalogProductAttributeText(product, "tamano"),
    material: getCatalogProductAttributeText(product, "material"),
    caracteristicas: product.caracteristicas ?? "",
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

export function getCatalogQueryOptions({
  searchTerm = "",
  selectedSortOrder = PRODUCT_SORT_OPTIONS.NONE,
  selectedCategoryId = "all",
  selectedMinPrice,
  selectedMaxPrice,
  selectedAvailability = "all",
  selectedSize = "all",
  selectedMaterial = "all",
  selectedTypeId = "all",
  selectedType = "all",
  priceBounds = { min: 0, max: 0 },
} = {}) {
  const options = {};
  const normalizedSearchTerm = searchTerm.trim();
  const minPrice = Number(selectedMinPrice);
  const maxPrice = Number(selectedMaxPrice);
  const minimumBound = Number(priceBounds.min);
  const maximumBound = Number(priceBounds.max);
  const hasPriceBounds =
    !Number.isNaN(minimumBound) &&
    !Number.isNaN(maximumBound) &&
    maximumBound > minimumBound;

  if (normalizedSearchTerm) {
    options.searchTerm = normalizedSearchTerm;
  }

  if (selectedSortOrder === PRODUCT_SORT_OPTIONS.PRICE_ASC) {
    options.sortBy = "precio";
    options.sortDirection = "asc";
  }

  if (selectedSortOrder === PRODUCT_SORT_OPTIONS.PRICE_DESC) {
    options.sortBy = "precio";
    options.sortDirection = "desc";
  }

  if (selectedCategoryId !== "all") {
    options.categoryId = selectedCategoryId;
  }

  if (!Number.isNaN(minPrice) && (!hasPriceBounds || minPrice > minimumBound)) {
    options.minPrice = minPrice;
  }

  if (!Number.isNaN(maxPrice) && maxPrice > 0 && (!hasPriceBounds || maxPrice < maximumBound)) {
    options.maxPrice = maxPrice;
  }

  if (selectedAvailability !== "all") {
    options.availability = selectedAvailability;
  }

  if (selectedSize !== "all") {
    options.size = selectedSize;
  }

  if (selectedMaterial !== "all") {
    options.material = selectedMaterial;
  }

  if (selectedTypeId !== "all") {
    options.typeId = selectedTypeId;
  }

  if (selectedType !== "all") {
    options.type = selectedType;
  }

  return options;
}

export function filterAndSortCatalogProducts(products) {
  return Array.isArray(products) ? products : [];
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
      title: "Categoría requerida",
      text: "Selecciona una categoría.",
    };
  }

  if (!productForm.imagen.trim()) {
    return {
      title: "Imagen requerida",
      text: "Ingresa el nombre o ruta de la imagen.",
    };
  }

  if (hasInvalidAttributeLength(productForm.tamano)) {
    return {
      title: "Tamaño inválido",
      text: "El tamaño no puede superar 80 caracteres.",
    };
  }

  if (hasInvalidAttributeLength(productForm.material)) {
    return {
      title: "Material inválido",
      text: "El material no puede superar 80 caracteres.",
    };
  }

  if (String(productForm.caracteristicas || "").trim().length > 500) {
    return {
      title: "Características invalidas",
      text: "Las características no pueden superar 500 caracteres.",
    };
  }

  const precio = Number(productForm.precio);
  const cantidadDisponible = Number(productForm.cantidadDisponible);
  const cantidadMinima = Number(productForm.cantidadMinima);

  if (Number.isNaN(precio) || precio <= 0) {
    return {
      title: "Precio inválido",
      text: "Ingresa un precio numerico mayor a cero.",
    };
  }

  if (Number.isNaN(cantidadDisponible) || cantidadDisponible < 0) {
    return {
      title: "Cantidad disponible inválida",
      text: "Ingresa una cantidad disponible válida.",
    };
  }

  if (Number.isNaN(cantidadMinima) || cantidadMinima < 0) {
    return {
      title: "Cantidad mínima inválida",
      text: "Ingresa una cantidad mínima válida.",
    };
  }

  return null;
}

function hasInvalidAttributeLength(value) {
  return typeof value === "string" && value.trim().length > 80;
}

export function buildProductRequestPayload(productForm, modalMode) {
  const payload = {
    nombre: productForm.nombre.trim(),
    descripcion: productForm.descripcion.trim(),
    precio: Number(productForm.precio),
    imagen: productForm.imagen.trim(),
    idCategoria: Number(productForm.idCategoria),
    idTipo: productForm.idTipo ? Number(productForm.idTipo) : null,
    tamano: String(productForm.tamano || "").trim(),
    material: String(productForm.material || "").trim(),
    caracteristicas: String(productForm.caracteristicas || "").trim(),
    cantidadDisponible: Number(productForm.cantidadDisponible),
    cantidadMinima: Number(productForm.cantidadMinima),
    // Al editar se conserva el estado actual para que un borrador no se publique
    // solo por guardar cambios; publicarlo es una accion aparte.
    estado: modalMode === "edit" ? productForm.estado || "Activo" : "Activo",
  };

  if (modalMode === "edit") {
    payload.idProducto = Number(productForm.idProducto);
  }

  return payload;
}

/**
 * Normaliza el nombre igual que el API antes de compararlo: recorta los
 * extremos y colapsa los espacios internos repetidos. Sin esto,
 * "Macetas  Interior" pasaba el control y quedaba junto a "Macetas Interior".
 */
export function normalizarNombreCatalogo(nombre) {
  return String(nombre ?? "").trim().replace(/\s+/g, " ");
}

/**
 * Devuelve la categoria existente que choca con el nombre indicado, o null.
 * Se usa para avisar mientras se escribe, no solo al guardar.
 */
export function findDuplicateCategory(nombre, existingCategories = [], idActual = null) {
  const objetivo = normalizarNombreCatalogo(nombre).toLowerCase();

  if (!objetivo) {
    return null;
  }

  return (
    existingCategories.find(
      (category) =>
        normalizarNombreCatalogo(category?.name).toLowerCase() === objetivo &&
        String(category?.id) !== String(idActual ?? "")
    ) || null
  );
}

export function getCategoryFormValidation(categoryForm, existingCategories = []) {
  const nombre = normalizarNombreCatalogo(categoryForm.nombreCategoria);

  if (!nombre) {
    return {
      title: "Nombre requerido",
      text: "Ingresa el nombre de la categoría.",
    };
  }

  if (nombre.length > 100) {
    return {
      title: "Nombre inválido",
      text: "El nombre de la categoría no puede superar 100 caracteres.",
    };
  }

  const duplicada = findDuplicateCategory(
    nombre,
    existingCategories,
    categoryForm.idCategoria
  );

  if (duplicada) {
    return {
      title: "Categoría duplicada",
      text: `Ya existe la categoría "${duplicada.name}". Usa otro nombre.`,
    };
  }

  if (String(categoryForm.descripcion || "").trim().length > 255) {
    return {
      title: "Descripción inválida",
      text: "La descripción no puede superar 255 caracteres.",
    };
  }

  return null;
}

export function buildCategoryRequestPayload(categoryForm, modalMode) {
  const payload = {
    nombreCategoria: String(categoryForm.nombreCategoria || "").trim(),
    descripcion: String(categoryForm.descripcion || "").trim(),
  };

  if (modalMode === "edit") {
    payload.idCategoria = Number(categoryForm.idCategoria);
    payload.estado = categoryForm.estado || "Activo";
  }

  return payload;
}

export function getTipoProductoFormValidation(tipoForm, existingTypes = []) {
  const nombre = String(tipoForm.nombreTipo || "").trim();

  if (!nombre) {
    return {
      title: "Nombre requerido",
      text: "Ingresa el nombre del tipo de producto.",
    };
  }

  if (nombre.length > 100) {
    return {
      title: "Nombre inválido",
      text: "El nombre del tipo de producto no puede superar 100 caracteres.",
    };
  }

  const isDuplicate = existingTypes.some(
    (type) =>
      String(type.name || "").trim().toLowerCase() === nombre.toLowerCase() &&
      String(type.id) !== String(tipoForm.idTipo || "")
  );

  if (isDuplicate) {
    return {
      title: "Tipo duplicado",
      text: "Ya existe un tipo de producto con ese nombre.",
    };
  }

  if (String(tipoForm.descripcion || "").trim().length > 255) {
    return {
      title: "Descripción inválida",
      text: "La descripción no puede superar 255 caracteres.",
    };
  }

  return null;
}

export function buildTipoProductoRequestPayload(tipoForm, modalMode) {
  const payload = {
    nombreTipo: String(tipoForm.nombreTipo || "").trim(),
    descripcion: String(tipoForm.descripcion || "").trim(),
  };

  if (modalMode === "edit") {
    payload.idTipo = Number(tipoForm.idTipo);
    payload.estado = tipoForm.estado || "Activo";
  }

  return payload;
}

export function getFeaturedCatalogProducts(products, limit = 6) {
  return (Array.isArray(products) ? products : [])
    .filter((product) => getCatalogProductStock(product) > 0)
    .slice(0, limit);
}

/**
 * Resume los atributos reales del producto en una línea corta para la ficha del
 * catálogo. Se omiten los valores sin definir para no mostrar campos vacíos.
 */
export function buildCatalogProductSummary(product) {
  const atributos = [product?.tamano, product?.material]
    .map((valor) => String(valor || "").trim())
    .filter((valor) => valor && valor.toLowerCase() !== "no especificado");

  return [...new Set(atributos)].join(" · ");
}
