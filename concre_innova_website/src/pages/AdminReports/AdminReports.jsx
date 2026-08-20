import "./AdminReports.css";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { AreaChart, BarChart, HorizontalBars } from "../../components/AdminChart/AdminChart";
import { getCatalogCategories } from "../../services/catalogService";
import { normalizeCatalogCategories } from "../../services/catalogPresentationService";
import { getFrequentClients } from "../../services/statisticsService";
import {
  buildReportCsv,
  downloadFile,
  getBestSellingProducts,
  getPeriodComparison,
  getSalesReport,
} from "../../services/reportService";

const TOP_PRODUCTOS = 8;

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);

  return { desde: toInputDate(desde), hasta: toInputDate(hasta) };
}

function previousRange(desde, hasta) {
  const inicio = new Date(desde);
  const fin = new Date(hasta);
  const dias = Math.max(Math.round((fin - inicio) / 86400000) + 1, 1);

  const finAnterior = new Date(inicio);
  finAnterior.setDate(finAnterior.getDate() - 1);

  const inicioAnterior = new Date(finAnterior);
  inicioAnterior.setDate(inicioAnterior.getDate() - (dias - 1));

  return { desde: toInputDate(inicioAnterior), hasta: toInputDate(finAnterior) };
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
  });
}

function buildReportHtml({ rango, totales, items, productos }) {
  const filas = items
    .map(
      (item) => `<tr>
        <td>${new Date(item.fecha).toLocaleDateString("es-CR")}</td>
        <td>${item.producto}</td>
        <td>${item.categoria}</td>
        <td>${item.unidades}</td>
        <td>${item.pedidos}</td>
        <td>${formatCurrency(item.ingresos)}</td>
      </tr>`
    )
    .join("");

  const ranking = productos
    .map(
      (producto, index) => `<tr>
        <td>${index + 1}</td>
        <td>${producto.producto}</td>
        <td>${producto.categoria}</td>
        <td>${producto.unidadesVendidas}</td>
        <td>${formatCurrency(producto.ingresos)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte de ventas Concre Innova</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #23301f; padding: 32px; }
  h1 { margin: 0 0 4px; }
  .muted { color: #5f5749; margin: 0 0 24px; }
  .cards { display: flex; gap: 16px; margin-bottom: 28px; }
  .card { border: 1px solid #ded6c7; border-radius: 10px; padding: 14px 18px; }
  .card span { display: block; color: #5f5749; font-size: 12px; }
  .card strong { font-size: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  th, td { border-bottom: 1px solid #ded6c7; padding: 8px; text-align: left; font-size: 13px; }
  th { background: #f5f0e6; }
</style>
</head>
<body>
  <h1>Reporte de ventas</h1>
  <p class="muted">Periodo del ${rango.desde} al ${rango.hasta} - Concre Innova</p>

  <div class="cards">
    <div class="card"><span>Ingresos totales</span><strong>${formatCurrency(totales.ingresosTotales)}</strong></div>
    <div class="card"><span>Pedidos</span><strong>${totales.pedidosTotales}</strong></div>
    <div class="card"><span>Unidades</span><strong>${totales.unidadesTotales}</strong></div>
    <div class="card"><span>Ticket promedio</span><strong>${formatCurrency(totales.ticketPromedio)}</strong></div>
  </div>

  <h2>Detalle de ventas</h2>
  <table>
    <thead>
      <tr><th>Fecha</th><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Pedidos</th><th>Ingresos</th></tr>
    </thead>
    <tbody>${filas || '<tr><td colspan="6">Sin movimientos en el periodo.</td></tr>'}</tbody>
  </table>

  <h2>Productos más vendidos</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Ingresos</th></tr>
    </thead>
    <tbody>${ranking || '<tr><td colspan="5">Sin datos en el periodo.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

function AdminReports() {
  const initialRange = defaultRange();

  const [fechaDesde, setFechaDesde] = useState(initialRange.desde);
  const [fechaHasta, setFechaHasta] = useState(initialRange.hasta);
  const [idCategoria, setIdCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);

  const [reporte, setReporte] = useState(null);
  const [productos, setProductos] = useState([]);
  const [clientesFrecuentes, setClientesFrecuentes] = useState([]);
  const [comparativo, setComparativo] = useState(null);
  const [mostrarComparativo, setMostrarComparativo] = useState(false);

  const comparacionInicial = previousRange(initialRange.desde, initialRange.hasta);
  const [comparaDesde, setComparaDesde] = useState(comparacionInicial.desde);
  const [comparaHasta, setComparaHasta] = useState(comparacionInicial.hasta);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comparando, setComparando] = useState(false);

  useEffect(() => {
    loadCategories();
    loadReport(initialRange.desde, initialRange.hasta, "");
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCatalogCategories();
      setCategorias(normalizeCatalogCategories(response));
    } catch {
      setCategorias([]);
    }
  };

  const loadReport = async (desde, hasta, categoria) => {
    setLoading(true);
    setError("");

    try {
      const [reporteResponse, productosResponse, clientesResponse] = await Promise.all([
        getSalesReport({ fechaDesde: desde, fechaHasta: hasta, idCategoria: categoria }),
        getBestSellingProducts({ fechaDesde: desde, fechaHasta: hasta, top: TOP_PRODUCTOS }),
        getFrequentClients(8),
      ]);

      setReporte(reporteResponse);
      setProductos(Array.isArray(productosResponse) ? productosResponse : []);
      setClientesFrecuentes(Array.isArray(clientesResponse) ? clientesResponse : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo generar el reporte de ventas.");
      setReporte(null);
      setProductos([]);
      setClientesFrecuentes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (event) => {
    event.preventDefault();
    loadReport(fechaDesde, fechaHasta, idCategoria);
  };

  const handleCompare = async () => {
    setComparando(true);

    try {
      const response = await getPeriodComparison({
        periodoADesde: comparaDesde,
        periodoAHasta: comparaHasta,
        periodoBDesde: fechaDesde,
        periodoBHasta: fechaHasta,
      });

      setComparativo(response);
      setMostrarComparativo(true);
    } catch (compareError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo comparar",
        text: compareError.message || "Revisa las fechas seleccionadas.",
      });
    } finally {
      setComparando(false);
    }
  };

  const handleExportCsv = () => {
    if (!reporte || reporte.items.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Nada que exportar",
        text: "El periodo seleccionado no tiene movimientos.",
      });
      return;
    }

    const csv = buildReportCsv(reporte.items);
    downloadFile(csv, `reporte-ventas-${fechaDesde}-${fechaHasta}.csv`, "text/csv;charset=utf-8");
  };

  const handleExportHtml = () => {
    if (!reporte) {
      return;
    }

    const html = buildReportHtml({
      rango: { desde: fechaDesde, hasta: fechaHasta },
      totales: reporte.totales,
      items: reporte.items,
      productos,
    });

    downloadFile(
      html,
      `reporte-ventas-${fechaDesde}-${fechaHasta}.html`,
      "text/html;charset=utf-8"
    );
  };

  const serieDiaria = useMemo(() => {
    if (!reporte) {
      return [];
    }

    return reporte.serieDiaria.map((punto) => ({
      label: formatShortDate(punto.fecha),
      value: punto.ingresos,
    }));
  }, [reporte]);

  const ventasPorCategoria = useMemo(() => {
    if (!reporte) {
      return [];
    }

    const acumulado = new Map();
    reporte.items.forEach((item) => {
      acumulado.set(item.categoria, (acumulado.get(item.categoria) || 0) + item.ingresos);
    });

    return Array.from(acumulado.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [reporte]);

  const rankingProductos = useMemo(
    () =>
      productos.map((producto) => ({
        label: producto.producto,
        value: producto.unidadesVendidas,
      })),
    [productos]
  );

  const totales = reporte?.totales;

  return (
    <AdminLayout title="Reportes de Ventas">
      <div className="admin-reports-page">
        <form className="admin-reports-toolbar" onSubmit={handleGenerate}>
          <div className="admin-reports-field">
            <label htmlFor="reporte-desde">Desde</label>
            <input
              id="reporte-desde"
              type="date"
              value={fechaDesde}
              max={fechaHasta}
              onChange={(event) => setFechaDesde(event.target.value)}
            />
          </div>

          <div className="admin-reports-field">
            <label htmlFor="reporte-hasta">Hasta</label>
            <input
              id="reporte-hasta"
              type="date"
              value={fechaHasta}
              min={fechaDesde}
              onChange={(event) => setFechaHasta(event.target.value)}
            />
          </div>

          <div className="admin-reports-field">
            <label htmlFor="reporte-categoria">Categoría</label>
            <select
              id="reporte-categoria"
              value={idCategoria}
              onChange={(event) => setIdCategoria(event.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-reports-toolbar-actions">
            <button type="submit" className="admin-primary-button" disabled={loading}>
              {loading ? "Generando..." : "Generar reporte"}
            </button>
            <button type="button" className="admin-ghost-button" onClick={handleExportCsv}>
              Exportar CSV
            </button>
            <button type="button" className="admin-ghost-button" onClick={handleExportHtml}>
              Exportar reporte
            </button>
          </div>
        </form>

        {error && <div className="admin-products-error">{error}</div>}

        {loading && <div className="admin-products-empty">Generando reporte...</div>}

        {!loading && !error && totales && (
          <>
            <div className="admin-reports-summary">
              <article className="report-summary-card">
                <span>Ingresos totales</span>
                <strong>{formatCurrency(totales.ingresosTotales)}</strong>
                <small>Periodo seleccionado</small>
              </article>

              <article className="report-summary-card">
                <span>Pedidos</span>
                <strong>{totales.pedidosTotales}</strong>
                <small>Pedidos facturados</small>
              </article>

              <article className="report-summary-card">
                <span>Unidades vendidas</span>
                <strong>{totales.unidadesTotales}</strong>
                <small>Productos despachados</small>
              </article>

              <article className="report-summary-card">
                <span>Ticket promedio</span>
                <strong>{formatCurrency(totales.ticketPromedio)}</strong>
                <small>Por pedido</small>
              </article>
            </div>

            <section className="admin-reports-card">
              <header>
                <h2>Ingresos por dia</h2>
                <p>Evolucion de las ventas dentro del periodo seleccionado.</p>
              </header>
              <AreaChart
                data={serieDiaria}
                valueFormatter={formatCurrency}
                emptyMessage="No hay ventas registradas en este periodo."
              />
            </section>

            <div className="admin-reports-grid">
              <section className="admin-reports-card">
                <header>
                  <h2>Productos mas vendidos</h2>
                  <p>Ranking por unidades vendidas en el periodo.</p>
                </header>
                <HorizontalBars
                  data={rankingProductos}
                  emptyMessage="Aun no hay productos vendidos en este periodo."
                />
              </section>

              <section className="admin-reports-card">
                <header>
                  <h2>Ingresos por categoría</h2>
                  <p>Participacion de cada linea de productos.</p>
                </header>
                <BarChart
                  data={ventasPorCategoria}
                  valueFormatter={formatCurrency}
                  emptyMessage="Sin ingresos por categoria en este periodo."
                />
              </section>
            </div>

            <section className="admin-reports-card">
              <header className="admin-reports-card-header">
                <div>
                  <h2>Comparar con otro periodo</h2>
                  <p>Mide el crecimiento frente a un rango anterior.</p>
                </div>
              </header>

              <div className="admin-reports-compare-form">
                <div className="admin-reports-field">
                  <label htmlFor="compara-desde">Periodo anterior desde</label>
                  <input
                    id="compara-desde"
                    type="date"
                    value={comparaDesde}
                    max={comparaHasta}
                    onChange={(event) => setComparaDesde(event.target.value)}
                  />
                </div>

                <div className="admin-reports-field">
                  <label htmlFor="compara-hasta">Periodo anterior hasta</label>
                  <input
                    id="compara-hasta"
                    type="date"
                    value={comparaHasta}
                    min={comparaDesde}
                    onChange={(event) => setComparaHasta(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={handleCompare}
                  disabled={comparando}
                >
                  {comparando ? "Comparando..." : "Comparar periodos"}
                </button>
              </div>

              {mostrarComparativo && comparativo && (
                <div className="admin-reports-compare-result">
                  <div className="admin-reports-compare-columns">
                    <div>
                      <span>Periodo anterior</span>
                      <strong>{formatCurrency(comparativo.periodoA.ingresos)}</strong>
                      <small>{comparativo.periodoA.pedidos} pedidos</small>
                    </div>

                    <div>
                      <span>Periodo actual</span>
                      <strong>{formatCurrency(comparativo.periodoB.ingresos)}</strong>
                      <small>{comparativo.periodoB.pedidos} pedidos</small>
                    </div>

                    <div
                      className={
                        Number(comparativo.variacionIngresosPorcentaje) >= 0
                          ? "admin-reports-variation positive"
                          : "admin-reports-variation negative"
                      }
                    >
                      <span>Variación de ingresos</span>
                      <strong>
                        {Number(comparativo.variacionIngresosPorcentaje) >= 0 ? "+" : ""}
                        {Number(comparativo.variacionIngresosPorcentaje).toFixed(1)}%
                      </strong>
                      <small>
                        {Number(comparativo.variacionPedidosPorcentaje) >= 0 ? "+" : ""}
                        {Number(comparativo.variacionPedidosPorcentaje).toFixed(1)}% en pedidos
                      </small>
                    </div>
                  </div>

                  <BarChart
                    data={[
                      { label: "Periodo anterior", value: comparativo.periodoA.ingresos },
                      { label: "Periodo actual", value: comparativo.periodoB.ingresos },
                    ]}
                    valueFormatter={formatCurrency}
                  />
                </div>
              )}
            </section>

            <section className="admin-reports-card">
              <header className="admin-reports-card-header">
                <div>
                  <h2>Clientes frecuentes</h2>
                  <p>Clientes con más de un pedido, ordenados por recurrencia.</p>
                </div>
              </header>

              <div className="admin-table-wrapper">
                <table className="admin-reports-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th>Pedidos</th>
                      <th>Total comprado</th>
                      <th>Ticket promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFrecuentes.map((cliente, index) => (
                      <tr key={cliente.idCliente}>
                        <td>{index + 1}</td>
                        <td>{cliente.nombreCliente}</td>
                        <td>{cliente.cantidadPedidos}</td>
                        <td>{formatCurrency(cliente.totalComprado)}</td>
                        <td>
                          {formatCurrency(
                            Number(cliente.totalComprado || 0) /
                              Math.max(Number(cliente.cantidadPedidos) || 1, 1)
                          )}
                        </td>
                      </tr>
                    ))}

                    {clientesFrecuentes.length === 0 && (
                      <tr>
                        <td colSpan="5" className="admin-empty-row">
                          Todavia no hay clientes con compras repetidas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-reports-card">
              <header>
                <h2>Detalle del periodo</h2>
                <p>{reporte.items.length} registros encontrados.</p>
              </header>

              <div className="admin-table-wrapper">
                <table className="admin-reports-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Unidades</th>
                      <th>Pedidos</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.items.map((item, index) => (
                      <tr key={`${item.fecha}-${item.producto}-${index}`}>
                        <td>{new Date(item.fecha).toLocaleDateString("es-CR")}</td>
                        <td>{item.producto}</td>
                        <td>{item.categoria}</td>
                        <td>{item.unidades}</td>
                        <td>{item.pedidos}</td>
                        <td>{formatCurrency(item.ingresos)}</td>
                      </tr>
                    ))}

                    {reporte.items.length === 0 && (
                      <tr>
                        <td colSpan="6" className="admin-empty-row">
                          No hubo ventas en el periodo seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminReports;
