import "./AdminDashboard.css";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { BarChart, DonutChart, HorizontalBars } from "../../components/AdminChart/AdminChart";
import { getDashboardMetrics, getTopProducts } from "../../services/statisticsService";

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMonthLabel(periodo) {
  if (!periodo) {
    return "";
  }

  const [anio, mes] = periodo.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);

  return fecha.toLocaleDateString("es-CR", { month: "short", year: "2-digit" });
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [metricsResponse, productsResponse] = await Promise.all([
        getDashboardMetrics(),
        getTopProducts(5),
      ]);

      setMetrics(metricsResponse);
      setTopProducts(Array.isArray(productsResponse) ? productsResponse : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los indicadores del panel.");
      setMetrics(null);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const ventasMensuales = (metrics?.ventasMensuales || []).map((venta) => ({
    label: formatMonthLabel(venta.periodo),
    value: venta.ingresos,
  }));

  const productosDestacados = topProducts.map((producto) => ({
    label: producto.nombreProducto,
    value: producto.cantidadVendida,
  }));

  return (
    <AdminLayout title="Panel principal"
      subtitle="Resumen del negocio: ventas, inventario y productos destacados.">
      <div className="admin-dashboard">
        {error && <div className="admin-products-error">{error}</div>}

        {loading && <div className="admin-products-empty">Cargando indicadores...</div>}

        {!loading && !error && metrics && (
          <>
            <div className="admin-dashboard-cards">
              <article className="dashboard-card">
                <span>Ventas del mes</span>
                <p>{formatCurrency(metrics.ventasMes)}</p>
                <small>Pedidos facturados este mes</small>
              </article>

              <article className="dashboard-card">
                <span>Pedidos pendientes</span>
                <p>{metrics.pedidosPendientes}</p>
                <small>Esperando preparacion</small>
              </article>

              <article className="dashboard-card">
                <span>Cotizaciones activas</span>
                <p>{metrics.cotizacionesPendientes}</p>
                <small>Requieren seguimiento</small>
              </article>

              <article className="dashboard-card">
                <span>Productos con bajo stock</span>
                <p>{metrics.productosBajoStock}</p>
                <small>De {metrics.productosActivos} productos activos</small>
              </article>
            </div>

            <div className="admin-dashboard-grid">
              <section className="admin-dashboard-section">
                <header>
                  <h2>Ingresos por mes</h2>
                  <p>Ventas facturadas en los últimos meses.</p>
                </header>
                <BarChart
                  data={ventasMensuales}
                  valueFormatter={formatCurrency}
                  emptyMessage="Todavía no hay ventas registradas."
                  ariaLabel="Ingresos por mes"
                />
              </section>

              <section className="admin-dashboard-section">
                <header>
                  <h2>Inventario saludable</h2>
                  <p>Productos activos con stock por encima del mínimo.</p>
                </header>
                <DonutChart
                  percentage={metrics.porcentajeInventarioSaludable}
                  label="con stock"
                  caption={`${metrics.productosBajoStock} producto(s) requieren reabastecimiento.`}
                />
              </section>
            </div>

            <section className="admin-dashboard-section">
              <header>
                <h2>Productos más vendidos</h2>
                <p>Ranking histórico por unidades vendidas.</p>
              </header>
              <HorizontalBars
                data={productosDestacados}
                emptyMessage="Aún no hay productos vendidos."
                totalLabel="Unidades vendidas"
              />
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
