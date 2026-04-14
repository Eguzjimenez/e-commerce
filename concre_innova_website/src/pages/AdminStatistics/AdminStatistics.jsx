import "./AdminStatistics.css";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminStatistics() {
  const monthlySales = [
    { mes: "Enero", valor: 60 },
    { mes: "Febrero", valor: 75 },
    { mes: "Marzo", valor: 90 },
    { mes: "Abril", valor: 68 },
    { mes: "Mayo", valor: 95 }
  ];

  const topProducts = [
    { nombre: "Macetero negro", porcentaje: 82 },
    { nombre: "Palma interior", porcentaje: 74 },
    { nombre: "Fuente decorativa", porcentaje: 61 }
  ];

  const topCategories = [
    { nombre: "Maceteros", porcentaje: 88 },
    { nombre: "Plantas", porcentaje: 79 },
    { nombre: "Accesorios", porcentaje: 54 }
  ];

  const frequentClients = [
    "María López",
    "Carlos Herrera",
    "Ana Rodríguez",
    "Luis Méndez"
  ];

  return (
    <AdminLayout title="Estadísticas del Negocio">
      <div className="admin-statistics-page">
        <div className="admin-statistics-summary">
          <div className="statistics-summary-card">
            <h3>Ventas mensuales</h3>
            <p>+18%</p>
            <span>Comparado con el mes anterior</span>
          </div>

          <div className="statistics-summary-card">
            <h3>Producto destacado</h3>
            <p>Macetero negro</p>
            <span>Mayor volumen de ventas</span>
          </div>

          <div className="statistics-summary-card">
            <h3>Clientes frecuentes</h3>
            <p>24</p>
            <span>Clientes con compras repetidas</span>
          </div>
        </div>

        <div className="statistics-grid">
          <div className="statistics-card">
            <h2>Ventas por mes</h2>
            <div className="statistics-bars">
              {monthlySales.map((item) => (
                <div className="statistics-bar-row" key={item.mes}>
                  <span>{item.mes}</span>
                  <div className="statistics-bar-track">
                    <div
                      className="statistics-bar-fill"
                      style={{ width: `${item.valor}%` }}
                    ></div>
                  </div>
                  <strong>{item.valor}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="statistics-card">
            <h2>Productos más vendidos</h2>
            <div className="statistics-bars">
              {topProducts.map((item) => (
                <div className="statistics-bar-row" key={item.nombre}>
                  <span>{item.nombre}</span>
                  <div className="statistics-bar-track">
                    <div
                      className="statistics-bar-fill"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                  <strong>{item.porcentaje}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="statistics-card">
            <h2>Categorías destacadas</h2>
            <div className="statistics-bars">
              {topCategories.map((item) => (
                <div className="statistics-bar-row" key={item.nombre}>
                  <span>{item.nombre}</span>
                  <div className="statistics-bar-track">
                    <div
                      className="statistics-bar-fill"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                  <strong>{item.porcentaje}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="statistics-card">
            <h2>Clientes frecuentes</h2>
            <ul className="statistics-client-list">
              {frequentClients.map((client) => (
                <li key={client}>{client}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminStatistics;