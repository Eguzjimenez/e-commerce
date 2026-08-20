import { request } from "./apiClient";
import { normalizePaginatedResponse } from "./paginationService";

export const INVENTORY_PAGE_SIZE = 10;

/** Estados que devuelve el API para las existencias de un producto. */
export const INVENTORY_STATUS = {
  AVAILABLE: "disponible",
  LOW: "bajo",
  OUT: "agotado",
};

export const INVENTORY_STATUS_LABELS = {
  [INVENTORY_STATUS.AVAILABLE]: "Disponible",
  [INVENTORY_STATUS.LOW]: "Stock bajo",
  [INVENTORY_STATUS.OUT]: "Agotado",
};

export const INVENTORY_STATUS_FILTERS = [
  { value: "", label: "Todos los estados" },
  { value: INVENTORY_STATUS.AVAILABLE, label: "Disponible" },
  { value: INVENTORY_STATUS.LOW, label: "Stock bajo" },
  { value: INVENTORY_STATUS.OUT, label: "Agotado" },
];

export function getInventoryStatusLabel(estado) {
  return INVENTORY_STATUS_LABELS[estado] || "Sin datos";
}

export async function getInventory({
  searchTerm = "",
  categoryId,
  status = "",
  page = 1,
  pageSize = INVENTORY_PAGE_SIZE,
  signal,
} = {}) {
  const params = new URLSearchParams();

  if (String(searchTerm).trim()) {
    params.set("busqueda", String(searchTerm).trim());
  }

  if (categoryId) {
    params.set("idCategoria", String(categoryId));
  }

  if (status) {
    params.set("estado", status);
  }

  params.set("pagina", String(page));
  params.set("tamanoPagina", String(pageSize));

  const response = await request(`/api/Inventario?${params.toString()}`, {
    method: "GET",
    signal,
  });

  return normalizePaginatedResponse(response, page, pageSize);
}

export async function getInventoryDetail(idProducto) {
  return await request(`/api/Inventario/${Number(idProducto)}`, {
    method: "GET",
  });
}

export async function updateInventory(idProducto, { cantidadDisponible, cantidadMinima }) {
  return await request(`/api/Inventario/${Number(idProducto)}`, {
    method: "PUT",
    body: {
      idProducto: Number(idProducto),
      cantidadDisponible: Number(cantidadDisponible),
      cantidadMinima: Number(cantidadMinima),
    },
  });
}

/**
 * Valida el ajuste antes de enviarlo. El API repite estas reglas; aqui solo se
 * evita el viaje cuando el dato es claramente incorrecto.
 */
export function getInventoryAdjustmentError({ cantidadDisponible, cantidadMinima }) {
  const disponible = Number(cantidadDisponible);
  const minima = Number(cantidadMinima);

  if (!Number.isInteger(disponible) || !Number.isInteger(minima)) {
    return "Las cantidades deben ser números enteros.";
  }

  if (disponible < 0 || minima < 0) {
    return "Las cantidades no pueden ser negativas.";
  }

  return "";
}
