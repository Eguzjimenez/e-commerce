import IMAGEN from "../img/Maceta-Negra.jpg";
import { getProductImageCandidates } from "./catalogService";

export function normalizeCatalogCategories(categories) {
  return (Array.isArray(categories) ? categories : [])
    .map((category) => ({
      id: String(category.idCategoria ?? category.id ?? ""),
      name: category.nombreCategoria ?? category.nombre ?? "Sin nombre",
    }))
    .filter((category) => category.id);
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

export function handleCatalogImageFallback(event, imageName) {
  const imageElement = event.currentTarget;
  const imageCandidates = getProductImageCandidates(imageName);
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

export function getFeaturedCatalogProducts(products, limit = 6) {
  return (Array.isArray(products) ? products : [])
    .filter((product) => getCatalogProductStock(product) > 0)
    .slice(0, limit);
}
