import { request } from "./apiClient";

function toIsoDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

export async function getSalesReport({
  fechaDesde,
  fechaHasta,
  idCategoria = "",
} = {}) {
  const query = new URLSearchParams();

  if (fechaDesde) {
    query.set("fechaDesde", toIsoDate(fechaDesde));
  }

  if (fechaHasta) {
    query.set("fechaHasta", toIsoDate(fechaHasta));
  }

  if (idCategoria) {
    query.set("idCategoria", idCategoria);
  }

  const queryString = query.toString();
  return request(`/api/Reportes/ventas${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export async function getPeriodComparison({
  periodoADesde,
  periodoAHasta,
  periodoBDesde,
  periodoBHasta,
}) {
  const query = new URLSearchParams({
    periodoADesde: toIsoDate(periodoADesde),
    periodoAHasta: toIsoDate(periodoAHasta),
    periodoBDesde: toIsoDate(periodoBDesde),
    periodoBHasta: toIsoDate(periodoBHasta),
  });

  return request(`/api/Reportes/comparativo?${query.toString()}`, {
    method: "GET",
  });
}

export async function getBestSellingProducts({
  fechaDesde,
  fechaHasta,
  top = 10,
} = {}) {
  const query = new URLSearchParams({ top: String(top) });

  if (fechaDesde) {
    query.set("fechaDesde", toIsoDate(fechaDesde));
  }

  if (fechaHasta) {
    query.set("fechaHasta", toIsoDate(fechaHasta));
  }

  return request(`/api/Reportes/productos-mas-vendidos?${query.toString()}`, {
    method: "GET",
  });
}

export function buildReportCsv(items) {
  const headers = ["Fecha", "Producto", "Categoria", "Unidades", "Pedidos", "Ingresos"];
  const rows = (Array.isArray(items) ? items : []).map((item) => [
    toIsoDate(item.fecha),
    item.producto,
    item.categoria,
    item.unidades,
    item.pedidos,
    Number(item.ingresos).toFixed(2),
  ]);

  const escapeCell = (cell) => {
    const text = String(cell ?? "");
    return text.includes(",") || text.includes('"')
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  };

  return [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

export function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
