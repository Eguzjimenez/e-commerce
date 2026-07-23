import "./AdminStatistics.css";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import {
  getCategoryStatistics,
  getFrequentClients,
  getStatisticsSummary,
  getTopProducts,
} from "../../services/statisticsService";

function AdminStatistics() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [frequentClients, setFrequentClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, productsResponse, categoriesResponse, clientsResponse] =
        await Promise.all([
          getStatisticsSummary(),
          getTopProducts(),
          getCategoryStatistics(),
          getFrequentClients(),
        ]);

      setSummary(summaryResponse);
      setTopProducts(Array.isArray(productsResponse) ? productsResponse : []);
      setTopCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      setFrequentClients(Array.isArray(clientsResponse) ? clientsResponse : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las estadisticas.");
      setSummary(null);
      setTopProducts([]);
      setTopCategories([]);
      setFrequentClients([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Estadísticas del Negocio">
      <div className="admin-statistics-page">
        {error && <div className="admin-products-error">{error}</div>}

        {loading && <div className="admin-products-empty">Cargando estadisticas...</div>}

        {!loading && !error && (
          <>
            <div className="admin-statistics-summary">
              <div className="statistics-summary-card">
                <h3>Ventas del mes</h3>
                <p>${Number(summary?.ventasMesActual || 0).toFixed(2)}</p>
                <span>
                  {Number(summary?.variacionMesAnteriorPorcentaje || 0) >= 0 ? "+" : ""}
                  {Number(summary?.variacionMesAnteriorPorcentaje || 0).toFixed(1)}% comparado con el mes anterior
                </span>
              </div>

              <div className="statistics-summary-card">
                <h3>Producto destacado</h3>
                <p>{summary?.productoDestacado || "Sin datos"}</p>
                <span>Mayor volumen de ventas</span>
              </div>

              <div className="statistics-summary-card">
                <h3>Clientes frecuentes</h3>
                <p>{summary?.clientesFrecuentes || 0}</p>
                <span>Clientes con compras repetidas</span>
              </div>
            </div>

            <div className="statistics-grid">
              <div className="statistics-card">
                <h2>Productos más vendidos</h2>
                <div className="statistics-bars">
                  {topProducts.map((item) => (
                    <div className="statistics-bar-row" key={item.nombreProducto}>
                      <span>{item.nombreProducto}</span>
                      <div className="statistics-bar-track">
                        <div
                          className="statistics-bar-fill"
                          style={{ width: `${Number(item.porcentajeRelativo)}%` }}
                        ></div>
                      </div>
                      <strong>{item.cantidadVendida}</strong>
                    </div>
                  ))}

                  {topProducts.length === 0 && <p>No hay ventas registradas.</p>}
                </div>
              </div>

              <div className="statistics-card">
                <h2>Categorías destacadas</h2>
                <div className="statistics-bars">
                  {topCategories.map((item) => (
                    <div className="statistics-bar-row" key={item.nombreCategoria}>
                      <span>{item.nombreCategoria}</span>
                      <div className="statistics-bar-track">
                        <div
                          className="statistics-bar-fill"
                          style={{ width: `${Number(item.porcentajeDelTotal)}%` }}
                        ></div>
                      </div>
                      <strong>{Number(item.porcentajeDelTotal).toFixed(0)}%</strong>
                    </div>
                  ))}

                  {topCategories.length === 0 && <p>No hay ventas registradas.</p>}
                </div>
              </div>

              <div className="statistics-card">
                <h2>Clientes frecuentes</h2>
                <ul className="statistics-client-list">
                  {frequentClients.map((client) => (
                    <li key={client.idCliente}>
                      {client.nombreCliente} — {client.cantidadPedidos} pedidos (${Number(client.totalComprado).toFixed(2)})
                    </li>
                  ))}

                  {frequentClients.length === 0 && <li>No hay clientes frecuentes todavia.</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminStatistics;
