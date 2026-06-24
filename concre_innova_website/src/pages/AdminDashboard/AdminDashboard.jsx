import "./AdminDashboard.css";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminDashboard() {
  return (
    <AdminLayout title="Panel Principal">
      <div className="admin-dashboard">
        <div className="admin-dashboard-cards">
          <div className="dashboard-card">
            <span>Ventas del mes</span>
            <p>$4,250</p>
            <small>+12%</small>
          </div>

          <div className="dashboard-card">
            <span>Pedidos pendientes</span>
            <p>12</p>
            <small>+5%</small>
          </div>

          <div className="dashboard-card">
            <span>Cotizaciones pendientes</span>
            <p>5</p>
            <small>+3%</small>
          </div>

          <div className="dashboard-card">
            <span>Productos con bajo stock</span>
            <p>7</p>
            <small>-2%</small>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <div className="admin-dashboard-section dashboard-chart">
            <h2>Resumen general</h2>
            <p>
              Esta seccion mostrara mas adelante graficos, pedidos recientes y alertas del negocio.
            </p>

            <div className="dashboard-bars" aria-hidden="true">
              {[42, 68, 88, 54, 76, 46, 92, 70].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }}></span>
              ))}
            </div>
          </div>

          <div className="admin-dashboard-section dashboard-health">
            <h2>Inventario saludable</h2>
            <div className="dashboard-donut">
              <strong>82%</strong>
            </div>
            <p>Productos disponibles para venta inmediata.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
