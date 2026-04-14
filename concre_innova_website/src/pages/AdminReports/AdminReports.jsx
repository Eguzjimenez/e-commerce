import "./AdminReports.css";
import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminReports() {
  const reportData = [
    {
      id: 1,
      fecha: "2026-04-01",
      producto: "Macetero negro",
      categoria: "Maceteros",
      pedidos: 12,
      ingresos: 299.88
    },
    {
      id: 2,
      fecha: "2026-04-03",
      producto: "Palma interior",
      categoria: "Plantas",
      pedidos: 8,
      ingresos: 284.0
    },
    {
      id: 3,
      fecha: "2026-04-05",
      producto: "Fuente decorativa",
      categoria: "Fuentes",
      pedidos: 4,
      ingresos: 359.96
    },
    {
      id: 4,
      fecha: "2026-04-08",
      producto: "Set de piedras",
      categoria: "Accesorios",
      pedidos: 15,
      ingresos: 180.0
    },
    {
      id: 5,
      fecha: "2026-04-10",
      producto: "Macetero colgante",
      categoria: "Maceteros",
      pedidos: 9,
      ingresos: 179.91
    },
    {
      id: 6,
      fecha: "2026-04-12",
      producto: "Suculenta mini",
      categoria: "Plantas",
      pedidos: 20,
      ingresos: 199.8
    }
  ];

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  const categories = [
    "Todas",
    ...new Set(reportData.map((item) => item.categoria))
  ];

  const reportesFiltrados = useMemo(() => {
    return reportData.filter((item) => {
      const coincideCategoria =
        categoriaSeleccionada === "Todas" ||
        item.categoria === categoriaSeleccionada;

      const coincideBusqueda =
        item.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.categoria.toLowerCase().includes(busqueda.toLowerCase());

      return coincideCategoria && coincideBusqueda;
    });
  }, [categoriaSeleccionada, busqueda]);

  const totalIngresos = reportesFiltrados.reduce(
    (acc, item) => acc + item.ingresos,
    0
  );

  const totalPedidos = reportesFiltrados.reduce(
    (acc, item) => acc + item.pedidos,
    0
  );

  const ticketPromedio =
    totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

  return (
    <AdminLayout title="Reportes de Ventas">
      <div className="admin-reports-page">
        <div className="admin-reports-topbar">
          <div className="admin-reports-filters">
            <input
              type="text"
              placeholder="Buscar por producto o categoría"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="admin-reports-search"
            />

            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="admin-reports-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-reports-actions">
            <button className="admin-secondary-button">Exportar PDF</button>
            <button className="admin-primary-button">Exportar Excel</button>
          </div>
        </div>

        <div className="admin-reports-summary">
          <div className="report-summary-card">
            <h3>Ingresos totales</h3>
            <p>${totalIngresos.toFixed(2)}</p>
          </div>

          <div className="report-summary-card">
            <h3>Total de pedidos</h3>
            <p>{totalPedidos}</p>
          </div>

          <div className="report-summary-card">
            <h3>Ticket promedio</h3>
            <p>${ticketPromedio.toFixed(2)}</p>
          </div>
        </div>

        <div className="admin-reports-chart-box">
          <h2>Resumen del período</h2>
          <p>
            Esta sección puede conectarse más adelante con gráficas reales de ventas
            por fecha, ingresos por período y productos más vendidos.
          </p>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-reports-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Pedidos</th>
                <th>Ingresos</th>
              </tr>
            </thead>

            <tbody>
              {reportesFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.fecha}</td>
                  <td>{item.producto}</td>
                  <td>{item.categoria}</td>
                  <td>{item.pedidos}</td>
                  <td>${item.ingresos.toFixed(2)}</td>
                </tr>
              ))}

              {reportesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-empty-row">
                    No se encontraron resultados con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminReports;