import { request } from "./apiClient";
import { buildApiFileUrl } from "./apiClient";

export const INVOICE_PAGE_SIZE = 10;

/** Estados derivados que devuelve el API para el cobro de una factura. */
export const INVOICE_STATUS = {
  PAID: "pagada",
  PENDING: "pendiente",
  OVERDUE: "vencida",
  REVIEW: "revision",
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.PAID]: "Pagada",
  [INVOICE_STATUS.PENDING]: "Pendiente",
  [INVOICE_STATUS.OVERDUE]: "Vencida",
  [INVOICE_STATUS.REVIEW]: "En revisión",
};

export const INVOICE_STATUS_FILTERS = [
  { value: "", label: "Todos los estados" },
  { value: INVOICE_STATUS.OVERDUE, label: "Vencidas" },
  { value: INVOICE_STATUS.REVIEW, label: "En revisión" },
  { value: INVOICE_STATUS.PENDING, label: "Pendientes" },
  { value: INVOICE_STATUS.PAID, label: "Pagadas" },
];

/** Estados de cobro que el administrador puede asignar. */
export const INVOICE_PAYMENT_STATES = [
  { value: "Pagada", label: "Marcar como pagada" },
  { value: "En verificacion", label: "Poner en revisión" },
  { value: "Pendiente", label: "Devolver a pendiente" },
  { value: "Anulada", label: "Anular factura" },
];

export function getInvoiceStatusLabel(estado) {
  return INVOICE_STATUS_LABELS[estado] || "Sin estado";
}

export function getInvoiceReceiptUrl(archivo) {
  return archivo ? buildApiFileUrl(archivo) : "";
}

export async function getInvoices({
  searchTerm = "",
  status = "",
  from = "",
  to = "",
  page = 1,
  pageSize = INVOICE_PAGE_SIZE,
} = {}) {
  const params = new URLSearchParams();

  if (String(searchTerm).trim()) params.set("busqueda", String(searchTerm).trim());
  if (status) params.set("estado", status);
  if (from) params.set("desde", from);
  if (to) params.set("hasta", to);

  params.set("pagina", String(page));
  params.set("tamanoPagina", String(pageSize));

  const response = await request(`/api/Facturas?${params.toString()}`, { method: "GET" });

  return {
    items: Array.isArray(response?.items) ? response.items : [],
    totalItems: Number(response?.totalItems) || 0,
    pageNumber: Number(response?.pageNumber) || page,
    pageSize: Number(response?.pageSize) || pageSize,
    totalPages: Number(response?.totalPages) || 0,
    hasPreviousPage: Boolean(response?.hasPreviousPage),
    hasNextPage: Boolean(response?.hasNextPage),
    resumen: response?.resumen || {},
  };
}

export async function getInvoiceDetail(idVenta) {
  return await request(`/api/Facturas/${Number(idVenta)}`, { method: "GET" });
}

export async function updateInvoiceStatus(idVenta, { estadoPago, observaciones }) {
  return await request(`/api/Facturas/${Number(idVenta)}/estado`, {
    method: "PUT",
    body: {
      idVenta: Number(idVenta),
      estadoPago,
      observaciones: String(observaciones || "").trim() || null,
    },
  });
}
